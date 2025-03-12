import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, Divider, message, Modal } from 'antd';
import { GoogleOutlined, LockOutlined, UserOutlined } from '@ant-design/icons';
import { auth, googleProvider } from '../firebase';
import { 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  sendEmailVerification 
} from 'firebase/auth';
import { useNavigate, Link } from 'react-router-dom';
import { 
  isUserLoggedIn, 
  setUserLoggedIn, 
  forceLoginOnThisDevice 
} from '../services/loginStatusService';

const { Title, Text } = Typography;

function Login() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [needsVerification, setNeedsVerification] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (values) => {
    setLoading(true);
    setError('');

    try {
      // Sign in with Firebase
      const userCredential = await signInWithEmailAndPassword(
        auth,
        values.email.trim(),
        values.password
      );

      const user = userCredential.user;

      // Check if email is verified
      if (!user.emailVerified) {
        await sendEmailVerification(user);
        setNeedsVerification(true);
        await auth.signOut();
        setLoading(false);
        return;
      }

      // Check if user is already logged in
      const loginStatus = await isUserLoggedIn(user.uid);
      console.log('Login status:', loginStatus);

      if (loginStatus.isLoggedIn && !loginStatus.deviceMatch) {
        // User is logged in on another device
        Modal.confirm({
          title: 'Already Logged In',
          content: (
            <div>
              <p>You are already logged in on another device:</p>
              <p><strong>Device:</strong> {loginStatus.savedDevice?.userAgent || 'Unknown device'}</p>
              <p><strong>Last Login:</strong> {new Date(loginStatus.savedDevice?.timestamp || Date.now()).toLocaleString()}</p>
              <p>Would you like to log out from that device and continue on this one?</p>
            </div>
          ),
          okText: 'Yes, continue on this device',
          cancelText: 'No, cancel',
          onOk: async () => {
            try {
              await forceLoginOnThisDevice(user.uid);
              message.success('Logged in successfully. Other sessions have been terminated.');
              navigate('/');
            } catch (error) {
              message.error('Failed to log in on this device: ' + error.message);
              await auth.signOut();
            }
          },
          onCancel: async () => {
            await auth.signOut();
          }
        });
        setLoading(false);
        return;
      }

      // Regular login
      await setUserLoggedIn(user.uid);
      message.success('Logged in successfully!');
      navigate('/');
    } catch (error) {
      console.error('Login error:', error);
      setError(getErrorMessage(error));
      message.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      // Check if user is already logged in
      const loginStatus = await isUserLoggedIn(user.uid);
      console.log('Google login status:', loginStatus);

      if (loginStatus.isLoggedIn && !loginStatus.deviceMatch) {
        // User is logged in on another device
        Modal.confirm({
          title: 'Already Logged In',
          content: (
            <div>
              <p>You are already logged in on another device:</p>
              <p><strong>Device:</strong> {loginStatus.savedDevice?.userAgent || 'Unknown device'}</p>
              <p><strong>Last Login:</strong> {new Date(loginStatus.savedDevice?.timestamp || Date.now()).toLocaleString()}</p>
              <p>Would you like to log out from that device and continue on this one?</p>
            </div>
          ),
          okText: 'Yes, continue on this device',
          cancelText: 'No, cancel',
          onOk: async () => {
            try {
              await forceLoginOnThisDevice(user.uid);
              message.success('Logged in successfully. Other sessions have been terminated.');
              navigate('/');
            } catch (error) {
              message.error('Failed to log in on this device: ' + error.message);
              await auth.signOut();
            }
          },
          onCancel: async () => {
            await auth.signOut();
          }
        });
        return;
      }

      // Regular login
      await setUserLoggedIn(user.uid);
      message.success('Logged in successfully with Google!');
      navigate('/');
    } catch (error) {
      console.error('Google login error:', error);
      message.error(getErrorMessage(error));
    }
  };

  // Helper function to extract error messages
  const getErrorMessage = (error) => {
    switch (error.code) {
      case 'auth/user-not-found':
        return 'No account found with this email address.';
      case 'auth/wrong-password':
        return 'Incorrect password.';
      case 'auth/invalid-email':
        return 'Invalid email address format.';
      case 'auth/user-disabled':
        return 'This account has been disabled.';
      case 'auth/too-many-requests':
        return 'Too many failed attempts. Please try again later.';
      case 'auth/network-request-failed':
        return 'Network error. Please check your internet connection.';
      case 'auth/invalid-credential':
        return 'Invalid login credentials.';
      default:
        return error.message || 'An error occurred during login.';
    }
  };

  return (
    <div className="auth-container">
      <Card style={{ maxWidth: '400px', margin: '0 auto' }}>
        <Title level={2} style={{ textAlign: 'center', marginBottom: '24px' }}>
          Log In
        </Title>

        {needsVerification && (
          <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#fffbe6', border: '1px solid #ffe58f', borderRadius: '4px' }}>
            <Text type="warning">
              A verification email has been sent to your email address. Please verify your email before logging in.
            </Text>
          </div>
        )}

        {error && (
          <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#fff2f0', border: '1px solid #ffccc7', borderRadius: '4px' }}>
            <Text type="danger">{error}</Text>
          </div>
        )}

        <Form
          form={form}
          layout="vertical"
          onFinish={handleLogin}
        >
          <Form.Item
            name="email"
            rules={[{ required: true, message: 'Please input your email!' }]}
          >
            <Input 
              prefix={<UserOutlined />} 
              placeholder="Email" 
              size="large" 
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: 'Please input your password!' }]}
          >
            <Input.Password 
              prefix={<LockOutlined />} 
              placeholder="Password" 
              size="large" 
            />
          </Form.Item>

          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              size="large" 
              block 
              loading={loading}
            >
              Log In
            </Button>
          </Form.Item>
        </Form>

        <Divider>Or</Divider>

        <Button 
          icon={<GoogleOutlined />} 
          size="large" 
          block 
          onClick={handleGoogleLogin}
          style={{ marginBottom: '16px' }}
        >
          Continue with Google
        </Button>

        <div style={{ textAlign: 'center' }}>
          <Text>Don't have an account? <Link to="/signup">Sign up</Link></Text>
        </div>
      </Card>
    </div>
  );
}

export default Login; 