-- mock_opening.lua
-- Стратегия: Коридор «Вильямс с расширением плато» (Канал 4)
-- Правило: СТРОГО 4 сделки на один уровень, затем уровень навсегда забывается!
-- Сигналы на вход: две последние нижние границы (LONG) и две последние верхние границы (SHORT).
-- Полная симметрия: одновременный старт в 07:00:00, лимит 5 свечей на цену открытия дня.
-- Кодировка: Windows-1251. Без зависимостей от QUIK API.

-- ============================================================================
-- 1. НАСТРОЙКИ СТРАТЕГИИ
-- ============================================================================
operation       = "B"
count_trades    = 4
slOffset        = 75
tpOffset        = 1050
stepPrice       = 25

-- ============================================================================
-- 2. СОСТОЯНИЕ И ПЕРЕМЕННЫЕ
-- ============================================================================
openDayPrice    = 0
startPrice      = 0
openDayForgotten = false
dayCandleCount  = 0
isStarted       = false

currentPrice    = 0
prevPrice       = 0

-- Лонг (Реальная позиция)
opn             = false
entryPrice      = 0
stop_price      = 0
take_price      = 0
longLevel       = 0
count_t         = count_trades
longExhausted   = false

prevCount_t     = 0
prevLongExhausted = false

-- Шорт (Виртуальная позиция)
virt            = false
virtEntryPrice  = 0
virt_stop       = 0
virt_take       = 0
shortLevel      = 0
count_v         = count_trades
shortExhausted  = false

prevCount_v     = 0
prevShortExhausted = false

-- Границы коридора сигналов (по две верхние и две нижние границы)
upperCorridor     = 0
prevUpperCorridor = 0
lowerCorridor     = 0
prevLowerCorridor = 0
hasCorridor       = false

-- Уровень после взятия тейк-профита (1-й вход на той же свече, перевходы только на растущей/падающей)
takeLevel         = 0
takeCount_t       = 0
takeCount_v       = 0
hasTakeLevel      = false
lastTakeBar       = -1
candleIndex       = 0
candleOpenPrice   = 0
isNewCandle       = false

maxPrices       = {}
minPrices       = {}
fractals        = {}
plateaus        = {}
history_log     = {}

lastPlateauHigh = 0
lastPlateauLow  = 0
lastFractalUp   = 0
lastFractalDown = 0

-- ============================================================================
-- 3. ЛОГИРОВАНИЕ СОБЫТИЙ ДЛЯ STRG
-- ============================================================================
function LogMockEvent(eventType, message)
    local ev = {}
    ev.type   = eventType
    ev.msg    = message
    ev.price  = currentPrice
    if longLevel == takeLevel and hasTakeLevel then
        ev.t_left = takeCount_t
    elseif longLevel == prevLowerCorridor and prevLowerCorridor > 0 then
        ev.t_left = prevCount_t
    else
        ev.t_left = count_t
    end
    if shortLevel == takeLevel and hasTakeLevel then
        ev.v_left = takeCount_v
    elseif shortLevel == prevUpperCorridor and prevUpperCorridor > 0 then
        ev.v_left = prevCount_v
    else
        ev.v_left = count_v
    end
    ev.opn    = opn
    ev.virt   = virt
    if eventType == "VIRT_OPEN" then
        ev.start = (shortLevel > 0) and shortLevel or currentPrice
    else
        ev.start = (longLevel > 0) and longLevel or currentPrice
    end
    table.insert(history_log, ev)
end

