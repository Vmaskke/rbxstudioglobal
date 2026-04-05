const countries = [
  {
    key: "ru",
    emoji: "🇷🇺",
    name: "Russia",
    label: "Russia",
    categoryName: "🇷🇺 Russia Hub",
    language: "Русский",
    localizedWelcome:
      "Добро пожаловать в Roblox Studio Global. Выбирай роли, знакомься с разработчиками из других стран, проси помощь и показывай свои проекты.",
    localizedRules: [
      "Уважай участников из любых стран и с любым уровнем опыта.",
      "Без оскорблений, хейта, токсичности, NSFW и мошенничества.",
      "Вопросы, портфолио и поиск команды публикуй в подходящих каналах.",
      "Если показываешь работу команды, указывай соавторов.",
      "Заказы и вакансии публикуй только в канале для услуг и найма."
    ]
  },
  {
    key: "ua",
    emoji: "🇺🇦",
    name: "Ukraine",
    label: "Ukraine",
    categoryName: "🇺🇦 Ukraine Hub",
    language: "Українська",
    localizedWelcome:
      "Ласкаво просимо до Roblox Studio Global. Обирай ролі, знайомся з розробниками з різних країн, проси допомогу та показуй свої проєкти.",
    localizedRules: [
      "Поважай учасників з будь-яких країн і з будь-яким рівнем досвіду.",
      "Без образ, хейту, токсичності, NSFW та шахрайства.",
      "Питання, портфоліо та пошук команди публікуй у відповідних каналах.",
      "Якщо показуєш командну роботу, вказуй співавторів.",
      "Замовлення та вакансії публікуй лише в каналі для послуг і найму."
    ]
  },
  {
    key: "us",
    emoji: "🇺🇸",
    name: "USA",
    label: "USA",
    categoryName: "🇺🇸 USA Hub",
    language: "English",
    localizedWelcome:
      "Welcome to Roblox Studio Global. Pick your roles, meet developers from different countries, ask for help, and share your projects.",
    localizedRules: [
      "Respect people from every country and every skill level.",
      "No harassment, hate, toxicity, NSFW, or scams.",
      "Post questions, portfolios, and team requests in the right channels.",
      "Credit collaborators when you share team work.",
      "Keep commissions and hiring posts inside the hiring channel."
    ]
  },
  {
    key: "tr",
    emoji: "🇹🇷",
    name: "Turkey",
    label: "Turkey",
    categoryName: "🇹🇷 Turkey Hub",
    language: "Türkçe",
    localizedWelcome:
      "Roblox Studio Global'a hos geldin. Rollerini sec, farkli ulkelerden gelistiricilerle tanis, yardim iste ve projelerini paylas.",
    localizedRules: [
      "Her ulkeden ve her seviyeden kullaniciya saygi goster.",
      "Hakaret, nefret, toksiklik, NSFW ve dolandiricilik yasaktir.",
      "Sorularini, portfolyolarini ve ekip arayisini dogru kanallarda paylas.",
      "Ekip isi paylasiyorsan katkida bulunanlari belirt.",
      "Ucretli isler ve alım ilanlari sadece ilgili kanalda olmali."
    ]
  },
  {
    key: "br",
    emoji: "🇧🇷",
    name: "Brazil",
    label: "Brazil",
    categoryName: "🇧🇷 Brazil Hub",
    language: "Português",
    localizedWelcome:
      "Bem-vindo ao Roblox Studio Global. Escolha seus cargos, conheca desenvolvedores de varios paises, peca ajuda e mostre seus projetos.",
    localizedRules: [
      "Respeite pessoas de qualquer pais e qualquer nivel de experiencia.",
      "Sem assedio, odio, toxicidade, NSFW ou golpes.",
      "Publique perguntas, portfolio e busca de equipe nos canais corretos.",
      "Dê credito aos colaboradores ao mostrar trabalho em equipe.",
      "Comissoes e vagas devem ficar apenas no canal de contratacoes."
    ]
  },
  {
    key: "es",
    emoji: "🇪🇸",
    name: "Spain",
    label: "Spain",
    categoryName: "🇪🇸 Spain Hub",
    language: "Español",
    localizedWelcome:
      "Bienvenido a Roblox Studio Global. Elige tus roles, conoce desarrolladores de distintos paises, pide ayuda y comparte tus proyectos.",
    localizedRules: [
      "Respeta a personas de cualquier pais y nivel de experiencia.",
      "No se permite acoso, odio, toxicidad, NSFW ni estafas.",
      "Publica preguntas, portafolios y busqueda de equipo en los canales correctos.",
      "Da credito a tus colaboradores cuando compartas trabajo en equipo.",
      "Las comisiones y vacantes deben ir solo en el canal de contratacion."
    ]
  },
  {
    key: "fr",
    emoji: "🇫🇷",
    name: "France",
    label: "France",
    categoryName: "🇫🇷 France Hub",
    language: "Français",
    localizedWelcome:
      "Bienvenue sur Roblox Studio Global. Choisis tes roles, rencontre des developpeurs de plusieurs pays, demande de l'aide et partage tes projets.",
    localizedRules: [
      "Respecte les membres de tous les pays et de tous les niveaux.",
      "Pas de harcelement, haine, toxicite, NSFW ou arnaques.",
      "Poste tes questions, portfolios et recherches d'equipe dans les bons salons.",
      "Mentionne tes collaborateurs quand tu partages un travail d'equipe.",
      "Les commissions et recrutements doivent rester dans le salon dedie."
    ]
  },
  {
    key: "de",
    emoji: "🇩🇪",
    name: "Germany",
    label: "Germany",
    categoryName: "🇩🇪 Germany Hub",
    language: "Deutsch",
    localizedWelcome:
      "Willkommen bei Roblox Studio Global. Wähle deine Rollen, triff Entwickler aus verschiedenen Ländern, frage nach Hilfe und teile deine Projekte.",
    localizedRules: [
      "Respektiere Menschen aus jedem Land und auf jedem Erfahrungsniveau.",
      "Kein Hass, keine Belästigung, keine Toxizität, kein NSFW und keine Betrugsversuche.",
      "Poste Fragen, Portfolios und Teamgesuche in die passenden Kanäle.",
      "Nenne Mitwirkende, wenn du Teamarbeit zeigst.",
      "Aufträge und Jobangebote gehören nur in den Hiring-Kanal."
    ]
  },
  {
    key: "pl",
    emoji: "🇵🇱",
    name: "Poland",
    label: "Poland",
    categoryName: "🇵🇱 Poland Hub",
    language: "Polski",
    localizedWelcome:
      "Witamy w Roblox Studio Global. Wybierz role, poznaj tworcow z roznych krajow, pros o pomoc i pokazuj swoje projekty.",
    localizedRules: [
      "Szanuj osoby z kazdego kraju i na kazdym poziomie doswiadczenia.",
      "Bez nękania, nienawisci, toksycznosci, NSFW i oszustw.",
      "Pytania, portfolio i szukanie zespolu publikuj w odpowiednich kanałach.",
      "Oznacz wspoltworcow, gdy pokazujesz prace zespolowa.",
      "Zlecenia i oferty pracy publikuj tylko w kanale hiring."
    ]
  },
  {
    key: "kz",
    emoji: "🇰🇿",
    name: "Kazakhstan",
    label: "Kazakhstan",
    categoryName: "🇰🇿 Kazakhstan Hub",
    language: "Қазақша",
    localizedWelcome:
      "Roblox Studio Global серверіне қош келдің. Рөлдеріңді таңда, әртүрлі елдерден келген әзірлеушілермен таныс, көмек сұра және жобаларыңды бөліс.",
    localizedRules: [
      "Кез келген елден және кез келген деңгейден келген қатысушыларды құрметте.",
      "Қорлау, жеккөрушілік, уытты мінез, NSFW және алаяқтыққа жол жоқ.",
      "Сұрақтарды, портфолионы және команда іздеуді тиісті арналарға жібер.",
      "Топтық жұмысты көрсетсең, серіктестеріңді белгіле.",
      "Ақылы жұмыс пен бос орындарды тек hiring арнасында жарияла."
    ]
  }
];

