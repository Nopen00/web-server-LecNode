import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import AttendanceCheck from './AttendanceCheck';
import AttendanceHistory from './AttendanceHistory';
import CourseEnrollment from './CourseEnrollment';

const StudentDashboard = () => {
  const { logout, accessToken } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [activeTab, setActiveTab] = useState('check');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      // 학생의 수강 과목 가져오기
      const response = await axios.get('/api/enrollments/my', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      
      const coursesData = response.data.map(e => e.course).filter(c => c !== null);
      setCourses(coursesData);
      if (coursesData.length > 0 && !selectedCourse) {
        setSelectedCourse(coursesData[0].id);
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
        <h1>학생 대시보드</h1>
        <button className="btn" onClick={handleLogout}>
          로그아웃
        </button>
      </div>

      {courses.length === 0 ? (
        <div className="card">
          <p>수강 중인 과목이 없습니다.</p>
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
                onClick={() => setActiveTab('enrollment')}
                style={{
                  backgroundColor: activeTab === 'enrollment' ? 'var(--primary)' : 'transparent',
                  color: activeTab === 'enrollment' ? 'white' : 'var(--text)',
                  border: 'none',
                  borderRadius: '0.375rem 0.375rem 0 0',
                  padding: '0.75rem 1rem'
                }}
              >
                수강신청
              </button>
              <button
                className="btn"
                onClick={() => setActiveTab('check')}
                style={{
                  backgroundColor: activeTab === 'check' ? 'var(--primary)' : 'transparent',
                  color: activeTab === 'check' ? 'white' : 'var(--text)',
                  border: 'none',
                  borderRadius: '0.375rem 0.375rem 0 0',
                  padding: '0.75rem 1rem'
                }}
              >
                출석 체크
              </button>
              <button
                className="btn"
                onClick={() => setActiveTab('history')}
                style={{
                  backgroundColor: activeTab === 'history' ? 'var(--primary)' : 'transparent',
                  color: activeTab === 'history' ? 'white' : 'var(--text)',
                  border: 'none',
                  borderRadius: '0.375rem 0.375rem 0 0',
                  padding: '0.75rem 1rem'
                }}
              >
                출석 현황
              </button>
            </div>
          </div>

          {activeTab === 'enrollment' && <CourseEnrollment />}
          {selectedCourse && activeTab === 'check' && <AttendanceCheck courseId={selectedCourse} />}
          {selectedCourse && activeTab === 'history' && <AttendanceHistory courseId={selectedCourse} />}
        </>
      )}
    </div>
  );
};

export default StudentDashboard;

