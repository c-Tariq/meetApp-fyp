const express = require("express");
const router = express.Router();
const spaceController = require("../controllers/spaceController");
const { ensureAuthenticated } = require("../middleware/authMiddleware");
const spaceMemberRoutes = require("./spaceMembersRoutes");
const meetingRoutes = require("./meetingRoutes");

// Space routes
router.post("/", ensureAuthenticated, spaceController.createSpace); // POST /spaces
router.get("/", ensureAuthenticated, spaceController.getAllSpaces); // GET /spaces
router.get("/:spaceId", ensureAuthenticated, spaceController.getSpace); // GET /spaces/spaceId
router.delete("/:spaceId", ensureAuthenticated, spaceController.deleteSpace); // DELETE /spaces/:spaceId

router.use("/:spaceId/members", spaceMemberRoutes); // /spaces/:spaceId/members
router.use("/:spaceId/meetings", meetingRoutes); // /spaces/:spaceId/meetings

module.exports = router;