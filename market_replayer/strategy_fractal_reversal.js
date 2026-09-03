// Strategy Module: Fractal Reversal / Fade (Ложный пробой и возврат от фракталов)
class FractalReversalStrategy {
    constructor() {
        this.enabled = true;
        this.operation = 'BOTH'; // 'B': Только Long, 'S': Только Short, 'BOTH': Long & Short
        this.slOffset = 75;      // Размер стопа в пунктах
        this.tpOffset = 400;     // Размер тейка в пунктах

        this.fractals = [];      // Все активные фракталы для отрисовки линий
        this.upFractals = [];    // Верхние фракталы (вершины)
        this.downFractals = [];  // Нижние фракталы (впадины)
        this.fractalPoints = []; // Массив найденных 5-свечных фракталов

        // Состояние реальной позиции
        this.opn = false;
        this.realDir = 0;        // 1: Long, -1: Short
        this.realEntry = 0;
        this.stopPrice = 0;
        this.takePrice = 0;

        // Состояние виртуальной позиции
        this.virt = false;
        this.virtDir = 0;
        this.virtEntry = 0;
        this.virtStop = 0;
        this.virtTake = 0;

        // Построение 3-минутных баров для детектора 5-свечных фракталов
        this.barPeriodSec = 180;
        this.completedBars = [];
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
        this.realDir = 0;
        this.realEntry = 0;
        this.stopPrice = 0;
        this.takePrice = 0;

        this.virt = false;
        this.virtDir = 0;
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

        // 1. СТАРТ ТОРГОВ (07:00:00)
        if (!this.firstTickHandled) {
            this.firstTickHandled = true;
            this.fractals = [price];
            this.downFractals = [price];

            const initialDir = (this.operation === 'S') ? -1 : 1;
            this.openReal(initialDir, price, onOrderCallback, `СТАРТ: Первая сделка по цене открытия ${price}`);

            const barTime = Math.floor(timeSec / this.barPeriodSec) * this.barPeriodSec;
            this.buildingBar = { time: barTime, open: price, high: price, low: price, close: price };
            this.prevPrice = price;
            return;
        }

        // 2. Детектор 5-свечных фракталов Билла Вильямса
        const currentBarTime = Math.floor(timeSec / this.barPeriodSec) * this.barPeriodSec;

        if (!this.buildingBar || currentBarTime > this.buildingBar.time) {
            if (this.buildingBar) {
                this.completedBars.push({ ...this.buildingBar });

                // Завершение 1-й свечи
                if (!this.firstBarFinished) {
                    this.firstBarFinished = true;
                    const bar1 = this.completedBars[0];
                    if (!this.upFractals.includes(bar1.high)) this.upFractals.push(bar1.high);
                    if (!this.downFractals.includes(bar1.low)) this.downFractals.push(bar1.low);
                    this.rebuildAllFractals();

                    if (onOrderCallback) {
                        onOrderCallback({
                            action: 'INFO',
                            comment: `1-я свеча (3M): High=${bar1.high} (верхний фрактал), Low=${bar1.low} (нижний фрактал)`
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

                    // ВЕРХНИЙ ФРАКТАЛ
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
                                comment: `Найден ВЕРХНИЙ фрактал: ${newF} (триггер в ШОРТ при пробое вниз)`
                            });
                        }
                    }

                    // НИЖНИЙ ФРАКТАЛ
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
                                comment: `Найден НИЖНИЙ фрактал: ${newF} (триггер в ЛОНГ при пробое вверх)`
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

        // 3. Сопровождение РЕАЛЬНОЙ позиции
        if (this.opn) {
            if (this.realDir === 1) { // Лонг
                if (price <= this.stopPrice) {
                    const pnl = price - this.realEntry;
                    this.opn = false;
                    if (onOrderCallback) onOrderCallback({ action: 'CLOSE', direction: -1, price: price, pnl: pnl, isStop: true, comment: `Стоп в лонге (-${Math.abs(pnl)} пт)` });
                } else if (price >= this.takePrice) {
                    const pnl = price - this.realEntry;
                    this.opn = false;
                    if (onOrderCallback) onOrderCallback({ action: 'CLOSE', direction: -1, price: price, pnl: pnl, isTake: true, comment: `Тейк в лонге (+${pnl} пт)!` });
                }
            } else if (this.realDir === -1) { // Шорт
                if (price >= this.stopPrice) {
                    const pnl = this.realEntry - price;
                    this.opn = false;
                    if (onOrderCallback) onOrderCallback({ action: 'CLOSE', direction: 1, price: price, pnl: pnl, isStop: true, comment: `Стоп в шорте (-${Math.abs(pnl)} пт)` });
                } else if (price <= this.takePrice) {
                    const pnl = this.realEntry - price;
                    this.opn = false;
                    if (onOrderCallback) onOrderCallback({ action: 'CLOSE', direction: 1, price: price, pnl: pnl, isTake: true, comment: `Тейк в шорте (+${pnl} пт)!` });
                }
            }
        }

        // 4. Сопровождение ВИРТУАЛЬНОЙ позиции
        if (this.virt) {
            if (this.virtDir === 1) {
                if (price <= this.virtStop || price >= this.virtTake) {
                    this.virt = false;
                    if (onOrderCallback) onOrderCallback({ action: 'INFO', comment: `Закрыта вирт-сделка по ${price}` });
                }
            } else if (this.virtDir === -1) {
                if (price >= this.virtStop || price <= this.virtTake) {
                    this.virt = false;
                    if (onOrderCallback) onOrderCallback({ action: 'INFO', comment: `Закрыта вирт-сделка по ${price}` });
                }
            }
        }

        // =========================================================================
        // ПУНКТ 3: ЛОГИКА ВХОДОВ FRACTAL REVERSAL (ОТБОЙ / ЛОЖНЫЙ ПРОБОЙ)
        // - Пробой НИЖНЕГО фрактала ВВЕРХ -> ВХОД В LONG
        // - Пробой ВЕРХНЕГО фрактала ВНИЗ  -> ВХОД В SHORT
        // Условие: ТОЛЬКО ЕСЛИ НЕТ ОТКРЫТОЙ РЕАЛЬНОЙ И ВИРТУАЛЬНОЙ ПОЗИЦИИ!
        // =========================================================================
        if (!this.opn && !this.virt && this.prevPrice !== 0) {
            // А. Проверяем нижние фракталы на пробой СНИЗУ ВВЕРХ (ЛОНГ)
            for (let i = 0; i < this.downFractals.length; i++) {
                const f = this.downFractals[i];
                const crossUp = (this.prevPrice < f && price >= f);

                if (crossUp) {
                    if (this.operation === 'B' || this.operation === 'BOTH') {
                        this.openReal(1, price, onOrderCallback, `Отбой/возврат над нижним фракталом ${f} -> Вход в LONG`);
                    } else if (this.operation === 'S') {
                        this.openVirtual(1, price, onOrderCallback, `Возврат над нижним фракталом ${f} -> Вирт-Long`);
                    }
                    break;
                }
            }

            // Б. Проверяем верхние фракталы на пробой СВЕРХУ ВНИЗ (ШОРТ)
            if (!this.opn && !this.virt) {
                for (let i = 0; i < this.upFractals.length; i++) {
                    const f = this.upFractals[i];
                    const crossDown = (this.prevPrice > f && price <= f);

                    if (crossDown) {
                        if (this.operation === 'S' || this.operation === 'BOTH') {
                            this.openReal(-1, price, onOrderCallback, `Отбой/возврат под верхний фрактал ${f} -> Вход в SHORT`);
                        } else if (this.operation === 'B') {
                            this.openVirtual(-1, price, onOrderCallback, `Возврат под верхний фрактал ${f} -> Вирт-Short`);
                        }
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

    openReal(direction, price, onOrderCallback, comment) {
        this.opn = true;
        this.realDir = direction;
        this.realEntry = price;

        if (direction === 1) {
            this.stopPrice = price - this.slOffset;
            this.takePrice = price + this.tpOffset;
        } else {
            this.stopPrice = price + this.slOffset;
            this.takePrice = price - this.tpOffset;
        }

        if (onOrderCallback) {
            onOrderCallback({
                action: direction === 1 ? 'BUY' : 'SELL',
                direction: direction,
                price: price,
                stop: this.stopPrice,
                take: this.takePrice,
                comment: comment
            });
        }
    }

    openVirtual(direction, price, onOrderCallback, comment) {
        this.virt = true;
        this.virtDir = direction;
        this.virtEntry = price;

        if (direction === 1) {
            this.virtStop = price - this.slOffset;
            this.virtTake = price + this.tpOffset;
        } else {
            this.virtStop = price + this.slOffset;
            this.virtTake = price - this.tpOffset;
        }

        if (onOrderCallback) {
            onOrderCallback({
                action: 'INFO',
                comment: `[VIRTUAL] ${direction === 1 ? 'ЛОНГ' : 'ШОРТ'} по ${price}. ${comment}`
            });
        }
    }
}

window.FractalReversalStrategy = FractalReversalStrategy;