//? Page: Edit Photo
//@ แก้ไขข้อมูลรูปภาพ — เฉพาะ Admin/President

import React, { useEffect, useState, useMemo, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Form,
  Button,
  Container,
  Card,
  Row,
  Col,
  Spinner,
  Alert,
  Modal,
} from "react-bootstrap";
import { PhotoService } from "../../services/PhotoService";
import { EventService } from "../../services/EventService";
import { parseApiError } from "@/utils/apiError";

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// ✅ แก้จุดที่ 4: (url: any) → (url: string | null | undefined)
const getImageUrl = (url: string | null | undefined): string => {
  if (!url) return "";
  if (typeof url === "string")
    return url.startsWith("http") ? url : `${BASE_URL}${url}`;
  return "";
};

const FACULTIES = [
  "",
  "มหาวิทยาลัย",
  "คณะวิศวกรรมศาสตร์",
  "คณะครุศาสตร์อุตสาหกรรม",
  "คณะวิทยาศาสตร์ประยุกต์",
  "คณะเทคโนโลยีสารสนเทศและนวัตกรรมดิจิทัล",
  "คณะศิลปศาสตร์ประยุกต์",
  "คณะสถาปัตยกรรมและการออกแบบ",
  "คณะพัฒนาธุรกิจและอุตสาหกรรม",
  "วิทยาลัยเทคโนโลยีอุตสาหกรรม",
  "วิทยาลัยนานาชาติ",
];

const YEARS = ["2568", "2567"];

// ✅ แก้จุดที่ 1: สร้าง Interface แทน any[]
interface EventItem {
  id: number;
  event_name: string;
  event_date: string;
}

// ✅ สร้าง Interface สำหรับ Photo
interface PhotoItem {
  id: number;
  title: string;
  description: string | null;
  event_date: string | null;
  image_url: string;
  thumbnail_url: string | null;
  faculty: string | null;
  academic_year: string | null;
}

