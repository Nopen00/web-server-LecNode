import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

const CourseManagement = () => {
  const { accessToken } = useAuth();
  const [courses, setCourses] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    code: '',
    section: 1,
    instructor_id: '',
    semester_id: '',
    department_id: '',
    room: ''
  });
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [coursesRes, deptRes, semRes, userRes] = await Promise.all([
        axios.get('/api/courses', { headers: { Authorization: `Bearer ${accessToken}` } }),
        axios.get('/api/departments', { headers: { Authorization: `Bearer ${accessToken}` } }),
        axios.get('/api/semesters', { headers: { Authorization: `Bearer ${accessToken}` } }),
        axios.get('/api/users', { headers: { Authorization: `Bearer ${accessToken}` } })
      ]);
      setCourses(coursesRes.data);
      setDepartments(deptRes.data);
      setSemesters(semRes.data);
      setInstructors(userRes.data.filter(u => u.role === 'Instructor'));
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setError('데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (editingId) {
        await axios.put(`/api/courses/${editingId}`, formData, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
      } else {
        await axios.post('/api/courses', formData, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
      }
      setShowForm(false);
      setEditingId(null);
      setFormData({ title: '', code: '', section: 1, instructor_id: '', semester_id: '', department_id: '', room: '' });
      fetchData();
    } catch (error) {
      setError(error.response?.data?.error || '저장에 실패했습니다.');
    }
  };

  const handleEdit = (course) => {
    setFormData({
      title: course.title,
      code: course.code,
      section: course.section,
      instructor_id: course.instructor_id.toString(),
      semester_id: course.semester_id.toString(),
      department_id: course.department_id.toString(),
      room: course.room || ''
    });
    setEditingId(course.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return;

    try {
      await axios.delete(`/api/courses/${id}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      fetchData();
    } catch (error) {
      setError(error.response?.data?.error || '삭제에 실패했습니다.');
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2>과목 관리</h2>
        <button className="btn" onClick={() => { setShowForm(true); setEditingId(null); setFormData({ title: '', code: '', section: 1, instructor_id: '', semester_id: '', department_id: '', room: '' }); }}>
          + 과목 추가
        </button>
      </div>

      {error && (
        <div style={{ padding: '0.75rem', marginBottom: '1rem', backgroundColor: '#fee2e2', color: '#dc2626', borderRadius: '0.375rem' }}>
          {error}
        </div>
      )}

      {showForm && (
        <div className="card" style={{ marginBottom: '1rem', backgroundColor: 'var(--gray-50)' }}>
          <h3>{editingId ? '과목 수정' : '과목 추가'}</h3>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>과목명</label>
              <input
                type="text"
                className="input"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>과목 코드</label>
              <input
                type="text"
                className="input"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                required
              />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>분반 (1-4)</label>
              <input
                type="number"
                className="input"
                value={formData.section}
                onChange={(e) => setFormData({ ...formData, section: parseInt(e.target.value) })}
                required
                min="1"
                max="4"
              />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>담당 교원</label>
              <select
                className="input"
                value={formData.instructor_id}
                onChange={(e) => setFormData({ ...formData, instructor_id: e.target.value })}
                required
              >
                <option value="">선택하세요</option>
                {instructors.map(inst => (
                  <option key={inst.id} value={inst.id}>{inst.name} ({inst.email})</option>
                ))}
              </select>
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>학기</label>
              <select
                className="input"
                value={formData.semester_id}
                onChange={(e) => setFormData({ ...formData, semester_id: e.target.value })}
                required
              >
                <option value="">선택하세요</option>
                {semesters.map(sem => (
                  <option key={sem.id} value={sem.id}>{sem.year}년 {sem.term}</option>
                ))}
              </select>
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>학과</label>
              <select
                className="input"
                value={formData.department_id}
                onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                required
              >
                <option value="">선택하세요</option>
                {departments.map(dept => (
                  <option key={dept.id} value={dept.id}>{dept.name} ({dept.code})</option>
                ))}
              </select>
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>강의실 (선택)</label>
              <input
                type="text"
                className="input"
                value={formData.room}
                onChange={(e) => setFormData({ ...formData, room: e.target.value })}
              />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="submit" className="btn">저장</button>
              <button type="button" className="btn" onClick={() => { setShowForm(false); setEditingId(null); setFormData({ title: '', code: '', section: 1, instructor_id: '', semester_id: '', department_id: '', room: '' }); }}>
                취소
              </button>
            </div>
          </form>
        </div>
      )}

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border)' }}>
              <th style={{ padding: '0.75rem', textAlign: 'left' }}>ID</th>
              <th style={{ padding: '0.75rem', textAlign: 'left' }}>과목명</th>
              <th style={{ padding: '0.75rem', textAlign: 'left' }}>코드</th>
              <th style={{ padding: '0.75rem', textAlign: 'left' }}>분반</th>
              <th style={{ padding: '0.75rem', textAlign: 'left' }}>교원</th>
              <th style={{ padding: '0.75rem', textAlign: 'left' }}>작업</th>
            </tr>
          </thead>
          <tbody>
            {courses.map((course) => (
              <tr key={course.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '0.75rem' }}>{course.id}</td>
                <td style={{ padding: '0.75rem' }}>{course.title}</td>
                <td style={{ padding: '0.75rem' }}>{course.code}</td>
                <td style={{ padding: '0.75rem' }}>{course.section}</td>
                <td style={{ padding: '0.75rem' }}>{course.instructor?.name || 'N/A'}</td>
                <td style={{ padding: '0.75rem' }}>
                  <button className="btn" onClick={() => handleEdit(course)} style={{ marginRight: '0.5rem', padding: '0.25rem 0.75rem', fontSize: '0.875rem' }}>
                    수정
                  </button>
                  <button className="btn" onClick={() => handleDelete(course.id)} style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem', backgroundColor: 'var(--error)', color: 'white' }}>
                    삭제
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {courses.length === 0 && (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            등록된 과목이 없습니다.
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseManagement;

