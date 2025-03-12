import React, { useState } from 'react';
import { auth, googleProvider } from '../firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithPopup,
  sendEmailVerification 
} from 'firebase/auth';
import { useNavigate, Link } from 'react-router-dom';
import { Card, Input, Button, Typography, message, Divider, Alert } from 'antd';
import { GoogleOutlined, MailOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await sendEmailVerification(userCredential.user);
      setVerificationSent(true);
      message.success('Verification email sent! Please check your inbox.');
    } catch (error) {
      message.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      message.success('Successfully signed up with Google!');
      navigate('/');
    } catch (error) {
      message.error(error.message);
    }
  };

  if (verificationSent) {
    return (
      <div className="auth-container">
        <Card>
          <Title level={2} style={{ textAlign: 'center', marginBottom: '2rem' }}>
            Verify Your Email
          </Title>
          <Alert
            message="Verification Email Sent"
            description={
              <div>
                <p>We've sent a verification email to <strong>{email}</strong></p>
                <p>Please check your inbox and click the verification link to complete your registration.</p>
              </div>
            }
            type="info"
            showIcon
          />
          <div style={{ marginTop: '1rem', textAlign: 'center' }}>
            <Button type="link" onClick={() => auth.signOut()}>
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
          Sign Up
        </Title>
        <form onSubmit={handleSignup}>
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input.Password
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Button 
            type="primary" 
            htmlType="submit" 
            block 
            loading={loading}
          >
            Sign Up
          </Button>
        </form>

        <Divider>Or</Divider>

        <Button 
          icon={<GoogleOutlined />}
          block 
          onClick={handleGoogleSignup}
          style={{ 
            marginBottom: '1rem',
            background: '#fff',
            border: '1px solid #d9d9d9'
          }}
        >
          Continue with Google
        </Button>

        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
          Already have an account? <Link to="/login">Login</Link>
        </div>
      </Card>
    </div>
  );
}

export default Signup; 