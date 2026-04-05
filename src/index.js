require("dotenv").config();

const {
  ActionRowBuilder,
  ApplicationCommandType,
  ButtonBuilder,
  ButtonStyle,
  AttachmentBuilder,
  ChannelType,
  Client,
  ContextMenuCommandBuilder,
  EmbedBuilder,
  GatewayIntentBits,
  ModalBuilder,
  PermissionFlagsBits,
  REST,
  Routes,
  SlashCommandBuilder,
  StringSelectMenuBuilder,
  TextInputBuilder,
  TextInputStyle
} = require("discord.js");

const {
  applicationCategory,
  announcementChannels,
  countries,
  fixedRoles,
  mediaCategory,
  publicCategories,
  reviewCategory,
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
  setGuildMetaValue,
  setApplicationPanel,
  getApplicationPanel
} = require("./services/serverStateStore");
const { renderRankCard } = require("./utils/rankCard");
const { renderWelcomeCard } = require("./utils/welcomeCard");

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
const countryLanguageMap = {
  ru: "ru",
  ua: "uk",
  us: "en",
  tr: "tr",
  br: "pt",
  es: "es",
  fr: "fr",
  de: "de",
  pl: "pl",
  kz: "kk"
};

const translationChoices = [
  { name: "Auto by your country role", value: "auto" },
  { name: "English", value: "en" },
  { name: "Russian", value: "ru" },
  { name: "Ukrainian", value: "uk" },
  { name: "Turkish", value: "tr" },
  { name: "Portuguese", value: "pt" },
  { name: "Spanish", value: "es" },
  { name: "French", value: "fr" },
  { name: "German", value: "de" },
  { name: "Polish", value: "pl" },
  { name: "Kazakh", value: "kk" }
];

const eightBallAnswers = [
  "Yes, ship it.",
  "Looks promising.",
  "Give it one more polish pass.",
  "Not today.",
  "Ask again after coffee.",
  "High chance of success.",
  "The bugs say no.",
  "Builder approved.",
  "Scripter approved.",
  "It needs more VFX."
];

const studioIdeaSeeds = {
  genres: ["obby", "simulator", "tycoon", "story game", "arena battler", "horror co-op"],
  twists: ["with regional events", "where the UI is diegetic", "built around weather", "with community-made challenges", "with speedrun tech", "with hidden lore"],
  hooks: ["for small teams", "for solo devs", "for YouTube moments", "for social clips", "for long-term progression", "for daily co-op sessions"]
};

const commands = [
  new SlashCommandBuilder()
    .setName("setup")
    .setDescription("Create and configure the Roblox Studio Global server structure.")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption((option) =>
      option
        .setName("mode")
        .setDescription("How aggressively the bot should create missing items.")
        .setRequired(true)
        .addChoices(
          { name: "safe", value: "safe" },
          { name: "full", value: "full" }
        )
    )
    .addStringOption((option) =>
      option
        .setName("scope")
        .setDescription("Limit setup to a specific area")
        .setRequired(false)
        .addChoices(
          { name: "all", value: "all" },
          { name: "media", value: "media" }
        )
    ),
  new SlashCommandBuilder()
    .setName("post-panels")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setDescription("Post the onboarding, rules, and role selection panels in the current channel."),
  new SlashCommandBuilder()
    .setName("audit")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setDescription("Inspect the current server and summarize roles, categories, and channels."),
  new SlashCommandBuilder()
    .setName("refresh-commands")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
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
    .setDescription("Show the server XP leaderboard."),
  new SlashCommandBuilder()
    .setName("tr")
    .setDescription("Translate text or a Discord message link into your server language.")
    .addStringOption((option) =>
      option
        .setName("text")
        .setDescription("Text to translate")
        .setRequired(false)
    )
    .addStringOption((option) =>
      option
        .setName("message_link")
        .setDescription("Link to a Discord message to translate")
        .setRequired(false)
    )
    .addStringOption((option) =>
      option
        .setName("language")
        .setDescription("Target language")
        .setRequired(false)
        .addChoices(...translationChoices)
    ),
  new SlashCommandBuilder()
    .setName("8ball")
    .setDescription("Ask the bot for a chaotic studio answer.")
    .addStringOption((option) =>
      option
        .setName("question")
        .setDescription("Your question")
        .setRequired(true)
    ),
  new SlashCommandBuilder()
    .setName("roll")
    .setDescription("Roll a number.")
    .addIntegerOption((option) =>
      option
        .setName("sides")
        .setDescription("How many sides the dice should have")
        .setRequired(false)
        .setMinValue(2)
        .setMaxValue(1000)
    ),
  new SlashCommandBuilder()
    .setName("studio-idea")
    .setDescription("Get a quick Roblox game idea for fun."),
  new SlashCommandBuilder()
    .setName("team-ad")
    .setDescription("Publish a formatted recruitment ad with optional uploaded images.")
    .addStringOption((option) =>
      option
        .setName("title")
        .setDescription("Project or ad title")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("description")
        .setDescription("Describe the project and opening")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("reward")
        .setDescription("Reward, payment, or deal")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("looking_for")
        .setDescription("Who you are looking for")
        .setRequired(true)
    )
    .addAttachmentOption((option) =>
      option
        .setName("image_one")
        .setDescription("First image")
        .setRequired(false)
    )
    .addAttachmentOption((option) =>
      option
        .setName("image_two")
        .setDescription("Second image")
        .setRequired(false)
    ),
  new SlashCommandBuilder()
    .setName("create-application-panel")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setDescription("Founder-only: create a two-field application panel in any channel.")
    .addChannelOption((option) =>
      option
        .setName("channel")
        .setDescription("Channel where the panel should be posted")
        .setRequired(true)
    )
    .addChannelOption((option) =>
      option
        .setName("review_channel")
        .setDescription("Private channel where submissions should go")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("title")
        .setDescription("Panel title")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("description")
        .setDescription("Panel description")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("button_label")
        .setDescription("Button text")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("modal_title")
        .setDescription("Modal window title")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("field_one_label")
        .setDescription("First field label")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("field_two_label")
        .setDescription("Second field label")
        .setRequired(true)
    ),
  new ContextMenuCommandBuilder()
    .setName("Translate Message")
    .setType(ApplicationCommandType.Message)
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

async function getOnboardingChannels(guild) {
  await guild.channels.fetch();

  return {
    welcomeStartChannel: guild.channels.cache.find((channel) => channel.name === "welcome-start-here"),
    welcomeFeedChannel: guild.channels.cache.find((channel) => channel.name === "welcome-feed"),
    memberTrackerChannel: guild.channels.cache.find((channel) => channel.name === "member-tracker")
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

function buildPublicReadOnlyOverwrites(guild, writerRoleIds) {
  const overwrites = [
    {
      id: guild.roles.everyone.id,
      allow: [PermissionFlagsBits.ViewChannel],
      deny: [PermissionFlagsBits.SendMessages]
    }
  ];

  for (const roleId of writerRoleIds) {
    overwrites.push({
      id: roleId,
      allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages]
    });
  }

  return overwrites;
}

function buildHiddenReadOnlyOverwrites(guild, visibleRoleIds, writerRoleIds) {
  const overwrites = [
    {
      id: guild.roles.everyone.id,
      deny: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages]
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
        value: "Use #apply-for-media to request the Media role. Approved creators post releases in #media-drops."
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
    .setDescription("Main user commands available in this server.")
    .addFields(
      { name: "/rank", value: "Generate a rank card image for yourself or another member." },
      { name: "/leaderboard", value: "Show the top XP users." },
      { name: "/tr", value: "Translate text or a message link into your country language." },
      { name: "/team-ad", value: "Publish a team ad with uploaded images into #team-board." },
      { name: "/8ball, /roll, /studio-idea", value: "Small fun commands for the community." }
    );
}

function createYouTuberInfoEmbed() {
  return new EmbedBuilder()
    .setTitle("Media Program")
    .setColor(0xff4757)
    .setDescription("Creators can apply for the Media role and then publish fresh videos in the creator channel.")
    .addFields(
      {
        name: "How to apply",
        value: "Post your YouTube or creator link, your niche, your language, and one recent Roblox-related video."
      },
      {
        name: "What approved Media creators can do",
        value: "Post new uploads in #media-drops and help grow the international community."
      }
    );
}

function createMediaApplyEmbed() {
  return new EmbedBuilder()
    .setTitle("Apply For The Media Role")
    .setColor(0xff4757)
    .setDescription(
      "Press the button below to open the application form. Fill in your social link and tell us who you are and why you want the Media role."
    )
    .addFields(
      {
        name: "What to prepare",
        value: "Your creator link, your content language, and a short introduction about yourself."
      },
      {
        name: "What happens next",
        value: "Your application goes to a private review channel that only Media reviewers and staff can see."
      },
      {
        name: "Review result",
        value: "If approved, you get the Media role and can post in #media-drops. If declined, the bot will DM you with the result."
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

function createRegionLeaderApplyEmbed() {
  return new EmbedBuilder()
    .setTitle("Apply For Region Leader")
    .setColor(0xfdcb6e)
    .setDescription(
      "Press the button below to apply. Your application goes to a private review channel, and if approved you will receive the leader role for your chosen region."
    )
    .addFields(
      {
        name: "What to include",
        value: "Your region or country, your timezone, your main language, and why you want to lead that community."
      },
      {
        name: "If approved",
        value: "You will receive the specific regional leader role and gain access to post regional news in that region."
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

function createMediaApplyButton() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("open-media-application")
      .setLabel("Apply For Media")
      .setStyle(ButtonStyle.Danger)
  );
}

function createRegionLeaderApplyButton() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("open-region-leader-application")
      .setLabel("Apply For Region Leader")
      .setStyle(ButtonStyle.Primary)
  );
}

function createFindTeamButton() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("open-find-team-post")
      .setLabel("Quick Text Ad")
      .setStyle(ButtonStyle.Success)
  );
}

function createApplicationPanelEmbed(title, description) {
  return new EmbedBuilder()
    .setTitle(title)
    .setDescription(description)
    .setColor(0xff4757);
}

function createApplicationPanelButton(customId, label) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(customId)
      .setLabel(label)
      .setStyle(ButtonStyle.Primary)
  );
}

function createMediaReviewButtons(applicantId) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`media-approve:${applicantId}`)
      .setLabel("Approve")
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`media-decline:${applicantId}`)
      .setLabel("Decline")
      .setStyle(ButtonStyle.Danger)
  );
}

