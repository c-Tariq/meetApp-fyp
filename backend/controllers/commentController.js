const { addComment, getCommentsByTopicId, getCommentsByMeetingId, createComment, deleteComment } = require('../models/comment');
const { isSpaceAdmin } = require('../models/space');

exports.addComment = async (req, res) => {
  // Validation handled by express-validator in routes
  // Authorization handled by checkSpaceMembership middleware
  try {
    const { topicId } = req.params;
    const { content } = req.body;
    const user_id = req.user.user_id; 

    // Basic check removed, handled by validator
    // if (!content) {
    //   return res.status(400).json({ message: 'Comment content is required' });
    // }
    
    // checkSpaceMembership confirmed user is member, so they can comment
    const newComment = await addComment(topicId, user_id, content);
    res.status(201).json(newComment);
  } catch (err) {
    console.error('Error in addComment controller:', err);
    res.status(500).json({ message: 'Server Error adding comment' }); // Use JSON
  }
};

exports.getCommentsByTopic = async (req, res) => {
  // Validation (topicId format) handled by parent router (topicRoutes)
  // Authorization handled by checkSpaceMembership middleware
  try {
    const { topicId } = req.params;
    // checkSpaceMembership confirmed user is member of the space containing this topic
    const comments = await getCommentsByTopicId(topicId);
    res.json(comments);
  } catch (err) {
    console.error('Error in getCommentsByTopic controller:', err);
    res.status(500).json({ message: 'Server Error fetching comments' }); // Use JSON
  }
};

// Remove getMeetingComments and addMeetingComment as comments are per-topic
/*
exports.getMeetingComments = async (req, res) => {
  // Auth/validation assumed handled by middleware
  try {
    const { meetingId } = req.params;
    const comments = await getCommentsByMeetingId(meetingId);
    res.json(comments);
  } catch (err) {
    console.error("Error fetching meeting comments:", err.message);
    res.status(500).send("Server Error");
  }
};

exports.addMeetingComment = async (req, res) => {
  // Auth/validation assumed handled by middleware
  try {
    const { meetingId } = req.params;
    const { comment_text } = req.body; // Use snake_case from request body
    const userId = req.user.user_id; 

    if (!comment_text || typeof comment_text !== 'string' || comment_text.trim() === '') {
        return res.status(400).json({ message: "Comment text cannot be empty." });
    }

    const newComment = await createComment(meetingId, userId, comment_text.trim());
    res.status(201).json(newComment);

  } catch (err) {
    console.error("Error adding meeting comment:", err.message);
    res.status(500).send("Server Error");
  }
};
*/

/**
 * Deletes a specific comment.
 * Requires space administrator privileges.
 */
exports.deleteComment = async (req, res) => {
  try {
    const { spaceId, commentId } = req.params;
    const loggedInUserId = req.user.user_id;

    // Authorization Check: Is user the space admin?
    const isAdmin = await isSpaceAdmin(spaceId, loggedInUserId);
    if (!isAdmin) {
      return res.status(403).json({ 
        message: "Forbidden: Only the space administrator can delete comments." 
      });
    }

    // Attempt to delete the comment
    const deletedRowCount = await deleteComment(commentId);

    if (deletedRowCount === 0) {
      return res.status(404).json({ message: "Comment not found." });
    }

    res.status(204).send(); // Success, No Content

  } catch (err) {
    console.error('Error in deleteComment controller:', err);
    res.status(500).json({ message: 'Server Error deleting comment' });
  }
};

// Remove unused placeholders
// exports.getTopicComments = async (req, res) => { /* ... */ };
// exports.addTopicComment = async (req, res) => { /* ... */ };