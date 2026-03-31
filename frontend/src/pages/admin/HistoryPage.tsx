//? Page: History Page
//@ แสดง Audit Log ของระบบ — เฉพาะ Admin/President

import React, { useState, useEffect, useCallback } from 'react';
import {
  Container, Table, Badge, Button,
  Spinner, Alert, Form, Row, Col,
  Pagination,
} from 'react-bootstrap';
import { AdminService }  from '@/services/AdminService';
import { parseApiError } from '@/utils/apiError';

//* context (สี Badge ตาม action)
const ACTION_BADGE: Record<string, string> = {
  CHANGE_ROLE:   'warning',
  CREATE_USER:   'success',
  DELETE_USER:   'danger',
  UPLOAD_PHOTO:  'primary',
  UPDATE_PHOTO:  'success',
  DELETE_PHOTO:  'danger',
  CREATE_EVENT:  'info',
  UPDATE_EVENT:  'warning',
  DELETE_EVENT:  'danger',
  SYSTEM:        'secondary',
};

const ACTION_LABEL: Record<string, string> = {
  CHANGE_ROLE:   'เปลี่ยน Role',
  CREATE_USER:   'สร้าง User',
  DELETE_USER:   'ระงับ User',
  UPLOAD_PHOTO:  'อัปโหลดรูป',
  UPDATE_PHOTO:  'อัปเดตรูป',
  DELETE_PHOTO:  'ลบรูป',
  CREATE_EVENT:  'สร้างอีเว้นท์',
  UPDATE_EVENT:  'แก้ไขอีเว้นท์',
  DELETE_EVENT:  'ลบอีเว้นท์',
  SYSTEM:        'System',
};

const TYPE_LABEL: Record<string, string> = {
  USER:     '👤 User',
  PHOTO:    '🖼️ Photo',
  ACTIVITY: '🏆 Activity',
  SYSTEM:   '⚙️ System',
};

const PAGE_SIZE = 20;

export const HistoryPage: React.FC = () => {
  const token = localStorage.getItem('token') ?? '';

  interface HistoryLogEntry {
  id:          number;
  actor_id:    number | null;
  actor_name:  string | null;
  action:      string;
  target_type: string;
  target_id:   number | null;
  detail:      string | null;
  created_at:  string;
}

const [logs, setLogs] = useState<HistoryLogEntry[]>([]);
  const [total,       setTotal]       = useState(0);
  const [totalPages,  setTotalPages]  = useState(1);
  const [page,        setPage]        = useState(1);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState<string | null>(null);

  //* context (filter state)
  const [filterAction, setFilterAction] = useState('');
  const [filterType,   setFilterType]   = useState('');

  const loadHistory = useCallback(async (targetPage: number) => {
    try {
      setLoading(true);
      setError(null);
      const res = await AdminService.getHistory({
        page:   targetPage,
        limit:  PAGE_SIZE,
        action: filterAction || undefined,
        type:   filterType   || undefined,
        token,
      });
      setLogs(res.data        || []);
      setTotal(res.pagination?.total      ?? 0);
      setTotalPages(res.pagination?.totalPages ?? 1);
    } catch (err: unknown) {
      setError(parseApiError(err, 'โหลด History ไม่สำเร็จ'));
    } finally {
      setLoading(false);
    }
  }, [filterAction, filterType, token]);

  useEffect(() => {
  loadHistory(page);
}, [page, loadHistory]);

  useEffect(() => {
  setPage(1);
}, [filterAction, filterType]);

  //* context (แปลง detail JSON string → object สำหรับแสดงผล)
  const parseDetail = (detail: string | null) => {
    if (!detail) return null;
    try { return JSON.parse(detail); }
    catch { return detail; }
  };

  const renderDetail = (detail: string | null) => {
    const d = parseDetail(detail);
    if (!d) return <span className="text-muted">—</span>;
    if (typeof d === 'string') return <small>{d}</small>;
    return (
      <small className="text-muted">
        {Object.entries(d).map(([k, v]) => (
          <span key={k} className="me-2">
            <strong>{k}:</strong> {String(v)}
          </span>
        ))}
      </small>
    );
  };

  return (
    <Container className="py-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">ประวัติการใช้งาน</h2>
          <p className="text-muted mb-0">บันทึกการเปลี่ยนแปลงในระบบ</p>
        </div>
        <Badge bg="secondary" className="fs-6 px-3 py-2 rounded-pill">
          {total} รายการ
        </Badge>
      </div>

      {/* Filter */}
      <Row className="g-3 mb-4">
        <Col md={4}>
          <Form.Select
            value={filterAction}
            onChange={e => setFilterAction(e.target.value)}
          >
            <option value="">— ทุก Action —</option>
            {Object.entries(ACTION_LABEL).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </Form.Select>
        </Col>
        <Col md={4}>
          <Form.Select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
          >
            <option value="">— ทุก Type —</option>
            {Object.entries(TYPE_LABEL).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </Form.Select>
        </Col>
        <Col md={2}>
          <Button
            variant="outline-secondary" className="w-100"
            disabled={!filterAction && !filterType}
            onClick={() => { setFilterAction(''); setFilterType(''); }}
          >
            ล้าง
          </Button>
        </Col>
      </Row>

      {loading && (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
        </div>
      )}
      {error && <Alert variant="danger">{error}</Alert>}

      {!loading && !error && (
        <>
          <div className="table-responsive rounded-4 shadow-sm border">
            <Table hover className="mb-0 align-middle" style={{ fontSize: 14 }}>
              <thead className="table-dark">
                <tr>
                  <th>#</th>
                  <th>ผู้กระทำ</th>
                  <th>Action</th>
                  <th>Target</th>
                  <th>รายละเอียด</th>
                  <th>เวลา</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center text-muted py-4">
                      ไม่มีข้อมูล
                    </td>
                  </tr>
                ) : logs.map((log, idx) => (
                  <tr key={log.id}>
                    <td className="text-muted">
                      {(page - 1) * PAGE_SIZE + idx + 1}
                    </td>
                    <td className="fw-medium">
                      {log.actor_name ?? <span className="text-muted">System</span>}
                    </td>
                    <td>
                      <Badge
                        bg={ACTION_BADGE[log.action] ?? 'secondary'}
                        className="rounded-pill px-2"
                      >
                        {ACTION_LABEL[log.action] ?? log.action}
                      </Badge>
                    </td>
                    <td>
                      <span className="small">
                        {TYPE_LABEL[log.target_type] ?? log.target_type}
                        {log.target_id && (
                          <span className="text-muted ms-1">#{log.target_id}</span>
                        )}
                      </span>
                    </td>
                    <td>{renderDetail(log.detail)}</td>
                    <td className="text-muted small" style={{ whiteSpace: 'nowrap' }}>
                      {new Date(log.created_at).toLocaleString('th-TH')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="d-flex justify-content-center mt-4">
              <Pagination>
                <Pagination.Prev
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                />
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                  const p = i + 1;
                  return (
                    <Pagination.Item
                      key={p} active={p === page}
                      onClick={() => setPage(p)}
                    >
                      {p}
                    </Pagination.Item>
                  );
                })}
                <Pagination.Next
                  disabled={page === totalPages}
                  onClick={() => setPage(p => p + 1)}
                />
              </Pagination>
            </div>
          )}
        </>
      )}
    </Container>
  );
};