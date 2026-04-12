# SCAMLAB Ecosystem Proposal

To create a fully connected ecosystem between the **Telegram Channel**, **Bot**, and **Mini App**, we propose the following architecture:

## 1. Telegram Bot (@scamlab_bot)
The bot acts as the "Gateway" and "Notifier".

### Key Features:
- **Entry Point**: Provides a `MenuButton` and an inline button in the `/start` message to launch the Mini App.
- **Push Notifications**: Sends alerts when:
  - A new scenario is added.
  - The user's leaderboard rank changes.
  - The user hasn't completed their daily challenge.
- **Deep Linking**: Supports `startapp` parameters.
  - **Bot Logic**: When a user sends `/start scenario_ID`, the bot should respond with a message and a button to launch the Mini App with that ID.
  - **Link Format**: `t.me/scamlab_bot/app?startapp=scenario_601` launches the app directly into the Banking scenario.
- **Verification**: Checks if the user is subscribed to the channel to unlock exclusive "Expert" scenarios.

## 2. Telegram Channel (@scamlab_channel)
The channel acts as the "Community Hub".

### Key Features:
- **Educational Content**: Posts real-world scam examples that are later turned into interactive scenarios in the app.
- **Leaderboard Highlights**: Weekly posts featuring the top 3 players from the global leaderboard.
- **Polls & Feedback**: Direct interaction with users to decide which scenario to build next.

## 3. Telegram Mini App (The App)
The app acts as the "Interactive Experience".

### Key Features:
- **Seamless Auth**: Uses `tg.initData` to authenticate users without passwords.
- **Haptic Feedback**: Uses `tg.HapticFeedback` for immersive gameplay (vibration on errors/success).
- **Native UI**: 
  - `MainButton`: Used for "Next Question" to match Telegram's UX.
  - `BackButton`: Native navigation between screens.
  - `SettingsButton`: Opens the in-app settings.
- **Sharing**: Users can share their score directly to the bot or friends using `tg.shareExternalLink`.

## Connection Logic (The "Glue")
- **Firebase Sync**: Both the Bot and the Mini App connect to the same Firestore database.
- **User ID**: We use the `telegram_id` as the primary key.
- **Join-to-Play**: The app checks the user's membership status in the channel via the Bot API (`getChatMember`) before allowing access to "Expert" scenarios.

---

### Suggested Bot Commands:
- `/start` - Welcome message + Play button.
- `/stats` - Quick summary of XP and Rank (synced from app).
- `/top` - Top 10 players (synced from app).
- `/help` - Instructions on how to use the ecosystem.
