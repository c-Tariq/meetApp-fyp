const {
  createSpace,
  getSpacesForUser,
  isSpaceAdmin,
  deleteSpace,
  getSpaceById,
} = require("../models/space");
const { addUserToSpace } = require("../models/spaceMembers");

exports.createSpace = async (req, res) => {
  try {
    const { space_name } = req.body;
    const user_id = req.user.user_id; // ID of the user creating the space (admin)

    if (!space_name) {
      return res.status(400).json({ message: "Space name is required" });
    }

    // Create the space
    const newSpace = await createSpace(user_id, space_name);

    // Automatically add the creator (admin) to the space members
    try {
      await addUserToSpace(newSpace.space_id, user_id);
      console.log(
        `Admin user ${user_id} automatically added to space ${newSpace.space_id}`
      );
    } catch (memberAddError) {
      console.error(
        `Failed to automatically add admin ${user_id} to space ${newSpace.space_id}:`,
        memberAddError
      );
    }
    // Return the created space information
    res.status(201).json(newSpace);
  } catch (err) {
    console.error("Error creating space:", err.message);
    res.status(500).send("Server Error during space creation");
  }
};

// exports.getAllSpaces = async (req, res) => {
//   try {
//     const spaces = await getAllSpaces();
//     res.json(spaces);
//   } catch (err) {
//     console.error(err.message);
//     res.status(500).send("Server Error");
//   }
// };

exports.getAllSpaces = async (req, res) => {
  try {
    if (!req.user || !req.user.user_id) {
      console.error("getAllSpaces called without authenticated user.");
      return res.status(401).json({ message: "Authentication required." });
    }
    const userId = req.user.user_id;

    const spaces = await getSpacesForUser(userId);

    res.json(spaces);
  } catch (err) {
    console.error("Error fetching spaces for user:", err.message);
    res.status(500).send("Server Error");
  }
};

exports.deleteSpace = async (req, res) => {
  try {
    const { spaceId } = req.params; // Correctly get spaceId from URL parameters
    const user_id = req.user.user_id; // Use authenticated user's ID

    // Check if the user is the admin of this space
    const isAdmin = await isSpaceAdmin(spaceId, user_id); // Use spaceId here
    if (!isAdmin) {
      return res
        .status(403)
        .json({ message: "You are not authorized to delete this space" });
    }

    // Proceed with deletion
    const deletedSpace = await deleteSpace(spaceId); // Use spaceId here
    if (!deletedSpace) {
      return res.status(404).json({ message: "Space not found" });
    }
    res
      .status(200)
      .json({ message: "Space deleted successfully", deletedSpace });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

exports.getSpace = async (req, res) => {
  try {
    const { spaceId } = req.params; // Get spaceId from URL parameters
    const userId = req.user.user_id; // Get authenticated user's ID

    if (!userId) {
      return res.status(401).json({ message: "Authentication required." });
    }

    const space = await getSpaceById(spaceId, userId);

    if (!space) {
      // If space is null, it means either not found OR user not authorized.
      // Responding with 404 is common practice to avoid revealing existence.
      return res
        .status(404)
        .json({ message: "Space not found or access denied." });
    }
    res.json(space);
  } catch (err) {
    console.error(`Error fetching space ${req.params.spaceId}:`, err.message);
    res.status(500).send("Server Error");
  }
};