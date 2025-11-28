import { ClassSession, Course } from '../models/index.js';
import { generateAttendanceCode } from '../utils/attendanceCode.js';
import { createAuditLog } from '../middleware/auditLog.js';

export const getSessionsByCourse = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    
    // 과목 존재 확인 및 권한 검증
    const course = await Course.findByPk(courseId);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // 교원은 자신의 과목만 조회 가능
    if (req.user.role === 'Instructor' && course.instructor_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only view sessions for your own courses' });
    }

    const sessions = await ClassSession.findAll({
      where: { course_id: courseId },
      order: [['week', 'ASC'], ['session_number', 'ASC']]
    });
    res.json(sessions);
  } catch (error) {
    next(error);
  }
};

export const createSession = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const { week, session_number, start_at, end_at, room, attendance_method, attendance_duration, is_holiday, is_makeup } = req.body;

    if (!week || !session_number || !start_at || !end_at) {
      return res.status(400).json({ error: 'Required fields are missing' });
    }

    // 과목 존재 확인 및 권한 검증
    const course = await Course.findByPk(courseId);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // 교원은 자신의 과목만 세션 생성 가능
    if (req.user.role === 'Instructor' && course.instructor_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only create sessions for your own courses' });
    }

    // 날짜 유효성 검증
    const start = new Date(start_at);
    const end = new Date(end_at);
    if (start >= end) {
      return res.status(400).json({ error: 'Start time must be before end time' });
    }

    // 출석 시간 검증
    if (attendance_duration !== undefined && (attendance_duration < 3 || attendance_duration > 15)) {
      return res.status(400).json({ error: 'Attendance duration must be between 3 and 15 minutes' });
    }

    const session = await ClassSession.create({
      course_id: courseId,
      week,
      session_number,
      start_at,
      end_at,
      room: room || null,
      attendance_method: attendance_method || 'code',
      attendance_duration: attendance_duration || 10,
      is_holiday: is_holiday || false,
      is_makeup: is_makeup || false
    });

    // 감사 로그 기록
    await createAuditLog(
      req,
      'session_create',
      'ClassSession',
      session.id,
      null,
      { week, session_number, start_at, end_at, attendance_method: attendance_method || 'code' }
    );

    res.status(201).json(session);
  } catch (error) {
    next(error);
  }
};

export const updateSession = async (req, res, next) => {
  try {
    const { id } = req.params;
    const session = await ClassSession.findByPk(id, {
      include: [{ model: Course, as: 'course' }]
    });
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // 교원은 자신의 과목 세션만 수정 가능
    if (req.user.role === 'Instructor' && session.course.instructor_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only update sessions for your own courses' });
    }

    const oldValue = {
      week: session.week,
      session_number: session.session_number,
      start_at: session.start_at,
      end_at: session.end_at,
      room: session.room,
      attendance_method: session.attendance_method,
      attendance_duration: session.attendance_duration,
      status: session.status
    };

    const { week, session_number, start_at, end_at, room, attendance_method, attendance_duration, is_holiday, is_makeup } = req.body;

    if (week !== undefined) session.week = week;
    if (session_number !== undefined) session.session_number = session_number;
    if (start_at) session.start_at = start_at;
    if (end_at) session.end_at = end_at;
    if (room !== undefined) session.room = room;
    if (attendance_method) session.attendance_method = attendance_method;
    if (attendance_duration !== undefined) {
      if (attendance_duration < 3 || attendance_duration > 15) {
        return res.status(400).json({ error: 'Attendance duration must be between 3 and 15 minutes' });
      }
      session.attendance_duration = attendance_duration;
    }
    if (is_holiday !== undefined) session.is_holiday = is_holiday;
    if (is_makeup !== undefined) session.is_makeup = is_makeup;

    // 날짜 유효성 검증
    if (session.start_at && session.end_at) {
      const start = new Date(session.start_at);
      const end = new Date(session.end_at);
      if (start >= end) {
        return res.status(400).json({ error: 'Start time must be before end time' });
      }
    }

    await session.save();

    // 감사 로그 기록
    await createAuditLog(
      req,
      'session_update',
      'ClassSession',
      session.id,
      oldValue,
      {
        week: session.week,
        session_number: session.session_number,
        start_at: session.start_at,
        end_at: session.end_at,
        attendance_method: session.attendance_method,
        attendance_duration: session.attendance_duration,
        status: session.status
      }
    );

    res.json(session);
  } catch (error) {
    next(error);
  }
};

