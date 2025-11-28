import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

const AttendanceHistory = ({ courseId }) => {
  const { accessToken } = useAuth();
  const [attendances, setAttendances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (courseId) {
      fetchAttendances();
    }
  }, [courseId]);

  const fetchAttendances = async () => {
    try {
      const response = await axios.get(`/api/attendance/courses/${courseId}/attendance`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      setAttendances(response.data);
    } catch (error) {
      console.error('Failed to fetch attendances:', error);
      setError('출석 현황을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
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

  const statusColors = {
    0: '#9ca3af',
    1: '#16a34a',
    2: '#eab308',
    3: '#dc2626',
    4: '#3b82f6'
  };

  // 세션별로 그룹화
  const groupedBySession = {};
  attendances.forEach(att => {
    const sessionId = att.session?.id;
    if (!groupedBySession[sessionId]) {
      groupedBySession[sessionId] = [];
    }
    groupedBySession[sessionId].push(att);
  });

  return (
    <div className="card">
      <h2 style={{ marginBottom: '1rem' }}>출석 현황</h2>

      {error && (
        <div style={{ padding: '0.75rem', marginBottom: '1rem', backgroundColor: '#fee2e2', color: '#dc2626', borderRadius: '0.375rem' }}>
          {error}
        </div>
      )}

      {Object.keys(groupedBySession).length === 0 ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          출석 기록이 없습니다.
        </div>
      ) : (
        <div>
          {Object.entries(groupedBySession).map(([sessionId, sessionAttendances]) => {
            const session = sessionAttendances[0]?.session;
            return (
              <div key={sessionId} style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: 'var(--gray-50)', borderRadius: '0.375rem' }}>
                <h3 style={{ marginBottom: '0.5rem' }}>
                  {session?.week}주차 {session?.session_number}회차
                </h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                  {session?.start_at ? new Date(session.start_at).toLocaleString('ko-KR') : 'N/A'}
                </p>
                {sessionAttendances.map((attendance) => (
                  <div key={attendance.id} style={{ padding: '0.75rem', backgroundColor: 'white', borderRadius: '0.375rem', marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <span style={{
                          padding: '0.25rem 0.75rem',
                          borderRadius: '0.25rem',
                          backgroundColor: statusColors[attendance.status] + '20',
                          color: statusColors[attendance.status],
                          fontWeight: 'bold',
                          marginRight: '0.5rem'
                        }}>
                          {statusLabels[attendance.status]}
                        </span>
                        {attendance.late_minutes > 0 && (
                          <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                            ({attendance.late_minutes}분 지각)
                          </span>
                        )}
                      </div>
                      {attendance.checked_at && (
                        <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                          {new Date(attendance.checked_at).toLocaleString('ko-KR')}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AttendanceHistory;

