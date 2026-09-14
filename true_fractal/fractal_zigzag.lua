-- fractal_zigzag.lua
-- Модуль канонического Зиг-Зага TradingView (Коробочка №1).
-- Построение чередующихся свингов по величине отклонения цены (Deviation = 0.9%).
-- Поддержка проекции текущего активного луча (projected pivots).
-- Кодировка: Windows-1251. Без внешних зависимостей.

local ZigZag = {}
ZigZag.devPercent = 0.9
ZigZag.minSwingPts = nil
ZigZag.trend = 0
ZigZag.currHigh = 0
ZigZag.currHighIdx = 0
ZigZag.currHighTime = ""
ZigZag.currLow = 0
ZigZag.currLowIdx = 0
ZigZag.currLowTime = ""
ZigZag.pivots = {}
ZigZag.barCount = 0

function ZigZag.Init(devPercent, minSwingPts)
    ZigZag.devPercent = devPercent or 0.9
    ZigZag.minSwingPts = minSwingPts
    ZigZag.trend = 0
    ZigZag.currHigh = 0
    ZigZag.currHighIdx = 0
    ZigZag.currHighTime = ""
    ZigZag.currLow = 0
    ZigZag.currLowIdx = 0
    ZigZag.currLowTime = ""
    ZigZag.pivots = {}
    ZigZag.barCount = 0
end

-- Добавление нового закрытого бара и расчет канонического Зиг-Зага
function ZigZag.PushBar(high, low, barTime)
    if not high or not low or high == 0 or low == 0 then return end
    ZigZag.barCount = ZigZag.barCount + 1
    local i = ZigZag.barCount
    local t = barTime or tostring(i)

    if ZigZag.barCount == 1 then
        ZigZag.currHigh = high
        ZigZag.currHighIdx = i
        ZigZag.currHighTime = t
        ZigZag.currLow = low
        ZigZag.currLowIdx = i
        ZigZag.currLowTime = t
        return
    end

    local devHigh = ZigZag.minSwingPts or (ZigZag.currHigh * (ZigZag.devPercent / 100.0))
    local devLow  = ZigZag.minSwingPts or (ZigZag.currLow * (ZigZag.devPercent / 100.0))

    if ZigZag.trend == 0 then
        if (high - ZigZag.currLow) >= devLow then
            local p = {}
            p.type = "LOW"
            p.price = ZigZag.currLow
            p.idx = ZigZag.currLowIdx
            p.time = ZigZag.currLowTime
            table.insert(ZigZag.pivots, p)
            ZigZag.trend = 1
            ZigZag.currHigh = high
            ZigZag.currHighIdx = i
            ZigZag.currHighTime = t
        elseif (ZigZag.currHigh - low) >= devHigh then
            local p = {}
            p.type = "HIGH"
            p.price = ZigZag.currHigh
            p.idx = ZigZag.currHighIdx
            p.time = ZigZag.currHighTime
            table.insert(ZigZag.pivots, p)
            ZigZag.trend = -1
            ZigZag.currLow = low
            ZigZag.currLowIdx = i
            ZigZag.currLowTime = t
        else
            if high > ZigZag.currHigh then
                ZigZag.currHigh = high
                ZigZag.currHighIdx = i
                ZigZag.currHighTime = t
            end
            if low < ZigZag.currLow then
                ZigZag.currLow = low
                ZigZag.currLowIdx = i
                ZigZag.currLowTime = t
            end
        end

    elseif ZigZag.trend == 1 then
        if high >= ZigZag.currHigh then
            ZigZag.currHigh = high
            ZigZag.currHighIdx = i
            ZigZag.currHighTime = t
        elseif (ZigZag.currHigh - low) >= devHigh then
            local p = {}
            p.type = "HIGH"
            p.price = ZigZag.currHigh
            p.idx = ZigZag.currHighIdx
            p.time = ZigZag.currHighTime
            table.insert(ZigZag.pivots, p)
            ZigZag.trend = -1
            ZigZag.currLow = low
            ZigZag.currLowIdx = i
            ZigZag.currLowTime = t
        end

    elseif ZigZag.trend == -1 then
        if low <= ZigZag.currLow then
            ZigZag.currLow = low
            ZigZag.currLowIdx = i
            ZigZag.currLowTime = t
        elseif (high - ZigZag.currLow) >= devLow then
            local p = {}
            p.type = "LOW"
            p.price = ZigZag.currLow
            p.idx = ZigZag.currLowIdx
            p.time = ZigZag.currLowTime
            table.insert(ZigZag.pivots, p)
            ZigZag.trend = 1
            ZigZag.currHigh = high
            ZigZag.currHighIdx = i
            ZigZag.currHighTime = t
        end
    end
end

-- Получить список подтвержденных пивотов (+ опционально завершающий незакрытый луч)
function ZigZag.GetPivots(includeProjected)
    local res = {}
    for i = 1, #ZigZag.pivots do
        table.insert(res, ZigZag.pivots[i])
    end

    if includeProjected ~= false then
        if ZigZag.trend == 1 then
            local p = {}
            p.type = "HIGH"
            p.price = ZigZag.currHigh
            p.idx = ZigZag.currHighIdx
            p.time = ZigZag.currHighTime
            p.projected = true
            table.insert(res, p)
        elseif ZigZag.trend == -1 then
            local p = {}
            p.type = "LOW"
            p.price = ZigZag.currLow
            p.idx = ZigZag.currLowIdx
            p.time = ZigZag.currLowTime
            p.projected = true
            table.insert(res, p)
        end
    end

    return res
end

return ZigZag
