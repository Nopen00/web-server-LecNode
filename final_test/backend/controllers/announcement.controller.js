import { Announcement, Course, User } from '../models/index.js';

export const getAnnouncementsByCourse = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const announcements = await Announcement.findAll({
      where: { course_id: courseId },
      include: [{
        model: User,
        as: 'instructor',
        attributes: ['id', 'name', 'email']
      }],
      order: [['is_pinned', 'DESC'], ['created_at', 'DESC']]
    });
    res.json(announcements);
  } catch (error) {
    next(error);
  }
};

export const getAnnouncementById = async (req, res, next) => {
  try {
    const announcement = await Announcement.findByPk(req.params.id, {
      include: [{
        model: User,
        as: 'instructor',
        attributes: ['id', 'name', 'email']
      }]
    });

    if (!announcement) {
      return res.status(404).json({ error: 'Announcement not found' });
    }

    res.json(announcement);
  } catch (error) {
    next(error);
  }
};

export const createAnnouncement = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const { title, content, is_pinned } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    const announcement = await Announcement.create({
      course_id: courseId,
      instructor_id: req.user.id,
      title,
      content,
      is_pinned: is_pinned || false
    });

    const announcementWithInstructor = await Announcement.findByPk(announcement.id, {
      include: [{
        model: User,
        as: 'instructor',
        attributes: ['id', 'name', 'email']
      }]
    });

    res.status(201).json(announcementWithInstructor);
  } catch (error) {
    next(error);
  }
};

export const updateAnnouncement = async (req, res, next) => {
  try {
    const { id } = req.params;
    const announcement = await Announcement.findByPk(id);
    
    if (!announcement) {
      return res.status(404).json({ error: 'Announcement not found' });
    }

    // 작성자 또는 관리자만 수정 가능
    if (announcement.instructor_id !== req.user.id && req.user.role !== 'Admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { title, content, is_pinned } = req.body;

    if (title) announcement.title = title;
    if (content) announcement.content = content;
    if (is_pinned !== undefined) announcement.is_pinned = is_pinned;

    await announcement.save();

    const announcementWithInstructor = await Announcement.findByPk(announcement.id, {
      include: [{
        model: User,
        as: 'instructor',
        attributes: ['id', 'name', 'email']
      }]
    });

    res.json(announcementWithInstructor);
  } catch (error) {
    next(error);
  }
};

export const deleteAnnouncement = async (req, res, next) => {
  try {
    const { id } = req.params;
    const announcement = await Announcement.findByPk(id);
    
    if (!announcement) {
      return res.status(404).json({ error: 'Announcement not found' });
    }

    // 작성자 또는 관리자만 삭제 가능
    if (announcement.instructor_id !== req.user.id && req.user.role !== 'Admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    await announcement.destroy();
    res.json({ message: 'Announcement deleted successfully' });
  } catch (error) {
    next(error);
  }
};

