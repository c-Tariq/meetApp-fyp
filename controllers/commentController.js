const { addComment, getCommentsByTopicId } = require('../models/comment');

exports.addComment = async (req, res) => {
  try {
    const { topicId } = req.params;
    const { user_id, content } = req.body;

    if (!content) {
        return res.status(400).json({ message: 'Comment content is required' });
      }
    const newComment = await addComment(topicId, user_id, content);
    res.status(201).json(newComment);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.getCommentsByTopic = async (req, res) => {
  try {
    const { topicId } = req.params;
    const comments = await getCommentsByTopicId(topicId);
    res.json(comments);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};