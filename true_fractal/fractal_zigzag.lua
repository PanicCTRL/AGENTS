-- fractal_zigzag.lua
-- Модуль фрактального Зиг-Зага (Коробочка №1).
-- Чистые 5-баровые фракталы Вильямса со сквозной памятью истории.
-- Строгое чередование вершин и низин: HIGH -> LOW -> HIGH -> LOW.
-- Кодировка: Windows-1251. Без зависимостей от внешних библиотек.

local ZigZag = {}
ZigZag.candles = {}
ZigZag.pivots  = {}
ZigZag.lastType = nil

function ZigZag.Init()
    ZigZag.candles  = {}
    ZigZag.pivots   = {}
    ZigZag.lastType = nil
end

-- Добавление нового закрытого бара в историю
-- high, low: цены бара
-- barTime: время/дата бара
function ZigZag.PushBar(high, low, barTime)
    if not high or not low or high == 0 or low == 0 then return end

    local c = {}
    c.high = high
    c.low  = low
    c.time = barTime or #ZigZag.candles + 1
    table.insert(ZigZag.candles, c)

    local n = #ZigZag.candles
    if n < 5 then return end

    -- Проверка фрактала на баре idx = n - 2 (2 бара слева, 2 справа)
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

        if #ZigZag.pivots == 0 then
            table.insert(ZigZag.pivots, p)
            ZigZag.lastType = "HIGH"
        elseif ZigZag.lastType == "HIGH" then
            if p.price > ZigZag.pivots[#ZigZag.pivots].price then
                ZigZag.pivots[#ZigZag.pivots] = p
            end
        else
            table.insert(ZigZag.pivots, p)
            ZigZag.lastType = "HIGH"
        end
    end

    if isDown then
        local p = {}
        p.idx   = idx
        p.time  = ZigZag.candles[idx].time
        p.price = lTarget
        p.type  = "LOW"

        if #ZigZag.pivots == 0 then
            table.insert(ZigZag.pivots, p)
            ZigZag.lastType = "LOW"
        elseif ZigZag.lastType == "LOW" then
            if p.price < ZigZag.pivots[#ZigZag.pivots].price then
                ZigZag.pivots[#ZigZag.pivots] = p
            end
        else
            table.insert(ZigZag.pivots, p)
            ZigZag.lastType = "LOW"
        end
    end
end

function ZigZag.GetPivots()
    return ZigZag.pivots
end

return ZigZag