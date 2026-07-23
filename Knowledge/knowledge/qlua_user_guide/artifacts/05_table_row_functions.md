# Функции для обращения к строкам произвольных таблиц QUIK

## Описание
Функции из этой группы предназначены для доступа к данным, содержащимся в таблицах Рабочего места **QUIK**.

- `getItem`
- `getOrderByNumber`
- `getNumberOf`
- `SearchItems`

---

### getItem
```lua
TABLE getItem (STRING TableName, NUMBER Index)
```
Возвращает таблицу Lua с информацией о строке `Index` из таблицы `TableName`. При ошибке возвращает `nil`. Индексация начинается с **0**.

**Пример:**
```lua
function main()
    local n = getNumberOf("orders")
    for i = 0, n-1 do
        local order = getItem("orders", i)
        message("order: num=" .. tostring(order["order_num"]) ..
                " qty=" .. tostring(order["qty"]) ..
                " value=" .. tostring(order["value"]))
    end
end
```
---

### getOrderByNumber
```lua
TABLE order = getOrderByNumber(STRING class_code, NUMBER order_id)
```
Возвращает таблицу Lua с описанием параметров заявки (`order`). Если заявка не существует – `nil`.
---

### getNumberOf
```lua
NUMBER getNumberOf(STRING TableName)
```
Возвращает количество записей в таблице `TableName`.
---

### SearchItems
```lua
TABLE SearchItems(STRING table_name, NUMBER start_index, NUMBER end_index, FUNCTION fn [, STRING params])
```
Позволяет выполнять быстрый поиск элементов в хранилище терминала, возвращая таблицу индексов, удовлетворяющих условию, определенному в функции `fn`.

**Параметры функции `fn`**:
- `true` – текущий индекс учитывается в результате;
- `false` – индекс игнорируется;
- `nil` – поиск прерывается, возвращается таблица найденных индексов до текущего.

**Опциональный параметр `params`** – список полей из `table_name`, передаваемых в `fn`. Если не указан – в `fn` передаётся полный объект строки.
---

## Таблицы, используемые в функциях
| TableName | Описание |
|---|---|
| `firms` | Фирмы |
| `classes` | Классы |
| `securities` | Инструменты |
| `trade_accounts` | Торговые счета |
| `client_codes` | Коды клиентов |
| `all_trades` | Обезличенные сделки |
| `account_positions` | Позиции участника по деньгам |
| `orders` | Заявки |
| `futures_client_holding` | Позиции по клиентским счетам (фьючерсы) |
| `futures_client_limits` | Ограничения по клиентским счетам |
| `money_limits` | Позиции по деньгам |
| `depo_limits` | Позиции по инструментам |
| `trades` | Сделки |
| `stop_orders` | Стоп‑заявки |
| `neg_deals` | Заявки на внебиржевые сделки |
| `neg_trades` | Сделки для исполнения |
| `neg_deal_reports` | Отчеты по сделкам для исполнения |
| `firm_holding` | Позиции участника по инструментам |
| `account_balance` | Позиции участника по торговым счетам |
| `ccp_holdings` | Обязательства и требования по активам |
| `rm_holdings` | Валюта: обязательства и требования по активам |

---

*Руководство пользователя QUIK © ARQA Technologies*  
*Дата: 15.05.2026*  
*Источник: `QLUA.chm` — раздел «Функции для обращения к строкам произвольных таблиц QUIK»*
