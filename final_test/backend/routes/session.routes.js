import express from 'express';
import {
  getSessionsByCourse,
  createSession,
  updateSession,
  deleteSession,
  openSession,
  pauseSession,
  closeSession,
  getAttendanceCode
} from '../controllers/session.controller.js';
import { authenticate, instructorOrAdmin } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/courses/:courseId', getSessionsByCourse);
router.post('/courses/:courseId', instructorOrAdmin, createSession);
router.put('/:id', instructorOrAdmin, updateSession);
router.delete('/:id', instructorOrAdmin, deleteSession);
router.post('/:id/open', instructorOrAdmin, openSession);
router.post('/:id/pause', instructorOrAdmin, pauseSession);
router.post('/:id/close', instructorOrAdmin, closeSession);
router.get('/:id/attendance-code', instructorOrAdmin, getAttendanceCode);

export default router;

