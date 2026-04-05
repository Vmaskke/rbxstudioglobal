const { Resvg } = require("@resvg/resvg-js");
const { getLevelFromXp, getRankTier } = require("../config/leveling");

function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function createRankCardSvg({ username, avatarUrl, xp }) {
  const progress = getLevelFromXp(xp);
  const tier = getRankTier(progress.level);
  const progressRatio = Math.max(0, Math.min(1, progress.currentXp / progress.requiredXp));
  const progressWidth = Math.round(700 * progressRatio);

  return `
  <svg width="960" height="320" viewBox="0 0 960 320" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#08131F"/>
        <stop offset="50%" stop-color="#13293D"/>
        <stop offset="100%" stop-color="#1B4332"/>
      </linearGradient>
      <linearGradient id="bar" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#00D1B2"/>
        <stop offset="100%" stop-color="${tier.color}"/>
      </linearGradient>
      <clipPath id="avatarClip">
        <circle cx="124" cy="120" r="64" />
      </clipPath>
      <filter id="soft" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="14"/>
      </filter>
    </defs>

    <rect width="960" height="320" rx="28" fill="url(#bg)"/>
    <circle cx="818" cy="68" r="110" fill="${tier.color}" opacity="0.18" filter="url(#soft)"/>
    <circle cx="120" cy="266" r="90" fill="#00D1B2" opacity="0.13" filter="url(#soft)"/>

    <rect x="38" y="38" width="884" height="244" rx="24" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.14)"/>

    <circle cx="124" cy="120" r="70" fill="#10273A" stroke="rgba(255,255,255,0.18)" stroke-width="4"/>
    <image href="${avatarUrl}" x="60" y="56" width="128" height="128" clip-path="url(#avatarClip)" preserveAspectRatio="xMidYMid slice"/>

    <text x="220" y="92" fill="#DFF6FF" font-size="20" font-family="Segoe UI, Arial, sans-serif" letter-spacing="2">ROBLOX STUDIO GLOBAL</text>
    <text x="220" y="138" fill="#FFFFFF" font-size="38" font-weight="700" font-family="Segoe UI, Arial, sans-serif">${escapeXml(username)}</text>
    <text x="220" y="178" fill="${tier.color}" font-size="24" font-weight="700" font-family="Segoe UI, Arial, sans-serif">${escapeXml(tier.name)}</text>

    <text x="760" y="128" fill="#FFFFFF" font-size="24" font-family="Segoe UI, Arial, sans-serif" text-anchor="end">LEVEL</text>
    <text x="870" y="132" fill="#FFFFFF" font-size="54" font-weight="700" font-family="Segoe UI, Arial, sans-serif" text-anchor="end">${progress.level}</text>

    <rect x="220" y="216" width="700" height="26" rx="13" fill="rgba(255,255,255,0.12)"/>
    <rect x="220" y="216" width="${progressWidth}" height="26" rx="13" fill="url(#bar)"/>

    <text x="220" y="270" fill="#D7E3F4" font-size="20" font-family="Segoe UI, Arial, sans-serif">${progress.currentXp} / ${progress.requiredXp} XP to next level</text>
    <text x="920" y="270" fill="#FFFFFF" font-size="20" font-family="Segoe UI, Arial, sans-serif" text-anchor="end">Total XP: ${xp}</text>
  </svg>
  `;
}

function renderRankCard(options) {
  const svg = createRankCardSvg(options);
  const resvg = new Resvg(svg, {
    fitTo: {
      mode: "width",
      value: 960
    }
  });

  return resvg.render().asPng();
}

module.exports = {
  renderRankCard
};
