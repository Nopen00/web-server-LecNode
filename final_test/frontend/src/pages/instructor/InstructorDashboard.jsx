import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import SessionManagement from './SessionManagement';
import AttendanceManagement from './AttendanceManagement';
import StudentManagement from './StudentManagement';

const InstructorDashboard = () => {
  const { logout, accessToken } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [activeTab, setActiveTab] = useState('sessions');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await axios.get('/api/courses', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      setCourses(response.data);
      if (response.data.length > 0 && !selectedCourse) {
        setSelectedCourse(response.data[0].id);
      }
    } catch (error) {
      console.error('Failed to fetch courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (loading) return <div className="container">Loading...</div>;

  return (
    <div className="container">
      <div className="header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1>교원 대시보드</h1>
        <button className="btn" onClick={handleLogout}>
          로그아웃
        </button>
      </div>

      {courses.length === 0 ? (
        <div className="card">
          <p>담당 과목이 없습니다.</p>
        </div>
      ) : (
        <>
          <div className="card" style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>과목 선택</label>
            <select
              className="input"
              value={selectedCourse || ''}
              onChange={(e) => setSelectedCourse(parseInt(e.target.value))}
            >
              {courses.map(course => (
                <option key={course.id} value={course.id}>
                  {course.title} ({course.code}-{course.section})
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '2px solid var(--border)' }}>
              <button
                className="btn"
                onClick={() => setActiveTab('sessions')}
                style={{
                  backgroundColor: activeTab === 'sessions' ? 'var(--primary)' : 'transparent',
                  color: activeTab === 'sessions' ? 'white' : 'var(--text)',
                  border: 'none',
                  borderRadius: '0.375rem 0.375rem 0 0',
                  padding: '0.75rem 1rem'
                }}
              >
                수업 세션 관리
              </button>
              <button
                className="btn"
                onClick={() => setActiveTab('attendance')}
                style={{
                  backgroundColor: activeTab === 'attendance' ? 'var(--primary)' : 'transparent',
                  color: activeTab === 'attendance' ? 'white' : 'var(--text)',
                  border: 'none',
                  borderRadius: '0.375rem 0.375rem 0 0',
                  padding: '0.75rem 1rem'
                }}
              >
                출석 관리
              </button>
              <button
                className="btn"
                onClick={() => setActiveTab('students')}
                style={{
                  backgroundColor: activeTab === 'students' ? 'var(--primary)' : 'transparent',
                  color: activeTab === 'students' ? 'white' : 'var(--text)',
                  border: 'none',
                  borderRadius: '0.375rem 0.375rem 0 0',
                  padding: '0.75rem 1rem'
                }}
              >
                수강생 관리
              </button>
            </div>
          </div>

          {selectedCourse && (
            <>
              {activeTab === 'sessions' && <SessionManagement courseId={selectedCourse} />}
              {activeTab === 'attendance' && <AttendanceManagement courseId={selectedCourse} />}
              {activeTab === 'students' && <StudentManagement courseId={selectedCourse} />}
            </>
          )}
        </>
      )}
    </div>
  );
};

export default InstructorDashboard;