-- ============================================================================
-- 4. ОТКРЫТИЕ И ЗАКРЫТИЕ ПОЗИЦИЙ
-- ============================================================================
function OpenReal(lvl)
    if opn then return end

    if lvl == lowerCorridor then
        if count_t <= 0 or longExhausted then return end
        count_t = count_t - 1
        longLevel = lvl
        startPrice = lvl
        opn = true
        entryPrice = currentPrice
        stop_price = longLevel - slOffset
        take_price = longLevel + tpOffset
        local att = count_trades - count_t
        LogMockEvent("TRADE_OPEN", "Вход в LONG #" .. tostring(att) .. " от уровня " .. tostring(longLevel) .. ". SL: " .. tostring(stop_price) .. ", TP: " .. tostring(take_price))
    elseif lvl == prevLowerCorridor and prevLowerCorridor > 0 then
        if prevCount_t <= 0 or prevLongExhausted then return end
        prevCount_t = prevCount_t - 1
        longLevel = lvl
        startPrice = lvl
        opn = true
        entryPrice = currentPrice
        stop_price = longLevel - slOffset
        take_price = longLevel + tpOffset
        local att = count_trades - prevCount_t
        LogMockEvent("TRADE_OPEN", "Вход в LONG #" .. tostring(att) .. " от предыдущего уровня " .. tostring(longLevel) .. ". SL: " .. tostring(stop_price) .. ", TP: " .. tostring(take_price))
    elseif not openDayForgotten and lvl == openDayPrice then
        if count_t <= 0 or longExhausted then return end
        count_t = count_t - 1
        longLevel = lvl
        startPrice = lvl
        opn = true
        entryPrice = currentPrice
        stop_price = longLevel - slOffset
        take_price = longLevel + tpOffset
        local att = count_trades - count_t
        LogMockEvent("TRADE_OPEN", "Вход в LONG #" .. tostring(att) .. " от открытия дня " .. tostring(longLevel) .. ". SL: " .. tostring(stop_price) .. ", TP: " .. tostring(take_price))
    end
end

function OpenVirt(lvl)
    if virt then return end

    if lvl == upperCorridor then
        if count_v <= 0 or shortExhausted then return end
        count_v = count_v - 1
        shortLevel = lvl
        virt = true
        virtEntryPrice = currentPrice
        virt_stop = shortLevel + slOffset
        virt_take = shortLevel - tpOffset
        local att = count_trades - count_v
        LogMockEvent("VIRT_OPEN", "Вход в SHORT #" .. tostring(att) .. " от уровня " .. tostring(shortLevel) .. ". SL: " .. tostring(virt_stop) .. ", TP: " .. tostring(virt_take))
    elseif lvl == prevUpperCorridor and prevUpperCorridor > 0 then
        if prevCount_v <= 0 or prevShortExhausted then return end
        prevCount_v = prevCount_v - 1
        shortLevel = lvl
        virt = true
        virtEntryPrice = currentPrice
        virt_stop = shortLevel + slOffset
        virt_take = shortLevel - tpOffset
        local att = count_trades - prevCount_v
        LogMockEvent("VIRT_OPEN", "Вход в SHORT #" .. tostring(att) .. " от предыдущего уровня " .. tostring(shortLevel) .. ". SL: " .. tostring(virt_stop) .. ", TP: " .. tostring(virt_take))
    elseif not openDayForgotten and lvl == openDayPrice then
        if count_v <= 0 or shortExhausted then return end
        count_v = count_v - 1
        shortLevel = lvl
        virt = true
        virtEntryPrice = currentPrice
        virt_stop = shortLevel + slOffset
        virt_take = shortLevel - tpOffset
        local att = count_trades - count_v
        LogMockEvent("VIRT_OPEN", "Вход в SHORT #" .. tostring(att) .. " от открытия дня " .. tostring(shortLevel) .. ". SL: " .. tostring(virt_stop) .. ", TP: " .. tostring(virt_take))
    end
end

function CheckRealExit()
    if not opn then return end

    -- Стоп-лосс
    if currentPrice <= stop_price then
        LogMockEvent("TRADE_CLOSE", "Стоп по LONG выбит на цене " .. tostring(currentPrice) .. ". Закрытие по STOP-LOSS")
        opn = false
        stop_price = 0
        take_price = 0

        -- Если все 4 попытки исчерпаны — уровень навсегда забывается!
        if longLevel == lowerCorridor then
            if count_t <= 0 then
                longExhausted = true
                LogMockEvent("EXHAUSTED_LONG", "Все 4 попытки LONG исчерпаны. Уровень " .. tostring(longLevel) .. " забыт!")
            end
        elseif longLevel == prevLowerCorridor then
            if prevCount_t <= 0 then
                prevLongExhausted = true
                LogMockEvent("EXHAUSTED_LONG", "Все 4 попытки LONG исчерпаны. Предыдущий уровень " .. tostring(longLevel) .. " забыт!")
            end
        else
            if count_t <= 0 then
                longExhausted = true
                LogMockEvent("EXHAUSTED_LONG", "Все 4 попытки LONG исчерпаны. Уровень открытия дня " .. tostring(longLevel) .. " забыт!")
            end
        end
        return
    end

    -- Тейк-профит
    if currentPrice >= take_price then
        local earnedTake = take_price
        LogMockEvent("TRADE_CLOSE", "Тейк по LONG взят на цене " .. tostring(currentPrice) .. ". Закрытие по TAKE-PROFIT")
        opn = false
        stop_price = 0
        take_price = 0
        if longLevel == lowerCorridor then
            longExhausted = true
        elseif longLevel == prevLowerCorridor then
            prevLongExhausted = true
        else
            longExhausted = true
        end
        LogMockEvent("TAKE_LONG", "Тейк достигнут! Уровень отработан и забыт.")

        -- Улучшение: Уровень взятого тейка становится новым уровнем торгов (по 4 попытки: 1-й на той же свече, перевходы на растущей/падающей)
        takeLevel    = earnedTake
        takeCount_t  = count_trades
        takeCount_v  = count_trades
        hasTakeLevel = true
        AddLevel(earnedTake)
        LogMockEvent("NEW_TAKE_LEVEL", "Уровень тейка " .. tostring(earnedTake) .. " стал новым уровнем (по 4 попытки в обе стороны)!")
    end
