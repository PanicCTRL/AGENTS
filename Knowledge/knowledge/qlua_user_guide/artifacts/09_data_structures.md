# QLua Data Structures (Таблицы QUIK)

> **Общее** – В терминале QUIK многие данные представлены таблицами, к которым можно обращаться через функции `getItem`, `getNumberOf` и т.д. Ниже перечислены основные таблицы и их поля (тип, описание).

---

## 1. Классы (`classes`)
| Поле | Тип | Описание |
|------|-----|----------|
| `firmid` | STRING | Идентификатор фирмы‑эмитента |
| `name`   | STRING | Человекочитаемое название класса |
| `code`   | STRING | Код класса (например `BQUOTE`) |
| `npars`  | NUMBER | Количество параметров в классе |
| `nsecs`  | NUMBER | Количество инструментов в классе |

*Пример записи*: `{["firmid"]="NC0038900000", ["name"]="Брокерские котировки", ["code"]="BQUOTE", ["npars"]=38, ["nsecs"]=28}`

---

## 2. Фирмы (`firms`)
| Поле | Тип | Описание |
|------|-----|----------|
| `firmid`      | STRING | Идентификатор фирмы |
| `firm_name`   | STRING | Название фирмы |
| `status`      | NUMBER | Статус (0‑не активна, 1‑активна) |
| `exchange`    | STRING | Торговая площадка |

---

## 3. Обезличенные сделки (`anon_trades`)
| Поле | Тип | Описание |
|------|-----|----------|
| `trade_num`      | NUMBER | Номер сделки в системе |
| `flags`          | NUMBER | Набор битовых флагов |
| `price`          | NUMBER | Цена сделки |
| `qty`            | NUMBER | Кол‑во бумаг в лотах |
| `value`          | NUMBER | Объём в денежных средствах |
| `accruedint`     | NUMBER | Накопленный купонный доход |
| `yield`          | NUMBER | Доходность |
| `settlecode`     | STRING | Код расчётов |
| `reporate`       | NUMBER | Ставка РЕПО (%) |
| `repovalue`      | NUMBER | Сумма РЕПО |
| `repo2value`     | NUMBER | Объём выкупа РЕПО |
| `repoterm`       | NUMBER | Срок РЕПО в днях |
| `sec_code`       | STRING | Код бумаги заявки |
| `class_code`     | STRING | Код класса |
| `datetime`       | TABLE  | Таблица даты/времени (см. ниже) |
| `period`         | NUMBER | Период торговой сессии: 0‑Открытие, 1‑Нормальный, 2‑Закрытие |

---

