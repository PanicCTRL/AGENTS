-- Подпрограмма для fractal_wrong.lua -- fractal_logic.lua 
-- Расчет интервалов, экстремумов и фракталов Билла Вильямса

function CheckTimer()
    local current_time = os.time()
    if end_time == 0 then end_time = current_time + period_time end
    if current_time >= end_time then end_time = 0 return true end    
    return false     -- Интервал ещё тикает
end

function UpdateLimits()
    if low_price == 0 then low_price = currentPrice end
    if currentPrice > up_price then up_price = currentPrice end
    if currentPrice < low_price then low_price = currentPrice end
end

function ResetLimits()
    up_price, low_price = 0, 0
end

function FractalTransfer(text)
    local f = io.open(file, "w") 
    if f then
        f:write(text .. "\n")
        f:close()
    end
end

function PushPrice()
    -- Пропускаем запись, если за интервал не было сделок
    if up_price == 0 then return end

    table.insert(maxPrices, up_price)
    if #maxPrices > 5 then
        table.remove(maxPrices, 1)
    end

    table.insert(minPrices, low_price)
    if #minPrices > 5 then
        table.remove(minPrices, 1)
    end
end

function GetFractal()
    if #maxPrices < 5 or #minPrices < 5 then return end

    -- ФРАКТАЛ ВВЕРХ
    if maxPrices[3] > maxPrices[1] and maxPrices[3] > maxPrices[2] and 
       maxPrices[3] > maxPrices[4] and maxPrices[3] > maxPrices[5] then
        table.insert(fractals, maxPrices[3])
        if #fractals > 6 then
            table.remove(fractals, 1)
        end
        LogFractal(maxPrices[3], "вверх")
    end

    -- ФРАКТАЛ ВНИЗ
    if minPrices[3] < minPrices[1] and minPrices[3] < minPrices[2] and 
       minPrices[3] < minPrices[4] and minPrices[3] < minPrices[5] then
        table.insert(fractals, minPrices[3])
        if #fractals > 6 then
            table.remove(fractals, 1)
        end
        LogFractal(minPrices[3], "вниз")
    end
end
