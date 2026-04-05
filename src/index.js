require("dotenv").config();

const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  AttachmentBuilder,
  ChannelType,
  Client,
  EmbedBuilder,
  GatewayIntentBits,
  PermissionFlagsBits,
  REST,
  Routes,
  SlashCommandBuilder,
  StringSelectMenuBuilder
} = require("discord.js");

const {
  applicationCategory,
  announcementChannels,
  countries,
  fixedRoles,
  mediaCategory,
  publicCategories,
  setupSummary,
  skillRoles,
  staffCategory
} = require("./config/serverTemplate");
const {
  levelingConfig,
  getLevelFromXp,
  getRankTier
} = require("./config/leveling");
const {
  getMemberRecord,
  updateMemberRecord,
  getGuildLeaderboard
} = require("./services/levelingStore");
const {
  getManagedMessages,
  setManagedMessages,
  getGuildMeta,
  setGuildMetaValue
} = require("./services/serverStateStore");
const { renderRankCard } = require("./utils/rankCard");

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.CLIENT_ID;
const guildId = process.env.GUILD_ID;

if (!token || !clientId || !guildId) {
  throw new Error("Missing DISCORD_TOKEN, CLIENT_ID, or GUILD_ID in environment.");
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildVoiceStates
  ]
});

const activeVoiceMembers = new Map();

const commands = [
  new SlashCommandBuilder()
    .setName("setup")
    .setDescription("Create and configure the Roblox Studio Global server structure.")
    .addStringOption((option) =>
      option
        .setName("mode")
        .setDescription("How aggressively the bot should create missing items.")
        .setRequired(true)
        .addChoices(
          { name: "safe", value: "safe" },
          { name: "full", value: "full" }
        )
    ),
  new SlashCommandBuilder()
    .setName("post-panels")
    .setDescription("Post the onboarding, rules, and role selection panels in the current channel."),
  new SlashCommandBuilder()
    .setName("audit")
    .setDescription("Inspect the current server and summarize roles, categories, and channels."),
  new SlashCommandBuilder()
    .setName("refresh-commands")
    .setDescription("Re-register slash commands for this guild."),
  new SlashCommandBuilder()
    .setName("rank")
    .setDescription("Show your level card or someone else's.")
    .addUserOption((option) =>
      option
        .setName("member")
        .setDescription("Member to inspect")
        .setRequired(false)
    ),
  new SlashCommandBuilder()
    .setName("leaderboard")
    .setDescription("Show the server XP leaderboard.")
].map((command) => command.toJSON());

function chunk(items, size) {
  const chunks = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

async function registerCommands() {
  const signature = JSON.stringify(commands);
  const { meta } = getGuildMeta(guildId);

  if (meta.commandsSignature === signature) {
    return false;
  }

  const rest = new REST({ version: "10" }).setToken(token);
  await rest.put(Routes.applicationGuildCommands(clientId, guildId), {
    body: commands
  });
  setGuildMetaValue(guildId, "commandsSignature", signature);
  return true;
}

async function ensureRole(guild, definition) {
  const existing = guild.roles.cache.find((role) => role.name === definition.name);
  if (existing) {
    await existing
      .edit({
        color: definition.color ?? existing.color,
        hoist: definition.hoist ?? existing.hoist,
        mentionable: false
      })
      .catch(() => null);
    return existing;
  }

  return guild.roles.create({
    name: definition.name,
    color: definition.color ?? 0x5865f2,
    hoist: definition.hoist ?? false,
    mentionable: false,
    reason: "Roblox Studio Global setup"
  });
}

async function ensureCategory(guild, name, overwrites) {
  const existing = guild.channels.cache.find(
    (channel) => channel.type === ChannelType.GuildCategory && channel.name === name
  );
  if (existing) {
    await existing.permissionOverwrites.set(overwrites).catch(() => null);
    return existing;
  }

  return guild.channels.create({
    name,
    type: ChannelType.GuildCategory,
    permissionOverwrites: overwrites,
    reason: "Roblox Studio Global setup"
  });
}

async function ensureChildChannel(guild, category, channelDefinition, overwrites) {
  const expectedType =
    channelDefinition.type === "voice" ? ChannelType.GuildVoice : ChannelType.GuildText;

  const existing = guild.channels.cache.find(
    (channel) =>
      channel.parentId === category.id &&
      channel.name === channelDefinition.name &&
      channel.type === expectedType
  );

  if (existing) {
    if (existing.parentId !== category.id) {
      await existing.setParent(category.id).catch(() => null);
    }

    if (channelDefinition.topic && existing.type === ChannelType.GuildText) {
      await existing.setTopic(channelDefinition.topic).catch(() => null);
    }

    await existing.permissionOverwrites.set(overwrites).catch(() => null);
    return existing;
  }

  return guild.channels.create({
    name: channelDefinition.name,
    type: expectedType,
    parent: category.id,
    topic: channelDefinition.topic,
    permissionOverwrites: overwrites,
    reason: "Roblox Studio Global setup"
  });
}

async function getBotChannels(guild) {
  await guild.channels.fetch();

  const commandsChannel = guild.channels.cache.find(
    (channel) => channel.name === levelingConfig.botChannels[0].name
  );
  const levelFeedChannel = guild.channels.cache.find(
    (channel) => channel.name === levelingConfig.botChannels[1].name
  );

  return {
    commandsChannel,
    levelFeedChannel
  };
}

async function positionChildren(guild, category, orderedChannels) {
  for (let index = 0; index < orderedChannels.length; index += 1) {
    const definition = orderedChannels[index];
    const expectedType =
      definition.type === "voice" ? ChannelType.GuildVoice : ChannelType.GuildText;

    const channel = guild.channels.cache.find(
      (item) => item.name === definition.name && item.type === expectedType
        && item.parentId === category.id
    );

    if (channel) {
      await channel.setPosition(index).catch(() => null);
    }
  }
}

function buildBaseOverwrites(guild, adminRoleIds) {
  const overwrites = [
    {
      id: guild.roles.everyone.id,
      allow: [PermissionFlagsBits.ViewChannel]
    }
  ];

  for (const roleId of adminRoleIds) {
    overwrites.push({
      id: roleId,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ManageMessages,
        PermissionFlagsBits.ManageChannels
      ]
    });
  }

  return overwrites;
}

