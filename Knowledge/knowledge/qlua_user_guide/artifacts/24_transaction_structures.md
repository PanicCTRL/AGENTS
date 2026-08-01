# Фактические структуры транзакций (Шаблоны)

В этом документе собраны рабочие шаблоны таблиц транзакций для разных рынков. 
Особое внимание уделено расхождениям с официальной документацией (например, заполнение поля `ACCOUNT` на срочном и фондовом рынках).

## 1. Срочный рынок (FORTS / SPBFUT)

> [!WARNING]
> **Особенность срочного рынка:** в поле `ACCOUNT` передается `firm_id`, а не `trdaccid`.

**Обычная заявка (`NEW_ORDER`)**
```lua
tx = {}
tx.ACCOUNT      = firm_id       -- ВАЖНО: Для срочного рынка передаем firm_id
tx.CLIENT_CODE  = client_code
tx.TYPE         = trade_type    -- "M" (рыночная) или "L" (лимитная)
tx.TRANS_ID     = "5678"
tx.CLASSCODE    = "SPBFUT"      -- Имя класса (SPBFUT)
tx.SECCODE      = sec_code
tx.ACTION       = "NEW_ORDER"

-- Эти поля обычно дозаполняются перед самой отправкой:
-- tx.OPERATION = "B" или "S"
-- tx.QUANTITY  = "1"
-- tx.PRICE     = "0" (для рыночной) или конкретная цена
```

**Стоп-заявка (`NEW_STOP_ORDER`)**
```lua
sl = {} 
sl.SECCODE      = sec_code 
sl.CLASSCODE    = class_code
sl.ACCOUNT      = firm_id       -- ВАЖНО: Для срочного рынка
sl.CLIENT_CODE  = client_code
sl.ACTION       = "NEW_STOP_ORDER"
sl.TRANS_ID     = "1112" 

-- Дозаполняются перед отправкой:
-- sl.OPERATION = "S" или "B" (обратно позиции)
-- sl.QUANTITY  = "1"
-- sl.STOPPRICE = цена срабатывания
-- sl.PRICE     = цена заявки (0 для рыночной)
```

## 2. Фондовый рынок (Топ-Трейд, QJSIM / MOEX)

> [!NOTE]
> На фондовом рынке в поле `ACCOUNT` передается торговый счет `trdaccid` (например, NL0011100043).

**Обычная заявка (`NEW_ORDER`)**
```lua
tx = {}
tx.ACCOUNT      = trdaccid      -- ВАЖНО: Для рынка акций
tx.CLIENT_CODE  = client_code
tx.TYPE         = trade_type
tx.TRANS_ID     = "123456"
tx.CLASSCODE    = class_code    -- Например, "QJSIM"
tx.SECCODE      = sec_code
tx.ACTION       = "NEW_ORDER"
```

**Стоп-заявка (`NEW_STOP_ORDER`)**
```lua
sl = {}  
sl.SECCODE      = sec_code  
sl.CLASSCODE    = class_code  
sl.ACCOUNT      = trdaccid      -- ВАЖНО: Для рынка акций
sl.CLIENT_CODE  = client_code  
sl.ACTION       = "NEW_STOP_ORDER"  
sl.TRANS_ID     = "1112"   
```

## 3. Снятие заявок (KILL)

**Снятие стоп-заявки по её номеру (`KILL_STOP_ORDER`)**
```lua
kill = {}
kill.ACTION          = "KILL_STOP_ORDER"
kill.TRANS_ID        = "123"

-- Пример заполнения ключей при переборе таблицы стоп-заявок:
-- for i = 0, getNumberOf("stop_orders") - 1 do
--     local row = getItem("stop_orders", i)
--     if row and row.sec_code == sec_code then
--         kill.CLASSCODE       = row.class_code
--         kill.SECCODE         = row.sec_code
--         kill.STOP_ORDER_KEY  = tostring(row.order_num)
--         sendTransaction(kill)
--     end
-- end
```

## 4. Связанная заявка (Брекет / TAKE_PROFIT_AND_STOP_LIMIT_ORDER)

> [!CAUTION]
> **ВНИМАНИЕ:** Структура связанной заявки (брекета) требует дополнительной проверки и тестирования на реальных торгах/эмуляторе!

**Для срочного рынка (SPBFUT)**
```lua
bk = {}
bk.SECCODE              = sec_code 
bk.CLASSCODE            = class_code
bk.ACCOUNT              = firm_id       -- Для срочного рынка (firm_id)
bk.CLIENT_CODE          = client_code
bk.ACTION               = "NEW_STOP_ORDER"
bk.STOP_ORDER_KIND      = "TAKE_PROFIT_AND_STOP_LIMIT_ORDER"
bk.OPERATION            = "S"           -- ПРОДАЖА (закрытие длинной позиции) или "B"
bk.STOPPRICE2           = "3.36"        -- Уровень стоп-лосса
bk.STOPPRICE            = "3.5"         -- Уровень тейк-профита
bk.QUANTITY             = "1"
bk.PRICE                = "0"           -- 0 + MARKET_STOP_LIMIT=YES = рыночная продажа
bk.MARKET_TAKE_PROFIT   = "YES"         -- Тейк-профит рыночный
bk.MARKET_STOP_LIMIT    = "YES"         -- Стоп-лосс рыночный
bk.OFFSET               = "0"           -- Отступ (0%)
bk.OFFSET_UNITS         = "PERCENTS"
bk.SPREAD               = "0"           -- Без защитного спреда
bk.SPREAD_UNITS         = "PERCENTS"
bk.TRANS_ID             = "910"
```

**Для фондового рынка (QJSIM / MOEX)**
```lua
bk = {}
bk.SECCODE              = sec_code 
bk.CLASSCODE            = class_code
bk.ACCOUNT              = trdaccid      -- Для фондового рынка (trdaccid)
bk.CLIENT_CODE          = client_code
bk.ACTION               = "NEW_STOP_ORDER"
bk.STOP_ORDER_KIND      = "TAKE_PROFIT_AND_STOP_LIMIT_ORDER"
bk.OPERATION            = "S"           -- ПРОДАЖА (закрытие длинной позиции) или "B"
bk.STOPPRICE2           = "314.98"      -- Уровень стоп-лосса
bk.STOPPRICE            = "315.02"      -- Уровень тейк-профита
bk.QUANTITY             = "1"
bk.PRICE                = "0"           -- 0 + MARKET_STOP_LIMIT=YES = рыночная продажа
bk.MARKET_TAKE_PROFIT   = "YES"         -- Тейк-профит рыночный
bk.MARKET_STOP_LIMIT    = "YES"         -- Стоп-лосс рыночный
bk.OFFSET               = "0"           -- Отступ 0%
bk.OFFSET_UNITS         = "PERCENTS"
bk.SPREAD               = "0"           -- Без защитного спреда
bk.SPREAD_UNITS         = "PERCENTS"
bk.TRANS_ID             = "910"
```
