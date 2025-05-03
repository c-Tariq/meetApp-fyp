const { isUserMemberOfSpace } = require('../models/spaceMembers');
const { getMeetingById } = require('../models/meeting');
const { getTopicById } = require('../models/topic');

/**
 * Middleware to check if the authenticated user is a member of the space associated with the request.
 * It determines the spaceId from different route parameters (:spaceId, :meetingId, :topicId).
 * Assumes ensureAuthenticated middleware runs before this.
 */
const checkSpaceMembership = async (req, res, next) => {
    try {
        const userId = req.user.user_id;
        let spaceId = req.params.spaceId;

        // If spaceId is not directly available, try to derive it from meetingId or topicId
        if (!spaceId && req.params.meetingId) {
            const meeting = await getMeetingById(req.params.meetingId);
            if (meeting) {
                spaceId = meeting.space_id;
            }
        } else if (!spaceId && req.params.topicId) {
            const topic = await getTopicById(req.params.topicId);
            if (topic) {
                const meeting = await getMeetingById(topic.meeting_id);
                if (meeting) {
                    spaceId = meeting.space_id;
                }
            }
        }

        if (!spaceId) {
            // This might happen if the meeting/topic ID is invalid or not found
            console.error(`Could not determine space ID for user ${userId} in request:`, req.originalUrl);
            return res.status(404).json({ message: 'Associated resource (space/meeting/topic) not found.' });
        }

        const isMember = await isUserMemberOfSpace(spaceId, userId);

        if (!isMember) {
            // Consider logging the attempt
            console.warn(`Unauthorized access attempt by user ${userId} to space ${spaceId} via ${req.originalUrl}`);
            return res.status(403).json({ message: 'You are not a member of this space.' });
        }

        // Attach spaceId to request for potential downstream use if derived
        if (!req.params.spaceId) {
            req.spaceId = spaceId; // Use a different property to avoid collision
        }

        next(); // User is a member, proceed to the next middleware or route handler
    } catch (err) {
        console.error('Error in checkSpaceMembership middleware:', err);
        res.status(500).send('Server Error during authorization check');
    }
};

module.exports = {
    checkSpaceMembership
}; 