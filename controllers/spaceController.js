const { createSpace, getAllSpaces, isSpaceAdmin, deleteSpace } = require('../models/space');

// Controller to create a new space
exports.createSpace = async (req, res) => {
  try {
    const { user_id, space_name } = req.body;
    const newSpace = await createSpace(user_id, space_name);
    res.status(201).json(newSpace);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// Controller to get all spaces
exports.getAllSpaces = async (req, res) => {
  try {
    const spaces = await getAllSpaces();
    res.json(spaces);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.deleteSpace = async (req, res) => {
  try {
    const { space_id } = req.params;  // Get space ID from URL
    const { user_id } = req.body;  // Get user ID from request body

    const isAdmin = await isSpaceAdmin(space_id, user_id);
    if(!isAdmin) {
      return res.status(403).json({ message: 'You are not authorized to delete this space' });
    }

    const deletedSpace = await deleteSpace(space_id)
    if (!deletedSpace) {
      return res.status(404).json({ message: 'Space not found' });
    }
    res.status(200).json({ message: 'Space deleted successfully', deletedSpace });
    
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};