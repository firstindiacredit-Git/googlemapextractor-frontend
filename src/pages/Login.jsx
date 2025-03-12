import React, { useState } from 'react';
import { auth, googleProvider } from '../firebase';
import { 
  signInWithEmailAndPassword, 
  signInWithPopup,
  sendEmailVerification 
} from 'firebase/auth';
import { useNavigate, Link } from 'react-router-dom';
import { Card, Input, Button, Typography, message, Divider, Alert, Form, Modal } from 'antd';
import { GoogleOutlined, LockOutlined, UserOutlined } from '@ant-design/icons';
import { isUserLoggedIn, setUserLoggedIn } from '../../loginStatusService';

const { Title } = Typography;

function Login() {
  const [loading, setLoading] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [error, setError] = useState('');
  const [form] = Form.useForm();
  const navigate = useNavigate();

  const handleLogin = async (values) => {
    setLoading(true);
    setError('');
    
    try {
      console.log('Attempting login with:', values.email);
      
      if (!values.email || !values.password) {
        throw new Error('Email and password are required');
      }

      const userCredential = await signInWithEmailAndPassword(
        auth, 
        values.email.trim(),
        values.password
      );
      
      console.log('Login successful:', userCredential.user.email);

      if (!userCredential.user.emailVerified) {
        console.log('Email not verified, sending verification...');
        await sendEmailVerification(userCredential.user);
        setNeedsVerification(true);
        setLoading(false);
        return;
      }

      const userId = userCredential.user.uid;
      const alreadyLoggedIn = await isUserLoggedIn(userId);
      
      if (alreadyLoggedIn) {
        console.log('User is already logged in, showing warning and signing out');
        Modal.warning({
          title: 'Already Logged In',
          content: 'You are already logged in on another device. Please log out from that device first.',
          onOk: async () => {
            await auth.signOut();
          }
        });
        return;
      }

      await setUserLoggedIn(userId);
      
      message.success('Login successful!');
      navigate('/');
    } catch (error) {
      console.error('Login error:', error.code, error.message);
      
      let errorMessage = 'An error occurred during login.';
      
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'No account found with this email address.';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Incorrect password.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address format.';
          break;
        case 'auth/user-disabled':
          errorMessage = 'This account has been disabled.';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Too many failed attempts. Please try again later.';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Network error. Please check your internet connection.';
          break;
        case 'auth/invalid-credential':
          errorMessage = 'Invalid login credentials.';
          break;
        default:
          errorMessage = `Error: ${error.message}`;
      }
      
      setError(errorMessage);
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const userId = result.user.uid;
      
      const alreadyLoggedIn = await isUserLoggedIn(userId);
      
      if (alreadyLoggedIn) {
        console.log('User is already logged in, showing warning and signing out');
        Modal.warning({
          title: 'Already Logged In',
          content: 'You are already logged in on another device. Please log out from that device first.',
          onOk: async () => {
            await auth.signOut();
          }
        });
        return;
      }
      
      await setUserLoggedIn(userId);
      
      message.success('Login successful!');
      navigate('/');
    } catch (error) {
      message.error('Failed to login with Google. Please try again.');
    }
  };

  const handleResendVerification = async () => {
    try {
      const values = form.getFieldsValue();
      const userCredential = await signInWithEmailAndPassword(auth, values.email, values.password);
      await sendEmailVerification(userCredential.user);
      message.success('Verification email resent!');
    } catch (error) {
      message.error('Failed to resend verification email. Please try again.');
    }
  };

  if (needsVerification) {
    const email = form.getFieldValue('email');
    return (
      <div className="auth-container">
        <Card>
          <Title level={2} style={{ textAlign: 'center', marginBottom: '2rem' }}>
            Email Verification Required
          </Title>
          <Alert
            message="Please Verify Your Email"
            description={
              <div>
                <p>You need to verify your email address before logging in.</p>
                <p>We've sent a verification email to <strong>{email}</strong></p>
                <Button type="link" onClick={handleResendVerification}>
                  Resend verification email
                </Button>
              </div>
            }
            type="warning"
            showIcon
          />
          <div style={{ marginTop: '1rem', textAlign: 'center' }}>
            <Button type="link" onClick={() => setNeedsVerification(false)}>
              Back to Login
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <Card>
        <Title level={2} style={{ textAlign: 'center', marginBottom: '2rem' }}>
          Login
        </Title>
        {error && (
          <Alert
            message={error}
            type="error"
            showIcon
            style={{ marginBottom: '1rem' }}
          />
        )}
        <Form
          form={form}
          onFinish={handleLogin}
          layout="vertical"
        >
          <Form.Item
            name="email"
            rules={[
              { required: true, message: 'Please input your email!' },
              { type: 'email', message: 'Please enter a valid email!' }
            ]}
          >
            <Input
              prefix={<UserOutlined />}
              type="email"
              placeholder="Email"
              size="large"
            />
          </Form.Item>
          <Form.Item
            name="password"
            rules={[
              { required: true, message: 'Please input your password!' },
              { min: 6, message: 'Password must be at least 6 characters!' }
            ]}
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
              block 
              loading={loading}
              size="large"
            >
              Login
            </Button>
          </Form.Item>
        </Form>

        <Divider>Or</Divider>

        <Button 
          icon={<GoogleOutlined />}
          block 
          onClick={handleGoogleLogin}
          size="large"
          style={{ 
            marginBottom: '1rem',
            background: '#fff',
            border: '1px solid #d9d9d9'
          }}
        >
          Continue with Google
        </Button>

        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
          Don't have an account? <Link to="/signup">Sign up</Link>
        </div>
      </Card>
    </div>
  );
}

export default Login; 