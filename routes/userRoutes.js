const express = require('express');
const { createUser, getUserById } = require('../controllers/userController');
const router = express.Router();

// Route to create a new user
router.post('/', createUser);

// Route to get a user by ID
router.get('/:id', getUserById);

module.exports = router;