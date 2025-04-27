const {
  addUserToSpace,
  isUserMemberOfSpace,
  getAllMembersOfSpace,
} = require("../models/spaceMembers");
const { isSpaceAdmin } = require("../models/space");
const { getUserByEmail } = require("../models/user");
const Invitation = require("../models/invitations");

// Controller to add a user to a space *******************************************!
exports.addUserToSpace = async (req, res) => {
  try {
    const { space_id, user_id } = req.body;

    const isAdmin = await isSpaceAdmin(space_id, req.user.user_id);
    if (!isAdmin) {
      return res.status(403).json({
        message: "You are not authorized to add members to this space",
      });
    }
    // Check if the user is already a member of the space
    const isMember = await isUserMemberOfSpace(space_id, user_id);
    if (isMember) {
      return res
        .status(400)
        .json({ message: "User is already a member of this space" });
    }

    // Add the user to the space
    const newMember = await addUserToSpace(space_id, user_id);
    res
      .status(201)
      .json({ message: "User added to space successfully", newMember });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// Controller to get all members of a space
exports.getAllMembersOfSpace = async (req, res) => {
  try {
    const { spaceId } = req.params;

    // Get all members of the space
    const members = await getAllMembersOfSpace(spaceId);
    if (members.length === 0) {
      return res
        .status(404)
        .json({ message: "No members found for this space" });
    }

    res.json(members);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

exports.inviteToSpace = async (req, res) => {
  try {
    const { spaceId } = req.params;
    const { email } = req.body;
    const inviter_id = req.user.user_id;

    // Check admin status
    const isAdmin = await isSpaceAdmin(spaceId, inviter_id);
    if (!isAdmin) {
      return res
        .status(403)
        .json({ message: "Only space admins can invite users" });
    }
    // Generate unique token
    const token = Invitation.generateToken();

    // Create invitation
    await Invitation.createInvitation(spaceId, inviter_id, email, token);

    // Send email
    console.log(`Sending invitation email to ${email} with token: ${token}`);

    res.status(200).json({ message: "Invitation sent successfully" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

exports.acceptInvitation = async (req, res) => {
  try {
    const { token } = req.params;
    const user_id = req.user.user_id;

    // Validate token
    const invitation = await Invitation.getInvitationByToken(token);
    if (!invitation) {
      return res.status(400).json({ message: "Invalid or expired invitation" });
    }

    // Check if user exists
    let user = await getUserByEmail(invitation.email);
    if (!user) {
      // Create new user if needed (optional)
      return res.status(404).json({ message: "User not found" });
    }

    // Add to space
    await addUserToSpace(invitation.space_id, user.user_id);

    // Mark invitation as used
    await Invitation.markInvitationUsed(token);

    res.json({ message: "Successfully joined space" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};
