// reminderCron.js
require('dotenv').config();
const mongoose = require('mongoose');
const Event = require('../models/Event');
const nodemailer = require('nodemailer');


const sendEmails = async () => {
    // Set up nodemailer transporter
    const transporter = nodemailer.createTransport({
        service: 'gmail', // or your email service
        auth: {
            user: process.env.EMAIL_USERNAME,
            pass: 'ehko bwez lonr gkkf'
        },
    });

    console.log('Running a task every minute');

    const now = new Date();
    const upcomingEvents = await Event.find({
        reminder: true,
        sentEmail: false,  // Look for events that haven't had an email sent yet
        start: { $lt: new Date(now.getTime() + 10 * 60000) } // Assuming we're reminding 10 minutes before
    });

    upcomingEvents.forEach(event => {
        const formattedStartTime = new Date(event.start).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        const formattedEndTime = new Date(event.end).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        const formattedDate = new Date(event.start).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' });

        event.attendees.forEach(async attendee => {
            const mailOptions = {
                from: process.env.EMAIL_USERNAME,
                to: attendee.email,
                subject: `Reminder for your upcoming event: ${event.summary}`,
                text: `
                Dear ${attendee.name},
                
                This is a friendly reminder about your upcoming meeting, "${event.summary}."
                
                Meeting Details:
                - Date: ${formattedDate}
                - Time: ${formattedStartTime} to ${formattedEndTime}
                - Location: ${event.location || 'N/A'}
                - Meeting Link: ${event.hangoutLink}

                
                We're looking forward to your valuable contributions and insights during this meeting. Your participation plays a crucial role in the success of our discussions and decision-making process.
                
                Here are a few things to keep in mind:
                - Please be prepared to discuss any specific topics or agenda items.
                - Feel free to bring any supporting materials or questions you may have.
                - If you have any topics or points you'd like to add to the agenda, please let us know in advance.
                
                We appreciate your dedication and are excited to collaborate with you during this meeting. If you have any questions or if there's anything you need prior to the meeting, don't hesitate to reach out.
                
                Thank you, and see you soon!
                
                Best regards,
                Meeting Mate,
                Organizer: ${event.organizer}
              
                `
            };

            try {
                await transporter.sendMail(mailOptions);
                await Event.findOneAndUpdate({ eventId: event.eventId }, { sentEmail: true });
                console.log(`Email sent to ${attendee.email}`);
            } catch (error) {
                console.error('Error sending email:', error);
            }
        });
    });
}



module.exports = { sendEmails };