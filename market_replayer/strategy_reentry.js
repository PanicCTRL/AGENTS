// Strategy Module: Stop Loss & Re-entry Engine (Логика стопа и перезахода)
class ReentryStrategy {
    constructor() {
        this.enabled = false;
        this.stopLossPts = 50;     // Размер стопа в пунктах (для MXU6 шаг 25)
        this.takeProfitPts = 200;  // Размер тейка в пунктах
        this.maxReentries = 1;     // Максимум перезаходов
        this.reentryCount = 0;
        
        this.position = 0;         // 0: нет, 1: лонг, -1: шорт
        this.entryPrice = 0;
        this.stopPrice = 0;
        this.takePrice = 0;
        
        // Переменные для перезахода (Re-entry)
        this.reentryPending = false;
        this.reentryDirection = 0;
        this.reentryTriggerPrice = 0;
        this.extremeSeenAfterStop = 0;
    }

    reset() {
        this.position = 0;
        this.entryPrice = 0;
        this.stopPrice = 0;
        this.takePrice = 0;
        this.reentryPending = false;
        this.reentryCount = 0;
        this.extremeSeenAfterStop = 0;
    }

    openPosition(direction, price) {
        this.position = direction;
        this.entryPrice = price;
        this.reentryCount = 0;
        this.reentryPending = false;

        if (direction === 1) {
            this.stopPrice = price - this.stopLossPts;
            this.takePrice = price + this.takeProfitPts;
        } else if (direction === -1) {
            this.stopPrice = price + this.stopLossPts;
            this.takePrice = price - this.takeProfitPts;
        }
        return {
            action: direction === 1 ? 'BUY' : 'SELL',
            price: price,
            stop: this.stopPrice,
            take: this.takePrice,
            comment: `Вход в ${direction === 1 ? 'LONG' : 'SHORT'}`
        };
    }

    onTick(tick, onOrderCallback) {
        if (!this.enabled) return;
        const price = tick.price;

        // 1. Позиция открыта
        if (this.position !== 0) {
            // ШОРТ
            if (this.position === -1) {
                if (price >= this.stopPrice) {
                    const closedPrice = price;
                    const loss = this.entryPrice - closedPrice;
                    this.position = 0;

                    if (this.reentryCount < this.maxReentries) {
                        this.reentryPending = true;
                        this.reentryDirection = -1;
                        this.reentryTriggerPrice = this.stopPrice;
                        this.extremeSeenAfterStop = closedPrice;
                    }

                    if (onOrderCallback) {
                        onOrderCallback({
                            action: 'CLOSE',
                            direction: 1,
                            price: closedPrice,
                            pnl: loss,
                            isStop: true,
                            comment: `Выбит СТОП в шорте (-${Math.abs(loss)} пт). Ждем возврат под ${this.reentryTriggerPrice}`
                        });
                    }
                    return;
                }
                if (price <= this.takePrice) {
                    const win = this.entryPrice - price;
                    this.position = 0;
                    this.reentryPending = false;
                    if (onOrderCallback) {
                        onOrderCallback({
                            action: 'CLOSE',
                            direction: 1,
                            price: price,
                            pnl: win,
                            isTake: true,
                            comment: `Взят ТЕЙК в шорте (+${win} пт)!`
                        });
                    }
                    return;
                }
            }
            // ЛОНГ
            else if (this.position === 1) {
                if (price <= this.stopPrice) {
                    const closedPrice = price;
                    const loss = closedPrice - this.entryPrice;
                    this.position = 0;

                    if (this.reentryCount < this.maxReentries) {
                        this.reentryPending = true;
                        this.reentryDirection = 1;
                        this.reentryTriggerPrice = this.stopPrice;
                        this.extremeSeenAfterStop = closedPrice;
                    }

                    if (onOrderCallback) {
                        onOrderCallback({
                            action: 'CLOSE',
                            direction: -1,
                            price: closedPrice,
                            pnl: loss,
                            isStop: true,
                            comment: `Выбит СТОП в лонге (-${Math.abs(loss)} пт). Ждем возврат над ${this.reentryTriggerPrice}`
                        });
                    }
                    return;
                }
                if (price >= this.takePrice) {
                    const win = price - this.entryPrice;
                    this.position = 0;
                    this.reentryPending = false;
                    if (onOrderCallback) {
                        onOrderCallback({
                            action: 'CLOSE',
                            direction: -1,
                            price: price,
                            pnl: win,
                            isTake: true,
                            comment: `Взят ТЕЙК в лонге (+${win} пт)!`
                        });
                    }
                    return;
                }
            }
        }

        // 2. Логика перезахода (Re-entry)
        if (this.position === 0 && this.reentryPending) {
            if (this.reentryDirection === -1) {
                if (price > this.extremeSeenAfterStop) {
                    this.extremeSeenAfterStop = price;
                }
                if (price < this.reentryTriggerPrice) {
                    this.reentryPending = false;
                    this.reentryCount++;
                    this.position = -1;
                    this.entryPrice = price;
                    const calculatedStop = Math.max(this.extremeSeenAfterStop + 25, price + this.stopLossPts);
                    this.stopPrice = calculatedStop;
                    this.takePrice = price - this.takeProfitPts;

                    if (onOrderCallback) {
                        onOrderCallback({
                            action: 'SELL',
                            direction: -1,
                            price: price,
                            stop: this.stopPrice,
                            take: this.takePrice,
                            isReentry: true,
                            comment: `ПЕРЕЗАХОД В ШОРТ! Возврат под ${this.reentryTriggerPrice}. Стоп: ${this.stopPrice}`
                        });
                    }
                }
            } else if (this.reentryDirection === 1) {
                if (price < this.extremeSeenAfterStop) {
                    this.extremeSeenAfterStop = price;
                }
                if (price > this.reentryTriggerPrice) {
                    this.reentryPending = false;
                    this.reentryCount++;
                    this.position = 1;
                    this.entryPrice = price;
                    const calculatedStop = Math.min(this.extremeSeenAfterStop - 25, price - this.stopLossPts);
                    this.stopPrice = calculatedStop;
                    this.takePrice = price + this.takeProfitPts;

                    if (onOrderCallback) {
                        onOrderCallback({
                            action: 'BUY',
                            direction: 1,
                            price: price,
                            stop: this.stopPrice,
                            take: this.takePrice,
                            isReentry: true,
                            comment: `ПЕРЕЗАХОД В ЛОНГ! Возврат над ${this.reentryTriggerPrice}. Стоп: ${this.stopPrice}`
                        });
                    }
                }
            }
        }
    }
}
window.ReentryStrategy = ReentryStrategy;