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

function getApplicationPanels(guildId) {
  const { store, meta } = getGuildMeta(guildId);
  meta.applicationPanels ??= {};
  return {
    store,
    panels: meta.applicationPanels
  };
}

function setApplicationPanel(guildId, panelId, config) {
  const { store, panels } = getApplicationPanels(guildId);
  panels[panelId] = config;
  writeStateStore(store);
}

function getApplicationPanel(guildId, panelId) {
  const { panels } = getApplicationPanels(guildId);
  return panels[panelId] ?? null;
}

module.exports = {
  getManagedMessages,
  setManagedMessages,
  getGuildMeta,
  setGuildMetaValue,
  getApplicationPanels,
  setApplicationPanel,
  getApplicationPanel
};
