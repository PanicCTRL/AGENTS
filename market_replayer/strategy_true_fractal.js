// Strategy Module: True Fractal (Real Long on Up Fractal break UP, Virtual Short on Down Fractal break DOWN)
class TrueFractalStrategy {
    constructor() {
        this.enabled = true;
        this.operation = 'B';   // Робот работает ТОЛЬКО В ЛОНГ (реальные сделки)
        this.slOffset = 75;      // Размер стопа в пунктах
        this.tpOffset = 400;     // Размер тейка в пунктах

        this.fractals = [];      // Все активные фракталы для отрисовки линий
        this.upFractals = [];    // Фракталы вверх (High)
        this.downFractals = [];  // Фракталы вниз (Low)
        this.fractalPoints = []; // Массив найденных 5-свечных фракталов: [{ time, price, type: 'UP'|'DOWN' }]

        // Состояние реальной позиции (ТОЛЬКО ЛОНГ)
        this.opn = false;
        this.realDir = 1;        // Всегда 1 (Long)
        this.realEntry = 0;
        this.stopPrice = 0;
        this.takePrice = 0;

        // Состояние виртуальной позиции (ТОЛЬКО ШОРТ)
        this.virt = false;
        this.virtDir = -1;       // Всегда -1 (Short)
        this.virtEntry = 0;
        this.virtStop = 0;
        this.virtTake = 0;

        // Построение 3-минутных баров для детектора 5-свечных фракталов
        this.barPeriodSec = 180; // 3 минуты
        this.completedBars = []; // Завершенные свечи
        this.buildingBar = null;

        this.firstBarFinished = false;
        this.firstTickHandled = false;
        this.prevPrice = 0;
    }

    reset() {
        this.fractals = [];
        this.upFractals = [];
        this.downFractals = [];
        this.fractalPoints = [];

        this.opn = false;
        this.realEntry = 0;
        this.stopPrice = 0;
        this.takePrice = 0;

        this.virt = false;
        this.virtEntry = 0;
        this.virtStop = 0;
        this.virtTake = 0;

        this.completedBars = [];
        this.buildingBar = null;
        this.firstBarFinished = false;
        this.firstTickHandled = false;
        this.prevPrice = 0;
    }

