// UI and App Controller with High Performance Optimization
const chartContainer = document.getElementById('chart-container');
const overlayCanvas = document.getElementById('trade-overlay');
const overlayCtx = overlayCanvas.getContext('2d');

function resizeOverlay() {
    overlayCanvas.width = chartContainer.clientWidth;
    overlayCanvas.height = chartContainer.clientHeight;
    renderTradeMarkers();
}

const chart = LightweightCharts.createChart(chartContainer, {
    layout: { background: { color: '#131722' }, textColor: '#d1d4dc' },
    grid: { vertLines: { color: '#1e222d' }, horzLines: { color: '#1e222d' } },
    crosshair: { mode: LightweightCharts.CrosshairMode.Normal },
    rightPriceScale: { borderColor: '#2a2e39', autoScale: true },
    timeScale: { borderColor: '#2a2e39', timeVisible: true, secondsVisible: true },
});

let candleSeries = chart.addCandlestickSeries({
    upColor: '#26a69a', downColor: '#ef5350', borderVisible: false,
    wickUpColor: '#26a69a', wickDownColor: '#ef5350',
});

let lineSeries = chart.addLineSeries({ color: '#2962ff', lineWidth: 2, visible: false });

const volumeSeries = chart.addHistogramSeries({
    priceFormat: { type: 'volume' },
    priceScaleId: '',
});
volumeSeries.priceScale().applyOptions({ scaleMargins: { top: 0.82, bottom: 0 } });

// Линии активных уровней фракталов
let fractalPriceLines = [];
function updateFractalLines(fractals) {
    fractalPriceLines.forEach(l => {
        try { candleSeries.removePriceLine(l); } catch (e) {}
    });
    fractalPriceLines = [];

    if (!fractals || !fractals.length) return;
    fractals.forEach((f, idx) => {
        try {
            const line = candleSeries.createPriceLine({
                price: f,
                color: idx === 0 ? '#2962ff' : '#ff9800',
                lineWidth: 1,
                lineStyle: LightweightCharts.LineStyle.Dashed,
                axisLabelVisible: true,
                title: idx === 0 ? 'Open Auction' : `Fractal ${f}`,
            });
            fractalPriceLines.push(line);
        } catch (e) {}
    });
}

// Список сделок для Canvas Overlay
let tradesList = [];

function renderTradeMarkers() {
    overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
    if (!tradesList.length) return;

    const tfSec = engine.isTickMode ? 1 : engine.timeframeSec;
    const barGroups = {};

    tradesList.forEach(t => {
        const barTime = Math.floor(t.time / tfSec) * tfSec;
        const key = `${barTime}_${t.dir}`;

        if (!barGroups[key]) {
            barGroups[key] = {
                barTime: barTime,
                dir: t.dir,
                totalCount: 0,
                priceSum: 0,
            };
        }
        barGroups[key].totalCount++;
        barGroups[key].priceSum += t.price;
    });

    Object.values(barGroups).forEach(g => {
        const x = chart.timeScale().timeToCoordinate(g.barTime);
        const avgPrice = g.priceSum / g.totalCount;
        const y = candleSeries.priceToCoordinate(avgPrice);

        if (x === null || y === null) return;
        if (x < -30 || x > overlayCanvas.width + 30 || y < -30 || y > overlayCanvas.height + 30) return;

        const size = 6;
        const posX = x + 8;

        overlayCtx.fillStyle = g.dir > 0 ? '#26a69a' : '#ef5350';
        overlayCtx.beginPath();
        if (g.dir > 0) { // BUY ▲
            overlayCtx.moveTo(posX, y - size);
            overlayCtx.lineTo(posX + size, y + size);
            overlayCtx.lineTo(posX - size, y + size);
        } else { // SELL ▼
            overlayCtx.moveTo(posX, y + size);
            overlayCtx.lineTo(posX + size, y - size);
            overlayCtx.lineTo(posX - size, y - size);
        }
        overlayCtx.closePath();
        overlayCtx.fill();

        // Суммарное число входов на свече
        overlayCtx.fillStyle = '#ffffff';
        overlayCtx.font = 'bold 11px monospace';
        overlayCtx.textAlign = 'left';
        overlayCtx.textBaseline = 'middle';
        overlayCtx.fillText(g.totalCount, posX + size + 3, y);
    });
}