## 4. Сделки (`trades`)
| Поле | Тип | Описание |
|------|-----|----------|
| `trade_num` | NUMBER | Номер сделки |
| `order_num` | NUMBER | Номер заявки, породившей сделку |
| `brokerref` | STRING | Комментарий (обычно `<код клиента>/<номер поручения>`) |
| `userid`    | STRING | Идентификатор трейдера |
| `firmid`    | STRING | Идентификатор дилера |
| `canceled_uid` | NUMBER | UID пользователя, отменившего сделку |
| `account`   | STRING | Торговый счёт |
| `price`     | NUMBER | Цена сделки |
| `qty`       | NUMBER | Кол‑во инструментов в лотах |
| `value`     | NUMBER | Объём в деньгах |
| `accruedint`| NUMBER | Накопленный купонный доход |
| `yield`     | NUMBER | Доходность |
| `settlecode`| STRING | Код расчётов |
| `flags`     | NUMBER | Набор битовых флагов |
| `price2`    | NUMBER | Цена выкупа (для РЕПО) |
| `reporate`  | NUMBER | Ставка РЕПО (%) |
| `client_code`| STRING | Код клиента |
| `accrued2`  | NUMBER | Доход на дату выкупа |
| `repoterm`  | NUMBER | Срок РЕПО (дни) |
| `repovalue` | NUMBER | Сумма РЕПО |
| `repo2value`| NUMBER | Объём выкупа РЕПО |
| `start_discount`| NUMBER | Начальный дисконт (%) |
| `lower_discount`| NUMBER | Нижний дисконт (%) |
| `upper_discount`| NUMBER | Верхний дисконт (%) |
| `block_securities`| NUMBER | Блокировка обеспечения (1 ‑ Да, 0 ‑ Нет) |
| `clearing_comission`| NUMBER | Комиссия клиринга (ММВБ) |
| `exchange_comission`| NUMBER | Комиссия биржи (ММВБ) |
| `tech_center_comission`| NUMBER | Комиссия ТЦ (ММВБ) |
| `settle_date`| NUMBER | Дата расчётов (YYYYMMDD) |
| `settle_currency`| STRING | Валюта расчётов |
| `trade_currency`| STRING | Валюта сделки |
| `exchange_code`| STRING | Код биржи в системе |
| `station_id`| STRING | Идентификатор рабочей станции |
| `sec_code`| STRING | Код инструмента заявки |
| `class_code`| STRING | Код класса |
| `datetime`| TABLE  | Дата/время сделки |
| `bank_acc_id`| STRING | Идентификатор расчётного счёта в клиринговой организации |
| `broker_comission`| NUMBER | Комиссия брокера (2 дробных знака) |
| `linked_trade`| NUMBER | Номер витринной сделки (для РЕПО, SWAP) |
| `period`| NUMBER | Период сессии (0‑Открытие, 1‑Нормальный, 2‑Закрытие) |
| `trans_id`| NUMBER | Идентификатор транзакции |
| `kind`| NUMBER | Тип сделки (см. ниже) |
| `uid`| NUMBER | UID пользователя на сервере QUIK |
| `canceled_datetime`| TABLE | Дата/время отмены сделки |
| `clearing_firmid`| STRING | Фирма‑участник клиринга |
| `system_ref`| STRING | Доп. информация от системы |
| `lseccode`| STRING | Приоритетное обеспечение |
| `order_revision_number`| NUMBER | Номер ревизии заявки, по которой выполнена сделка |
| `order_qty`| NUMBER | Кол‑во в заявке в момент сделки |
| `order_price`| NUMBER | Цена заявки в момент сделки |
| `order_exchange_code`| STRING | Биржевой номер заявки |
| `exec_market`| STRING | Площадка исполнения |
| `liquidity_indicator`| NUMBER | Индикатор ликвидности (0‑неопределено, 1‑мейкер, 2‑тейкер, 3‑вывод, 4‑аукцион) |
| `extref`| STRING | Внешняя ссылка для интеграций |
| `ext_trade_flags`| NUMBER | Расширенные флаги от шлюза |
| `on_behalf_of_uid`| NUMBER | UID пользователя‑делегата |
| `client_qualifier`| NUMBER | Квалификатор клиента (0‑неопр., 1‑Natural Person, 3‑Legal Entity) |
| `client_short_code`| NUMBER | Краткий код клиента |
| `investment_decision_maker_qualifier`| NUMBER | Квалификатор принявшего решение (0‑неопр., 1‑Natural Person, 3‑Algorithm) |
| `investment_decision_maker_short_code`| NUMBER | Краткий код решающего |
| `executing_trader_qualifier`| NUMBER | Квалификатор трейдера‑исполнителя (0‑неопр., 1‑Natural Person, 3‑Algorithm) |
| `executing_trader_short_code`| NUMBER | Краткий код трейдера‑исполнителя |
| `waiver_flag`| NUMBER | Признак предтрейда (битовые флаги) |
| `mleg_base_sid`| NUMBER | Идентификатор базового инструмента для multileg |
| `side_qualifier`| NUMBER | Квалификатор операции (0‑неопр., 1‑Buy, 2‑Sell, 3‑Sell short, …) |
| `otc_post_trade_indicator`| NUMBER | Признак OTC post‑trade (битовые флаги) |
| `cross_rate`| NUMBER | Кросс‑курс валюты цены к валюте расчётов |
| `fixing_date`| NUMBER | Дата фиксации котировки (для NDF) |
| `start_date`| NUMBER | Дата начала валютирования (для FLEX FORWARD) |
| `operation_type`| NUMBER | Тип операции (‑1 ‑ NOT_DEFINED, 0 ‑ SPOT, 1 ‑ FORWARD, 2 ‑ SWAP, 6 ‑ NDF, 7 ‑ FLEX FORWARD) |
| `spot_rate`| NUMBER | Спот‑цена в момент сделки |
| `ts_commission_currency`| STRING | Валюта комиссии торговой системы |
| `broker_commission_currency`| STRING | Валюта комиссии брокера |
| `trading_session`| NUMBER | Идентификатор торговой сессии (0‑неопр., 1‑Основ., 2‑Доп., 3‑Итоги) |
| `benchmark`| STRING | Идентификатор индикативной ставки |
| `deposit_intent`| NUMBER | Тип сделки депозита (0‑не‑депозит, 1‑Намерение, 2‑Депозит, 3‑Изъятие, …) |
| `open_repo2date`| NUMBER | День T+1 для сделок РЕПО с открытой датой |
| `open_repo2value`| NUMBER | Стоимость выкупа РЕПО с открытой датой в T+1 |

> **Примечание**: В большинстве полей `NUMBER` – целое или с фиксированной точкой, `STRING` – текст, `TABLE` – структура `{year, month, day, hour, min, sec, ms, ...}`.

---

