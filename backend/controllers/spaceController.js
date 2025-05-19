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
    const { spaceId } = req.params;
    const user_id = req.user.user_id;

    const isAdmin = await isSpaceAdmin(spaceId, user_id); // Use spaceId here
    if (!isAdmin) {
      return res
        .status(403)
        .json({ message: "You are not authorized to delete this space" });
    }

    const deletedSpace = await deleteSpace(spaceId);
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
    const { spaceId } = req.params;
    const userId = req.user.user_id;

    if (!userId) {
      return res.status(401).json({ message: "Authentication required." });
    }

    const space = await getSpaceById(spaceId, userId);

    if (!space) {
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