function buildReadOnlyOverwrites(guild, visibleRoleIds, writerRoleIds) {
  const overwrites = [
    {
      id: guild.roles.everyone.id,
      deny: [PermissionFlagsBits.SendMessages]
    }
  ];

  for (const roleId of visibleRoleIds) {
    overwrites.push({
      id: roleId,
      allow: [PermissionFlagsBits.ViewChannel],
      deny: [PermissionFlagsBits.SendMessages]
    });
  }

  for (const roleId of writerRoleIds) {
    overwrites.push({
      id: roleId,
      allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages]
    });
  }

  return overwrites;
}

function buildVisibleWriteOverwrites(guild, visibleRoleIds, writerRoleIds) {
  const overwrites = [
    {
      id: guild.roles.everyone.id,
      deny: [PermissionFlagsBits.SendMessages]
    }
  ];

  for (const roleId of visibleRoleIds) {
    overwrites.push({
      id: roleId,
      allow: [PermissionFlagsBits.ViewChannel]
    });
  }

  for (const roleId of writerRoleIds) {
    overwrites.push({
      id: roleId,
      allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages]
    });
  }

  return overwrites;
}

function buildVerifiedOverwrites(guild, verifiedRoleId, adminRoleIds) {
  const overwrites = [
    {
      id: guild.roles.everyone.id,
      deny: [PermissionFlagsBits.ViewChannel]
    },
    {
      id: verifiedRoleId,
      allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.Connect]
    }
  ];

  for (const roleId of adminRoleIds) {
    overwrites.push({
      id: roleId,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.Connect,
        PermissionFlagsBits.ManageMessages,
        PermissionFlagsBits.ManageChannels
      ]
    });
  }

  return overwrites;
}

function buildPrivateCountryOverwrites(guild, verifiedRoleId, countryRoleId, adminRoleIds) {
  const overwrites = [
    {
      id: guild.roles.everyone.id,
      deny: [PermissionFlagsBits.ViewChannel]
    },
    {
      id: verifiedRoleId,
      allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect],
      deny: [PermissionFlagsBits.SendMessages]
    },
    {
      id: countryRoleId,
      allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.Connect]
    }
  ];

  for (const roleId of adminRoleIds) {
    overwrites.push({
      id: roleId,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.Connect,
        PermissionFlagsBits.ManageMessages,
        PermissionFlagsBits.ManageChannels
      ]
    });
  }

  return overwrites;
}

function buildRegionalNewsOverwrites(guild, verifiedRoleId, countryRoleId, leaderRoleId, adminRoleIds) {
  const writerRoleIds = [countryRoleId, leaderRoleId, ...adminRoleIds].filter(Boolean);
  return buildReadOnlyOverwrites(guild, [verifiedRoleId, ...adminRoleIds], writerRoleIds);
}

function createOverviewEmbed() {
  return new EmbedBuilder()
    .setTitle("Roblox Studio Global")
    .setDescription(setupSummary.welcomeText)
    .setColor(0x00b894)
    .addFields(
      {
        name: "What this server is for",
        value: setupSummary.serverPitch
      },
      {
        name: "How to start",
        value: "1. Read the rules.\n2. Choose your country.\n3. Choose your creative roles.\n4. Jump into global chat or your local hub."
      }
    );
}

function createRulesEmbed() {
  return new EmbedBuilder()
    .setTitle("Server Rules")
    .setColor(0xe67e22)
    .setDescription(
      "These rules keep the server welcoming, useful, and safe for creators from every country."
    )
    .addFields(
      setupSummary.rules.map((rule, index) => ({
        name: `Rule ${index + 1}`,
        value: rule
      }))
    );
}

function createChannelGuideEmbed() {
  return new EmbedBuilder()
    .setTitle("Channel Guide")
    .setColor(0x5865f2)
    .addFields(
      {
        name: "#global-chat",
        value: "Main public chat for everyone."
      },
      {
        name: "#global-help",
        value: "Ask for scripting, building, UI, animation, modeling, and workflow help."
      },
      {
        name: "#find-team",
        value: "Find teammates, studios, contractors, or long-term collaborators."
      },
      {
        name: "#showcase-global",
        value: "Share your best work, WIPs, trailers, renders, and portfolio posts."
      },
      {
        name: "#hire-and-services",
        value: "Paid jobs, commissions, team hiring, and service offers."
      }
    );
}

function createNavigationEmbed() {
  return new EmbedBuilder()
    .setTitle("Server Navigation")
    .setColor(0x6c5ce7)
    .setDescription("Use this as your quick map for the whole server.")
    .addFields(
      {
        name: "Start Here",
        value: "Read #rules, open #navigation, verify in #choose-your-roles, then pick your country and creative roles."
      },
      {
        name: "Media & YouTube",
        value: "Use #apply-for-youtuber to request the YouTuber role. Approved creators post releases in #youtuber-drops."
      },
      {
        name: "Regional leadership",
        value: "Use #apply-for-region-leader if you want to lead activity and publish regional news."
      },
      {
        name: "Regional hubs",
        value: "Each country hub has chat, help, showcase, regional-news, and voice channels."
      }
    );
}

function createLanguageGuideEmbed() {
  return new EmbedBuilder()
    .setTitle("Language Guide")
    .setColor(0x8e44ad)
    .setDescription(
      "Pick your country role to unlock your private country hub with local chat, help, showcase, and voice channels."
    )
    .addFields(
      countries.map((country) => ({
        name: `${country.emoji} ${country.name}`,
        value: `${country.language} community hub`
      }))
    );
}

