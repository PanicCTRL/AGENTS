-- fractal_zigzag.lua
-- Модуль фрактального Зиг-Зага (Коробочка №1).
-- Макроструктура Доу (Major Swings) по 5-баровым фракталам Билла Вильямса.
-- При перехае / перелое внутренние откаты схлопываются (поглощаются).
-- Кодировка: Windows-1251. Без зависимостей от внешних библиотек.

local ZigZag = {}
ZigZag.candles = {}
ZigZag.rawPivots = {}
ZigZag.confirmedLegs = {}
ZigZag.state = nil
ZigZag.anchor = nil
ZigZag.highest = nil
ZigZag.lowest = nil
ZigZag.lastHigh = nil
ZigZag.lastLow = nil

function ZigZag.Init()
    ZigZag.candles = {}
    ZigZag.rawPivots = {}
    ZigZag.confirmedLegs = {}
    ZigZag.state = nil
    ZigZag.anchor = nil
    ZigZag.highest = nil
    ZigZag.lowest = nil
    ZigZag.lastHigh = nil
    ZigZag.lastLow = nil
end

-- Обработка нового сырого пивота через фильтр Доу
local function ProcessPivot(p)
    if ZigZag.state == nil then
        ZigZag.anchor = p
        if p.type == "HIGH" then
            ZigZag.state = "DOWN"
            ZigZag.lowest = p
        else
            ZigZag.state = "UP"
            ZigZag.highest = p
        end
        ZigZag.lastHigh = nil
        ZigZag.lastLow = nil
        return
    end

    if ZigZag.state == "UP" then
        if p.type == "HIGH" then
            if ZigZag.highest == nil or p.price >= ZigZag.highest.price then
                ZigZag.highest = p
                ZigZag.lastLow = nil
                ZigZag.lastHigh = nil
            else
                ZigZag.lastHigh = p
            end
        elseif p.type == "LOW" then
            if ZigZag.highest ~= nil and ZigZag.lastHigh ~= nil and ZigZag.lastLow ~= nil then
                if p.price < ZigZag.lastLow.price then
                    table.insert(ZigZag.confirmedLegs, ZigZag.anchor)
                    ZigZag.anchor = ZigZag.highest
                    ZigZag.lowest = p
                    ZigZag.highest = nil
                    ZigZag.lastHigh = nil
                    ZigZag.lastLow = nil
                    ZigZag.state = "DOWN"
                    return
                end
            end
            ZigZag.lastLow = p
        end
    elseif ZigZag.state == "DOWN" then
        if p.type == "LOW" then
            if ZigZag.lowest == nil or p.price <= ZigZag.lowest.price then
                ZigZag.lowest = p
                ZigZag.lastHigh = nil
                ZigZag.lastLow = nil
            else
                ZigZag.lastLow = p
            end
        elseif p.type == "HIGH" then
            if ZigZag.lowest ~= nil and ZigZag.lastLow ~= nil and ZigZag.lastHigh ~= nil then
                if p.price > ZigZag.lastHigh.price then
                    table.insert(ZigZag.confirmedLegs, ZigZag.anchor)
                    ZigZag.anchor = ZigZag.lowest
                    ZigZag.highest = p
                    ZigZag.lowest = nil
                    ZigZag.lastHigh = nil
                    ZigZag.lastLow = nil
                    ZigZag.state = "UP"
                    return
                end
            end
            ZigZag.lastHigh = p
        end
    end
end

-- Добавление нового закрытого бара в историю
function ZigZag.PushBar(high, low, barTime)
    if not high or not low or high == 0 or low == 0 then return end

    local c = {}
    c.high = high
    c.low  = low
    c.time = barTime or #ZigZag.candles + 1
    table.insert(ZigZag.candles, c)

    local n = #ZigZag.candles
    if n < 5 then return end

    local idx = n - 2
    local hTarget = ZigZag.candles[idx].high
    local lTarget = ZigZag.candles[idx].low

    local isUp = (hTarget > ZigZag.candles[idx - 2].high and
                  hTarget > ZigZag.candles[idx - 1].high and
                  hTarget > ZigZag.candles[idx + 1].high and
                  hTarget > ZigZag.candles[idx + 2].high)

    local isDown = (lTarget < ZigZag.candles[idx - 2].low and
                    lTarget < ZigZag.candles[idx - 1].low and
                    lTarget < ZigZag.candles[idx + 1].low and
                    lTarget < ZigZag.candles[idx + 2].low)

    if isUp then
        local p = {}
        p.idx   = idx
        p.time  = ZigZag.candles[idx].time
        p.price = hTarget
        p.type  = "HIGH"

        local rawCount = #ZigZag.rawPivots
        if rawCount == 0 then
            table.insert(ZigZag.rawPivots, p)
            ProcessPivot(p)
        elseif ZigZag.rawPivots[rawCount].type == "HIGH" then
            if p.price > ZigZag.rawPivots[rawCount].price then
                ZigZag.rawPivots[rawCount] = p
                ProcessPivot(p)
            end
        else
            table.insert(ZigZag.rawPivots, p)
            ProcessPivot(p)
        end
    end

    if isDown then
        local p = {}
        p.idx   = idx
        p.time  = ZigZag.candles[idx].time
        p.price = lTarget
        p.type  = "LOW"

        local rawCount = #ZigZag.rawPivots
        if rawCount == 0 then
            table.insert(ZigZag.rawPivots, p)
            ProcessPivot(p)
        elseif ZigZag.rawPivots[rawCount].type == "LOW" then
            if p.price < ZigZag.rawPivots[rawCount].price then
                ZigZag.rawPivots[rawCount] = p
                ProcessPivot(p)
            end
        else
            table.insert(ZigZag.rawPivots, p)
            ProcessPivot(p)
        end
    end
end

-- Получить финальный список пивотов макроструктуры
function ZigZag.GetPivots()
    local res = {}
    for i = 1, #ZigZag.confirmedLegs do
        table.insert(res, ZigZag.confirmedLegs[i])
    end

    if ZigZag.anchor ~= nil then
        local already = false
        for i = 1, #res do
            if res[i] == ZigZag.anchor then
                already = true
                break
            end
        end
        if not already then
            table.insert(res, ZigZag.anchor)
        end
    end

    local finalP = nil
    if ZigZag.state == "UP" and ZigZag.highest ~= nil then
        finalP = ZigZag.highest
    elseif ZigZag.state == "DOWN" and ZigZag.lowest ~= nil then
        finalP = ZigZag.lowest
    end

    if finalP ~= nil then
        local already = false
        for i = 1, #res do
            if res[i] == finalP then
                already = true
                break
            end
        end
        if not already then
            table.insert(res, finalP)
        end
    end

    return res
end

return ZigZag
