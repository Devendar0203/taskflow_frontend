import React, { useState } from 'react';
import { Typography, Input, Button, Switch, Divider, Avatar, Layout, Menu } from 'antd';
import { 
  UserOutlined, SettingOutlined, CreditCardOutlined, FormatPainterOutlined, 
  LayoutOutlined, PlusSquareOutlined, LineChartOutlined, BellOutlined, 
  CloudSyncOutlined, AppstoreAddOutlined, CalendarOutlined, SearchOutlined 
} from '@ant-design/icons';
import { authService } from '../services/auth.service';
import { useThemeContext, THEME_COLORS } from '../context/ThemeContext';

const { Title, Text } = Typography;
const { Sider, Content } = Layout;

const Settings: React.FC = () => {
  const user = authService.getCurrentUser();
  const [name, setName] = useState(user?.name || '');
  const [activeTab, setActiveTab] = useState('account');
  const { themeColor, setThemeColor } = useThemeContext();

  return (
    <Layout style={{ background: '#fff', minHeight: '100%', borderRadius: 8, overflow: 'hidden', border: '1px solid #f0f0f0' }}>
      <Sider width={260} style={{ background: '#fafbfc', borderRight: '1px solid #f0f0f0', padding: '16px 0' }} theme="light">
        <div style={{ padding: '0 16px 16px' }}>
          <Title level={4} style={{ margin: '0 0 16px 0' }}>Settings</Title>
          <Input 
            prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />} 
            placeholder="Search" 
            style={{ borderRadius: 6 }}
          />
        </div>
        
        <Menu
          mode="inline"
          selectedKeys={[activeTab]}
          onClick={(e) => setActiveTab(e.key)}
          style={{ borderRight: 0, background: 'transparent' }}
          items={[
            { key: 'account', icon: <UserOutlined style={{ color: activeTab === 'account' ? themeColor : undefined }} />, label: <Text strong style={{ color: activeTab === 'account' ? themeColor : undefined }}>Account</Text> },
            { key: 'general', icon: <SettingOutlined />, label: 'General' },
            { key: 'subscription', icon: <CreditCardOutlined />, label: 'Subscription' },
            { key: 'theme', icon: <FormatPainterOutlined style={{ color: activeTab === 'theme' ? themeColor : undefined }} />, label: <Text strong style={{ color: activeTab === 'theme' ? themeColor : undefined }}>Theme</Text> },
            { key: 'sidebar', icon: <LayoutOutlined />, label: 'Sidebar' },
            { key: 'quickadd', icon: <PlusSquareOutlined />, label: 'Quick Add' },
            { key: 'productivity', icon: <LineChartOutlined />, label: 'Productivity' },
            { key: 'reminders', icon: <BellOutlined />, label: 'Reminders' },
            { key: 'notifications', icon: <BellOutlined />, label: 'Notifications' },
            { key: 'backups', icon: <CloudSyncOutlined />, label: 'Backups' },
            { key: 'integrations', icon: <AppstoreAddOutlined />, label: 'Integrations' },
            { key: 'calendars', icon: <CalendarOutlined />, label: 'Calendars' },
          ]}
        />
      </Sider>

      <Content style={{ padding: '32px 48px', background: '#fff' }}>
        
        {activeTab === 'account' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32, maxWidth: 600 }}>
            <Title level={3} style={{ borderBottom: '1px solid #f0f0f0', paddingBottom: 16, marginBottom: 0 }}>Account</Title>
          
          {/* Plan Section */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <Text strong style={{ display: 'block', marginBottom: 4 }}>Plan</Text>
              <Text style={{ fontSize: '16px', fontWeight: 600 }}>Beginner</Text>
            </div>
            <Button style={{ borderRadius: 6, fontWeight: 500 }}>Manage plan</Button>
          </div>

          {/* Photo Section */}
          <div>
            <Text strong style={{ display: 'block', marginBottom: 12 }}>Photo</Text>
            <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
              <Avatar size={80} style={{ backgroundColor: '#5c6bc0', fontSize: '36px' }}>
                {(user?.name || user?.email || 'U').charAt(0).toUpperCase()}
              </Avatar>
              <div>
                <div style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
                  <Button style={{ borderRadius: 6, fontWeight: 500 }}>Change photo</Button>
                  <Button danger style={{ borderRadius: 6, fontWeight: 500 }}>Remove photo</Button>
                </div>
                <Text type="secondary" style={{ fontSize: '13px', display: 'block' }}>Pick a photo up to 4MB.</Text>
                <Text type="secondary" style={{ fontSize: '13px' }}>Your avatar photo will be public.</Text>
              </div>
            </div>
          </div>

          {/* Name Section */}
          <div>
            <Text strong style={{ display: 'block', marginBottom: 8 }}>Name</Text>
            <Input 
              value={name} 
              onChange={e => setName(e.target.value)} 
              style={{ borderRadius: 6, padding: '6px 12px' }}
            />
          </div>

          {/* Email Section */}
          <div>
            <Text strong style={{ display: 'block', marginBottom: 8 }}>Email</Text>
            <Text style={{ display: 'block', marginBottom: 12 }}>{user?.email}</Text>
            <Button style={{ borderRadius: 6, fontWeight: 500 }}>Change email</Button>
          </div>

          {/* Password Section */}
          <div>
            <Text strong style={{ display: 'block', marginBottom: 8 }}>Password</Text>
            <Button style={{ borderRadius: 6, fontWeight: 500 }}>Add password</Button>
          </div>

          {/* 2FA Section */}
          <div>
            <Text strong style={{ display: 'block', marginBottom: 12 }}>Two-factor authentication</Text>
            <Switch size="small" style={{ marginBottom: 12 }} />
            <br />
            <Text type="secondary" style={{ fontSize: '13px' }}>2FA is disabled on your account.</Text>
          </div>

          <Divider style={{ margin: '16px 0' }} />

          {/* Connected Accounts */}
          <div>
            <Text strong style={{ display: 'block', marginBottom: 8 }}>Connected accounts</Text>
            <Text type="secondary" style={{ fontSize: '13px', display: 'block', marginBottom: 16 }}>
              Log in to Todoist with your Google, Facebook, or Apple account.
            </Text>
            <Text style={{ fontSize: '13px' }}>
              You can log in to Todoist with your Google account <Text strong>{user?.email}</Text>.
            </Text>
          </div>

          </div>
        )}

        {activeTab === 'theme' && (
          <div style={{ maxWidth: 600 }}>
            <Title level={3} style={{ borderBottom: '1px solid #f0f0f0', paddingBottom: 16, marginBottom: 32 }}>Theme</Title>
            <Text style={{ fontSize: 16, display: 'block', marginBottom: 24 }}>Personalize your task manager by choosing a primary theme color.</Text>
            
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              {THEME_COLORS.map(color => (
                <div
                  key={color.value}
                  onClick={() => setThemeColor(color.value)}
                  style={{
                    width: 48, height: 48, borderRadius: '50%', backgroundColor: color.value,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: themeColor === color.value ? `2px solid #000` : '2px solid transparent',
                    boxShadow: themeColor === color.value ? '0 0 0 3px #fff inset, 0 2px 8px rgba(0,0,0,0.15)' : '0 2px 8px rgba(0,0,0,0.1)',
                    transition: 'all 0.2s'
                  }}
                  title={color.name}
                />
              ))}
            </div>
          </div>
        )}

      </Content>
    </Layout>
  );
};

export default Settings;
