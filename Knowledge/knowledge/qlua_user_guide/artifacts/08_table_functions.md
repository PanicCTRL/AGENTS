# Функции для работы с таблицами Рабочего места QUIK

## Общие возможности таблиц, созданных скриптами Lua
- режим **drag‑and‑drop**
- пользовательские фильтры
- условное форматирование
- размещение на «экранных закладках»
- поиск значения в ячейках таблицы
- печать таблицы с предварительным просмотром

## Ограничения таблиц, созданных скриптами Lua
- таблицы не сохраняются в файл конфигурации
- отсутствует диалог редактирования таблицы
- нет контекстного меню (кроме «Переместить на закладку»)
- не создаётся копия таблицы
- заголовок окна не задаётся по умолчанию
- нет экспорта данных из таблицы
- недоступно управление «горячими клавишами»

---

## Список функций

### `AddColumn`
```lua
NUMBER AddColumn (NUMBER t_id, NUMBER iCode, STRING name, BOOLEAN is_default, NUMBER par_type, NUMBER width)
```
**Параметры**
- `t_id` – идентификатор таблицы
- `iCode` – код параметра, выводимого в колонке
- `name` – название колонки
- `is_default` – параметр не используется
- `par_type` – тип данных в колонке (одна из констант ниже)
- `width` – ширина в условных единицах
**Константы типов**: `QTABLE_INT_TYPE`, `QTABLE_DOUBLE_TYPE`, `QTABLE_INT64_TYPE`, `QTABLE_CACHED_STRING_TYPE`, `QTABLE_TIME_TYPE`, `QTABLE_DATE_TYPE`, `QTABLE_STRING_TYPE`
**Возврат** `1` при успехе, иначе `0`.

### `AllocTable`
```lua
NUMBER AllocTable()
```
Создаёт структуру, описывающую таблицу и возвращает её идентификатор.

### `Clear`
```lua
BOOLEAN Clear (NUMBER t_id)
```
Очищает содержимое таблицы.

### `CreateWindow`
```lua
NUMBER CreateWindow (NUMBER t_id)
```
Создаёт окно таблицы. Возвращает `1` при успехе, иначе `0`.

### `DeleteRow`
```lua
BOOLEAN DeleteRow (NUMBER t_id, NUMBER key)
```
Удаляет строку с ключом `key` из таблицы.

### `DestroyTable`
```lua
BOOLEAN DestroyTable (NUMBER t_id)
```
Закрывает окно таблицы и удаляет все её данные.

### `InsertRow`
```lua
NUMBER InsertRow (NUMBER t_id, NUMBER key)
```
Добавляет строку с ключом `key`. При `key = -1` строка добавляется в конец. Возвращает номер добавленной строки или `-1` при ошибке.

### `IsWindowClosed`
```lua
BOOLEAN IsWindowClosed (NUMBER t_id)
```
Возвращает `true` если окно закрыто, `false` если открыто, `nil` если таблица не существует.

### `GetCell`
```lua
TABLE GetCell (NUMBER t_id, NUMBER key, NUMBER code)
```
Возвращает таблицу `{image=..., value=...}` с данными ячейки. `nil` при ошибке.

### `GetTableSize`
```lua
NUMBER rows, NUMBER col GetTableSize (NUMBER t_id)
```
Возвращает количество строк и столбцов (заголовки и фиксированный первый столбец не учитываются). `nil` при ошибке.

### `GetWindowCaption`
```lua
STRING GetWindowCaption (NUMBER t_id)
```
Возвращает текущий заголовок окна.

### `GetWindowRect`
```lua
NUMBER top, NUMBER left, NUMBER bottom, NUMBER right GetWindowRect (NUMBER t_id)
```
Возвращает координаты окна.

### `SetCell`
```lua
BOOLEAN SetCell (NUMBER t_id, NUMBER key, NUMBER code, STRING text, NUMBER value)
```
Задает значение ячейки. `text` — строковое представление, `value` — числовое (по умолчанию 0, не используется для строк).

### `SetWindowCaption`
```lua
BOOLEAN SetWindowCaption (NUMBER t_id, STRING str)
```
Задаёт новый заголовок окна.

### `SetWindowPos`
```lua
BOOLEAN SetWindowPos (NUMBER t_id, NUMBER x, NUMBER y, NUMBER dx, NUMBER dy)
```
Устанавливает позицию и размеры окна.

### `SetTableNotificationCallback`
```lua
NUMBER SetTableNotificationCallback (NUMBER t_id, FUNCTION f_cb)
```
Назначает функцию обратного вызова для обработки событий таблицы. Возвращает `1` при успехе, иначе `0`.

#### Формат функции‑обратного вызова
```lua
function f_cb (NUMBER t_id, NUMBER msg, NUMBER par1, NUMBER par2) end
```
- `msg` — код события (см. ниже)
- `par1`, `par2` — параметры, зависящие от сообщения

**Коды событий**: `QTABLE_LBUTTONDOWN`, `QTABLE_RBUTTONDOWN`, `QTABLE_LBUTTONDBLCLK`, `QTABLE_RBUTTONDBLCLK`, `QTABLE_SELCHANGED`, `QTABLE_CHAR`, `QTABLE_VKEY`, `QTABLE_MBUTTONDOWN`, `QTABLE_MBUTTONDBLCLK`, `QTABLE_LBUTTONUP`, `QTABLE_RBUTTONUP`, `QTABLE_CLOSE`.

### `RGB`
```lua
NUMBER RGB (NUMBER red, NUMBER green, NUMBER blue)
```
Преобразует компоненты цвета в одно число.

### `SetColor`
```lua
BOOLEAN SetColor (NUMBER t_id, NUMBER row, NUMBER col, NUMBER b_color, NUMBER f_color, NUMBER sel_b_color, NUMBER sel_f_color)
```
Устанавливает цвет фона и текста для ячейки/строки/столбца/всей таблицы. При `row` или `col` = `QTABLE_NO_INDEX` (`-1`) применяется ко всему столбцу/строке/таблице. `b_color` — цвет фона, `f_color` — цвет текста, `sel_b_color` — фон выделенной ячейки, `sel_f_color` — текст выделенной ячейки. Можно использовать константу `QTABLE_DEFAULT_COLOR`.

### `Highlight`
```lua
BOOLEAN Highlight (NUMBER t_id, NUMBER row, NUMBER col, NUMBER b_color, NUMBER f_color, NUMBER timeout)
```
Подсвечивает диапазон ячеек цветом фона и текста с плавным затуханием. `timeout` — время в мс, `0` отменяет подсветку.

### `SetSelectedRow`
```lua
NUMBER SetSelectedRow (NUMBER table_id, NUMBER row)
```
Выделяет строку. При `row = -1` выделяется последняя видимая строка. Возвращает номер выделенной строки или `-1` при ошибке.

---

*Документация актуальна на 15 мая 2026 г.*
