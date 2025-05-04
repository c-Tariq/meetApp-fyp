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
      return res.status(404).json({ message: "Space not found" });
    }

    // --- Add Check: Does the user exist in the system? ---
    const existingUser = await getUserByEmail(email);
    if (!existingUser) {
        return res.status(404).json({ 
            message: "Cannot invite this email: No registered user found with this address." 
        });
    }
    // --- End Check ---

    // Check if user is already a member (Now we know existingUser is valid)
      const isMember = await isUserMemberOfSpace(spaceId, existingUser.user_id);
      if (isMember) {
        return res
          .status(400)
          .json({ message: "User is already a member of this space" });
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
      // Consider deleting the created DB invitation record here if email fails?
      await Invitation.deleteInvitationByToken(token); // Attempt to clean up DB record
      console.log(`Cleaned up invitation record for token ${token} due to email failure.`);
      res
        .status(500)
        .json({ message: "User found, but failed to send invitation email. Invitation cancelled." });
    }
  } catch (err) {
    console.error("Error in inviteToSpace:", err.message);
    res.status(500).send("Server Error");
  }
};

exports.acceptInvitation = async (req, res) => {
  try {
    const { token } = req.params;

    // 1. Check Authentication
    if (!req.isAuthenticated()) {
      // Return error asking user to log in (suitable for API)
      return res.status(401).json({ message: "Please log in or register to accept the invitation." });
    }
    const loggedInUserId = req.user.user_id;
    const loggedInUserEmail = req.user.email; // Assume email is available on req.user

    // 2. Validate Token and Invitation Status
    const invitation = await Invitation.getInvitationByToken(token); // Assumes this returns null/undefined if not found, expired, or already used

    if (!invitation) {
      // Handles not found, expired, or already used based on model logic
      return res.status(404).json({ message: "This invitation link is invalid or has expired." });
    }

    // Optional: More specific check if model can differentiate states
    // if (invitation.status === 'accepted') return res.status(409).json({ message: "Invitation already accepted." });
    // if (invitation.status === 'expired') return res.status(410).json({ message: "Invitation has expired." });

    // 3. Check Email Match
    if (invitation.email !== loggedInUserEmail) {
      return res.status(403).json({ message: "This invitation is intended for a different email address." });
    }

    // 4. Check if Already Member
    const alreadyMember = await isUserMemberOfSpace(invitation.space_id, loggedInUserId);
    if (alreadyMember) {
      // Mark token used even if already member to prevent reuse/clutter
      await Invitation.markInvitationUsed(token);
      // Use 409 Conflict as it's more semantic
      return res.status(409).json({ message: "You are already a member of this space." });
    }

    // 5. Add User to Space
    await addUserToSpace(invitation.space_id, loggedInUserId);

    // 6. Mark Invitation as Used (Redundant if already done above, but safe)
    await Invitation.markInvitationUsed(token);

    // 7. Send Success Response with spaceId for redirection
    res.status(200).json({
      message: "Successfully joined the space!",
      spaceId: invitation.space_id // Include spaceId for frontend redirection
    });

  } catch (err) {
    // Log the specific error for debugging
    console.error(`Error accepting invitation for token ${req.params.token}:`, err);
    res.status(500).json({ message: "An unexpected error occurred while accepting the invitation." });
  }
};