const attendanceModel = require('../models/attendance');

// Mark attendance for a user in a meeting
exports.markAttendance = async (req, res) => {
  try {
    const { meetingId } = req.params;
    const { isPresent } = req.body;
    const userId = req.user.user_id; // Use authenticated user's ID

    // Validate request body
    if (isPresent === undefined) {
      return res.status(400).json({ message: 'isPresent is required' });
    }

    // Call the model function to mark attendance (assuming user marks their own)
    const attendance = await attendanceModel.markAttendance(meetingId, userId, isPresent);
    res.status(200).json(attendance);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// Get attendance records for a specific meeting
exports.getAttendanceByMeetingId = async (req, res) => {
  try {
    const { meetingId } = req.params;

    const attendanceRecords = await attendanceModel.getAttendanceByMeetingId(meetingId);
    res.status(200).json(attendanceRecords);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};