## 5. Заявки (`orders`)
| Поле | Тип | Описание |
|------|-----|----------|
| `order_num` | NUMBER | Номер заявки в системе |
| `flags` | NUMBER | Набор битовых флагов |
| `brokerref` | STRING | Комментарий (обычно `<код клиента>/<номер поручения>`) |
| `userid` | STRING | Идентификатор трейдера |
| `firmid` | STRING | Идентификатор фирмы |
| `account` | STRING | Торговый счёт |
| `price` | NUMBER | Цена заявки |
| `qty` | NUMBER | Кол‑во в лотах |
| `balance` | NUMBER | Остаток (неисполненный объём) |
| `value` | NUMBER | Объём в деньгах |
| `accruedint` | NUMBER | Накопленный купонный доход |
| `yield` | NUMBER | Доходность |
| `trans_id` | NUMBER | Идентификатор транзакции |
| `client_code` | STRING | Код клиента |
| `price2` | NUMBER | Цена выкупа (для РЕПО) |
| `settlecode` | STRING | Код расчётов |
| `uid` | NUMBER | UID пользователя |
| `canceled_uid` | NUMBER | UID пользователя, снявшего заявку |
| `exchange_code` | STRING | Код биржи в торговой системе |
| `activation_time` | NUMBER | Время активации |
| `linkedorder` | NUMBER | Номер заявки в торговой системе |
| `expiry` | NUMBER | Дата окончания срока действия заявки |
| `sec_code` | STRING | Код инструмента заявки |
| `class_code` | STRING | Код класса заявки |
| `datetime` | TABLE | Дата и время вы выставления |
| `withdraw_datetime` | TABLE | Дата и время снятия заявки |
| `bank_acc_id` | STRING | Идентификатор расчётного счёта/кода |
| `value_entry_type` | NUMBER | Способ указания объёма: 0‑по количеству, 1‑по объёму |
| `repoterm` | NUMBER | Срок РЕПО (календарные дни) |
| `repovalue` | NUMBER | Сумма РЕПО на текущую дату |
| `repo2value` | NUMBER | Объём сделки выкупа РЕПО |
| `repo_value_balance` | NUMBER | Остаток суммы РЕПО (в неисполненной части) |
| `start_discount` | NUMBER | Начальный дисконт (%) |
| `reject_reason` | STRING | Причина отклонения заявки брокером |
| `ext_order_flags` | NUMBER | Специфические параметры западных площадок |
| `min_qty` | NUMBER | Минимально допустимое количество (0 ‑ нет ограничения) |
| `exec_type` | NUMBER | Тип исполнения (1‑IOC, 2‑Queue, 3‑FOK, 4‑GTC, 5‑GTD...) |
| `side_qualifier` | NUMBER | Параметры западных площадок (0 ‑ не задано) |
| `acnt_type` | NUMBER | Параметры западных площадок (0 ‑ не задано) |
| `capacity` | NUMBER | Роль в исполнении (1‑Agent, 2‑Principal, 11‑Market maker...) |
| `passive_only_order` | NUMBER | Параметры западных площадок (0 ‑ не задано) |
| `visible` | NUMBER | Видимое количество (для айсберг‑заявок) |
| `awg_price` | NUMBER | Средняя цена исполнения |
| `expiry_time` | NUMBER | Время окончания срока (ЧЧММСС) |
| `revision_number` | NUMBER | Номер ревизии (при замене с сохранением номера) |
| `price_currency` | STRING | Валюта заявки |
| `ext_order_status` | NUMBER | Расширенный статус (1‑активна, 3‑исполнена, 4‑отменена...) |
| `accepted_uid` | NUMBER | UID менеджера, подтвердившего заявку |
| `filled_value` | NUMBER | Исполненный объём в валюте цены |
| `extref` | STRING | Внешняя ссылка |
| `settle_currency` | STRING | Валюта расчётов |
| `on_behalf_of_uid` | NUMBER | UID пользователя, от имени которого выставлена заявка |
| `client_qualifier` | NUMBER | Квалификатор клиента (1‑Natural Person, 3‑Legal Entity) |
| `client_short_code` | NUMBER | Краткий код клиента |
| `investment_decision_maker_qualifier` | NUMBER | Квалификатор решающего (1‑Natural Person, 2‑Algorithm) |
| `investment_decision_maker_short_code` | NUMBER | Краткий код решающего |
| `executing_trader_qualifier` | NUMBER | Квалификатор исполнителя (1‑Natural Person, 2‑Algorithm) |
| `executing_trader_short_code` | NUMBER | Краткий код исполнителя |
| `settle_date` | NUMBER | Дата расчётов |
| `settle_date2` | NUMBER | Дата расчётов 2‑й части (для своп) |
| `start_date` | NUMBER | Дата начала валютирования (для FLEX FORWARD) |
| `operation_type` | NUMBER | Тип операции (0‑SPOT, 1‑FORWARD, 2‑SWAP, 6‑NDF, 7‑FLEX FORWARD) |
| `qty2` | NUMBER | Кол‑во 2‑й части своп |
| `value2` | NUMBER | Объём 2‑й части своп |
| `visibility_factor` | NUMBER | Видимая часть в % |
| `visible_repo_value` | NUMBER | Сумма РЕПО видимой части |
| `trading_session` | NUMBER | Сессия (1‑Основная, 2‑Доп, 3‑Итоги) |
| `price_entry_type` | NUMBER | Тип ввода цены (1‑По цене, 2‑По доходности, 3‑По средневзвешенной) |
| `lseccode` | STRING | Приоритетное обеспечение |
| `benchmark` | STRING | Идентификатор индикативной ставки |
| `external_qty` | NUMBER | Внешнее количество |

---

## 6. Позиции участника по торговым счетам (`trdacc_positions`)
| Поле | Тип | Описание |
|------|-----|----------|
| `firmid` | STRING | Идентификатор фирмы |
| `sec_code` | STRING | Код инструмента |
| `trdaccid` | STRING | Торговый счёт |
| `depaccid` | STRING | Счёт депо |
| `openbal` | NUMBER | Входящий остаток |
| `currentpos` | NUMBER | Текущий остаток |
| `plannedpossell` | NUMBER | Плановая продажа |
| `plannedposbuy` | NUMBER | Плановая покупка |
| `planbal` | NUMBER | Контрольный остаток клиринга |
| `usqtyb` | NUMBER | Куплено |
| `usqtys` | NUMBER | Продано |
| `planned` | NUMBER | Плановый остаток |
| `settlebal` | NUMBER | Позиция после расчётов |
| `bank_acc_id` | STRING | Идентификатор расчётного счёта |
| `firmuse` | NUMBER | Признак обеспечения (0‑обычный, 1‑обеспечение) |

---

## 7. Позиции участника по инструментам (`sec_positions`)
| Поле | Тип | Описание |
|------|-----|----------|
| `firmid` | STRING | Идентификатор фирмы |
| `sec_code` | STRING | Код инструмента |
| `openbal` | NUMBER | Входящий остаток |
| `currentpos` | NUMBER | Текущий остаток |
| `plannedposbuy` | NUMBER | В активных заявках на покупку |
| `plannedpossell` | NUMBER | В активных заявках на продажу |
| `usqtyb` | NUMBER | Куплено |
| `usqtys` | NUMBER | Продано |

---

