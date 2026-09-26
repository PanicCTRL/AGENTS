-- tf_sendtransaction_spbfut.lua
-- Функции отправки транзакций, таблицы транзакций для true_fractal.lua
 
pendOrder		= false
pendBrkt		= false
pendStop		= false

--===================================== СРОЧНЫЙ РЫНОК ============================================--
tx = {}

tx.ACCOUNT		= firm_id		-- Для срочного рынка
tx.CLIENT_CODE	= client_code	-- Для срочного рынка
tx.TYPE			= trade_type
tx.TRANS_ID		= "5678"
tx.CLASSCODE	= "SPBFUT"
tx.SECCODE		= sec_code
tx.ACTION		= "NEW_ORDER"
 
--================================= СРОЧНЫЙ РЫНОК STOPLOSS =======================================--
  
sl = {} 

sl.SECCODE      = sec_code 
sl.CLASSCODE    = class_code
sl.ACCOUNT      = firm_id
sl.CLIENT_CODE  = client_code
sl.ACTION       = "NEW_STOP_ORDER"
sl.TRANS_ID     = "1112" 

--=================================== СРОЧНЫЙ РЫНОК BRACKET ======================================--
bk = {}  

bk.SECCODE              = sec_code  
bk.CLASSCODE            = class_code
bk.ACCOUNT              = firm_id  
bk.CLIENT_CODE          = client_code  
bk.ACTION               = "NEW_STOP_ORDER"  
bk.STOP_ORDER_KIND      = "TAKE_PROFIT_AND_STOP_LIMIT_ORDER"
bk.PRICE                = "0"
bk.MARKET_TAKE_PROFIT   = "YES"
bk.MARKET_STOP_LIMIT    = "YES"
bk.OFFSET               = "0"
bk.OFFSET_UNITS         = "PERCENTS"
bk.SPREAD               = "0"
bk.SPREAD_UNITS         = "PERCENTS"
bk.TRANS_ID             = "910"

function SendOrder(sec_code, class_code)
	tx.OPERATION	= operation
	tx.QUANTITY		= quantity
	tx.PRICE		= "0"
	
    local res = sendTransaction(tx)
    if res == "" then
        pendOrder = true
        local price_str = (tx.PRICE == "0") and "по рыночной цене" or ("по цене " .. tx.PRICE)
        LogOrderSent(tx.OPERATION, sec_code, price_str, tx.QUANTITY)
    else
        LogTransactionError(res)
        message(res)
    end
end

function SendStop(sec_code, class_code)
	sl.OPERATION    = (operation == "B") and "S" or "B"
	sl.QUANTITY		= quantity
	sl.STOPPRICE	= string.format("%." .. dec .. "f", startPrice + ((operation == "B") and -slOffset or slOffset))
	sl.PRICE        = (price_limit == 0) and "0" or string.format("%." .. dec .. "f", price_limit)
	
	stop_price		= tonumber(sl.STOPPRICE)
	
	local text1 = sl.PRICE		== "0" and "рыночный"	or "лимитированный"
	local text2 = sl.OPERATION	== "B" and "покупку"	or "продажу"
	
	local res = sendTransaction(sl)
	if res == "" then
        pendStop = true
        LogStopSent(text1, text2, sl.QUANTITY, sl.SECCODE, sl.STOPPRICE, sl.PRICE)
	else
        LogTransactionError(res)
		message(res, 2)
	end
end

function SendBracket(sec_code, class_code)
    bk.OPERATION  = (operation == "B") and "S" or "B"
    bk.QUANTITY   = quantity

    bk.STOPPRICE  = string.format("%." .. dec .. "f", startPrice + ((operation == "B") and tpOffset or -tpOffset))
    bk.STOPPRICE2 = string.format("%." .. dec .. "f", startPrice + ((operation == "B") and -slOffset or slOffset))

    stop_price    = tonumber(bk.STOPPRICE2)
    take_price    = tonumber(bk.STOPPRICE)

    local res = sendTransaction(bk)
    if res == "" then
        pendBrkt = true
        LogBracketSent(bk.OPERATION, bk.SECCODE, bk.QUANTITY, bk.STOPPRICE, bk.STOPPRICE2)
    else
        LogTransactionError(res)
        message(res, 2)
    end
end