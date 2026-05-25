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
  console.log('Test endpoint called');
  res.json({ 
    message: 'Server is working!',
    CLIENT_ID,
    GUILD_ID,
    REDIRECT_URI,
    timestamp: new Date().toISOString()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Wynn Discord Auth Server',
    endpoints: {
      test: '/test',
      callback: '/callback?code=<discord_code>',
      leaderboard: '/api/leaderboard'
    }
  });
});

// Discord OAuth callback
app.get('/callback', async (req, res) => {
  const code = req.query.code;
  console.log('Callback received with code:', code);
  
  if (!code) {
    return res.status(400).json({ error: 'No code provided' });
  }

  try {
    console.log('Exchanging code for token...');
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
    console.log('Access token obtained');
    
    if (!accessToken) {
      return res.status(500).json({ error: 'Failed to obtain access token' });
    }

    console.log('Fetching user guilds...');
    const guildsRes = await axios.get('https://discord.com/api/users/@me/guilds', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    const guilds = guildsRes.data;
    const isMember = Array.isArray(guilds) && guilds.some(g => g.id === GUILD_ID);

    console.log('User is member:', isMember, 'Guilds count:', guilds.length);

    if (isMember) {
      return res.json({ success: true, message: 'You are a member!', redirect: '/main.html' });
    } else {
      return res.json({ success: false, message: 'You are not a member', redirect: '/join.html' });
    }

  } catch (err) {
    console.error('OAuth error:', err?.response?.data || err.message || err);
    return res.status(500).json({ 
      error: 'Error during OAuth process',
      details: err?.response?.data || err.message 
    });
  }
});

// Leaderboard API (stub)
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

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

module.exports = app;
