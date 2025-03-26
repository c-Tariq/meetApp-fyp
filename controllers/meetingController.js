const { createMeeting, getMeetingsBySpaceId, getMeetingById, searchMeetingsByName } = require('../models/meeting');
const { isSpaceAdmin } = require('../models/space');

exports.createMeeting = async (req, res) => {
  try {
    const { spaceId } = req.params;
    const { title, scheduledTime } = req.body;
    const user_id = req.user.user_id; // Use authenticated user's ID

    const isAdmin = await isSpaceAdmin(spaceId, user_id);
    if (!isAdmin) {
      return res.status(403).json({ message: 'You are not authorized to create a meeting' });
    }

    if (!title || !scheduledTime) {
      return res.status(400).json({ message: 'Title and scheduled time are required' });
    }

    const newMeeting = await createMeeting(spaceId, title, scheduledTime);
    res.status(201).json(newMeeting);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.getSpaceMeetings = async (req, res) => {
  try {
    const { spaceId } = req.params;
    const meetings = await getMeetingsBySpaceId(spaceId);
    res.json(meetings);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.getMeeting = async (req, res) => {
  try {
    const { meetingId } = req.params;
    const meeting = await getMeetingById(meetingId);
    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }
    res.json(meeting);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.searchMeetings = async (req, res) => {
  try {
    const { term } = req.query;
    if (!term) {
      return res.status(400).json({ message: 'Search term is required' });
    }
    const results = await searchMeetingsByName(term);
    res.json(results);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};