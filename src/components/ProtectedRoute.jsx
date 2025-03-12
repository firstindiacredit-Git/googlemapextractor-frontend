import { Navigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase';
import { Card, Spin, Alert } from 'antd';

function ProtectedRoute({ children }) {
  const [user, loading] = useAuthState(auth);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (!user.emailVerified && user.providerData[0].providerId === 'password') {
    return (
      <div style={{ maxWidth: 500, margin: '2rem auto', padding: '0 1rem' }}>
        <Card>
          <Alert
            message="Email Verification Required"
            description={
              <div>
                <p>Please verify your email address to access this page.</p>
                <p>Check your inbox for the verification link.</p>
              </div>
            }
            type="warning"
            showIcon
          />
        </Card>
      </div>
    );
  }

  return children;
}

export default ProtectedRoute; 