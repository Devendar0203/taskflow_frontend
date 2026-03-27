import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Select, message, DatePicker, TimePicker, Divider } from 'antd';
import { ClockCircleOutlined } from '@ant-design/icons';
import { taskService } from '../../services/task.service';
import { projectService } from '../../services/project.service';
import { authService } from '../../services/auth.service';
import { type Project, type User } from '../../types';

interface Props {
  open: boolean;
  groupId?: number;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateTaskModal: React.FC<Props> = ({ open, groupId, onClose, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [members, setMembers] = useState<User[]>([]);
  const currentUser = authService.getCurrentUser();
  const isAdmin = currentUser?.role === 'ADMIN';

  useEffect(() => {
    if (open) {
      if (!groupId) {
        projectService.getProjects().then(data => setProjects(data || [])).catch(() => { });
      } else {
        projectService.getGroupMembers(groupId).then(data => setMembers(data || [])).catch(() => { });
      }
    }
  }, [open, groupId]);

  const handleProjectChange = async (val: number) => {
    try {
      const data = await projectService.getGroupMembers(val);
      setMembers(data || []);
      form.setFieldValue('assignedUserId', undefined);
    } catch (e) { }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      // Validate time range if both provided
      if (values.startTime && values.endTime) {
        const start = values.startTime.hour() * 60 + values.startTime.minute();
        const end = values.endTime.hour() * 60 + values.endTime.minute();
        if (end <= start) {
          message.error('End time must be after start time.');
          setLoading(false);
          return;
        }
      }

      // Refined payload using conditional object spreading
      const payload = {
        title: values.title,
        description: values.description,
        priority: values.priority || 'MEDIUM',
        status: values.status || 'TODO',
        ...(values.dueDate && { dueDate: values.dueDate.format('YYYY-MM-DD') + 'T23:59:59' }),
        ...(values.startTime && { startTime: values.startTime.format('HH:mm') }),
        ...(values.endTime && { endTime: values.endTime.format('HH:mm') }),
        ...(values.assignedUserId && { assignedUserId: values.assignedUserId }),
        // Check props groupId first, then form values.groupId if ADMIN
        ...(groupId 
          ? { groupId } 
          : (isAdmin && values.groupId ? { groupId: values.groupId } : {})
        )
      };

      await taskService.createTask(payload);

      message.success('Task created successfully!');
      form.resetFields();
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error(error);
      if (error?.errorFields) return; // validation error, antd handles it
      const serverMsg = error.response?.data?.message || error.response?.data?.error || error.message || 'Unknown error';
      message.error(`Failed to create task: ${serverMsg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={groupId ? 'Create New Task' : 'Create New Task'}
      open={open}
      onOk={handleSubmit}
      onCancel={onClose}
      confirmLoading={loading}
      okText="Create Task"
      width={520}
    >
      <Form form={form} layout="vertical" style={{ marginTop: 8 }}>
        {/* Project (global only) */}
        {!groupId && isAdmin && (
          <Form.Item name="groupId" label="Project" rules={[{ required: false }]}>
            <Select placeholder="Select a project" onChange={handleProjectChange}>
              {projects.map(proj => (
                <Select.Option key={proj.id} value={proj.id}>{proj.name}</Select.Option>
              ))}
            </Select>
          </Form.Item>
        )}

        {/* Assignee */}
        {(groupId || form.getFieldValue('groupId')) && isAdmin && (
          <Form.Item name="assignedUserId" label="Assign To">
            <Select placeholder="Select team member (optional)" allowClear>
              {members.map(m => (
                <Select.Option key={m.id} value={m.id}>{m.name || m.email}</Select.Option>
              ))}
            </Select>
          </Form.Item>
        )}

        {/* Title */}
        <Form.Item name="title" label="Task Title" rules={[{ required: true, message: 'Please enter a task title' }]}>
          <Input placeholder="e.g. Design landing page" />
        </Form.Item>

        {/* Description */}
        <Form.Item name="description" label="Description">
          <Input.TextArea placeholder="Add more details…" rows={2} />
        </Form.Item>

        {/* Priority + Status row */}
        <div style={{ display: 'flex', gap: 16 }}>
          <Form.Item name="priority" label="Priority" initialValue="MEDIUM" style={{ flex: 1 }}>
            <Select>
              <Select.Option value="HIGH"><span style={{ color: '#ff4d4f', fontWeight: 600 }}>● High</span></Select.Option>
              <Select.Option value="MEDIUM"><span style={{ color: '#fa8c16', fontWeight: 600 }}>● Medium</span></Select.Option>
              <Select.Option value="LOW"><span style={{ color: '#52c41a', fontWeight: 600 }}>● Low</span></Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="status" label="Status" initialValue="TODO" style={{ flex: 1 }}>
            <Select>
              <Select.Option value="TODO">📋 Todo</Select.Option>
              <Select.Option value="IN_PROGRESS">🔄 In Progress</Select.Option>
              <Select.Option value="DONE">✅ Done</Select.Option>
            </Select>
          </Form.Item>
        </div>

        {/* Due Date */}
        <Form.Item name="dueDate" label="Due Date">
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>

        <Divider style={{ margin: '4px 0 12px' }}>
          <span style={{ fontSize: 12, color: '#aaa', display: 'flex', alignItems: 'center', gap: 6 }}>
            <ClockCircleOutlined /> Time Block
          </span>
        </Divider>

        {/* Start + End Time row */}
        <div style={{ display: 'flex', gap: 16 }}>
          <Form.Item
            name="startTime"
            label="Start Time"
            style={{ flex: 1 }}
            tooltip="Sets when this task begins on the Filters & Labels calendar"
          >
            <TimePicker
              format="HH:mm"
              minuteStep={15}
              style={{ width: '100%' }}
              placeholder="e.g. 09:00"
              needConfirm={false}
            />
          </Form.Item>
          <Form.Item
            name="endTime"
            label="End Time"
            style={{ flex: 1 }}
            tooltip="Sets when this task ends on the Filters & Labels calendar"
            dependencies={['startTime']}
            rules={[
              ({ getFieldValue }) => ({
                validator(_, value) {
                  const start = getFieldValue('startTime');
                  if (!value || !start) return Promise.resolve();
                  const s = start.hour() * 60 + start.minute();
                  const e = value.hour() * 60 + value.minute();
                  if (e > s) return Promise.resolve();
                  return Promise.reject(new Error('End time must be after start time'));
                },
              }),
            ]}
          >
            <TimePicker
              format="HH:mm"
              minuteStep={15}
              style={{ width: '100%' }}
              placeholder="e.g. 10:30"
              needConfirm={false}
            />
          </Form.Item>
        </div>

        {/* Duration hint */}
        <Form.Item noStyle shouldUpdate>
          {({ getFieldValue }) => {
            const s = getFieldValue('startTime');
            const e = getFieldValue('endTime');
            if (!s || !e) return null;
            const mins = (e.hour() * 60 + e.minute()) - (s.hour() * 60 + s.minute());
            if (mins <= 0) return null;
            const h = Math.floor(mins / 60);
            const m = mins % 60;
            const label = h > 0 ? `${h}h ${m > 0 ? m + 'min' : ''}` : `${m} min`;
            return (
              <div style={{ marginTop: -12, marginBottom: 12, fontSize: 12, color: '#1677ff' }}>
                ⏱ Duration: <strong>{label}</strong>
              </div>
            );
          }}
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default CreateTaskModal;
