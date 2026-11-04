/**
 * Каталог сигналов спроса (Раздел 4 ТЗ) на стороне бэкенда
 */
export const SIGNALS_CATALOG = [
  // 1. Прямой спрос на услуги
  {
    id: "sig_direct_tender",
    title: "Тендер / конкурс на видеопроизводство",
    category: "Прямой спрос на услуги",
    priority: "A+",
    weight: 30,
    validityDays: 14,
    description: "Публикация запроса котировок, конкурса или тендера на создание анимационного ролика или 3D графики.",
    indicators: ["тендер", "запрос КП", "конкурс", "закупка услуг видеопроизводства"],
    relevantServices: [
      "3D моушен-дизайн и анимация",
      "2D моушен-дизайн и анимация",
      "2D и 3D мультипликация"
    ],
    sources: ["ЕИС Закупки", "Web Search"]
  },
  {
    id: "sig_direct_order",
    title: "Прямой поиск продакшн-студии или CG-подрядчика",
    category: "Прямой спрос на услуги",
    priority: "A+",
    weight: 30,
    validityDays: 7,
    description: "Пост или публикация от лица компании с прямым запросом на поиск студии или команды для рекламного проекта.",
    indicators: ["ищем продакшн", "нужна студия", "подрядчик по 3D", "заказ на моушн"],
    relevantServices: [
      "3D моушен-дизайн и анимация",
      "ИИ видеоролики и графика"
    ],
    sources: ["Web Search", "Отраслевые медиа"]
  },
  {
    id: "sig_direct_3d_web",
    title: "Запрос на 3D Web-приложение или конфигуратор",
    category: "Прямой спрос на услуги",
    priority: "A",
    weight: 25,
    validityDays: 21,
    description: "Потребность в разработке интерактивного трехмерного сайта, 3D конфигуратора товаров или WebGL интерактива.",
    indicators: ["3D конфигуратор", "WebGL", "Three.js", "интерактивный 3D сайт"],
    relevantServices: [
      "3D Web-приложения и интерактив"
    ],
    sources: ["ЕИС Закупки", "Web Search"]
  },

  // 2. Найм и расширение команды
  {
    id: "sig_hire_motion_3d",
    title: "Поиск 3D Motion Designer / 3D Generalist",
    category: "Найм и расширение команды",
    priority: "B",
    weight: 20,
    validityDays: 30,
    description: "Компания открыла позицию 3D моушн-дизайнера. Указывает на растущий объем задач и потенциальную готовность передать пиковые нагрузки студии.",
    indicators: ["Позиция 3D Motion Designer", "3D Generalist", "Houdini / Cinema 4D"],
    relevantServices: [
      "3D моушен-дизайн и анимация"
    ],
    sources: ["Web Search", "Habr Design"]
  },
  {
    id: "sig_hire_ai_artist",
    title: "Поиск AI Video Creator / Prompt Engineer",
    category: "Найм и расширение команды",
    priority: "A",
    weight: 22,
    validityDays: 20,
    description: "Поиск специалиста по генеративной графике и ИИ-видеороликам. Свидетельствует о запуске инновационного контент-направления.",
    indicators: ["AI видео", "Midjourney / ComfyUI", "Нейросетевая анимация"],
    relevantServices: [
      "ИИ видеоролики и графика"
    ],
    sources: ["Web Search", "Habr Design"]
  },
  {
    id: "sig_hire_mass_creative",
    title: "Массовый найм в креативный департамент",
    category: "Найм и расширение команды",
    priority: "B",
    weight: 18,
    validityDays: 45,
    description: "Одновременное появление нескольких позиций арт-директоров, аниматоров и видеопродюсеров.",
    indicators: ["арт-директор", "креативный продюсер", "расширение отдела дизайна"],
    relevantServices: [
      "2D моушен-дизайн и анимация",
      "2D и 3D мультипликация"
    ],
    sources: ["Web Search", "ЕИС Закупки"]
  },

  // 3. Маркетинг и реклама
  {
    id: "sig_mkt_rebranding",
    title: "Ребрендинг или запуск нового бренда",
    category: "Маркетинг и реклама",
    priority: "A",
    weight: 24,
    validityDays: 60,
    description: "Публичное объявление о смене айдентики, запуске дочерней торговой марки или обновлении позиционирования.",
    indicators: ["ребрендинг", "новый бренд", "обновление стиля", "запуск линейки"],
    relevantServices: [
      "3D моушен-дизайн и анимация",
      "2D моушен-дизайн и анимация"
    ],
    sources: ["Web Search", "Отраслевые медиа"]
  },
  {
    id: "sig_mkt_expo",
    title: "Участие в масштабной отраслевой выставке",
    category: "Маркетинг и реклама",
    priority: "B",
    weight: 20,
    validityDays: 40,
    description: "Подготовка к крупному форуму или экспозиции, где требуется выставочная графика, 3D видеостены и экраны.",
    indicators: ["стенд на выставке", "ПМЭФ", "ИННОПРОМ", "экранный контент"],
    relevantServices: [
      "3D моушен-дизайн и анимация",
      "3D Web-приложения и интерактив"
    ],
    sources: ["Web Search"]
  },

  // 4. Развитие бизнеса
  {
    id: "sig_biz_investment",
    title: "Привлечение инвестиций / получение гранта",
    category: "Развитие бизнеса",
    priority: "B",
    weight: 18,
    validityDays: 90,
    description: "Закрытие инвестиционного раунда или гранта, в рамках которого запланированы бюджеты на маркетинг и промо-материалы.",
    indicators: ["привлекли раунд", "получили грант", "масштабирование бизнеса"],
    relevantServices: [
      "3D моушен-дизайн и анимация",
      "ИИ видеоролики и графика"
    ],
    sources: ["Web Search"]
  },

  // 5. Профильная активность
  {
    id: "sig_prof_subcontract",
    title: "Агентский запрос на субподряд по 3D/CGI",
    category: "Профильная активность",
    priority: "A+",
    weight: 28,
    validityDays: 5,
    description: "Крупное рекламное агентство или видеопродакшн ищет надежного субподрядчика для сложной CGI сцены с горящим дедлайном.",
    indicators: ["субподряд CGI", "нужна студия под проект клиента", "срочно 3D аниматор"],
    relevantServices: [
      "3D моушен-дизайн и анимация",
      "2D и 3D мультипликация"
    ],
    sources: ["Web Search", "Habr Design"]
  }
];
