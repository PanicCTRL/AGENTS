const COLOR_VOL_UP = 'rgba(38, 166, 154, 0.38)';
const COLOR_VOL_DOWN = 'rgba(239, 83, 80, 0.38)';
// Replayer Engine: Tick storage, Candle Aggregator and Playback Controller
class ReplayerEngine {
    constructor() {
        this.timestamps = null; // Uint32Array (unix seconds)
        this.prices = null;     // Float64Array
        this.volumes = null;    // Uint32Array
        this.totalTicks = 0;
        this.currentIndex = 0;

        // Таймфрейм в секундах (60 = 1 минута)
        this.timeframeSec = 60;
        this.isTickMode = false;

        // Состояние воспроизведения
        this.isPlaying = false;
        this.speed = 10; // 10x по умолчанию
        this.timerId = null;

        // Текущий формирующийся бар
        this.currentBar = null;
        this.currentVolume = null;

        // Слушатели событий
        this.onTickCallback = null;
        this.onBarUpdateCallback = null;
        this.onBatchResetCallback = null;
        this.onProgressCallback = null;
    }

    // Загрузка из бинарного ArrayBuffer
    loadFromArrayBuffer(buffer) {
        const view = new DataView(buffer);
        // Проверка заголовка TICK
        const magic = String.fromCharCode(view.getUint8(0), view.getUint8(1), view.getUint8(2), view.getUint8(3));
        let offset = 4;
        let count = 0;
        if (magic === 'TICK') {
            count = view.getUint32(offset, true);
            offset += 4;
        } else {
            count = Math.floor(buffer.byteLength / 16);
            offset = 0;
        }

        this.totalTicks = count;
        this.timestamps = new Uint32Array(count);
        this.prices = new Float64Array(count);
        this.volumes = new Uint32Array(count);

        for (let i = 0; i < count; i++) {
            this.timestamps[i] = view.getUint32(offset, true);
            this.prices[i] = view.getFloat64(offset + 4, true);
            this.volumes[i] = view.getUint32(offset + 12, true);
            offset += 16;
        }

        this.currentIndex = 0;
        this.resetBars();
        return this.totalTicks;
    }

    // Парсинг текстового файла (CSV / TXT)
    loadFromText(text) {
        const lines = text.split(/\r?\n/);
        const tempTimes = [];
        const tempPrices = [];
        const tempVols = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line || line.startsWith('<') || line.startsWith('DATE') || line.startsWith('TICKER')) continue;
            const parts = line.split(',');
            if (parts.length < 5) continue;

            // Определяем формат: Finam: TICKER,PER,DATE,TIME,LAST,VOL (parts[2], parts[3], parts[4], parts[5])
            let dStr, tStr, pStr, vStr;
            if (parts.length >= 6 && parts[2].length === 8) {
                dStr = parts[2];
                tStr = parts[3];
                pStr = parts[4];
                vStr = parts[5];
            } else {
                dStr = parts[0];
                tStr = parts[1];
                pStr = parts[2];
                vStr = parts[3] || '1';
            }

            if (!dStr || !tStr || dStr.length < 8 || tStr.length < 6) continue;

            const y = parseInt(dStr.substr(0, 4), 10);
            const m = parseInt(dStr.substr(4, 2), 10) - 1;
            const d = parseInt(dStr.substr(6, 2), 10);

            const hh = parseInt(tStr.substr(0, 2), 10);
            const mm = parseInt(tStr.substr(2, 2), 10);
            const ss = parseInt(tStr.substr(4, 2), 10);

            const unixSec = Math.floor(Date.UTC(y, m, d, hh, mm, ss) / 1000);
            const price = parseFloat(pStr);
            const vol = parseInt(vStr, 10) || 1;

