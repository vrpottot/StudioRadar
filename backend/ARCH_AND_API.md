# Архитектура и спецификация API платформы StudioRadar

Документ описывает системную архитектуру, модель данных и спецификацию REST/WebSocket API в рамках **Этапа 2 (Проектирование)** и **Этапа 4 (Backend и БД)** технического задания.

---

## 1. Архитектура системы

Платформа спроектирована по модульному принципу в соответствии с разделами 14–15 ТЗ:

```
[ ЕИС Закупки (Тендеры 44/223-ФЗ) ]
[ Habr Design & Отраслевые медиа  ] ---> [ Data Collector ]
[ Web Search Intent Hunter        ]          │
                                             ▼
                                   [ Normalization & Deduplication ]
                                             │
                                             ▼
                                   [ Rule-based Filters ] (отсев спама, резюме, инфобизнеса)
                                             │
                                             ▼
                                   [ AI Qualification ] (OpenRouter / DeepSeek / Gemini)
                                             │
                                             ▼
                                   [ Contact Enrichment ] (глубокий парсинг сайтов компаний)
                                             │
                                             ▼
                                   [ Scoring & Ranking ] (Грейды A+, A, B, C, D)
                                             │
                                             ▼
                                   [ Database (leads, pipelines, settings) ]
                                             │
                                             ├──► [ WebSocket Server (Realtime push) ]
                                             └──► [ REST API (Express) ] ──► [ Frontend (React/Vite) ]
```

---

## 2. Схема сущностей базы данных

### 2.1. Лид (`Lead`)
* `id` (string, unique): Идентификатор (`tender-12345678`, `web-123`, `habr-123`).
* `company` (string): Название компании-заказчика.
* `industry` (string): Одна из 7 целевых отраслей студии из таблицы заказчика + B2B-агентства.
* `service` (string): Релевантная услуга из 5 направлений студии.
* `contact_name` (string): Имя контактного лица (ЛПР).
* `role` (string): Должность или роль.
* `phone` (string | null): Подтвержденный рабочий телефон (+7/8...).
* `source` (string): Название источника публикации.
* `source_type` (string): Тип источника (`tender`, `web`, `media`).
* `budget` (string): Указанный или оцененный бюджет.
* `score` (number): Оценка соответствия от 0 до 100%.
* `grade` (string): Буквенный уровень приоритета (`A+`, `A`, `B`, `C`, `D`, `E`).
* `verified_direct` (boolean): Подтверждение конечного заказчика (не брокер/субподряд).
* `request_text` (string): Исходный текст задачи или фрагмент публикации.
* `suggested_solution` (string): Персонализированное предложение от ИИ.
* `status` (string): Статус лида (`new`, `contacts_unconfirmed`, `in_progress`, `called`, `negotiation`, `closed`, `rejected`).
* `notes` (string): Пользовательские заметки менеджера.
* `url` (string): Ссылка на первоисточник.
* `created_at` (ISO timestamp): Дата обнаружения.
* `updated_at` (ISO timestamp): Дата последнего обновления.

### 2.2. Пайплайн поиска (`Pipeline`)
* `id` (string, unique): Идентификатор (`pipe_3d_studios`).
* `name` (string): Название стратегии.
* `description` (string): Описание поисковой гипотезы.
* `status` (string): `active` | `paused` | `error`.
* `targetServices` (array of string): Выбранные услуги студии.
* `targetIndustries` (array of string): Выбранные отрасли.
* `selectedSignals` (array of string): Идентификаторы отслеживаемых сигналов.
* `sources` (array of string): Активные источники данных (`ЕИС Закупки`, `Web Search`, `Habr Design`).
* `priorityMinScore` (number): Минимальный скоринг для отбора лидов (40–95%).
* `minGrade` (string): Минимальный грейд (`A+`, `A`, `B`, `C`).
* `trackedCompanies` (number): Число найденных компаний в мониторинге.
* `newSignalsToday` (number): Число новых событий за сутки.
* `highPriorityLeads` (number): Число горячих лидов категории A/A+.
* `lastRunAt` (string): Время последнего сканирования.