function createRegionLeaderReviewButtons(applicantId) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`region-leader-approve:${applicantId}`)
      .setLabel("Approve")
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`region-leader-decline:${applicantId}`)
      .setLabel("Decline")
      .setStyle(ButtonStyle.Danger)
  );
}

function createFindTeamPanelEmbed() {
  return new EmbedBuilder()
    .setTitle("Find Team Board")
    .setColor(0x00b894)
    .setDescription(
      "Use the button below for a quick text-only team post. If you want real uploaded images, use `/team-ad` in any channel."
    )
    .addFields(
      {
        name: "What you can post",
        value: "Team recruitment, paid contracts, collaboration requests, and project openings."
      },
      {
        name: "Cooldown",
        value: "You can publish one new team ad every 4 hours."
      },
      {
        name: "Images",
        value: "Discord modals cannot upload files. For real uploaded images, use `/team-ad`."
      }
    );
}

function clampDiscordText(value, maxLength) {
  if (!value) {
    return "";
  }

  return value.length <= maxLength ? value : `${value.slice(0, maxLength - 1).trimEnd()}…`;
}

function createApplicationModal(modalId, title, fieldOneLabel, fieldTwoLabel, fieldOnePlaceholder, fieldTwoPlaceholder) {
  const socialInput = new TextInputBuilder()
    .setCustomId("field_one")
    .setLabel(clampDiscordText(fieldOneLabel, 45))
    .setStyle(TextInputStyle.Short)
    .setPlaceholder(clampDiscordText(fieldOnePlaceholder, 100))
    .setRequired(true)
    .setMaxLength(200);

  const aboutInput = new TextInputBuilder()
    .setCustomId("field_two")
    .setLabel(clampDiscordText(fieldTwoLabel, 45))
    .setStyle(TextInputStyle.Paragraph)
    .setPlaceholder(clampDiscordText(fieldTwoPlaceholder, 100))
    .setRequired(true)
    .setMaxLength(1000);

  return new ModalBuilder()
    .setCustomId(modalId)
    .setTitle(clampDiscordText(title, 45))
    .addComponents(
      new ActionRowBuilder().addComponents(socialInput),
      new ActionRowBuilder().addComponents(aboutInput)
    );
}

function createMediaApplicationModal() {
  return createApplicationModal(
    "submit-media-application",
    "Media Role Application",
    "Your social or YouTube link",
    "Tell us about yourself",
    "https://youtube.com/@yourchannel",
    "Who are you, what do you create, and why do you want the Media role?"
  );
}

function createRegionLeaderApplicationModal() {
  return createApplicationModal(
    "submit-region-leader-application",
    "Region Leader Application",
    "Region or country you want to lead",
    "Timezone, language, and why you",
    "Ukraine / USA / Kazakhstan / Russia",
    "Tell us about yourself, your timezone, your language, and why you want to lead this region."
  );
}

function createFindTeamModal() {
  return new ModalBuilder()
    .setCustomId("submit-find-team-post")
    .setTitle("Publish Team Ad")
    .addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("ad_title")
          .setLabel("Project or ad title")
          .setStyle(TextInputStyle.Short)
          .setPlaceholder("Need a Builder for a sci-fi lobby")
          .setRequired(true)
          .setMaxLength(80)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("ad_description")
          .setLabel("Description")
          .setStyle(TextInputStyle.Paragraph)
          .setPlaceholder("Explain the project, style, scope, and what stage it is in.")
          .setRequired(true)
          .setMaxLength(1000)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("ad_reward")
          .setLabel("Reward or payment")
          .setStyle(TextInputStyle.Short)
          .setPlaceholder("Revenue share / Paid / Negotiable")
          .setRequired(true)
          .setMaxLength(100)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("ad_roles")
          .setLabel("Who are you looking for")
          .setStyle(TextInputStyle.Short)
          .setPlaceholder("Builder, UI designer, Animator")
          .setRequired(true)
          .setMaxLength(140)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("ad_notes")
          .setLabel("Extra notes (optional)")
          .setStyle(TextInputStyle.Short)
          .setPlaceholder("Timezone, experience, or short extra note")
          .setRequired(false)
          .setMaxLength(140)
      )
    );
}

function isFounder(member) {
  const founderRoleName = fixedRoles.find((role) => role.key === "founder")?.name;
  return Boolean(founderRoleName && member.roles.cache.some((role) => role.name === founderRoleName));
}

