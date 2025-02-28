const express = require('express');
const userRoutes = require('./routes/userRoutes');
const spaceRoutes = require('./routes/spaceRoutes');
const spaceMemberRoutes = require('./routes/spaceMembersRoutes'); 


require('dotenv').config();

const app = express();

// Middleware to parse JSON
app.use(express.json());

// Use routes
app.use('/users', userRoutes);
app.use('/spaces', spaceRoutes);
app.use('/space-members', spaceMemberRoutes); 


// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});