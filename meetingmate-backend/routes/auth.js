const express = require('express');
const router = express.Router();
const { OAuth2Client } = require('google-auth-library');

const User = require('../models/User');
const { encrypt, decrypt } = require('../utils/encryptUtil');

const client = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'http://localhost:3001/auth/google/callback'
);

// Redirect to Google's OAuth 2.0 server
router.get('/google', (req, res) => {
    const url = client.generateAuthUrl({
        access_type: 'offline', // Needed to receive a refresh token
        scope: ['https://www.googleapis.com/auth/calendar', 'email', 'https://www.googleapis.com/auth/contacts.readonly'] // Adjust the scope as needed
    });
    res.redirect(url);
});

// Handle the callback after Google has authenticated the user
router.get('/google/callback', async (req, res) => {
    try {
        const { tokens } = await client.getToken(req.query.code);
        req.session.tokens = tokens;
        console.log('tokens', tokens);
        if (tokens.refresh_token) {
            // Encrypt and store the refresh token in your DB
            const encryptedToken = encrypt(tokens.refresh_token);
            console.log('encryptedToken', encryptedToken);
            const user = await User.findOneAndUpdate(
                { googleId: tokens.id_token },
                { refreshToken: encryptedToken },
                { new: true, upsert: true }
            );
            console.log("Refresh token stored for user:", user.refreshToken);
        }
        res.redirect('http://localhost:3000/dashboard');
    } catch (error) {
        console.error('Error during authentication:', error);
        res.status(500).send('Authentication failed');
    }
});

router.get('/isAuthenticated', (req, res) => {
    if (req.session && req.session.tokens) {
        res.status(200).json({ isAuthenticated: true });
    } else {
        res.status(200).json({ isAuthenticated: false });
    }
});


async function refreshToken(req, res, next) {
    console.log(req.session);
    if (!req.session.tokens) return res.status(401).send('Not authenticated');
  
    try {
      const user = await User.findOne({ googleId: req.session.tokens.id_token });
      if (!user || !user.refreshToken) throw new Error('No refresh token stored');
  
      client.setCredentials({
        refresh_token: decrypt(user.refreshToken),
      });
  
      const { token } = await client.getAccessToken();
      req.session.tokens.access_token = token;
      next();
    } catch (error) {
      console.error('Error refreshing access token:', error);
      res.status(401).send('Failed to refresh access token');
    }
  }

module.exports = router;
module.exports.client = client;  // Export the Google OAuth2 client
module.exports.refreshToken = refreshToken;  
