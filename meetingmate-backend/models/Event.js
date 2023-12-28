const mongoose = require('mongoose');

const attendeeSchema = new mongoose.Schema({
  email: String,
  name: String,
});

const eventSchema = new mongoose.Schema({
  eventId: String,
  summary: String,
  location: String,
  description: String,
  start: Date,
  end: Date,
  hangoutLink: String,
  organizer: String,
  attendees: [attendeeSchema],
  reminder: { type: Boolean, default: false }, // New reminder field
  sentEmail: { type: Boolean, default: false }, // New sentEmail field
});

const Event = mongoose.model('Event', eventSchema);

module.exports = Event;
