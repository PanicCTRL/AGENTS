// Strategy Module: True Fractal (Opening Range & Virtual/Real trades from TODO.md)
class TrueFractalStrategy {
    constructor() {
        this.enabled = true;
        this.operation = 'B'; // 'B': Long, 'S': Short
        this.slOffset = 75;    // Стоп в пунктах
        this.tpOffset = 400;   // Тейк в пунктах
        this.countTrades = 4;  // Количество разрешенных сделок на уровень

        this.count_t = this.countTrades; // Реальные сделки
        this.count_v = this.countTrades; // Виртуальные сделки

        this.startPrice = 0;
        this.lastFractal = 0;
        this.fractals = []; // [firstAuctionPrice, bar1_High, bar1_Low]

        // Позиции
        this.opn = false;      // Реальная позиция
        this.realDir = 0;      // 1: long, -1: short
        this.realEntry = 0;
        this.stopPrice = 0;
        this.takePrice = 0;

        this.virt = false;     // Виртуальная позиция
        this.virtDir = 0;
        this.virtEntry = 0;
        this.virtStop = 0;
        this.virtTake = 0;

        // Построение первой 3-минутной свечи (07:00:00 - 07:03:00)
        this.firstBarFinished = false;
        this.firstBarStartSec = 0;
        this.firstBarHigh = -Infinity;
        this.firstBarLow = Infinity;
        this.firstBarPeriodSec = 180; // 3 минуты

        this.prevPrice = 0;
        this.firstTickHandled = false;
    }

    reset() {
        this.count_t = this.countTrades;
        this.count_v = this.countTrades;
        this.startPrice = 0;
        this.lastFractal = 0;
        this.fractals = [];
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

        this.firstBarFinished = false;
        this.firstBarStartSec = 0;
        this.firstBarHigh = -Infinity;
        this.firstBarLow = Infinity;
        this.prevPrice = 0;
        this.firstTickHandled = false;
    }

