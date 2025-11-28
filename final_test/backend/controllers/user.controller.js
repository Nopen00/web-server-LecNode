import { User, Department } from '../models/index.js';
import { hashPassword, validatePassword } from '../utils/password.js';

// 사용자 목록 조회
export const getUsers = async (req, res, next) => {
  try {
    const users = await User.findAll({
      include: [{
        model: Department,
        as: 'department',
        attributes: ['id', 'name', 'code']
      }],
      attributes: { exclude: ['password_hash', 'refresh_token'] }
    });

    res.json(users);
  } catch (error) {
    next(error);
  }
};

// 사용자 상세 조회
export const getUserById = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id, {
      include: [{
        model: Department,
        as: 'department',
        attributes: ['id', 'name', 'code']
      }],
      attributes: { exclude: ['password_hash', 'refresh_token'] }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    next(error);
  }
};

// 사용자 생성
export const createUser = async (req, res, next) => {
  try {
    const { role, name, email, password, student_id, department_id } = req.body;

    // 필수 필드 검증
    if (!role || !name || !email || !password) {
      return res.status(400).json({ error: 'Required fields are missing' });
    }

    // 비밀번호 검증
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({ error: passwordValidation.message });
    }

    // 이메일 중복 확인
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ error: 'Email already exists' });
    }

    // 비밀번호 해싱
    const password_hash = await hashPassword(password);

    // 사용자 생성
    const user = await User.create({
      role,
      name,
      email,
      password_hash,
      student_id: student_id || null,
      department_id: department_id || null
    });

    // 비밀번호 제외하고 반환
    const userData = user.toJSON();
    delete userData.password_hash;
    delete userData.refresh_token;

    res.status(201).json(userData);
  } catch (error) {
    next(error);
  }
};

// 사용자 수정
export const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, email, password, student_id, department_id } = req.body;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // 비밀번호 변경이 있는 경우
    if (password) {
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.valid) {
        return res.status(400).json({ error: passwordValidation.message });
      }
      user.password_hash = await hashPassword(password);
    }

    // 다른 필드 업데이트
    if (name) user.name = name;
    if (email) {
      // 이메일 중복 확인 (자기 자신 제외)
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser && existingUser.id !== parseInt(id)) {
        return res.status(409).json({ error: 'Email already exists' });
      }
      user.email = email;
    }
    if (student_id !== undefined) user.student_id = student_id;
    if (department_id !== undefined) user.department_id = department_id;

    await user.save();

    // 비밀번호 제외하고 반환
    const userData = user.toJSON();
    delete userData.password_hash;
    delete userData.refresh_token;

    res.json(userData);
  } catch (error) {
    next(error);
  }
};

// 사용자 삭제
export const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await user.destroy();

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// 사용자 권한 변경
export const updateUserRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!role || !['Admin', 'Instructor', 'Student'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.role = role;
    await user.save();

    const userData = user.toJSON();
    delete userData.password_hash;
    delete userData.refresh_token;

    res.json(userData);
  } catch (error) {
    next(error);
  }
};

