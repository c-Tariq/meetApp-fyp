const express = require('express');
const passport = require("passport");
const session = require("express-session");  


const userRoutes = require('./routes/userRoutes');
const spaceRoutes = require('./routes/spaceRoutes');
const spaceMemberRoutes = require('./routes/spaceMembersRoutes'); 
const pool = require('./config/dbConnection'); 


require('dotenv').config();
require('./config/passportConfig');

const app = express();

// Middleware to parse JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use(
  session({
    secret: process.env.SESSION_SECRET, 
    resave: false,
    saveUninitialized: true,
  })
);
app.use(passport.initialize());
app.use(passport.session());


// Use routes
app.use('/users', userRoutes);
app.use('/spaces', spaceRoutes);
app.use('/space-members', spaceMemberRoutes); 
app.use("/", userRoutes);  



// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});