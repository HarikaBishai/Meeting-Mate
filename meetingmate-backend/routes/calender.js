const express = require('express');
const router = express.Router();
const { google } = require('googleapis');
// const refreshToken = require('../middleware/refreshToken'); // Ensure this path is correct
const isAuthenticated = require('../middleware/authMiddleware'); // Ensure this path is correct
const Event = require('../models/Event');
const { client, refreshToken } = require('./auth');
// Initialize the Google OAuth2 client

// Middleware to ensure the user is authenticated and token is refreshed
// router.use(isAuthenticated);

 async function getPersonName(email, userOAuth2Client) {
  const service = google.people({ version: 'v1', auth: userOAuth2Client });
  try {
      const response = await service.people.searchContacts({
          query: email,
          readMask: 'names',
      });
      console.log(response.data);
      if (response.data.results.length > 0) {
          const person = response.data.results[0].person;
          if (person.names && person.names.length > 0) {
              return person.names[0].displayName;
          }
      }
  } catch (error) {
      console.error(`Error fetching person's name for email ${email}: ${error}`);
  }
  return email; // Fallback to the email if the name is not found
};


async function getUniqueAttendeeNames(events, oAuth2Client) {
  // Create a Set to store unique attendee emails
  const attendeeEmails = new Set();

  // Iterate over the events and add attendee emails to the Set
  events.forEach(event => {
    if (event.attendees) {
      event.attendees.forEach(attendee => {
        // Only consider attendees that are not resources and have an email
        if (!attendee.resource && attendee.email) {
          attendeeEmails.add(attendee.email);
        }
      });
    }
  });

  // Initialize the People API client
  const peopleService = google.people({ version: 'v1', auth: oAuth2Client });

  // Map over the Set of emails and retrieve names for each one
  const detailsPromises = Array.from(attendeeEmails).map(async (email) => {
    try {
      // Attempt to get the person's details from the user's contacts
      const res = await peopleService.people.connections.list({
        resourceName: 'people/me',
        personFields: 'names,emailAddresses',
        pageSize: 1000,
      });

      // Find the person with the matching email
      const person = res.data.connections.find(connection =>
        connection.emailAddresses && connection.emailAddresses.some(emailObj => emailObj.value === email));

      return {
        email: email,
        name: person && person.names ? person.names[0].displayName : 'Name not found in contacts',
      };
    } catch (error) {
      console.error('Error retrieving attendee details:', error);
      return { email: email, name: 'Error retrieving details' };
    }
  });

  // Use Promise.all to wait for all the People API requests to finish
  const attendeesDetails = await Promise.all(detailsPromises);

  // Convert array of attendee details into an object with emails as keys
  const attendeesObject = attendeesDetails.reduce((obj, attendee) => {
    obj[attendee.email] = { name: attendee.name };
    return obj;
  }, {});

  return attendeesObject;
}

// Get the upcoming 10 events from the user's calendar
router.get('/upcoming-events', refreshToken, async (req, res) => {

  try {
    // const oAuth2Client = new google.auth.OAuth2(
    //   process.env.GOOGLE_CLIENT_ID,
    //   process.env.GOOGLE_CLIENT_SECRET,
    //   'http://localhost:3001/auth/google/callback' // Make sure this matches your Google OAuth 2.0 redirect URI
    // );
    
    console.log(req.session, '----------');
    // Set the OAuth2 client credentials
    // oAuth2Client.setCredentials({
    //   access_token: req.session.tokens.access_token,
    //   refresh_token: req.session.tokens.refresh_token
    // });

    // Create a new instance of the calendar API
    const calendar = google.calendar({ version: 'v3', auth: client });

    // Fetch the upcoming 10 events
    const { data } = await calendar.events.list({
      calendarId: 'primary', // Use the primary calendar of the authenticated user
      timeMin: (new Date()).toISOString(), // Events after now
      maxResults: 10, // Return a maximum of 10 events
      singleEvents: true, // Treat recurring events as individual events
      orderBy: 'startTime' // Order by the start date
    });

    const events = data.items;
    if (!events || events.length === 0) {
      return res.status(404).send('No upcoming events found.');
    }

    // Get the attendees names for each event
    const attendees = await getUniqueAttendeeNames(events, client);

    // Respond with the list of upcoming events
    res.json({ events: events, attendees: attendees });
  } catch (error) {
    
  }
});

router.get('/:eventId/:reminder',refreshToken, async (req, res) => {
  try {

    const { eventId, reminder } = req.params;

    const calendar = google.calendar({ version: 'v3', auth: client });
  
  
    try {
      const existingEvent = await Event.findOne({ eventId: eventId });
  
      if (existingEvent) {
        // If the event exists, update only the reminder flag
        const updatedEvent = await Event.findOneAndUpdate(
          { eventId: eventId },
          { $set: { reminder } },
          { new: true }
        );
        return res.json(updatedEvent);
      }
        const eventResponse = await calendar.events.get({
            calendarId: 'primary',
            eventId: eventId,
        });
  
        const event = eventResponse.data;
  
        const attendeesDetails = await Promise.all((event.attendees || []).map(async (attendee) => {
            try {
                // const personResponse = await peopleService.people.get({
                //     resourceName: 'people/' + attendee.email,
                //     personFields: 'names,emailAddresses',
                // });
  
                // const person = personResponse.data;
                return {
                    email: attendee.email,
                    name: await getPersonName(attendee.email, client) || attendeeEmail
                };
            } catch (error) {
                console.error('Error fetching person:', error);
                return {
                    email: attendee.email,
                    name: 'Unknown',
                };
            }
        }));
  
        const eventDetails = new Event({
            eventId: event.id,
            summary: event.summary,
            location: event.location,
            description: event.description,
            start: new Date(event.start.dateTime || event.start.date),
            end: new Date(event.end.dateTime || event.end.date),
            hangoutLink: event.hangoutLink,
            organizer: event.organizer?.email,
            attendees: attendeesDetails,
            reminder: reminder,
            sentEmail: false
        });
  
        const updatedEvent = await Event.findOneAndUpdate(
            { eventId: eventId },
            eventDetails,
            { new: true, upsert: true }
        );
        res.json(updatedEvent);
    } catch (error) {
        console.error('The API returned an error: ' + error);
        res.status(500).send(error);
    }

  } catch (error) {
    console.error('The API returned an error: ' + error);
    res.status(500).send('Error retrieving events');
  }
 
});

module.exports = router;