function canReviewMedia(member) {
  const allowedRoleNames = [
    fixedRoles.find((role) => role.key === "founder")?.name,
    fixedRoles.find((role) => role.key === "admin")?.name,
    fixedRoles.find((role) => role.key === "community")?.name,
    fixedRoles.find((role) => role.key === "media_reviewer")?.name
  ].filter(Boolean);

  return member.roles.cache.some((role) => allowedRoleNames.includes(role.name));
}

function canReviewRegionLeader(member) {
  const allowedRoleNames = [
    fixedRoles.find((role) => role.key === "founder")?.name,
    fixedRoles.find((role) => role.key === "admin")?.name,
    fixedRoles.find((role) => role.key === "moderator")?.name,
    fixedRoles.find((role) => role.key === "community")?.name,
    fixedRoles.find((role) => role.key === "country_lead")?.name
  ].filter(Boolean);

  return member.roles.cache.some((role) => allowedRoleNames.includes(role.name));
}

function getVerifiedRole(guild) {
  const verifiedRoleName = fixedRoles.find((role) => role.key === "verified")?.name;
  return verifiedRoleName
    ? guild.roles.cache.find((role) => role.name === verifiedRoleName) ?? null
    : null;
}

function isVerifiedMember(member) {
  const verifiedRole = getVerifiedRole(member.guild);
  return Boolean(verifiedRole && member.roles.cache.has(verifiedRole.id));
}

function normalizeCountryInput(value) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

function resolveCountryFromInput(input) {
  const normalized = normalizeCountryInput(input);
  if (!normalized) {
    return null;
  }

  return countries.find((country) => {
    const variants = [
      country.key,
      country.name,
      country.label,
      `${country.name} leader`,
      `${country.label} leader`,
      country.emoji
    ]
      .filter(Boolean)
      .map((value) => normalizeCountryInput(value));

    return variants.includes(normalized);
  }) ?? null;
}

function detectPreferredLanguage(member) {
  for (const country of countries) {
    const expectedRoleName = `${country.emoji} ${country.name}`;
    if (member.roles.cache.some((role) => role.name === expectedRoleName)) {
      return countryLanguageMap[country.key] ?? "en";
    }
  }

  return "en";
}

function languageLabel(code) {
  return translationChoices.find((choice) => choice.value === code)?.name ?? code.toUpperCase();
}

function parseDiscordMessageLink(link) {
  const match = link.match(/channels\/(\d+)\/(\d+)\/(\d+)/);
  if (!match) {
    return null;
  }

  return {
    guildId: match[1],
    channelId: match[2],
    messageId: match[3]
  };
}

async function resolveTranslationSource(interaction, textInput, messageLink) {
  if (textInput) {
    return {
      text: textInput,
      sourceLabel: "Manual text"
    };
  }

  if (!messageLink) {
    return null;
  }

  const parsed = parseDiscordMessageLink(messageLink);
  if (!parsed || parsed.guildId !== interaction.guild.id) {
    throw new Error("invalid-message-link");
  }

  const channel = await interaction.guild.channels.fetch(parsed.channelId).catch(() => null);
  if (!channel || channel.type !== ChannelType.GuildText) {
    throw new Error("message-channel-missing");
  }

  const message = await channel.messages.fetch(parsed.messageId).catch(() => null);
  if (!message) {
    throw new Error("message-missing");
  }

  const sourceText = message.content || message.embeds[0]?.description || message.embeds[0]?.title || null;
  if (!sourceText) {
    throw new Error("message-empty");
  }

  return {
    text: sourceText,
    sourceLabel: `Message by ${message.author.username}`,
    sourceUrl: message.url
  };
}

async function translateText(text, targetLanguage) {
  const url =
    `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLanguage}&dt=t&q=${encodeURIComponent(text)}`;
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0"
    }
  });

  if (!response.ok) {
    throw new Error(`translate-failed:${response.status}`);
  }

  const data = await response.json();
  const translated = Array.isArray(data?.[0])
    ? data[0].map((chunk) => chunk?.[0] ?? "").join("").trim()
    : "";

  if (!translated) {
    throw new Error("translate-empty");
  }

  return {
    translated,
    detectedLanguage: data?.[2] ?? "auto"
  };
}

function buildTranslationEmbed(source, translation, targetLanguage) {
  const embed = new EmbedBuilder()
    .setTitle("Translation")
    .setColor(0x74b9ff)
    .addFields(
      {
        name: "From",
        value: source.text.slice(0, 1024)
      },
      {
        name: `To ${languageLabel(targetLanguage)}`,
        value: translation.translated.slice(0, 1024)
      }
    )
    .setFooter({
      text: `Detected source language: ${translation.detectedLanguage}`
    });

  if (source.sourceLabel) {
    embed.setDescription(source.sourceLabel);
  }

  if (source.sourceUrl) {
    embed.addFields({
      name: "Jump",
      value: source.sourceUrl
    });
  }

  return embed;
}

function createStudioIdea() {
  const genre = studioIdeaSeeds.genres[Math.floor(Math.random() * studioIdeaSeeds.genres.length)];
  const twist = studioIdeaSeeds.twists[Math.floor(Math.random() * studioIdeaSeeds.twists.length)];
  const hook = studioIdeaSeeds.hooks[Math.floor(Math.random() * studioIdeaSeeds.hooks.length)];
  return `Make a ${genre} ${twist} ${hook}.`;
}

function getFindTeamCooldown(meta, userId) {
  const cooldowns = meta.findTeamCooldowns ?? {};
  const cooldownMs = 4 * 60 * 60 * 1000;
  const lastPostedAt = cooldowns[userId] ?? 0;
  const now = Date.now();

  return {
    cooldowns,
    cooldownMs,
    now,
    remainingMs: lastPostedAt + cooldownMs - now
  };
}

function buildFindTeamImageEmbeds(imageUrls) {
  return imageUrls.slice(1, 2).map((url) =>
    new EmbedBuilder()
      .setTitle("Extra Project Image")
      .setColor(0x55efc4)
      .setImage(url)
  );
}