export const deleteSession = async (req, res, next) => {
  try {
    const { id } = req.params;
    const session = await ClassSession.findByPk(id, {
      include: [{ model: Course, as: 'course' }]
    });
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // 교원은 자신의 과목 세션만 삭제 가능
    if (req.user.role === 'Instructor' && session.course.instructor_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only delete sessions for your own courses' });
    }

    const oldValue = {
      week: session.week,
      session_number: session.session_number,
      start_at: session.start_at,
      end_at: session.end_at,
      course_id: session.course_id
    };

    await session.destroy();

    // 감사 로그 기록
    await createAuditLog(
      req,
      'session_delete',
      'ClassSession',
      parseInt(id),
      oldValue,
      null
    );

    res.json({ message: 'Session deleted successfully' });
  } catch (error) {
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      return res.status(400).json({ error: 'Cannot delete session with associated attendance records' });
    }
    next(error);
  }
};

export const openSession = async (req, res, next) => {
  try {
    const { id } = req.params;
    const session = await ClassSession.findByPk(id, {
      include: [{ model: Course, as: 'course' }]
    });
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // 교원은 자신의 과목 세션만 열 수 있음
    if (req.user.role === 'Instructor' && session.course.instructor_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only open sessions for your own courses' });
    }

    const oldStatus = session.status;
    session.status = 'open';
    
    // 인증번호 방식인 경우 인증번호 생성
    if (session.attendance_method === 'code' && !session.attendance_code) {
      session.attendance_code = generateAttendanceCode();
    }

    await session.save();

    // 감사 로그 기록
    await createAuditLog(
      req,
      'session_open',
      'ClassSession',
      session.id,
      { status: oldStatus },
      { status: 'open', attendance_code: session.attendance_code }
    );

    res.json(session);
  } catch (error) {
    next(error);
  }
};

export const pauseSession = async (req, res, next) => {
  try {
    const { id } = req.params;
    const session = await ClassSession.findByPk(id, {
      include: [{ model: Course, as: 'course' }]
    });
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // 교원은 자신의 과목 세션만 일시정지 가능
    if (req.user.role === 'Instructor' && session.course.instructor_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only pause sessions for your own courses' });
    }

    const oldStatus = session.status;
    session.status = 'paused';
    await session.save();

    // 감사 로그 기록
    await createAuditLog(
      req,
      'session_pause',
      'ClassSession',
      session.id,
      { status: oldStatus },
      { status: 'paused' }
    );

    res.json(session);
  } catch (error) {
    next(error);
  }
};

export const closeSession = async (req, res, next) => {
  try {
    const { id } = req.params;
    const session = await ClassSession.findByPk(id, {
      include: [{ model: Course, as: 'course' }]
    });
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // 교원은 자신의 과목 세션만 닫을 수 있음
    if (req.user.role === 'Instructor' && session.course.instructor_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only close sessions for your own courses' });
    }

    const oldStatus = session.status;
    session.status = 'closed';
    await session.save();

    // 감사 로그 기록
    await createAuditLog(
      req,
      'session_close',
      'ClassSession',
      session.id,
      { status: oldStatus },
      { status: 'closed' }
    );

    res.json(session);
  } catch (error) {
    next(error);
  }
};

export const getAttendanceCode = async (req, res, next) => {
  try {
    const { id } = req.params;
    const session = await ClassSession.findByPk(id);
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // 인증번호가 없으면 생성
    if (!session.attendance_code) {
      session.attendance_code = generateAttendanceCode();
      await session.save();
    }

    res.json({ attendance_code: session.attendance_code });
  } catch (error) {
    next(error);
  }
};

