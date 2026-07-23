# Interaction Functions (QLua)

## getLinesCount

```lua
NUMBER lines_count = getLinesCount(STRING tag)
```
Возвращает количество линий на графике (индикаторе) по его строковому идентификатору `tag`.

---

## getNumCandles

```lua
NUMBER count = getNumCandles(STRING tag)
```
Возвращает количество свечек на графике по выбранному идентификатору `tag`.

---

## getCandlesByIndex

```lua
TABLE t, NUMBER n, STRING l = getCandlesByIndex(tag, line, first_candle, count)
```

- **tag** – строковый идентификатор графика или индикатора.
- **line** – номер линии графика/индикатора (нумерация с 0).
- **first_candle** – индекс первой свечки (нумерация с 0).
- **count** – количество запрашиваемых свечек.

Возвращаемые значения:
- **t** – таблица, содержащая запрошенные свечки.
- **n** – количество свечек в таблице *t*.
- **l** – легенда (подпись) графика.

> **Примечание**: Заказ данных для построения графика плагин не осуществляет, поэтому требуемый график должен быть открыт.

---

## CreateDataSource

```lua
TABLE data_source, STRING error_desc = CreateDataSource(class_code, sec_code, interval [, param])
```

Параметры:
- **class_code** – код класса инструмента.
- **sec_code** – код инструмента.
- **interval** – интервал запрашиваемого графика (см. таблицу ниже).
- **param** – необязательный параметр. Если не задан, данные берутся из таблицы обезличенных сделок; если задан – данные по указанному параметру.

Функция возвращает таблицу *data_source* при успешном завершении, иначе `nil` и в *error_desc* записывается описание ошибки.

> Функцию можно вызывать только внутри `main()` и callback‑функций.

### Константы интервалов
| Константа | Описание |
|-----------|----------|
| `INTERVAL_TICK` | Тиковые данные |
| `INTERVAL_M1` | 1 минутa |
| `INTERVAL_M2` | 2 минуты |
| `INTERVAL_M3` | 3 минуты |
| `INTERVAL_M4` | 4 минуты |
| `INTERVAL_M5` | 5 минут |
| `INTERVAL_M6` | 6 минут |
| `INTERVAL_M10` | 10 минут |
| `INTERVAL_M15` | 15 минут |
| `INTERVAL_M20` | 20 минут |
| `INTERVAL_M30` | 30 минут |
| `INTERVAL_H1` | 1 час |
| `INTERVAL_H2` | 2 часа |
| `INTERVAL_H4` | 4 часа |
| `INTERVAL_D1` | 1 день |
| `INTERVAL_W1` | 1 неделя |
| `INTERVAL_MN1` | 1 месяц |

### Методы объекта `data_source`
| Метод | Описание |
|------|----------|
| `SetUpdateCallback(callback_function)` | Устанавливает функцию обратного вызова, вызываемую при изменении свечки. |
| `O(index)` | Возвращает значение **Open** для свечи `index`. |
| `H(index)` | Возвращает значение **High**. |
| `L(index)` | Возвращает значение **Low**. |
| `C(index)` | Возвращает значение **Close**. |
| `V(index)` | Возвращает значение **Volume**. |
| `T(index)` | Возвращает объект времени свечи с полями `year, month, day, week_day, hour, min, sec, ms, count`. |
| `Size()` | Текущее количество свечек в источнике данных. |
| `Close()` | Закрывает источник данных, прекращая получение данных с сервера. |
| `SetEmptyCallback()` | Позволяет получать данные без указания функции обратного вызова. |

#### Пример создания источников данных
```lua
-- с параметром "last"
ds1 = CreateDataSource("SPBFUT", "RIU3", INTERVAL_M1, "last")

-- без параметра
ds2 = CreateDataSource("SPBFUT", "RIU3", INTERVAL_M1)

-- с параметром "bid"
ds3 = CreateDataSource("SPBFUT", "RIU3", INTERVAL_M1, "bid")
```

---

## SetUpdateCallback

```lua
BOOLEAN res = SetUpdateCallback(callback_function)
```

`callback_function` должна принимать один параметр – индекс изменившейся свечки (нумерация с 1). Функция должна возвращать `true` при успехе, иначе `false`.

### Пример callback‑функции
```lua
function cb(index)
    local t = ds:T(index)
    local _str = string.format(
        "#%d of %d\t%.4f\t%.4f\t%.4f\t%.4f\t%.4f %02d.%02d.%04d %02d:%02d:%02d.%04d",
        index, ds:Size(), ds:O(index), ds:H(index), ds:L(index), ds:C(index), ds:V(index),
        t.day, t.month, t.year, t.hour, t.min, t.sec, t.ms)
    Log(file, _str)
end

ds:SetUpdateCallback(cb)
```

---

## Candle value functions (O, H, L, C, V, T)

| Функция | Параметр | Описание |
|---------|----------|----------|
| `O(index)` | `index` – номер свечи (с 1) | Возвращает открытие свечи. |
| `H(index)` | `index` | Высшее значение (high). |
| `L(index)` | `index` | Нижнее значение (low). |
| `C(index)` | `index` | Закрытие свечи (close). |
| `V(index)` | `index` | Объём (volume). |
| `T(index)` | `index` | Таблица времени свечи: `{year, month, day, week_day, hour, min, sec, ms, count}`.

Пример получения значений первой свечи:
```lua
local open  = ds:O(1)
local high  = ds:H(1)
local low   = ds:L(1)
local close = ds:C(1)
local vol   = ds:V(1)
local time  = ds:T(1)  -- time.week_day, time.count, …
```

---

## Size

```lua
NUMBER count = ds:Size()
```
Возвращает текущее количество свечек в источнике данных.

---

## Close

```lua
BOOLEAN ok = ds:Close()
```
Закрывает источник данных; после вызова данные больше не поступают.

---

## SetEmptyCallback

```lua
BOOLEAN ok = ds:SetEmptyCallback()
```
Позволяет получать данные с сервера без привязки к функции обратного вызова.

---

*Документация основана на Руководстве пользователя QUIK © ARQA Technologies (версия 12.8).*
