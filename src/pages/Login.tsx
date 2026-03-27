import React, { useState } from 'react';
import { Form, Input, Button, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/auth.service';
import AuthLayout from '../layouts/AuthLayout';

const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onFinish = async (values: any) => {
    try {
      setLoading(true);
      await authService.login({
        email: values.email,
        password: values.password
      });
      // Handle either raw string token or object


      message.success('Welcome back to TaskFlow');
      navigate('/dashboard');
    } catch (error) {
      message.error('Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Sign In" subtitle="Welcome back! Please enter your details.">
      <Form
        name="login_form"
        layout="vertical"
        onFinish={onFinish}
        size="large"
        requiredMark={false}
      >
        <Form.Item
          label="Email"
          name="email"
          rules={[{ required: true, message: 'Please input your email!' }, { type: 'email', message: 'Valid email required!' }]}
        >
          <Input prefix={<UserOutlined style={{ color: 'var(--text-secondary)' }} />} placeholder="Enter your email" />
        </Form.Item>
        <Form.Item
          label="Password"
          name="password"
          rules={[{ required: true, message: 'Please input your password!' }]}
        >
          <Input.Password prefix={<LockOutlined style={{ color: 'var(--text-secondary)' }} />} placeholder="••••••••" />
        </Form.Item>
        <Form.Item style={{ marginTop: 32 }}>
          <Button type="primary" htmlType="submit" block loading={loading} style={{ height: 44, fontSize: '1rem', fontWeight: 600 }}>
            Sign in
          </Button>
        </Form.Item>
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <span style={{ color: 'var(--text-secondary)' }}>Don't have an account? </span>
          <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 500 }}>Sign up for free</Link>
        </div>
      </Form>
    </AuthLayout>
  );
};

export default Login;
