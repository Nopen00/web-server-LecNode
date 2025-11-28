import express from 'express';
import {
  attendSession,
  getAttendanceBySession,
  getAttendanceSummary,
  updateAttendance,
  getAttendanceByCourse
} from '../controllers/attendance.controller.js';
import { authenticate, instructorOrAdmin } from '../middleware/auth.js';
import { auditMiddleware } from '../middleware/auditLog.js';

const router = express.Router();

router.use(authenticate);

router.post('/sessions/:id/attend', attendSession);
router.get('/sessions/:id/attendance', getAttendanceBySession);
router.get('/sessions/:id/attendance/summary', getAttendanceSummary);
router.patch('/:id', instructorOrAdmin, auditMiddleware('attendance_change', 'Attendance', (req) => req.params.id), updateAttendance);
router.get('/courses/:courseId/attendance', getAttendanceByCourse);

export default router;

