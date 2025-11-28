import { Semester } from '../models/index.js';

export const getSemesters = async (req, res, next) => {
  try {
    const semesters = await Semester.findAll({
      order: [['year', 'DESC'], ['term', 'ASC']]
    });
    res.json(semesters);
  } catch (error) {
    next(error);
  }
};

export const getSemesterById = async (req, res, next) => {
  try {
    const semester = await Semester.findByPk(req.params.id);
    if (!semester) {
      return res.status(404).json({ error: 'Semester not found' });
    }
    res.json(semester);
  } catch (error) {
    next(error);
  }
};

export const createSemester = async (req, res, next) => {
  try {
    const { year, term, start_date, end_date } = req.body;
    
    if (!year || !term || !start_date || !end_date) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const semester = await Semester.create({ year, term, start_date, end_date });
    res.status(201).json(semester);
  } catch (error) {
    next(error);
  }
};

export const updateSemester = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { year, term, start_date, end_date } = req.body;

    const semester = await Semester.findByPk(id);
    if (!semester) {
      return res.status(404).json({ error: 'Semester not found' });
    }

    if (year) semester.year = year;
    if (term) semester.term = term;
    if (start_date) semester.start_date = start_date;
    if (end_date) semester.end_date = end_date;

    await semester.save();
    res.json(semester);
  } catch (error) {
    next(error);
  }
};

export const deleteSemester = async (req, res, next) => {
  try {
    const { id } = req.params;
    const semester = await Semester.findByPk(id);
    
    if (!semester) {
      return res.status(404).json({ error: 'Semester not found' });
    }

    await semester.destroy();
    res.json({ message: 'Semester deleted successfully' });
  } catch (error) {
    next(error);
  }
};

