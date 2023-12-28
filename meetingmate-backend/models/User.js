const mongoose = require('../utils/db');
const Schema = mongoose.Schema;

const userSchema = new Schema({
  googleId: String, // Unique Google ID
  refreshToken: String, // Encrypted refresh token
});

module.exports = mongoose.model('User', userSchema);
