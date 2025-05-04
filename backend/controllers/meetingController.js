const {
  createMeeting,
  getMeetingsBySpaceId,
  getMeetingById,
  searchMeetingsByName,
  updateMeetingStatus,
  updateMeetingSummaryAndTasks,
  updateMeetingDetails,
  deleteMeetingById,
} = require("../models/meeting");
const { isSpaceAdmin } = require("../models/space");
// const openai = require("../config/openaiConfig");
// const { openai } = require("../config/aiConfig"); // Import from central config --> No longer needed

exports.createMeeting = async (req, res) => {
  try {
    const { spaceId } = req.params;
    const { title, scheduled_time } = req.body;
    const user_id = req.user.user_id; // Use authenticated user's ID

    const isAdmin = await isSpaceAdmin(spaceId, user_id);
    if (!isAdmin) {
      return res
        .status(403)
        .json({ message: "You are not authorized to create a meeting" });
    }

    if (!title || !scheduled_time) {
      return res
        .status(400)
        .json({ message: "Title and scheduled time are required" });
    }

    const newMeeting = await createMeeting(spaceId, title, scheduled_time);
    res.status(201).json(newMeeting);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

exports.getSpaceMeetings = async (req, res) => {
  try {
    const { spaceId } = req.params;
    const meetings = await getMeetingsBySpaceId(spaceId);
    res.json(meetings);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

exports.getMeeting = async (req, res) => {
  try {
    const { meetingId } = req.params;
    const meeting = await getMeetingById(meetingId);
    if (!meeting) {
      return res.status(404).json({ message: "Meeting not found" });
    }
    res.json(meeting);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

exports.searchMeetings = async (req, res) => {
  try {
    const { term } = req.query;
    if (!term) {
      return res.status(400).json({ message: "Search term is required" });
    }
    const results = await searchMeetingsByName(term);
    res.json(results);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

exports.updateMeetingStatus = async (req, res) => {
  try {
    const { meetingId } = req.params;
    const { spaceId } = req.params;
    const { status } = req.body; // Expecting { "status": "In Progress" | "Concluded" | "Upcoming" }
    const user_id = req.user.user_id;

    // 1. Validate input status
    const allowedStatuses = ["Upcoming", "In Progress", "Concluded"];
    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({
        message:
          "Invalid or missing status. Must be one of: Upcoming, In Progress, Concluded.",
      });
    }

    const isAdmin = await isSpaceAdmin(spaceId, user_id);
    if (!isAdmin) {
      return res.status(403).json({
        message: "You are not authorized to update this meeting's status",
      });
    }

    const updatedMeeting = await updateMeetingStatus(meetingId, status);
    if (!updatedMeeting) {
      return res
        .status(404)
        .json({ message: "Meeting not found during update attempt." });
    }
    res.status(200).json(updatedMeeting);
  } catch (err) {
    console.error("Error updating meeting status:", err.message);
    if (err.message.includes("Invalid status value")) {
      return res.status(400).json({ message: err.message });
    }
    res.status(500).send("Server Error");
  }
};

// Controller function for PATCH /:meetingId to update details
exports.updateMeetingDetails = async (req, res) => {
  // Validation and Authorization handled by middleware in routes
  try {
    const { meetingId } = req.params;
    // Extract only the allowed fields from the request body
    const { title, scheduled_time } = req.body; 
    const updates = { title, scheduled_time }; // Map to DB columns if needed here or in model

    // Check if the user has permission (e.g., is admin or meeting creator)
    // Assuming checkSpaceMembership is sufficient for now, but could add stricter checks
    // const meeting = await getMeetingById(meetingId); // Fetch meeting if needed for creator check
    // if (meeting.creator_id !== req.user.user_id && !await isSpaceAdmin(req.params.spaceId, req.user.user_id)) {
    //   return res.status(403).json({ message: 'Forbidden: Not meeting creator or space admin' });
    // }

    const updatedMeeting = await updateMeetingDetails(meetingId, updates);

    if (!updatedMeeting) {
      // This case is handled by the model throwing an error, but added for clarity
      return res.status(404).json({ message: 'Meeting not found or update failed.' });
    }

    // TODO: Consider transforming keys to camelCase before sending
    res.status(200).json(updatedMeeting);

  } catch (error) {
    console.error("Error updating meeting details:", error);
    if (error.message === 'Meeting not found or update failed') {
        return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: "Server error updating meeting details" });
  }
};

exports.deleteMeeting = async (req, res) => {
  try {
    const { meetingId, spaceId } = req.params; // Get both IDs from params
    const userId = req.user.user_id; // Authenticated user

    // Authorization: Check if the user is the admin of the space containing the meeting
    const isAdmin = await isSpaceAdmin(spaceId, userId);
    if (!isAdmin) {
      return res.status(403).json({
        message: "Unauthorized: Only space administrators can delete meetings.",
      });
    }

    // Delete the meeting using the model function
    const deletedMeeting = await deleteMeetingById(meetingId);

    if (!deletedMeeting) {
      // This implies the meeting didn't exist in the first place
      return res.status(404).json({ message: "Meeting not found." });
    }

    // Respond with success (204 No Content is standard for DELETE)
    res.status(204).send();

  } catch (err) {
    console.error(`Error deleting meeting ${req.params.meetingId}:`, err.message);
    res.status(500).json({ message: "Server Error deleting meeting." });
  }
};
