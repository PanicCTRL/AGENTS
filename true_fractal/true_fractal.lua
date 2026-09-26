-- Главный каркас робота -- true_fractal.lua
-- Брокер Сбербанк, QUIK v.11.x, Lua 5.1

firm_id       = "SPBFUT0002E"  -- Срочный рынок
trade_type			= "M"            -- Лимитная заявка (L) или рыночная (M)
class_code    = "SPBFUT"       -- Код класса
sec_code      = "MXU6"         -- Код инструмента
client_code   = "762157N"      -- Код клиента

operation			= "B"				-- Торгуем только шорт или лонг
quantity			= "1"

slSlippage			= 25
slOffset			= 75
tpOffset			= 1050

count_trades		= 4					-- Количество разрешённых сделок
count_t 		    = count_trades
count_v 		    = count_trades

period_time  = 60    -- Время бара (1 мин = 60 сек)
end_time     = 0     -- Время окончания бара
file         = getScriptPath() .. "\\frc_value.txt"

maxPrices    = {}    -- Таблица максимумов последних 5 свечей
minPrices    = {}    -- Таблица минимумов последних 5 свечей
fractal_up   = {}    -- Таблица найденных последних верхних фракталов (сопротивления)
fractal_down = {}    -- Таблица последних нижних фракталов (поддержки)

low_price    = 0
up_price     = 0
currentPrice = 0
prevPrice    = 0
startPrice   = 0
lastFractal  = 0

opn			        = false
stopRpcd		    = false -- Использовать переменную в логике треилстопа когда будет добавлен.

virt                = false
virt_stop           = 0
virt_take           = 0

stop_price 			= 0
take_price			= 0
is_run              = true

orderDone           = false
tradeDone           = false

avg_open   = 0
avg_close  = 0
open_cost  = 0
open_qty   = 0
close_cost = 0
close_qty  = 0
pnl_session_pts   = 0
pnl_session_steps = 0
pnl_day_pts       = 0
pnl_day_steps     = 0

price_limit = 0
limitUp     = 0
limitDown   = 0

function CountDecimals(n)
    local str = string.format("%g", n)
    local _, decimalPart = str:match("(%.(.*))$")
    if decimalPart then
        return #decimalPart
    else
        return 0
    end
end

dofile(getScriptPath() .. "\\tf_read_n_writers.lua")
dofile(getScriptPath() .. "\\tf_logger.lua")
dofile(getScriptPath() .. "\\split_f_logic.lua")
dofile(getScriptPath() .. "\\tf_sendtransaction_spbfut.lua")
dofile(getScriptPath() .. "\\tf_killstop.lua")
dofile("Y:\\Knowledge\\best_practices\\alltrade_reconnect_filter.lua")

step = tonumber(getParamEx(class_code, sec_code, "SEC_PRICE_STEP").param_value)
if not step or step == 0 then
	error("TrueFractal: не удалось получить SEC_PRICE_STEP для " .. sec_code)
end
dec = CountDecimals(step)

function VirtualPos()
    if not virt then return false end

    if operation == "B" then
        if currentPrice >= virt_stop or currentPrice <= virt_take then
            LogVirtClose()
            virt = false
            return false
        end
        return true
    else
        if currentPrice <= virt_stop or currentPrice >= virt_take then
            LogVirtClose()
            virt = false
            return false
        end
        return true
    end
end

function OpenVirt()
    if not virt and count_v > 0 then
        virt = true
        count_v = count_v - 1

        if operation == "B" then
            virt_stop = startPrice + slOffset
            virt_take = startPrice - tpOffset
        else
            virt_stop = startPrice - slOffset
            virt_take = startPrice + tpOffset
        end

        LogVirtOpen()
    end
end

function Trade()
    if opn or pendOrder then return end

    if count_t > 0 then
        LogTradeOpen()
        SendOrder(sec_code, class_code)
        count_t = count_t - 1
    end
end

function FinalizeTrade()
    local open_pos  = (avg_open  > 0) and avg_open  or startPrice
    local close_pos = (avg_close > 0) and avg_close or currentPrice
    local profit = false
    if take_price > 0 then
        profit = (operation == "B" and close_pos >= take_price)
              or (operation == "S" and close_pos <= take_price)
    end

    local pnl_pts   = 0
    local pnl_steps = 0
    if open_pos > 0 and close_pos > 0 then
        if operation == "B" then
            pnl_pts = close_pos - open_pos
        else
            pnl_pts = open_pos - close_pos
        end
        pnl_steps = pnl_pts / step
    end
    pnl_session_pts   = pnl_session_pts + pnl_pts
    pnl_session_steps = pnl_session_steps + pnl_steps
    pnl_day_pts       = pnl_day_pts + pnl_pts
    pnl_day_steps     = pnl_day_steps + pnl_steps
    Write_pnl_day(pnl_day_pts, pnl_day_steps)
    LogTradeClose(profit, pnl_pts, pnl_steps)

    open_cost, open_qty, avg_open    = 0, 0, 0
    close_cost, close_qty, avg_close = 0, 0, 0
    up_price, low_price              = 0, 0
    opn                              = false
    pendBrkt                         = false
    pendKill                         = false
    orderDone                        = false
    tradeDone                        = false
end