chart.timeScale().subscribeVisibleLogicalRangeChange(renderTradeMarkers);
chart.timeScale().subscribeVisibleTimeRangeChange(renderTradeMarkers);

const engine = new ReplayerEngine();
const stratReentry = new ReentryStrategy();
const stratTrueFractal = new TrueFractalStrategy();

let activeStrategyName = 'true_fractal';
let openPos = 0;
let entryPrice = 0;
let closedPnL = 0;
let lastPrice = 0;

function updateTradingUI() {
    document.getElementById('current-price').innerText = lastPrice ? lastPrice.toLocaleString('ru-RU') : '-';
    const posQtyEl = document.getElementById('pos-qty');
    const posUnrealEl = document.getElementById('pos-unrealized');
    const posEntryEl = document.getElementById('pos-entry');
    const posClosedEl = document.getElementById('pos-closed');

    if (openPos === 0) {
        posQtyEl.innerText = '0 (FLAT)';
        posQtyEl.style.color = '#d1d4dc';
        posUnrealEl.innerText = '0 пт';
        posUnrealEl.style.color = '#d1d4dc';
        posEntryEl.innerText = '-';
    } else {
        posQtyEl.innerText = openPos > 0 ? `+${openPos} (LONG)` : `${openPos} (SHORT)`;
        posQtyEl.style.color = openPos > 0 ? '#26a69a' : '#ef5350';
        posEntryEl.innerText = entryPrice.toLocaleString('ru-RU');

        const diff = openPos > 0 ? (lastPrice - entryPrice) : (entryPrice - lastPrice);
        posUnrealEl.innerText = (diff >= 0 ? '+' : '') + diff + ' пт';
        posUnrealEl.style.color = diff >= 0 ? '#26a69a' : '#ef5350';
    }

    posClosedEl.innerText = (closedPnL >= 0 ? '+' : '') + closedPnL + ' пт';
    posClosedEl.style.color = closedPnL >= 0 ? '#26a69a' : '#ef5350';

    if (activeStrategyName === 'true_fractal') {
        const frcCount = stratTrueFractal.fractals ? stratTrueFractal.fractals.length : 0;
        const lastFrc = frcCount > 0 ? stratTrueFractal.fractals[frcCount - 1] : '-';
        document.getElementById('tf-cnt-t').innerText = `Фракталов в работе: ${frcCount}`;
        document.getElementById('tf-cnt-v').innerText = `Всего найдено: ${stratTrueFractal.fractalPoints.length}`;
        document.getElementById('tf-start-price').innerText = (lastFrc !== '-' && typeof lastFrc === 'number') ? lastFrc.toLocaleString('ru-RU') : '-';

        const badge = document.getElementById('tf-status-badge');
        if (stratTrueFractal.opn) {
            badge.className = 'strat-badge ' + (stratTrueFractal.realDir > 0 ? 'badge-long' : 'badge-short');
            badge.innerText = stratTrueFractal.realDir > 0 ? 'В РЕАЛЬНОМ ЛОНГЕ' : 'В РЕАЛЬНОМ ШОРТЕ';
        } else if (stratTrueFractal.virt) {
            badge.className = 'strat-badge badge-virt';
            badge.innerText = stratTrueFractal.virtDir > 0 ? 'ВИРТ-ЛОНГ' : 'ВИРТ-ШОРТ';
        } else {
            badge.className = 'strat-badge badge-wait';
            badge.innerText = 'ОЖИДАНИЕ ПРОБОЯ';
        }
    }
}