    onTick(tick, onOrderCallback) {
        if (!this.enabled) return;
        const price = tick.price;
        const timeSec = tick.time;

        // 1. ДЕЙСТВИЯ НА САМОМ ПЕРВОМ ТИКЕ ДНЯ (Старт торгов / Аукцион)
        if (!this.firstTickHandled) {
            this.firstTickHandled = true;
            this.firstBarStartSec = Math.floor(timeSec / this.firstBarPeriodSec) * this.firstBarPeriodSec;
            this.firstBarHigh = price;
            this.firstBarLow = price;

            // Первая цена считается первым опорным фракталом
            this.startPrice = price;
            this.lastFractal = price;
            this.fractals = [price];

            // Робот на старте сразу кидает заявку (Market)
            this.openReal(price, onOrderCallback, `СТАРТ ТОРГОВ: Первый вход по цене аукциона ${price}`);
            this.prevPrice = price;
            return;
        }

        // 2. Отслеживание формирования первой 3-минутной свечи
        if (!this.firstBarFinished) {
            if (price > this.firstBarHigh) this.firstBarHigh = price;
            if (price < this.firstBarLow) this.firstBarLow = price;

            // Если 3 минуты прошли - фиксируем High и Low первой свечи как новые фракталы!
            if (timeSec >= this.firstBarStartSec + this.firstBarPeriodSec) {
                this.firstBarFinished = true;
                this.fractals.push(this.firstBarHigh);
                this.fractals.push(this.firstBarLow);

                if (onOrderCallback) {
                    onOrderCallback({
                        action: 'INFO',
                        comment: `Сформирована 1-я свеча (3M): High=${this.firstBarHigh}, Low=${this.firstBarLow}. Добавлены в уровни фракталов!`
                    });
                }
            }
        }

        // 3. Сопровождение РЕАЛЬНОЙ позиции (Стоп и Тейк)
        if (this.opn) {
            if (this.realDir === 1) { // Реальный Лонг
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
                            comment: `Реальный СТОП в лонге (-${Math.abs(pnl)} пт) по ${price}`
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
                            comment: `Реальный ТЕЙК в лонге (+${pnl} пт) по ${price}!`
                        });
                    }
                }
            } else if (this.realDir === -1) { // Реальный Шорт
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
                            comment: `Реальный СТОП в шорте (-${Math.abs(pnl)} пт) по ${price}`
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
                            comment: `Реальный ТЕЙК в шорте (+${pnl} пт) по ${price}!`
                        });
                    }
                }
            }
        }

        // 4. Сопровождение ВИРТУАЛЬНОЙ позиции
        if (this.virt) {
            if (this.virtDir === 1) { // Виртуальный Лонг
                if (price <= this.virtStop || price >= this.virtTake) {
                    this.virt = false;
                    if (onOrderCallback) {
                        onOrderCallback({
                            action: 'INFO',
                            comment: `Закрыта ВИРТУАЛЬНАЯ сделка по ${price}`
                        });
                    }
                }
            } else if (this.virtDir === -1) { // Виртуальный Шорт
                if (price >= this.virtStop || price <= this.virtTake) {
                    this.virt = false;
                    if (onOrderCallback) {
                        onOrderCallback({
                            action: 'INFO',
                            comment: `Закрыта ВИРТУАЛЬНАЯ сделка по ${price}`
                        });
                    }
                }
            }
        }

        // 5. ЛОГИКА ПРОБОЯ УРОВНЕЙ И ПЕРЕЗАРЯДКИ (LevelCross из true_fractal.lua)
        // Если оба счетчика выбиты в ноль и мы вне рынка - сбрасываем рабочий уровень
        if (!this.opn && !this.virt && this.count_t === 0 && this.count_v === 0) {
            this.startPrice = 0;
        }

        if (this.prevPrice !== 0 && this.fractals.length > 0) {
            for (let i = 0; i < this.fractals.length; i++) {
                const f = this.fractals[i];
                const crossUp = (this.prevPrice < f && price >= f);
                const crossDown = (this.prevPrice > f && price <= f);

                if (crossUp || crossDown) {
                    // Переключение на НОВЫЙ фрактал (если текущий отработан)
                    if (f !== this.lastFractal && !this.opn && !this.virt) {
                        this.startPrice = f;
                        this.lastFractal = f;
                        this.count_t = this.countTrades;
                        this.count_v = this.countTrades;
                        if (onOrderCallback) {
                            onOrderCallback({
                                action: 'INFO',
                                comment: `ПЕРЕКЛЮЧЕНИЕ на уровень ${f}! Счётчики сброшены: t=${this.count_t}, v=${this.count_v}`
                            });
                        }
                    }

                    // Работа внутри активного уровня startPrice
                    if (f === this.startPrice) {
                        if (this.operation === 'B') {
                            // Для Лонг-робота: пробой снизу вверх = РЕАЛЬНЫЙ лонг, пробой сверху вниз = ВИРТУАЛЬНЫЙ шорт
                            if (crossUp && !this.opn && this.count_t > 0) {
                                this.openReal(price, onOrderCallback, `Пробой уровня ${f} снизу вверх (осталось реальных: ${this.count_t - 1})`);
                            } else if (crossDown && !this.virt && this.count_v > 0) {
                                this.openVirtual(-1, price, onOrderCallback, `Пробой уровня ${f} сверху вниз (осталось вирт: ${this.count_v - 1})`);
                            }
                        } else if (this.operation === 'S') {
                            // Для Шорт-робота: пробой сверху вниз = РЕАЛЬНЫЙ шорт, пробой снизу вверх = ВИРТУАЛЬНЫЙ лонг
                            if (crossDown && !this.opn && this.count_t > 0) {
                                this.openReal(price, onOrderCallback, `Пробой уровня ${f} сверху вниз (осталось реальных: ${this.count_t - 1})`);
                            } else if (crossUp && !this.virt && this.count_v > 0) {
                                this.openVirtual(1, price, onOrderCallback, `Пробой уровня ${f} снизу вверх (осталось вирт: ${this.count_v - 1})`);
                            }
                        }
                    }
                }
            }
        }

        this.prevPrice = price;
    }

    openReal(price, onOrderCallback, comment) {
        if (this.count_t <= 0) return;
        this.opn = true;
        this.realDir = (this.operation === 'B') ? 1 : -1;
        this.realEntry = price;
        this.count_t--;

        if (this.realDir === 1) {
            this.stopPrice = price - this.slOffset;
            this.takePrice = price + this.tpOffset;
        } else {
            this.stopPrice = price + this.slOffset;
            this.takePrice = price - this.tpOffset;
        }

        if (onOrderCallback) {
            onOrderCallback({
                action: this.realDir === 1 ? 'BUY' : 'SELL',
                direction: this.realDir,
                price: price,
                stop: this.stopPrice,
                take: this.takePrice,
                comment: comment
            });
        }
    }

    openVirtual(direction, price, onOrderCallback, comment) {
        if (this.count_v <= 0) return;
        this.virt = true;
        this.virtDir = direction;
        this.virtEntry = price;
        this.count_v--;

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
                comment: `[VIRTUAL] Вход в вирт-${direction === 1 ? 'ЛОНГ' : 'ШОРТ'} по ${price}. ${comment}`
            });
        }
    }
}

window.TrueFractalStrategy = TrueFractalStrategy;