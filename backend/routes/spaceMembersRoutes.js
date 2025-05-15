const express = require("express");
const router = express.Router({ mergeParams: true }); 
const { ensureAuthenticated } = require("../middleware/authMiddleware");
const spaceMembersController = require("../controllers/spaceMembersController");

router.post("/", ensureAuthenticated, spaceMembersController.addUserToSpace); // POST /spaces/:spaceId/members
router.get("/",ensureAuthenticated,spaceMembersController.getAllMembersOfSpace); // GET /spaces/:spaceId/members

router.post("/invite",ensureAuthenticated,spaceMembersController.inviteToSpace); // POST /spaces/:spaceId/members/invite
router.get("/accept/:token", spaceMembersController.acceptInvitation); // POST /spaces/:spaceId/members/accept//

module.exports = router;