end

function CheckVirtExit()
    if not virt then return end

    -- Стоп-лосс
    if currentPrice >= virt_stop then
        LogMockEvent("VIRT_CLOSE", "Стоп по SHORT выбит на цене " .. tostring(currentPrice) .. ". Закрытие по STOP-LOSS")
        virt = false
        virt_stop = 0
        virt_take = 0

        -- Если все 4 попытки исчерпаны — уровень навсегда забывается!
        if shortLevel == upperCorridor then
            if count_v <= 0 then
                shortExhausted = true
                LogMockEvent("EXHAUSTED_SHORT", "Все 4 попытки SHORT исчерпаны. Уровень " .. tostring(shortLevel) .. " забыт!")
            end
        elseif shortLevel == prevUpperCorridor then
            if prevCount_v <= 0 then
                prevShortExhausted = true
                LogMockEvent("EXHAUSTED_SHORT", "Все 4 попытки SHORT исчерпаны. Предыдущий уровень " .. tostring(shortLevel) .. " забыт!")
            end
        else
            if count_v <= 0 then
                shortExhausted = true
                LogMockEvent("EXHAUSTED_SHORT", "Все 4 попытки SHORT исчерпаны. Уровень открытия дня " .. tostring(shortLevel) .. " забыт!")
            end
        end
        return
    end

    -- Тейк-профит
    if currentPrice <= virt_take then
        local earnedTake = virt_take
        LogMockEvent("VIRT_CLOSE", "Тейк по SHORT взят на цене " .. tostring(currentPrice) .. ". Закрытие по TAKE-PROFIT")
        virt = false
        virt_stop = 0
        virt_take = 0
        if shortLevel == upperCorridor then
            shortExhausted = true
        elseif shortLevel == prevUpperCorridor then
            prevShortExhausted = true
        else
            shortExhausted = true
        end
        LogMockEvent("TAKE_SHORT", "Тейк достигнут! Уровень отработан и забыт.")

        -- Улучшение: Уровень взятого тейка становится новым уровнем торгов (по 4 попытки: 1-й на той же свече, перевходы на растущей/падающей)
        takeLevel    = earnedTake
        takeCount_t  = count_trades
        takeCount_v  = count_trades
        hasTakeLevel = true
        AddLevel(earnedTake)
        LogMockEvent("NEW_TAKE_LEVEL", "Уровень тейка " .. tostring(earnedTake) .. " стал новым уровнем (по 4 попытки в обе стороны)!")
    end
end

-- ============================================================================
-- 5. ФРАКТАЛЫ, ПЛАТО И КОРИДОР («Вильямс с расширением плато»)
-- ============================================================================
function PushPrice(high, low)
    if not high or high == 0 or not low or low == 0 then return end

    table.insert(maxPrices, high)
    if #maxPrices > 5 then
        table.remove(maxPrices, 1)
    end

    table.insert(minPrices, low)
    if #minPrices > 5 then
        table.remove(minPrices, 1)
    end
end

function AddLevel(levelVal)
    for i = 1, #fractals do
        if fractals[i] == levelVal then
            return
        end
    end
    table.insert(fractals, levelVal)
    if #fractals > 8 then
        table.remove(fractals, 1)
    end
end

