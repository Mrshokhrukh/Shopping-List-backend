import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Group from '../models/Group.js';

const generateToken = (id) => {
  return jwt.sign(
    { id },
    '8fd22c05d4ec1e8d10fa31e8ff1bdb6eb4adc546c855e974501fc2df69976cd7',
    {
      expiresIn: '30d',
    }
  );
};

export const registerUser = async (req, res) => {
  try {
    const { name, username, password } = req.body;

    // Validate input
    if (!name || !username || !password) {
      return res
        .status(400)
        .json({ message: 'Please provide all required fields' });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: 'Password must be at least 6 characters' });
    }

    const userExists = await User.findOne({ username: username.toLowerCase() });

    if (userExists) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    const user = await User.create({
      name,
      username: username.toLowerCase(),
      password,
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        username: user.username,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await Group.deleteMany({ owner: req.user._id });

    await Group.updateMany(
      { members: req.user._id },
      { $pull: { members: req.user._id } }
    );

    await User.findByIdAndDelete(req.user._id);

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const searchUsers = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim() === '') {
      return res.json([]);
    }

    const users = await User.find({
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { username: { $regex: q, $options: 'i' } },
      ],
    })
      .select('-password')
      .limit(20);

    res.json(users);
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