const skillRoles = [
  { key: "scripter", emoji: "💻", name: "Scripter", description: "Lua, gameplay systems, plugins" },
  { key: "builder", emoji: "🧱", name: "Builder", description: "Maps, environments, architecture" },
  { key: "animator", emoji: "🎬", name: "Animator", description: "Rigging, animation, cutscenes" },
  { key: "modeler", emoji: "🗿", name: "Modeler", description: "Meshes, props, hard surface" },
  { key: "uiux", emoji: "🎨", name: "UI/UX", description: "Menus, interfaces, visual systems" },
  { key: "vfx", emoji: "✨", name: "VFX", description: "Particles, shaders, polish" },
  { key: "sound", emoji: "🎧", name: "Sound Designer", description: "Music, SFX, ambience" },
  { key: "webdev", emoji: "🌐", name: "Web Dev", description: "Landing pages, dashboards, APIs" }
];

const announcementChannels = [
  {
    type: "text",
    name: "welcome-start-here",
    topic: "Start here: read the rules, choose your roles, and enter the global community."
  },
  {
    type: "text",
    name: "rules",
    topic: "Server rules and moderation expectations."
  },
  {
    type: "text",
    name: "language-guide",
    topic: "Read the welcome and rules in your language, then choose your roles."
  },
  {
    type: "text",
    name: "choose-your-roles",
    topic: "Verify yourself first, then choose your country and skill roles."
  },
  {
    type: "text",
    name: "announcements",
    topic: "Important updates for the community."
  }
];

