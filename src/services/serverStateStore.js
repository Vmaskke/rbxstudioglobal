const fs = require("node:fs");
const path = require("node:path");

const dataDir = path.join(__dirname, "..", "..", "data");
const stateFile = path.join(dataDir, "server-state.json");

function ensureStateStore() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  if (!fs.existsSync(stateFile)) {
    fs.writeFileSync(stateFile, JSON.stringify({ guilds: {} }, null, 2));
  }
}

function readStateStore() {
  ensureStateStore();
  return JSON.parse(fs.readFileSync(stateFile, "utf8"));
}

function writeStateStore(store) {
  ensureStateStore();
  fs.writeFileSync(stateFile, JSON.stringify(store, null, 2));
}

function getManagedMessages(guildId, scope) {
  const store = readStateStore();
  store.guilds[guildId] ??= { managedMessages: {} };
  store.guilds[guildId].managedMessages[scope] ??= [];
  return {
    store,
    messages: store.guilds[guildId].managedMessages[scope]
  };
}

function setManagedMessages(guildId, scope, messages) {
  const store = readStateStore();
  store.guilds[guildId] ??= { managedMessages: {} };
  store.guilds[guildId].managedMessages[scope] = messages;
  writeStateStore(store);
}

function getGuildMeta(guildId) {
  const store = readStateStore();
  store.guilds[guildId] ??= { managedMessages: {}, meta: {} };
  store.guilds[guildId].meta ??= {};
  return {
    store,
    meta: store.guilds[guildId].meta
  };
}

function setGuildMetaValue(guildId, key, value) {
  const { store, meta } = getGuildMeta(guildId);
  meta[key] = value;
  writeStateStore(store);
}

module.exports = {
  getManagedMessages,
  setManagedMessages,
  getGuildMeta,
  setGuildMetaValue
};
