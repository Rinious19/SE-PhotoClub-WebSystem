//? Page: Manage Admin Page
//@ จัดการผู้ใช้งาน — ดู/เปลี่ยนบทบาท / ระงับบัญชี / ลบถาวร
//  เฉพาะ ADMIN และ CLUB_PRESIDENT

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Container, Table, Badge, Button,
  Modal, Form, Spinner, Alert, InputGroup, Row, Col, Card
} from 'react-bootstrap';
import { AdminService }  from '@/services/AdminService';
import { useAuth }        from '@/hooks/useAuth';
import { parseApiError } from '@/utils/apiError';

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
  GUEST:          'ถูกระงับ',
};

// สำหรับใช้ใน Dropdown กรองข้อมูล
const FILTER_OPTIONS = [
  { value: 'all', label: 'ทุกบทบาท' },
  { value: 'EXTERNAL_USER', label: 'สมาชิก' },
  { value: 'CLUB_PRESIDENT', label: 'ประธานชมรม' },
  { value: 'ADMIN', label: 'แอดมิน' },
  { value: 'GUEST', label: 'ถูกระงับ' },
];

const CHANGEABLE_ROLES = ['ADMIN', 'CLUB_PRESIDENT', 'EXTERNAL_USER', 'GUEST'];

export const ManageAdminPage: React.FC = () => {
  const { user } = useAuth();
  const token = localStorage.getItem('token') ?? '';

  const [users,   setUsers]   = useState<UserEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  
  // States สำหรับการกรอง
  const [search,     setSearch]       = useState('');
  const [filterRole, setFilterRole]   = useState('all');

  // === Modal เปลี่ยนบทบาท ===
  const [showRoleModal,   setShowRoleModal]   = useState(false);
  const [roleTarget,      setRoleTarget]      = useState<UserEntry | null>(null);
  const [selectedRole,    setSelectedRole]    = useState('');
  const [savingRole,      setSavingRole]      = useState(false);
  const [roleError,       setRoleError]       = useState<string | null>(null);

  // === Modal ระงับบัญชี ===
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget,    setDeleteTarget]    = useState<UserEntry | null>(null);
  const [deleting,        setDeleting]        = useState(false);
  const [deleteError,     setDeleteError]     = useState<string | null>(null);

  // === Modal ยกเลิกการระงับ ===
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [restoreTarget,    setRestoreTarget]    = useState<UserEntry | null>(null);
  const [restoring,        setRestoring]        = useState(false);
  const [restoreError,     setRestoreError]     = useState<string | null>(null);

  // === Modal ลบถาวร ===
  const [showHardDeleteModal, setShowHardDeleteModal] = useState(false);
  const [hardDeleteTarget,    setHardDeleteTarget]    = useState<UserEntry | null>(null);
  const [hardDeleting,        setHardDeleting]        = useState(false);
  const [hardDeleteError,     setHardDeleteError]     = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await AdminService.getAllUsers(token);
      setUsers(res.data ?? []);
    } catch (err: unknown) {
      setError(parseApiError(err, 'โหลดข้อมูลผู้ใช้งานไม่สำเร็จ'));
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchesSearch = u.username.toLowerCase().includes(search.toLowerCase());
      const matchesRole = filterRole === 'all' || u.role === filterRole;
      return matchesSearch && matchesRole;
    });
  }, [users, search, filterRole]);

  // --- ฟังก์ชันทำงานของ Modal เปลี่ยนบทบาท ---
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
    } catch (err: unknown) {
      setRoleError(parseApiError(err, 'เปลี่ยนบทบาทไม่สำเร็จ'));
    } finally {
      setSavingRole(false);
    }
  };

  // --- ฟังก์ชันทำงานของ Modal ระงับบัญชี ---
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
    } catch (err: unknown) {
      setDeleteError(parseApiError(err, 'ระงับผู้ใช้งานไม่สำเร็จ'));
    } finally {
      setDeleting(false);
    }
  };

  // --- ฟังก์ชันทำงานของ Modal ยกเลิกการระงับ ---
  const openRestoreModal = (u: UserEntry) => {
    setRestoreTarget(u);
    setRestoreError(null);
    setShowRestoreModal(true);
  };
  const confirmRestore = async () => {
    if (!restoreTarget) return;
    setRestoring(true);
    setRestoreError(null);
    try {
      await AdminService.changeRole(restoreTarget.id, 'EXTERNAL_USER', token);
      setShowRestoreModal(false);
      await loadUsers();
    } catch (err: unknown) {
      setRestoreError(parseApiError(err, 'ยกเลิกการระงับไม่สำเร็จ'));
    } finally {
      setRestoring(false);
    }
  };

  // --- ฟังก์ชันทำงานของ Modal ลบถาวร ---
  const openHardDeleteModal = (u: UserEntry) => {
    setHardDeleteTarget(u);
    setHardDeleteError(null);
    setShowHardDeleteModal(true);
  };
  const confirmHardDelete = async () => {
    if (!hardDeleteTarget) return;
    setHardDeleting(true);
    setHardDeleteError(null);
    try {
      // เรียกใช้ API ลบถาวร (บังคับ type เป็น any เพื่อป้องกัน error กรณี TS หา type ไม่เจอ)
      await (AdminService as any).deleteUserPermanent(hardDeleteTarget.id, token);
      setShowHardDeleteModal(false);
      await loadUsers();
    } catch (err: unknown) {
      setHardDeleteError(parseApiError(err, 'ไม่สามารถลบได้: บัญชีนี้อาจมีข้อมูลกิจกรรมผูกอยู่'));
    } finally {
      setHardDeleting(false);
    }
  };

  return (
    <Container className="py-5">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">จัดการสมาชิก</h2>
          <p className="text-muted mb-0">ดู เปลี่ยนบทบาท ระงับ หรือลบสมาชิกในระบบ</p>
        </div>
        <Badge bg="primary" className="fs-6 px-4 py-2 rounded-pill shadow-sm">
          ทั้งหมด {users.length} บัญชี
        </Badge>
      </div>

      {/* 🔍 ส่วนการกรองข้อมูล */}
      <Card className="border-0 shadow-sm rounded-4 mb-4">
        <Card.Body className="p-3 bg-light rounded-4">
          <Row className="g-3">
            <Col md={7}>
              <Form.Label className="small fw-bold text-muted">ค้นหาชื่อผู้ใช้</Form.Label>
              <InputGroup>
                <InputGroup.Text className="bg-white border-end-0">🔍</InputGroup.Text>
                <Form.Control
                  className="border-start-0"
                  placeholder="พิมพ์ชื่อที่ต้องการค้นหา..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </InputGroup>
            </Col>
            <Col md={5}>
              <Form.Label className="small fw-bold text-muted">กรองตามบทบาท</Form.Label>
              <Form.Select 
                value={filterRole} 
                onChange={e => setFilterRole(e.target.value)}
              >
                {FILTER_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </Form.Select>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {loading && (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-2 text-muted small">กำลังโหลดข้อมูล...</p>
        </div>
      )}frontend/src/services/AdminService.ts
      {error && <Alert variant="danger" className="rounded-4">{error}</Alert>}

      {!loading && !error && (
        <div className="table-responsive rounded-4 shadow-sm border overflow-hidden">
          <Table className="mb-0 align-middle bg-white">
            <thead className="table-dark">
              <tr>
                <th className="ps-4">#</th>
                <th>ชื่อผู้ใช้</th>
                <th>บทบาท</th>
                <th>วันที่สมัคร</th>
                <th className="text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center text-muted py-5">
                    <div className="fs-2 mb-2">📂</div>
                    ไม่พบข้อมูลสมาชิกตามเงื่อนไขที่ระบุ
                  </td>
                </tr>
              ) : filteredUsers.map((u, idx) => (
                <tr key={u.id} style={{ opacity: u.role === 'GUEST' ? 0.6 : 1 }}>
                  <td className="ps-4 text-muted">{idx + 1}</td>
                  <td className="fw-bold">
                    {u.username}
                    {u.id === user?.id && (
                      <Badge bg="info" className="ms-2 rounded-pill" style={{ fontSize: 10 }}>
                        คุณ
                      </Badge>
                    )}
                  </td>
                  <td>
                    <Badge bg={ROLE_BADGE[u.role] ?? 'secondary'} className="rounded-pill px-3 py-2 fw-medium">
                      {ROLE_LABEL[u.role] ?? u.role}
                    </Badge>
                  </td>
                  <td className="text-muted small">
                    {new Date(u.created_at).toLocaleDateString('th-TH', { 
                      day: '2-digit', month: 'short', year: 'numeric' 
                    })}
                  </td>
                  <td className="text-center">
                    {u.id !== user?.id && (
                      // ✅ เพิ่ม align-items-center เพื่อให้ปุ่มอยู่ระนาบเดียวกันเป๊ะๆ
                      <div className="d-flex gap-2 justify-content-center align-items-center">
                        {u.role !== 'GUEST' ? (
                          <>
                            <Button 
                              size="sm" 
                              variant="outline-warning" 
                              className="rounded-pill fw-bold d-flex align-items-center justify-content-center" 
                              style={{ minWidth: '145px', gap: '6px' }} // ✅ ฟิกความกว้าง
                              onClick={() => openRoleModal(u)}
                            >
                              ✏️ เปลี่ยนบทบาท
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline-danger" 
                              className="rounded-pill fw-bold d-flex align-items-center justify-content-center" 
                              style={{ minWidth: '110px', gap: '6px' }} // ✅ ฟิกความกว้าง
                              onClick={() => openDeleteModal(u)}
                            >
                              🗑️ ระงับ
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button 
                              size="sm" 
                              variant="outline-success" 
                              className="rounded-pill fw-bold d-flex align-items-center justify-content-center" 
                              style={{ minWidth: '145px', gap: '6px' }} 
                              onClick={() => openRestoreModal(u)}
                            >
                              🔄 ยกเลิกการระงับ
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline-danger" 
                              className="rounded-pill fw-bold d-flex align-items-center justify-content-center" 
                              style={{ minWidth: '110px', gap: '6px' }} 
                              onClick={() => openHardDeleteModal(u)}
                            >
                              ❌ ลบถาวร
                            </Button>
                          </>
                        )}
                      </div>
                    )}
                    {u.role === 'GUEST' && u.id === user?.id && (
                      <span className="text-muted small italic">บัญชีถูกระงับการใช้งาน</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      )}

      {/* =========================================
          MODALS ZONE
      ========================================= */}

      {/* 1. Modal เปลี่ยนบทบาท */}
      <Modal show={showRoleModal} onHide={() => setShowRoleModal(false)} centered>
        <Modal.Header closeButton className="bg-warning text-dark border-0">
          <Modal.Title className="fw-bold fs-5">✏️ แก้ไขบทบาทสมาชิก</Modal.Title>
        </Modal.Header>
        <Modal.Body className="py-4 px-4">
          <p className="text-muted small mb-3 text-center">กำลังแก้ไขบทบาทของ: <strong className="text-dark fs-6">{roleTarget?.username}</strong></p>
          {roleError && <Alert variant="danger">{roleError}</Alert>}
          <Form.Group>
            <Form.Label className="fw-bold small">กรุณาเลือกบทบาทใหม่</Form.Label>
            <Form.Select
              value={selectedRole}
              onChange={e => setSelectedRole(e.target.value)}
              className="rounded-3"
            >
              {CHANGEABLE_ROLES.map(r => (
                <option key={r} value={r}>{ROLE_LABEL[r] ?? r}</option>
              ))}
            </Form.Select>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer className="justify-content-center gap-3 border-0 pb-4 pt-0">
          <Button variant="outline-secondary" className="rounded-pill px-4 fw-bold" disabled={savingRole} onClick={() => setShowRoleModal(false)}>
            ยกเลิก
          </Button>
          <Button variant="warning" className="rounded-pill px-4 fw-bold text-dark" onClick={confirmChangeRole} disabled={savingRole}>
            {savingRole ? <Spinner size="sm" /> : 'ยืนยันการเปลี่ยนบทบาท'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* 2. Modal ระงับบัญชี (Soft Delete) */}
      <Modal show={showDeleteModal} onHide={() => { if (!deleting) setShowDeleteModal(false); }} centered>
        <Modal.Header closeButton={!deleting} className="bg-danger text-white border-0">
          <Modal.Title className="fw-bold fs-5">🗑️ ระงับบัญชีผู้ใช้งาน</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center py-4 px-4">
          <div className="mb-3" style={{ fontSize: '3.5rem', lineHeight: 1 }}>⚠️</div>
          <h5 className="mb-3 fw-bold text-dark">ต้องการระงับบัญชี {deleteTarget?.username} ใช่หรือไม่?</h5>
          <p className="text-muted small mb-0">บัญชีจะถูกเปลี่ยนสถานะเป็น "ถูกระงับ" และไม่สามารถเข้าถึงระบบในฐานะสมาชิกได้</p>
          {deleteError && <Alert variant="danger" className="mt-3 mb-0">{deleteError}</Alert>}
        </Modal.Body>
        <Modal.Footer className="justify-content-center gap-3 border-0 pb-4 pt-0">
          <Button variant="outline-secondary" className="rounded-pill px-4 fw-bold" disabled={deleting} onClick={() => setShowDeleteModal(false)}>
            ยกเลิก
          </Button>
          <Button variant="danger" className="rounded-pill px-4 fw-bold" onClick={confirmDelete} disabled={deleting}>
            {deleting ? <Spinner size="sm" /> : 'ยืนยันการระงับบัญชี'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* 3. Modal ยกเลิกการระงับบัญชี (Restore) */}
      <Modal show={showRestoreModal} onHide={() => { if (!restoring) setShowRestoreModal(false); }} centered>
        <Modal.Header closeButton={!restoring} className="bg-success text-white border-0">
          <Modal.Title className="fw-bold fs-5">🔄 ยกเลิกการระงับบัญชี</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center py-4 px-4">
          <div className="mb-3" style={{ fontSize: '3.5rem', lineHeight: 1 }}>✅</div>
          <h5 className="mb-3 fw-bold text-dark">ต้องการยกเลิกการระงับบัญชี {restoreTarget?.username} ใช่หรือไม่?</h5>
          <p className="text-muted small mb-0">บัญชีจะถูกเปลี่ยนสถานะกลับเป็น "สมาชิก" และสามารถเข้าใช้งานระบบได้ตามปกติ</p>
          {restoreError && <Alert variant="danger" className="mt-3 mb-0">{restoreError}</Alert>}
        </Modal.Body>
        <Modal.Footer className="justify-content-center gap-3 border-0 pb-4 pt-0">
          <Button variant="outline-secondary" className="rounded-pill px-4 fw-bold" disabled={restoring} onClick={() => setShowRestoreModal(false)}>
            ยกเลิก
          </Button>
          <Button variant="success" className="rounded-pill px-4 fw-bold" onClick={confirmRestore} disabled={restoring}>
            {restoring ? <Spinner size="sm" /> : 'ยืนยันยกเลิกการระงับบัญชี'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* 4. Modal ลบถาวร (Hard Delete) */}
      <Modal show={showHardDeleteModal} onHide={() => { if (!hardDeleting) setShowHardDeleteModal(false); }} centered>
        <Modal.Header closeButton={!hardDeleting} className="bg-danger text-white border-0">
          <Modal.Title className="fw-bold fs-5">🚨 ลบบัญชีผู้ใช้งานถาวร</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center py-4 px-4">
          <div className="mb-3" style={{ fontSize: '3.5rem', lineHeight: 1 }}>⚠️</div>
          <h5 className="mb-3 fw-bold text-danger">ต้องการลบบัญชี {hardDeleteTarget?.username} ถาวรใช่หรือไม่?</h5>
          <p className="text-muted small mb-0 fw-bold">การกระทำนี้ไม่สามารถกู้คืนได้ ข้อมูลทั้งหมดที่เกี่ยวกับบัญชีนี้จะถูกลบออกจากฐานข้อมูล!</p>
          {hardDeleteError && <Alert variant="danger" className="mt-3 mb-0 small">{hardDeleteError}</Alert>}
        </Modal.Body>
        <Modal.Footer className="justify-content-center gap-3 border-0 pb-4 pt-0">
          <Button variant="outline-secondary" className="rounded-pill px-4 fw-bold" disabled={hardDeleting} onClick={() => setShowHardDeleteModal(false)}>
            ยกเลิก
          </Button>
          <Button variant="danger" className="rounded-pill px-4 fw-bold" onClick={confirmHardDelete} disabled={hardDeleting}>
            {hardDeleting ? <Spinner size="sm" /> : 'ยืนยันการลบบัญชีถาวร'}
          </Button>
        </Modal.Footer>
      </Modal>

    </Container>
  );
};