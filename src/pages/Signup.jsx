import React, { useState } from 'react';
import { auth, googleProvider } from '../firebase';
import { createUserWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { useNavigate, Link } from 'react-router-dom';
import { Card, Input, Button, Typography, message, Divider } from 'antd';
import { GoogleOutlined } from '@ant-design/icons';

const { Title } = Typography;

function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      message.success('Account created successfully!');
      navigate('/');
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