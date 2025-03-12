import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import './App.css';
import { Resizable } from 'react-resizable';
import 'react-resizable/css/styles.css';
import { 
  Layout, 
  Typography, 
  Button, 
  Card, 
  Input, 
  Checkbox,
  Space,
  Progress,
  Table,
  Tag,
  Divider,
  Row,
  Col,
  Statistic,
  Tooltip,
  Badge,
  Dropdown,
  Avatar,
  Menu
} from 'antd';
import { 
  DownloadOutlined,
  SearchOutlined,
  ClearOutlined,
  PlayCircleOutlined,
  StopOutlined,
  EditOutlined,
  GlobalOutlined,
  PhoneOutlined,
  EnvironmentFilled,
  EnvironmentOutlined,
  StarOutlined,
  MailOutlined,
  LoadingOutlined,
  LogoutOutlined,
  UserOutlined,
  SettingOutlined
} from '@ant-design/icons';
import PhoneInTalkRoundedIcon from '@mui/icons-material/PhoneInTalkRounded';
import PublicIcon from '@mui/icons-material/Public';
import Confetti from 'react-confetti';
import { auth } from './firebase';
import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut
} from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { setUserLoggedOut } from './services/loginStatusService';

const { Header, Content } = Layout;
const { Title, Text } = Typography;
const { Search } = Input;

// Update the ResizableTitle component to be memoized
const ResizableTitle = React.memo(({ onResize, width, ...restProps }) => {
  if (!width) {
    return <th {...restProps} />;
  }

  return (
    <Resizable
      width={width}
      height={0}
      handle={
        <span
          className="react-resizable-handle"
          onClick={(e) => e.stopPropagation()}
        />
      }
      onResize={onResize}
      draggableOpts={{ enableUserSelectHack: false }}
    >
      <th {...restProps} />
    </Resizable>
  );
});

