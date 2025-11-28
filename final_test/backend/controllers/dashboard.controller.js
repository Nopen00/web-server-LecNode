import { User, Course, Attendance, ClassSession, ExcuseRequest, Appeal, Notification, Enrollment, AuditLog } from '../models/index.js';
import { Op } from 'sequelize';

export const getDashboard = async (req, res, next) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    if (user.role === 'Student') {
      // 학생 대시보드
      const enrollments = await Enrollment.findAll({
        where: { user_id: user.id },
        include: [{
          model: Course,
          as: 'course',
          include: [{
            model: ClassSession,
            as: 'sessions'
          }]
        }]
      });

      const courseIds = enrollments.map(e => e.course_id);
      const sessions = courseIds.length > 0 
        ? await ClassSession.findAll({
            where: { course_id: { [Op.in]: courseIds } }
          })
        : [];
      const sessionIds = sessions.map(s => s.id);

      const attendances = sessionIds.length > 0
        ? await Attendance.findAll({
            where: { student_id: user.id, session_id: { [Op.in]: sessionIds } }
          })
        : [];

      const pendingExcuses = await ExcuseRequest.count({
        where: { student_id: user.id, status: 'pending' }
      });

      const unreadNotifications = await Notification.count({
        where: { user_id: user.id, is_read: false }
      });

      res.json({
        role: 'Student',
        courses: enrollments.length,
        totalSessions: sessions.length,
        attendances: attendances.length,
        pendingExcuses,
        unreadNotifications,
        recentAttendances: attendances.slice(0, 5)
      });
    } else if (user.role === 'Instructor') {
      // 교원 대시보드
      const courses = await Course.findAll({
        where: { instructor_id: user.id }
      });
      const courseIds = courses.map(c => c.id);

      const sessions = courseIds.length > 0
        ? await ClassSession.findAll({
            where: { course_id: { [Op.in]: courseIds } }
          })
        : [];

      const pendingExcuses = courseIds.length > 0
        ? await ExcuseRequest.count({
            include: [{
              model: ClassSession,
              as: 'session',
              where: { course_id: { [Op.in]: courseIds } }
            }],
            where: { status: 'pending' }
          })
        : 0;

      const pendingAppeals = courseIds.length > 0
        ? await Appeal.count({
            include: [{
              model: Attendance,
              as: 'attendance',
              include: [{
                model: ClassSession,
                as: 'session',
                where: { course_id: { [Op.in]: courseIds } }
              }]
            }],
            where: { status: 'pending' }
          })
        : 0;

      const unreadNotifications = await Notification.count({
        where: { user_id: user.id, is_read: false }
      });

      res.json({
        role: 'Instructor',
        courses: courses.length,
        totalSessions: sessions.length,
        pendingExcuses,
        pendingAppeals,
        unreadNotifications,
        recentCourses: courses.slice(0, 5)
      });
    } else if (user.role === 'Admin') {
      // 관리자 대시보드
      const totalUsers = await User.count();
      const totalCourses = await Course.count();
      const totalSessions = await ClassSession.count();
      const totalAttendances = await Attendance.count();

      const recentAuditLogs = await AuditLog.findAll({
        limit: 10,
        order: [['createdAt', 'DESC']],
        include: [{
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email']
        }]
      });

      res.json({
        role: 'Admin',
        totalUsers,
        totalCourses,
        totalSessions,
        totalAttendances,
        recentAuditLogs
      });
    } else {
      // 알 수 없는 역할
      return res.status(400).json({ error: 'Unknown user role' });
    }
  } catch (error) {
    console.error('Dashboard error:', error);
    next(error);
  }
};

