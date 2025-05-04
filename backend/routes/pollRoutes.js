const express = require('express');
const pollController = require('../controllers/pollController');
const { ensureAuthenticated } = require('../middleware/auth');
const { checkSpaceMembership } = require('../middleware/checkMembership');
const { param, validationResult } = require('express-validator');

// Validation middleware helper
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

// Important: mergeParams allows accessing :spaceId, :meetingId, :topicId from parent routers
const router = express.Router({ mergeParams: true }); 

// Add routes for GET polls, POST poll, GET options, POST option, POST vote, GET results etc.
// router.get('/', ensureAuthenticated, checkSpaceMembership, pollController.getPolls);
// router.post('/', ensureAuthenticated, checkSpaceMembership, /* pollValidation, */ validate, pollController.createPoll);
// ... other routes ...

// DELETE /:pollId - Delete a specific poll
router.delete('/:pollId', 
    ensureAuthenticated, 
    [param('pollId', 'Valid Poll ID is required').isInt({ min: 1 })], 
    validate, 
    // Admin check is done within the controller
    pollController.deletePoll 
);

// Placeholder for poll option routes (could be nested or separate)
// router.delete('/:pollId/options/:optionId', ... pollController.deletePollOption ...);

module.exports = router; 