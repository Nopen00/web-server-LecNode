import express from 'express';
import {
  createExcuse,
  getExcuses,
  getExcuseById,
  updateExcuse
} from '../controllers/excuse.controller.js';
import { authenticate, instructorOrAdmin } from '../middleware/auth.js';
import { auditMiddleware } from '../middleware/auditLog.js';

const router = express.Router();

router.use(authenticate);

router.post('/sessions/:id/excuses', createExcuse);
router.get('/', getExcuses);
router.get('/:id', getExcuseById);
router.patch('/:id', instructorOrAdmin, auditMiddleware('excuse_approval', 'ExcuseRequest', (req) => req.params.id), updateExcuse);

export default router;

