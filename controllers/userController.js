const { createUser, getUserById } = require('../models/user');

// Controller to create a new user
exports.createUser = async (req, res) => {
  try {
    const { username, email, password_hash } = req.body;
    const newUser = await createUser(username, email, password_hash);
    res.status(201).json(newUser);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// Controller to get a user by ID
exports.getUserById = async (req, res) => {
  try {
    const user = await getUserById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};