function UpdateUpperCorridor(pLevel)
    if pLevel ~= upperCorridor then
        prevUpperCorridor   = upperCorridor
        prevCount_v         = count_v
        prevShortExhausted  = shortExhausted

        upperCorridor       = pLevel
        count_v             = count_trades
        shortExhausted      = false
        AddLevel(pLevel)

        if upperCorridor > 0 and lowerCorridor > 0 and not hasCorridor then
            hasCorridor = true
            openDayForgotten = true
            LogMockEvent("CORRIDOR_READY", "Сформирован коридор фракталов [" .. tostring(lowerCorridor) .. " - " .. tostring(upperCorridor) .. "]. Уровень открытия забыт!")
        end
        LogMockEvent("UPDATE_UPPER", "Новая верхняя граница коридора: " .. tostring(pLevel))
    end
end

function UpdateLowerCorridor(pLevel)
    if pLevel ~= lowerCorridor then
        prevLowerCorridor   = lowerCorridor
        prevCount_t         = count_t
        prevLongExhausted   = longExhausted

        lowerCorridor       = pLevel
        count_t             = count_trades
        longExhausted       = false
        AddLevel(pLevel)

        if upperCorridor > 0 and lowerCorridor > 0 and not hasCorridor then
            hasCorridor = true
            openDayForgotten = true
            LogMockEvent("CORRIDOR_READY", "Сформирован коридор фракталов [" .. tostring(lowerCorridor) .. " - " .. tostring(upperCorridor) .. "]. Уровень открытия забыт!")
        end
        LogMockEvent("UPDATE_LOWER", "Новая нижняя граница коридора: " .. tostring(pLevel))
    end
end

function CheckPlateau()
    local n = #maxPrices
    if n < 2 then return end

    -- Плато High: расширяет коридор только если ВЫШЕ текущей верхней границы
    if maxPrices[n] == maxPrices[n - 1] then
        local pLevel = maxPrices[n]
        if pLevel ~= lastPlateauHigh then
            lastPlateauHigh = pLevel
            table.insert(plateaus, pLevel)
            if upperCorridor == 0 or pLevel > upperCorridor then
                UpdateUpperCorridor(pLevel)
            end
        end
    else
        lastPlateauHigh = 0
    end

    -- Плато Low: расширяет коридор только если НИЖЕ текущей нижней границы
    if minPrices[n] == minPrices[n - 1] then
        local pLevel = minPrices[n]
        if pLevel ~= lastPlateauLow then
            lastPlateauLow = pLevel
            table.insert(plateaus, pLevel)
            if lowerCorridor == 0 or pLevel < lowerCorridor then
                UpdateLowerCorridor(pLevel)
            end
        end
    else
        lastPlateauLow = 0
    end
end

function GetFractal()
    if #maxPrices < 5 or #minPrices < 5 then return end

    -- Фрактал вверх (база Вильямса)
    if maxPrices[3] > maxPrices[1] and maxPrices[3] > maxPrices[2] and 
       maxPrices[3] > maxPrices[4] and maxPrices[3] > maxPrices[5] then
        local fLevel = maxPrices[3]
        if fLevel ~= lastFractalUp then
            lastFractalUp = fLevel
            UpdateUpperCorridor(fLevel)
        end
    end

    -- Фрактал вниз (база Вильямса)
    if minPrices[3] < minPrices[1] and minPrices[3] < minPrices[2] and 
       minPrices[3] < minPrices[4] and minPrices[3] < minPrices[5] then
        local fLevel = minPrices[3]
        if fLevel ~= lastFractalDown then
            lastFractalDown = fLevel
            UpdateLowerCorridor(fLevel)
        end
    end
end

