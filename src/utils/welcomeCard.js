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
    name: "Signal",
    background: ["#08111F", "#132238", "#1C3D5A"],
    accent: "#7EE7FF",
    secondary: "#7B61FF",
    panel: "#0D1726"
  },
  {
    name: "Gold",
    background: ["#120E09", "#332417", "#6B4A2B"],
    accent: "#FFD166",
    secondary: "#FF9F1C",
    panel: "#17100B"
  },
  {
    name: "Emerald",
    background: ["#071611", "#113328", "#1F5C4A"],
    accent: "#78FFD6",
    secondary: "#40C9A2",
    panel: "#0B1914"
  },
  {
    name: "Neon",
    background: ["#120A18", "#29163A", "#4C2575"],
    accent: "#FF8AE2",
    secondary: "#7AF7FF",
    panel: "#170F22"
  }
];

const welcomeLines = [
  "A new creator just entered the global studio floor.",
  "Fresh ideas, new skills, and another future project lead.",
  "One more builder of worlds joined the network.",
  "The server just gained another creative spark.",
  "A new passport stamped for the Roblox creator lobby."
];

function pickRandom(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function createFallbackAvatarDataUri() {
  const svg = `
  <svg width="256" height="256" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#1F3B5B"/>
        <stop offset="100%" stop-color="#6C5CE7"/>
      </linearGradient>
    </defs>
    <rect width="256" height="256" rx="128" fill="url(#g)"/>
    <circle cx="128" cy="96" r="42" fill="rgba(255,255,255,0.85)"/>
    <path d="M56 212c12-42 44-62 72-62s60 20 72 62" fill="rgba(255,255,255,0.85)"/>
  </svg>
  `;

  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

async function fetchAvatarDataUri(avatarUrl) {
  try {
    const response = await fetch(avatarUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0"
      }
    });

    if (!response.ok) {
      return createFallbackAvatarDataUri();
    }

    const arrayBuffer = await response.arrayBuffer();
    const contentType = response.headers.get("content-type") || "image/png";
    return `data:${contentType};base64,${Buffer.from(arrayBuffer).toString("base64")}`;
  } catch {
    return createFallbackAvatarDataUri();
  }
}

async function createWelcomeCardSvg({ username, avatarUrl, memberCount, serverName }) {
  const theme = pickRandom(welcomeThemes);
  const line = pickRandom(welcomeLines);
  const embeddedAvatar = await fetchAvatarDataUri(avatarUrl);

  return `
  <svg width="1200" height="500" viewBox="0 0 1200 500" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${theme.background[0]}"/>
        <stop offset="48%" stop-color="${theme.background[1]}"/>
        <stop offset="100%" stop-color="${theme.background[2]}"/>
      </linearGradient>
      <linearGradient id="edge" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="${theme.accent}"/>
        <stop offset="100%" stop-color="${theme.secondary}"/>
      </linearGradient>
      <clipPath id="avatarClip">
        <rect x="92" y="112" width="220" height="220" rx="42"/>
      </clipPath>
      <filter id="soft" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="28"/>
      </filter>
    </defs>

    <rect width="1200" height="500" rx="34" fill="url(#bg)"/>
    <circle cx="1020" cy="96" r="150" fill="${theme.secondary}" opacity="0.16" filter="url(#soft)"/>
    <circle cx="160" cy="420" r="130" fill="${theme.accent}" opacity="0.12" filter="url(#soft)"/>
    <circle cx="860" cy="410" r="110" fill="#FFFFFF" opacity="0.06" filter="url(#soft)"/>

    <rect x="34" y="34" width="1132" height="432" rx="30" fill="rgba(4,10,18,0.24)" stroke="rgba(255,255,255,0.10)"/>
    <rect x="54" y="54" width="1092" height="392" rx="28" fill="${theme.panel}" opacity="0.72" stroke="rgba(255,255,255,0.08)"/>
    <rect x="54" y="54" width="1092" height="10" rx="5" fill="url(#edge)"/>

    <rect x="92" y="112" width="220" height="220" rx="42" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.14)"/>
    <image href="${embeddedAvatar}" x="92" y="112" width="220" height="220" clip-path="url(#avatarClip)" preserveAspectRatio="xMidYMid slice"/>

    <text x="358" y="118" fill="${theme.accent}" font-size="18" font-family="Segoe UI, Arial, sans-serif" letter-spacing="4">NEW MEMBER SIGNAL</text>
    <text x="358" y="194" fill="#FFFFFF" font-size="60" font-weight="800" font-family="Segoe UI, Arial, sans-serif">${escapeXml(username)}</text>
    <text x="358" y="246" fill="#DDEBFF" font-size="28" font-family="Segoe UI, Arial, sans-serif">just joined ${escapeXml(serverName)}</text>
    <text x="358" y="300" fill="rgba(255,255,255,0.82)" font-size="24" font-family="Segoe UI, Arial, sans-serif">${escapeXml(line)}</text>

    <rect x="358" y="338" width="380" height="18" rx="9" fill="rgba(255,255,255,0.09)"/>
    <rect x="358" y="338" width="240" height="18" rx="9" fill="url(#edge)"/>

    <rect x="858" y="130" width="220" height="150" rx="24" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.10)"/>
    <text x="968" y="178" fill="rgba(255,255,255,0.66)" font-size="18" font-family="Segoe UI, Arial, sans-serif" text-anchor="middle">MEMBER COUNT</text>
    <text x="968" y="236" fill="#FFFFFF" font-size="64" font-weight="800" font-family="Segoe UI, Arial, sans-serif" text-anchor="middle">${memberCount}</text>

    <rect x="92" y="372" width="986" height="46" rx="20" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.08)"/>
    <text x="116" y="402" fill="${theme.accent}" font-size="18" font-family="Segoe UI, Arial, sans-serif">NEXT STEP</text>
    <text x="250" y="402" fill="#F6FBFF" font-size="18" font-family="Segoe UI, Arial, sans-serif">Verify, pick your region, choose your roles, and start building with the community.</text>
  </svg>
  `;
}

async function renderWelcomeCard(options) {
  const svg = await createWelcomeCardSvg(options);
  const resvg = new Resvg(svg, {
    fitTo: {
      mode: "width",
      value: 1200
    }
  });

  return resvg.render().asPng();
}

module.exports = {
  renderWelcomeCard
};