## 8. Стоп-заявки (`stop_orders`)
| Поле | Тип | Описание |
|------|-----|----------|
| `order_num` | NUMBER | Регистрационный номер стоп‑заявки |
| `ordertime` | NUMBER | Время выставления |
| `flags` | NUMBER | Набор битовых флагов |
| `brokerref` | STRING | Комментарий |
| `firmid` | STRING | Идентификатор дилера |
| `account` | STRING | Торговый счёт |
| `condition` | NUMBER | Направленность (4‑"«<=", 5‑">=") |
| `condition_price` | NUMBER | Стоп‑цена |
| `price` | NUMBER | Цена |
| `qty` | NUMBER | Количество в лотах |
| `linkedorder` | NUMBER | Номер заявки, зарегистрированной по условию |
| `expiry` | NUMBER | Дата окончания срока |
| `trans_id` | NUMBER | Идентификатор транзакции |
| `client_code` | STRING | Код клиента |
| `co_order_num` | NUMBER | Связанная заявка |
| `co_order_price` | NUMBER | Цена связанной заявки |
| `stop_order_type` | NUMBER | Вид (1‑стоп‑лимит, 6‑тейк‑профит, 9‑тейк+стоп...) |
| `orderdate` | NUMBER | Дата выставления |
| `alltrade_num` | NUMBER | Сделка условия |
| `stopflags` | NUMBER | Набор битовых флагов |
| `offset` | NUMBER | Отступ от min/max |
| `spread` | NUMBER | Защитный спред |
| `balance` | NUMBER | Активное количество |
| `uid` | NUMBER | Идентификатор пользователя |
| `filled_qty` | NUMBER | Исполненное количество |
| `withdraw_time` | NUMBER | Время снятия |
| `condition_price2` | NUMBER | Стоп‑лимит цена (для тейк+стоп) |
| `active_from_time` | NUMBER | Время начала периода (тейк+стоп) |
| `active_to_time` | NUMBER | Время окончания периода (тейк+стоп) |
| `sec_code` | STRING | Код инструмента заявки |
| `class_code` | STRING | Код класса заявки |
| `condition_sec_code` | STRING | Код инструмента стоп‑цены |
| `condition_class_code` | STRING | Код класса стоп‑цены |
| `canceled_uid` | NUMBER | UID пользователя, снявшего стоп‑заявку |
| `order_date_time` | TABLE | Время выставления (таблица) |
| `withdraw_datetime` | TABLE | Время снятия (таблица) |
| `activation_date_time` | TABLE | Дата и время активации |

---

## 9. Ограничения по клиентским счетам / Фьючерсные лимиты (`futures_limits`)
| Поле | Тип | Описание |
|------|-----|----------|
| `firmid` | STRING | Идентификатор фирмы |
| `trdaccid` | STRING | Торговый счёт |
| `limit_type` | NUMBER | Тип (0‑Ден. средства, 1‑Залоговые, 2‑Совокупные...) |
| `liquidity_coef` | NUMBER | Коэффициент ликвидности |
| `cbp_prev_limit` | NUMBER | Предыдущий лимит |
| `cbplimit` | NUMBER | Лимит открытых позиций |
| `cbplused` | NUMBER | Текущие чистые позиции |
| `cbplplanned` | NUMBER | Плановые чистые позиции |
| `varmargin` | NUMBER | Вариационная маржа |
| `accruedint` | NUMBER | Накопленный доход |
| `cbplused_for_orders` | NUMBER | Под заявки |
| `cbplused_for_positions` | NUMBER | Под открытые позиции |
| `options_premium` | NUMBER | Премия по опционам |
| `ts_comission` | NUMBER | Биржевые сборы |
| `kgo` | NUMBER | Коэффициент КГО |
| `currcode` | STRING | Валюта |
| `real_varmargin` | NUMBER | Реально начисленная вар. маржа |
| `risk_level` | NUMBER | Уровень риска (1‑КНУР, 2‑КСУР, 3‑КПУР, 4‑КОУР) |
| `go_without_orders` | NUMBER | ГО без учёта заявок |
| `go_planned` | NUMBER | ГО с учётом риск‑параметров |
| `indicative_varmargin` | NUMBER | Индикативная вар. маржа |

---

## 10. Позиции по клиентским счетам (Фьючерсы) (`futures_client_holding`)
| Поле | Тип | Описание |
|------|-----|----------|
| `firmid` | STRING | Идентификатор фирмы |
| `trdaccid` | STRING | Торговый счёт |
| `sec_code` | STRING | Код контракта |
| `type` | NUMBER | Тип лимита (1‑основной, 2‑клиентский...) |
| `startbuy` | NUMBER | Входящие длинные |
| `startsell` | NUMBER | Входящие короткие |
| `startnet` | NUMBER | Входящие чистые |
| `todaybuy` | NUMBER | Текущие длинные |
| `todaysell` | NUMBER | Текущие короткие |
| `totalnet` | NUMBER | Текущие чистые |
| `openbuys` | NUMBER | Активные на покупку |
| `opensells` | NUMBER | Активные на продажу |
| `cbplused` | NUMBER | Оценка текущих чистых позиций |
| `cbplplanned` | NUMBER | Плановые чистые позиции |
| `varmargin` | NUMBER | Вариационная маржа |
| `avrposnprice` | NUMBER | Эффективная цена позиций |
| `positionvalue` | NUMBER | Стоимость позиций |
| `real_varmargin` | NUMBER | Реально начисленная вар. маржа |
| `total_varmargin` | NUMBER | Суммарная вар. маржа по итогам клиринга |
| `session_status` | NUMBER | Статус сессии (1‑основная, 4‑начался клиринг, 6‑завершился...) |

---

## 11. Позиции по деньгам (`money_limits`)
| Поле | Тип | Описание |
|------|-----|----------|
| `currcode` | STRING | Код валюты |
| `tag` | STRING | Код позиции |
| `firmid` | STRING | Идентификатор фирмы |
| `client_code` | STRING | Код клиента |
| `openbal` | NUMBER | Входящий остаток |
| `openlimit` | NUMBER | Входящий лимит |
| `currentbal` | NUMBER | Текущий остаток |
| `currentlimit` | NUMBER | Текущий лимит |
| `locked` | NUMBER | Заблокировано под заявки |
| `locked_value_coef` | NUMBER | Стоимость активов в покупке немаржинальных инстр. |
| `locked_margin_value` | NUMBER | Стоимость активов в покупке маржинальных инстр. |
| `leverage` | NUMBER | Плечо |
| `limit_kind` | NUMBER | Срок расчётов (0‑T0, 1‑T1, 2‑T2...) |
| `wa_position_price` | NUMBER | Средневзвешенная цена приобретения |
| `orders_collateral` | NUMBER | ГО заявок |
| `positions_collateral` | NUMBER | ГО позиций |