-- ============================================================================
-- 6. ОБРАБОТКА ПРОБОЕВ УРОВНЕЙ
-- ============================================================================
function ProcessCrosses()
    if prevPrice == 0 then return end

    -- 1. ЭТАП ДО КОРИДОРА: РАБОТАЕТ ЦЕНА ОТКРЫТИЯ ДНЯ (до 5 свечей)
    if isStarted and not openDayForgotten and openDayPrice > 0 then
        -- Пробой уровня открытия снизу вверх -> вход в LONG
        local crossOpenUp = (prevPrice < openDayPrice and currentPrice >= openDayPrice)
        if crossOpenUp and not opn and not longExhausted and count_t > 0 then
            longLevel = openDayPrice
            startPrice = openDayPrice
            LogMockEvent("CROSS_OPEN_UP", "Пробой открытия дня снизу вверх. Вход в LONG")
            OpenReal(openDayPrice)
        end

        -- Пробой уровня открытия сверху вниз -> вход в SHORT
        local crossOpenDown = (prevPrice > openDayPrice and currentPrice <= openDayPrice)
        if crossOpenDown and not virt and not shortExhausted and count_v > 0 then
            shortLevel = openDayPrice
            LogMockEvent("CROSS_OPEN_DOWN", "Пробой открытия дня сверху вниз. Вход в SHORT")
            OpenVirt(openDayPrice)
        end
    end

    -- 2. ЭТАП ПОСЛЕ ПОЯВЛЕНИЯ КОРИДОРА: ДВЕ ВЕРХНИЕ И ДВЕ НИЖНИЕ ГРАНИЦЫ
    if hasCorridor then
        -- Фильтр ступеней канала (Slope Filter):
        -- Если канал растет (High выше и Low не ниже) -> восходящий тренд (шорты блокируются)
        -- Если канал падает (Low ниже и High не выше) -> нисходящий тренд (лонги блокируются)
        local isUpTrend = false
        local isDownTrend = false
        if prevUpperCorridor > 0 and prevLowerCorridor > 0 then
            isUpTrend = (upperCorridor > prevUpperCorridor or lowerCorridor > prevLowerCorridor)
            isDownTrend = (upperCorridor < prevUpperCorridor or lowerCorridor < prevLowerCorridor)
        end

        -- Верхние границы (SHORT): разрешены ТОЛЬКО если нет восходящего тренда
        if not isUpTrend then
            if upperCorridor > 0 then
                local crossUpperDown = (prevPrice > upperCorridor and currentPrice <= upperCorridor)
                if crossUpperDown and not virt and not shortExhausted and count_v > 0 then
                    LogMockEvent("CROSS_UPPER_DOWN", "Возврат под верхнюю границу " .. tostring(upperCorridor) .. " сверху вниз. Вход в SHORT")
                    OpenVirt(upperCorridor)
                end
            end

            if prevUpperCorridor > 0 and prevUpperCorridor ~= upperCorridor then
                local crossPrevUpperDown = (prevPrice > prevUpperCorridor and currentPrice <= prevUpperCorridor)
                if crossPrevUpperDown and not virt and not prevShortExhausted and prevCount_v > 0 then
                    LogMockEvent("CROSS_PREV_UPPER_DOWN", "Возврат под предыдущую верхнюю границу " .. tostring(prevUpperCorridor) .. " сверху вниз. Вход в SHORT")
                    OpenVirt(prevUpperCorridor)
                end
            end
        end

        -- Нижние границы (LONG): разрешены ТОЛЬКО если нет нисходящего тренда
        if not isDownTrend then
            if lowerCorridor > 0 then
                local crossLowerUp = (prevPrice < lowerCorridor and currentPrice >= lowerCorridor)
                if crossLowerUp and not opn and not longExhausted and count_t > 0 then
                    LogMockEvent("CROSS_LOWER_UP", "Возврат над нижнюю границу " .. tostring(lowerCorridor) .. " снизу вверх. Вход в LONG")
                    OpenReal(lowerCorridor)
                end
            end

            if prevLowerCorridor > 0 and prevLowerCorridor ~= lowerCorridor then
                local crossPrevLowerUp = (prevPrice < prevLowerCorridor and currentPrice >= prevLowerCorridor)
                if crossPrevLowerUp and not opn and not prevLongExhausted and prevCount_t > 0 then
                    LogMockEvent("CROSS_PREV_LOWER_UP", "Возврат над предыдущую нижнюю границу " .. tostring(prevLowerCorridor) .. " снизу вверх. Вход в LONG")
                    OpenReal(prevLowerCorridor)
                end
            end
        end
    end

    -- 3. ЭТАП: ТОРГОВЛЯ ОТ УРОВНЯ ВЗЯТОГО ТЕЙКА
    -- Попытка 1: разрешена сразу на той же свече.
    -- Перевход (еще 3 попытки): в LONG только на растущей свече, в SHORT только на падающей свече (не на той же свече).
    if hasTakeLevel and takeLevel > 0 then
        -- Вход в LONG при пробое уровня тейка снизу вверх:
        local crossTakeUp = (prevPrice < takeLevel and currentPrice >= takeLevel)
        local isFirstAttempt_t = (takeCount_t == count_trades)
        local isGrowingCandle = (candleOpenPrice > 0 and currentPrice > candleOpenPrice)
        local canReenterLong = (takeCount_t < count_trades and lastTakeBar ~= candleIndex and isGrowingCandle)

        if crossTakeUp and not opn and takeCount_t > 0 and (isFirstAttempt_t or canReenterLong) then
            lastTakeBar = candleIndex
            takeCount_t = takeCount_t - 1
            longLevel   = takeLevel
            startPrice  = takeLevel
            opn         = true
            entryPrice  = currentPrice
            stop_price  = longLevel - slOffset
            take_price  = longLevel + tpOffset
            local att   = count_trades - takeCount_t
            LogMockEvent("TRADE_OPEN", "Вход в LONG #" .. tostring(att) .. " от уровня тейка " .. tostring(longLevel) .. ". SL: " .. tostring(stop_price) .. ", TP: " .. tostring(take_price))
        end

        -- Вход в SHORT при пробое уровня тейка сверху вниз:
        local crossTakeDown = (prevPrice > takeLevel and currentPrice <= takeLevel)
        local isFirstAttempt_v = (takeCount_v == count_trades)
        local isFallingCandle = (candleOpenPrice > 0 and currentPrice < candleOpenPrice)
        local canReenterShort = (takeCount_v < count_trades and lastTakeBar ~= candleIndex and isFallingCandle)

        if crossTakeDown and not virt and takeCount_v > 0 and (isFirstAttempt_v or canReenterShort) then
            lastTakeBar = candleIndex
            takeCount_v = takeCount_v - 1
            shortLevel  = takeLevel
            virt        = true
            virtEntryPrice = currentPrice
            virt_stop   = shortLevel + slOffset
            virt_take   = shortLevel - tpOffset
            local att   = count_trades - takeCount_v
            LogMockEvent("VIRT_OPEN", "Вход в SHORT #" .. tostring(att) .. " от уровня тейка " .. tostring(shortLevel) .. ". SL: " .. tostring(virt_stop) .. ", TP: " .. tostring(virt_take))
        end

        -- Если обе стороны исчерпали попытки — уровень тейка забывается
        if takeCount_t <= 0 and takeCount_v <= 0 then
            hasTakeLevel = false
        end
    end
