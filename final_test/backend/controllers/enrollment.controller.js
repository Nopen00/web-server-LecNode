import { Enrollment, User, Course } from '../models/index.js';
import * as XLSX from 'xlsx';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import multer from 'multer';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Multer 설정
const storage = multer.memoryStorage();
const upload = multer({ storage });

// 수강생 목록 조회
export const getEnrollmentsByCourse = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const enrollments = await Enrollment.findAll({
      where: { course_id: courseId },
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'name', 'email', 'student_id']
      }]
    });
    res.json(enrollments);
  } catch (error) {
    next(error);
  }
};

// 수강신청 생성
export const createEnrollment = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const { user_id, role } = req.body;

    if (!user_id) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // 중복 확인
    const existing = await Enrollment.findOne({
      where: { course_id: courseId, user_id }
    });

    if (existing) {
      return res.status(409).json({ error: 'Already enrolled' });
    }

    const enrollment = await Enrollment.create({
      course_id: courseId,
      user_id,
      role: role || 'student'
    });

    const enrollmentWithUser = await Enrollment.findByPk(enrollment.id, {
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'name', 'email', 'student_id']
      }]
    });

    res.status(201).json(enrollmentWithUser);
  } catch (error) {
    next(error);
  }
};

// 수강 취소
export const deleteEnrollment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const enrollment = await Enrollment.findByPk(id);
    
    if (!enrollment) {
      return res.status(404).json({ error: 'Enrollment not found' });
    }

    await enrollment.destroy();
    res.json({ message: 'Enrollment deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// 엑셀 일괄 등록 (20점 중 5점)
export const importEnrollments = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'File is required' });
    }

    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    const results = {
      success: [],
      errors: []
    };

    for (const row of data) {
      try {
        // 엑셀 컬럼명: course_id, user_id (또는 student_id, email 등)
        const courseId = row.course_id || row.courseId;
        const userId = row.user_id || row.userId;
        const studentId = row.student_id || row.studentId;
        const email = row.email;

        if (!courseId) {
          results.errors.push({ row, error: 'Course ID is required' });
          continue;
        }

        let userIdToUse = userId;

        // student_id나 email로 사용자 찾기
        if (!userIdToUse) {
          if (studentId) {
            const user = await User.findOne({ where: { student_id: studentId } });
            if (user) userIdToUse = user.id;
          } else if (email) {
            const user = await User.findOne({ where: { email } });
            if (user) userIdToUse = user.id;
          }
        }

        if (!userIdToUse) {
          results.errors.push({ row, error: 'User not found' });
          continue;
        }

        // 중복 확인
        const existing = await Enrollment.findOne({
          where: { course_id: courseId, user_id: userIdToUse }
        });

        if (existing) {
          results.errors.push({ row, error: 'Already enrolled' });
          continue;
        }

        await Enrollment.create({
          course_id: courseId,
          user_id: userIdToUse,
          role: row.role || 'student'
        });

        results.success.push({ course_id: courseId, user_id: userIdToUse });
      } catch (error) {
        results.errors.push({ row, error: error.message });
      }
    }

    res.json({
      message: 'Import completed',
      success_count: results.success.length,
      error_count: results.errors.length,
      results
    });
  } catch (error) {
    next(error);
  }
};

// Multer 미들웨어 export
export const uploadMiddleware = upload.single('file');

