const express = require('express');
const router = express.Router({ mergeParams: true }); // Access :spaceId from parent
const spaceMembersController = require('../controllers/spaceMembersController');
const { ensureAuthenticated } = require('../middleware/auth');

// Protected routes
router.post('/', ensureAuthenticated, spaceMembersController.addUserToSpace); // POST /spaces/:spaceId/members
router.get('/', ensureAuthenticated, spaceMembersController.getAllMembersOfSpace); // GET /spaces/:spaceId/members

module.exports = router;