            if (!isNaN(unixSec) && !isNaN(price)) {
                tempTimes.push(unixSec);
                tempPrices.push(price);
                tempVols.push(vol);
            }
        }

        this.totalTicks = tempTimes.length;
        this.timestamps = new Uint32Array(tempTimes);
        this.prices = new Float64Array(tempPrices);
        this.volumes = new Uint32Array(tempVols);
        this.currentIndex = 0;
        this.resetBars();
        return this.totalTicks;
    }

    // Экспорт в ArrayBuffer (.bin)
    exportToBin() {
        if (!this.totalTicks) return null;
        const buffer = new ArrayBuffer(8 + this.totalTicks * 16);
        const view = new DataView(buffer);
        // Magic 'TICK'
        view.setUint8(0, 84); // 'T'
        view.setUint8(1, 73); // 'I'
        view.setUint8(2, 67); // 'C'
        view.setUint8(3, 75); // 'K'
        view.setUint32(4, this.totalTicks, true);

        let offset = 8;
        for (let i = 0; i < this.totalTicks; i++) {
            view.setUint32(offset, this.timestamps[i], true);
            view.setFloat64(offset + 4, this.prices[i], true);
            view.setUint32(offset + 12, this.volumes[i], true);
            offset += 16;
        }
        return buffer;
    }

    // Смена таймфрейма
    setTimeframe(tf) {
        if (tf === 'ticks') {
            this.isTickMode = true;
        } else {
            this.isTickMode = false;
            const tfMap = { '10s': 10, '30s': 30, '1m': 60, '3m': 180, '5m': 300, '15m': 900, '1h': 3600 };
            this.timeframeSec = tfMap[tf] || 60;
        }
        this.rebuildHistoryUpToCurrent();
    }

    // Пересчет истории баров от 0 до currentIndex
    rebuildHistoryUpToCurrent() {
        if (!this.totalTicks || this.currentIndex === 0) {
            if (this.onBatchResetCallback) this.onBatchResetCallback([], []);
            return;
        }

        const bars = [];
        const vols = [];
        let currB = null;
        let currV = null;

        if (this.isTickMode) {
            // Тиковый режим: каждая сделка - точка
            for (let i = 0; i < this.currentIndex; i++) {
                const t = this.timestamps[i];
                // Для тиков в TradingView время должно строго возрастать
                const fakeTime = t + (i % 1000) * 0.001;
                bars.push({ time: t, value: this.prices[i] });
                vols.push({ time: t, value: this.volumes[i], color: 'rgba(41, 98, 255, 0.4)' });
            }
            this.currentBar = null;
            this.currentVolume = null;
            if (this.onBatchResetCallback) this.onBatchResetCallback(bars, vols, true);
            return;
        }

        // Свечной режим с агрегацией
        for (let i = 0; i < this.currentIndex; i++) {
            const time = this.timestamps[i];
            const price = this.prices[i];
            const vol = this.volumes[i];
            const barTime = Math.floor(time / this.timeframeSec) * this.timeframeSec;

            if (!currB || barTime > currB.time) {
                if (currB) {
                    bars.push(currB);
                    vols.push(currV);
                }
                currB = { time: barTime, open: price, high: price, low: price, close: price };
                currV = { time: barTime, value: vol, color: COLOR_VOL_UP };
            } else {
                if (price > currB.high) currB.high = price;
                if (price < currB.low) currB.low = price;
                currB.close = price;
                currV.value += vol;
                currV.color = currB.close >= currB.open ? COLOR_VOL_UP : COLOR_VOL_DOWN;
            }
        }

        if (currB) {
            bars.push(currB);
            vols.push(currV);
        }

        this.currentBar = currB ? { ...currB } : null;
        this.currentVolume = currV ? { ...currV } : null;

        if (this.onBatchResetCallback) {
            this.onBatchResetCallback(bars, vols, false);
        }
    }

    resetBars() {
        this.currentBar = null;
        this.currentVolume = null;
        this.rebuildHistoryUpToCurrent();
    }

    // Воспроизведение одного тика вперед (Candle Morphing)
    nextTick() {
        if (this.currentIndex >= this.totalTicks) {
            this.pause();
            return false;
        }

        const idx = this.currentIndex;
        const time = this.timestamps[idx];
        const price = this.prices[idx];
        const vol = this.volumes[idx];
        this.currentIndex++;

        if (this.isTickMode) {
            if (this.onTickCallback) this.onTickCallback({ time, price, vol, index: idx });
            if (this.onProgressCallback) this.onProgressCallback(this.currentIndex, this.totalTicks, time, price);
            return true;
        }

        const barTime = Math.floor(time / this.timeframeSec) * this.timeframeSec;
        let isNewBar = false;

        if (!this.currentBar || barTime > this.currentBar.time) {
            this.currentBar = { time: barTime, open: price, high: price, low: price, close: price };
            this.currentVolume = { time: barTime, value: vol, color: COLOR_VOL_UP };
            isNewBar = true;
        } else {
            if (price > this.currentBar.high) this.currentBar.high = price;
            if (price < this.currentBar.low) this.currentBar.low = price;
            this.currentBar.close = price;
            this.currentVolume.value += vol;
            this.currentVolume.color = this.currentBar.close >= this.currentBar.open ? COLOR_VOL_UP : COLOR_VOL_DOWN;
        }

        if (this.onBarUpdateCallback) {
            this.onBarUpdateCallback(this.currentBar, this.currentVolume, isNewBar);
        }

        if (this.onTickCallback) {
            this.onTickCallback({ time, price, vol, index: idx });
        }

        if (this.onProgressCallback) {
            this.onProgressCallback(this.currentIndex, this.totalTicks, time, price);
        }

        return true;
    }

    // Шаг назад на 1 тик
    prevTick() {
        if (this.currentIndex <= 0) return;
        this.currentIndex = Math.max(0, this.currentIndex - 1);
        this.rebuildHistoryUpToCurrent();
        if (this.onProgressCallback) {
            this.onProgressCallback(
                this.currentIndex, 
                this.totalTicks, 
                this.timestamps[this.currentIndex] || 0, 
                this.prices[this.currentIndex] || 0
            );
        }
    }

    // Шаг на 1 свечу вперед
    stepBarForward() {
        if (this.currentIndex >= this.totalTicks) return;
        const startBarTime = Math.floor(this.timestamps[this.currentIndex] / this.timeframeSec) * this.timeframeSec;
        while (this.currentIndex < this.totalTicks) {
            const t = this.timestamps[this.currentIndex];
            const bt = Math.floor(t / this.timeframeSec) * this.timeframeSec;
            if (bt > startBarTime) break;
            this.currentIndex++;
        }
        this.rebuildHistoryUpToCurrent();
        if (this.onProgressCallback) {
            this.onProgressCallback(this.currentIndex, this.totalTicks, this.timestamps[this.currentIndex], this.prices[this.currentIndex]);
        }
    }

    // Шаг на 1 свечу назад
    stepBarBackward() {
        if (this.currentIndex <= 0) return;
        const currBarTime = Math.floor(this.timestamps[this.currentIndex - 1] / this.timeframeSec) * this.timeframeSec;
        while (this.currentIndex > 0) {
            const t = this.timestamps[this.currentIndex - 1];
            const bt = Math.floor(t / this.timeframeSec) * this.timeframeSec;
            if (bt < currBarTime) break;
            this.currentIndex--;
        }
        this.rebuildHistoryUpToCurrent();
        if (this.onProgressCallback) {
            this.onProgressCallback(this.currentIndex, this.totalTicks, this.timestamps[this.currentIndex], this.prices[this.currentIndex]);
        }
    }

    // Перемотка на индекс
    seekToIndex(idx) {
        idx = Math.max(0, Math.min(this.totalTicks, idx));
        this.currentIndex = idx;
        this.rebuildHistoryUpToCurrent();
        if (this.onProgressCallback && idx < this.totalTicks) {
            this.onProgressCallback(idx, this.totalTicks, this.timestamps[idx], this.prices[idx]);
        }
    }

    play() {
        if (this.isPlaying) return;
        this.isPlaying = true;

        const loop = () => {
            if (!this.isPlaying) return;

            // Количество тиков за один цикл в зависимости от скорости
            let ticksPerFrame = 1;
            let delay = 16; // 60 FPS

            if (this.speed === 1) {
                delay = 100;
                ticksPerFrame = 1;
            } else if (this.speed <= 10) {
                delay = 20;
                ticksPerFrame = Math.round(this.speed / 2);
            } else if (this.speed <= 100) {
                delay = 16;
                ticksPerFrame = Math.round(this.speed / 5);
            } else if (this.speed <= 500) {
                delay = 10;
                ticksPerFrame = 50;
            } else { // MAX
                delay = 5;
                ticksPerFrame = 250;
            }

            for (let i = 0; i < ticksPerFrame; i++) {
                if (!this.nextTick()) break;
            }

            if (this.isPlaying) {
                this.timerId = setTimeout(loop, delay);
            }
        };

        loop();
    }

    pause() {
        this.isPlaying = false;
        if (this.timerId) {
            clearTimeout(this.timerId);
            this.timerId = null;
        }
    }

    togglePlay() {
        if (this.isPlaying) this.pause();
        else this.play();
    }
}

window.ReplayerEngine = ReplayerEngine;