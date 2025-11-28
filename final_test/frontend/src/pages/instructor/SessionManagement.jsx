import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

const SessionManagement = ({ courseId }) => {
  const { accessToken } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    week: '',
    session_number: '',
    start_at: '',
    end_at: '',
    room: '',
    attendance_method: 'code',
    attendance_duration: 10,
    is_holiday: false,
    is_makeup: false
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (courseId) fetchSessions();
  }, [courseId]);

  const fetchSessions = async () => {
    try {
      const response = await axios.get(`/api/courses/${courseId}/sessions`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      setSessions(response.data || []);
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
      setError('수업 세션 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (editingId) {
        await axios.put(`/api/sessions/${editingId}`, formData, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
      } else {
        await axios.post(`/api/courses/${courseId}/sessions`, formData, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
      }
      setShowForm(false);
      setEditingId(null);
      setFormData({ week: '', session_number: '', start_at: '', end_at: '', room: '', attendance_method: 'code', attendance_duration: 10, is_holiday: false, is_makeup: false });
      fetchSessions();
    } catch (error) {
      setError(error.response?.data?.error || '저장에 실패했습니다.');
    }
  };

  const handleEdit = (session) => {
    setFormData({
      week: session.week.toString(),
      session_number: session.session_number.toString(),
      start_at: new Date(session.start_at).toISOString().slice(0, 16),
      end_at: new Date(session.end_at).toISOString().slice(0, 16),
      room: session.room || '',
      attendance_method: session.attendance_method,
      attendance_duration: session.attendance_duration,
      is_holiday: session.is_holiday,
      is_makeup: session.is_makeup
    });
    setEditingId(session.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return;

    try {
      await axios.delete(`/api/sessions/${id}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      fetchSessions();
    } catch (error) {
      setError(error.response?.data?.error || '삭제에 실패했습니다.');
    }
  };

  const handleOpenSession = async (id) => {
    try {
      const response = await axios.post(`/api/sessions/${id}/open`, {}, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      fetchSessions();
      
      // 인증번호 방식인 경우 인증번호 표시
      if (response.data.attendance_method === 'code' && response.data.attendance_code) {
        alert(`출석이 시작되었습니다.\n인증번호: ${response.data.attendance_code}`);
      }
    } catch (error) {
      setError(error.response?.data?.error || '출석 시작에 실패했습니다.');
    }
  };

  const handleCloseSession = async (id) => {
    try {
      await axios.post(`/api/sessions/${id}/close`, {}, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      fetchSessions();
    } catch (error) {
      setError(error.response?.data?.error || '출석 마감에 실패했습니다.');
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2>수업 세션 관리</h2>
        <button className="btn" onClick={() => { setShowForm(true); setEditingId(null); setFormData({ week: '', session_number: '', start_at: '', end_at: '', room: '', attendance_method: 'code', attendance_duration: 10, is_holiday: false, is_makeup: false }); }}>
          + 세션 추가
        </button>
      </div>

      {error && (
        <div style={{ padding: '0.75rem', marginBottom: '1rem', backgroundColor: '#fee2e2', color: '#dc2626', borderRadius: '0.375rem' }}>
          {error}
        </div>
      )}

      {showForm && (
        <div className="card" style={{ marginBottom: '1rem', backgroundColor: 'var(--gray-50)' }}>
          <h3>{editingId ? '세션 수정' : '세션 추가'}</h3>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>주차</label>
              <input
                type="number"
                className="input"
                value={formData.week}
                onChange={(e) => setFormData({ ...formData, week: e.target.value })}
                required
                min="1"
              />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>세션 번호</label>
              <input
                type="number"
                className="input"
                value={formData.session_number}
                onChange={(e) => setFormData({ ...formData, session_number: e.target.value })}
                required
                min="1"
              />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>시작 시간</label>
              <input
                type="datetime-local"
                className="input"
                value={formData.start_at}
                onChange={(e) => setFormData({ ...formData, start_at: e.target.value })}
                required
              />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>종료 시간</label>
              <input
                type="datetime-local"
                className="input"
                value={formData.end_at}
                onChange={(e) => setFormData({ ...formData, end_at: e.target.value })}
                required
              />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>출석 방법</label>
              <select
                className="input"
                value={formData.attendance_method}
                onChange={(e) => setFormData({ ...formData, attendance_method: e.target.value })}
                required
              >
                <option value="code">인증번호</option>
                <option value="roll_call">호명</option>
                <option value="electronic">전자출결</option>
              </select>
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>출석 체크 시간 (분, 3-15)</label>
              <input
                type="number"
                className="input"
                value={formData.attendance_duration}
                onChange={(e) => setFormData({ ...formData, attendance_duration: parseInt(e.target.value) })}
                required
                min="3"
                max="15"
              />
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
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  checked={formData.is_holiday}
                  onChange={(e) => setFormData({ ...formData, is_holiday: e.target.checked })}
                />
                공휴일
              </label>
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  checked={formData.is_makeup}
                  onChange={(e) => setFormData({ ...formData, is_makeup: e.target.checked })}
                />
                보강일
              </label>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="submit" className="btn">저장</button>
              <button type="button" className="btn" onClick={() => { setShowForm(false); setEditingId(null); setFormData({ week: '', session_number: '', start_at: '', end_at: '', room: '', attendance_method: 'code', attendance_duration: 10, is_holiday: false, is_makeup: false }); }}>
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
              <th style={{ padding: '0.75rem', textAlign: 'left' }}>주차</th>
              <th style={{ padding: '0.75rem', textAlign: 'left' }}>세션</th>
              <th style={{ padding: '0.75rem', textAlign: 'left' }}>시작 시간</th>
              <th style={{ padding: '0.75rem', textAlign: 'left' }}>상태</th>
              <th style={{ padding: '0.75rem', textAlign: 'left' }}>인증번호</th>
              <th style={{ padding: '0.75rem', textAlign: 'left' }}>작업</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((session) => (
              <tr key={session.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '0.75rem' }}>{session.week}</td>
                <td style={{ padding: '0.75rem' }}>{session.session_number}</td>
                <td style={{ padding: '0.75rem' }}>{new Date(session.start_at).toLocaleString('ko-KR')}</td>
                <td style={{ padding: '0.75rem' }}>
                  <span style={{
                    padding: '0.25rem 0.5rem',
                    borderRadius: '0.25rem',
                    backgroundColor: session.status === 'open' ? '#dcfce7' : session.status === 'closed' ? '#fee2e2' : '#f3f4f6',
                    color: session.status === 'open' ? '#16a34a' : session.status === 'closed' ? '#dc2626' : '#6b7280'
                  }}>
                    {session.status === 'open' ? '출석 중' : session.status === 'closed' ? '마감' : '예정'}
                  </span>
                </td>
                <td style={{ padding: '0.75rem' }}>
                  {session.status === 'open' && session.attendance_method === 'code' && session.attendance_code ? (
                    <div style={{
                      display: 'inline-block',
                      padding: '0.5rem 1rem',
                      backgroundColor: '#fef3c7',
                      border: '2px solid #f59e0b',
                      borderRadius: '0.5rem',
                      fontWeight: 'bold',
                      fontSize: '1.25rem',
                      letterSpacing: '0.1em',
                      color: '#92400e'
                    }}>
                      {session.attendance_code}
                    </div>
                  ) : session.attendance_method === 'code' ? (
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>출석 시작 후 생성</span>
                  ) : (
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>-</span>
                  )}
                </td>
                <td style={{ padding: '0.75rem' }}>
                  {session.status === 'scheduled' && (
                    <button className="btn" onClick={() => handleOpenSession(session.id)} style={{ marginRight: '0.5rem', padding: '0.25rem 0.75rem', fontSize: '0.875rem' }}>
                      출석 시작
                    </button>
                  )}
                  {session.status === 'open' && (
                    <>
                      <button className="btn" onClick={() => handleCloseSession(session.id)} style={{ marginRight: '0.5rem', padding: '0.25rem 0.75rem', fontSize: '0.875rem' }}>
                        마감
                      </button>
                      {session.attendance_method === 'code' && (
                        <button 
                          className="btn" 
                          onClick={async () => {
                            try {
                              const response = await axios.get(`/api/sessions/${session.id}/attendance-code`, {
                                headers: { Authorization: `Bearer ${accessToken}` }
                              });
                              alert(`인증번호: ${response.data.attendance_code}`);
                            } catch (error) {
                              setError('인증번호를 불러오는데 실패했습니다.');
                            }
                          }}
                          style={{ marginRight: '0.5rem', padding: '0.25rem 0.75rem', fontSize: '0.875rem', backgroundColor: '#f59e0b', color: 'white' }}
                        >
                          인증번호 확인
                        </button>
                      )}
                    </>
                  )}
                  <button className="btn" onClick={() => handleEdit(session)} style={{ marginRight: '0.5rem', padding: '0.25rem 0.75rem', fontSize: '0.875rem' }}>
                    수정
                  </button>
                  <button className="btn" onClick={() => handleDelete(session.id)} style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem', backgroundColor: 'var(--error)', color: 'white' }}>
                    삭제
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {sessions.length === 0 && (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            등록된 세션이 없습니다.
          </div>
        )}
      </div>
    </div>
  );
};

export default SessionManagement;

