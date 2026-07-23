# QUIK Lua API — Сервисные функции

> Источник: Руководство пользователя QUIK © ARQA Technologies

## Список функций

| Функция | Возвращаемый тип | Описание |
|---|---|---|
| `isConnected()` | NUMBER | Состояние подключения к серверу |
| `getScriptPath()` | STRING | Путь к запускаемому скрипту |
| `getInfoParam(param_name)` | STRING | Параметры информационного окна |
| `message(message [, icon_type])` | NUMBER | Отображение сообщений в терминале |
| `sleep(time)` | NUMBER | Приостановка выполнения скрипта |
| `getWorkingFolder()` | STRING | Путь к файлу info.exe |
| `PrintDbgStr(s)` | — | Вывод отладочной информации |
| `os.sysdate()` | TABLE | Системные дата и время (до микросекунд) |
| `isDarkTheme()` | BOOLEAN | Текущая тема оформления терминала |

---

## isConnected

Определяет состояние подключения клиентского места к серверу.

- Возвращает `1` — если подключено
- Возвращает `0` — если не подключено

```lua
NUMBER isConnected()
```

---

## getScriptPath

Возвращает путь к запускаемому скрипту **без завершающего обратного слеша**.

```lua
STRING getScriptPath()
```

**Пример:**
```lua
path = getScriptPath()
-- Например: C:\QuikFront\Scripts
```

---

## getInfoParam

Возвращает значения параметров информационного окна  
(меню: Система → О программе → Информационное окно).

```lua
STRING getInfoParam(STRING param_name)
```

### Доступные параметры `param_name`:

| Параметр | Описание |
|---|---|
| `VERSION` | Версия программы |
| `TRADEDATE` | Дата торгов |
| `SERVERTIME` | Время сервера |
| `LASTRECORDTIME` | Время последней записи |
| `NUMRECORDS` | Число записей |
| `LASTRECORD` | Последняя запись |
| `LATERECORD` | Отставшая запись |
| `CONNECTION` | Соединение |
| `IPADDRESS` | IP-адрес сервера |
| `IPPORT` | Порт сервера |
| `IPCOMMENT` | Описание соединения |
| `SERVER` | Описание сервера |
| `SESSIONID` | Идентификатор сессии |
| `USER` | Пользователь |
| `USERID` | ID пользователя |
| `ORG` | Организация |
| `MEMORY` | Занято памяти |
| `LOCALTIME` | Текущее время |
| `CONNECTIONTIME` | Время на связи |
| `MESSAGESSENT` | Передано сообщений |
| `ALLSENT` | Передано всего байт |
| `BYTESSENT` | Передано полезных байт |
| `BYTESPERSECSENT` | Передано за секунду |
| `MESSAGESRECV` | Принято сообщений |
| `BYTESRECV` | Принято полезных байт |
| `ALLRECV` | Принято всего байт |
| `BYTESPERSECRECV` | Принято за секунду |
| `AVGSENT` | Средняя скорость передачи |
| `AVGRECV` | Средняя скорость приёма |
| `LASTPINGTIME` | Время последней проверки связи |
| `LASTPINGDURATION` | Задержка данных при обмене с сервером |
| `AVGPINGDURATION` | Средняя задержка данных |
| `MAXPINGTIME` | Время максимальной задержки |
| `MAXPINGDURATION` | Максимальная задержка данных |

**Пример — запись всех параметров в файл:**
```lua
function main()
  params = {
    "VERSION", "TRADEDATE", "SERVERTIME", "LASTRECORDTIME",
    "NUMRECORDS", "LASTRECORD", "LATERECORD", "CONNECTION",
    "IPADDRESS", "IPPORT", "IPCOMMENT", "SERVER", "SESSIONID",
    "USER", "USERID", "ORG", "MEMORY", "LOCALTIME", "CONNECTIONTIME",
    "MESSAGESSENT", "ALLSENT", "BYTESSENT", "BYTESPERSECSENT",
    "MESSAGESRECV", "BYTESRECV", "ALLRECV", "BYTESPERSECRECV",
    "AVGSENT", "AVGRECV", "LASTPINGTIME", "LASTPINGDURATION",
    "AVGPINGDURATION", "MAXPINGTIME", "MAXPINGDURATION"
  }
  file = io.open("res.txt", "w+t")
  for key, v in ipairs(params) do
    file:write(v .. " = " .. getInfoParam(v) .. "\n")
  end
  file:close()
end
```

---

## message

Отображает сообщения в терминале QUIK.

- Возвращает `1` при успехе
- Возвращает `nil` при ошибке

> ⚠️ Максимальная длина строки — **900 символов**

```lua
NUMBER message(STRING message [, NUMBER icon_type])
```

### Параметры:

| Параметр | Тип | Описание |
|---|---|---|
| `message` | STRING | Строка для отображения |
| `icon_type` | NUMBER | Тип иконки: `1` (инфо, по умолчанию), `2` (предупреждение), `3` (ошибка) |

**Примеры:**
```lua
message("test message")
message("test message", 1)
message("test\nmessage", 2)
message("connection state is " .. tostring(isConnected()), 3)
```

---

## sleep

Приостанавливает выполнение скрипта на заданное время.

- Возвращает время ожидания при успехе
- Возвращает `nil` при ошибке параметров

> ⚠️ **Не рекомендуется** использовать в функциях обратного вызова (callback)

```lua
NUMBER sleep(NUMBER time)
```

| Параметр | Тип | Описание |
|---|---|---|
| `time` | NUMBER | Время паузы в **миллисекундах** |

**Пример:**
```lua
sleep(1000) -- приостановка на одну секунду
```

---

## getWorkingFolder

Возвращает путь к файлу `info.exe` **без завершающего обратного слеша**.

```lua
STRING getWorkingFolder()
```

**Пример:**
```lua
path = getWorkingFolder()
-- Например: C:\QuikFront
```

---

## PrintDbgStr

Выводит строку в окно отладки терминала.

```lua
PrintDbgStr(STRING s)
```

**Пример:**
```lua
function main()
  PrintDbgStr("test1")
  PrintDbgStr("test2")
  PrintDbgStr("dbg from " .. getScriptPath())
end
```

---

## os.sysdate

Возвращает системные дату и время с точностью **до микросекунд**.

> ⚠️ Использует системные вызовы Windows — точность зависит от интервала системного таймера

```lua
TABLE os.sysdate()
```

Возвращает таблицу Lua с полями даты/времени.

---

## isDarkTheme

Возвращает информацию о текущей теме оформления терминала.

```lua
BOOLEAN isDarkTheme()
```

- `true` — используется тёмная тема
- `false` — используется стандартная тема
