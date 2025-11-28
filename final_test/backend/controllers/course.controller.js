import { Course, User, Department, Semester } from '../models/index.js';

export const getCourses = async (req, res, next) => {
  try {
    const courses = await Course.findAll({
      include: [
        {
          model: User,
          as: 'instructor',
          attributes: ['id', 'name', 'email']
        },
        {
          model: Department,
          as: 'department',
          attributes: ['id', 'name', 'code']
        },
        {
          model: Semester,
          as: 'semester',
          attributes: ['id', 'year', 'term']
        }
      ]
    });
    res.json(courses);
  } catch (error) {
    next(error);
  }
};

export const getCourseById = async (req, res, next) => {
  try {
    const course = await Course.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'instructor',
          attributes: ['id', 'name', 'email']
        },
        {
          model: Department,
          as: 'department',
          attributes: ['id', 'name', 'code']
        },
        {
          model: Semester,
          as: 'semester',
          attributes: ['id', 'year', 'term', 'start_date', 'end_date']
        }
      ]
    });

    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    res.json(course);
  } catch (error) {
    next(error);
  }
};

export const createCourse = async (req, res, next) => {
  try {
    const { title, code, section, instructor_id, semester_id, department_id, room } = req.body;
    
    if (!title || !code || !section || !instructor_id || !semester_id || !department_id) {
      return res.status(400).json({ error: 'Required fields are missing' });
    }

    if (section < 1 || section > 4) {
      return res.status(400).json({ error: 'Section must be between 1 and 4' });
    }

    const course = await Course.create({
      title,
      code,
      section,
      instructor_id,
      semester_id,
      department_id,
      room: room || null
    });

    const courseWithRelations = await Course.findByPk(course.id, {
      include: [
        { model: User, as: 'instructor', attributes: ['id', 'name', 'email'] },
        { model: Department, as: 'department', attributes: ['id', 'name', 'code'] },
        { model: Semester, as: 'semester', attributes: ['id', 'year', 'term'] }
      ]
    });

    res.status(201).json(courseWithRelations);
  } catch (error) {
    next(error);
  }
};

export const updateCourse = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, code, section, instructor_id, semester_id, department_id, room } = req.body;

    const course = await Course.findByPk(id);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    if (title) course.title = title;
    if (code) course.code = code;
    if (section !== undefined) {
      if (section < 1 || section > 4) {
        return res.status(400).json({ error: 'Section must be between 1 and 4' });
      }
      course.section = section;
    }
    if (instructor_id) course.instructor_id = instructor_id;
    if (semester_id) course.semester_id = semester_id;
    if (department_id) course.department_id = department_id;
    if (room !== undefined) course.room = room;

    await course.save();

    const courseWithRelations = await Course.findByPk(course.id, {
      include: [
        { model: User, as: 'instructor', attributes: ['id', 'name', 'email'] },
        { model: Department, as: 'department', attributes: ['id', 'name', 'code'] },
        { model: Semester, as: 'semester', attributes: ['id', 'year', 'term'] }
      ]
    });

    res.json(courseWithRelations);
  } catch (error) {
    next(error);
  }
};

export const deleteCourse = async (req, res, next) => {
  try {
    const { id } = req.params;
    const course = await Course.findByPk(id);
    
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    await course.destroy();
    res.json({ message: 'Course deleted successfully' });
  } catch (error) {
    next(error);
  }
};

