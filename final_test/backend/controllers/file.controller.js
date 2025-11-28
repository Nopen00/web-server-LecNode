import { File } from '../models/index.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const uploadFile = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'File is required' });
    }

    const { related_type, related_id } = req.body;

    const file = await File.create({
      original_name: req.file.originalname,
      stored_path: req.file.path,
      mime_type: req.file.mimetype,
      size: req.file.size,
      uploader_id: req.user.id,
      related_type: related_type || null,
      related_id: related_id || null
    });

    res.status(201).json(file);
  } catch (error) {
    next(error);
  }
};

export const downloadFile = async (req, res, next) => {
  try {
    const file = await File.findByPk(req.params.id);
    
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // 파일 접근 권한 확인 (간단한 버전, 나중에 세밀하게 구현)
    // TODO: 과제 파일은 업로더/교원/관리자만, 게시판 파일은 수강생 모두

    const filePath = path.join(__dirname, '../', file.stored_path);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found on disk' });
    }

    res.download(filePath, file.original_name);
  } catch (error) {
    next(error);
  }
};

export const deleteFile = async (req, res, next) => {
  try {
    const file = await File.findByPk(req.params.id);
    
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // 업로더만 삭제 가능
    if (file.uploader_id !== req.user.id && req.user.role !== 'Admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // 파일 삭제
    const filePath = path.join(__dirname, '../', file.stored_path);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await file.destroy();
    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    next(error);
  }
};

