const express = require('express');
const { google } = require('googleapis');
const Event = require('../models/Event');
const router = express.Router();
const refreshToken = require('../middleware/refreshToken'); // Ensure this path is correct


// Configure Google OAuth2 client
const oAuth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'http://localhost:3001/auth/google/callback' // Make sure this matches your Google OAuth 2.0 redirect URI
);

// router.use(isAuthenticated);
router.use(refreshToken);

// Fetch event by ID and store in MongoDB


module.exports = router;