---

## 12. Удаление позиций (структуры событий)
### Удаление позиции по деньгам
Поля: `currcode, tag, client_code, firmid, limit_kind`.

### Удаление позиции по инструментам
Поля: `sec_code, trdaccid, firmid, client_code, limit_kind`.

### Удаление фьючерсного лимита
Поля: `trdaccid, limit_type`.

---

## 13. Позиции по инструментам (`depo_limits`)
| Поле | Тип | Описание |
|------|-----|----------|
| `sec_code` | STRING | Код инструмента |
| `trdaccid` | STRING | Счёт депо |
| `firmid` | STRING | Идентификатор фирмы |
| `client_code` | STRING | Код клиента |
| `openbal` | NUMBER | Входящий остаток |
| `openlimit` | NUMBER | Входящий лимит |
| `currentbal` | NUMBER | Текущий остаток |
| `currentlimit` | NUMBER | Текущий лимит |
| `locked_sell` | NUMBER | Заблокировано на продажу (кол‑во) |
| `locked_buy` | NUMBER | В активных заявках на покупку (кол‑во) |
| `locked_buy_value` | NUMBER | Стоимость заблокированных под покупку |
| `locked_sell_value` | NUMBER | Стоимость заблокированных под продажу |
| `wa_position_price` | NUMBER | Цена приобретения |
| `wa_price_currency` | STRING | Валюта цены приобретения |
| `limit_kind` | NUMBER | Срок расчётов (0‑T0, 1‑T1, 2‑T2...) |

---

## 14. Позиции участника по деньгам (`money_positions`)
| Поле | Тип | Описание |
|------|-----|----------|
| `firmid` | STRING | Идентификатор фирмы |
| `currcode` | STRING | Код валюты |
| `tag` | STRING | Код позиции |
| `description` | STRING | Описание |
| `openbal` | NUMBER | Входящий остаток |
| `currentpos` | NUMBER | Текущий остаток |
| `plannedpos` | NUMBER | Плановый остаток |
| `limit1` | NUMBER | Внешнее ограничение |
| `limit2` | NUMBER | Внутреннее ограничение |
| `orderbuy` | NUMBER | В заявках на продажу |
| `ordersell` | NUMBER | В заявках на покупку |
| `netto` | NUMBER | Нетто‑позиция |
| `plannedbal` | NUMBER | Плановая позиция |
| `debit` | NUMBER | Дебет |
| `credit` | NUMBER | Кредит |
| `bank_acc_id` | STRING | Идентификатор счёта |
| `margincall` | NUMBER | Маржинальное требование |
| `settlebal` | NUMBER | Позиция после расчётов |

---

## 15. Заявки на внебиржевые сделки (`neg_deals`)
| Поле | Тип | Описание |
|------|-----|----------|
| `neg_deal_num` | NUMBER | Номер |
| `neg_deal_time` | NUMBER | Время выставления |
| `flags` | NUMBER | Набор битовых флагов |
| `brokerref` | STRING | Комментарий |
| `userid` | STRING | Трейдер |
| `firmid` | STRING | Идентификатор дилера |
| `cpuserid` | STRING | Трейдер партнёра |
| `cpfirmid` | STRING | Код фирмы партнёра |
| `account` | STRING | Счёт |
| `price` | NUMBER | Цена |
| `qty` | NUMBER | Количество |
| `matchref` | STRING | Ссылка |
| `settlecode` | STRING | Код расчётов |
| `yield` | NUMBER | Доходность |
| `accruedint` | NUMBER | Купонный процент |
| `value` | NUMBER | Объём |
| `price2` | NUMBER | Цена выкупа |
| `reporate` | NUMBER | Ставка РЕПО (%) |
| `refundrate` | NUMBER | Ставка возмещения (%) |
| `trans_id` | NUMBER | ID транзакции |
| `client_code` | STRING | Код клиента |
| `repoentry` | NUMBER | Тип ввода РЕПО (1‑Цена1+Ставка, 4‑Сумма+Кол‑во...) |
| `repovalue` | NUMBER | Сумма РЕПО |
| `repo2value` | NUMBER | Объём выкупа РЕПО |
| `repoterm` | NUMBER | Срок РЕПО |
| `start_discount` | NUMBER | Начальный дисконт (%) |
| `lower_discount` | NUMBER | Нижний дисконт (%) |
| `upper_discount` | NUMBER | Верхний дисконт (%) |
| `block_securities` | NUMBER | Блокировка обеспечения (Да/Нет) |
| `uid` | NUMBER | UID пользователя |
| `withdraw_time` | NUMBER | Время снятия |
| `neg_deal_date` | NUMBER | Дата выставления |
| `balance` | NUMBER | Остаток |
| `origin_repovalue` | NUMBER | Сумма РЕПО первоначальная |
| `origin_qty` | NUMBER | Количество первоначальное |
| `origin_discount` | NUMBER | Процент дисконта первоначальный |
| `neg_deal_activation_date` | NUMBER | Дата активации |
| `neg_deal_activation_time` | NUMBER | Время активации |
| `quoteno` | NUMBER | Встречная безадресная заявка |
| `settle_currency` | STRING | Валюта расчётов |
| `sec_code` | STRING | Код инструмента |
| `class_code` | STRING | Код класса |
| `bank_acc_id` | STRING | Идентификатор расчётного счёта |
| `withdraw_date` | NUMBER | Дата снятия (ГГГГММДД) |
| `linkedorder` | NUMBER | Номер предыдущей заявки |
| `activation_date_time` | TABLE | Дата и время активации |
| `withdraw_date_time` | TABLE | Дата и время снятия |
| `date_time` | TABLE | Дата и время заявки |
| `lseccode` | STRING | Приоритетное обеспечение |
| `canceled_uid` | NUMBER | UID снявшего заявку |
| `system_ref` | STRING | Системная ссылка |
| `price_currency` | STRING | Валюта цены |
| `order_exchange_code` | STRING | Биржевой номер заявки |
| `extref` | STRING | Внешняя ссылка |
| `period` | NUMBER | Период сессии |
| `client_qualifier` | NUMBER | Квалификатор клиента (1‑Natural Person, 3‑Legal Entity) |
| `client_short_code` | NUMBER | Краткий код клиента |
| `investment_decision_maker_qualifier` | NUMBER | Квалификатор решающего (1‑Natural Person, 2‑Algorithm) |
| `investment_decision_maker_short_code` | NUMBER | Краткий код решающего |
| `executing_trader_qualifier` | NUMBER | Квалификатор исполнителя (1‑Natural Person, 2‑Algorithm) |
| `executing_trader_short_code` | NUMBER | Краткий код исполнителя |
| `settle_date` | NUMBER | Дата расчётов |
| `benchmark` | STRING | Идентификатор индикативной ставки |
| `ext_negdeal_flags` | NUMBER | Набор битовых флагов (РЕПО с открытой датой и пр.) |
| `open_repo2date` | NUMBER | День T+1 для РЕПО с открытой датой |
| `open_repo2value` | NUMBER | Стоимость выкупа РЕПО с откр. датой в T+1 |

