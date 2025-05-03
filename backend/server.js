const express = require('express');
const passport = require('passport');
const session = require('express-session');
const userRoutes = require('./routes/userRoutes');
const spaceRoutes = require('./routes/spaceRoutes');
const pool = require('./config/dbConnection');
// const camelCaseResponse = require('./middleware/caseConverter'); // Removed - File missing and not used
const cors = require('cors');

require('dotenv').config();
require('./config/passportConfig');

const app = express();

// Enable CORS for all origins (adjust in production!)
// Needs to be before routes
app.use(cors({ 
    origin: 'http://localhost:5173', // Allow frontend origin
    credentials: true // Allow cookies/sessions
})); 

// Middleware to parse JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session middleware
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Mount routes under /api prefix
app.use('/api', userRoutes);         // Now handles /api/login, /api/register etc.
app.use('/api/spaces', spaceRoutes); // Now handles /api/spaces, /api/spaces/:spaceId/members etc.


// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});