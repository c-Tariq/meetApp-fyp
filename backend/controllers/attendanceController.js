const attendanceModel = require("../models/attendance");
const { getMeetingById } = require("../models/meeting"); // Import function to get meeting details
const { isUserMemberOfSpace } = require("../models/spaceMembers"); // Import function to check membership
const { getAttendanceByMeetingId } = require("../models/attendance");

// Mark attendance for a user in a meeting
exports.markAttendance = async (req, res) => {
  try {
    const { meetingId } = req.params;
    const { isPresent } = req.body;
    const userId = req.user.user_id; // Use authenticated user's ID

    // --- Authorization Check ---
    // 1. Find the meeting to get its spaceId
    const meeting = await getMeetingById(meetingId);
    if (!meeting) {
      return res.status(404).json({ message: "Meeting not found" });
    }
    const spaceId = meeting.space_id;

    // 2. Check if the user is a member of that space
    const isMember = await isUserMemberOfSpace(spaceId, userId);
    if (!isMember) {
      return res.status(403).json({ message: "You are not authorized to mark attendance for this meeting" });
    }
    // --- End Authorization Check ---

    // Validate request body
    if (isPresent === undefined || typeof isPresent !== 'boolean') { // Added type check
      return res.status(400).json({ message: "isPresent (boolean) is required" });
    }

    // Call the model function to mark attendance (assuming user marks their own)
    const attendance = await attendanceModel.markAttendance(
      meetingId,
      userId,
      isPresent
    );
    res.status(200).json(attendance);
  } catch (err) {
    console.error("Error marking attendance:", err.message);
    // Use JSON for error response
    res.status(500).json({ message: "Server Error marking attendance", error: err.message });
  }
};

// Get attendance records for a specific meeting
exports.getAttendanceByMeetingId = async (req, res) => {
  try {
    const { meetingId } = req.params;
    const attendanceRecords = await attendanceModel.getAttendanceByMeetingId(
      meetingId
    );
    res.status(200).json(attendanceRecords);
  } catch (err) {
    console.error("Error getting attendance:", err.message);
    // Use JSON for error response
    res.status(500).json({ message: "Server Error getting attendance", error: err.message });
  }
};

exports.getMeetingAttendance = async (req, res) => {
  // Assumes meetingId is validated and user authorization (space membership) 
  // is checked by middleware before this controller is reached.
  try {
    const { meetingId } = req.params;
    const attendanceList = await getAttendanceByMeetingId(meetingId);
    res.json(attendanceList);
  } catch (err) {
    console.error("Error fetching attendance:", err.message);
    res.status(500).send("Server Error");
  }
};

// Placeholder for future controller functions (e.g., markAttendance)