function createLocalizedEmbeds() {
  return countries.map((country) =>
    new EmbedBuilder()
      .setTitle(`${country.emoji} ${country.name} Guide`)
      .setColor(0x1abc9c)
      .setDescription(country.localizedWelcome)
      .addFields(
        country.localizedRules.map((rule, index) => ({
          name: `${country.language} ${index + 1}`,
          value: rule
        }))
      )
  );
}

function createLeaderboardEmbed(entries, guild) {
  return new EmbedBuilder()
    .setTitle("XP Leaderboard")
    .setColor(0x00b894)
    .setDescription(
      entries.length
        ? entries
            .map((entry, index) => {
              const member = guild.members.cache.get(entry.userId);
              const progress = getLevelFromXp(entry.xp);
              return `${index + 1}. ${member ? member.user.displayName : `User ${entry.userId}`} - Level ${progress.level} - ${entry.xp} XP`;
            })
            .join("\n")
        : "No XP data yet."
    );
}

function createCommandsEmbed() {
  return new EmbedBuilder()
    .setTitle("Bot Commands")
    .setColor(0x00cec9)
    .setDescription("Main slash commands available in this server.")
    .addFields(
      { name: "/setup", value: "Create or sync the full server structure." },
      { name: "/audit", value: "Inspect channels, categories, and roles." },
      { name: "/rank", value: "Generate a rank card image for yourself or another member." },
      { name: "/leaderboard", value: "Show the top XP users." },
      { name: "/refresh-commands", value: "Force-refresh slash commands after updates." }
    );
}

function createYouTuberInfoEmbed() {
  return new EmbedBuilder()
    .setTitle("YouTuber Program")
    .setColor(0xff4757)
    .setDescription("Creators can apply for the YouTuber role and then publish fresh videos in the creator channel.")
    .addFields(
      {
        name: "How to apply",
        value: "Post your YouTube channel link, your niche, your language, and one recent Roblox-related video."
      },
      {
        name: "What approved YouTubers can do",
        value: "Post new uploads in #youtuber-drops and help grow the international community."
      }
    );
}

function createRegionLeaderInfoEmbed() {
  return new EmbedBuilder()
    .setTitle("Region Leader Program")
    .setColor(0xfdcb6e)
    .setDescription("Region leaders keep their local community active and publish updates in their own language.")
    .addFields(
      {
        name: "Leader duties",
        value: "Post regional news, welcome new members, encourage activity, and keep the local hub alive."
      },
      {
        name: "How to apply",
        value: "Share your country, your timezone, your language, and why you want to lead your region."
      }
    );
}

function createVerificationEmbed() {
  return new EmbedBuilder()
    .setTitle("Verification Required")
    .setColor(0xe74c3c)
    .setDescription(
      "Press the verification button below to unlock the server. Until you verify, the global and country channels stay hidden."
    )
    .addFields(
      {
        name: "What verification does",
        value: "Gives you the Verified role and opens the community channels."
      },
      {
        name: "After verification",
        value: "Choose your country, then select all creative roles that match what you do."
      }
    );
}

function createCountryMenu() {
  return new StringSelectMenuBuilder()
    .setCustomId("select-country")
    .setPlaceholder("Choose your country role")
    .addOptions(
      countries.slice(0, 25).map((country) => ({
        label: country.label,
        description: `Join the ${country.name} category`,
        value: `country:${country.key}`,
        emoji: country.emoji
      }))
    );
}

function createUtilityButtons() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("show-server-info")
      .setLabel("Server Info")
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId("clear-country")
      .setLabel("Clear Country")
      .setStyle(ButtonStyle.Danger)
  );
}

function createVerificationButtons() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("verify-member")
      .setLabel("Verify & Enter")
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId("show-server-info")
      .setLabel("Server Info")
      .setStyle(ButtonStyle.Secondary)
  );
}

async function clearBotMessages(channel) {
  if (!channel || channel.type !== ChannelType.GuildText) {
    return;
  }

  const messages = await channel.messages.fetch({ limit: 100 }).catch(() => null);
  if (!messages) {
    return;
  }

  const ownMessages = messages.filter((message) => message.author.id === client.user.id);
  for (const message of ownMessages.values()) {
    await message.delete().catch(() => null);
  }
}

function normalizePayload(payload) {
  return JSON.stringify({
    content: payload.content ?? null,
    embeds: (payload.embeds ?? []).map((embed) => embed.toJSON()),
    components: (payload.components ?? []).map((component) => component.toJSON())
  });
}

async function syncManagedMessages(channel, scope, payloads) {
  if (!channel || channel.type !== ChannelType.GuildText) {
    return;
  }

  const { messages: storedMessages } = getManagedMessages(channel.guild.id, scope);
  const nextState = [];

  for (let index = 0; index < payloads.length; index += 1) {
    const payload = payloads[index];
    const signature = normalizePayload(payload);
    const existing = storedMessages[index];
    let message = null;

    if (existing?.messageId) {
      message = await channel.messages.fetch(existing.messageId).catch(() => null);
    }

    if (message) {
      if (existing.signature !== signature) {
        await message.edit(payload).catch(() => null);
      }
      nextState.push({ messageId: message.id, signature });
      continue;
    }

    const created = await channel.send(payload).catch(() => null);
    if (created) {
      nextState.push({ messageId: created.id, signature });
    }
  }

  for (let index = payloads.length; index < storedMessages.length; index += 1) {
    const stale = storedMessages[index];
    if (stale?.messageId) {
      const staleMessage = await channel.messages.fetch(stale.messageId).catch(() => null);
      if (staleMessage) {
        await staleMessage.delete().catch(() => null);
      }
    }
  }

  setManagedMessages(channel.guild.id, scope, nextState);
}