function addLog(text, className) {
    const logEl = document.getElementById('trade-log');
    const div = document.createElement('div');
    div.className = 'log-item ' + (className || '');
    const timeStr = new Date().toLocaleTimeString('ru-RU');
    div.innerText = `[${timeStr}] ${text}`;
    logEl.prepend(div);
}

function executeTrade(dir, price, isStrategy = false, comment = '') {
    const timeSec = engine.timestamps[engine.currentIndex - 1] || 0;

    if (openPos !== 0) {
        const pnl = openPos > 0 ? (price - entryPrice) : (entryPrice - price);
        closedPnL += pnl;
        addLog(`Закрыт ${openPos > 0 ? 'LONG' : 'SHORT'} по ${price} (PnL: ${pnl >= 0 ? '+' : ''}${pnl} пт) ${comment}`, pnl >= 0 ? 'log-buy' : 'log-sell');
        openPos = 0;
    }

    if (dir !== 0) {
        openPos = dir;
        entryPrice = price;
        addLog(`${isStrategy ? '[РОБОТ] ' : ''}Вход в ${dir > 0 ? 'LONG' : 'SHORT'} по ${price}. ${comment}`, dir > 0 ? 'log-buy' : 'log-sell');

        tradesList.push({
            time: timeSec,
            price: price,
            dir: dir
        });

        renderTradeMarkers();

        if (!isStrategy && activeStrategyName === 'reentry') {
            stratReentry.openPosition(dir, price);
        }
    }
    updateTradingUI();
}

document.getElementById('btn-buy').onclick = () => executeTrade(1, lastPrice);
document.getElementById('btn-sell').onclick = () => executeTrade(-1, lastPrice);
document.getElementById('btn-close').onclick = () => executeTrade(0, lastPrice);

const stratModeSelect = document.getElementById('strat-mode');
const tfPanel = document.getElementById('true-fractal-panel');
const rePanel = document.getElementById('reentry-panel');

stratModeSelect.onchange = () => {
    activeStrategyName = stratModeSelect.value;
    tfPanel.style.display = activeStrategyName === 'true_fractal' ? 'block' : 'none';
    rePanel.style.display = activeStrategyName === 'reentry' ? 'block' : 'none';

    stratTrueFractal.enabled = (activeStrategyName === 'true_fractal');
    stratReentry.enabled = (activeStrategyName === 'reentry');

    addLog(`Выбрана стратегия: ${stratModeSelect.options[stratModeSelect.selectedIndex].text}`, 'log-info');
    resyncStrategy();
};

document.getElementById('tf-op').onchange = (e) => {
    stratTrueFractal.operation = e.target.value;
    resyncStrategy();
};
document.getElementById('tf-sl').onchange = (e) => stratTrueFractal.slOffset = parseFloat(e.target.value) || 75;
document.getElementById('tf-tp').onchange = (e) => stratTrueFractal.tpOffset = parseFloat(e.target.value) || 400;

// Синхронизация стратегии при перемотке
function resyncStrategy() {
    tradesList = [];
    openPos = 0;
    entryPrice = 0;
    closedPnL = 0;
    stratTrueFractal.reset();
    stratReentry.reset();

    const targetIdx = engine.currentIndex;
    if (!targetIdx || targetIdx <= 0) {
        updateFractalLines([]);
        renderTradeMarkers();
        updateTradingUI();
        return;
    }

    // Быстрый прогон стратегии от 0 до targetIdx
    for (let i = 0; i < targetIdx; i++) {
        const tick = {
            time: engine.timestamps[i],
            price: engine.prices[i],
            vol: engine.volumes[i],
            index: i
        };

        if (activeStrategyName === 'true_fractal') {
            stratTrueFractal.onTick(tick, (event) => {
                if (event.action === 'BUY' || event.action === 'SELL') {
                    if (openPos !== 0) {
                        const pnl = openPos > 0 ? (event.price - entryPrice) : (entryPrice - event.price);
                        closedPnL += pnl;
                        openPos = 0;
                    }
                    openPos = event.direction;
                    entryPrice = event.price;
                    tradesList.push({ time: tick.time, price: event.price, dir: event.direction });
                } else if (event.action === 'CLOSE') {
                    if (openPos !== 0) {
                        const pnl = openPos > 0 ? (event.price - entryPrice) : (entryPrice - event.price);
                        closedPnL += pnl;
                        openPos = 0;
                    }
                }
            });
        }
    }

    updateFractalLines(stratTrueFractal.fractals);
    renderTradeMarkers();
    updateTradingUI();
}

