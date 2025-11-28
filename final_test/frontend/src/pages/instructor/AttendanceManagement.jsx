import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

const AttendanceManagement = ({ courseId }) => {
  const { accessToken } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [attendances, setAttendances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (courseId) {
      fetchSessions();
    }
  }, [courseId]);

  useEffect(() => {
    if (selectedSession) {
      fetchAttendances();
    }
  }, [selectedSession]);

  const fetchSessions = async () => {
    try {
      const response = await axios.get(`/api/courses/${courseId}/sessions`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      setSessions(response.data || []);
      if (response.data && response.data.length > 0) {
        setSelectedSession(response.data[0].id);
      }
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
      setError('수업 세션 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendances = async () => {
    if (!selectedSession) return;
    try {
      const response = await axios.get(`/api/attendance/sessions/${selectedSession}/attendance`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      setAttendances(response.data);
    } catch (error) {
      console.error('Failed to fetch attendances:', error);
      setError('출석 현황을 불러오는데 실패했습니다.');
    }
  };

  const handleUpdateAttendance = async (attendanceId, status, lateMinutes) => {
    try {
      await axios.patch(`/api/attendance/${attendanceId}`, {
        status,
        late_minutes: lateMinutes
      }, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      fetchAttendances();
    } catch (error) {
      setError(error.response?.data?.error || '출석 수정에 실패했습니다.');
    }
  };

  const handleRollCall = async (studentId, status, lateMinutes = 0) => {
    try {
      await axios.post(`/api/attendance/sessions/${selectedSession}/roll-call`, {
        student_id: studentId,
        status,
        late_minutes: lateMinutes
      }, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      fetchAttendances();
    } catch (error) {
      setError(error.response?.data?.error || '호명 출석 체크에 실패했습니다.');
    }
  };

  if (loading) return <div>Loading...</div>;

  const statusLabels = {
    0: '미정',
    1: '출석',
    2: '지각',
    3: '결석',
    4: '공결'
  };

  return (
    <div className="card">
      <h2 style={{ marginBottom: '1rem' }}>출석 관리</h2>

      {error && (
        <div style={{ padding: '0.75rem', marginBottom: '1rem', backgroundColor: '#fee2e2', color: '#dc2626', borderRadius: '0.375rem' }}>
          {error}
        </div>
      )}

      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem' }}>세션 선택</label>
        <select
          className="input"
          value={selectedSession || ''}
          onChange={(e) => setSelectedSession(parseInt(e.target.value))}
        >
          {sessions.map(session => (
            <option key={session.id} value={session.id}>
              {session.week}주차 {session.session_number}회차 - {new Date(session.start_at).toLocaleString('ko-KR')}
            </option>
          ))}
        </select>
      </div>

      {selectedSession && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)' }}>
                <th style={{ padding: '0.75rem', textAlign: 'left' }}>학번</th>
                <th style={{ padding: '0.75rem', textAlign: 'left' }}>이름</th>
                <th style={{ padding: '0.75rem', textAlign: 'left' }}>상태</th>
                <th style={{ padding: '0.75rem', textAlign: 'left' }}>지각(분)</th>
                <th style={{ padding: '0.75rem', textAlign: 'left' }}>작업</th>
              </tr>
            </thead>
            <tbody>
              {attendances.map((attendance) => (
                <tr key={attendance.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '0.75rem' }}>{attendance.student?.student_id || 'N/A'}</td>
                  <td style={{ padding: '0.75rem' }}>{attendance.student?.name || 'N/A'}</td>
                  <td style={{ padding: '0.75rem' }}>
                    <select
                      value={attendance.status}
                      onChange={(e) => handleUpdateAttendance(attendance.id, parseInt(e.target.value), attendance.late_minutes)}
                      style={{ padding: '0.25rem', borderRadius: '0.25rem', border: '1px solid var(--border)' }}
                    >
                      <option value={0}>미정</option>
                      <option value={1}>출석</option>
                      <option value={2}>지각</option>
                      <option value={3}>결석</option>
                      <option value={4}>공결</option>
                    </select>
                  </td>
                  <td style={{ padding: '0.75rem' }}>
                    <input
                      type="number"
                      value={attendance.late_minutes || 0}
                      onChange={(e) => handleUpdateAttendance(attendance.id, attendance.status, parseInt(e.target.value) || 0)}
                      style={{ width: '60px', padding: '0.25rem', borderRadius: '0.25rem', border: '1px solid var(--border)' }}
                      min="0"
                    />
                  </td>
                  <td style={{ padding: '0.75rem' }}>
                    {!attendance.checked_at && (
                      <button
                        className="btn"
                        onClick={() => handleRollCall(attendance.student_id, 1, 0)}
                        style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem' }}
                      >
                        호명 출석
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {attendances.length === 0 && (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              출석 기록이 없습니다.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AttendanceManagement;

