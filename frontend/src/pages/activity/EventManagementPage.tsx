//? Page: Event Management Page
//@ จัดการอีเว้นท์ — เฉพาะ ADMIN และ CLUB_PRESIDENT
//  ✅ ค้นหาด้วยชื่อ Event และกรองวันที่ (วันเดียว หรือ ช่วงวันที่)

import React, { useState, useEffect, useMemo } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Badge,
  Modal,
  Form,
  Spinner,
  Alert,
  InputGroup,
} from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { EventService } from "@/services/EventService";
import {
  DateRangeFilter,
  emptyDateFilter,
  matchesDateFilter,
} from "@/components/common/DateRangeFilter";
import type { DateFilter } from "@/components/common/DateRangeFilter";
import { CustomDatePicker } from "@/components/common/CustomDatePicker";
import { parseApiError } from "@/utils/apiError";
import { AxiosError } from "axios";

type EventItem = {
  id: number;
  event_name: string;
  event_date: string;
};


const getLocalDateStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export const EventManagementPage: React.FC = () => {
  const todayStr = getLocalDateStr();
  const navigate = useNavigate();

  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ✅ Search states
  const [searchName, setSearchName] = useState("");
  const [dateFilter, setDateFilter] = useState<DateFilter>(emptyDateFilter());

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEventData, setNewEventData] = useState({ name: "", date: "" });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editTarget, setEditTarget] = useState<EventItem | null>(null);
  const [editData, setEditData] = useState({ name: "", date: "" });
  const [editing, setEditing] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<EventItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteInfo, setDeleteInfo] = useState<{ photoCount: number } | null>(
    null,
  );
  const [deleteError, setDeleteError] = useState<string | null>(null);

  
  const loadEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await EventService.getAll();
      setEvents(res.data || []);
    } catch (err: unknown) {
      setError(parseApiError(err, "โหลดข้อมูลอีเว้นท์ไม่สำเร็จ"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  // ✅ Filter ตามชื่อและช่วงวันที่
  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      const nameMatch = ev.event_name
        .toLowerCase()
        .includes(searchName.toLowerCase());
      const dateMatch = matchesDateFilter(ev.event_date || "", dateFilter);
      return nameMatch && dateMatch;
    });
  }, [events, searchName, dateFilter]);

  const hasFilter =
    searchName !== "" || dateFilter.from !== "" || dateFilter.to !== "";

  const clearAll = () => {
    setSearchName("");
    setDateFilter(emptyDateFilter());
  };

  const handleCreate = async () => {
    if (!newEventData.name.trim() || !newEventData.date) {
      setSaveError("กรุณากรอกข้อมูลให้ครบ");
      return;
    }
    try {
      setSaving(true);
      setSaveError(null);
      await EventService.create(
        { event_name: newEventData.name.trim(), event_date: newEventData.date },
        localStorage.getItem("token")!,
      );
      setNewEventData({ name: "", date: "" });
      setShowAddModal(false);
      await loadEvents();
    } catch (err: unknown) {
      const e = err as AxiosError<{ message?: string }>;

      const status = e.response?.status;
      const msg = e.response?.data?.message || e.message || "";

      if (status === 401 || msg.toLowerCase().includes("unauthorized")) {
        setSaveError("หมดเวลาเข้าสู่ระบบ — กรุณาออกจากระบบแล้วเข้าสู่ระบบใหม่");
      } else if (status === 400) {
        setSaveError(msg || "ข้อมูลไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง");
      } else if (status === 409) {
        setSaveError(msg || "ชื่ออีเว้นท์นี้มีอยู่แล้ว กรุณาใช้ชื่ออื่น");
      } else {
        setSaveError(
          parseApiError(err, "เพิ่มอีเว้นท์ไม่สำเร็จ — กรุณาลองใหม่อีกครั้ง")
        );
      }
    } finally {
      setSaving(false);
    }
  };

  const openEditModal = (ev: EventItem) => {
    setEditTarget(ev);
    setEditData({
      name: ev.event_name,
      date: ev.event_date ? ev.event_date.split("T")[0] : "",
    });
    setEditError(null);
    setShowEditModal(true);
  };

  const handleUpdate = async () => {
    if (!editData.name.trim() || !editData.date) {
      setEditError("กรุณากรอกข้อมูลให้ครบ");
      return;
    }
    try {
      setEditing(true);
      setEditError(null);
      if (!editTarget) return;

      await EventService.update(
        editTarget.id,
        { event_name: editData.name.trim(), event_date: editData.date },
        localStorage.getItem("token")!
      );
      
      setShowEditModal(false);
      await loadEvents();
    } catch (err: unknown) {
      if (
        typeof err === "object" &&
        err !== null &&
        "response" in err
      ) {
        const e = err as {
          response?: {
            status?: number;
            data?: { message?: string };
          };
        };

        const msg = e.response?.data?.message;

        if (e.response?.status === 400) {
          setEditError(msg || "ข้อมูลไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง");
        } else {
          setEditError(parseApiError(err, "แก้ไขอีเว้นท์ไม่สำเร็จ"));
        }
      } else {
        setEditError("เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ");
      }
    } finally {
      setEditing(false);
    }
  };

  const openDeleteModal = async (ev: EventItem) => {
    setDeleteTarget(ev);
    setDeleteInfo(null);
    setDeleteError(null);
    setShowDeleteModal(true);
    try {
      // ✅ แก้ไขจุดนี้: ส่ง ev.id ไปแทนที่จะเป็น ev.event_name
      const res = await EventService.getPhotoCount(ev.id);
      setDeleteInfo({ photoCount: res.count || 0 });
    } catch {
      setDeleteInfo({ photoCount: 0 });
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await EventService.delete(
        deleteTarget.id,
        localStorage.getItem("token")!,
      );
      setShowDeleteModal(false);
      setDeleteTarget(null);
      await loadEvents();
    } catch (err: unknown) {
      setDeleteError(parseApiError(err, "ลบอีเว้นท์ไม่สำเร็จ"));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Container className="py-5">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">จัดการอีเว้นท์</h2>
          <p className="text-muted mb-0">
            เพิ่ม แก้ไข หรือลบอีเว้นท์ของชมรม SE PhotoClub
          </p>
        </div>
        <Button
          variant="primary"
          className="fw-bold px-4 rounded-pill"
          onClick={() => {
            setSaveError(null);
            setNewEventData({ name: "", date: "" });
            setShowAddModal(true);
          }}
        >
          + เพิ่มอีเว้นท์
        </Button>
      </div>

      {/* ✅ Search + DateRangeFilter */}
      <div className="bg-light rounded-4 p-3 mb-4">
        <Row className="g-3 align-items-start">
          {/* ค้นหาชื่อ */}
          <Col md={5}>
            <Form.Label className="fw-medium small text-secondary mb-1">
              ชื่ออีเว้นท์
            </Form.Label>
            <InputGroup>
              <InputGroup.Text className="bg-white border-end-0">
                🔍
              </InputGroup.Text>
              <Form.Control
                className="border-start-0"
                placeholder="ค้นหาชื่ออีเว้นท์..."
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
              />
              {searchName && (
                <Button
                  variant="outline-secondary"
                  onClick={() => setSearchName("")}
                >
                  ✕
                </Button>
              )}
            </InputGroup>
          </Col>

          {/* กรองวันที่ */}
          <Col md={5}>
            <Form.Label className="fw-medium small text-secondary mb-1">
              วันที่จัดอีเว้นท์
            </Form.Label>
            <DateRangeFilter value={dateFilter} onChange={setDateFilter} />
          </Col>

          {/* ล้าง */}
          <Col md={2} className="d-flex flex-column justify-content-end">
            <Form.Label className="fw-medium small text-secondary mb-1">
              &nbsp;
            </Form.Label>
            <Button
              variant="outline-danger"
              className="w-100"
              style={{ fontSize: "0.85rem" }}
              onClick={clearAll}
              disabled={!hasFilter}
            >
              ล้างทั้งหมด
            </Button>
          </Col>
        </Row>

        {hasFilter && (
          <div className="mt-2 pt-2 border-top">
            <small className="text-muted">
              พบ{" "}
              <strong className="text-primary">{filteredEvents.length}</strong>{" "}
              จาก {events.length} อีเว้นท์
            </small>
            {searchName && (
              <Badge bg="primary" className="ms-2 rounded-pill">
                ชื่อ: {searchName}
              </Badge>
            )}
          </div>
        )}
      </div>

      {loading && (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3 text-muted">กำลังโหลด...</p>
        </div>
      )}
      {error && !loading && <Alert variant="danger">{error}</Alert>}

      {!loading && !error && filteredEvents.length === 0 && (
        <div className="text-center py-5 text-muted">
          {events.length === 0 ? (
            <p className="fs-5">
              ยังไม่มีอีเว้นท์ กดปุ่ม "+ เพิ่มอีเว้นท์" เพื่อเริ่มต้น
            </p>
          ) : (
            <>
              <p className="fs-5">ไม่พบอีเว้นท์ที่ตรงกับการค้นหา</p>
              <Button variant="outline-primary" size="sm" onClick={clearAll}>
                ล้างการค้นหา
              </Button>
            </>
          )}
        </div>
      )}

      {!loading && !error && filteredEvents.length > 0 && (
        <Row xs={1} sm={2} md={3} className="g-4">
          {filteredEvents.map((ev: EventItem) => (
            <Col key={ev.id}>
              <Card className="h-100 shadow-sm border-0 rounded-4">
                <Card.Body className="p-4">
                  <Badge bg="primary" className="mb-3 rounded-pill px-3">
                    อีเว้นท์
                  </Badge>
                  <Card.Title className="fw-bold fs-5 mb-2">
                    {ev.event_name}
                  </Card.Title>
                  <Card.Text className="text-muted small">
                    📅{" "}
                    {ev.event_date
                      ? new Date(
                          ev.event_date + "T12:00:00",
                        ).toLocaleDateString("th-TH", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })
                      : "-"}
                  </Card.Text>
                  <div className="d-flex gap-2 mt-3">
                    <Button
                      variant="outline-warning"
                      size="sm"
                      className="rounded-pill flex-fill"
                      onClick={() => openEditModal(ev)}
                    >
                      ✏️ แก้ไข
                    </Button>
                    <Button
                      variant="outline-danger"
                      size="sm"
                      className="rounded-pill flex-fill"
                      onClick={() => openDeleteModal(ev)}
                    >
                      🗑️ ลบ
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      {/* Modal เพิ่มอีเว้นท์ */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold text-primary">
            เพิ่มอีเว้นท์ใหม่
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {saveError && (
            <Alert variant="danger">
              {saveError}
              {saveError.includes("หมดเวลา") && (
                <div className="mt-2">
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => {
                      setShowAddModal(false);
                      navigate("/login");
                    }}
                  >
                    ไปหน้าเข้าสู่ระบบ →
                  </Button>
                </div>
              )}
            </Alert>
          )}
          <Form.Group className="mb-3">
            <Form.Label className="fw-medium">
              ชื่ออีเว้นท์ <span className="text-danger">*</span>
            </Form.Label>
            <Form.Control
              type="text"
              placeholder="เช่น ทริปถ่ายภาพเขาใหญ่"
              value={newEventData.name}
              onChange={(e) =>
                setNewEventData({ ...newEventData, name: e.target.value })
              }
            />
          </Form.Group>
          <Form.Group>
            <Form.Label className="fw-medium">
              วันที่จัดอีเว้นท์ <span className="text-danger">*</span>
            </Form.Label>
            <div>
              <CustomDatePicker
                value={newEventData.date}
                max={todayStr}
                onChange={(v) => setNewEventData({ ...newEventData, date: v })}
                placeholder="ตั้งแต่วันที่..."
              />
            </div>
            <Form.Text className="text-muted">
              เลือกได้เฉพาะวันที่ไม่เกินปัจจุบัน
            </Form.Text>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowAddModal(false)}
            disabled={saving}
          >
            ยกเลิก
          </Button>
          <Button variant="primary" onClick={handleCreate} disabled={saving}>
            {saving ? (
              <>
                <Spinner size="sm" className="me-1" />
                บันทึก...
              </>
            ) : (
              "บันทึก"
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal แก้ไขอีเว้นท์ */}
      <Modal
        show={showEditModal}
        onHide={() => setShowEditModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold text-warning">
            ✏️ แก้ไขอีเว้นท์
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {editError && <Alert variant="danger">{editError}</Alert>}
          <Form.Group className="mb-3">
            <Form.Label className="fw-medium">
              ชื่ออีเว้นท์ <span className="text-danger">*</span>
            </Form.Label>
            <Form.Control
              type="text"
              value={editData.name}
              onChange={(e) =>
                setEditData({ ...editData, name: e.target.value })
              }
            />
          </Form.Group>
          <Form.Group>
            <Form.Label className="fw-medium">
              วันที่จัดอีเว้นท์ <span className="text-danger">*</span>
            </Form.Label>
            <div>
              <CustomDatePicker
                value={editData.date}
                max={todayStr}
                onChange={(v) => setEditData({ ...editData, date: v })}
                placeholder="ตั้งแต่วันที่..."
              />
            </div>
            <Form.Text className="text-muted">
              เลือกได้เฉพาะวันที่ไม่เกินปัจจุบัน
            </Form.Text>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowEditModal(false)}
            disabled={editing}
          >
            ยกเลิก
          </Button>
          <Button variant="warning" onClick={handleUpdate} disabled={editing}>
            {editing ? (
              <>
                <Spinner size="sm" className="me-1" />
                บันทึก...
              </>
            ) : (
              "บันทึกการแก้ไข"
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal ยืนยันลบ */}
      <Modal
        show={showDeleteModal}
        onHide={() => !deleting && setShowDeleteModal(false)}
        centered
      >
        <Modal.Header closeButton={!deleting}>
          <Modal.Title className="fw-bold text-danger">
            🗑️ ยืนยันการลบอีเว้นท์
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>คุณต้องการลบอีเว้นท์</p>
          <p className="fw-bold text-primary fs-5">
            "{deleteTarget?.event_name}"
          </p>
          {deleteInfo === null ? (
            <div className="text-center py-2">
              <Spinner size="sm" className="me-2" />
              <span className="text-muted small">กำลังตรวจสอบ...</span>
            </div>
          ) : deleteInfo.photoCount > 0 ? (
            <Alert variant="warning">
              <strong>⚠️ คำเตือน:</strong> มีรูปภาพ{" "}
              <strong>{deleteInfo.photoCount} รูป</strong> ที่ผูกกับอีเว้นท์นี้
              รูปภาพทั้งหมดจะถูก<strong>ลบไปพร้อมกัน</strong>
            </Alert>
          ) : (
            <Alert variant="info">ไม่มีรูปภาพที่ผูกกับอีเว้นท์นี้</Alert>
          )}
          {deleteError && (
            <Alert variant="danger" className="mb-0 mt-2">
              ❌ {deleteError}
            </Alert>
          )}
          <p className="text-muted small mb-0">
            การลบอีเว้นท์ไม่สามารถกู้คืนได้
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowDeleteModal(false)}
            disabled={deleting}
          >
            ยกเลิก
          </Button>
          <Button
            variant="danger"
            onClick={handleDelete}
            disabled={deleting || deleteInfo === null}
          >
            {deleting ? (
              <>
                <Spinner size="sm" className="me-1" />
                กำลังลบ...
              </>
            ) : (
              "ยืนยันลบ"
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};