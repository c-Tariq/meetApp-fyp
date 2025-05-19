const {
  addUserToSpace,
  isUserMemberOfSpace,
  getAllMembersOfSpace,
} = require("../models/spaceMembers");
const { isSpaceAdmin, getSpaceById } = require("../models/space");
const { getUserByEmail } = require("../models/user");
const Invitation = require("../models/invitations");
const transporter = require("../config/mailer");

exports.addUserToSpace = async (req, res) => {
  try {
    const { space_id, user_id } = req.body;

    const isAdmin = await isSpaceAdmin(space_id, req.user.user_id);
    if (!isAdmin) {
      return res.status(403).json({
        message: "You are not authorized to add members to this space",
      });
    }
    const isMember = await isUserMemberOfSpace(space_id, user_id);
    if (isMember) {
      return res
        .status(400)
        .json({ message: "User is already a member of this space" });
    }

    const newMember = await addUserToSpace(space_id, user_id);
    res
      .status(201)
      .json({ message: "User added to space successfully", newMember });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

exports.getAllMembersOfSpace = async (req, res) => {
  try {
    const { spaceId } = req.params;

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

    const isAdmin = await isSpaceAdmin(spaceId, inviter_id);
    if (!isAdmin) {
      return res
        .status(403)
        .json({ message: "Only space admins can invite users" });
    }

    const space = await getSpaceById(spaceId, inviter_id);
    if (!space) {
      return res.status(404).json({ message: "Space not found" });
    }

    const existingUser = await getUserByEmail(email);
    if (!existingUser) {
      return res.status(404).json({
        message:
          "Cannot invite this email: No registered user found with this address.",
      });
    }

    // Check if user is already a member
    const isMember = await isUserMemberOfSpace(spaceId, existingUser.user_id);
    if (isMember) {
      return res
        .status(400)
        .json({ message: "User is already a member of this space" });
    }

    const token = Invitation.generateToken();

    // Create invitation in DB
    await Invitation.createInvitation(spaceId, inviter_id, email, token);

    const invitationLink = `http://localhost:5173/spaces/${spaceId}/members/accept/${token}`;

    const mailOptions = {
      from: `"MeetApp" <${process.env.MAIL_USER}>`, // Sender address
      to: email,
      subject: `Invitation to join the space: ${space.name}`,
      text: `You have been invited to join the space "${space.name}". Click this link to accept: ${invitationLink}`,
      html: `<p>You have been invited to join the space "<b>${space.name}</b>".</p><p>Click this link to accept: <a href="${invitationLink}">${invitationLink}</a></p><p>This link will expire in 24 hours.</p>`,
    };

    // Send mail with defined transport object
    try {
      await transporter.sendMail(mailOptions);
      console.log(`Invitation email sent to ${email}`);
      res.status(200).json({ message: "Invitation sent successfully" });
    } catch (mailError) {
      console.error("Error sending invitation email:", mailError);
      await Invitation.deleteInvitationByToken(token);
      console.log(
        `Cleaned up invitation record for token ${token} due to email failure.`
      );
      res.status(500).json({
        message:
          "User found, but failed to send invitation email. Invitation cancelled.",
      });
    }
  } catch (err) {
    console.error("Error in inviteToSpace:", err.message);
    res.status(500).send("Server Error");
  }
};

exports.acceptInvitation = async (req, res) => {
  try {
    const { token } = req.params;

    if (!req.isAuthenticated()) {
      return res.status(401).json({
        message: "Please log in or register to accept the invitation.",
      });
    }
    const loggedInUserId = req.user.user_id;
    const loggedInUserEmail = req.user.email;

    const invitation = await Invitation.getInvitationByToken(token);

    if (!invitation) {
      return res
        .status(404)
        .json({ message: "This invitation link is invalid or has expired." });
    }

    if (invitation.email !== loggedInUserEmail) {
      return res.status(403).json({
        message: "This invitation is intended for a different email address.",
      });
    }

    const alreadyMember = await isUserMemberOfSpace(
      invitation.space_id,
      loggedInUserId
    );
    if (alreadyMember) {
      await Invitation.markInvitationUsed(token);
      return res
        .status(409)
        .json({ message: "You are already a member of this space." });
    }

    await addUserToSpace(invitation.space_id, loggedInUserId);

    await Invitation.markInvitationUsed(token);

    res.status(200).json({
      message: "Successfully joined the space!",
      spaceId: invitation.space_id,
    });
  } catch (err) {
    console.error(
      `Error accepting invitation for token ${req.params.token}:`,
      err
    );
    res.status(500).json({
      message: "An unexpected error occurred while accepting the invitation.",
    });
  }
};
