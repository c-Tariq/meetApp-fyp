const { addUserToSpace, isUserMemberOfSpace, getAllMembersOfSpace } = require('../models/spaceMembers');
const {isSpaceAdmin } = require('../models/space');
// Controller to add a user to a space
exports.addUserToSpace = async (req, res) => {
  try {
    const { space_id, user_id } = req.body;

    const isAdmin = await isSpaceAdmin(space_id, req.user.user_id);
    if (!isAdmin) {
      return res.status(403).json({ message: 'You are not authorized to add members to this space' });
    }
    // Check if the user is already a member of the space
    const isMember = await isUserMemberOfSpace(space_id, user_id);
    if (isMember) {
      return res.status(400).json({ message: 'User is already a member of this space' });
    }

    // Add the user to the space
    const newMember = await addUserToSpace(space_id, user_id);
    res.status(201).json({ message: 'User added to space successfully', newMember });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// Controller to get all members of a space
exports.getAllMembersOfSpace = async (req, res) => {
  try {
    const { space_id } = req.params;

    // Get all members of the space
    const members = await getAllMembersOfSpace(space_id);
    if (members.length === 0) {
      return res.status(404).json({ message: 'No members found for this space' });
    }

    res.json(members);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};