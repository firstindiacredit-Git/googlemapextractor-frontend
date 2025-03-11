import React, { useState } from 'react';
import { auth, googleProvider } from '../firebase';
import { signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { useNavigate, Link } from 'react-router-dom';
import { Card, Input, Button, Typography, message, Divider } from 'antd';
import { GoogleOutlined } from '@ant-design/icons';

const { Title } = Typography;

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await signInWithEmailAndPassword(auth, email, password);
      message.success('Successfully logged in!');
      navigate('/');
    } catch (error) {
      message.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      message.success('Successfully logged in with Google!');
      navigate('/');
    } catch (error) {
      message.error(error.message);
    }
  };

  return (
    <div className="auth-container">
      <Card>
        <Title level={2} style={{ textAlign: 'center', marginBottom: '2rem' }}>
          Login
        </Title>
        <form onSubmit={handleLogin}>
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
            Login
          </Button>
        </form>

        <Divider>Or</Divider>

        <Button 
          icon={<GoogleOutlined />}
          block 
          onClick={handleGoogleLogin}
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