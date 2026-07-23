# Функции получения информации об инструменте

## getSecurityInfo
Функция предназначена для получения статической информации по торгуемому инструменту (размер лота, шаг цены, номинал, класс и т.д.). Это критически важно при отправке транзакций, чтобы правильно рассчитать цену и количество в заявке.

**Формат вызова:**
```lua
TABLE res = getSecurityInfo(STRING class_code, STRING sec_code)
```

**Параметры:**
- `class_code` — код класса инструментов.
- `sec_code` — код инструмента.

**Возвращает таблицу Lua (Инструменты) со следующими параметрами:**

| Параметр | Тип | Описание |
|----------|-----|----------|
| `code` | STRING | Код инструмента |
| `name` | STRING | Наименование инструмента |
| `short_name` | STRING | Короткое наименование инструмента |
| `class_code` | STRING | Код класса инструментов |
| `class_name` | STRING | Наименование класса инструментов |
| `face_value` | NUMBER | Номинал |
| `face_unit` | STRING | Валюта номинала |
| `scale` | NUMBER | Точность (количество значащих цифр после запятой) |
| `mat_date` | NUMBER | Дата погашения |
| `lot_size` | NUMBER | Размер лота |
| `isin_code` | STRING | ISIN |
| `min_price_step` | NUMBER | Минимальный шаг цены |
| `bsid` | STRING | Bloomberg ID |
| `cusip_code` | STRING | CUSIP |
| `stock_code` | STRING | StockCode |
| `couponvalue` | NUMBER | Размер купона |
| `first_currcode` | STRING | Код котируемой валюты в паре |
| `second_currcode` | STRING | Код базовой валюты в паре |
| `base_active_classcode` | STRING | Код класса базового актива |
| `base_active_seccode` | STRING | Базовый актив |
| `option_strike` | NUMBER | Страйк опциона |
| `qty_multiplier` | NUMBER | Кратность при вводе количества |
| `step_price_currency`| STRING | Валюта шага цены |
| `sedol_code` | STRING | SEDOL |
| `cfi_code` | STRING | CFI |
| `ric_code` | STRING | RIC |
| `buybackdate` | NUMBER | Дата оферты |
| `buybackprice` | NUMBER | Цена оферты |
| `list_level` | NUMBER | Уровень листинга |
| `qty_scale` | NUMBER | Точность количества |
| `yieldatprevwaprice` | NUMBER | Доходность по предыдущей оценке |
| `regnumber` | STRING | Регистрационный номер |
| `trade_currency` | STRING | Валюта торгов |
| `second_curr_qty_scale`| NUMBER | Точность количества котируемой валюты |
| `first_curr_qty_scale` | NUMBER | Точность количества базовой валюты |
| `accruedint` | NUMBER | Накопленный купонный доход |
| `stock_name` | STRING | Код деривативного контракта в формате QUIK |
| `nextcoupon` | NUMBER | Дата выплаты купона |
| `couponperiod` | NUMBER | Длительность купона |
| `settlecode` | STRING | Текущий код расчетов для инструмента |
| `exp_date` | NUMBER | Дата экспирации |
| `settle_date`| NUMBER | Дата расчетов |

### Составные инструменты (legs)
Если инструмент составной (например, календарный спред), таблица также содержит таблицу `legs`.
Элементы в `legs` имеют ключи `leg_0`, `leg_1` и т.д., представляющие собой таблицы:
- `classcode` (STRING) — код класса связанного инструмента.
- `seccode` (STRING) — код связанного инструмента.
- `CFI` (STRING) — CFI ноги.
- `ratio_qty` (NUMBER) — коэффициент количества.
- `leg_side` (STRING) — направление (`"buy"` или `"sell"`).
- `settle_date` (NUMBER) — дата расчетов.

> В случае ошибки (например, если инструмент не найден) функция возвращает `nil`.

---

*Документация актуальна на 17 мая 2026 г.*
