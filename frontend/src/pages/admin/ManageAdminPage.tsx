//? Page: Manage Admin Page
//@ จัดการผู้ใช้งาน — ดู/เปลี่ยน Role / Soft Delete
//  เฉพาะ ADMIN และ CLUB_PRESIDENT

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Container, Table, Badge, Button,
  Modal, Form, Spinner, Alert, InputGroup,
} from 'react-bootstrap';
import { AdminService }  from '@/services/AdminService';
import { useAuth }       from '@/hooks/useAuth';
import { parseApiError } from '@/utils/apiError';  // ✅ ตรวจว่าไฟล์นี้มีอยู่จริง

// ✅ สร้าง Interface แทน any ทั้งหมด
interface UserEntry {
  id:         number;
  username:   string;
  role:       string;
  created_at: string;
  updated_at: string;
}

const ROLE_BADGE: Record<string, string> = {
  ADMIN:          'danger',
  CLUB_PRESIDENT: 'warning',
  EXTERNAL_USER:  'primary',
  GUEST:          'secondary',
};

const ROLE_LABEL: Record<string, string> = {
  ADMIN:          'แอดมิน',
  CLUB_PRESIDENT: 'ประธานชมรม',
  EXTERNAL_USER:  'สมาชิก',
  GUEST:          'Guest (ถูกระงับ)',
};

const CHANGEABLE_ROLES = ['ADMIN', 'CLUB_PRESIDENT', 'EXTERNAL_USER', 'GUEST'];