    onTick(tick, onOrderCallback) {
        if (!this.enabled) return;
        const price = tick.price;
        const timeSec = tick.time;

        // =========================================================================
        // 1. СТАРТ ТОРГОВ (07:00:00) - Первая цена дня и мгновенный вход в ЛОНГ
        // =========================================================================
        if (!this.firstTickHandled) {
            this.firstTickHandled = true;
            this.fractals = [price];
            this.upFractals = [price];

            // Открываем первую реальную сделку в ЛОНГ
            this.openReal(price, onOrderCallback, `СТАРТ ДНЯ: Первая сделка в ЛОНГ по цене открытия ${price}`);

            const barTime = Math.floor(timeSec / this.barPeriodSec) * this.barPeriodSec;
            this.buildingBar = { time: barTime, open: price, high: price, low: price, close: price };
            this.prevPrice = price;
            return;
        }

        // =========================================================================
        // 2. Детектор 5-свечных фракталов Билла Вильямса
        // =========================================================================
        const currentBarTime = Math.floor(timeSec / this.barPeriodSec) * this.barPeriodSec;

        if (!this.buildingBar || currentBarTime > this.buildingBar.time) {
            if (this.buildingBar) {
                this.completedBars.push({ ...this.buildingBar });

                // Завершение 1-й 3-минутной свечи
                if (!this.firstBarFinished) {
                    this.firstBarFinished = true;
                    const bar1 = this.completedBars[0];
                    if (!this.upFractals.includes(bar1.high)) this.upFractals.push(bar1.high);
                    if (!this.downFractals.includes(bar1.low)) this.downFractals.push(bar1.low);
                    this.rebuildAllFractals();

                    if (onOrderCallback) {
                        onOrderCallback({
                            action: 'INFO',
                            comment: `1-я свеча (3M): High=${bar1.high} (фрактал вверх), Low=${bar1.low} (фрактал вниз)`
                        });
                    }
                }

                // 5-свечные фракталы
                const len = this.completedBars.length;
                if (len >= 5) {
                    const c = len - 3;
                    const b0 = this.completedBars[c - 2];
                    const b1 = this.completedBars[c - 1];
                    const b2 = this.completedBars[c];
                    const b3 = this.completedBars[c + 1];
                    const b4 = this.completedBars[c + 2];

                    // ФРАКТАЛ ВВЕРХ (High центра выше соседей)
                    if (b2.high > b0.high && b2.high > b1.high && b2.high > b3.high && b2.high > b4.high) {
                        const newF = b2.high;
                        if (!this.upFractals.includes(newF)) {
                            this.upFractals.push(newF);
                            if (this.upFractals.length > 5) this.upFractals.shift();
                            this.rebuildAllFractals();
                        }
                        this.fractalPoints.push({ time: b2.time, price: newF, type: 'UP' });
                        if (onOrderCallback) {
                            onOrderCallback({
                                action: 'FRACTAL_FOUND',
                                fractal: { time: b2.time, price: newF, type: 'UP' },
                                comment: `Найден ФРАКТАЛ ВВЕРХ: ${newF} (триггер в РЕАЛЬНЫЙ ЛОНГ при пробое вверх)`
                            });
                        }
                    }

                    // ФРАКТАЛ ВНИЗ (Low центра ниже соседей)
                    if (b2.low < b0.low && b2.low < b1.low && b2.low < b3.low && b2.low < b4.low) {
                        const newF = b2.low;
                        if (!this.downFractals.includes(newF)) {
                            this.downFractals.push(newF);
                            if (this.downFractals.length > 5) this.downFractals.shift();
                            this.rebuildAllFractals();
                        }
                        this.fractalPoints.push({ time: b2.time, price: newF, type: 'DOWN' });
                        if (onOrderCallback) {
                            onOrderCallback({
                                action: 'FRACTAL_FOUND',
                                fractal: { time: b2.time, price: newF, type: 'DOWN' },
                                comment: `Найден ФРАКТАЛ ВНИЗ: ${newF} (триггер в ВИРТУАЛЬНЫЙ ШОРТ при пробое вниз)`
                            });
                        }
                    }
                }
            }

            this.buildingBar = { time: currentBarTime, open: price, high: price, low: price, close: price };
        } else {
            if (price > this.buildingBar.high) this.buildingBar.high = price;
            if (price < this.buildingBar.low) this.buildingBar.low = price;
            this.buildingBar.close = price;
        }

        // =========================================================================
        // 3. Сопровождение РЕАЛЬНОГО ЛОНГА (Стоп и Тейк)
        // =========================================================================
        if (this.opn) {
            if (price <= this.stopPrice) {
                const pnl = price - this.realEntry;
                this.opn = false;
                if (onOrderCallback) {
                    onOrderCallback({
                        action: 'CLOSE',
                        direction: -1,
                        price: price,
                        pnl: pnl,
                        isStop: true,
                        comment: `Реальный Стоп в лонге (-${Math.abs(pnl)} пт) по ${price}`
                    });
                }
            } else if (price >= this.takePrice) {
                const pnl = price - this.realEntry;
                this.opn = false;
                if (onOrderCallback) {
                    onOrderCallback({
                        action: 'CLOSE',
                        direction: -1,
                        price: price,
                        pnl: pnl,
                        isTake: true,
                        comment: `Реальный Тейк в лонге (+${pnl} пт) по ${price}!`
                    });
                }
            }
        }

        // =========================================================================
        // 4. Сопровождение ВИРТУАЛЬНОГО ШОРТА
        // =========================================================================
        if (this.virt) {
            if (price >= this.virtStop) {
                this.virt = false;
                if (onOrderCallback) onOrderCallback({ action: 'INFO', comment: `Виртуальный шорт закрыт по стопу на ${price}` });
            } else if (price <= this.virtTake) {
                this.virt = false;
                if (onOrderCallback) onOrderCallback({ action: 'INFO', comment: `Виртуальный шорт закрыт по тейку на ${price}` });
            }
        }

        // =========================================================================
        // 5. ВХОДЫ: ТОЛЬКО ЕСЛИ НЕТ ОТКРЫТОЙ РЕАЛЬНОЙ И ВИРТУАЛЬНОЙ ПОЗИЦИИ!
        // - Пробой "ФРАКТАЛА ВВЕРХ" ВВЕРХ ➔ РЕАЛЬНЫЙ ЛОНГ 🟢
        // - Пробой "ФРАКТАЛА ВНИЗ" ВНИЗ  ➔ ВИРТУАЛЬНЫЙ ШОРТ 🟠
        // =========================================================================
        if (!this.opn && !this.virt && this.prevPrice !== 0) {
            // А. Проверяем фракталы вверх на пробой СНИЗУ ВВЕРХ -> РЕАЛЬНЫЙ ЛОНГ
            for (let i = 0; i < this.upFractals.length; i++) {
                const f = this.upFractals[i];
                const crossUp = (this.prevPrice < f && price >= f);

                if (crossUp) {
                    this.openReal(price, onOrderCallback, `Пробой фрактала вверх ${f} ВВЕРХ -> РЕАЛЬНЫЙ ЛОНГ`);
                    break;
                }
            }

            // Б. Проверяем фракталы вниз на пробой СВЕРХУ ВНИЗ -> ВИРТУАЛЬНЫЙ ШОРТ
            if (!this.opn && !this.virt) {
                for (let i = 0; i < this.downFractals.length; i++) {
                    const f = this.downFractals[i];
                    const crossDown = (this.prevPrice > f && price <= f);

                    if (crossDown) {
                        this.openVirtual(price, onOrderCallback, `Пробой фрактала вниз ${f} ВНИЗ -> ВИРТУАЛЬНЫЙ ШОРТ`);
                        break;
                    }
                }
            }
        }

        this.prevPrice = price;
    }

    rebuildAllFractals() {
        this.fractals = [...this.downFractals, ...this.upFractals];
    }

    openReal(price, onOrderCallback, comment) {
        this.opn = true;
        this.realDir = 1;
        this.realEntry = price;
        this.stopPrice = price - this.slOffset;
        this.takePrice = price + this.tpOffset;

        if (onOrderCallback) {
            onOrderCallback({
                action: 'BUY',
                direction: 1,
                price: price,
                stop: this.stopPrice,
                take: this.takePrice,
                comment: comment
            });
        }
    }

    openVirtual(price, onOrderCallback, comment) {
        this.virt = true;
        this.virtDir = -1;
        this.virtEntry = price;
        this.virtStop = price + this.slOffset;
        this.virtTake = price - this.tpOffset;

        if (onOrderCallback) {
            onOrderCallback({
                action: 'INFO',
                comment: `[VIRTUAL SHORT] Вход в вирт-шорт по ${price}. ${comment}`
            });
        }
    }
}

window.TrueFractalStrategy = TrueFractalStrategy;