---

## 16. Сделки для исполнения (`trades_for_execution`)
| Поле | Тип | Описание |
|------|-----|----------|
| `trade_num` | NUMBER | Номер сделки |
| `trade_date` | NUMBER | Дата торгов |
| `settle_date` | NUMBER | Дата расчётов |
| `flags` | NUMBER | Набор битовых флагов |
| `brokerref` | STRING | Комментарий |
| `firmid` | STRING | Идентификатор дилера |
| `account` | STRING | Счёт депо |
| `cpfirmid` | STRING | Код фирмы партнёра |
| `cpaccount` | STRING | Счёт депо партнёра |
| `price` | NUMBER | Цена |
| `qty` | NUMBER | Количество |
| `value` | NUMBER | Объём |
| `settlecode` | STRING | Код расчётов |
| `report_num` | NUMBER | Отчёт |
| `cpreport_num` | NUMBER | Отчёт партнёра |
| `accruedint` | NUMBER | Купонный процент |
| `repotradeno` | NUMBER | Номер сделки 1‑й части РЕПО |
| `price1` | NUMBER | Цена 1‑й части РЕПО |
| `reporate` | NUMBER | Ставка РЕПО (%) |
| `price2` | NUMBER | Цена выкупа |
| `client_code` | STRING | Код клиента |
| `ts_comission` | NUMBER | Комиссия торговой системы |
| `balance` | NUMBER | Остаток |
| `settle_time` | NUMBER | Время исполнения |
| `amount` | NUMBER | Сумма обязательства |
| `repovalue` | NUMBER | Сумма РЕПО |
| `repoterm` | NUMBER | Срок РЕПО |
| `repo2value` | NUMBER | Объём выкупа РЕПО |
| `return_value` | NUMBER | Сумма возврата РЕПО |
| `discount` | NUMBER | Дисконт (%) |
| `lower_discount` | NUMBER | Нижний дисконт (%) |
| `upper_discount` | NUMBER | Верхний дисконт (%) |
| `block_securities`| NUMBER | Блокировать обеспечение (Да/Нет) |
| `urgency_flag` | NUMBER | Исполнить (Да/Нет) |
| `type` | NUMBER | Тип (0‑Внесистемная, 1‑РЕПО ч.1, 3‑Комп. взнос, 4‑Дефолтер...) |
| `operation_type` | NUMBER | Направленность (1‑Зачислить, 2‑Списать) |
| `expected_discount`| NUMBER | Дисконт после взноса (%) |
| `expected_quantity`| NUMBER | Количество после взноса |
| `expected_repovalue`| NUMBER | Сумма РЕПО после взноса |
| `expected_repo2value` | NUMBER | Стоимость выкупа после взноса |
| `expected_return_value` | NUMBER | Сумма возврата после взноса |
| `order_num` | NUMBER | Номер заявки |
| `report_trade_date` | NUMBER | Дата заключения |
| `settled` | NUMBER | Состояние расчётов (1‑Processed, 2‑Not processed, 3‑Is processing) |
| `clearing_type` | NUMBER | Тип клиринга (1‑Not set, 2‑Simple, 3‑Multilateral) |
| `report_comission` | NUMBER | Комиссия за отчёт |
| `coupon_payment` | NUMBER | Купонная выплата |
| `principal_payment` | NUMBER | Выплата по основному долгу |
| `principal_payment_date` | NUMBER | Дата выплаты по основному долгу |
| `nextdaysettle` | NUMBER | Дата следующего дня расчётов |
| `settle_currency` | STRING | Валюта расчётов |
| `sec_code` | STRING | Код инструмента |
| `class_code` | STRING | Код класса |
| `compval` | NUMBER | Сумма отступного |
| `parenttradeno` | NUMBER | ID витринной сделки |
| `bankid` | STRING | Расчётная организация |
| `bankaccid` | STRING | Код позиции |
| `precisebalance` | NUMBER | Количество инструментов к исполнению (в лотах) |
| `confirmtime` | NUMBER | Время подтверждения (ЧЧММСС) |
| `ex_flags` | NUMBER | Расширенные флаги (1‑Подтверждена контрагентом, 2‑Подтверждена) |
| `confirmreport` | NUMBER | Номер поручения |
| `extref` | STRING | Внешняя ссылка |
| `benchmark` | STRING | Идентификатор индикативной ставки |
| `benchmark_change_date`| NUMBER | Дата изменения индикатора (ГГГГММДД) |
| `benchmark_value` | NUMBER | Значение индикатора (%) |
| `cancel_reason` | STRING | Причина отмены |
| `deposit_intent` | NUMBER | Тип депозита (1‑Намерение, 2‑Депозит...) |
| `open_repo2date` | NUMBER | День T+1 для РЕПО с откр. датой |
| `open_repo2value` | NUMBER | Стоимость выкупа T+1 |
| `open_repo_report_no` | NUMBER | Отчёт на закрытие РЕПО |
| `open_repo_status` | NUMBER | Статус РЕПО с откр. датой (0‑Нет, 1‑Да, 2‑Срочная) |

