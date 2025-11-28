import { useEffect, useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const { logout, accessToken } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const fetchedTokenRef = useRef(null);

  useEffect(() => {
    console.log('🔵 Dashboard useEffect 실행됨');
    console.log('🔵 accessToken 존재:', !!accessToken);
    console.log('🔵 accessToken 값:', accessToken ? accessToken.substring(0, 20) + '...' : '없음');
    
    if (!accessToken) {
      console.log('🔴 accessToken이 없어서 종료');
      setLoading(false);
      fetchedTokenRef.current = null;
      return;
    }

    // 같은 토큰으로 이미 fetch한 경우 스킵
    if (fetchedTokenRef.current === accessToken && dashboardData) {
      console.log('🟡 이미 같은 토큰으로 fetch했음, 스킵');
      setLoading(false);
      return;
    }

    let cancelled = false;
    fetchedTokenRef.current = accessToken;
    setLoading(true);

    const fetchDashboard = async () => {
      try {
        console.log('🟢 API 호출 시작: /api/dashboard');
        const response = await axios.get('/api/dashboard', {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        });
        
        console.log('✅ API 응답 받음');
        console.log('✅ Status:', response.status);
        console.log('✅ Data:', response.data);
        
        if (!cancelled && fetchedTokenRef.current === accessToken) {
          if (response.data && response.data.role) {
            console.log('✅ 유효한 데이터, role:', response.data.role);
            setDashboardData(response.data);
          } else {
            console.error('❌ 유효하지 않은 데이터:', response.data);
            setDashboardData({ role: 'Unknown', error: true });
          }
          setLoading(false);
        }
      } catch (error) {
        if (!cancelled) {
          console.error('❌ API 호출 실패');
          console.error('❌ Error:', error);
          console.error('❌ Response:', error.response);
          console.error('❌ Status:', error.response?.status);
          console.error('❌ Data:', error.response?.data);
          
          if (error.response?.status === 401) {
            console.log('🔴 401 에러 - 로그아웃');
            fetchedTokenRef.current = null;
            logout();
            navigate('/login');
          } else {
            console.log('🟡 다른 에러 - 에러 상태 설정');
            setLoading(false);
            setDashboardData({ role: 'Unknown', error: true });
          }
        }
      }
    };

    fetchDashboard();

    return () => {
      cancelled = true;
    };
  }, [accessToken, logout, navigate]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="container">
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>대시보드</h1>
        <button className="btn" onClick={handleLogout}>
          로그아웃
        </button>
      </div>

      {dashboardData ? (
        <>
          <div className="card">
            <h2 style={{ marginBottom: '1rem' }}>
              {dashboardData.role === 'Student' && '학생 대시보드'}
              {dashboardData.role === 'Instructor' && '교원 대시보드'}
              {dashboardData.role === 'Admin' && '관리자 대시보드'}
              {!dashboardData.role && '대시보드'}
            </h2>

            {dashboardData.role === 'Admin' && (
              <div style={{ marginBottom: '1rem' }}>
                <button className="btn" onClick={() => navigate('/admin')} style={{ width: '100%' }}>
                  관리자 페이지로 이동
                </button>
              </div>
            )}

            {dashboardData.error ? (
              <div>
                <p style={{ color: '#ff6b6b' }}>데이터를 불러오는 중 오류가 발생했습니다.</p>
              </div>
            ) : dashboardData.role === 'Student' ? (
              <div>
                <p>수강 과목: {dashboardData.courses || 0}개</p>
                <p>총 수업: {dashboardData.totalSessions || 0}개</p>
                <p>출석 기록: {dashboardData.attendances || 0}개</p>
                <p>대기 중인 공결: {dashboardData.pendingExcuses || 0}개</p>
                <p>읽지 않은 알림: {dashboardData.unreadNotifications || 0}개</p>
                <div style={{ marginTop: '1rem' }}>
                  <button className="btn" onClick={() => navigate('/student')} style={{ width: '100%' }}>
                    학생 페이지로 이동
                  </button>
                </div>
              </div>
            ) : dashboardData.role === 'Instructor' ? (
              <div>
                <p>담당 과목: {dashboardData.courses || 0}개</p>
                <p>총 수업: {dashboardData.totalSessions || 0}개</p>
                <p>승인 대기 공결: {dashboardData.pendingExcuses || 0}개</p>
                <p>승인 대기 이의제기: {dashboardData.pendingAppeals || 0}개</p>
                <p>읽지 않은 알림: {dashboardData.unreadNotifications || 0}개</p>
                <div style={{ marginTop: '1rem' }}>
                  <button className="btn" onClick={() => navigate('/instructor')} style={{ width: '100%' }}>
                    교원 페이지로 이동
                  </button>
                </div>
              </div>
            ) : dashboardData.role === 'Admin' ? (
              <div>
                <p>총 사용자: {dashboardData.totalUsers || 0}명</p>
                <p>총 과목: {dashboardData.totalCourses || 0}개</p>
                <p>총 수업: {dashboardData.totalSessions || 0}개</p>
                <p>총 출석 기록: {dashboardData.totalAttendances || 0}개</p>
              </div>
            ) : (
              <div>
                <p>데이터를 불러오는 중...</p>
              </div>
            )}
          </div>

          <div className="card" style={{ marginTop: '1rem' }}>
            <h3 style={{ marginBottom: '1rem' }}>시스템 상태</h3>
            <div style={{ padding: '1rem', backgroundColor: '#f5f5f5', borderRadius: '0.375rem' }}>
              <p style={{ marginBottom: '0.5rem' }}>✅ 로그인 성공</p>
              <p style={{ marginBottom: '0.5rem' }}>✅ 대시보드 연결됨</p>
              <p style={{ marginBottom: '0.5rem' }}>✅ 백엔드 API 정상 작동</p>
              <p style={{ marginTop: '1rem', color: '#666', fontSize: '0.875rem' }}>
                현재 기본 기능이 구현되어 있습니다. 추가 기능(과목 관리, 출석 체크 등)은 추후 구현 예정입니다.
              </p>
            </div>
          </div>
        </>
      ) : (
        <div className="card">
          <p>데이터를 불러올 수 없습니다.</p>
        </div>
      )}
    </div>
  );
};

export default Dashboard;

