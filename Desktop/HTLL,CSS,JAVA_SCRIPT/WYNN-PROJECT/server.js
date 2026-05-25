const express = require('express');
const path = require('path');
const axios = require('axios');
const qs = require('querystring');
require('dotenv').config();

const fs = require('fs');
const app = express();
app.use(express.json());
// Set your Discord user ID here (only you can edit leaderboard)
const OWNER_ID = '817647495773028373'; // <-- user's Discord user ID
// Helper: get leaderboard data
function getLeaderboard() {
  try {
    return JSON.parse(fs.readFileSync(path.join(__dirname, 'leaderboard.json'), 'utf8'));
  } catch (e) {
    return { pvp: [], pve: [] };
  }
}

// Helper: save leaderboard data
function saveLeaderboard(data) {
  fs.writeFileSync(path.join(__dirname, 'leaderboard.json'), JSON.stringify(data, null, 2), 'utf8');
}

// API: get leaderboard
app.get('/api/leaderboard', (req, res) => {
  res.json(getLeaderboard());
});

// API: update leaderboard (owner only)
app.post('/api/leaderboard', (req, res) => {
  // In a real app, get user ID from session/cookie after Discord login
  const userId = req.headers['x-discord-id'];
  if (userId !== OWNER_ID) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const { pvp, pve } = req.body;
  if (!Array.isArray(pvp) || !Array.isArray(pve)) {
    return res.status(400).json({ error: 'Invalid data' });
  }
  saveLeaderboard({ pvp, pve });
  res.json({ success: true });
});
const PORT = process.env.PORT || 3000;
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;
const GUILD_ID = process.env.GUILD_ID;
const INVITE_URL = process.env.INVITE_URL || 'https://discord.gg/';

app.use(express.static(path.join(__dirname)));

if (!CLIENT_ID || !CLIENT_SECRET || !REDIRECT_URI || !GUILD_ID) {
  console.warn('Make sure to set CLIENT_ID, CLIENT_SECRET, REDIRECT_URI and GUILD_ID in .env');
}

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/stats.html');
});

app.get('/callback', async (req, res) => {
  const code = req.query.code;
  if (!code) return res.status(400).send('No code provided');

  try {
    // Exchange code for token
    const tokenRes = await axios.post('https://discord.com/api/oauth2/token', qs.stringify({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: REDIRECT_URI
    }), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    const accessToken = tokenRes.data.access_token;
    if (!accessToken) return res.status(500).send('Failed to obtain access token');

    // Get user's guilds
    const guildsRes = await axios.get('https://discord.com/api/users/@me/guilds', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    const guilds = guildsRes.data;
    const isMember = Array.isArray(guilds) && guilds.some(g => g.id === GUILD_ID);

    if (isMember) {
      return res.redirect('/main.html');
    } else {
      return res.redirect('/join.html');
    }

  } catch (err) {
    console.error(err?.response?.data || err.message || err);
    return res.status(500).send('Error during OAuth process. Check server logs.');
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