export const EditPhotoPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const yearSelectRef = useRef<HTMLSelectElement>(null);

  // ✅ แก้จุดที่ 1: useState<any[]> → useState<EventItem[]>
  const [events, setEvents] = useState<EventItem[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [resultModal, setResultModal] = useState<{
    show: boolean;
    success: boolean;
    msg: string;
  }>({ show: false, success: false, msg: "" });

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    event_date: "",
    image_url: "",
    thumbnail_url: "",
    faculty: "",
    academic_year: "",
  });
  const [originalData, setOriginalData] = useState({ ...formData });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [newPreview, setNewPreview] = useState<string | null>(null);

  // Load
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [eventRes, photoRes] = await Promise.all([
          EventService.getAll(),
          PhotoService.getAll(),
        ]);
        setEvents(eventRes.data ?? []);

        // ✅ แก้จุดที่ 2: (p: any) → (p: PhotoItem)
        const photo = ((photoRes.data as PhotoItem[]) ?? []).find(
          (p: PhotoItem) => p.id === Number(id),
        );

        if (photo) {
          const init = {
            title: photo.title ?? "",
            description: photo.description ?? "",
            event_date: photo.event_date ? photo.event_date.split("T")[0] : "",
            image_url: photo.image_url ?? "",
            thumbnail_url: photo.thumbnail_url ?? "",
            faculty: photo.faculty ?? "",
            academic_year: photo.academic_year ?? "",
          };
          setFormData(init);
          setOriginalData(init);
        } else {
          setError("ไม่พบข้อมูลรูปภาพนี้");
        }
      } catch (err: unknown) {
        // ✅ แก้จุดที่ 3: any → unknown
        setError(parseApiError(err, "โหลดข้อมูลไม่สำเร็จ"));
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  // ปิด dropdown เมื่อคลิกข้างนอก
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      )
        setIsDropdownOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filteredEvents = useMemo(
    () =>
      events.filter((ev) =>
        ev.event_name.toLowerCase().includes(formData.title.toLowerCase()),
      ),
    [events, formData.title],
  );

  const isValidEvent = events.some((ev) => ev.event_name === formData.title);
  const previewSrc = newPreview ?? getImageUrl(formData.image_url);

  const hasChanges =
    formData.title !== originalData.title ||
    formData.description !== originalData.description ||
    formData.faculty !== originalData.faculty ||
    formData.academic_year !== originalData.academic_year ||
    selectedFile !== null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setNewPreview(URL.createObjectURL(file));
    }
  };

  // Mouse wheel บน year select (non-passive)
  useEffect(() => {
    const el = yearSelectRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      e.preventDefault();
      const opts = ["", ...YEARS];
      const idx = opts.indexOf(el.value);
      if (e.deltaY > 0 && idx < opts.length - 1)
        setFormData((f) => ({ ...f, academic_year: opts[idx + 1] }));
      else if (e.deltaY < 0 && idx > 0)
        setFormData((f) => ({ ...f, academic_year: opts[idx - 1] }));
    };
    el.addEventListener("wheel", handler, { passive: false });
    return () => el.removeEventListener("wheel", handler);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasChanges || !isValidEvent) return;
    setShowConfirm(true);
  };

  const confirmSave = async () => {
    setShowConfirm(false);
    setSubmitting(true);
    try {
      const data = new FormData();
      data.append("title", formData.title);
      const selectedEvent = events.find(
        (ev) => ev.event_name === formData.title,
      );
      if (selectedEvent?.id) data.append("event_id", String(selectedEvent.id));
      data.append("event_date", formData.event_date);
      data.append("description", formData.description);
      data.append("faculty", formData.faculty);
      data.append("academic_year", formData.academic_year);
      if (selectedFile) data.append("image", selectedFile);

      const res = await PhotoService.update(
        Number(id),
        data,
        localStorage.getItem("token") ?? "",
      );
      if (res.success) {
        setResultModal({
          show: true,
          success: true,
          msg: "แก้ไขข้อมูลเรียบร้อยแล้ว",
        });
      } else {
        setResultModal({
          show: true,
          success: false,
          msg: (res.message as string) ?? "แก้ไขไม่สำเร็จ",
        });
      }
    } catch (err: unknown) {
      // ✅ แก้จุดที่ 3: any → unknown
      setResultModal({
        show: true,
        success: false,
        msg: parseApiError(err, "แก้ไขไม่สำเร็จ — กรุณาลองใหม่"),
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading)
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
      </div>
    );

  return (
    <Container className="py-5">
      <Card
        className="shadow-sm border-0 p-4 mx-auto"
        style={{ maxWidth: "900px" }}
      >
        <h3 className="fw-bold mb-4">แก้ไขข้อมูลรูปภาพ</h3>
        {error && <Alert variant="danger">{error}</Alert>}

        <Form onSubmit={handleSubmit}>
          <Row>
            {/* ซ้าย: preview */}
            <Col md={5} className="text-center mb-4">
              <div
                className="border rounded p-2 bg-light shadow-sm"
                style={{
                  minHeight: 200,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {previewSrc ? (
                  <img
                    src={previewSrc}
                    className="img-fluid rounded"
                    style={{ maxHeight: 300 }}
                    alt="preview"
                  />
                ) : (
                  <span className="text-muted">ไม่มีรูปภาพ</span>
                )}
              </div>
              <Form.Label
                className="btn btn-primary w-100 fw-bold mt-3"
                style={{ cursor: "pointer" }}
              >
                📷 เปลี่ยนรูปภาพใหม่
                <Form.Control
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={handleFileChange}
                />
              </Form.Label>
            </Col>

            {/* ขวา: form */}
            <Col md={7}>
              {/* Event dropdown */}
              <Form.Group className="mb-3 position-relative" ref={dropdownRef}>
                <Form.Label className="fw-bold">เลือกอีเว้นท์</Form.Label>
                <div className="input-group">
                  <Form.Control
                    type="text"
                    placeholder="ค้นหาชื่ออีเว้นท์..."
                    value={formData.title}
                    onChange={(e) => {
                      setFormData((f) => ({ ...f, title: e.target.value }));
                      setIsDropdownOpen(true);
                    }}
                    onFocus={() => setIsDropdownOpen(true)}
                  />
                  <Button
                    variant="outline-secondary"
                    onClick={() => setIsDropdownOpen((o) => !o)}
                  >
                    {isDropdownOpen ? "▲" : "▼"}
                  </Button>
                </div>

                {isDropdownOpen && filteredEvents.length > 0 && (
                  <div
                    className="position-absolute w-100 shadow-lg border rounded bg-white mt-1"
                    style={{ zIndex: 1050, maxHeight: 220, overflowY: "auto" }}
                  >
                    {filteredEvents.map((ev) => (
                      <div
                        key={ev.id}
                        className="px-3 py-2 border-bottom"
                        style={{ cursor: "pointer" }}
                        onMouseOver={(e) =>
                          (e.currentTarget.style.background = "#f0f4ff")
                        }
                        onMouseOut={(e) =>
                          (e.currentTarget.style.background = "#fff")
                        }
                        onClick={() => {
                          setFormData((f) => ({
                            ...f,
                            title: ev.event_name,
                            event_date: ev.event_date.split("T")[0],
                          }));
                          setIsDropdownOpen(false);
                        }}
                      >
                        <span className="fw-bold text-primary">
                          {ev.event_name}
                        </span>
                        <span className="text-muted small ms-2">
                          {ev.event_date.split("T")[0]}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {!isValidEvent && formData.title && (
                  <Form.Text className="text-danger">
                    * โปรดเลือกจากอีเว้นท์ที่มีอยู่
                  </Form.Text>
                )}
              </Form.Group>

              {/* คณะ + ปีการศึกษา */}
              <Row className="mb-3">
                <Col md={7}>
                  <Form.Label className="fw-bold">คณะ</Form.Label>
                  <Form.Select
                    value={formData.faculty}
                    onChange={(e) =>
                      setFormData((f) => ({ ...f, faculty: e.target.value }))
                    }
                  >
                    <option value="">-- ไม่ระบุ --</option>
                    {FACULTIES.filter(Boolean).map((f) => (
                      <option key={f}>{f}</option>
                    ))}
                  </Form.Select>
                </Col>
                <Col md={5}>
                  <Form.Label className="fw-bold">ปีการศึกษา</Form.Label>
                  <Form.Select
                    ref={yearSelectRef}
                    value={formData.academic_year}
                    onChange={(e) =>
                      setFormData((f) => ({
                        ...f,
                        academic_year: e.target.value,
                      }))
                    }
                  >
                    <option value="">-- ไม่ระบุ --</option>
                    {YEARS.map((y) => (
                      <option key={y}>{y}</option>
                    ))}
                  </Form.Select>
                </Col>
              </Row>

              {/* วันที่ */}
              <Form.Group className="mb-3">
                <Form.Label className="fw-bold text-secondary">
                  วันที่จัดอีเว้นท์ (ระบบกำหนดให้)
                </Form.Label>
                <Form.Control
                  type="date"
                  value={formData.event_date}
                  readOnly
                  className="bg-light"
                  tabIndex={-1}
                />
              </Form.Group>

              {/* คำอธิบาย */}
              <Form.Group className="mb-4">
                <Form.Label className="fw-bold">คำอธิบายเพิ่มเติม</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((f) => ({ ...f, description: e.target.value }))
                  }
                />
              </Form.Group>

              <div className="d-grid gap-2">
                <Button
                  type="submit"
                  variant="warning"
                  className="fw-bold"
                  disabled={!hasChanges || !isValidEvent || submitting}
                  style={{ opacity: !hasChanges || !isValidEvent ? 0.5 : 1 }}
                >
                  {submitting ? "⏳ กำลังบันทึก..." : "💾 บันทึกการแก้ไข"}
                </Button>
                <Button variant="light" onClick={() => navigate(-1)}>
                  ยกเลิก
                </Button>
              </div>
            </Col>
          </Row>
        </Form>
      </Card>

      {/* Confirm Modal */}
      <Modal show={showConfirm} onHide={() => setShowConfirm(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold">⚠️ ยืนยันการแก้ไข</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center py-3">
          <p className="fs-5 mb-1">ต้องการบันทึกการเปลี่ยนแปลงใช่หรือไม่?</p>
          <small className="text-muted">
            ข้อมูลเดิมจะถูกแทนที่ด้วยข้อมูลใหม่
          </small>
        </Modal.Body>
        <Modal.Footer className="justify-content-center gap-2">
          <Button variant="secondary" onClick={() => setShowConfirm(false)}>
            ยกเลิก
          </Button>
          <Button variant="warning" className="fw-bold" onClick={confirmSave}>
            ✅ ยืนยันบันทึก
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Result Modal */}
      <Modal
        show={resultModal.show}
        onHide={() => {
          setResultModal((r) => ({ ...r, show: false }));
          if (resultModal.success) navigate("/photos");
        }}
        centered
      >
        <Modal.Header
          closeButton
          className={
            resultModal.success
              ? "bg-success text-white"
              : "bg-danger text-white"
          }
        >
          <Modal.Title className="fw-bold">
            {resultModal.success ? "✅ สำเร็จ!" : "❌ เกิดข้อผิดพลาด"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center py-3 fs-5">
          {resultModal.msg}
        </Modal.Body>
        <Modal.Footer className="justify-content-center">
          <Button
            variant={resultModal.success ? "success" : "danger"}
            onClick={() => {
              setResultModal((r) => ({ ...r, show: false }));
              if (resultModal.success) navigate("/photos");
            }}
          >
            {resultModal.success ? "กลับหน้าแกลเลอรี่" : "ปิด"}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};
