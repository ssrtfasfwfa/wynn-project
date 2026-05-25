const express = require('express');
const axios = require('axios');
const qs = require('querystring');
require('dotenv').config();

const app = express();
app.use(express.json());

const OWNER_ID = '817647495773028373';
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;
const GUILD_ID = process.env.GUILD_ID;

// Test endpoint
app.get('/test', (req, res) => {
  console.log('✅ Server is alive!');
  res.json({ 
    message: 'Server is working!',
    timestamp: new Date().toISOString()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Wynn Discord Auth Server',
    status: 'online'
  });
});

// Discord OAuth callback
app.get('/callback', async (req, res) => {
  const code = req.query.code;
  
  if (!code) {
    return res.status(400).json({ error: 'No code provided' });
  }

  try {
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
    if (!accessToken) {
      return res.status(500).json({ error: 'Failed to obtain access token' });
    }

    const guildsRes = await axios.get('https://discord.com/api/users/@me/guilds', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    const guilds = guildsRes.data;
    const isMember = Array.isArray(guilds) && guilds.some(g => g.id === GUILD_ID);

    if (isMember) {
      res.redirect('/main.html');
    } else {
      res.redirect('/join.html');
    }

  } catch (err) {
    console.error('OAuth error:', err.message);
    res.status(500).json({ error: 'OAuth failed' });
  }
});

// Leaderboard API
app.get('/api/leaderboard', (req, res) => {
  res.json({ pvp: [], pve: [] });
});

app.post('/api/leaderboard', (req, res) => {
  const userId = req.headers['x-discord-id'];
  if (userId !== OWNER_ID) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  res.json({ success: true });
});

module.exports = app;
