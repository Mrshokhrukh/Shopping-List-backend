import express from 'express';
import {
  getMyGroups,
  createGroup,
  deleteGroup,
  addMember,
  removeMember,
  joinGroup,
  leaveGroup,
  searchGroups,
  getAllGroups,
} from '../controllers/groupController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/', getMyGroups);

router.get('/all-groups', getAllGroups);

router.post('/', createGroup);

router.delete('/:groupId', deleteGroup);

router.post('/:groupId/members', addMember);

router.delete('/:groupId/members/:memberId', removeMember);

router.post('/join', joinGroup);

router.post('/leave', leaveGroup);

router.get('/search', searchGroups);

export default router;
