const {
  addTopic,
  getTopicsByMeetingId,
  isTopicInMeeting,
  getTopicById,
  updateTopic,
  deleteTopic,
} = require("../models/topic");
const { isSpaceAdmin } = require("../models/space");
const { getMeetingById } = require("../models/meeting");

exports.addTopic = async (req, res) => {
  try {
    const { meetingId } = req.params;

    const spaceId = req.params.spaceId || req.spaceId;
    const { topic_title } = req.body;
    const user_id = req.user.user_id;

    const isAdmin = await isSpaceAdmin(spaceId, user_id);
    if (!isAdmin) {
      return res
        .status(403)
        .json({ message: "Only space administrators can add topics." });
    }

    const newTopic = await addTopic(meetingId, topic_title);
    res.status(201).json(newTopic);
  } catch (err) {
    console.error("Error in addTopic controller:", err);
    res.status(500).json({ message: "Server Error adding topic" });
  }
};

exports.getMeetingTopics = async (req, res) => {
  try {
    const { meetingId } = req.params;
    const topics = await getTopicsByMeetingId(meetingId);
    res.json(topics);
  } catch (err) {
    console.error("Error in getMeetingTopics controller:", err);
    res.status(500).json({ message: "Server Error fetching meeting topics" });
  }
};

exports.getTopic = async (req, res) => {
  try {
    const { topicId } = req.params;
    const topic = await getTopicById(topicId);

    if (!topic) {
      return res.status(404).json({ message: "Topic not found" });
    }
    res.json(topic);
  } catch (err) {
    console.error("Error in getTopic controller:", err);
    res.status(500).json({ message: "Server Error fetching topic" });
  }
};

exports.updateTopic = async (req, res) => {
  try {
    const { topicId } = req.params;
    const { topic_title } = req.body;
    const userId = req.user.user_id;

    const topic = await getTopicById(topicId);
    if (!topic) {
      return res.status(404).json({ message: "Topic not found" });
    }
    const meeting = await getMeetingById(topic.meeting_id);
    if (!meeting) {
      return res.status(404).json({ message: "Associated meeting not found" });
    }
    const isAdmin = await isSpaceAdmin(meeting.space_id, userId);
    if (!isAdmin) {
      return res
        .status(403)
        .json({ message: "Only space administrators can update topics." });
    }

    const updatedTopic = await updateTopic(topicId, topic_title);
    res.json(updatedTopic);
  } catch (err) {
    console.error("Error updating topic:", err);
    if (err.message.includes("not found")) {
      return res.status(404).json({ message: err.message });
    }
    res.status(500).json({ message: "Server Error updating topic" });
  }
};

exports.deleteTopic = async (req, res) => {
  try {
    const { topicId } = req.params;
    const userId = req.user.user_id;

    const topic = await getTopicById(topicId);
    if (!topic) {
      return res.status(404).json({ message: "Topic not found" });
    }
    const meeting = await getMeetingById(topic.meeting_id);
    if (!meeting) {
      return res.status(404).json({ message: "Associated meeting not found" });
    }
    const isAdmin = await isSpaceAdmin(meeting.space_id, userId);
    if (!isAdmin) {
      return res
        .status(403)
        .json({ message: "Only space administrators can delete topics." });
    }

    await deleteTopic(topicId);
    res.json({ message: "Topic deleted successfully" });
  } catch (err) {
    console.error("Error deleting topic:", err);
    if (err.message.includes("not found")) {
      return res.status(404).json({ message: err.message });
    }
    res.status(500).json({ message: "Server Error deleting topic" });
  }
};
