const { addTopic, getTopicsByMeetingId, isTopicInMeeting, getTopicById, updateTopic, deleteTopic } = require('../models/topic');
const { isSpaceAdmin } = require('../models/space');
const { getMeetingById } = require('../models/meeting');

exports.addTopic = async (req, res) => {
  // Validation handled by express-validator in routes
  try {
    const { meetingId } = req.params;
    // spaceId is guaranteed to be available from checkSpaceMembership middleware
    // either from req.params.spaceId or derived and attached as req.spaceId
    const spaceId = req.params.spaceId || req.spaceId; 
    const { topic_title } = req.body;
    const user_id = req.user.user_id; 

    // Keep admin check as per requirements
    const isAdmin = await isSpaceAdmin(spaceId, user_id); 
    if (!isAdmin) {
      return res.status(403).json({ message: 'Only space administrators can add topics.' });
    }

    // Basic check removed, handled by validator
    // if (!topic_title) {
    //   return res.status(400).json({ message: 'Topic title is required' });
    // }

    const newTopic = await addTopic(meetingId, topic_title);
    res.status(201).json(newTopic);
  } catch (err) {
    console.error('Error in addTopic controller:', err);
    res.status(500).json({ message: 'Server Error adding topic'}); // Use JSON
  }
};

exports.getMeetingTopics = async (req, res) => {
  // Validation handled by express-validator in routes
  // Authorization handled by checkSpaceMembership middleware
  try {
    const { meetingId } = req.params;
    const topics = await getTopicsByMeetingId(meetingId);
    // checkSpaceMembership already confirmed user is member of the space containing this meeting
    res.json(topics);
  } catch (err) {
    console.error('Error in getMeetingTopics controller:', err);
    res.status(500).json({ message: 'Server Error fetching meeting topics'}); // Use JSON
  }
};

exports.getTopic = async (req, res) => {
  // Validation handled by express-validator in routes
  // Authorization handled by checkSpaceMembership middleware
  try {
    const { topicId } = req.params;
    const topic = await getTopicById(topicId);

    if (!topic) {
      // This check remains necessary as the ID could be valid format but not exist
      return res.status(404).json({ message: 'Topic not found' });
    }
    // checkSpaceMembership already confirmed user is member of the space containing this topic
    res.json(topic);
  } catch (err) {
    console.error('Error in getTopic controller:', err);
    res.status(500).json({ message: 'Server Error fetching topic'}); // Use JSON
  }
};

exports.updateTopic = async (req, res) => {
  // Validation handled by express-validator in routes
  try {
    const { topicId } = req.params;
    const { topic_title } = req.body;
    const userId = req.user.user_id;

    // Authorization: Check if user is admin of the space containing the topic
    const topic = await getTopicById(topicId);
    if (!topic) {
      return res.status(404).json({ message: 'Topic not found' });
    }
    const meeting = await getMeetingById(topic.meeting_id);
    if (!meeting) {
       // Should not happen if topic exists, but good check
       return res.status(404).json({ message: 'Associated meeting not found' }); 
    }
    const isAdmin = await isSpaceAdmin(meeting.space_id, userId); 
    if (!isAdmin) {
      return res.status(403).json({ message: 'Only space administrators can update topics.' });
    }

    // Basic check removed, handled by validator
    const updatedTopic = await updateTopic(topicId, topic_title);
    res.json(updatedTopic);

  } catch (err) {
    console.error('Error updating topic:', err);
    if (err.message.includes('not found')) {
        return res.status(404).json({ message: err.message });
    }
    res.status(500).json({ message: 'Server Error updating topic'});
  }
};

exports.deleteTopic = async (req, res) => {
  // Validation handled by express-validator in routes
  try {
    const { topicId } = req.params;
    const userId = req.user.user_id;

    // Authorization: Check if user is admin of the space containing the topic
    const topic = await getTopicById(topicId);
    if (!topic) {
      return res.status(404).json({ message: 'Topic not found' });
    }
    const meeting = await getMeetingById(topic.meeting_id);
     if (!meeting) {
       return res.status(404).json({ message: 'Associated meeting not found' }); 
    }
    const isAdmin = await isSpaceAdmin(meeting.space_id, userId); 
    if (!isAdmin) {
      return res.status(403).json({ message: 'Only space administrators can delete topics.' });
    }

    await deleteTopic(topicId);
    res.json({ message: 'Topic deleted successfully' });

  } catch (err) {
    console.error('Error deleting topic:', err);
     if (err.message.includes('not found')) {
        return res.status(404).json({ message: err.message });
    }
    res.status(500).json({ message: 'Server Error deleting topic'});
  }
};

// Middleware to verify topic belongs to meeting (Keep commented out or remove if unused)
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