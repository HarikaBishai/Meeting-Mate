// scheduler.js
const { google } = require('googleapis');
const nodemailer = require('nodemailer');
const User = require('../models/User');
const { decrypt } = require('./encryptUtil');  // Adjust path as necessary
require('dotenv').config();

const mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

// Function to create a new OAuth2Client instance for a user
const createUserOAuthClient = (refreshToken) => {
    const client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET
    );
    client.setCredentials({ refresh_token: refreshToken });
    return client;
};

// Function to fetch and decrypt refresh tokens for all users
const fetchAndDecryptTokens = async () => {
    try {
        const users = await User.find({});
        users.forEach(user => {
            const decryptedToken = decrypt(user.refreshToken);
            const userOAuth2Client = createUserOAuthClient(decryptedToken); // Create a separate OAuth2Client for each user
            checkAndSendInvites(user.googleId, userOAuth2Client, decryptedToken);
        });
    } catch (error) {
        console.error('Error fetching users:', error);
    }
};

// Function to check for upcoming calendar invites and send emails
const checkAndSendInvites = async (googleId, userOAuth2Client, decryptedToken) => {
    const calendar = google.calendar({ version: 'v3', auth: userOAuth2Client });
    const now = new Date();
    const fifteenMinutesLater = new Date(now.getTime() + 15 * 60000);

    const timeMin = now.toISOString();
    const timeMax = new Date(now.getTime() + 15 * 60000).toISOString();  // 15 minutes from now

    try {
        const res = await calendar.events.list({
            calendarId: 'primary',
            timeMin: timeMin,
            timeMax: timeMax,
            singleEvents: true,
            orderBy: 'startTime',
        });

        const events = res.data.items;
        for (let event of events) {
            if (event.start.dateTime && event.attendees?.length > 0) {
                const meetingStartTime = new Date(event.start.dateTime);

                if (meetingStartTime > now && meetingStartTime - now <= 15 * 60000) {
                    console.log(event.attendees)
                    for (let attendee of event.attendees) {
                        const attendeeEmail = attendee.email;
                        const attendeeName = await getPersonName(attendeeEmail, userOAuth2Client) || attendeeEmail;

                        const emailText = `Hello ${attendeeName},\n\nThis is a reminder for your upcoming meeting titled "${event.summary}" starting at ${meetingStartTime.toLocaleTimeString()}.\n\nMeeting Details:\n- Title: ${event.summary}\n- When: ${meetingStartTime.toLocaleString()}\n- Where: ${event.location || 'N/A'}`;
                        sendMail(attendeeEmail, 'Meeting Reminder', emailText, userOAuth2Client, decryptedToken);
                    }

                }
            }
        }
        // events.forEach(event => {

        // });
    } catch (error) {
        console.error('Error fetching events:', error);
    }
};

const getPersonName = async (email, userOAuth2Client) => {
    const service = google.people({ version: 'v1', auth: userOAuth2Client });
    try {
        const response = await service.people.searchContacts({
            query: email,
            readMask: 'names',
        });
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

// Email sending function using Nodemailer
const sendMail = async (to, subject, text, userOAuth2Client, refreshToken) => {
    const accessToken = await userOAuth2Client.getAccessToken();

    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USERNAME,
            pass: 'ehko bwez lonr gkkf'
        }
    });



    const mailOptions = {
        from: `Meeting Mate`,
        to: to,
        subject: subject,
        text: text,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Email sent successfully', to);
    } catch (error) {
        console.error('Error sending email:', error);
    }
};

module.exports = { fetchAndDecryptTokens };