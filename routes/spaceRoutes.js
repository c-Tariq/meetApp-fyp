const express = require('express');
const { createSpace, getAllSpaces, deleteSpace } = require('../controllers/spaceController');
const router = express.Router();

// Route to create a new space
router.post('/', createSpace);

// Route to get all spaces
router.get('/', getAllSpaces);

// Route to delete a space
router.delete('/:space_id', deleteSpace); 

module.exports = router;