engine.onBarUpdateCallback = (bar, vol, isNew) => {
    if (!engine.isTickMode) {
        candleSeries.update(bar);
        volumeSeries.update(vol);
        renderTradeMarkers();
    }
};

engine.onTickCallback = (tick) => {
    lastPrice = tick.price;
    if (engine.isTickMode) {
        lineSeries.update({ time: tick.time, value: tick.price });
        volumeSeries.update({ time: tick.time, value: tick.vol, color: 'rgba(41, 98, 255, 0.4)' });
    }

    if (activeStrategyName === 'true_fractal') {
        stratTrueFractal.onTick(tick, (event) => {
            if (event.action === 'BUY' || event.action === 'SELL') {
                executeTrade(event.direction, event.price, true, event.comment);
            } else if (event.action === 'CLOSE') {
                executeTrade(0, event.price, true, event.comment);
                if (event.isStop) addLog(event.comment, 'log-stop');
                if (event.isTake) addLog(event.comment, 'log-buy');
            } else if (event.action === 'INFO') {
                addLog(event.comment, 'log-info');
            } else if (event.action === 'FRACTAL_FOUND') {
                addLog(event.comment, 'log-info');
                updateFractalLines(stratTrueFractal.fractals);
            }
        });
    }

    if (activeStrategyName === 'reentry') {
        stratReentry.onTick(tick, (order) => {
            if (order.action === 'CLOSE') {
                executeTrade(0, order.price, true, order.comment);
                if (order.isStop) addLog(order.comment, 'log-stop');
                if (order.isTake) addLog(order.comment, 'log-buy');
            } else if (order.action === 'BUY' || order.action === 'SELL') {
                executeTrade(order.direction, order.price, true, order.comment);
                if (order.isReentry) addLog(order.comment, 'log-reentry');
            }
        });
    }

    updateTradingUI();
};

engine.onBatchResetCallback = (bars, vols, isTick) => {
    if (isTick) {
        candleSeries.applyOptions({ visible: false });
        lineSeries.applyOptions({ visible: true });
        lineSeries.setData(bars);
        volumeSeries.setData(vols);
    } else {
        lineSeries.applyOptions({ visible: false });
        candleSeries.applyOptions({ visible: true });
        candleSeries.setData(bars);
        volumeSeries.setData(vols);
    }
    if (bars.length > 0) {
        const last = bars[bars.length - 1];
        lastPrice = isTick ? last.value : last.close;
        updateTradingUI();
    }
    renderTradeMarkers();
};

const timelineSlider = document.getElementById('timeline-slider');
const timelineTime = document.getElementById('timeline-time');
const timelineTicks = document.getElementById('timeline-ticks');
const timelinePct = document.getElementById('timeline-pct');

engine.onProgressCallback = (current, total, timeSec, price) => {
    timelineSlider.value = total ? Math.floor((current / total) * 1000) : 0;
    const pct = total ? ((current / total) * 100).toFixed(1) : 0;
    timelinePct.innerText = pct + '%';
    timelineTicks.innerText = `Тики: ${current.toLocaleString()} / ${total.toLocaleString()}`;

    if (timeSec) {
        const date = new Date(timeSec * 1000);
        timelineTime.innerText = 'Время: ' + date.toTimeString().substr(0, 8);
    }
};

