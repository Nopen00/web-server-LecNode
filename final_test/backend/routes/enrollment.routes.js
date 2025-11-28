import express from 'express';
import {
  getEnrollmentsByCourse,
  createEnrollment,
  deleteEnrollment,
  importEnrollments,
  uploadMiddleware
} from '../controllers/enrollment.controller.js';
import { authenticate, adminOnly } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/courses/:courseId/enrollments', getEnrollmentsByCourse);
router.post('/courses/:courseId/enrollments', adminOnly, createEnrollment);
router.delete('/:id', adminOnly, deleteEnrollment);
router.post('/import', adminOnly, uploadMiddleware, importEnrollments);

export default router;

