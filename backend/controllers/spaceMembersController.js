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
    // We NEED to know who is clicking the link
    if (!req.isAuthenticated()) {
        // Option 1: Redirect to login, maybe passing the token along
        // return res.redirect(`/login?invite_token=${token}`); 
        // Option 2: Return error asking user to log in
        return res.status(401).json({ message: "Please log in to accept the invitation." });
    }
    const loggedInUserId = req.user.user_id;

    // Validate token
    const invitation = await Invitation.getInvitationByToken(token);
    if (!invitation) {
      return res.status(400).json({ message: "Invalid or expired invitation token." });
    }

    // Check if invited email matches the logged-in user's email (or ID)
    // Fetch logged-in user details IF needed for email comparison 
    // (Assuming req.user contains email or we fetch it based on loggedInUserId)
    // Simplified check: Let's assume the invited email MUST match the account trying to accept.
    if (invitation.email !== req.user.email) { // Assuming req.user has email
        return res.status(403).json({ message: "This invitation is for a different email address." });
    }

    // Check if the user identified by the token/email actually exists 
    // (This check is technically redundant if we trust req.user based on email match above)
    let user = await getUserByEmail(invitation.email);
    if (!user || user.user_id !== loggedInUserId) { 
        // Safety check: User doesn't exist OR ID mismatch despite email match (shouldn't happen)
        console.error(`User ID mismatch for email ${invitation.email}: logged in ${loggedInUserId}, found ${user?.user_id}`);
        return res.status(400).json({ message: "Invitation user mismatch." });
    }

    // --- Add Check: Is the user already a member? ---
    const alreadyMember = await isUserMemberOfSpace(invitation.space_id, loggedInUserId);
    if (alreadyMember) {
        // Optionally mark token used even if already member
        await Invitation.markInvitationUsed(token);
        return res.status(400).json({ message: "You are already a member of this space." });
    }
    // --- End Check ---

    // Add to space
    await addUserToSpace(invitation.space_id, loggedInUserId); // Use loggedInUserId

    // Mark invitation as used
    await Invitation.markInvitationUsed(token);

    // Redirect to the space page after successful join
    // res.redirect(`/spaces/${invitation.space_id}`); 
    // OR Send success message
    res.json({ message: "Successfully joined the space!" });

  } catch (err) {
    console.error("Error accepting invitation:", err);
    res.status(500).json({ message: "An unexpected error occurred while accepting the invitation." }); // Send specific JSON error
  }
};