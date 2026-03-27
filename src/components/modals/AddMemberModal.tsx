import React, { useState, useEffect } from 'react';
import { Modal, Form, Select, message } from 'antd';
import { projectService } from '../../services/project.service';
import { authService } from '../../services/auth.service';
import { type User } from '../../types';

interface Props {
  open: boolean;
  groupId: number;
  currentMembers: User[];
  onClose: () => void;
  onSuccess: () => void;
}

const AddMemberModal: React.FC<Props> = ({ open, groupId, currentMembers, onClose, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [allUsers, setAllUsers] = useState<User[]>([]);

  useEffect(() => {
    if (open) {
      authService.getAllUsers().then(data => setAllUsers(data || [])).catch(() => {});
    }
  }, [open]);

  // Filter out users already in the group
  const availableUsers = allUsers.filter(u => !currentMembers.find(m => m.id === u.id));

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      await projectService.addMemberToGroup(groupId, values.userId);
      message.success('Member added successfully!');
      form.resetFields();
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error(error);
      const errMsg = error?.response?.data?.message || error?.message || 'Failed to add member';
      message.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Add Member to Project"
      open={open}
      onOk={handleSubmit}
      onCancel={onClose}
      confirmLoading={loading}
      okText="Add"
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="userId"
          label="Select User"
          rules={[{ required: true, message: 'Please select a user!' }]}
        >
          <Select placeholder="Search for user" showSearch optionFilterProp="children">
            {availableUsers.map(user => (
              <Select.Option key={user.id} value={user.id}>
                {user.name || user.email} ({user.email})
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AddMemberModal;