function parseImageUrls(input) {
  if (!input) {
    return [];
  }

  return input
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter((item) => /^https?:\/\//i.test(item))
    .slice(0, 2);
}

function buildFindTeamEmbed({ author, title, description, reward, rolesNeeded, contact, extraNotes, imageUrls }) {
  const embed = new EmbedBuilder()
    .setTitle(title)
    .setColor(0x00b894)
    .setDescription(description)
    .addFields(
      {
        name: "Looking For",
        value: rolesNeeded
      },
      {
        name: "Reward",
        value: reward
      },
      {
        name: "Contact",
        value: contact
      }
    )
    .setFooter({
      text: `Posted by ${author.tag}`
    })
    .setTimestamp();

  if (extraNotes) {
    embed.addFields({
      name: "Extra Notes",
      value: extraNotes
    });
  }

  if (imageUrls[0]) {
    embed.setImage(imageUrls[0]);
  }

  if (imageUrls[1]) {
    embed.addFields({
      name: "Extra Image",
      value: imageUrls[1]
    });
  }

  return embed;
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
  const recentMessages = await channel.messages.fetch({ limit: 100 }).catch(() => null);
  const botMessages = recentMessages
    ? [...recentMessages.values()].filter((message) => message.author.id === client.user.id)
    : [];
  const unusedMessages = new Map(botMessages.map((message) => [message.id, message]));
  const nextState = [];

  for (let index = 0; index < payloads.length; index += 1) {
    const payload = payloads[index];
    const signature = normalizePayload(payload);
    const stored = storedMessages[index];
    let message = null;

    if (stored?.messageId && unusedMessages.has(stored.messageId)) {
      message = unusedMessages.get(stored.messageId);
      unusedMessages.delete(stored.messageId);
    } else {
      const matched = botMessages.find(
        (candidate) =>
          unusedMessages.has(candidate.id) &&
          normalizePayload({
            content: candidate.content || null,
            embeds: candidate.embeds,
            components: candidate.components
          }) === signature
      );

      if (matched) {
        message = matched;
        unusedMessages.delete(matched.id);
      }
    }

    if (message) {
      if (normalizePayload({
        content: message.content || null,
        embeds: message.embeds,
        components: message.components
      }) !== signature) {
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

  for (const message of unusedMessages.values()) {
    await message.delete().catch(() => null);
  }

  setManagedMessages(channel.guild.id, scope, nextState);
  setGuildMetaValue(channel.guild.id, `cleanup:${scope}`, true);
}

async function syncServer(guild, mode, scope = "all") {
  await guild.roles.fetch();
  await guild.channels.fetch();

  const legacyMediaRole = guild.roles.cache.find((role) => role.name === "🎥 YouTuber");
  if (legacyMediaRole) {
    await legacyMediaRole.edit({ name: "🎥 Media" }).catch(() => null);
  }

  const legacyChannelRenames = [
    ["youtuber-info", "media-info"],
    ["apply-for-youtuber", "apply-for-media"],
    ["youtuber-drops", "media-drops"]
  ];

  for (const [oldName, newName] of legacyChannelRenames) {
    const oldChannel = guild.channels.cache.find((channel) => channel.name === oldName);
    const newChannel = guild.channels.cache.find((channel) => channel.name === newName);
    if (oldChannel && !newChannel) {
      await oldChannel.setName(newName).catch(() => null);
    }
  }

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
  const mediaRoleId = ensuredFixedRoles.media.id;
  const mediaReviewerRoleId = ensuredFixedRoles.media_reviewer.id;
  const onboardingWriters = [ensuredFixedRoles.founder.id, ensuredFixedRoles.community.id];
  const visibleVerifiedRoles = [verifiedRoleId, ...adminRoleIds];
  const founderAndCommunity = [ensuredFixedRoles.founder.id, ensuredFixedRoles.community.id];

  const orderedCategories = [];
  const baseOverwrites = buildBaseOverwrites(guild, adminRoleIds);
  const verifiedOverwrites = buildVerifiedOverwrites(guild, verifiedRoleId, adminRoleIds);
  const syncAll = scope === "all";
  const syncMediaOnly = scope === "media";

  let onboardingCategory = null;
  if (syncAll) {
    onboardingCategory = await ensureCategory(guild, "🚀 Start Here", baseOverwrites);
    orderedCategories.push(onboardingCategory);

    for (const channelDefinition of announcementChannels) {
      let overwrites = baseOverwrites;

      if (["welcome-start-here", "welcome-feed", "member-tracker", "rules", "language-guide", "navigation", "choose-your-roles"].includes(channelDefinition.name)) {
        overwrites = buildPublicReadOnlyOverwrites(guild, onboardingWriters);
      }

      if (["rules", "language-guide", "navigation", "choose-your-roles"].includes(channelDefinition.name)) {
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

        if (channelDefinition.name === "find-team") {
          overwrites = buildHiddenReadOnlyOverwrites(guild, visibleVerifiedRoles, founderAndCommunity);
        }

        if (channelDefinition.name === "team-board") {
          overwrites = buildHiddenReadOnlyOverwrites(guild, visibleVerifiedRoles, founderAndCommunity);
        }

        await ensureChildChannel(guild, category, channelDefinition, overwrites);
      }

      await positionChildren(guild, category, categoryDefinition.channels);
    }
  }

  const media = await ensureCategory(guild, mediaCategory.name, verifiedOverwrites);
  orderedCategories.push(media);
  for (const channelDefinition of mediaCategory.channels) {
    let overwrites = verifiedOverwrites;
    if (channelDefinition.name === "media-info") {
      overwrites = buildReadOnlyOverwrites(guild, visibleVerifiedRoles, founderAndCommunity);
    }
    if (channelDefinition.name === "apply-for-media") {
      overwrites = buildHiddenReadOnlyOverwrites(guild, [verifiedRoleId, ...adminRoleIds], founderAndCommunity);
    }
    if (channelDefinition.name === "media-drops") {
      overwrites = buildReadOnlyOverwrites(
        guild,
        [verifiedRoleId, ...adminRoleIds],
        [mediaRoleId, ...founderAndCommunity, ...adminRoleIds]
      );
    }
    await ensureChildChannel(guild, media, channelDefinition, overwrites);
  }
  await positionChildren(guild, media, mediaCategory.channels);

  const reviewOverwrites = [
    {
      id: guild.roles.everyone.id,
      deny: [PermissionFlagsBits.ViewChannel]
    },
    ...[
      ensuredFixedRoles.founder.id,
      ensuredFixedRoles.admin.id,
      ensuredFixedRoles.moderator.id,
      ensuredFixedRoles.community.id,
      ensuredFixedRoles.country_lead.id,
      mediaReviewerRoleId
    ]
      .filter(Boolean)
      .map((roleId) => ({
        id: roleId,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ManageMessages
        ]
      }))
  ];

  const reviewDesk = await ensureCategory(guild, reviewCategory.name, reviewOverwrites);
  orderedCategories.push(reviewDesk);
  for (const channelDefinition of reviewCategory.channels) {
    await ensureChildChannel(guild, reviewDesk, channelDefinition, reviewOverwrites);
  }
  await positionChildren(guild, reviewDesk, reviewCategory.channels);

  let applications = null;
  if (syncAll) {
    applications = await ensureCategory(guild, applicationCategory.name, verifiedOverwrites);
    orderedCategories.push(applications);
    for (const channelDefinition of applicationCategory.channels) {
      let overwrites = verifiedOverwrites;
      if (channelDefinition.name === "region-leader-info") {
        overwrites = buildReadOnlyOverwrites(guild, visibleVerifiedRoles, founderAndCommunity);
      }
        if (channelDefinition.name === "apply-for-region-leader") {
          overwrites = buildHiddenReadOnlyOverwrites(guild, [verifiedRoleId, ...adminRoleIds], founderAndCommunity);
        }
      await ensureChildChannel(guild, applications, channelDefinition, overwrites);
    }
    await positionChildren(guild, applications, applicationCategory.channels);
  }

  if (syncAll) {
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

  let staff = null;
  if (syncAll) {
    staff = await ensureCategory(guild, staffCategory.name, staffOverwrites);
    orderedCategories.push(staff);
    for (const channelDefinition of staffCategory.channels) {
      await ensureChildChannel(guild, staff, channelDefinition, staffOverwrites);
    }
    await positionChildren(guild, staff, staffCategory.channels);
  }

  const botCategory = await ensureCategory(guild, levelingConfig.botCategoryName, verifiedOverwrites);
  if (syncAll) {
    orderedCategories.push(botCategory);
    for (const channelDefinition of levelingConfig.botChannels) {
      const isFeed = channelDefinition.name === "level-feed";
      const overwrites = isFeed
        ? buildReadOnlyOverwrites(guild, visibleVerifiedRoles, founderAndCommunity)
        : verifiedOverwrites;
      await ensureChildChannel(guild, botCategory, channelDefinition, overwrites);
    }
    await positionChildren(guild, botCategory, levelingConfig.botChannels);
  }

  if (syncAll) {
    for (let index = 0; index < orderedCategories.length; index += 1) {
      await orderedCategories[index].setPosition(index).catch(() => null);
    }
  }

  let rolePosition = guild.roles.cache.size + 5;
  const orderedRoleIds = [
    ensuredFixedRoles.founder.id,
    ensuredFixedRoles.admin.id,
    ensuredFixedRoles.community.id,
    ensuredFixedRoles.moderator.id,
    ensuredFixedRoles.country_lead.id,
    ensuredFixedRoles.media_reviewer.id,
    ensuredFixedRoles.media.id,
    ensuredFixedRoles.verified.id,
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

  const rulesChannel = onboardingCategory
    ? guild.channels.cache.find((channel) => channel.parentId === onboardingCategory.id && channel.name === "rules")
    : null;
  const rolesChannel = onboardingCategory
    ? guild.channels.cache.find((channel) => channel.parentId === onboardingCategory.id && channel.name === "choose-your-roles")
    : null;
  const welcomeChannel = onboardingCategory
    ? guild.channels.cache.find((channel) => channel.parentId === onboardingCategory.id && channel.name === "welcome-start-here")
    : null;
  const languageGuideChannel = onboardingCategory
    ? guild.channels.cache.find((channel) => channel.parentId === onboardingCategory.id && channel.name === "language-guide")
    : null;
  const navigationChannel = onboardingCategory
    ? guild.channels.cache.find((channel) => channel.parentId === onboardingCategory.id && channel.name === "navigation")
    : null;
  const mediaInfoChannel = guild.channels.cache.find(
    (channel) => channel.parentId === media.id && channel.name === "media-info"
  );
  const mediaApplyChannel = guild.channels.cache.find(
    (channel) => channel.parentId === media.id && channel.name === "apply-for-media"
  );
  const leaderInfoChannel = applications
    ? guild.channels.cache.find((channel) => channel.parentId === applications.id && channel.name === "region-leader-info")
    : null;
  const leaderApplyChannel = applications
    ? guild.channels.cache.find((channel) => channel.parentId === applications.id && channel.name === "apply-for-region-leader")
    : null;
  const commandsChannel = guild.channels.cache.find(
    (channel) => channel.parentId === botCategory.id && channel.name === "bot-commands"
  );
  const findTeamChannel = guild.channels.cache.find((channel) => channel.name === "find-team");

  if (syncAll && welcomeChannel) {
    await postWelcomeMessages(welcomeChannel);
  }

  if (syncAll && rulesChannel) {
    await postRulesMessages(rulesChannel);
  }

  if (syncAll && languageGuideChannel) {
    await postLanguageGuideMessages(languageGuideChannel);
  }

  if (syncAll && navigationChannel) {
    await postNavigationMessages(navigationChannel);
  }

  if (syncAll && rolesChannel) {
    await postRoleSelectionMessages(rolesChannel);
  }

  if (mediaInfoChannel) {
    await postYouTuberInfoMessages(mediaInfoChannel);
  }

  if (mediaApplyChannel) {
    await postYouTuberApplyMessages(mediaApplyChannel);
  }

  if (syncAll && leaderInfoChannel) {
    await postRegionLeaderInfoMessages(leaderInfoChannel);
  }

  if (syncAll && leaderApplyChannel) {
    await postRegionLeaderApplyMessages(leaderApplyChannel);
  }

  if (syncAll && commandsChannel) {
    await postBotCommandsMessages(commandsChannel);
  }

  if (syncAll && findTeamChannel) {
    await postFindTeamMessages(findTeamChannel);
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
      embeds: [createMediaApplyEmbed()],
      components: [createMediaApplyButton()]
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
      embeds: [createRegionLeaderApplyEmbed()],
      components: [createRegionLeaderApplyButton()]
    }
  ]);
}

async function postBotCommandsMessages(channel) {
  await syncManagedMessages(channel, "bot:commands", [
    { embeds: [createCommandsEmbed()] }
  ]);
}

async function postFindTeamMessages(channel) {
  await syncManagedMessages(channel, "global:find-team", [
    {
      embeds: [createFindTeamPanelEmbed()],
      components: [createFindTeamButton()]
    }
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
        const member = await interaction.guild.members.fetch(interaction.user.id);
        if (!isFounder(member)) {
          await interaction.reply({
            content: "Only the Founder can use this server management command.",
            ephemeral: true
          });
          return;
        }

        await interaction.deferReply({ ephemeral: true });
        const mode = interaction.options.getString("mode", true);
        const scope = interaction.options.getString("scope") ?? "all";
        const result = await syncServer(interaction.guild, mode, scope);
        await interaction.editReply(
          `Setup finished for scope: ${scope}. Fixed roles: ${result.fixedRoleCount}, country roles: ${result.countryRoleCount}, skill roles: ${result.skillRoleCount}, public categories: ${result.publicCategoryCount}, country categories: ${result.countryCategoryCount}.`
        );
        return;
      }

      if (interaction.commandName === "post-panels") {
        const member = await interaction.guild.members.fetch(interaction.user.id);
        if (!isFounder(member)) {
          await interaction.reply({
            content: "Only the Founder can use this server management command.",
            ephemeral: true
          });
          return;
        }

        await interaction.deferReply({ ephemeral: true });
        await postPanels(interaction.channel);
        await interaction.editReply("Panels were rebuilt in this channel.");
        return;
      }

      if (interaction.commandName === "audit") {
        const member = await interaction.guild.members.fetch(interaction.user.id);
        if (!isFounder(member)) {
          await interaction.reply({
            content: "Only the Founder can use this server management command.",
            ephemeral: true
          });
          return;
        }

        await interaction.reply({
          embeds: [buildAuditSummary(interaction.guild)],
          ephemeral: true
        });
        return;
      }

      if (interaction.commandName === "refresh-commands") {
        const member = await interaction.guild.members.fetch(interaction.user.id);
        if (!isFounder(member)) {
          await interaction.reply({
            content: "Only the Founder can use this server management command.",
            ephemeral: true
          });
          return;
        }

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
        return;
      }

      if (interaction.commandName === "tr") {
        await interaction.deferReply({ ephemeral: true });
        const member = await interaction.guild.members.fetch(interaction.user.id);
        const textInput = interaction.options.getString("text");
        const messageLink = interaction.options.getString("message_link");
        const selectedLanguage = interaction.options.getString("language") ?? "auto";
        const targetLanguage = selectedLanguage === "auto" ? detectPreferredLanguage(member) : selectedLanguage;

        let source = null;
        try {
          source = await resolveTranslationSource(interaction, textInput, messageLink);
        } catch (error) {
          const messages = {
            "invalid-message-link": "Use a valid Discord message link from this server.",
            "message-channel-missing": "That message channel was not found.",
            "message-missing": "That message could not be fetched.",
            "message-empty": "That message has no text to translate."
          };

          await interaction.editReply(messages[error.message] ?? "Could not read that message.");
          return;
        }

        if (!source) {
          await interaction.editReply("Add text or a message link for translation.");
          return;
        }

        try {
          const translation = await translateText(source.text, targetLanguage);
          await interaction.editReply({
            embeds: [buildTranslationEmbed(source, translation, targetLanguage)]
          });
        } catch (error) {
          console.error("Translation failed:", error);
          await interaction.editReply("Translation failed right now. Try again in a moment.");
        }
        return;
      }

      if (interaction.commandName === "8ball") {
        const question = interaction.options.getString("question", true);
        const answer = eightBallAnswers[Math.floor(Math.random() * eightBallAnswers.length)];
        await interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setTitle("Studio 8-Ball")
              .setColor(0xa29bfe)
              .addFields(
                { name: "Question", value: question.slice(0, 1024) },
                { name: "Answer", value: answer }
              )
          ]
        });
        return;
      }

      if (interaction.commandName === "roll") {
        const sides = interaction.options.getInteger("sides") ?? 100;
        const rolled = Math.floor(Math.random() * sides) + 1;
        await interaction.reply(`You rolled **${rolled}** on a **d${sides}**.`);
        return;
      }

      if (interaction.commandName === "studio-idea") {
        await interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setTitle("Studio Idea Drop")
              .setColor(0xfd79a8)
              .setDescription(createStudioIdea())
          ]
        });
        return;
      }

      if (interaction.commandName === "team-ad") {
        await interaction.deferReply({ ephemeral: true });
        const member = await interaction.guild.members.fetch(interaction.user.id);

        if (!isVerifiedMember(member)) {
          await interaction.editReply("You need to verify first before posting team ads.");
          return;
        }

        const { meta } = getGuildMeta(interaction.guild.id);
        const { cooldowns, now, remainingMs } = getFindTeamCooldown(meta, interaction.user.id);

        if (remainingMs > 0) {
          const remainingHours = Math.ceil(remainingMs / (60 * 60 * 1000));
          await interaction.editReply(`You can publish another team ad in about ${remainingHours} hour(s).`);
          return;
        }

        const targetChannel = interaction.guild.channels.cache.find(
          (channel) => channel.name === "team-board" && channel.type === ChannelType.GuildText
        );

        if (!targetChannel) {
          await interaction.editReply("The team-board channel was not found. Ask staff to run /setup again.");
          return;
        }

        const title = interaction.options.getString("title", true);
        const description = interaction.options.getString("description", true);
        const reward = interaction.options.getString("reward", true);
        const rolesNeeded = interaction.options.getString("looking_for", true);
        const contact = `${interaction.user} | ${interaction.user.tag}`;
        const imageOne = interaction.options.getAttachment("image_one");
        const imageTwo = interaction.options.getAttachment("image_two");
        const imageUrls = [imageOne?.url, imageTwo?.url].filter(Boolean);

        const embeds = [
          buildFindTeamEmbed({
            author: interaction.user,
            title,
            description,
            reward,
            rolesNeeded,
            contact,
            extraNotes: null,
            imageUrls
          }),
          ...buildFindTeamImageEmbeds(imageUrls)
        ];

        await targetChannel.send({
          embeds,
          allowedMentions: { users: [interaction.user.id], roles: [], parse: [] }
        });

        setGuildMetaValue(interaction.guild.id, "findTeamCooldowns", {
          ...cooldowns,
          [interaction.user.id]: now
        });

        await interaction.editReply("Your team ad with uploaded images has been published in #team-board.");
        return;
      }

      if (interaction.commandName === "create-application-panel") {
        const member = await interaction.guild.members.fetch(interaction.user.id);
        if (!isFounder(member)) {
          await interaction.reply({
            content: "Only the Founder can create custom application panels.",
            ephemeral: true
          });
          return;
        }

        const targetChannel = interaction.options.getChannel("channel", true);
        const reviewChannel = interaction.options.getChannel("review_channel", true);
        const title = interaction.options.getString("title", true);
        const description = interaction.options.getString("description", true);
        const buttonLabel = interaction.options.getString("button_label", true);
        const modalTitle = interaction.options.getString("modal_title", true);
        const fieldOneLabel = interaction.options.getString("field_one_label", true);
        const fieldTwoLabel = interaction.options.getString("field_two_label", true);

        if (targetChannel.type !== ChannelType.GuildText || reviewChannel.type !== ChannelType.GuildText) {
          await interaction.reply({
            content: "Choose text channels for both the panel channel and the review channel.",
            ephemeral: true
          });
          return;
        }

        const panelId = `panel_${Date.now()}`;
        setApplicationPanel(interaction.guild.id, panelId, {
          targetChannelId: targetChannel.id,
          reviewChannelId: reviewChannel.id,
          title,
          description,
          buttonLabel,
          modalTitle,
          fieldOneLabel,
          fieldTwoLabel,
          fieldOnePlaceholder: "Paste the main link or reference here",
          fieldTwoPlaceholder: "Tell us about the applicant, motivation, and details"
        });

        await targetChannel.send({
          embeds: [createApplicationPanelEmbed(title, description)],
          components: [createApplicationPanelButton(`open-panel:${panelId}`, buttonLabel)]
        });

        await interaction.reply({
          content: `Application panel created in #${targetChannel.name}.`,
          ephemeral: true
        });
      }
    }

    if (interaction.isMessageContextMenuCommand()) {
      if (!interaction.inCachedGuild()) {
        await interaction.reply({ content: "This command works only inside a server.", ephemeral: true });
        return;
      }

      if (interaction.commandName === "Translate Message") {
        await interaction.deferReply({ ephemeral: true });
        const member = await interaction.guild.members.fetch(interaction.user.id);
        const targetLanguage = detectPreferredLanguage(member);
        const sourceText =
          interaction.targetMessage.content ||
          interaction.targetMessage.embeds[0]?.description ||
          interaction.targetMessage.embeds[0]?.title;

        if (!sourceText) {
          await interaction.editReply("This message has no text to translate.");
          return;
        }

        try {
          const translation = await translateText(sourceText, targetLanguage);
          await interaction.editReply({
            embeds: [
              buildTranslationEmbed(
                {
                  text: sourceText,
                  sourceLabel: `Message by ${interaction.targetMessage.author.username}`,
                  sourceUrl: interaction.targetMessage.url
                },
                translation,
                targetLanguage
              )
            ]
          });
        } catch (error) {
          console.error("Context translation failed:", error);
          await interaction.editReply("Translation failed right now. Try again in a moment.");
        }
        return;
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

      if (interaction.customId === "open-media-application") {
        await interaction.showModal(createMediaApplicationModal());
        return;
      }

      if (interaction.customId === "open-region-leader-application") {
        await interaction.showModal(createRegionLeaderApplicationModal());
        return;
      }

      if (interaction.customId === "open-find-team-post") {
        const member = await interaction.guild.members.fetch(interaction.user.id);
        if (!isVerifiedMember(member)) {
          await interaction.reply({
            content: "You need to verify first before posting team ads.",
            ephemeral: true
          });
          return;
        }

        await interaction.showModal(createFindTeamModal());
        return;
      }

      if (interaction.customId.startsWith("open-panel:")) {
        const panelId = interaction.customId.split(":")[1];
        const panel = getApplicationPanel(interaction.guild.id, panelId);
        if (!panel) {
          await interaction.reply({
            content: "This application panel is no longer available.",
            ephemeral: true
          });
          return;
        }

        await interaction.showModal(
          createApplicationModal(
            `submit-panel:${panelId}`,
            panel.modalTitle,
            panel.fieldOneLabel,
            panel.fieldTwoLabel,
            panel.fieldOnePlaceholder,
            panel.fieldTwoPlaceholder
          )
        );
        return;
      }

      if (interaction.customId === "show-server-info") {
        await interaction.reply({
          embeds: [buildAuditSummary(interaction.guild)],
          ephemeral: true
        });
        return;
      }

      if (interaction.customId.startsWith("media-approve:") || interaction.customId.startsWith("media-decline:")) {
        const member = await interaction.guild.members.fetch(interaction.user.id);
        if (!canReviewMedia(member)) {
          await interaction.reply({
            content: "You do not have permission to review Media applications.",
            ephemeral: true
          });
          return;
        }

        const [actionPrefix, applicantId] = interaction.customId.split(":");
        const action = actionPrefix.replace("media-", "");
        const applicant = await interaction.guild.members.fetch(applicantId).catch(() => null);
        const mediaRole = interaction.guild.roles.cache.find(
          (role) => role.name === fixedRoles.find((item) => item.key === "media").name
        );

        const reviewEmbed = interaction.message.embeds[0]
          ? EmbedBuilder.from(interaction.message.embeds[0])
          : new EmbedBuilder().setTitle("Media Application");

        if (action === "approve") {
          if (applicant && mediaRole && !applicant.roles.cache.has(mediaRole.id)) {
            await applicant.roles.add(mediaRole).catch(() => null);
          }

          if (applicant) {
            await applicant.send(
              "Your Media application was approved. You can now use the Media role and post new uploads in the media channel."
            ).catch(() => null);
          }

          reviewEmbed
            .setColor(0x2ecc71)
            .addFields({
              name: "Review Decision",
              value: `Approved by ${interaction.user.username}`
            });

          await interaction.update({
            embeds: [reviewEmbed],
            components: []
          });
          return;
        }

        if (applicant) {
          await applicant.send(
            "Your Media application was declined. You can improve your application and apply again later."
          ).catch(() => null);
        }

        reviewEmbed
          .setColor(0xe74c3c)
          .addFields({
            name: "Review Decision",
            value: `Declined by ${interaction.user.username}`
          });

        await interaction.update({
          embeds: [reviewEmbed],
          components: []
        });
        return;
      }

      if (
        interaction.customId.startsWith("region-leader-approve:")
        || interaction.customId.startsWith("region-leader-decline:")
      ) {
        const member = await interaction.guild.members.fetch(interaction.user.id);
        if (!canReviewRegionLeader(member)) {
          await interaction.reply({
            content: "You do not have permission to review Region Leader applications.",
            ephemeral: true
          });
          return;
        }

        const [actionPrefix, applicantId] = interaction.customId.split(":");
        const action = actionPrefix.replace("region-leader-", "");
        const applicant = await interaction.guild.members.fetch(applicantId).catch(() => null);
        const reviewEmbed = interaction.message.embeds[0]
          ? EmbedBuilder.from(interaction.message.embeds[0])
          : new EmbedBuilder().setTitle("Region Leader Application");

        const regionField = reviewEmbed.data.fields?.find((field) => field.name === "Requested Region");
        const region = regionField ? resolveCountryFromInput(regionField.value) : null;
        const roleToGrant = region
          ? interaction.guild.roles.cache.find((role) => role.name === `${region.emoji} ${region.name} Leader`)
          : null;

        if (action === "approve") {
          if (!region || !roleToGrant) {
            await interaction.reply({
              content: "This application does not contain a valid region, so I could not assign the leader role.",
              ephemeral: true
            });
            return;
          }

          if (applicant) {
            for (const country of countries) {
              const leaderRole = interaction.guild.roles.cache.find(
                (role) => role.name === `${country.emoji} ${country.name} Leader`
              );
              if (leaderRole && applicant.roles.cache.has(leaderRole.id) && leaderRole.id !== roleToGrant.id) {
                await applicant.roles.remove(leaderRole).catch(() => null);
              }
            }

            if (!applicant.roles.cache.has(roleToGrant.id)) {
              await applicant.roles.add(roleToGrant).catch(() => null);
            }

            await applicant.send(
              `Your Region Leader application was approved. You now lead ${region.name} and can post regional news in that hub.`
            ).catch(() => null);
          }

          reviewEmbed
            .setColor(0x2ecc71)
            .addFields({
              name: "Review Decision",
              value: `Approved by ${interaction.user.username} for ${region.name}`
            });

          await interaction.update({
            embeds: [reviewEmbed],
            components: []
          });
          return;
        }

        if (applicant) {
          await applicant.send(
            "Your Region Leader application was declined. You can improve it and apply again later."
          ).catch(() => null);
        }

        reviewEmbed
          .setColor(0xe74c3c)
          .addFields({
            name: "Review Decision",
            value: `Declined by ${interaction.user.username}`
          });

        await interaction.update({
          embeds: [reviewEmbed],
          components: []
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

    if (interaction.isModalSubmit()) {
      if (!interaction.inCachedGuild()) {
        await interaction.reply({ content: "This form works only inside a server.", ephemeral: true });
        return;
      }

      if (interaction.customId === "submit-media-application") {
        const socialLink = interaction.fields.getTextInputValue("field_one");
        const aboutCreator = interaction.fields.getTextInputValue("field_two");
        const applicationChannel = interaction.guild.channels.cache.find(
          (channel) => channel.name === "media-applications" && channel.type === ChannelType.GuildText
        );

        if (!applicationChannel) {
          await interaction.reply({
            content: "The Media review channel was not found. Ask staff to run /setup again.",
            ephemeral: true
          });
          return;
        }

        const applicationEmbed = new EmbedBuilder()
          .setTitle("New Media Application")
          .setColor(0xff4757)
          .setDescription("A new private Media application was submitted for review.")
          .addFields(
            {
              name: "Applicant",
              value: `${interaction.user.tag} (${interaction.user.id})`
            },
            {
              name: "Social Or Creator Link",
              value: socialLink
            },
            {
              name: "About The Creator",
              value: aboutCreator
            }
          )
          .setFooter({
            text: `Applicant ID: ${interaction.user.id}`
          })
          .setTimestamp();

        await applicationChannel.send({
          embeds: [applicationEmbed],
          components: [createMediaReviewButtons(interaction.user.id)],
          allowedMentions: { parse: [] }
        });

        await interaction.reply({
          content: "Your Media application was submitted successfully.",
          ephemeral: true
        });
        return;
      }

      if (interaction.customId === "submit-region-leader-application") {
        const regionInput = interaction.fields.getTextInputValue("field_one");
        const aboutApplicant = interaction.fields.getTextInputValue("field_two");
        const region = resolveCountryFromInput(regionInput);

        if (!region) {
          await interaction.reply({
            content: "I could not understand that region. Use a server country like Russia, Ukraine, USA, Turkey, Brazil, Spain, France, Germany, Poland, or Kazakhstan.",
            ephemeral: true
          });
          return;
        }

        const applicationChannel = interaction.guild.channels.cache.find(
          (channel) => channel.name === "region-leader-applications" && channel.type === ChannelType.GuildText
        );

        if (!applicationChannel) {
          await interaction.reply({
            content: "The Region Leader review channel was not found. Ask staff to run /setup again.",
            ephemeral: true
          });
          return;
        }

        const applicationEmbed = new EmbedBuilder()
          .setTitle("New Region Leader Application")
          .setColor(0xfdcb6e)
          .setDescription("A new private Region Leader application was submitted for review.")
          .addFields(
            {
              name: "Applicant",
              value: `${interaction.user.tag} (${interaction.user.id})`
            },
            {
              name: "Requested Region",
              value: `${region.emoji} ${region.name}`
            },
            {
              name: "Applicant Details",
              value: aboutApplicant
            }
          )
          .setFooter({
            text: `Applicant ID: ${interaction.user.id}`
          })
          .setTimestamp();

        await applicationChannel.send({
          embeds: [applicationEmbed],
          components: [createRegionLeaderReviewButtons(interaction.user.id)],
          allowedMentions: { parse: [] }
        });

        await interaction.reply({
          content: `Your Region Leader application for ${region.name} was submitted successfully.`,
          ephemeral: true
        });
        return;
      }

      if (interaction.customId === "submit-find-team-post") {
        const member = await interaction.guild.members.fetch(interaction.user.id);
        if (!isVerifiedMember(member)) {
          await interaction.reply({
            content: "You need to verify first before posting team ads.",
            ephemeral: true
          });
          return;
        }

        const title = interaction.fields.getTextInputValue("ad_title");
        const description = interaction.fields.getTextInputValue("ad_description");
        const reward = interaction.fields.getTextInputValue("ad_reward");
        const rolesNeeded = interaction.fields.getTextInputValue("ad_roles");
        const extraNotes = interaction.fields.getTextInputValue("ad_notes");
        const { meta } = getGuildMeta(interaction.guild.id);
        const { cooldowns, now, remainingMs } = getFindTeamCooldown(meta, interaction.user.id);

        if (remainingMs > 0) {
          const remainingHours = Math.ceil(remainingMs / (60 * 60 * 1000));
          await interaction.reply({
            content: `You can publish another team ad in about ${remainingHours} hour(s).`,
            ephemeral: true
          });
          return;
        }

        const targetChannel = interaction.guild.channels.cache.find(
          (channel) => channel.name === "team-board" && channel.type === ChannelType.GuildText
        );

        if (!targetChannel) {
          await interaction.reply({
            content: "The team-board channel was not found. Ask staff to run /setup again.",
            ephemeral: true
          });
          return;
        }

        await targetChannel.send({
          embeds: [
            buildFindTeamEmbed({
              author: interaction.user,
              title,
              description,
              reward,
              rolesNeeded,
              contact: `${interaction.user} | ${interaction.user.tag}`,
              extraNotes,
              imageUrls: []
            })
          ],
          allowedMentions: { users: [interaction.user.id], roles: [], parse: [] }
        });

        setGuildMetaValue(interaction.guild.id, "findTeamCooldowns", {
          ...cooldowns,
          [interaction.user.id]: now
        });

        await interaction.reply({
          content: "Your team ad has been published in #team-board. For real uploaded images, use /team-ad.",
          ephemeral: true
        });
        return;
      }

      if (interaction.customId.startsWith("submit-panel:")) {
        const panelId = interaction.customId.split(":")[1];
        const panel = getApplicationPanel(interaction.guild.id, panelId);
        if (!panel) {
          await interaction.reply({
            content: "This application panel is no longer available.",
            ephemeral: true
          });
          return;
        }

        const reviewChannel = interaction.guild.channels.cache.get(panel.reviewChannelId);
        if (!reviewChannel || reviewChannel.type !== ChannelType.GuildText) {
          await interaction.reply({
            content: "The review channel for this panel no longer exists.",
            ephemeral: true
          });
          return;
        }

        const fieldOne = interaction.fields.getTextInputValue("field_one");
        const fieldTwo = interaction.fields.getTextInputValue("field_two");

        const embed = new EmbedBuilder()
          .setTitle(panel.title)
          .setColor(0x6c5ce7)
          .setDescription(`${interaction.user} submitted an application.`)
          .addFields(
            {
              name: panel.fieldOneLabel,
              value: fieldOne
            },
            {
              name: panel.fieldTwoLabel,
              value: fieldTwo
            }
          )
          .setFooter({
            text: `Applicant ID: ${interaction.user.id}`
          })
          .setTimestamp();

        await reviewChannel.send({
          embeds: [embed],
          allowedMentions: { parse: [] }
        });

        await interaction.reply({
          content: "Your application was submitted successfully.",
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

client.on("guildMemberAdd", async (member) => {
  try {
    const { welcomeStartChannel, welcomeFeedChannel, memberTrackerChannel } = await getOnboardingChannels(member.guild);
    const avatarUrl = member.displayAvatarURL({ extension: "png", size: 256 });
    const cardBuffer = await renderWelcomeCard({
      username: member.displayName,
      avatarUrl,
      memberCount: member.guild.memberCount,
      serverName: setupSummary.serverName
    });
    const attachment = new AttachmentBuilder(cardBuffer, { name: `welcome-${member.id}.png` });
    const createdAtSeconds = Math.floor(member.user.createdTimestamp / 1000);
    let welcomePosted = false;

    if (welcomeFeedChannel && welcomeFeedChannel.type === ChannelType.GuildText) {
      const sent = await welcomeFeedChannel.send({
        content: `${member}`,
        embeds: [
          new EmbedBuilder()
            .setTitle("A New Creator Has Arrived")
            .setColor(0x72f2eb)
            .setDescription(
              `Welcome to **${setupSummary.serverName}**. Verify yourself, pick your country, and jump into the global creator scene.`
            )
            .setImage(`attachment://welcome-${member.id}.png`)
        ],
        files: [attachment],
        allowedMentions: { users: [member.id], roles: [], parse: [] }
      }).catch(() => null);

      welcomePosted = Boolean(sent);
    }

    if (!welcomePosted && welcomeStartChannel && welcomeStartChannel.type === ChannelType.GuildText) {
      await welcomeStartChannel.send({
        content: `${member}`,
        embeds: [
          new EmbedBuilder()
            .setTitle("A New Creator Has Arrived")
            .setColor(0x72f2eb)
            .setDescription(
              `Welcome to **${setupSummary.serverName}**. Verify yourself, pick your country, and jump into the global creator scene.`
            )
            .setImage(`attachment://welcome-${member.id}.png`)
        ],
        files: [attachment],
        allowedMentions: { users: [member.id], roles: [], parse: [] }
      }).catch(() => null);
    }

    if (memberTrackerChannel && memberTrackerChannel.type === ChannelType.GuildText) {
      await memberTrackerChannel.send({
        embeds: [
          new EmbedBuilder()
            .setTitle("New Member Joined")
            .setColor(0x55efc4)
            .setDescription(`${member.user.tag} joined the server.`)
            .addFields(
              {
                name: "Member",
                value: `${member} (${member.id})`
              },
              {
                name: "Discord Account Created",
                value: `<t:${createdAtSeconds}:F>\n<t:${createdAtSeconds}:R>`
              },
              {
                name: "Current Member Count",
                value: String(member.guild.memberCount)
              }
            )
            .setThumbnail(member.displayAvatarURL({ extension: "png", size: 256 }))
            .setTimestamp()
        ],
        allowedMentions: { parse: [] }
      }).catch(() => null);
    }
  } catch (error) {
    console.error("Welcome flow failed:", error);
  }
});

process.on("unhandledRejection", (error) => {
  console.error("Unhandled rejection:", error);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught exception:", error);
});

client.login(token);