async function syncServer(guild, mode) {
  await guild.roles.fetch();
  await guild.channels.fetch();

  if (mode === "full") {
    await guild.setName(setupSummary.serverName).catch(() => null);
  }

  const ensuredFixedRoles = {};
  for (const roleDefinition of fixedRoles) {
    ensuredFixedRoles[roleDefinition.key] = await ensureRole(guild, roleDefinition);
  }

  const countryRoleMap = new Map();
  for (const country of countries) {
    const role = await ensureRole(guild, {
      name: `${country.emoji} ${country.name}`,
      color: 0x1abc9c,
      hoist: true
    });
    countryRoleMap.set(country.key, role);
  }

  const regionLeaderRoleMap = new Map();
  for (const country of countries) {
    const role = await ensureRole(guild, {
      name: `${country.emoji} ${country.name} Leader`,
      color: 0xf39c12,
      hoist: true
    });
    regionLeaderRoleMap.set(country.key, role);
  }

  const skillRoleMap = new Map();
  for (const skill of skillRoles) {
    const role = await ensureRole(guild, {
      name: `${skill.emoji} ${skill.name}`,
      color: 0xe67e22,
      hoist: false
    });
    skillRoleMap.set(skill.key, role);
  }

  const adminRoleIds = [
    ensuredFixedRoles.founder.id,
    ensuredFixedRoles.admin.id,
    ensuredFixedRoles.moderator.id,
    ensuredFixedRoles.community.id,
    ensuredFixedRoles.country_lead.id
  ];
  const verifiedRoleId = ensuredFixedRoles.verified.id;
  const youtuberRoleId = ensuredFixedRoles.youtuber.id;
  const onboardingWriters = [ensuredFixedRoles.founder.id, ensuredFixedRoles.community.id];
  const visibleVerifiedRoles = [verifiedRoleId, ...adminRoleIds];
  const founderAndCommunity = [ensuredFixedRoles.founder.id, ensuredFixedRoles.community.id];

  const orderedCategories = [];
  const baseOverwrites = buildBaseOverwrites(guild, adminRoleIds);
  const verifiedOverwrites = buildVerifiedOverwrites(guild, verifiedRoleId, adminRoleIds);

  const onboardingCategory = await ensureCategory(guild, "🚀 Start Here", baseOverwrites);
  orderedCategories.push(onboardingCategory);

  for (const channelDefinition of announcementChannels) {
    let overwrites = baseOverwrites;

    if (["welcome-start-here", "rules", "language-guide", "navigation", "choose-your-roles"].includes(channelDefinition.name)) {
      overwrites = buildReadOnlyOverwrites(guild, visibleVerifiedRoles, onboardingWriters);
    }

    if (channelDefinition.name === "announcements") {
      overwrites = buildReadOnlyOverwrites(guild, visibleVerifiedRoles, onboardingWriters);
    }

    await ensureChildChannel(guild, onboardingCategory, channelDefinition, overwrites);
  }
  await positionChildren(guild, onboardingCategory, announcementChannels);

  for (const categoryDefinition of publicCategories) {
    const category = await ensureCategory(guild, categoryDefinition.name, verifiedOverwrites);
    orderedCategories.push(category);

    for (const channelDefinition of categoryDefinition.channels) {
      let overwrites = verifiedOverwrites;

      if (channelDefinition.name === "resources") {
        overwrites = buildReadOnlyOverwrites(guild, visibleVerifiedRoles, onboardingWriters);
      }

      if (channelDefinition.name === "how-to-get-help") {
        overwrites = buildReadOnlyOverwrites(guild, visibleVerifiedRoles, onboardingWriters);
      }

      await ensureChildChannel(guild, category, channelDefinition, overwrites);
    }

    await positionChildren(guild, category, categoryDefinition.channels);
  }

  const media = await ensureCategory(guild, mediaCategory.name, verifiedOverwrites);
  orderedCategories.push(media);
  for (const channelDefinition of mediaCategory.channels) {
    let overwrites = verifiedOverwrites;
    if (channelDefinition.name === "youtuber-info") {
      overwrites = buildReadOnlyOverwrites(guild, visibleVerifiedRoles, founderAndCommunity);
    }
    if (channelDefinition.name === "apply-for-youtuber") {
      overwrites = buildVisibleWriteOverwrites(guild, [verifiedRoleId, ...adminRoleIds], [verifiedRoleId, ...adminRoleIds]);
    }
    if (channelDefinition.name === "youtuber-drops") {
      overwrites = buildReadOnlyOverwrites(
        guild,
        [verifiedRoleId, ...adminRoleIds],
        [youtuberRoleId, ...founderAndCommunity, ...adminRoleIds]
      );
    }
    await ensureChildChannel(guild, media, channelDefinition, overwrites);
  }
  await positionChildren(guild, media, mediaCategory.channels);

  const applications = await ensureCategory(guild, applicationCategory.name, verifiedOverwrites);
  orderedCategories.push(applications);
  for (const channelDefinition of applicationCategory.channels) {
    let overwrites = verifiedOverwrites;
    if (channelDefinition.name === "region-leader-info") {
      overwrites = buildReadOnlyOverwrites(guild, visibleVerifiedRoles, founderAndCommunity);
    }
    if (channelDefinition.name === "apply-for-region-leader") {
      overwrites = buildVisibleWriteOverwrites(guild, [verifiedRoleId, ...adminRoleIds], [verifiedRoleId, ...adminRoleIds]);
    }
    await ensureChildChannel(guild, applications, channelDefinition, overwrites);
  }
  await positionChildren(guild, applications, applicationCategory.channels);

  for (const country of countries) {
    const countryRole = countryRoleMap.get(country.key);
    const leaderRole = regionLeaderRoleMap.get(country.key);
    const overwrites = buildPrivateCountryOverwrites(
      guild,
      verifiedRoleId,
      countryRole.id,
      adminRoleIds
    );
    const category = await ensureCategory(guild, country.categoryName, overwrites);
    orderedCategories.push(category);

    const countryChannels = [
      { type: "text", name: "chat", topic: `${country.name} community chat.` },
      { type: "text", name: "regional-news", topic: `${country.name} local news and updates.` },
      { type: "text", name: "help", topic: `${country.name} help and support channel.` },
      { type: "text", name: "showcase", topic: `${country.name} builds, scripts, art, and projects.` },
      { type: "voice", name: `${country.name} Voice` }
    ];

    for (const channelDefinition of countryChannels) {
      const channelOverwrites =
        channelDefinition.name === "regional-news"
          ? buildRegionalNewsOverwrites(
              guild,
              verifiedRoleId,
              countryRole.id,
              leaderRole?.id,
              adminRoleIds
            )
          : overwrites;
      await ensureChildChannel(guild, category, channelDefinition, channelOverwrites);
    }

    await positionChildren(guild, category, countryChannels);
  }

  const staffOverwrites = [
    {
      id: guild.roles.everyone.id,
      deny: [PermissionFlagsBits.ViewChannel]
    },
    ...adminRoleIds.map((roleId) => ({
      id: roleId,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.Connect,
        PermissionFlagsBits.ManageMessages,
        PermissionFlagsBits.ManageChannels
      ]
    }))
  ];

  const staff = await ensureCategory(guild, staffCategory.name, staffOverwrites);
  orderedCategories.push(staff);
  for (const channelDefinition of staffCategory.channels) {
    await ensureChildChannel(guild, staff, channelDefinition, staffOverwrites);
  }
  await positionChildren(guild, staff, staffCategory.channels);

  const botCategory = await ensureCategory(guild, levelingConfig.botCategoryName, verifiedOverwrites);
  orderedCategories.push(botCategory);
  for (const channelDefinition of levelingConfig.botChannels) {
    const isFeed = channelDefinition.name === "level-feed";
    const overwrites = isFeed
      ? buildReadOnlyOverwrites(guild, visibleVerifiedRoles, founderAndCommunity)
      : verifiedOverwrites;
    await ensureChildChannel(guild, botCategory, channelDefinition, overwrites);
  }
  await positionChildren(guild, botCategory, levelingConfig.botChannels);

  for (let index = 0; index < orderedCategories.length; index += 1) {
    await orderedCategories[index].setPosition(index).catch(() => null);
  }

  let rolePosition = guild.roles.cache.size + 5;
  const orderedRoleIds = [
    ensuredFixedRoles.founder.id,
    ensuredFixedRoles.admin.id,
    ensuredFixedRoles.moderator.id,
    ensuredFixedRoles.community.id,
    ensuredFixedRoles.country_lead.id,
    ensuredFixedRoles.verified.id,
    ensuredFixedRoles.youtuber.id,
    ...countries.map((country) => countryRoleMap.get(country.key)?.id).filter(Boolean),
    ...countries.map((country) => regionLeaderRoleMap.get(country.key)?.id).filter(Boolean),
    ...skillRoles.map((skill) => skillRoleMap.get(skill.key)?.id).filter(Boolean)
  ];

  for (const roleId of orderedRoleIds) {
    const role = guild.roles.cache.get(roleId);
    if (role) {
      await role.setPosition(rolePosition).catch(() => null);
      rolePosition -= 1;
    }
  }

  const rulesChannel = guild.channels.cache.find(
    (channel) => channel.parentId === onboardingCategory.id && channel.name === "rules"
  );
  const rolesChannel = guild.channels.cache.find(
    (channel) => channel.parentId === onboardingCategory.id && channel.name === "choose-your-roles"
  );
  const welcomeChannel = guild.channels.cache.find(
    (channel) => channel.parentId === onboardingCategory.id && channel.name === "welcome-start-here"
  );
  const languageGuideChannel = guild.channels.cache.find(
    (channel) => channel.parentId === onboardingCategory.id && channel.name === "language-guide"
  );
  const navigationChannel = guild.channels.cache.find(
    (channel) => channel.parentId === onboardingCategory.id && channel.name === "navigation"
  );
  const youtuberInfoChannel = guild.channels.cache.find(
    (channel) => channel.parentId === media.id && channel.name === "youtuber-info"
  );
  const youtuberApplyChannel = guild.channels.cache.find(
    (channel) => channel.parentId === media.id && channel.name === "apply-for-youtuber"
  );
  const leaderInfoChannel = guild.channels.cache.find(
    (channel) => channel.parentId === applications.id && channel.name === "region-leader-info"
  );
  const leaderApplyChannel = guild.channels.cache.find(
    (channel) => channel.parentId === applications.id && channel.name === "apply-for-region-leader"
  );
  const commandsChannel = guild.channels.cache.find(
    (channel) => channel.parentId === botCategory.id && channel.name === "bot-commands"
  );

  if (welcomeChannel) {
    await postWelcomeMessages(welcomeChannel);
  }

  if (rulesChannel) {
    await postRulesMessages(rulesChannel);
  }

  if (languageGuideChannel) {
    await postLanguageGuideMessages(languageGuideChannel);
  }

  if (navigationChannel) {
    await postNavigationMessages(navigationChannel);
  }

  if (rolesChannel) {
    await postRoleSelectionMessages(rolesChannel);
  }

  if (youtuberInfoChannel) {
    await postYouTuberInfoMessages(youtuberInfoChannel);
  }

  if (youtuberApplyChannel) {
    await postYouTuberApplyMessages(youtuberApplyChannel);
  }

  if (leaderInfoChannel) {
    await postRegionLeaderInfoMessages(leaderInfoChannel);
  }

  if (leaderApplyChannel) {
    await postRegionLeaderApplyMessages(leaderApplyChannel);
  }

  if (commandsChannel) {
    await postBotCommandsMessages(commandsChannel);
  }

  return {
    fixedRoleCount: fixedRoles.length,
    countryRoleCount: countryRoleMap.size,
    skillRoleCount: skillRoleMap.size,
    publicCategoryCount: publicCategories.length + 2,
    countryCategoryCount: countries.length
  };
}

