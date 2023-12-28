require('dotenv').config();
const express = require('express');
const session = require('express-session');
const cors = require('cors');
const cron = require('node-cron');
const { sendEmails } = require('./utils/remainderCron');
const MongoStore = require('connect-mongo');


cron.schedule('*/1 * * * *', function() {
  console.log('Checking for upcoming meetings...');
  sendEmails();
});

const authRoutes = require('./routes/auth');
const calendarRoutes = require('./routes/calender');
const eventRoutes = require('./routes/events');

const app = express();
const port = 3001;

app.use(express.json());
const allowedOrigins = ['http://localhost:3000'];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // This allows the server to accept cookies from the client
};

app.use(cors(corsOptions));



app.use(session({
    secret: 'jD8sd93@#!(lKmnD92_lskMD:83kDs*l2#4mDk2',
    resave: false,
    saveUninitialized: true,
    store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
}));

// Initialize routes
app.use('/auth', authRoutes);
app.use('/calendar', calendarRoutes);
app.use('/api/events', eventRoutes);

app.listen(port, () => {
    console.log(`MeetingMate backend listening at http://localhost:${port}`);
});