---

## 17. Торговые счета (`trade_accounts`)
| Поле | Тип | Описание |
|------|-----|----------|
| `class_codes` | STRING | Список кодов классов ("|") |
| `firmid` | STRING | Идентификатор фирмы |
| `trdaccid` | STRING | Код торгового счёта |
| `description` | STRING | Описание |
| `fullcoveredsell` | NUMBER | Запрет необеспеченных продаж (0/1) |
| `main_trdaccid` | STRING | Основной торговый счёт |
| `bankid_t0` | STRING | Расчётная организация по T0 |
| `bankid_tplus` | STRING | Расчётная организация по T+ |
| `trdacc_type` | NUMBER | Тип торгового счёта |
| `depunitid` | STRING | Раздел счёта Депо |
| `status` | NUMBER | Статус (0‑разрешено, 1‑запрещено) |
| `firmuse` | NUMBER | Тип раздела (0‑обеспечение) |
| `depaccid` | STRING | Номер счёта депо |
| `bank_acc_id` | STRING | Код доп. позиции по деньгам |
| `flags` | NUMBER | Битовые флаги (бит 0‑рынок депозитов) |

---

## 18. Отчеты по сделкам для исполнения (`execution_reports`)
| Поле | Тип | Описание |
|------|-----|----------|
| `report_num` | NUMBER | Отчёт |
| `report_date` | NUMBER | Дата отчёта |
| `flags` | NUMBER | Набор битовых флагов |
| `userid` | STRING | Идентификатор пользователя |
| `firmid` | STRING | Идентификатор фирмы |
| `account` | STRING | Счёт депо |
| `cpfirmid` | STRING | Код фирмы партнёра |
| `cpaccount` | STRING | Счёт депо партнёра |
| `qty` | NUMBER | Количество в лотах |
| `value` | NUMBER | Объём сделки (руб) |
| `withdraw_time` | NUMBER | Время снятия заявки |
| `report_type` | NUMBER | Тип отчёта |
| `report_kind` | NUMBER | Вид отчёта |
| `commission` | NUMBER | Объём комиссии (руб) |
| `sec_code` | STRING | Код инструмента |
| `class_code` | STRING | Код класса |
| `report_time` | NUMBER | Время отчёта |
| `report_date_time` | TABLE | Дата и время отчёта (таблица) |

---

## 19. Инструменты (`securities`)
| Поле | Тип | Описание |
|------|-----|----------|
| `code` | STRING | Код инструмента |
| `name` | STRING | Наименование |
| `short_name` | STRING | Короткое наименование |
| `class_code` | STRING | Код класса |
| `class_name` | STRING | Наименование класса |
| `face_value` | NUMBER | Номинал |
| `face_unit` | STRING | Валюта номинала |
| `scale` | NUMBER | Точность (кол‑во знаков) |
| `mat_date` | NUMBER | Дата погашения |
| `lot_size` | NUMBER | Размер лота |
| `isin_code` | STRING | ISIN |
| `min_price_step` | NUMBER | Шаг цены |
| `bsid` | STRING | Bloomberg ID |
| `cusip_code` | STRING | CUSIP |
| `stock_code` | STRING | StockCode |
| `couponvalue` | NUMBER | Размер купона |
| `first_currcode` | STRING | Котируемая валюта |
| `second_currcode` | STRING | Базовая валюта |
| `base_active_classcode`| STRING | Код класса базового актива |
| `base_active_seccode`| STRING | Базовый актив |
| `option_strike` | NUMBER | Страйк опциона |
| `qty_multiplier` | NUMBER | Кратность ввода кол‑ва |
| `step_price_currency`| STRING | Валюта шага цены |
| `sedol_code` | STRING | SEDOL |
| `cfi_code` | STRING | CFI |
| `ric_code` | STRING | RIC |
| `buybackdate` | NUMBER | Дата оферты |
| `buybackprice` | NUMBER | Цена оферты |
| `list_level` | NUMBER | Уровень листинга |
| `qty_scale` | NUMBER | Точность количества |
| `yieldatprevwaprice` | NUMBER | Доходность по пред. оценке |
| `regnumber` | STRING | Рег. номер |
| `trade_currency` | STRING | Валюта торгов |
| `second_curr_qty_scale`| NUMBER | Точность кол‑ва котируемой валюты |
| `first_curr_qty_scale` | NUMBER | Точность кол‑ва базовой валюты |
| `accruedint` | NUMBER | НКД |
| `stock_name` | STRING | Код дериватива в формате QUIK |
| `nextcoupon` | NUMBER | Дата выплаты купона |
| `couponperiod` | NUMBER | Длительность купона |
| `settlecode` | STRING | Текущий код расчётов |
| `exp_date` | NUMBER | Дата экспирации |
| `settle_date` | NUMBER | Дата расчётов |
| `legs` | TABLE | Ноги составного инстр. (`leg_0`, `leg_1`...) |

