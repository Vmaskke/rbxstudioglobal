const rankTiers = [
  { minLevel: 1, name: "Newcomer", color: "#6C7A89" },
  { minLevel: 3, name: "Explorer", color: "#2980B9" },
  { minLevel: 6, name: "Creator", color: "#16A085" },
  { minLevel: 10, name: "Builder Pro", color: "#27AE60" },
  { minLevel: 15, name: "Studio Talent", color: "#F39C12" },
  { minLevel: 20, name: "Global Expert", color: "#D35400" },
  { minLevel: 30, name: "Legend", color: "#8E44AD" }
];

const levelingConfig = {
  messageXpMin: 12,
  messageXpMax: 24,
  messageCooldownMs: 30000,
  voiceXpPerMinute: 10,
  voiceTickMs: 60000,
  botCategoryName: "🤖 Control Hub",
  botChannels: [
    {
      type: "text",
      name: "member-tools",
      topic: "Use member-facing slash commands here: rank, stats, translation, and utility tools."
    },
    {
      type: "text",
      name: "level-pulse",
      topic: "Automatic level-up announcements, progression updates, and rank cards."
    }
  ]
};

function getRequiredXp(level) {
  return 120 + (level - 1) * 55;
}

function getLevelFromXp(totalXp) {
  let level = 1;
  let remainingXp = totalXp;

  while (remainingXp >= getRequiredXp(level)) {
    remainingXp -= getRequiredXp(level);
    level += 1;
  }

  return {
    level,
    currentXp: remainingXp,
    requiredXp: getRequiredXp(level)
  };
}

function getRankTier(level) {
  let currentTier = rankTiers[0];

  for (const tier of rankTiers) {
    if (level >= tier.minLevel) {
      currentTier = tier;
    }
  }

  return currentTier;
}

module.exports = {
  levelingConfig,
  rankTiers,
  getRequiredXp,
  getLevelFromXp,
  getRankTier
};
