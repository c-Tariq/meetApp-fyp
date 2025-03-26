const { addTopic, getTopicsByMeetingId, isTopicInMeeting, getTopicById } = require('../models/topic');
const { isSpaceAdmin } = require('../models/space');

exports.addTopic = async (req, res) => {
  try {
    const { meetingId } = req.params;
    const { spaceId } = req.params;
    const { topic_title } = req.body;
    const user_id = req.user.user_id; 

    const isAdmin = await isSpaceAdmin(spaceId, user_id); 
    if (!isAdmin) {
      return res.status(403).json({ message: 'You are not authorized to add topics' });
    }

    if (!topic_title) {
      return res.status(400).json({ message: 'Topic title is required' });
    }

    const newTopic = await addTopic(meetingId, topic_title);
    res.status(201).json(newTopic);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.getMeetingTopics = async (req, res) => {
  try {
    const { meetingId } = req.params;
    const topics = await getTopicsByMeetingId(meetingId);
    res.json(topics);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.getTopic = async (req, res) => {
  try {
    const { topicId } = req.params;
    const topic = await getTopicById(topicId);

    if (!topic) {
      return res.status(404).json({ message: 'Topic not found' });
    }
    res.json(topic);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// Middleware to verify topic belongs to meeting
// exports.verifyTopicInMeeting = async (req, res, next) => {
//   try {
//     const { topicId, meetingId } = req.params;
//     const isValid = await isTopicInMeeting(topicId, meetingId);

//     if (!isValid) {
//       return res.status(403).json({ message: 'Topic does not belong to this meeting' });
//     }

//     next();
//   } catch (err) {
//     console.error(err.message);
//     res.status(500).send('Server Error');
//   }
// };