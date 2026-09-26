-- frc_read_n_writers.lua
-- Запись в лог, чтение фракталов и дневного P&L из файла

pnl_day_file = getScriptPath() .. "\\pnl_day.txt"

log_queue = {}  -- Очередь сообщений для быстрой записи из коллбэков

function WriteLog(path, text, noPrefix)
    if not path or not text then return end
    local tradeDate = getInfoParam("TRADEDATE") or ""
    local serverTime = getInfoParam("SERVERTIME")
    local logTime = serverTime
    if not serverTime or serverTime == "" then
        logTime = os.date("%H:%M:%S")
    end

    -- Мгновенно сохраняем в память без обращения к диску
    table.insert(log_queue, {
        path      = path,
        text      = text,
        noPrefix  = noPrefix,
        tradeDate = tradeDate,
        logTime   = logTime
    })
end

function FlushLogs()
    if #log_queue == 0 then return end

    for i = 1, #log_queue do
        local item = log_queue[i]
        local f = io.open(item.path, "a")
        if f then
            if item.noPrefix then
                f:write(item.text .. "\n")
            else
                local prefix = string.format("%s;%s;", item.tradeDate, item.logTime)
                f:write(prefix .. item.text .. "\n")
            end
            f:close()
        end
    end
    log_queue = {}
end

function Read_frc(filePath)
    local result = {}
    local f = io.open(filePath, "r")
    if f then
        local line = f:read("*line")
        f:close()
        if line and line ~= "" then
            for val in string.gmatch(line, "%S+") do
                local num = tonumber(val)
                if num then table.insert(result, num) end
            end
        end
    end
    return result
end

function Read_pnl_day()
    local today = os.date("%d.%m.%Y")
    local f = io.open(pnl_day_file, "r")
    if not f then return 0, 0 end
    
    local line = f:read("*line")
    f:close()
    if not line or line == "" then return 0, 0 end
    
    local d, pts, stp = line:match("([^;]+);([^;]+);([^;]+)")
    if d == today then
        return tonumber(pts) or 0, tonumber(stp) or 0
    else
        return 0, 0
    end
end

function Write_pnl_day(pts, stp)
    local today = os.date("%d.%m.%Y")
    local f = io.open(pnl_day_file, "w")
    if f then
        f:write(string.format("%s;%.1f;%.1f\n", today, pts, stp))
        f:close()
    end
end