function buildAuditSummary(guild) {
  const categoryCount = guild.channels.cache.filter(
    (channel) => channel.type === ChannelType.GuildCategory
  ).size;
  const textCount = guild.channels.cache.filter(
    (channel) => channel.type === ChannelType.GuildText
  ).size;
  const voiceCount = guild.channels.cache.filter(
    (channel) => channel.type === ChannelType.GuildVoice
  ).size;

  const countryRolesFound = countries
    .map((country) => `${country.emoji} ${country.name}`)
    .filter((name) => guild.roles.cache.some((role) => role.name === name));

  const skillRolesFound = skillRoles
    .map((skill) => `${skill.emoji} ${skill.name}`)
    .filter((name) => guild.roles.cache.some((role) => role.name === name));

  return new EmbedBuilder()
    .setTitle("Server Audit")
    .setColor(0x0984e3)
    .addFields(
      {
        name: "Counts",
        value: [
          `Roles: ${guild.roles.cache.size}`,
          `Categories: ${categoryCount}`,
          `Text Channels: ${textCount}`,
          `Voice Channels: ${voiceCount}`
        ].join("\n")
      },
      {
        name: "Country Roles Found",
        value: countryRolesFound.length ? countryRolesFound.join(", ") : "No country roles found yet."
      },
      {
        name: "Skill Roles Found",
        value: skillRolesFound.length ? skillRolesFound.join(", ") : "No skill roles found yet."
      }
    )
    .setFooter({
      text: "Community mode still needs to be enabled manually in Discord server settings."
    });
}

