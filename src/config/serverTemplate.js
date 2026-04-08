const countries = [
  {
    key: "ru",
    emoji: "🇷🇺",
    name: "Russia",
    label: "Russia",
    categoryName: "🇷🇺 Russia Hub",
    language: "Русский",
    localizedWelcome:
      "Добро пожаловать в Roblox Studio Global. Выбирай роли, знакомься с разработчиками из разных стран, проси помощь и показывай свои проекты.",
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
    language: "Turkce",
    localizedWelcome:
      "Roblox Studio Global'a hos geldin. Rollerini sec, farkli ulkelerden gelistiricilerle tanis, yardim iste ve projelerini paylas.",
    localizedRules: [
      "Her ulkeden ve her seviyeden kullaniciya saygi goster.",
      "Hakaret, nefret, toksiklik, NSFW ve dolandiricilik yasaktir.",
      "Sorularini, portfolyolarini ve ekip arayisini dogru kanallarda paylas.",
      "Ekip isi paylasiyorsan katkida bulunanlari belirt.",
      "Ucretli isler ve alim ilanlari sadece ilgili kanalda olmali."
    ]
  },
  {
    key: "br",
    emoji: "🇧🇷",
    name: "Brazil",
    label: "Brazil",
    categoryName: "🇧🇷 Brazil Hub",
    language: "Portugues",
    localizedWelcome:
      "Bem-vindo ao Roblox Studio Global. Escolha seus cargos, conheca desenvolvedores de varios paises, peca ajuda e mostre seus projetos.",
    localizedRules: [
      "Respeite pessoas de qualquer pais e qualquer nivel de experiencia.",
      "Sem assedio, odio, toxicidade, NSFW ou golpes.",
      "Publique perguntas, portfolio e busca de equipe nos canais corretos.",
      "De credito aos colaboradores ao mostrar trabalho em equipe.",
      "Comissoes e vagas devem ficar apenas no canal de contratacoes."
    ]
  },
  {
    key: "es",
    emoji: "🇪🇸",
    name: "Spain",
    label: "Spain",
    categoryName: "🇪🇸 Spain Hub",
    language: "Espanol",
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
    language: "Francais",
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
      "Willkommen bei Roblox Studio Global. Wahle deine Rollen, triff Entwickler aus verschiedenen Landern, frage nach Hilfe und teile deine Projekte.",
    localizedRules: [
      "Respektiere Menschen aus jedem Land und auf jedem Erfahrungsniveau.",
      "Kein Hass, keine Belastigung, keine Toxizitat, kein NSFW und keine Betrugsversuche.",
      "Poste Fragen, Portfolios und Teamgesuche in die passenden Kanale.",
      "Nenne Mitwirkende, wenn du Teamarbeit zeigst.",
      "Auftrage und Jobangebote gehoren nur in den Hiring-Kanal."
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
      "Bez nekana, nienawisci, toksycznosci, NSFW i oszustw.",
      "Pytania, portfolio i szukanie zespolu publikuj w odpowiednich kanalach.",
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
    language: "Kazakh",
    localizedWelcome:
      "Roblox Studio Global serverine qos keldin. Rolderindi tandap, arturli elderden kelgen azirleushilermen tanis, komek sura jane jobalaryndy bolis.",
    localizedRules: [
      "Kez kelgen elden jane kez kelgen dengeiden kelgen qatysushylardy qurmette.",
      "Qorlau, jekkorushilik, uytti minez, NSFW jane alayaqtyqqa jol joq.",
      "Suraqtardy, portfolio jane komanda izdeudi tiisti arnalarga jibер.",
      "Toptiq jumysty korsetseń, seriktesterindi belgile.",
      "Aqyly jumys pen bos oryndardy tek hiring arnasında jariyala."
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
  { type: "text", name: "launchpad", topic: "Start here, learn the server flow, and unlock the full community." },
  { type: "text", name: "arrival-feed", topic: "Curated welcome moments and arrival cards for new members." },
  { type: "text", name: "entry-log", topic: "Private-style tracking feed for joins, account age, and member entry logs." },
  { type: "text", name: "rules", topic: "Server rules and moderation expectations." },
  { type: "text", name: "language-atlas", topic: "Find your language, read the basics, and enter the right regional space." },
  { type: "text", name: "server-map", topic: "A clean map of where to talk, post, recruit, and grow." },
  { type: "text", name: "identity-studio", topic: "Verify first, then build your identity with country and skill roles." },
  { type: "text", name: "studio-bulletin", topic: "High-signal updates, releases, and important server notices." }
];

const publicCategories = [
  {
    name: "🌐 Core Network",
    channels: [
      { type: "text", name: "creators-lounge", topic: "Main cross-region social space for the whole community." },
      { type: "text", name: "dev-help-desk", topic: "Ask for scripting, building, UI, model, and workflow help." },
      { type: "text", name: "crew-finder", topic: "Open the recruitment panel and publish structured team requests." },
      { type: "text", name: "talent-board", topic: "Published recruitment ads, openings, and collaboration requests." },
      { type: "text", name: "showcase-stage", topic: "Share polished work, WIPs, trailers, shots, and major milestones." },
      { type: "text", name: "resource-vault", topic: "Docs, plugins, tools, references, pipelines, and useful links." },
      { type: "voice", name: "Open Studio" }
    ]
  },
  {
    name: "🛠 Production Floor",
    channels: [
      { type: "text", name: "scripting-lab", topic: "Code reviews, snippets, systems, debugging, and Roblox Lua help." },
      { type: "text", name: "worldbuilding-lab", topic: "Maps, architecture, environment design, and building workflows." },
      { type: "text", name: "motion-lab", topic: "Animation, rigs, timing, polish, and movement direction." },
      { type: "text", name: "asset-foundry", topic: "Models, materials, meshes, props, and production assets." },
      { type: "text", name: "interface-lab", topic: "UI, UX, dashboards, web tools, and creator-facing systems." },
      { type: "text", name: "opportunity-desk", topic: "Commissions, paid work, offers, hiring, and service posts." }
    ]
  },
  {
    name: "🆘 Support Desk",
    channels: [
      { type: "text", name: "help-desk", topic: "Learn how to ask better questions and get useful answers faster." },
      { type: "text", name: "issue-triage", topic: "Share screenshots, errors, logs, and technical problems for review." },
      { type: "text", name: "portfolio-clinic", topic: "Get sharp feedback on portfolios, presentations, and quality." }
    ]
  }
];

const mediaCategory = {
  name: "🎥 Creator Wing",
  channels: [
    { type: "text", name: "creator-program", topic: "Read how the Media role works and what creators can unlock." },
    { type: "text", name: "media-apply", topic: "Apply for the Media role with your channel links and creator profile." },
    { type: "text", name: "creator-releases", topic: "Approved media creators publish new uploads and creator drops here." }
  ]
};

const reviewCategory = {
  name: "🗂 Control Room",
  channels: [
    { type: "text", name: "media-review-queue", topic: "Private review queue for Media applications." },
    { type: "text", name: "region-review-queue", topic: "Private review queue for Region Leader applications." }
  ]
};

const applicationCategory = {
  name: "📌 Leadership Program",
  channels: [
    { type: "text", name: "leader-program", topic: "Read what a region leader does and what is expected." },
    { type: "text", name: "leader-apply", topic: "Apply to become the leader for your region." }
  ]
};

const staffCategory = {
  name: "🛡 Operations",
  channels: [
    { type: "text", name: "ops-chat", topic: "Private operations chat for server management." },
    { type: "text", name: "audit-log", topic: "Bot audit output, setup notes, and structural checks." }
  ]
};

const fixedRoles = [
  { key: "founder", name: "👑 Founder", color: 0xf1c40f, hoist: true },
  { key: "admin", name: "🛡️ Admin", color: 0xe74c3c, hoist: true },
  { key: "moderator", name: "🔨 Moderator", color: 0x3498db, hoist: true },
  { key: "community", name: "🌐 Community Team", color: 0x2ecc71, hoist: true },
  { key: "country_lead", name: "📍 Country Lead", color: 0x9b59b6, hoist: true },
  { key: "verified", name: "✅ Verified", color: 0x95a5a6, hoist: false },
  { key: "media", name: "🎥 Media", color: 0xff4757, hoist: true },
  { key: "media_reviewer", name: "📝 Media Reviewer", color: 0x00cec9, hoist: true }
];

const setupSummary = {
  serverName: "Roblox Studio Global",
  welcomeText:
    "Welcome to Roblox Studio Global. Build your identity, join the right regional space, meet serious creators, ask for help, and grow your projects with people from different countries.",
  serverPitch:
    "A polished international platform for Roblox creators: scripters, builders, animators, modelers, UI designers, VFX artists, sound designers, web developers, media creators, and studios.",
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
  mediaCategory,
  applicationCategory,
  reviewCategory,
  staffCategory,
  fixedRoles,
  setupSummary
};