end

-- ============================================================================
-- 7. ФИДЕРЫ ДАННЫХ ДЛЯ ТЕСТЕРА STRG
-- ============================================================================
function FeedBar(high, low)
    isNewCandle = true
    candleIndex = candleIndex + 1
    PushPrice(high, low)
    CheckPlateau()
    GetFractal()

    -- Отсчет лимита 5 свечей для цены открытия дня
    if isStarted and not openDayForgotten then
        dayCandleCount = dayCandleCount + 1
        if dayCandleCount >= 5 then
            openDayForgotten = true
            LogMockEvent("OPEN_DAY_EXPIRED", "Прошло 5 свечей. Уровень открытия дня навсегда забыт!")
        end
    end
end

function FeedTick(price, tick_time)
    if not price or price == 0 then return end

    prevPrice = currentPrice
    currentPrice = price

    if isNewCandle then
        candleOpenPrice = currentPrice
        isNewCandle = false
    end

    CheckRealExit()
    CheckVirtExit()

    -- 1. Первый симметричный старт в 07:00:00 (одновременный вход в обе стороны)
    if not isStarted then
        if tick_time and tick_time >= 70000 then
            isStarted = true
            openDayPrice = currentPrice

            local rawTp = openDayPrice * 0.005
            tpOffset = math.floor(rawTp / stepPrice) * stepPrice
            if tpOffset < 500 then
                tpOffset = 1050
            end

            shortLevel = openDayPrice
            longLevel  = openDayPrice
            AddLevel(openDayPrice)

            LogMockEvent("START_LEVEL", "Старт 07:00:00. Симметричный старт. Цена открытия: " .. tostring(openDayPrice) .. ", Тейк: " .. tostring(tpOffset) .. " пт")
            OpenReal(openDayPrice)
            OpenVirt(openDayPrice)
        end
        return
    end

    -- 2. Обработка пересечений уровней
    ProcessCrosses()
end