export const ManageAdminPage: React.FC = () => {
  const { user } = useAuth();
  const token = localStorage.getItem('token') ?? '';

  // ✅ แก้ any → UserEntry[]
  const [users,   setUsers]   = useState<UserEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const [search,  setSearch]  = useState('');

  // ✅ แก้ any → UserEntry | null
  const [showRoleModal,   setShowRoleModal]   = useState(false);
  const [roleTarget,      setRoleTarget]      = useState<UserEntry | null>(null);
  const [selectedRole,    setSelectedRole]    = useState('');
  const [savingRole,      setSavingRole]      = useState(false);
  const [roleError,       setRoleError]       = useState<string | null>(null);

  // ✅ แก้ any → UserEntry | null
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget,    setDeleteTarget]    = useState<UserEntry | null>(null);
  const [deleting,        setDeleting]        = useState(false);
  const [deleteError,     setDeleteError]     = useState<string | null>(null);

  // ✅ แก้ missing dependency: ใช้ useCallback
  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await AdminService.getAllUsers(token);
      setUsers(res.data ?? []);
    } catch (err: unknown) {  // ✅ แก้ any → unknown
      setError(parseApiError(err, 'โหลดข้อมูลผู้ใช้งานไม่สำเร็จ'));
    } finally {
      setLoading(false);
    }
  }, [token]); // ✅ deps: token เท่านั้น

  // ✅ เพิ่ม loadUsers ใน deps
  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const filteredUsers = useMemo(() =>
    users.filter(u =>
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      u.role.toLowerCase().includes(search.toLowerCase())
    ), [users, search]);

  // ✅ แก้ any → UserEntry
  const openRoleModal = (u: UserEntry) => {
    setRoleTarget(u);
    setSelectedRole(u.role);
    setRoleError(null);
    setShowRoleModal(true);
  };

  const confirmChangeRole = async () => {
    if (!roleTarget) return;
    setSavingRole(true);
    setRoleError(null);
    try {
      await AdminService.changeRole(roleTarget.id, selectedRole, token);
      setShowRoleModal(false);
      await loadUsers();
    } catch (err: unknown) {  // ✅ แก้ any → unknown
      setRoleError(parseApiError(err, 'เปลี่ยน Role ไม่สำเร็จ'));
    } finally {
      setSavingRole(false);
    }
  };

  // ✅ แก้ any → UserEntry
  const openDeleteModal = (u: UserEntry) => {
    setDeleteTarget(u);
    setDeleteError(null);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await AdminService.deleteUser(deleteTarget.id, token);
      setShowDeleteModal(false);
      await loadUsers();
    } catch (err: unknown) {  // ✅ แก้ any → unknown
      setDeleteError(parseApiError(err, 'ลบผู้ใช้งานไม่สำเร็จ'));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Container className="py-5">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">จัดการสมาชิก</h2>
          <p className="text-muted mb-0">ดู เปลี่ยน Role หรือระงับสมาชิก</p>
        </div>
        <Badge bg="primary" className="fs-6 px-3 py-2 rounded-pill">
          ทั้งหมด {users.length} บัญชี
        </Badge>
      </div>

      {/* Search */}
      <InputGroup className="mb-4" style={{ maxWidth: 400 }}>
        <InputGroup.Text>🔍</InputGroup.Text>
        <Form.Control
          placeholder="ค้นหาชื่อผู้ใช้หรือ Role..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {search && (
          <Button variant="outline-secondary" onClick={() => setSearch('')}>✕</Button>
        )}
      </InputGroup>

      {loading && (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
        </div>
      )}
      {error && <Alert variant="danger">{error}</Alert>}

      {!loading && !error && (
        <div className="table-responsive rounded-4 shadow-sm border">
          <Table hover className="mb-0 align-middle">
            <thead className="table-dark">
              <tr>
                <th>#</th>
                <th>ชื่อผู้ใช้</th>
                <th>Role</th>
                <th>วันที่สมัคร</th>
                <th className="text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center text-muted py-4">
                    ไม่พบผู้ใช้งาน
                  </td>
                </tr>
              ) : filteredUsers.map((u, idx) => (
                <tr key={u.id} style={{ opacity: u.role === 'GUEST' ? 0.5 : 1 }}>
                  <td className="text-muted">{idx + 1}</td>
                  <td className="fw-medium">
                    {u.username}
                    {u.id === user?.id && (
                      <Badge bg="info" className="ms-2 rounded-pill" style={{ fontSize: 10 }}>
                        คุณ
                      </Badge>
                    )}
                  </td>
                  <td>
                    <Badge bg={ROLE_BADGE[u.role] ?? 'secondary'} className="rounded-pill px-3">
                      {ROLE_LABEL[u.role] ?? u.role}
                    </Badge>
                  </td>
                  <td className="text-muted small">
                    {new Date(u.created_at).toLocaleDateString('th-TH')}
                  </td>
                  <td className="text-center">
                    {u.id !== user?.id && u.role !== 'GUEST' && (
                      <div className="d-flex gap-2 justify-content-center">
                        <Button size="sm" variant="outline-warning"
                          className="rounded-pill px-3"
                          onClick={() => openRoleModal(u)}>
                          ✏️ เปลี่ยน Role
                        </Button>
                        <Button size="sm" variant="outline-danger"
                          className="rounded-pill px-3"
                          onClick={() => openDeleteModal(u)}>
                          🗑️ ระงับ
                        </Button>
                      </div>
                    )}
                    {u.role === 'GUEST' && (
                      <span className="text-muted small">ถูกระงับแล้ว</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      )}

      {/* Modal เปลี่ยน Role */}
      <Modal show={showRoleModal} onHide={() => setShowRoleModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold text-warning">
            ✏️ เปลี่ยน Role — {roleTarget?.username}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {roleError && <Alert variant="danger">{roleError}</Alert>}
          <Form.Group>
            <Form.Label className="fw-medium">เลือก Role ใหม่</Form.Label>
            <Form.Select
              value={selectedRole}
              onChange={e => setSelectedRole(e.target.value)}
            >
              {CHANGEABLE_ROLES.map(r => (
                <option key={r} value={r}>{ROLE_LABEL[r] ?? r}</option>
              ))}
            </Form.Select>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" disabled={savingRole}
            onClick={() => setShowRoleModal(false)}>
            ยกเลิก
          </Button>
          <Button variant="warning" onClick={confirmChangeRole} disabled={savingRole}>
            {savingRole ? <><Spinner size="sm" className="me-1" />บันทึก...</> : 'บันทึก'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal ยืนยันระงับ */}
      <Modal show={showDeleteModal}
        onHide={() => { if (!deleting) setShowDeleteModal(false); }}
        centered>
        <Modal.Header closeButton={!deleting} className="bg-danger text-white">
          <Modal.Title className="fw-bold">🗑️ ระงับผู้ใช้งาน</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center py-3">
          <p className="fs-5 mb-1">
            ต้องการระงับบัญชี <strong>{deleteTarget?.username}</strong> ใช่หรือไม่?
          </p>
          <small className="text-muted">
            บัญชีจะถูกเปลี่ยนเป็น Guest — ไม่สามารถเข้าสู่ระบบได้
          </small>
          {deleteError && <Alert variant="danger" className="mt-3 mb-0">{deleteError}</Alert>}
        </Modal.Body>
        <Modal.Footer className="justify-content-center gap-2">
          <Button variant="secondary" disabled={deleting}
            onClick={() => setShowDeleteModal(false)}>
            ยกเลิก
          </Button>
          <Button variant="danger" onClick={confirmDelete} disabled={deleting}>
            {deleting ? <><Spinner size="sm" className="me-1" />กำลังระงับ...</> : 'ยืนยันระงับ'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};