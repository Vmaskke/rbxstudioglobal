# Roblox Studio Global Discord Bot

Bot for setting up a polished international Discord server for Roblox developers. It creates:

- onboarding channels
- multilingual welcome and rules posts
- global public categories
- private country hubs
- leveling system with XP, voice rewards, and rank cards
- creative role selection panels
- staff channels
- audit commands to inspect what already exists on the server

## What the bot does

After you invite the bot to your Discord server and run `/setup`, it can create:

- `🚀 Start Here` with welcome, rules, role selection, and announcements
- `🌍 Global Community` for everyone
- `🛠️ Creation Labs` for scripts, builds, animation, models, UI, web, and hiring
- `🆘 Support Center` for help and feedback
- `🛡️ Staff` for private moderation and setup notes
- country categories like `🇷🇺 Russia Hub`, `🇺🇦 Ukraine Hub`, `🇺🇸 USA Hub`, etc.

It also creates:

- country roles
- creative specialization roles
- founder/admin/moderator/community roles

## Important limitation

Discord Community mode is **not** enabled by this bot. Discord's official documentation says community features must be enabled by following the steps in server settings manually:

- [Discord Community Servers docs](https://docs.discord.com/developers/platform/community-servers)

So after inviting the bot, manually enable:

1. `Server Settings -> Enable Community`
2. rules or guidelines channel
3. community updates channel
4. onboarding and moderation options you want

The bot then handles the rest of the structure.

## Setup

1. Create a Discord application and bot in the Developer Portal.
2. Turn on the `SERVER MEMBERS INTENT`.
3. Invite the bot with permissions to manage roles and channels.
4. Copy `.env.example` to `.env`.
5. Fill in:

```env
DISCORD_TOKEN=your_bot_token_here
CLIENT_ID=your_application_id_here
GUILD_ID=your_server_id_here
```

6. Install dependencies:

```powershell
npm.cmd install
```

7. Start the bot:

```powershell
npm.cmd start
```

## Commands

- `/setup mode:safe` creates missing roles, categories, and channels without renaming more than needed.
- `/setup mode:full` also tries to rename the server to `Roblox Studio Global`.
- `/post-panels` posts the onboarding and role-selection messages in the current channel.
- `/post-panels` also posts multilingual welcome and rules embeds for every country in the panel.
- `/rank` generates a level card image with XP, current rank, and progress to the next level.
- `/leaderboard` shows the top XP users in the server.
- `/audit` shows what already exists on the server.
- `/refresh-commands` refreshes slash commands for the selected guild.

## Suggested onboarding flow

1. Run `/setup mode:safe`
2. Open the `choose-your-roles` channel
3. Run `/post-panels`
4. Enable Community mode manually in Discord
5. Adjust the list of countries in `src/config/serverTemplate.js`

## Customize

Edit [src/config/serverTemplate.js](C:/Users/dima0/OneDrive/Desktop/rbxstudioglobal/src/config/serverTemplate.js) to:

- add or remove countries
- change role names
- change channel layout
- add more hubs like marketplace, events, or jobs

## Notes

- Country hubs are private to their country role and staff roles.
- Global channels stay visible to everyone.
- Running setup multiple times is safe because the bot checks for existing roles and channels by name first.
- Running `/setup` again also reorders categories and channels into the intended layout.
- XP is earned from messages and time spent in voice channels.
- Level data is stored locally in `data/levels.json`.
- The bot creates `🤖 Bot System` with `bot-commands` and `level-feed`.