const publicCategories = [
  {
    name: "🌍 Global Community",
    channels: [
      { type: "text", name: "global-chat", topic: "Main global chat for all countries." },
      { type: "text", name: "global-help", topic: "Ask for help with scripting, building, UI, models, or workflows." },
      { type: "text", name: "find-team", topic: "Find teammates, collaborators, or studios." },
      { type: "text", name: "showcase-global", topic: "Share your best work with the whole server." },
      { type: "text", name: "resources", topic: "Plugins, tutorials, tools, docs, and references." },
      { type: "voice", name: "Global Voice" }
    ]
  },
  {
    name: "🛠️ Creation Labs",
    channels: [
      { type: "text", name: "scripts-lab", topic: "Code reviews, snippets, and scripting help." },
      { type: "text", name: "builder-hub", topic: "Maps, environments, workflow tips, and level feedback." },
      { type: "text", name: "animation-hub", topic: "Animations, rigs, motion polish, and troubleshooting." },
      { type: "text", name: "models-materials", topic: "Models, materials, meshes, and assets." },
      { type: "text", name: "web-ui-dev", topic: "Web tools, UI systems, dashboards, and interfaces." },
      { type: "text", name: "hire-and-services", topic: "Commissions, paid gigs, and service offers." }
    ]
  },
  {
    name: "🆘 Support Center",
    channels: [
      { type: "text", name: "how-to-get-help", topic: "Explain your issue clearly and get help faster." },
      { type: "text", name: "bug-and-problem-help", topic: "Share screenshots, errors, logs, and ask for fixes." },
      { type: "text", name: "portfolio-feedback", topic: "Get feedback on builds, portfolios, and production quality." }
    ]
  }
];

const staffCategory = {
  name: "🛡️ Staff",
  channels: [
    { type: "text", name: "staff-chat", topic: "Private team chat for server staff." },
    { type: "text", name: "server-audit", topic: "Bot audit output and server setup notes." }
  ]
};

const fixedRoles = [
  { key: "founder", name: "👑 Founder", color: 0xf1c40f, hoist: true },
  { key: "admin", name: "🛡️ Admin", color: 0xe74c3c, hoist: true },
  { key: "moderator", name: "🔨 Moderator", color: 0x3498db, hoist: true },
  { key: "community", name: "🌐 Community Team", color: 0x2ecc71, hoist: true },
  { key: "country_lead", name: "📍 Country Lead", color: 0x9b59b6, hoist: true },
  { key: "verified", name: "✅ Verified", color: 0x95a5a6, hoist: false }
];

const setupSummary = {
  serverName: "Roblox Studio Global",
  welcomeText:
    "Welcome to Roblox Studio Global. Choose your country and creative roles, meet developers from different countries, ask for help, and share your work.",
  serverPitch:
    "A clean international home for Roblox creators: scripters, builders, animators, modelers, UI designers, VFX artists, sound designers, web developers, and studios.",
  rules: [
    "Respect every country, language, and skill level.",
    "No harassment, hate speech, scams, or NSFW content.",
    "Use the correct channels when asking for help or posting work.",
    "Showcase your own work or clearly credit collaborators.",
    "Keep paid work and recruiting inside the hiring channel."
  ]
};

module.exports = {
  countries,
  skillRoles,
  announcementChannels,
  publicCategories,
  staffCategory,
  fixedRoles,
  setupSummary
};
