const {
  addUserToSpace,
  isUserMemberOfSpace,
  getAllMembersOfSpace,
} = require("../models/spaceMembers");
const { isSpaceAdmin, getSpaceById } = require("../models/space");
const { getUserByEmail } = require("../models/user");
const Invitation = require("../models/invitations");
const transporter = require("../config/mailer");

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

    // Get space details (to include space name in email)
    const space = await getSpaceById(spaceId, inviter_id);
    if (!space) {
      return res.status(404).json({ message: "Space not foundd" });
    }

    // Check if user is already a member
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      const isMember = await isUserMemberOfSpace(spaceId, existingUser.user_id);
      if (isMember) {
        return res
          .status(400)
          .json({ message: "User is already a member of this space" });
      }
    }
    // Generate unique token
    const token = Invitation.generateToken();

    // Create invitation in DB
    await Invitation.createInvitation(spaceId, inviter_id, email, token);

    // --- Send the actual email ---
    const invitationLink = `http://localhost:5173/spaces/${spaceId}/members/accept/${token}`;

    const mailOptions = {
      from: `"MeetApp" <${process.env.MAIL_USER}>`, // Sender address
      to: email,
      subject: `Invitation to join the space: ${space.name}`,
      text: `You have been invited to join the space "${space.name}". Click this link to accept: ${invitationLink}`, // Plain text body
      html: `<p>You have been invited to join the space "<b>${space.name}</b>".</p><p>Click this link to accept: <a href="${invitationLink}">${invitationLink}</a></p><p>This link will expire in 24 hours.</p>`, // HTML body
    };

    // Send mail with defined transport object
    try {
      await transporter.sendMail(mailOptions);
      console.log(`Invitation email sent to ${email}`);
      res.status(200).json({ message: "Invitation sent successfully" });
    } catch (mailError) {
      console.error("Error sending invitation email:", mailError);
      res
        .status(500)
        .json({ message: "Invitation created, but failed to send email." });
    }
  } catch (err) {
    console.error("Error in inviteToSpace:", err.message);
    res.status(500).send("Server Error");
  }
};

exports.acceptInvitation = async (req, res) => {
  try {
    const { token } = req.params;
    // const user_id = req.user.user_id;
    console.log(token);

    // Validate token
    const invitation = await Invitation.getInvitationByToken(token);
    if (!invitation) {
      console.log("/???");

      return res.status(400).json({ message: "Invalid or expired invitation" });
    }

    // Check if user exists
    let user = await getUserByEmail(invitation.email);
    if (!user) {
      console.log("/???");

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