### 2.3. Каталог сигналов (`Signal`)
* `id` (string, unique): Идентификатор сигнала (`sig_direct_tender`).
* `title` (string): Название.
* `category` (string): Одна из 5 категорий спроса по п. 4 ТЗ.
* `priority` (string): Базовый грейд (`A+`, `A`, `B`).
* `weight` (number): Вес в баллах скоринга (+15...30 баллов).
* `validityDays` (number): Срок актуальности сигнала в днях.
* `description` (string): Описание события.
* `indicators` (array): Поисковые маркеры и ключевые фразы.
* `relevantServices` (array): Услуги студии, соответствующие сигналу.
* `sources` (array): Источники обнаружения.

### 2.4. Настройки (`Settings`)
* `notify_on_a_only` (boolean): Уведомлять только о лидах с грейдом A/A+.
* `daily_digest_time` (string): Время утреннего дайджеста (`09:00`).
* `min_score_threshold` (number): Порог вхождения в дайджест (70%).
* `staff_stop_words` (array): Стоп-слова штатного найма.
* `cheap_stop_words` (array): Стоп-слова копеечных задач (рилсы, нарезка).
* `education_stop_words` (array): Стоп-слова инфобизнеса и обучения.

---

## 3. Спецификация REST API

### 3.1. Управление лидами
* `GET /api/leads` — Получение списка лидов с фильтрацией:
  * Query-параметры: `industry`, `service`, `status`, `only_with_phone`, `query`.
* `GET /api/leads/:id` — Получение детальной карточки лида.
* `PATCH /api/leads/:id/status` — Обновление статуса лида (Body: `{ "status": "called" }`).
* `PATCH /api/leads/:id/notes` — Обновление заметок менеджера (Body: `{ "notes": "Договорились о КП" }`).
* `GET /api/stats` — Сводные счетчики для дашборда и карточек KPI.

### 3.2. Управление пайплайнами (CRUD)
* `GET /api/pipelines` — Получение всех сохраненных стратегий поиска.
* `GET /api/pipelines/:id` — Получение одного пайплайна.
* `POST /api/pipelines` — Создание новой стратегии поиска из 5-шагового мастера (Body: объект `Pipeline`).
* `PUT /api/pipelines/:id` — Полное обновление настроек пайплайна.
* `PATCH /api/pipelines/:id/status` — Переключение активности (пауза/пуск).
* `DELETE /api/pipelines/:id` — Удаление стратегии поиска.
* `POST /api/pipelines/:id/duplicate` — Клонирование пайплайна.
* `POST /api/pipelines/:id/run` — Принудительный запуск сканирования по пайплайну.

### 3.3. Каталог сигналов и источники
* `GET /api/signals` — Получение каталога сигналов спроса по 5 категориям.
* `POST /api/ai/hunt` — Запуск автономного веб-поиска тендеров через ИИ-агента.
* `POST /api/scan` — Полное сканирование всех подключенных открытых веб-площадок и тендеров.

### 3.4. Настройки платформы
* `GET /api/settings` — Получение конфигурации фильтрации и параметров отбора.
* `POST /api/settings` — Сохранение новых параметров отбора и стоп-слов.

---

## 4. Спецификация WebSocket (`ws://localhost:8001/ws/leads`)

Сервер вещает следующие события клиентам в реальном времени:
1. `new_lead_detected` — найден новый квалифицированный лид (payload: `{ id, company, industry, phone, service, source }`).
2. `lead_status_updated` — изменен статус работы по лиду (`{ lead_id, status }`).
3. `pipeline_created` — создан новый пайплайн (`{ pipeline }`).
4. `pipeline_updated` — изменены настройки или статус пайплайна (`{ pipeline }`).
5. `pipeline_deleted` — удален пайплайн (`{ id }`).
6. `ai_progress` — текстовый статус хода поиска в реальном времени (`{ message }`).
