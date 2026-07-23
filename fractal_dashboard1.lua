---@diagnostic disable: lowercase-global, undefined-global

-- Конфигурация робота
path            = getScriptPath().."\\test_dashboard_2.txt" -- Новый файл-панель

sec_code		= "SBER"           		-- Текущий актив
class_code		= "QJSIM"        		-- Класс инструментов
firm_id 		= "NC0011100000"   		-- Торговый счет
client_code 	= "1004"         		-- Код клиента 
trdaccid		= "NL0011100043"		-- Торговый аккаунт

timeframe       = 300                    -- Временной период в секундах

-- Переменные в памяти для дашборда
last_fractal_prices = {0, 0, 0, 0}
last_fractal_times  = {"00:00:00", "00:00:00", "00:00:00", "00:00:00"}
start_time_str      = os.date("%H:%M:%S")

local highs = {}
local lows  = {}
local times = {}

local current_minute_start = nil
local current_high = 0
local current_low = 0

function OnAllTrade(alltrade)
	if alltrade.sec_code ~= sec_code or alltrade.class_code ~= class_code then return end
	
	local price = alltrade.price
	local trade_time = os.time(alltrade.datetime)
	local minute_start = trade_time - (trade_time % timeframe)
	
	if not current_minute_start then
		current_minute_start = minute_start
		current_high = price
		current_low = price
		updateDashboard()
		
	elseif minute_start > current_minute_start then
		-- Закрытие минуты
		table.insert(highs, current_high)
		table.insert(lows, current_low)
		table.insert(times, current_minute_start)
		
		if #highs > 5 then
			table.remove(highs, 1)
			table.remove(lows, 1)
			table.remove(times, 1)
		end
		
		if #highs == 5 then
			checkFractals()
		end
		
		updateDashboard()
		
		current_minute_start = minute_start
		current_high = price
		current_low = price
	else
		-- Обновление текущей минуты
		if price > current_high then current_high = price end
		if price < current_low then current_low = price end
	end
end

function addFractal(val, f_time)
	-- Сдвигаем цены
	table.insert(last_fractal_prices, 1, val)
	table.remove(last_fractal_prices, 5)
	
	-- Сдвигаем время
	local dt = os.date("*t", f_time)
	local time_str = string.format("%02d:%02d:%02d", dt.hour, dt.min, dt.sec)
	table.insert(last_fractal_times, 1, time_str)
	table.remove(last_fractal_times, 5)
end

function checkFractals()
	local h = highs[3]
	local l = lows[3]
	local t = times[3]
	
	if h > highs[1] and h > highs[2] and h > highs[4] and h > highs[5] then
		addFractal(h, t)
	end
	
	if l < lows[1] and l < lows[2] and l < lows[4] and l < lows[5] then
		addFractal(l, t)
	end
end

function updateDashboard()
	local f = io.open(path, "w")
	if not f then return end
	
	local h_str = "high     |"
	for i = 1, #highs do h_str = h_str .. string.format(" %g |", highs[i]) end
	
	local l_str = "low      |"
	for i = 1, #lows do l_str = l_str .. string.format(" %g |", lows[i]) end
	
	local f_str = string.format("fractals | %g || %g || %g || %g |", 
		last_fractal_prices[1], last_fractal_prices[2], last_fractal_prices[3], last_fractal_prices[4])
		
	local t_str = string.format("time     |%s||%s||%s||%s|", 
		last_fractal_times[1], last_fractal_times[2], last_fractal_times[3], last_fractal_times[4])
	
	f:write(h_str .. "\n")
	f:write(l_str .. "\n")
	f:write(f_str .. "\n")
	f:write(t_str .. "\n\n")
	
	f:write("[Память обновлена\tв: " .. os.date("%H:%M:%S") .. "]\n")
	f:write("[Запись начата\t\tв: " .. start_time_str .. "]\n")
	f:close()
end

function main()
	while true do
		sleep(1000)
	end
end