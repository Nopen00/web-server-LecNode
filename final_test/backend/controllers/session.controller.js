import { ClassSession, Course } from '../models/index.js';
import { generateAttendanceCode } from '../utils/attendanceCode.js';

export const getSessionsByCourse = async (req, res, next) => {
  try {
    const { courseId } = req.params;
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

    res.status(201).json(session);
  } catch (error) {
    next(error);
  }
};

export const updateSession = async (req, res, next) => {
  try {
    const { id } = req.params;
    const session = await ClassSession.findByPk(id);
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

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

    await session.save();
    res.json(session);
  } catch (error) {
    next(error);
  }
};

export const deleteSession = async (req, res, next) => {
  try {
    const { id } = req.params;
    const session = await ClassSession.findByPk(id);
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    await session.destroy();
    res.json({ message: 'Session deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const openSession = async (req, res, next) => {
  try {
    const { id } = req.params;
    const session = await ClassSession.findByPk(id);
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    session.status = 'open';
    
    // 인증번호 방식인 경우 인증번호 생성
    if (session.attendance_method === 'code' && !session.attendance_code) {
      session.attendance_code = generateAttendanceCode();
    }

    await session.save();
    res.json(session);
  } catch (error) {
    next(error);
  }
};

export const pauseSession = async (req, res, next) => {
  try {
    const { id } = req.params;
    const session = await ClassSession.findByPk(id);
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    session.status = 'paused';
    await session.save();
    res.json(session);
  } catch (error) {
    next(error);
  }
};

export const closeSession = async (req, res, next) => {
  try {
    const { id } = req.params;
    const session = await ClassSession.findByPk(id);
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    session.status = 'closed';
    await session.save();
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

