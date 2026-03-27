import React, { useState } from 'react';
import { Modal, Form, Input, message } from 'antd';
import { projectService } from '../../services/project.service';
import { authService } from '../../services/auth.service';

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateProjectModal: React.FC<Props> = ({ open, onClose, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const user = authService.getCurrentUser();

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      await projectService.createProject({
        name: values.name,
        description: values.description,
        admin: user ? { id: user.id } : undefined
      } as any);
      message.success('Project created successfully!');
      form.resetFields();
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error(error);
      const errMsg = error?.response?.data?.message || error?.message || 'Failed to create project';
      message.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Create New Project"
      open={open}
      onOk={handleSubmit}
      onCancel={onClose}
      confirmLoading={loading}
      okText="Create Project"
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="name"
          label="Project Name"
          rules={[{ required: true, message: 'Please enter a project name' }]}
        >
          <Input placeholder="e.g. Frontend Redesign" />
        </Form.Item>
        <Form.Item
          name="description"
          label="Description"
        >
          <Input.TextArea placeholder="What is this project about?" rows={3} />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default CreateProjectModal;
