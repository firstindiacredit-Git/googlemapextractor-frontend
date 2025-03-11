import React, { useState } from 'react';
import { auth } from '../firebase';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { Card, Button, Input, Typography, Tabs, message, Tag, Avatar, Space } from 'antd';
import { UserOutlined, LockOutlined, CrownOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

function Profile() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const user = auth.currentUser;
  const isGoogleUser = user?.providerData[0]?.providerId === 'google.com';
  const isPro = false; // You can implement your pro account logic here

  const handlePasswordChange = async () => {
    if (!currentPassword || !newPassword) {
      message.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      // Reauthenticate user before changing password
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      
      // Update password
      await updatePassword(user, newPassword);
      
      message.success('Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
    } catch (error) {
      message.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: '2rem auto', padding: '0 1rem' }}>
      <Card>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <Avatar size={64} icon={<UserOutlined />} src={user?.photoURL} />
          <Title level={2} style={{ marginTop: '1rem', marginBottom: '0.5rem' }}>
            {user?.displayName || user?.email}
          </Title>
          <Space>
            <Tag color={isPro ? 'gold' : 'blue'}>
              {isPro ? <CrownOutlined /> : null}
              {isPro ? 'Pro Account' : 'Free Account'}
            </Tag>
            <Tag color="green">
              {isGoogleUser ? 'Google Account' : 'Local Account'}
            </Tag>
          </Space>
        </div>

        <Tabs defaultActiveKey="1">
          <TabPane tab="Account Details" key="1">
            <div style={{ maxWidth: 400, margin: '0 auto' }}>
              <div style={{ marginBottom: '1rem' }}>
                <Text strong>Email:</Text>
                <div>{user?.email}</div>
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <Text strong>Account Type:</Text>
                <div>{isPro ? 'Pro Account' : 'Free Account'}</div>
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <Text strong>Authentication Method:</Text>
                <div>{isGoogleUser ? 'Google Account' : 'Email/Password'}</div>
              </div>
            </div>
          </TabPane>

          {!isGoogleUser && (
            <TabPane tab="Change Password" key="2">
              <div style={{ maxWidth: 400, margin: '0 auto' }}>
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder="Current Password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  style={{ marginBottom: '1rem' }}
                />
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder="New Password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  style={{ marginBottom: '1rem' }}
                />
                <Button
                  type="primary"
                  onClick={handlePasswordChange}
                  loading={loading}
                  block
                >
                  Update Password
                </Button>
              </div>
            </TabPane>
          )}
        </Tabs>
      </Card>
    </div>
  );
}

export default Profile; 