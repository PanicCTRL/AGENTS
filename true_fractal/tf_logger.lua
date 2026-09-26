-- tf_logger.lua
-- Модуль двухуровневого логирования для true_fractal.lua

user_path    = getScriptPath() .. "\\tf_user_log.txt"
debug_path   = getScriptPath() .. "\\tf_debug_log.txt"

local function GetFracStr()
    if fractals and #fractals > 0 then return GetFracStr() end
    local upStr = (fractal_up and #fractal_up > 0) and ("up=[" .. table.concat(fractal_up, ", ") .. "]") or "up=[]"
    local dnStr = (fractal_down and #fractal_down > 0) and ("down=[" .. table.concat(fractal_down, ", ") .. "]") or "down=[]"
    return upStr .. " " .. dnStr
end

function LogStart()
    local sl_steps = (step and step > 0) and (slOffset / step) or 0
    local tp_steps = (step and step > 0) and (tpOffset / step) or 0

    WriteLog(user_path, "=== ЗАПУСК РОБОТА === | period_time = " .. period_time .. "; operation = " .. operation .. "; sec_code = " .. sec_code .. "; quantity = " .. quantity, false)
    WriteLog(user_path, "									| " .. "Стоп = " .. slOffset .. " п, " .. string.format("%.0f", sl_steps) .. " шагов; " .. "Тейк = " .. tpOffset .. " п, " .. string.format("%.0f", tp_steps) .. " шагов.", true)
    WriteLog(debug_path, "=== ЗАПУСК DEBUG === | period_time = " .. period_time .. "; operation = " .. operation .. "; sec_code = " .. sec_code, false)
    if FlushLogs then FlushLogs() end
end

function LogStartFractals()
    WriteLog(user_path, "             Загружено фракталов из файла: " .. GetFracStr(), false)
    WriteLog(debug_path, "             Загружено фракталов из файла: " .. GetFracStr(), false)
    if FlushLogs then FlushLogs() end
end

function LogFractal(f, dir)
    WriteLog(debug_path, "              Найден фрактал " .. (dir or "вверх") .. " | f=" .. f .. " fractals=[" .. GetFracStr() .. "]", false)
end

function LogCross(f, direction)
    local dirStr = direction and (" (" .. direction .. ")") or ""
    WriteLog(debug_path, "                Пересечение уровня | f=" .. f .. dirStr .. " prevPrice=" .. prevPrice .. " currentPrice=" .. currentPrice, false)
end

function LogReset(f)
    WriteLog(debug_path, "             Сброс на новый фрактал | new_f=" .. f .. " lastFractal=" .. lastFractal .. " count_t=" .. count_trades .. " count_v=" .. count_trades, false)
end

function LogTradeOpen()
    local fracStr = GetFracStr()
    WriteLog(user_path, "                    Открытие позиции | f=" .. startPrice .. " count_t=" .. count_t, false)
    WriteLog(user_path, "									| fractals=[" .. fracStr .. "]", true)

    local real_stop = (operation == "B") and (startPrice - slOffset) or (startPrice + slOffset)
    local real_take = (operation == "B") and (startPrice + tpOffset) or (startPrice - tpOffset)
    WriteLog(debug_path, "          Открытие реальной сделки | startPrice=" .. startPrice .. " real_stop=" .. real_stop .. " real_take=" .. real_take .. " count_t=" .. count_t, false)
end

function LogVirtOpen()
    WriteLog(debug_path, "       Открытие виртуальной сделки | startPrice=" .. startPrice .. " virt_stop=" .. virt_stop .. " virt_take=" .. virt_take .. " count_v=" .. count_v, false)
end

function LogVirtClose()
    WriteLog(debug_path, "       Закрытие виртуальной сделки | currentPrice=" .. currentPrice .. " virt_stop=" .. virt_stop .. " virt_take=" .. virt_take .. " virt=false", false)
end

function LogOrderSent(op, sec, price_str, qty)
    local opText = (op == "B") and "покупку" or "продажу"
    WriteLog(user_path, string.format("Заявка на %s %s %s в кол-ве %s шт.", opText, sec, price_str, qty), false)
    if FlushLogs then FlushLogs() end
end

function LogBracketSent(op, sec, qty, tp_str, sl_str)
    local opText = (op == "B") and "покупку" or "продажу"
    WriteLog(user_path, string.format("Выставлен брекет на %s %s шт %s. Тейк-профит: %s, Стоп-лосс: %s", opText, qty, sec, tp_str, sl_str), false)
    if FlushLogs then FlushLogs() end
end

function LogStopSent(price_kind, op, qty, sec, stop_str, price_str)
    WriteLog(user_path, string.format("Выставлен %s стоплосс на %s %s шт %s. Цена срабатывания: %s; планка: %s", price_kind, op, qty, sec, stop_str, price_str), false)
    if FlushLogs then FlushLogs() end
end

function LogTransactionError(err_msg)
    WriteLog(user_path, "             Ошибка транзакции. См. сообщение.", true)
    WriteLog(debug_path, "          ОШИБКА ТРАНЗАКЦИИ: " .. tostring(err_msg), true)
    if FlushLogs then FlushLogs() end
end

function LogTradeFill(trade_price, planned_price, qty)
    local slip = math.abs(trade_price - planned_price)
    WriteLog(user_path, string.format("             Исполнен вход: факт=%.1f (план=%.1f | проскальзывание=%.1f п.) | лот=%s", trade_price, planned_price, slip, tostring(qty)), false)
    WriteLog(debug_path, string.format("          Сделка ВХОД | факт=%.1f план=%.1f slip=%.1f qty=%s", trade_price, planned_price, slip, tostring(qty)), false)
    if FlushLogs then FlushLogs() end
end

function LogManualClose(start_p, stop_p)
    WriteLog(user_path, string.format("             [ВЫХОД: РУЧНОЕ ЗАКРЫТИЕ] | startPrice=%s stop_price=%s", tostring(start_p), tostring(stop_p)), true)
    WriteLog(debug_path, string.format("          Ручное закрытие пользователем | startPrice=%s stop_price=%s", tostring(start_p), tostring(stop_p)), false)
    if FlushLogs then FlushLogs() end
end

function LogTradeClose(profit, pnl_pts, pnl_steps)
    local tag = profit and "[ВЫХОД: ТЕЙК-ПРОФИТ]" or "[ВЫХОД: СТОП-ЛОСС]"
    local exit_p = avg_close > 0 and avg_close or currentPrice
    WriteLog(user_path, string.format("             %s | выход=%.1f | прибыль сделки = %+.1f пунктов (%+.1f шагов)", tag, exit_p, pnl_pts, pnl_steps), false)
    WriteLog(user_path, string.format("             прибыль ИТОГО = %+.1f пунктов (%+.1f шагов)", pnl_session_pts, pnl_session_steps), false)
    WriteLog(user_path, string.format("             ИТОГО ДНЕВНАЯ = %+.1f пунктов (%+.1f шагов)", pnl_day_pts, pnl_day_steps), false)
    if FlushLogs then FlushLogs() end
end

function LogStop()
    WriteLog(user_path, "=== ОСТАНОВКА РОБОТА ПОЛЬЗОВАТЕЛЕМ ===", false)
    WriteLog(debug_path, "=== ОСТАНОВКА DEBUG ===", false)
    if FlushLogs then FlushLogs() end
end