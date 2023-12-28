const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const { decrypt } = require('../utils/encryptUtil');

const client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET
);

async function refreshToken(req, res, next) {
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

module.exports = refreshToken;
