const fs = require("node:fs");
const path = require("node:path");

const dataDir = path.join(__dirname, "..", "..", "data");
const levelsFile = path.join(dataDir, "levels.json");

function ensureStore() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  if (!fs.existsSync(levelsFile)) {
    fs.writeFileSync(levelsFile, JSON.stringify({ guilds: {} }, null, 2));
  }
}

function readStore() {
  ensureStore();
  return JSON.parse(fs.readFileSync(levelsFile, "utf8"));
}

function writeStore(store) {
  ensureStore();
  fs.writeFileSync(levelsFile, JSON.stringify(store, null, 2));
}

function getMemberRecord(guildId, userId) {
  const store = readStore();
  store.guilds[guildId] ??= { members: {} };
  store.guilds[guildId].members[userId] ??= {
    xp: 0,
    lastMessageAt: 0,
    voiceMinutes: 0,
    messages: 0
  };
  return { store, record: store.guilds[guildId].members[userId] };
}

function updateMemberRecord(guildId, userId, updater) {
  const { store, record } = getMemberRecord(guildId, userId);
  updater(record);
  writeStore(store);
  return record;
}

function getGuildLeaderboard(guildId) {
  const store = readStore();
  const guild = store.guilds[guildId];
  if (!guild) {
    return [];
  }

  return Object.entries(guild.members)
    .map(([userId, record]) => ({
      userId,
      ...record
    }))
    .sort((left, right) => right.xp - left.xp);
}

module.exports = {
  getMemberRecord,
  updateMemberRecord,
  getGuildLeaderboard
};