function App() {
  const [keywords, setKeywords] = useState('');
  const [location, setLocation] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [totalResults, setTotalResults] = useState(0);
  const [isExtracting, setIsExtracting] = useState(false);
  const [controller, setController] = useState(null);
  const [extractEmail, setExtractEmail] = useState(false);
  const [progress, setProgress] = useState(0);
  const [estimatedTime, setEstimatedTime] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [columnWidths, setColumnWidths] = useState({});
  const [showConfetti, setShowConfetti] = useState(false);
  const [wasExtracting, setWasExtracting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      setUser(user);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (isExtracting) {
      setWasExtracting(true);
    }
    
    if (!isExtracting && wasExtracting && results.length > 0 && progress === 100) {
      setShowConfetti(true);
      const timer = setTimeout(() => {
        setShowConfetti(false);
        setWasExtracting(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isExtracting, wasExtracting, results.length, progress]);

  const handleStartExtract = async () => {
    if (isExtracting) {
      try {
        await fetch('http://localhost:5000/stop-scrape', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        controller?.abort();
        setIsExtracting(false);
        setProgress(0);
        setEstimatedTime(null);
        setWasExtracting(false);
      } catch (error) {
        console.error('Error stopping extraction:', error);
      }
      return;
    }

    setIsExtracting(true);
    setResults([]);
    setTotalResults(0);
    setProgress(0);
    setStartTime(Date.now());
    setShowResults(true);

    const abortController = new AbortController();
    setController(abortController);

    try {
      const response = await fetch('http://localhost:5000/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: keywords,
          location: location,
          isPincode: /^\d{6}$/.test(location.trim()),
          total: 100,
          extractEmail
        }),
        signal: abortController.signal
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep the last incomplete line in buffer

        for (const line of lines) {
          try {
            if (line.trim()) {
              const data = JSON.parse(line);
              
              if (data.type === 'update') {
                setResults(prev => [...prev, data.data]);
                setTotalResults(prev => prev + 1);
                setProgress(data.progress);

                if (startTime && data.progress > 0) {
                  const elapsedTime = (Date.now() - startTime) / 1000;
                  const itemsPerSecond = data.progress / elapsedTime;
                  const remainingItems = 100 - data.progress;
                  const estimatedSeconds = remainingItems / itemsPerSecond;
                  setEstimatedTime(Math.ceil(estimatedSeconds));
                }
              } else if (data.type === 'complete') {
                setProgress(100);
                setEstimatedTime(0);
              }
            }
          } catch (error) {
            console.error('Error parsing line:', error);
          }
        }
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Extraction stopped by user');
      } else {
        console.error('Error:', error);
      }
    } finally {
      setIsExtracting(false);
      setController(null);
      setStartTime(null);
    }
  };

  const handleDownload = async () => {
    try {
      const response = await fetch('http://localhost:5000/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data: results }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'google_maps_data.xlsx';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Download error:', error);
    }
  };

  const handleClearData = () => {
    setResults([]);
    setTotalResults(0);
  };

  // Update handleResize to use useCallback with columnWidths dependency
  const handleResize = useCallback((index) => (_, { size }) => {
    setColumnWidths(prev => {
      const newWidths = { ...prev };
      newWidths[index] = size.width;
      return newWidths;
    });
  }, []);

  // Move columns definition outside of component or use useMemo with proper dependencies
  const columns = useMemo(() => [
    {
      title: 'S.No',
      dataIndex: 'index',
      key: 'index',
      width: 70,
      render: (_, __, index) => ((currentPage - 1) * pageSize) + index + 1,
      resizable: true,
    },
    {
      title: 'Title',
      dataIndex: 'name',
      key: 'name',
      render: (text) => text ? (
        <Tooltip title={text}>
          <div className="truncate">{text}</div>
        </Tooltip>
      ) : 'N/A',
      resizable: true,
    },
    {
      title: 'Country Code',
      dataIndex: 'countryCode',
      key: 'countryCode',
      render: (text) => text || '+91',
      resizable: true,
    },
    {
      title: 'Phone',
      dataIndex: 'phone',
      key: 'phone',
      render: (text) => text ? (
        <Tooltip title={text}>
          <div className="truncate">
            <PhoneInTalkRoundedIcon style={{ color: '#4caf50' }} />
            {text === 'N/A' ? text : text.slice(1)}
          </div>
        </Tooltip>
      ) : 'N/A',
      resizable: true,
    },
    {
      title: 'Website',
      dataIndex: 'website',
      key: 'website',
      render: (text) => (
        <div className="truncate">
          <PublicIcon style={{ color: '#4caf50' }} />
          {text && text !== 'N/A' ? (
            <Button 
              type="link" 
              style={{ padding: '0 0 0 4px' }}
              href={text} 
              target="_blank" 
              rel="noopener noreferrer"
            >
              Visit
            </Button>
          ) : (
            <span style={{ marginLeft: '4px' }}>N/A</span>
          )}
        </div>
      ),
      resizable: true,
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      render: (text) => text ? (
        <Tooltip title={text}>
          <div className="truncate">
            <Tag color="blue">{text}</Tag>
          </div>
        </Tooltip>
      ) : 'N/A',
      resizable: true,
    },
    {
      title: 'Rating',
      dataIndex: 'rating',
      key: 'rating',
      render: (text) => text ? (
        <Space>
          <StarOutlined style={{ color: '#fadb14' }} />
          {text}
        </Space>
      ) : 'N/A',
      resizable: true,
    },
    {
      title: 'Reviews',
      dataIndex: 'reviews',
      key: 'reviews',
      render: (text) => text ? `(${text})` : 'N/A',
      resizable: true,
    },
    {
      title: 'Pincode',
      dataIndex: 'pincode',
      key: 'pincode',
      render: (text) => text || 'N/A',
      resizable: true,
    },
    {
      title: 'City',
      dataIndex: 'city',
      key: 'city',
      render: (text) => {
        if (!text) return 'N/A';
        return (
          <Tooltip title={text}>
            <div className="truncate">
              {text}
            </div>
          </Tooltip>
        );
      },
      resizable: true,
    },
    {
      title: 'State',
      dataIndex: 'state',
      key: 'state',
      render: (text) => text || 'N/A',
      resizable: true,
    },
    {
      title: 'Address',
      dataIndex: 'address',
      key: 'address',
      render: (text) => {
        if (typeof text !== 'string') return 'N/A';
        return (
          <Tooltip title={text}>
            <div className="truncate">
              < EnvironmentFilled style={{ color: '#4caf50' }} />
              {text.slice(1, 100)}
            </div>
          </Tooltip>
        );
      },
      resizable: true,
    },
  ], [currentPage, pageSize]); // Add currentPage and pageSize to dependencies

  // Memoize the email column addition
  const finalColumns = useMemo(() => {
    let cols = [...columns];
    if (extractEmail) {
      cols.push({
        title: 'Email',
        dataIndex: 'email',
        key: 'email',
        render: (text) => typeof text === 'string' ? (
          <Space>
            <MailOutlined />
            {text}
          </Space>
        ) : 'N/A',
      });
    }
    return cols;
  }, [columns, extractEmail]);

  // Update resizableColumns memoization
  const resizableColumns = useMemo(() => 
    finalColumns.map((col, index) => ({
      ...col,
      width: columnWidths[index] || col.width || 150,
      onHeaderCell: (column) => ({
        width: column.width,
        onResize: handleResize(index),
      }),
    })),
    [finalColumns, columnWidths, handleResize]
  );

  // Memoize filtered results
  const memoizedFilteredResults = useMemo(() => 
    results.filter(item => {
      if (!searchTerm) return true;
      
      const search = searchTerm.toString().trim().toLowerCase();
      const isPincodeSearch = /^\d{6}$/.test(search);
      
      if (isPincodeSearch) {
        return item.pincode === search;
      } else {
        return (
          item.name?.toLowerCase().includes(search) ||
          item.address?.toLowerCase().includes(search) ||
          item.city?.toLowerCase().includes(search) ||
          item.state?.toLowerCase().includes(search) ||
          item.pincode?.includes(search)
        );
      }
    }),
    [results, searchTerm]
  );

  // Memoize ResizableTitle component
  const MemoizedResizableTitle = useMemo(() => React.memo(ResizableTitle), []);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error('Error logging in:', error.message);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    try {
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error('Error signing up:', error.message);
    }
  };

  const handleLogout = async () => {
    try {
      // Get user ID before signing out
      const userId = auth.currentUser?.uid;
      
      if (userId) {
        // Set user as logged out in Firestore
        await setUserLoggedOut(userId);
      }
      
      // Sign out from Firebase
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
      message.error('Failed to log out. Please try again.');
    }
  };

  const profileMenu = (
    <Menu>
      <Menu.Item key="profile" onClick={() => navigate('/profile')}>
        <UserOutlined /> Profile
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item key="logout" onClick={handleLogout} danger>
        <LogoutOutlined /> Logout
      </Menu.Item>
    </Menu>
  );

  return (
    <Layout className="app-layout">
      <Header className="app-header">
        <div className="header-content">
          <div className="logo">
            <img 
              src="https://cdn-icons-png.flaticon.com/512/2642/2642502.png" 
              alt="Logo" 
              className="logo-image" 
            />
            <div className="title-container">
              <Title level={3} style={{ color: 'white', margin: 0 }}>
                Google Map Extractor
              </Title>
              <Text style={{ color: 'rgba(255, 255, 255, 0.65)', fontSize: '12px' }}>
                Extract business data from Google Maps
              </Text>
            </div>
          </div>
          
          <div className="header-actions">
            <Space>
              <Button
                type="primary"
                icon={<DownloadOutlined />}
                onClick={handleDownload}
                className="download-button"
              >
                Download Excel
              </Button>
              <Dropdown overlay={profileMenu} trigger={['click']}>
                <Space className="profile-trigger" style={{ cursor: 'pointer' }}>
                  <Avatar 
                    size="small" 
                    icon={<UserOutlined />} 
                    src={auth.currentUser?.photoURL}
                  />
                  <span style={{ color: 'white' }}>
                    {auth.currentUser?.displayName || auth.currentUser?.email}
                  </span>
                </Space>
              </Dropdown>
            </Space>
          </div>
        </div>
      </Header>

      <Content className="app-content">
        <Row gutter={[16, 16]}>
          {/* Left side - Search Criteria */}
          <Col xs={24} md={8} lg={6} xl={5}>
            <Card 
              title={<Title level={4} style={{ textAlign: 'center', margin: 0 }}>SEARCH CRITERIA</Title>}
              bordered={false}
              className="search-card"
            >
              <Space direction="vertical" size="large" style={{ width: '100%' }}>
                <Input
                  placeholder="Keywords (e.g. restaurants, hotels)"
                  size="large"
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  prefix={<SearchOutlined />}

                />
                
                <Input
                  placeholder="Location (city name or pincode)"
                  size="large"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  prefix={<EnvironmentOutlined />}
                />
                
                <Checkbox
                  checked={extractEmail}
                  onChange={(e) => setExtractEmail(e.target.checked)}
                >
                  Extract Email (Slower)
                </Checkbox>
                
                <Button
                  type="primary"
                  icon={isExtracting ? <StopOutlined /> : <PlayCircleOutlined />}
                  danger={isExtracting}
                  size="large"
                  onClick={handleStartExtract}
                  block
                >
                  {isExtracting ? 'Stop Extracting' : 'Start Extracting'}
                </Button>
                
                {isExtracting && (
                  <div className="progress-mini">
                    <Progress 
                      percent={Math.round(progress)} 
                      status="active"
                      size="small"
                      strokeColor={{
                        '0%': '#108ee9',
                        '100%': '#87d068',
                      }}
                    />
                    <div className="progress-stats">
                      {/* <Text>{totalResults}</Text> */}
                      {estimatedTime > 0 && (
                        <Text>Est: {Math.floor(estimatedTime / 60)}m {estimatedTime % 60}s</Text>
                      )}
                    </div>
                  </div>
                )}
                
                <Button
                  danger
                  icon={<ClearOutlined />}
                  onClick={handleClearData}
                  disabled={isExtracting || results.length === 0}
                  block
                >
                  Clear Results
                </Button>
              </Space>
            </Card>
          </Col>
          
          {/* Right side - Results Table */}
          <Col xs={24} md={16} lg={18} xl={19}>
            <Card bordered={false} className="results-card">
              <div className="results-header">
                <Badge 
                  count={totalResults} 
                  overflowCount={999}
                  style={{ backgroundColor: '#52c41a'}}
                >
                  <Title level={4} style={{ margin: 0 }}>RESULTS</Title>
                </Badge>
                
                <Search
                  placeholder="Search results..."
                  allowClear
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ width: 250 }}
                />
              </div>
              
              {isExtracting && (
                <div className="modern-loading-container">
                  <div className="pulse-container">
                    <div className="pulse-circle"></div>
                    <div className="pulse-circle"></div>
                    <div className="pulse-circle"></div>
                  </div>
                  <div className="loading-bar-container">
                    <div className="loading-bar"></div>
                  </div>
                  <div className="loading-text">
                    <span className="loading-dot"></span>
                    <span className="loading-dot"></span>
                    <span className="loading-dot"></span>
                    <span>Extracting data from Google Maps</span>
                  </div>
                </div>
              )}
              
              <Table
                columns={resizableColumns}
                dataSource={memoizedFilteredResults}
                rowKey={(record, index) => index}
                pagination={{
                  current: currentPage,
                  pageSize: pageSize,
                  total: memoizedFilteredResults.length,
                  onChange: (page, size) => {
                    setCurrentPage(page);
                    setPageSize(size);
                  },
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
                  pageSizeOptions: ['10', '20', '50', '100', '150'],
                  position: ['bottomCenter']
                }}
                scroll={{ x: 'max-content', y: 'calc(100vh - 300px)' }}
                bordered
                size="middle"
                loading={false}
                locale={{ emptyText: 'No data yet. Start extracting to see results.' }}
                components={{
                  header: {
                    cell: MemoizedResizableTitle,
                  },
                }}
                className="excel-like-table custom-scrollbar"
              />
            </Card>
          </Col>
        </Row>
      </Content>
      {showConfetti && <Confetti />}
    </Layout>
  );
}

// Memoize the entire App component
export default React.memo(App);