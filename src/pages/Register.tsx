import React, { useState } from 'react';
import { Form, Input, Button, message } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/auth.service';
import AuthLayout from '../layouts/AuthLayout';

const Register: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onFinish = async (values: any) => {
    try {
      setLoading(true);
      await authService.register({
        name: values.name,
        email: values.email,
        password: values.password
      });
      message.success('Registration successful! Please log in.');
      navigate('/login');
    } catch (error) {
      message.error('Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Create an Account" subtitle="Join TaskFlow and manage your projects today.">
      <Form
        name="register_form"
        layout="vertical"
        onFinish={onFinish}
        size="large"
        requiredMark={false}
      >
        <Form.Item
          label="Full Name"
          name="name"
          rules={[{ required: true, message: 'Please input your name!' }]}
        >
          <Input prefix={<UserOutlined style={{ color: 'var(--text-secondary)' }} />} placeholder="John Doe" />
        </Form.Item>
        <Form.Item
          label="Email"
          name="email"
          rules={[{ required: true, message: 'Please input your email!' }, { type: 'email', message: 'Valid email required!' }]}
        >
          <Input prefix={<MailOutlined style={{ color: 'var(--text-secondary)' }} />} placeholder="Enter your email" />
        </Form.Item>
        <Form.Item
          label="Password"
          name="password"
          rules={[{ required: true, message: 'Please input your password!' }, { min: 6, message: 'At least 6 characters' }]}
        >
          <Input.Password prefix={<LockOutlined style={{ color: 'var(--text-secondary)' }}/>} placeholder="••••••••" />
        </Form.Item>
        <Form.Item style={{ marginTop: 32 }}>
          <Button type="primary" htmlType="submit" block loading={loading} style={{ height: 44, fontSize: '1rem', fontWeight: 600 }}>
            Sign up
          </Button>
        </Form.Item>
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <span style={{ color: 'var(--text-secondary)' }}>Already have an account? </span>
          <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 500 }}>Log in</Link>
        </div>
      </Form>
    </AuthLayout>
  );
};

export default Register;