---

## 20. Свечки графика (`candles`)
| Поле | Тип | Описание |
|------|-----|----------|
| `open` | NUMBER | Цена открытия |
| `close` | NUMBER | Цена закрытия |
| `high` | NUMBER | Макс. цена |
| `low` | NUMBER | Мин. цена |
| `volume` | NUMBER | Объём |
| `datetime` | TABLE | Дата и время |
| `doesExist` | NUMBER | 1‑рассчитано, 0‑не рассчитано |

---

## 21. Формат даты и времени (`datetime`)
| Поле | Тип | Описание |
|------|-----|----------|
| `mcs` | NUMBER | Микросекунды |
| `ms` | NUMBER | Миллисекунды |
| `sec` | NUMBER | Секунды |
| `min` | NUMBER | Минуты |
| `hour` | NUMBER | Часы |
| `day` | NUMBER | День |
| `week_day` | NUMBER | Номер дня недели |
| `month` | NUMBER | Месяц |
| `year` | NUMBER | Год |

---

## 22. Транзакции (`transactions`)
| Поле | Тип | Описание |
|------|-----|----------|
| `trans_id` | NUMBER | ID транзакции |
| `status` | NUMBER | Статус (3‑выполнена, 4‑ошибка, 5‑проверка сервера...) |
| `result_msg` | STRING | Сообщение |
| `date_time` | TABLE | Дата и время |
| `uid` | NUMBER | UID |
| `flags` | NUMBER | Флаги транзакции |
| `server_trans_id`| NUMBER | ID на сервере |
| `order_num` | NUMBER | Номер заявки |
| `price` | NUMBER | Цена |
| `quantity` | NUMBER | Количество |
| `balance` | NUMBER | Остаток |
| `error_code` | NUMBER | Числовой код ошибки (0 ‑ успешно) |
| `error_source` | NUMBER | Источник (1‑ТС, 2‑Сервер, 3‑Лимиты, 4‑Шлюз) |
| `first_ordernum` | NUMBER | Номер первой заявки (при автозамене кода клиента) |
| `gate_reply_time` | TABLE | Дата и время получения ответа шлюзом |
| `sent_local_time` | TABLE | Дата и время отправки транзакции (UTC) |
| `got_local_time` | TABLE | Дата и время получения ответа (UTC) |
| `orders` | TABLE | Таблица связанных заявок (если их >= 2). Поля внутри: `order_num, price, quantity, balance, order_flags, firm_id, account, client_code, brokerref`. |
| `firm_id` | STRING | Идентификатор фирмы |
| `account` | STRING | Торговый счёт |
| `client_code` | STRING | Код клиента |
| `brokerref` | STRING | Комментарий |
| `class_code` | STRING | Код класса |
| `sec_code` | STRING | Код инструмента |
| `exchange_code` | STRING | Биржевой номер заявки |

**Коды статусов транзакции**:
... (предыдущие коды) ...

---

## 23. Обязательства и требования по активам (`asset_obligations`)
| Поле | Тип | Описание |
|------|-----|----------|
| `firmid` | STRING | Идентификатор фирмы |
| `depo_account` | STRING | Номер счёта депо в НДЦ |
| `account` | STRING | Торговый счёт |
| `bank_acc_id` | STRING | Идентификатор расчётного счёта |
| `settle_date` | NUMBER | Дата расчётов |
| `qty` | NUMBER | Количество инструментов в сделках |
| `qty_buy` | NUMBER | Количество в заявках на покупку |
| `qty_sell` | NUMBER | Количество в заявках на продажу |
| `netto` | NUMBER | Нетто‑позиция |
| `debit` | NUMBER | Дебет |
| `credit` | NUMBER | Кредит |
| `sec_code` | STRING | Код инструмента |
| `class_code` | STRING | Код класса |
| `planned_covered` | NUMBER | Плановая позиция Т+ |
| `firm_use` | NUMBER | Тип раздела (0‑торговый, 1‑обеспечение) |

---

## 24. Валюта: обязательства и требования по активам (`currency_asset_obligations`)
| Поле | Тип | Описание |
|------|-----|----------|
| `sec_code` | STRING | Код инструмента |
| `class_code` | STRING | Код класса |
| `firmId` | STRING | Идентификатор фирмы |
| `account` | STRING | Торговый счёт |
| `bank_acc_id` | STRING | Идентификатор расчётного счёта в НКЦ |
| `date` | NUMBER | Дата расчётов |
| `debit` | NUMBER | Размер денежных обязательств |
| `credit` | NUMBER | Размер денежных требований |
| `value_buy` | NUMBER | Сумма в заявках на покупку |
| `value_sell` | NUMBER | Сумма в заявках на продажу |
| `margin_call` | NUMBER | Сумма возврата компенсационного перевода |
| `planned_covered` | NUMBER | Плановая позиция Т+ |
| `debit_balance` | NUMBER | Обязательства на начало дня |
| `credit_balance` | NUMBER | Требования на начало дня |

---

*Конец раздела «Структуры данных». Документация актуальна на 15 мая 2026 г.*
| Поле | Тип | Описание |
|------|-----|----------|
| `year` | NUMBER | Год (YYYY) |
| `month`| NUMBER | Месяц (1‑12) |
| `day`  | NUMBER | День (1‑31) |
| `hour` | NUMBER | Час (0‑23) |
| `min`  | NUMBER | Минуты (0‑59) |
| `sec`  | NUMBER | Секунды (0‑59) |
| `ms`   | NUMBER | Миллисекунды (0‑999) |
| `week_day`| NUMBER | День недели (0‑воскресенье…) |
| `count`| NUMBER | Кол‑во тиковых интервалов в секунду (1‑10000) |

---

*Документация актуальна на 15 мая 2026 г.*
