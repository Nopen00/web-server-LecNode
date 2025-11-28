import { Attendance, ClassSession, User, AttendancePolicy, Course, Enrollment } from '../models/index.js';
import { Op } from 'sequelize';
import { createAuditLog } from '../middleware/auditLog.js';

// 출석 체크 (학생)
export const attendSession = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { attendance_code, location } = req.body;
    const studentId = req.user.id;

    // 학생만 출석 체크 가능
    if (req.user.role !== 'Student') {
      return res.status(403).json({ error: 'Only students can check attendance' });
    }

    // 세션 확인
    const session = await ClassSession.findByPk(id, {
      include: [{ model: Course, as: 'course' }]
    });
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // 수강 신청 확인
    const enrollment = await Enrollment.findOne({
      where: { course_id: session.course_id, user_id: studentId }
    });
    if (!enrollment) {
      return res.status(403).json({ error: 'You are not enrolled in this course' });
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
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: 'Already attended' });
    }
    next(error);
  }
};

// 세션별 출석 현황 조회
export const getAttendanceBySession = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // 세션 확인
    const session = await ClassSession.findByPk(id, {
      include: [{ model: Course, as: 'course' }]
    });
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // 교원은 자신의 과목만 조회 가능
    if (req.user.role === 'Instructor' && session.course.instructor_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only view attendance for your own courses' });
    }

    const attendances = await Attendance.findAll({
      where: { session_id: id },
      include: [{
        model: User,
        as: 'student',
        attributes: ['id', 'name', 'student_id', 'email']
      }],
      order: [['student', 'student_id', 'ASC']]
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

// 출석 정정 (교원) - 호명 방식 포함
export const updateAttendance = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, late_minutes } = req.body;

    const attendance = await Attendance.findByPk(id, {
      include: [{
        model: ClassSession,
        as: 'session',
        include: [{ model: Course, as: 'course' }]
      }]
    });
    
    if (!attendance) {
      return res.status(404).json({ error: 'Attendance not found' });
    }

    // 교원은 자신의 과목만 출석 정정 가능
    if (req.user.role === 'Instructor' && attendance.session.course.instructor_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only update attendance for your own courses' });
    }

    const oldValue = { 
      status: attendance.status, 
      late_minutes: attendance.late_minutes,
      checked_at: attendance.checked_at
    };

    if (status !== undefined) {
      if (![0, 1, 2, 3, 4].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
      }
      attendance.status = status;
    }
    if (late_minutes !== undefined) {
      attendance.late_minutes = late_minutes;
    }

    // 호명 방식으로 출석 체크하는 경우
    if (!attendance.checked_at && status !== undefined && status !== 0) {
      attendance.checked_at = new Date();
    }

    await attendance.save();

    // 감사 로그 기록
    await createAuditLog(
      req,
      'attendance_change',
      'Attendance',
      attendance.id,
      oldValue,
      { 
        status: attendance.status, 
        late_minutes: attendance.late_minutes,
        checked_at: attendance.checked_at
      }
    );

    res.json(attendance);
  } catch (error) {
    next(error);
  }
};

// 호명 방식 출석 체크 (교원)
export const markAttendanceByRollCall = async (req, res, next) => {
  try {
    const { id } = req.params; // session_id
    const { student_id, status, late_minutes } = req.body;

    // 세션 확인
    const session = await ClassSession.findByPk(id, {
      include: [{ model: Course, as: 'course' }]
    });
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // 교원은 자신의 과목만 출석 체크 가능
    if (req.user.role === 'Instructor' && session.course.instructor_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only mark attendance for your own courses' });
    }

    // 학생 확인
    const student = await User.findByPk(student_id);
    if (!student || student.role !== 'Student') {
      return res.status(400).json({ error: 'Invalid student' });
    }

    // 수강 신청 확인
    const enrollment = await Enrollment.findOne({
      where: { course_id: session.course_id, user_id: student_id }
    });
    if (!enrollment) {
      return res.status(400).json({ error: 'Student is not enrolled in this course' });
    }

    // 출석 상태 검증
    if (status !== undefined && ![0, 1, 2, 3, 4].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    // 기존 출석 기록 확인
    let attendance = await Attendance.findOne({
      where: { session_id: id, student_id }
    });

    const now = new Date();
    const oldValue = attendance ? {
      status: attendance.status,
      late_minutes: attendance.late_minutes,
      checked_at: attendance.checked_at
    } : null;

    if (attendance) {
      // 기존 기록 업데이트
      if (status !== undefined) attendance.status = status;
      if (late_minutes !== undefined) attendance.late_minutes = late_minutes;
      if (!attendance.checked_at) attendance.checked_at = now;
      await attendance.save();
    } else {
      // 새 출석 기록 생성
      attendance = await Attendance.create({
        session_id: id,
        student_id,
        status: status || 1,
        checked_at: now,
        late_minutes: late_minutes || 0
      });
    }

    // 감사 로그 기록
    await createAuditLog(
      req,
      'attendance_roll_call',
      'Attendance',
      attendance.id,
      oldValue,
      {
        status: attendance.status,
        late_minutes: attendance.late_minutes,
        checked_at: attendance.checked_at
      }
    );

    res.json(attendance);
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: 'Attendance already exists' });
    }
    next(error);
  }
};

// 과목별 출석 현황
export const getAttendanceByCourse = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    
    // 과목 확인
    const course = await Course.findByPk(courseId);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // 교원은 자신의 과목만 조회 가능, 학생은 자신의 출석만 조회 가능
    if (req.user.role === 'Instructor' && course.instructor_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only view attendance for your own courses' });
    }

    const where = {};
    if (req.user.role === 'Student') {
      where.student_id = req.user.id;
    }

    const attendances = await Attendance.findAll({
      where,
      include: [{
        model: ClassSession,
        as: 'session',
        where: { course_id: courseId },
        attributes: ['id', 'week', 'session_number', 'start_at', 'status']
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

