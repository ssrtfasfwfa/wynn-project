# Discord server membership check (minimal)

Steps to run locally:

1. Copy `.env.example` to `.env` and fill in `CLIENT_ID`, `CLIENT_SECRET`, `REDIRECT_URI`, `GUILD_ID`, and `INVITE_URL`.
   - `REDIRECT_URI` must match exactly the redirect you add in the Discord Developer Portal (e.g. `http://localhost:3000/callback`).
   - `GUILD_ID` is the server ID you want to check membership for.

2. Install dependencies and start the server:

```bash
npm install
npm start
```

3. Open `http://localhost:3000` and click **Login with Discord**.

Behavior:
- If the user is already a member of `GUILD_ID`, the server responds with "Verified".
- If the user is not a member, the server redirects them to `INVITE_URL` so they can join. After joining, run the login flow again to verify.

Notes:
- This example is minimal to show the flow. For production you should:
  - Validate redirect URIs and CSRF (state parameter).
  - Store sessions and tokens securely.
  - Use HTTPS in production.
