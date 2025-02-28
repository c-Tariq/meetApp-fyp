const express = require('express');
const { addUserToSpace, getAllMembersOfSpace } = require('../controllers/spaceMembersController');
const router = express.Router();

// Route to add a user to a space
router.post('/', addUserToSpace);

// Route to get all members of a space
router.get('/:space_id', getAllMembersOfSpace);

module.exports = router;