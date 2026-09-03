// Strategy Module: True Fractal (New Pure Architecture)
class TrueFractalStrategy {
    constructor() {
        this.enabled = true;
        this.operation = 'B';   // 'B': Long, 'S': Short, 'BOTH': Реверсивный (Long & Short)
        this.slOffset = 75;      // Размер стопа в пунктах
        this.tpOffset = 400;     // Размер тейка в пунктах

        this.fractals = [];      // Таблица активных уровней цен фракталов
        this.fractalPoints = []; // Массив найденных 5-свечных фракталов: [{ time, price, type: 'UP'|'DOWN' }]

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
        this.barPeriodSec = 180; // 3 минуты (как period_time в true_fractal.lua)
        this.completedBars = []; // Завершенные 3-минутные свечи: [{ time, open, high, low, close }]
        this.buildingBar = null;

        this.firstBarFinished = false;
        this.firstTickHandled = false;
        this.prevPrice = 0;
    }

    reset() {
        this.fractals = [];
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

        // =========================================================================
        // ПУНКТ 1: СТАРТ ТОРГОВ (07:00:00) - Первая цена дня и мгновенный первый вход
        // =========================================================================
        if (!this.firstTickHandled) {
            this.firstTickHandled = true;
            this.fractals = [price]; // Первый фрактал - цена аукциона открытия

            // Открываем первую сделку дня в направлении operation
            const initialDir = (this.operation === 'S') ? -1 : 1;
            this.openReal(initialDir, price, onOrderCallback, `СТАРТ СЕССИИ: Первая сделка по цене открытия ${price}`);

            // Инициализируем построение первой 3-минутной свечи
            const barTime = Math.floor(timeSec / this.barPeriodSec) * this.barPeriodSec;
            this.buildingBar = { time: barTime, open: price, high: price, low: price, close: price };
            this.prevPrice = price;
            return;
        }

        // =========================================================================
        // Агрегация 3-минутных свечей и поиск 5-свечных фракталов Билла Вильямса
        // =========================================================================
        const currentBarTime = Math.floor(timeSec / this.barPeriodSec) * this.barPeriodSec;

        if (!this.buildingBar || currentBarTime > this.buildingBar.time) {
            if (this.buildingBar) {
                // Предыдущая 3-минутная свеча закрылась
                this.completedBars.push({ ...this.buildingBar });

                // ПУНКТ 2: Завершение САМОЙ ПЕРВОЙ 3-минутной свечи
                if (!this.firstBarFinished) {
                    this.firstBarFinished = true;
                    const bar1 = this.completedBars[0];
                    if (!this.fractals.includes(bar1.high)) this.fractals.push(bar1.high);
                    if (!this.fractals.includes(bar1.low)) this.fractals.push(bar1.low);

                    if (onOrderCallback) {
                        onOrderCallback({
                            action: 'INFO',
                            comment: `Сформирована 1-я свеча (3M): High=${bar1.high}, Low=${bar1.low}. Добавлены в таблицу фракталов!`
                        });
                    }
                }

                // ПУНКТ 3: Поиск 5-свечных фракталов Билла Вильямса
                const len = this.completedBars.length;
                if (len >= 5) {
                    const c = len - 3; // Центральный бар (2 бара слева: c-2, c-1; 2 бара справа: c+1, c+2)
                    const b0 = this.completedBars[c - 2];
                    const b1 = this.completedBars[c - 1];
                    const b2 = this.completedBars[c];     // Центр
                    const b3 = this.completedBars[c + 1];
                    const b4 = this.completedBars[c + 2];

                    // Верхний фрактал (High центра строго выше соседей)
                    if (b2.high > b0.high && b2.high > b1.high && b2.high > b3.high && b2.high > b4.high) {
                        const newF = b2.high;
                        if (!this.fractals.includes(newF)) {
                            this.fractals.push(newF);
                            // Оставляем последние 8 активных фракталов
                            if (this.fractals.length > 8) this.fractals.shift();
                        }
                        this.fractalPoints.push({ time: b2.time, price: newF, type: 'UP' });
                        if (onOrderCallback) {
                            onOrderCallback({
                                action: 'FRACTAL_FOUND',
                                fractal: { time: b2.time, price: newF, type: 'UP' },
                                comment: `Найден ВЕРХНИЙ фрактал: ${newF}`
                            });
                        }
                    }

                    // Нижний фрактал (Low центра строго ниже соседей)
                    if (b2.low < b0.low && b2.low < b1.low && b2.low < b3.low && b2.low < b4.low) {
                        const newF = b2.low;
                        if (!this.fractals.includes(newF)) {
                            this.fractals.push(newF);
                            if (this.fractals.length > 8) this.fractals.shift();
                        }
                        this.fractalPoints.push({ time: b2.time, price: newF, type: 'DOWN' });
                        if (onOrderCallback) {
                            onOrderCallback({
                                action: 'FRACTAL_FOUND',
                                fractal: { time: b2.time, price: newF, type: 'DOWN' },
                                comment: `Найден НИЖНИЙ фрактал: ${newF}`
                            });
                        }
                    }
                }
            }

            // Открываем новую формирующуюся 3-минутную свечу
            this.buildingBar = { time: currentBarTime, open: price, high: price, low: price, close: price };
        } else {
            if (price > this.buildingBar.high) this.buildingBar.high = price;
            if (price < this.buildingBar.low) this.buildingBar.low = price;
            this.buildingBar.close = price;
        }

        // =========================================================================
        // Сопровождение РЕАЛЬНОЙ позиции (Стоп-Лосс и Тейк-Профит)
        // =========================================================================
        if (this.opn) {
            if (this.realDir === 1) { // Лонг
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
                            comment: `Стоп-Лосс в лонге (-${Math.abs(pnl)} пт) по ${price}`
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
                            comment: `Тейк-Профит в лонге (+${pnl} пт) по ${price}!`
                        });
                    }
                }
            } else if (this.realDir === -1) { // Шорт
                if (price >= this.stopPrice) {
                    const pnl = this.realEntry - price;
                    this.opn = false;
                    if (onOrderCallback) {
                        onOrderCallback({
                            action: 'CLOSE',
                            direction: 1,
                            price: price,
                            pnl: pnl,
                            isStop: true,
                            comment: `Стоп-Лосс в шорте (-${Math.abs(pnl)} пт) по ${price}`
                        });
                    }
                } else if (price <= this.takePrice) {
                    const pnl = this.realEntry - price;
                    this.opn = false;
                    if (onOrderCallback) {
                        onOrderCallback({
                            action: 'CLOSE',
                            direction: 1,
                            price: price,
                            pnl: pnl,
                            isTake: true,
                            comment: `Тейк-Профит в шорте (+${pnl} пт) по ${price}!`
                        });
                    }
                }
            }
        }

        // =========================================================================
        // Сопровождение ВИРТУАЛЬНОЙ позиции
        // =========================================================================
        if (this.virt) {
            if (this.virtDir === 1) {
                if (price <= this.virtStop || price >= this.virtTake) {
                    this.virt = false;
                    if (onOrderCallback) onOrderCallback({ action: 'INFO', comment: `Закрыта виртуальная сделка по ${price}` });
                }
            } else if (this.virtDir === -1) {
                if (price >= this.virtStop || price <= this.virtTake) {
                    this.virt = false;
                    if (onOrderCallback) onOrderCallback({ action: 'INFO', comment: `Закрыта виртуальная сделка по ${price}` });
                }
            }
        }

        // =========================================================================
        // ПУНКТ 3: ВХОД ПРИ ПРОБОЕ ФРАКТАЛА
        // Условие: ТОЛЬКО ЕСЛИ НЕТ ОТКРЫТОЙ РЕАЛЬНОЙ И ВИРТУАЛЬНОЙ ПОЗИЦИИ!
        // =========================================================================
        if (!this.opn && !this.virt && this.prevPrice !== 0 && this.fractals.length > 0) {
            for (let i = 0; i < this.fractals.length; i++) {
                const f = this.fractals[i];
                const crossUp = (this.prevPrice < f && price >= f);
                const crossDown = (this.prevPrice > f && price <= f);

                if (crossUp) {
                    // Пробой фрактала снизу вверх -> ЛОНГ
                    if (this.operation === 'B' || this.operation === 'BOTH') {
                        this.openReal(1, price, onOrderCallback, `Пробой фрактала ${f} снизу вверх -> Вход в LONG`);
                    } else if (this.operation === 'S') {
                        this.openVirtual(1, price, onOrderCallback, `Пробой фрактала ${f} снизу вверх -> Виртуальный Long`);
                    }
                    break;
                } else if (crossDown) {
                    // Пробой фрактала сверху вниз -> ШОРТ
                    if (this.operation === 'S' || this.operation === 'BOTH') {
                        this.openReal(-1, price, onOrderCallback, `Пробой фрактала ${f} сверху вниз -> Вход в SHORT`);
                    } else if (this.operation === 'B') {
                        this.openVirtual(-1, price, onOrderCallback, `Пробой фрактала ${f} сверху вниз -> Виртуальный Short`);
                    }
                    break;
                }
            }
        }

        this.prevPrice = price;
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

window.TrueFractalStrategy = TrueFractalStrategy;