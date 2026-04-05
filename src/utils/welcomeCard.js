const { Resvg } = require("@resvg/resvg-js");

function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

const welcomeThemes = [
  {
    name: "Aurora",
    background: ["#07111E", "#123458", "#1F6E8C"],
    accent: "#72F2EB",
    glow: "#7B61FF"
  },
  {
    name: "Sunset",
    background: ["#1B1028", "#582534", "#CC5A71"],
    accent: "#FFD166",
    glow: "#FF7B54"
  },
  {
    name: "Mint",
    background: ["#091A16", "#12372A", "#436850"],
    accent: "#A8FFB5",
    glow: "#47E5BC"
  },
  {
    name: "Skyline",
    background: ["#081222", "#173E67", "#3E78B2"],
    accent: "#DDF4FF",
    glow: "#56CCF2"
  }
];

const welcomeLines = [
  "Your passport to the global Roblox creator scene.",
  "A new builder of worlds just arrived.",
  "Fresh energy for scripts, builds, and ideas.",
  "Another creator joined the studio floor.",
  "The international dev lobby just got stronger."
];

function pickRandom(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function createWelcomeCardSvg({ username, avatarUrl, memberCount, serverName }) {
  const theme = pickRandom(welcomeThemes);
  const line = pickRandom(welcomeLines);

  return `
  <svg width="1080" height="420" viewBox="0 0 1080 420" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${theme.background[0]}"/>
        <stop offset="55%" stop-color="${theme.background[1]}"/>
        <stop offset="100%" stop-color="${theme.background[2]}"/>
      </linearGradient>
      <linearGradient id="panel" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="rgba(255,255,255,0.12)"/>
        <stop offset="100%" stop-color="rgba(255,255,255,0.04)"/>
      </linearGradient>
      <clipPath id="avatarClip">
        <circle cx="178" cy="210" r="96" />
      </clipPath>
      <filter id="blur" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="22"/>
      </filter>
    </defs>

    <rect width="1080" height="420" rx="32" fill="url(#bg)"/>
    <circle cx="920" cy="80" r="130" fill="${theme.glow}" opacity="0.18" filter="url(#blur)"/>
    <circle cx="180" cy="360" r="120" fill="${theme.accent}" opacity="0.14" filter="url(#blur)"/>
    <circle cx="760" cy="330" r="90" fill="#FFFFFF" opacity="0.06" filter="url(#blur)"/>

    <rect x="32" y="32" width="1016" height="356" rx="28" fill="rgba(4,10,18,0.34)" stroke="rgba(255,255,255,0.12)"/>
    <rect x="56" y="56" width="968" height="308" rx="24" fill="url(#panel)" stroke="rgba(255,255,255,0.08)"/>

    <circle cx="178" cy="210" r="104" fill="rgba(255,255,255,0.08)" stroke="${theme.accent}" stroke-width="4"/>
    <image href="${avatarUrl}" x="82" y="114" width="192" height="192" clip-path="url(#avatarClip)" preserveAspectRatio="xMidYMid slice"/>

    <text x="322" y="124" fill="${theme.accent}" font-size="20" font-family="Segoe UI, Arial, sans-serif" letter-spacing="3">WELCOME TO ${escapeXml(serverName).toUpperCase()}</text>
    <text x="322" y="196" fill="#FFFFFF" font-size="54" font-weight="700" font-family="Segoe UI, Arial, sans-serif">${escapeXml(username)}</text>
    <text x="322" y="244" fill="#E6F1FF" font-size="28" font-family="Segoe UI, Arial, sans-serif">just entered the global creator lobby</text>
    <text x="322" y="292" fill="rgba(255,255,255,0.82)" font-size="24" font-family="Segoe UI, Arial, sans-serif">${escapeXml(line)}</text>

    <rect x="322" y="318" width="270" height="20" rx="10" fill="rgba(255,255,255,0.1)"/>
    <rect x="322" y="318" width="156" height="20" rx="10" fill="${theme.accent}"/>

    <text x="952" y="164" fill="rgba(255,255,255,0.72)" font-size="20" font-family="Segoe UI, Arial, sans-serif" text-anchor="end">CURRENT MEMBER COUNT</text>
    <text x="952" y="226" fill="#FFFFFF" font-size="62" font-weight="700" font-family="Segoe UI, Arial, sans-serif" text-anchor="end">${memberCount}</text>
    <text x="952" y="278" fill="${theme.accent}" font-size="24" font-family="Segoe UI, Arial, sans-serif" text-anchor="end">${theme.name} welcome style</text>
  </svg>
  `;
}

function renderWelcomeCard(options) {
  const svg = createWelcomeCardSvg(options);
  const resvg = new Resvg(svg, {
    fitTo: {
      mode: "width",
      value: 1080
    }
  });

  return resvg.render().asPng();
}

module.exports = {
  renderWelcomeCard
};
