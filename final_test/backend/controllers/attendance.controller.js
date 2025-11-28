import { Attendance, ClassSession, User, AttendancePolicy } from '../models/index.js';
import { Op } from 'sequelize';

// 출석 체크
export const attendSession = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { attendance_code, location } = req.body;
    const studentId = req.user.id;

    // 세션 확인
    const session = await ClassSession.findByPk(id);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // 출석이 열려있는지 확인
    if (session.status !== 'open') {
      return res.status(400).json({ error: 'Attendance is not open' });
    }

    // 출석 체크 시간 확인
    const now = new Date();
    const sessionStart = new Date(session.start_at);
    const checkEndTime = new Date(sessionStart.getTime() + session.attendance_duration * 60000);

    if (now < sessionStart || now > checkEndTime) {
      return res.status(400).json({ error: 'Attendance check time has expired' });
    }

    // 인증번호 방식인 경우 인증번호 확인
    if (session.attendance_method === 'code') {
      if (!attendance_code || attendance_code !== session.attendance_code) {
        return res.status(400).json({ error: 'Invalid attendance code' });
      }
    }

    // 이미 출석했는지 확인
    let attendance = await Attendance.findOne({
      where: { session_id: id, student_id: studentId }
    });

    if (attendance) {
      return res.status(400).json({ error: 'Already attended' });
    }

    // 출석 상태 판정
    const lateMinutes = Math.floor((now - sessionStart) / 60000);
    let status = 1; // 출석

    // 정책 가져오기
    const policy = await AttendancePolicy.findOne({
      where: { course_id: session.course_id }
    });

    const lateThreshold = policy?.late_threshold || 10;
    const lateToAbsentThreshold = policy?.late_to_absent_threshold || 30;

    if (lateMinutes > lateToAbsentThreshold) {
      status = 3; // 결석
    } else if (lateMinutes > lateThreshold) {
      status = 2; // 지각
    }

    // 출석 기록 생성
    attendance = await Attendance.create({
      session_id: id,
      student_id: studentId,
      status,
      checked_at: now,
      late_minutes: lateMinutes > 0 ? lateMinutes : 0,
      location: location || null
    });

    res.status(201).json(attendance);
  } catch (error) {
    next(error);
  }
};

// 세션별 출석 현황 조회
export const getAttendanceBySession = async (req, res, next) => {
  try {
    const { id } = req.params;
    const attendances = await Attendance.findAll({
      where: { session_id: id },
      include: [{
        model: User,
        as: 'student',
        attributes: ['id', 'name', 'student_id', 'email']
      }]
    });
    res.json(attendances);
  } catch (error) {
    next(error);
  }
};

// 출석 요약 (대시보드용)
export const getAttendanceSummary = async (req, res, next) => {
  try {
    const { id } = req.params;
    const attendances = await Attendance.findAll({
      where: { session_id: id },
      include: [{
        model: User,
        as: 'student',
        attributes: ['id', 'name', 'student_id']
      }]
    });

    const summary = {
      total: attendances.length,
      present: attendances.filter(a => a.status === 1).length,
      late: attendances.filter(a => a.status === 2).length,
      absent: attendances.filter(a => a.status === 3).length,
      excuse: attendances.filter(a => a.status === 4).length,
      undefined: attendances.filter(a => a.status === 0).length,
      attendances
    };

    res.json(summary);
  } catch (error) {
    next(error);
  }
};

// 출석 정정 (교원)
export const updateAttendance = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, late_minutes } = req.body;

    const attendance = await Attendance.findByPk(id);
    if (!attendance) {
      return res.status(404).json({ error: 'Attendance not found' });
    }

    const oldValue = { status: attendance.status, late_minutes: attendance.late_minutes };

    if (status !== undefined) {
      if (![0, 1, 2, 3, 4].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
      }
      attendance.status = status;
    }
    if (late_minutes !== undefined) {
      attendance.late_minutes = late_minutes;
    }

    await attendance.save();

    const newValue = { status: attendance.status, late_minutes: attendance.late_minutes };

    res.json(attendance);
  } catch (error) {
    next(error);
  }
};

// 과목별 출석 현황
export const getAttendanceByCourse = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const attendances = await Attendance.findAll({
      include: [{
        model: ClassSession,
        as: 'session',
        where: { course_id: courseId },
        attributes: ['id', 'week', 'session_number', 'start_at']
      }, {
        model: User,
        as: 'student',
        attributes: ['id', 'name', 'student_id']
      }],
      order: [['session', 'week', 'ASC'], ['session', 'session_number', 'ASC']]
    });

    res.json(attendances);
  } catch (error) {
    next(error);
  }
};