async function postPanels(channel) {
  const payloads = [
    {
      embeds: [createOverviewEmbed()]
    },
    {
      embeds: [createRulesEmbed(), createChannelGuideEmbed()]
    },
    {
      embeds: [createLanguageGuideEmbed()]
    },
    {
      content: "Choose your country role. You can keep only one country role at a time.",
      components: [new ActionRowBuilder().addComponents(createCountryMenu())]
    }
  ];

  for (const group of chunk(skillRoles, 8)) {
    const menu = new StringSelectMenuBuilder()
      .setCustomId(`select-skills:${group.map((item) => item.key).join(",")}`)
      .setPlaceholder("Choose your creative roles")
      .setMinValues(1)
      .setMaxValues(group.length)
      .addOptions(
        group.map((role) => ({
          label: role.name,
          description: role.description,
          value: `skill:${role.key}`,
          emoji: role.emoji
        }))
      );

    payloads.push({
      content: "Choose the roles that match what you create.",
      components: [new ActionRowBuilder().addComponents(menu)]
    });
  }

  payloads.push({
    content: "Utility actions",
    components: [createUtilityButtons()]
  });

  for (const localizedEmbed of createLocalizedEmbeds()) {
    payloads.push({
      embeds: [localizedEmbed]
    });
  }

  await syncManagedMessages(channel, `generic:${channel.id}`, payloads);
}

async function postWelcomeMessages(channel) {
  await syncManagedMessages(channel, "onboarding:welcome", [
    { embeds: [createOverviewEmbed(), createChannelGuideEmbed()] }
  ]);
}

async function postRulesMessages(channel) {
  const payloads = [{ embeds: [createRulesEmbed()] }];

  for (const localizedEmbed of createLocalizedEmbeds()) {
    payloads.push({ embeds: [localizedEmbed] });
  }

  await syncManagedMessages(channel, "onboarding:rules", payloads);
}

async function postLanguageGuideMessages(channel) {
  await syncManagedMessages(channel, "onboarding:language-guide", [
    { embeds: [createLanguageGuideEmbed()] }
  ]);
}

async function postNavigationMessages(channel) {
  await syncManagedMessages(channel, "onboarding:navigation", [
    { embeds: [createNavigationEmbed(), createChannelGuideEmbed()] }
  ]);
}

async function postRoleSelectionMessages(channel) {
  const payloads = [
    {
      embeds: [createVerificationEmbed()],
      components: [createVerificationButtons()]
    },
    {
      content: "Choose your country role after verification. You can keep only one country role at a time.",
      components: [new ActionRowBuilder().addComponents(createCountryMenu())]
    }
  ];

  for (const group of chunk(skillRoles, 8)) {
    const menu = new StringSelectMenuBuilder()
      .setCustomId(`select-skills:${group.map((item) => item.key).join(",")}`)
      .setPlaceholder("Choose all creative roles that match you")
      .setMinValues(1)
      .setMaxValues(group.length)
      .addOptions(
        group.map((role) => ({
          label: role.name,
          description: role.description,
          value: `skill:${role.key}`,
          emoji: role.emoji
        }))
      );

    payloads.push({
      content: "You can select multiple professions: builder, animator, scripter, modeler, UI, VFX, sound, web, and more.",
      components: [new ActionRowBuilder().addComponents(menu)]
    });
  }

  payloads.push({
    content: "Utility actions",
    components: [createUtilityButtons()]
  });

  await syncManagedMessages(channel, "onboarding:roles", payloads);
}

async function postYouTuberInfoMessages(channel) {
  await syncManagedMessages(channel, "media:youtuber-info", [
    { embeds: [createYouTuberInfoEmbed()] }
  ]);
}

async function postYouTuberApplyMessages(channel) {
  await syncManagedMessages(channel, "media:youtuber-apply", [
    {
      content:
        "Apply here for the YouTuber role. Post your channel link, your audience language, your country, and one recent Roblox-related upload."
    }
  ]);
}

async function postRegionLeaderInfoMessages(channel) {
  await syncManagedMessages(channel, "leadership:info", [
    { embeds: [createRegionLeaderInfoEmbed()] }
  ]);
}

