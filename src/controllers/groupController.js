import Group from '../models/Group.js';
import User from '../models/User.js';

export const getMyGroups = async (req, res) => {
  try {
    const groups = await Group.find({
      $or: [{ owner: req.user._id }, { members: req.user._id }],
    })
      .populate('owner', 'name username')
      .populate('members', 'name username')
      .sort({ createdAt: -1 });

    res.json(groups);
  } catch (error) {
    console.error('Get my groups error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
export const getAllGroups = async (req, res) => {
  try {
    const groups = await Group.find({});
    res.json(groups);
  } catch (error) {
    console.error('Get groups error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const createGroup = async (req, res) => {
  try {
    const { name, password } = req.body;

    if (!name || !password) {
      return res
        .status(400)
        .json({ message: 'Please provide group name and password' });
    }

    const group = await Group.create({
      name,
      password,
      owner: req.user._id,
      members: [req.user._id],
    });

    await group.populate('owner', 'name username');
    await group.populate('members', 'name username');

    res.status(201).json(group);
  } catch (error) {
    console.error('Create group error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteGroup = async (req, res) => {
  try {
    const { groupId } = req.params;

    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    if (group.owner.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: 'Not authorized to delete this group' });
    }

    await Group.findByIdAndDelete(groupId);

    res.json({ message: 'Group deleted successfully' });
  } catch (error) {
    console.error('Delete group error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const addMember = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { memberId } = req.body;

    if (!memberId) {
      return res.status(400).json({ message: 'Please provide member ID' });
    }

    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    if (group.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to add members' });
    }

    const memberExists = await User.findById(memberId);
    if (!memberExists) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (group.members.includes(memberId)) {
      return res.status(400).json({ message: 'User is already a member' });
    }

    group.members.push(memberId);
    await group.save();

    await group.populate('owner', 'name username');
    await group.populate('members', 'name username');

    res.json(group);
  } catch (error) {
    console.error('Add member error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const removeMember = async (req, res) => {
  try {
    const { groupId, memberId } = req.params;

    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    if (group.owner.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: 'Not authorized to remove members' });
    }

    if (memberId === group.owner.toString()) {
      return res.status(400).json({ message: 'Cannot remove the group owner' });
    }

    group.members = group.members.filter(
      (member) => member.toString() !== memberId
    );
    await group.save();

    await group.populate('owner', 'name username');
    await group.populate('members', 'name username');

    res.json(group);
  } catch (error) {
    console.error('Remove member error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const joinGroup = async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ message: 'Please provide group password' });
    }

    const groups = await Group.find();
    let matchedGroup = null;

    for (const group of groups) {
      const isMatch = await group.matchPassword(password);
      if (isMatch) {
        matchedGroup = group;
        break;
      }
    }

    if (!matchedGroup) {
      return res.status(404).json({ message: 'Invalid group password' });
    }

    if (matchedGroup.members.includes(req.user._id)) {
      return res
        .status(400)
        .json({ message: 'You are already a member of this group' });
    }

    matchedGroup.members.push(req.user._id);
    await matchedGroup.save();

    await matchedGroup.populate('owner', 'name username');
    await matchedGroup.populate('members', 'name username');

    res.json(matchedGroup);
  } catch (error) {
    console.error('Join group error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const leaveGroup = async (req, res) => {
  try {
    const { groupId } = req.body;

    if (!groupId) {
      return res.status(400).json({ message: 'Please provide group ID' });
    }

    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    if (group.owner.toString() === req.user._id.toString()) {
      return res
        .status(400)
        .json({ message: 'Owner cannot leave the group. Delete it instead.' });
    }

    group.members = group.members.filter(
      (member) => member.toString() !== req.user._id.toString()
    );
    await group.save();

    res.json({ message: 'Successfully left the group' });
  } catch (error) {
    console.error('Leave group error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const searchGroups = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim() === '') {
      return res.json([]);
    }

    const groups = await Group.find({
      $and: [
        { name: { $regex: q, $options: 'i' } },
        {
          $or: [{ owner: req.user._id }, { members: req.user._id }],
        },
      ],
    })
      .populate('owner', 'name username')
      .populate('members', 'name username')
      .limit(20);

    res.json(groups);
  } catch (error) {
    console.error('Search groups error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