function LevelCross()
    if prevPrice == 0 or (#fractal_down == 0 and #fractal_up == 0) then return end

    virt = VirtualPos()

    if not opn and not virt and count_t == 0 and count_v == 0 then
        startPrice = 0
    end

    -- 1. Пробой НИЖНЕГО фрактала (поддержки) СНИЗУ ВВЕРХ -> вход в LONG
    for i = 1, #fractal_down do
        local f = fractal_down[i]
        local crossLowerUp = (prevPrice < f and currentPrice >= f)

        if crossLowerUp then
            if f ~= lastFractal and not opn and not virt then
                LogReset(f)
                startPrice  = f
                lastFractal = f
                count_t     = count_trades
                count_v     = count_trades
            end

            if f == startPrice then
                LogCross(f, "СНИЗУ ВВЕРХ (ОТ НИЖНЕГО ФРАКТАЛА)")
                if not opn and count_t > 0 then
                    Trade()
                end
            end
        end
    end

    -- 2. Пробой ВЕРХНЕГО фрактала (сопротивления) СВЕРХУ ВНИЗ -> вход в SHORT
    for i = 1, #fractal_up do
        local f = fractal_up[i]
        local crossUpperDown = (prevPrice > f and currentPrice <= f)

        if crossUpperDown then
            if f ~= lastFractal and not opn and not virt then
                LogReset(f)
                startPrice  = f
                lastFractal = f
                count_t     = count_trades
                count_v     = count_trades
            end

            if f == startPrice then
                LogCross(f, "СВЕРХУ ВНИЗ (ОТ ВЕРХНЕГО ФРАКТАЛА)")
                if not virt and count_v > 0 then
                    OpenVirt()
                end
            end
        end
    end
end

function OnOrder(order)
	if order.sec_code ~= sec_code or order.class_code ~= class_code then return end
	if bit.band(order.flags, 1) ~= 0 or order.uid == 0 or order.balance ~= 0 then return end
	if order.linkedorder == 0 then	-- не стоплосс
		if not opn then				-- Позиция открыта
			if startPrice > 0 then SendBracket(sec_code, class_code) end
			up_price, low_price = 0, 0
			opn = true; pendOrder = false; pendKill = false
		else						-- Позиция закрыта пользователем
			LogManualClose(startPrice, stop_price)
			KillStop()
			startPrice, up_price, low_price, count_t = 0, 0, 0, 0
			opn = false; pendKill = false
		end
	else							-- Позиция закрыта по стопу/тейку
        orderDone = true
        if tradeDone then
            FinalizeTrade()
        end
	end
end

function OnTrade(trade)
    if trade.sec_code ~= sec_code or trade.class_code ~= class_code then return end

    local isBuy  = (bit.band(trade.flags, 4) == 0)
    local isSell = (bit.band(trade.flags, 4) > 0)

    if (operation == "B" and isBuy) or (operation == "S" and isSell) then
        open_cost = open_cost + trade.price * trade.qty
        open_qty  = open_qty  + trade.qty
        avg_open  = open_cost / open_qty
        LogTradeFill(trade.price, startPrice, trade.qty)
    end

    if (operation == "B" and isSell) or (operation == "S" and isBuy) then
        close_cost = close_cost + trade.price * trade.qty
        close_qty  = close_qty  + trade.qty
        avg_close  = close_cost / close_qty

        tradeDone = true
        if orderDone then
            FinalizeTrade()
        end
    end
end

function OnAllTrade(alltrade)
    if alltrade.class_code ~= class_code or alltrade.sec_code ~= sec_code then return end
    if not CheckTradeFreshness(alltrade) then return end
    if alltrade.price == currentPrice then return end
    prevPrice = currentPrice
    currentPrice = alltrade.price
    UpdateLimits()
    LevelCross()
end 

function OnDisconnected()
    message("Нет связи с сервером.", 2)
end

function OnConnected(flag)
    message("Соединение с сервером восстановлено.", 1)
end

function OnStop()
    is_run = false
    LogStop()
    FlushLogs()
    return 3000
end

function main()
    LogStart()
    pnl_day_pts, pnl_day_steps = Read_pnl_day()
    fractals = Read_frc(file)
    if #fractals > 0 then LogStartFractals() end
    while is_run do
        FlushLogs()
        local rawUp   = tonumber(getParamEx(class_code, sec_code, "PRICEMAX").param_value) or 0
        local rawDown = tonumber(getParamEx(class_code, sec_code, "PRICEMIN").param_value) or 0

        limitUp   = tonumber(string.format("%." .. dec .. "f", rawUp))
        limitDown = tonumber(string.format("%." .. dec .. "f", rawDown))

        price_limit = (operation == "B") and limitDown or limitUp
        if CheckTimer() then
            PushPrice()
            GetFractal()
            
            local maxStr = table.concat(maxPrices, ", ")
            local minStr = table.concat(minPrices, ", ")
            local upStr   = table.concat(fractal_up, ", ")
            local downStr = table.concat(fractal_down, ", ")
            local fracStr = "up=[" .. upStr .. "] down=[" .. downStr .. "]"
            
            frc_value = upStr .. " | " .. downStr
            if #fractal_up > 0 or #fractal_down > 0 then
                FractalTransfer(frc_value)
            end

            ResetLimits()
        end
        
        FlushLogs()
        sleep(5000)
    end
end
