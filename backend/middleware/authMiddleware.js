const { isUserMemberOfSpace } = require("../models/spaceMembers");
const { getMeetingById } = require("../models/meeting");
const { getTopicById } = require("../models/topic");

const ensureAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized: Please log in." });
};

const checkSpaceMembership = async (req, res, next) => {
  try {
    if (!req.user || !req.user.user_id) {
      console.error("checkSpaceMembership error: req.user not found.");
      return res
        .status(401)
        .json({ message: "Unauthorized: User not authenticated." });
    }
    const userId = req.user.user_id;
    let spaceId = req.params.spaceId;

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
      console.error(
        `Could not determine space ID for user ${userId} in request:`,
        req.originalUrl
      );
      return res
        .status(404)
        .json({
          message: "Associated resource (space/meeting/topic) not found.",
        });
    }

    const isMember = await isUserMemberOfSpace(spaceId, userId);

    if (!isMember) {
      console.warn(
        `Unauthorized access attempt by user ${userId} to space ${spaceId} via ${req.originalUrl}`
      );
      return res
        .status(403)
        .json({ message: "Forbidden: You are not a member of this space." });
    }

    if (!req.params.spaceId) {
      req.spaceId = spaceId;
    }

    next();
  } catch (err) {
    console.error("Error in checkSpaceMembership middleware:", err);
    res.status(500).send("Server Error during authorization check");
  }
};

module.exports = {
  ensureAuthenticated,
  checkSpaceMembership,
};
