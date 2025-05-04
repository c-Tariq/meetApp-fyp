const attendanceModel = require("../models/attendance");
const { getMeetingById } = require("../models/meeting"); // Import function to get meeting details
const { isUserMemberOfSpace } = require("../models/spaceMembers"); // Import function to check membership
const { isSpaceAdmin } = require("../models/space"); // Import isSpaceAdmin
// const { getAttendanceByMeetingId } = require("../models/attendance");

// Mark attendance for a user in a meeting
exports.markAttendance = async (req, res) => {
  try {
    const { meetingId } = req.params;
    // isPresent and optionally targetUserId from body
    const { isPresent, targetUserId } = req.body; 
    const loggedInUserId = req.user.user_id; 

    // --- Authorization & Target User Determination ---
    const meeting = await getMeetingById(meetingId);
    if (!meeting) {
      return res.status(404).json({ message: "Meeting not found" });
    }
    const spaceId = meeting.space_id;

    let userIdToMark = loggedInUserId; // Default to self-marking

    // Check if trying to mark someone else
    if (targetUserId && targetUserId !== loggedInUserId) {
        // If marking someone else, requester MUST be admin
        const isAdmin = await isSpaceAdmin(spaceId, loggedInUserId);
        if (!isAdmin) {
             return res.status(403).json({ message: "Forbidden: Only space admins can mark attendance for other users." });
        }
        // Check if target user is actually a member of the space (optional but good)
        const isTargetMember = await isUserMemberOfSpace(spaceId, targetUserId);
        if (!isTargetMember) {
            return res.status(404).json({ message: "Target user is not a member of this space." });
        }
        userIdToMark = targetUserId; // Set the ID to the target user
    } else {
        // If marking self (targetUserId not provided or matches loggedInUserId), 
        // ensure the logged-in user is a member (basic check)
        const isMember = await isUserMemberOfSpace(spaceId, loggedInUserId);
        if (!isMember) {
             return res.status(403).json({ message: "You must be a member of the space to mark your own attendance." });
        }
    }
    // --- End Authorization & Target User Determination ---

    // Validate request body
    if (isPresent === undefined || typeof isPresent !== 'boolean') {
      return res.status(400).json({ message: "isPresent (boolean) is required" });
    }

    // Call the model function with the determined user ID
    const attendance = await attendanceModel.markAttendance(
      meetingId,
      userIdToMark, // Use the determined user ID
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
// This function might be redundant now if getMeetingAttendance covers it.
// exports.getAttendanceByMeetingId = async (req, res) => { ... };

exports.getMeetingAttendance = async (req, res) => {
  // Assumes meetingId is validated and user authorization (space membership) 
  // is checked by middleware before this controller is reached.
  try {
    const { meetingId, spaceId } = req.params; // Ensure spaceId is available from route params

    // Check if spaceId was actually provided by the route (it should be)
    if (!spaceId) {
        console.error('spaceId is missing in getMeetingAttendance route params');
        return res.status(500).json({ message: "Internal server configuration error." });
    }

    // Call the new combined model function
    const attendanceList = await attendanceModel.getAttendanceByMeetingId(meetingId, spaceId);
    res.json(attendanceList);
    
  } catch (err) {
    console.error("Error fetching combined attendance:", err.message);
    res.status(500).json({ message: "Server Error fetching attendance data" }); // Use JSON
  }
};

// Placeholder for future controller functions (e.g., markAttendance)