let isSeeking = false;
timelineSlider.oninput = () => {
    isSeeking = true;
    const val = parseInt(timelineSlider.value, 10);
    const targetIdx = Math.floor((val / 1000) * engine.totalTicks);
    engine.seekToIndex(targetIdx);
    resyncStrategy();
};
timelineSlider.onchange = () => { isSeeking = false; };

const playBtn = document.getElementById('play-btn');
function updatePlayBtn() {
    playBtn.innerText = engine.isPlaying ? '⏸' : '▶';
}
playBtn.onclick = () => {
    engine.togglePlay();
    updatePlayBtn();
};

document.getElementById('step-prev-bar').onclick = () => { engine.stepBarBackward(); resyncStrategy(); };
document.getElementById('step-prev-tick').onclick = () => { engine.prevTick(); resyncStrategy(); };
document.getElementById('step-next-tick').onclick = () => { engine.nextTick(); };
document.getElementById('step-next-bar').onclick = () => { engine.stepBarForward(); resyncStrategy(); };

window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'SELECT') {
        e.preventDefault();
        engine.togglePlay();
        updatePlayBtn();
    }
});

document.querySelectorAll('.speed-btn').forEach(btn => {
    btn.onclick = () => {
        document.querySelectorAll('.speed-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const spd = parseInt(btn.dataset.speed, 10);
        engine.speed = spd;
    };
});

document.querySelectorAll('.tf-btn').forEach(btn => {
    btn.onclick = () => {
        document.querySelectorAll('.tf-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        engine.setTimeframe(btn.dataset.tf);
        renderTradeMarkers();
    };
});

const typeBtn = document.getElementById('toggle-chart-type');
typeBtn.onclick = () => {
    if (engine.isTickMode) {
        engine.setTimeframe('3m');
        typeBtn.innerText = 'Тип: Свечи';
    } else {
        engine.setTimeframe('ticks');
        typeBtn.innerText = 'Тип: Тиковая линия';
    }
    renderTradeMarkers();
};

function initEmbeddedData() {
    if (window.EMBEDDED_TICKS_B64) {
        const binaryString = atob(window.EMBEDDED_TICKS_B64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        const count = engine.loadFromArrayBuffer(bytes.buffer);
        document.getElementById('load-status').innerText = `Готово: ${count.toLocaleString()} тиков (MXU6)`;
        engine.seekToIndex(1);
        resyncStrategy();
    }
}
initEmbeddedData();

const fileInput = document.getElementById('file-input');
fileInput.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    document.getElementById('load-status').innerText = `Чтение: ${file.name}...`;

    const reader = new FileReader();
    if (file.name.endsWith('.bin')) {
        reader.onload = (ev) => {
            const count = engine.loadFromArrayBuffer(ev.target.result);
            document.getElementById('load-status').innerText = `Загружено: ${count.toLocaleString()} тиков`;
            engine.seekToIndex(1);
            resyncStrategy();
        };
        reader.readAsArrayBuffer(file);
    } else {
        reader.onload = (ev) => {
            const count = engine.loadFromText(ev.target.result);
            document.getElementById('load-status').innerText = `Загружено: ${count.toLocaleString()} тиков`;
            engine.seekToIndex(1);
            resyncStrategy();
        };
        reader.readAsText(file);
    }
};

document.getElementById('btn-export-bin').onclick = () => {
    const buffer = engine.exportToBin();
    if (!buffer) return alert('Нет данных для экспорта!');
    const blob = new Blob([buffer], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = (document.getElementById('ticker-label').innerText || 'ticks') + '_compact.bin';
    a.click();
    URL.revokeObjectURL(url);
};

window.addEventListener('resize', () => {
    chart.applyOptions({
        width: chartContainer.clientWidth,
        height: chartContainer.clientHeight
    });
    resizeOverlay();
});
chart.applyOptions({
    width: chartContainer.clientWidth,
    height: chartContainer.clientHeight
});
resizeOverlay();