async function postRegionLeaderApplyMessages(channel) {
  await syncManagedMessages(channel, "leadership:apply", [
    {
      content:
        "Apply here to become a region leader. Tell us your country, timezone, language, moderation experience, and how you will keep your local hub active."
    }
  ]);
}

async function postBotCommandsMessages(channel) {
  await syncManagedMessages(channel, "bot:commands", [
    { embeds: [createCommandsEmbed()] }
  ]);
}

async function sendLevelCard(channel, member, xp, levelUp = false) {
  if (!channel) {
    return;
  }

  const avatarUrl = member.displayAvatarURL({ extension: "png", size: 256 });
  const cardBuffer = renderRankCard({
    username: member.displayName,
    avatarUrl,
    xp
  });

  const progress = getLevelFromXp(xp);
  const rankTier = getRankTier(progress.level);
  const attachment = new AttachmentBuilder(cardBuffer, { name: `rank-${member.id}.png` });

  await channel.send({
    content: levelUp
      ? `${member} reached level ${progress.level} and unlocked the rank **${rankTier.name}**.`
      : `${member} current progress: level ${progress.level}, ${xp} XP total.`,
    files: [attachment]
  }).catch(() => null);
}

async function awardXp(member, xpAmount, reason) {
  if (!member || member.user.bot) {
    return;
  }

  const before = getMemberRecord(member.guild.id, member.id).record;
  const beforeLevel = getLevelFromXp(before.xp).level;

  const updatedRecord = updateMemberRecord(member.guild.id, member.id, (record) => {
    record.xp += xpAmount;
    if (reason === "message") {
      record.messages += 1;
      record.lastMessageAt = Date.now();
    }
    if (reason === "voice") {
      record.voiceMinutes += 1;
    }
  });

  const afterLevel = getLevelFromXp(updatedRecord.xp).level;
  if (afterLevel > beforeLevel) {
    const { levelFeedChannel } = await getBotChannels(member.guild);
    await sendLevelCard(levelFeedChannel, member, updatedRecord.xp, true);
  }
}

async function updateCountryRole(member, guild, selectedCountryKey) {
  const verifiedRoleName = fixedRoles.find((item) => item.key === "verified").name;
  const verifiedRole = guild.roles.cache.find((role) => role.name === verifiedRoleName);

  if (!verifiedRole || !member.roles.cache.has(verifiedRole.id)) {
    return { ok: false, reason: "verify-first" };
  }

  const countryDefinitions = countries.map((country) => ({
    key: country.key,
    role: guild.roles.cache.find((role) => role.name === `${country.emoji} ${country.name}`)
  }));

  for (const definition of countryDefinitions) {
    if (definition.role && member.roles.cache.has(definition.role.id)) {
      await member.roles.remove(definition.role);
    }
  }

  const selected = countryDefinitions.find((country) => country.key === selectedCountryKey);
  if (selected && selected.role) {
    await member.roles.add(selected.role);
    return { ok: true, roleName: selected.role.name };
  }

  return { ok: false, reason: "missing-role" };
}

async function updateSkillRoles(member, guild, selectedValues) {
  const selectedKeys = new Set(selectedValues.map((value) => value.replace("skill:", "")));
  const skillEntries = skillRoles
    .map((skill) => ({
      key: skill.key,
      role: guild.roles.cache.find((role) => role.name === `${skill.emoji} ${skill.name}`)
    }))
    .filter((entry) => entry.role);

  for (const entry of skillEntries) {
    if (selectedKeys.has(entry.key)) {
      if (!member.roles.cache.has(entry.role.id)) {
        await member.roles.add(entry.role);
      }
    } else if (member.roles.cache.has(entry.role.id)) {
      await member.roles.remove(entry.role);
    }
  }

  await member.fetch(true);

  return skillEntries
    .filter((entry) => member.roles.cache.has(entry.role.id))
    .map((entry) => entry.role.name);
}

client.once("clientReady", async () => {
  try {
    const updated = await registerCommands();
    console.log(`${client.user.tag} is online`);
    if (updated) {
      console.log("Slash commands updated.");
    }

    setInterval(async () => {
      for (const [key, joinedAt] of activeVoiceMembers.entries()) {
        const [guildId, userId] = key.split(":");
        const guild = client.guilds.cache.get(guildId);
        if (!guild) {
          continue;
        }

        const member = await guild.members.fetch(userId).catch(() => null);
        if (!member || !member.voice.channelId) {
          activeVoiceMembers.delete(key);
          continue;
        }

        if (Date.now() - joinedAt >= levelingConfig.voiceTickMs) {
          activeVoiceMembers.set(key, Date.now());
          await awardXp(member, levelingConfig.voiceXpPerMinute, "voice");
        }
      }
    }, levelingConfig.voiceTickMs);
  } catch (error) {
    console.error("Failed to register commands:", error);
  }
});

