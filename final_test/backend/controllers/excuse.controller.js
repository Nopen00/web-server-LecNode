import { ExcuseRequest, ClassSession, User, Course, Attendance } from '../models/index.js';
import { Op } from 'sequelize';

// 공결 신청
export const createExcuse = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason_code, reason_text, files } = req.body;
    const studentId = req.user.id;

    if (!reason_code) {
      return res.status(400).json({ error: 'Reason code is required' });
    }

    if (!['병가', '경조사', '기타'].includes(reason_code)) {
      return res.status(400).json({ error: 'Invalid reason code' });
    }

    // 세션 확인
    const session = await ClassSession.findByPk(id);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // 이미 신청했는지 확인
    const existing = await ExcuseRequest.findOne({
      where: { session_id: id, student_id: studentId }
    });

    if (existing) {
      return res.status(400).json({ error: 'Excuse request already exists' });
    }

    const excuse = await ExcuseRequest.create({
      session_id: id,
      student_id: studentId,
      reason_code,
      reason_text: reason_text || null,
      files: files || [],
      status: 'pending'
    });

    const excuseWithRelations = await ExcuseRequest.findByPk(excuse.id, {
      include: [
        { model: ClassSession, as: 'session', attributes: ['id', 'week', 'session_number', 'start_at'] },
        { model: User, as: 'student', attributes: ['id', 'name', 'student_id', 'email'] }
      ]
    });

    res.status(201).json(excuseWithRelations);
  } catch (error) {
    next(error);
  }
};

// 공결 신청 목록 조회
export const getExcuses = async (req, res, next) => {
  try {
    const { status } = req.query;
    const where = {};

    if (status) {
      where.status = status;
    }

    // 교원인 경우 자신의 과목만, 관리자는 모두
    if (req.user.role === 'Instructor') {
      // 교원의 과목에 대한 공결만 조회
      const excuses = await ExcuseRequest.findAll({
        where,
        include: [
          {
            model: ClassSession,
            as: 'session',
            include: [{
              model: Course,
              as: 'course',
              where: { instructor_id: req.user.id }
            }]
          },
          { model: User, as: 'student', attributes: ['id', 'name', 'student_id', 'email'] }
        ]
      });
      return res.json(excuses);
    }

    const excuses = await ExcuseRequest.findAll({
      where,
      include: [
        { model: ClassSession, as: 'session', attributes: ['id', 'week', 'session_number', 'start_at'] },
        { model: User, as: 'student', attributes: ['id', 'name', 'student_id', 'email'] }
      ]
    });

    res.json(excuses);
  } catch (error) {
    next(error);
  }
};

// 공결 신청 상세
export const getExcuseById = async (req, res, next) => {
  try {
    const excuse = await ExcuseRequest.findByPk(req.params.id, {
      include: [
        { model: ClassSession, as: 'session' },
        { model: User, as: 'student', attributes: ['id', 'name', 'student_id', 'email'] }
      ]
    });

    if (!excuse) {
      return res.status(404).json({ error: 'Excuse request not found' });
    }

    res.json(excuse);
  } catch (error) {
    next(error);
  }
};

// 공결 승인/반려
export const updateExcuse = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, instructor_comment } = req.body;

    if (!status || !['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const excuse = await ExcuseRequest.findByPk(id);
    if (!excuse) {
      return res.status(404).json({ error: 'Excuse request not found' });
    }

    const oldValue = { status: excuse.status, instructor_comment: excuse.instructor_comment };

    excuse.status = status;
    excuse.instructor_comment = instructor_comment || null;
    excuse.reviewed_at = new Date();

    await excuse.save();

    // 공결 승인 시 출석 상태 업데이트
    if (status === 'approved') {
      const attendance = await Attendance.findOne({
        where: { session_id: excuse.session_id, student_id: excuse.student_id }
      });

      if (attendance) {
        attendance.status = 4; // 공결
        await attendance.save();
      } else {
        // 출석 기록이 없으면 생성
        await Attendance.create({
          session_id: excuse.session_id,
          student_id: excuse.student_id,
          status: 4, // 공결
          checked_at: null
        });
      }
    }

    const newValue = { status: excuse.status, instructor_comment: excuse.instructor_comment };

    const excuseWithRelations = await ExcuseRequest.findByPk(excuse.id, {
      include: [
        { model: ClassSession, as: 'session' },
        { model: User, as: 'student', attributes: ['id', 'name', 'student_id', 'email'] }
      ]
    });

    res.json(excuseWithRelations);
  } catch (error) {
    next(error);
  }
};

