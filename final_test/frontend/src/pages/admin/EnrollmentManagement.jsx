import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

const EnrollmentManagement = () => {
  const { accessToken } = useAuth();
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedCourse) {
      fetchEnrollments();
    }
  }, [selectedCourse]);

  const fetchData = async () => {
    try {
      const [coursesRes, studentsRes] = await Promise.all([
        axios.get('/api/courses', { headers: { Authorization: `Bearer ${accessToken}` } }),
        axios.get('/api/users', { headers: { Authorization: `Bearer ${accessToken}` } })
      ]);
      setCourses(coursesRes.data);
      setStudents(studentsRes.data.filter(u => u.role === 'Student'));
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setError('데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const fetchEnrollments = async () => {
    if (!selectedCourse) return;
    try {
      const response = await axios.get(`/api/enrollments/courses/${selectedCourse}/enrollments`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      setEnrollments(response.data);
    } catch (error) {
      console.error('Failed to fetch enrollments:', error);
    }
  };

  const handleEnroll = async (studentId) => {
    if (!selectedCourse) {
      setError('과목을 선택해주세요.');
      return;
    }

    try {
      await axios.post(`/api/enrollments/courses/${selectedCourse}/enrollments`, {
        user_id: studentId
      }, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      setSuccess('수강신청이 완료되었습니다.');
      setError('');
      fetchEnrollments();
    } catch (error) {
      setError(error.response?.data?.error || '수강신청에 실패했습니다.');
      setSuccess('');
    }
  };

  const handleUnenroll = async (enrollmentId) => {
    if (!window.confirm('정말 수강 취소하시겠습니까?')) return;

    try {
      await axios.delete(`/api/enrollments/${enrollmentId}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      setSuccess('수강 취소가 완료되었습니다.');
      setError('');
      fetchEnrollments();
    } catch (error) {
      setError(error.response?.data?.error || '수강 취소에 실패했습니다.');
      setSuccess('');
    }
  };

  if (loading) return <div>Loading...</div>;

  const enrolledStudentIds = enrollments.map(e => e.user_id);
  const availableStudents = students.filter(s => !enrolledStudentIds.includes(s.id));

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2>수강신청 관리</h2>
      </div>

      {error && (
        <div style={{ padding: '0.75rem', marginBottom: '1rem', backgroundColor: '#fee2e2', color: '#dc2626', borderRadius: '0.375rem' }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{ padding: '0.75rem', marginBottom: '1rem', backgroundColor: '#dcfce7', color: '#16a34a', borderRadius: '0.375rem' }}>
          {success}
        </div>
      )}

      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem' }}>과목 선택</label>
        <select
          className="input"
          value={selectedCourse || ''}
          onChange={(e) => setSelectedCourse(parseInt(e.target.value))}
        >
          <option value="">과목을 선택하세요</option>
          {courses.map(course => (
            <option key={course.id} value={course.id}>
              {course.title} ({course.code}-{course.section})
            </option>
          ))}
        </select>
      </div>

      {selectedCourse && (
        <>
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ marginBottom: '0.75rem' }}>수강 중인 학생</h3>
            {enrollments.length === 0 ? (
              <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-secondary)', backgroundColor: 'var(--gray-50)', borderRadius: '0.375rem' }}>
                수강 중인 학생이 없습니다.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border)' }}>
                      <th style={{ padding: '0.75rem', textAlign: 'left' }}>학번</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left' }}>이름</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left' }}>이메일</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left' }}>작업</th>
                    </tr>
                  </thead>
                  <tbody>
                    {enrollments.map((enrollment) => (
                      <tr key={enrollment.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '0.75rem' }}>{enrollment.user?.student_id || 'N/A'}</td>
                        <td style={{ padding: '0.75rem' }}>{enrollment.user?.name || 'N/A'}</td>
                        <td style={{ padding: '0.75rem' }}>{enrollment.user?.email || 'N/A'}</td>
                        <td style={{ padding: '0.75rem' }}>
                          <button
                            className="btn"
                            onClick={() => handleUnenroll(enrollment.id)}
                            style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem', backgroundColor: 'var(--error)', color: 'white' }}
                          >
                            수강 취소
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div>
            <h3 style={{ marginBottom: '0.75rem' }}>수강신청 가능한 학생</h3>
            {availableStudents.length === 0 ? (
              <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-secondary)', backgroundColor: 'var(--gray-50)', borderRadius: '0.375rem' }}>
                모든 학생이 이미 수강 중입니다.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border)' }}>
                      <th style={{ padding: '0.75rem', textAlign: 'left' }}>학번</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left' }}>이름</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left' }}>이메일</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left' }}>작업</th>
                    </tr>
                  </thead>
                  <tbody>
                    {availableStudents.map((student) => (
                      <tr key={student.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '0.75rem' }}>{student.student_id || 'N/A'}</td>
                        <td style={{ padding: '0.75rem' }}>{student.name}</td>
                        <td style={{ padding: '0.75rem' }}>{student.email}</td>
                        <td style={{ padding: '0.75rem' }}>
                          <button
                            className="btn"
                            onClick={() => handleEnroll(student.id)}
                            style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem' }}
                          >
                            수강신청
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default EnrollmentManagement;