client.on("interactionCreate", async (interaction) => {
  try {
    if (interaction.isChatInputCommand()) {
      if (!interaction.inCachedGuild()) {
        await interaction.reply({ content: "This command can only be used in a server.", ephemeral: true });
        return;
      }

      if (interaction.commandName === "setup") {
        await interaction.deferReply({ ephemeral: true });
        const mode = interaction.options.getString("mode", true);
        const result = await syncServer(interaction.guild, mode);
        await interaction.editReply(
          `Setup finished. Fixed roles: ${result.fixedRoleCount}, country roles: ${result.countryRoleCount}, skill roles: ${result.skillRoleCount}, public categories: ${result.publicCategoryCount}, country categories: ${result.countryCategoryCount}.`
        );
        return;
      }

      if (interaction.commandName === "post-panels") {
        await interaction.deferReply({ ephemeral: true });
        await postPanels(interaction.channel);
        await interaction.editReply("Panels were rebuilt in this channel.");
        return;
      }

      if (interaction.commandName === "audit") {
        await interaction.reply({
          embeds: [buildAuditSummary(interaction.guild)],
          ephemeral: true
        });
        return;
      }

      if (interaction.commandName === "refresh-commands") {
        await interaction.deferReply({ ephemeral: true });
        setGuildMetaValue(guildId, "commandsSignature", null);
        await registerCommands();
        await interaction.editReply("Slash commands refreshed for this guild.");
        return;
      }

      if (interaction.commandName === "rank") {
        await interaction.deferReply({ ephemeral: true });
        const targetUser = interaction.options.getUser("member") ?? interaction.user;
        const member = await interaction.guild.members.fetch(targetUser.id);
        const { record } = getMemberRecord(interaction.guild.id, targetUser.id);
        const { commandsChannel } = await getBotChannels(interaction.guild);

        if (commandsChannel && interaction.channelId !== commandsChannel.id) {
          await interaction.editReply(`Use </rank:${interaction.commandId}> in #${commandsChannel.name} for the cleanest bot flow.`);
        } else {
          await interaction.editReply(`Generating rank card for ${member.displayName}...`);
        }

        await sendLevelCard(interaction.channel, member, record.xp, false);
        return;
      }

      if (interaction.commandName === "leaderboard") {
        const leaderboard = getGuildLeaderboard(interaction.guild.id).slice(0, 10);
        await interaction.reply({
          embeds: [createLeaderboardEmbed(leaderboard, interaction.guild)],
          ephemeral: true
        });
      }
    }

    if (interaction.isStringSelectMenu()) {
      if (!interaction.inCachedGuild()) {
        await interaction.reply({ content: "This menu works only inside a server.", ephemeral: true });
        return;
      }

      await interaction.guild.roles.fetch();
      const member = await interaction.guild.members.fetch(interaction.user.id);

      if (interaction.customId === "select-country") {
        const selectedCountry = interaction.values[0].replace("country:", "");
        const result = await updateCountryRole(member, interaction.guild, selectedCountry);
        await interaction.reply({
          content:
            result.ok && result.roleName
              ? `Your country role is now ${result.roleName}.`
              : result.reason === "verify-first"
                ? "Verify first, then choose your country role."
                : "Country role was not found.",
          ephemeral: true
        });
        return;
      }

      if (interaction.customId.startsWith("select-skills")) {
        const roles = await updateSkillRoles(member, interaction.guild, interaction.values);
        await interaction.reply({
          content: roles.length ? `Your creative roles were updated: ${roles.join(", ")}` : "No skill roles selected.",
          ephemeral: true
        });
      }
    }

    if (interaction.isButton()) {
      if (!interaction.inCachedGuild()) {
        await interaction.reply({ content: "This button works only inside a server.", ephemeral: true });
        return;
      }

      if (interaction.customId === "show-server-info") {
        await interaction.reply({
          embeds: [buildAuditSummary(interaction.guild)],
          ephemeral: true
        });
        return;
      }

      if (interaction.customId === "verify-member") {
        const member = await interaction.guild.members.fetch(interaction.user.id);
        const verifiedRole = interaction.guild.roles.cache.find(
          (guildRole) => guildRole.name === fixedRoles.find((role) => role.key === "verified").name
        );

        if (!verifiedRole) {
          await interaction.reply({
            content: "Verified role was not found yet. Ask staff to run /setup again.",
            ephemeral: true
          });
          return;
        }

        if (!member.roles.cache.has(verifiedRole.id)) {
          await member.roles.add(verifiedRole);
        }

        await interaction.reply({
          content: "Verification complete. The server is now unlocked for you.",
          ephemeral: true
        });
        return;
      }

      if (interaction.customId === "clear-country") {
        const member = await interaction.guild.members.fetch(interaction.user.id);
        for (const country of countries) {
          const role = interaction.guild.roles.cache.find(
            (guildRole) => guildRole.name === `${country.emoji} ${country.name}`
          );
          if (role && member.roles.cache.has(role.id)) {
            await member.roles.remove(role);
          }
        }

        await interaction.reply({
          content: "Your country role was cleared.",
          ephemeral: true
        });
      }
    }
  } catch (error) {
    console.error("Interaction failed:", error);

    const payload = {
      content: "The bot hit an error while handling that action. Check the console log.",
      ephemeral: true
    };

    if (interaction.isRepliable()) {
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply(payload).catch(() => null);
      } else {
        await interaction.reply(payload).catch(() => null);
      }
    }
  }
});

client.on("messageCreate", async (message) => {
  try {
    if (!message.inGuild() || message.author.bot) {
      return;
    }

    const { commandsChannel } = await getBotChannels(message.guild);
    const { record } = getMemberRecord(message.guild.id, message.author.id);
    const now = Date.now();

    if (commandsChannel && message.channelId === commandsChannel.id && !message.content.startsWith("/")) {
      return;
    }

    if (now - record.lastMessageAt < levelingConfig.messageCooldownMs) {
      return;
    }

    const randomXp =
      levelingConfig.messageXpMin +
      Math.floor(Math.random() * (levelingConfig.messageXpMax - levelingConfig.messageXpMin + 1));

    const member = await message.guild.members.fetch(message.author.id);
    await awardXp(member, randomXp, "message");
  } catch (error) {
    console.error("Message XP failed:", error);
  }
});

client.on("voiceStateUpdate", async (oldState, newState) => {
  try {
    const member = newState.member ?? oldState.member;
    if (!member || member.user.bot) {
      return;
    }

    const key = `${member.guild.id}:${member.id}`;

    if (!oldState.channelId && newState.channelId) {
      activeVoiceMembers.set(key, Date.now());
      return;
    }

    if (oldState.channelId && !newState.channelId) {
      activeVoiceMembers.delete(key);
      return;
    }

    if (oldState.channelId !== newState.channelId) {
      activeVoiceMembers.set(key, Date.now());
    }
  } catch (error) {
    console.error("Voice XP failed:", error);
  }
});

process.on("unhandledRejection", (error) => {
  console.error("Unhandled rejection:", error);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught exception:", error);
});

client.login(token);
