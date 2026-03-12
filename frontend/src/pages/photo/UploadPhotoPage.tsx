//? Page: Upload Photo Page
//@ อัปโหลดรูปภาพ — รองรับหลายรูปพร้อมกัน

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Container,
  Card,
  Form,
  Button,
  Row,
  Col,
  Spinner,
  Modal,
  ProgressBar,
  Badge,
  Alert,
} from "react-bootstrap";
import { useNavigate, useSearchParams } from "react-router-dom";
import { PhotoService } from "../../services/PhotoService";
import { EventService } from "../../services/EventService";
import { CustomDatePicker } from "@/components/common/CustomDatePicker";
import { useAuth } from "@/hooks/useAuth";
import { isAdminOrPresident } from "@/utils/roleChecker";
import { parseApiError } from "@/utils/apiError";

const getLocalDateStr = () => {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

//@ type ของรูปที่ล้มเหลว — เพิ่ม duplicate info เพื่อให้แสดง thumbnail และ navigate ได้
interface FailedFile {
  name: string;
  reason: string;
  isDuplicate: boolean;
  eventName?: string;
  faculty?: string;
  academic_year?: string;
  duplicateId?: number; // id ของรูปที่ซ้ำใน DB
  duplicateThumb?: string; // thumbnail_url ของรูปที่ซ้ำ
}

export const UploadPhotoPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const yearSelectRef = useRef<HTMLSelectElement>(null);

  const YEARS = ["2568", "2567"];

  // ✅ ย้าย useState เข้ามาใน component
  const [invalidFiles, setInvalidFiles] = useState<string[]>([]);
  const [showInvalidModal, setShowInvalidModal] = useState(false);

  useEffect(() => {
    const el = yearSelectRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      e.preventDefault();
      const idx = YEARS.indexOf((el as HTMLSelectElement).value);
      if (e.deltaY > 0 && idx < YEARS.length - 1)
        setFormData((f) => ({ ...f, academic_year: YEARS[idx + 1] }));
      else if (e.deltaY < 0 && idx > 0)
        setFormData((f) => ({ ...f, academic_year: YEARS[idx - 1] }));
    };
    el.addEventListener("wheel", handler, { passive: false });
    return () => el.removeEventListener("wheel", handler);
  }, []);

  const todayStr = getLocalDateStr();

  const [events, setEvents] = useState<any[]>([]);
  const [eventsLoaded, setEventsLoaded] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  //@ รับค่า pre-fill จาก URL params (ส่งมาจาก EventPhotosPage ปุ่มอัปโหลด)
  const [formData, setFormData] = useState({
    title: searchParams.get("event") || "",
    event_date: "",
    description: "",
    faculty: searchParams.get("faculty") || "",
    academic_year: searchParams.get("academic_year") || "",
  });

  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [modalConfig, setModalConfig] = useState({
    show: false,
    title: "",
    message: "",
    variant: "success" as "success" | "danger",
    isSuccess: false,
    failedFiles: [] as FailedFile[],
  });
  const [showFailDetail, setShowFailDetail] = useState(false);

  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [newEventData, setNewEventData] = useState({ name: "", date: "" });
  const [addError, setAddError] = useState<string | null>(null);

  //@ เมื่อ events โหลดแล้ว และมี title ถูก pre-fill มาจาก URL — sync event_date อัตโนมัติ
  useEffect(() => {
    if (!formData.title || events.length === 0) return;
    const matched = events.find((ev) => ev.event_name === formData.title);
    if (matched && !formData.event_date) {
      setFormData((f) => ({
        ...f,
        event_date: matched.event_date.split("T")[0],
      }));
    }
  }, [events, formData.title]);

  const loadEvents = async () => {
    try {
      const res = await EventService.getAll();
      setEvents(res.data || []);
    } catch (err: any) {
      console.error("loadEvents failed:", err);
    } finally {
      setEventsLoaded(true);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      )
        setIsDropdownOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredEvents = useMemo(() => {
    return events.filter((ev) =>
      ev.event_name.toLowerCase().includes(formData.title.toLowerCase()),
    );
  }, [events, formData.title]);

  const isValidEvent = events.some((ev) => ev.event_name === formData.title);

  const ALLOWED_TYPES = new Set(["image/jpeg", "image/png"]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    //@ กรองเฉพาะ jpg/png — ไฟล์ที่ไม่ผ่านจะแสดง Modal แทน alert
    const valid = files.filter((f) => ALLOWED_TYPES.has(f.type));
    const invalid = files.filter((f) => !ALLOWED_TYPES.has(f.type));
    if (invalid.length > 0) {
      setInvalidFiles(invalid.map((f) => f.name));
      setShowInvalidModal(true);
    }
    if (!valid.length) return;
    setSelectedFiles(valid);
    setPreviewUrls(valid.map((f) => URL.createObjectURL(f)));
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviewUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCreateEvent = async () => {
    if (!newEventData.name.trim() || !newEventData.date) {
      setAddError("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }
    try {
      setAddError(null);
      const token = localStorage.getItem("token");
      const res = await EventService.create(
        { event_name: newEventData.name.trim(), event_date: newEventData.date },
        token!,
      );
      if (res.success) {
        await loadEvents();
        setFormData({
          ...formData,
          title: newEventData.name.trim(),
          event_date: newEventData.date,
        });
        setShowAddEventModal(false);
        setNewEventData({ name: "", date: "" });
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      if (msg?.includes("มีอยู่") || err?.response?.status === 400) {
        setAddError(
          msg || `ชื่อกิจกรรม "${newEventData.name}" มีอยู่ในระบบแล้ว`,
        );
      } else if (!err?.response) {
        setAddError(
          "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่อ",
        );
      } else {
        setAddError(msg || "ไม่สามารถสร้างกิจกรรมได้ กรุณาลองใหม่อีกครั้ง");
      }
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFiles.length || !isValidEvent) return;
    setLoading(true);
    setUploadProgress(0);
    const token = localStorage.getItem("token");
    let successCount = 0,
      failCount = 0;
    const failedFiles: FailedFile[] = [];

    for (let i = 0; i < selectedFiles.length; i++) {
      try {
        const data = new FormData();
        data.append("image", selectedFiles[i]);
        data.append("title", formData.title);
        data.append("event_date", formData.event_date);
        data.append("description", formData.description);
        if (formData.faculty) data.append("faculty", formData.faculty);
        if (formData.academic_year)
          data.append("academic_year", formData.academic_year);
        const res = await PhotoService.upload(data, token!);
        if (res.success) successCount++;
        else {
          failCount++;
          failedFiles.push({
            name: selectedFiles[i].name,
            reason: res.message || "เซิร์ฟเวอร์ปฏิเสธไฟล์นี้",
            isDuplicate: false,
          });
        }
      } catch (err: any) {
        failCount++;
        const status = err?.response?.status;
        const serverMsg = err?.response?.data?.message;

        //@ 409 = รูปซ้ำ — เก็บ duplicate info เพื่อแสดง thumbnail และ navigate ตรงไปรูปนั้น
        if (status === 409) {
          const dup = err?.response?.data?.duplicate;
          failedFiles.push({
            name: selectedFiles[i].name,
            reason: `🔁 ${serverMsg || "รูปนี้มีอยู่ใน Event นี้แล้ว"}`,
            isDuplicate: true,
            eventName: formData.title,
            faculty: formData.faculty || undefined,
            academic_year: formData.academic_year || undefined,
            duplicateId: dup?.id || undefined,
            duplicateThumb: dup?.thumbnail_url || dup?.image_url || undefined,
          });
        } else {
          failedFiles.push({
            name: selectedFiles[i].name,
            reason: parseApiError(err, "อัปโหลดไม่สำเร็จ"),
            isDuplicate: false,
          });
        }
      }
      setUploadProgress(Math.round(((i + 1) / selectedFiles.length) * 100));
    }
    setLoading(false);
    setModalConfig({
      show: true,
      title: failCount === 0 ? "อัปโหลดสำเร็จ!" : "อัปโหลดบางส่วน",
      message: `สำเร็จ ${successCount} รูป${failCount > 0 ? ` / ล้มเหลว ${failCount} รูป` : ""}`,
      variant: successCount > 0 ? "success" : "danger",
      isSuccess: successCount > 0,
      failedFiles,
    });
  };

  //@ navigate ไปที่ folder ใน gallery พร้อม highlight รูปที่ซ้ำด้วย ?openPhotoId=
  const goToGalleryFolder = (f: FailedFile) => {
    if (!f.eventName) return;
    const params = new URLSearchParams();
    if (f.faculty) params.set("faculty", f.faculty);
    if (f.academic_year) params.set("academic_year", f.academic_year);
    if (f.duplicateId) params.set("openPhotoId", String(f.duplicateId));
    const qs = params.toString();
    setModalConfig((prev) => ({ ...prev, show: false }));
    navigate(
      `/photos/event/${encodeURIComponent(f.eventName!)}${qs ? `?${qs}` : ""}`,
    );
  };

  return (
    <Container className="py-5">
      <Card
        className="shadow-sm border-0 p-4 mx-auto"
        style={{ maxWidth: "960px" }}
      >
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h3 className="fw-bold mb-0">📸 อัปโหลดรูปภาพใหม่</h3>
          {isAdminOrPresident(user) && (
            <Button
              variant="outline-primary"
              size="sm"
              className="rounded-pill px-3"
              onClick={() => {
                setAddError(null);
                setNewEventData({ name: "", date: "" });
                setShowAddEventModal(true);
              }}
            >
              + สร้างกิจกรรมใหม่
            </Button>
          )}
        </div>

        <Form onSubmit={handleUpload}>
          <Row>
            <Col md={5} className="mb-4">
              <div
                className="border rounded p-3 bg-light d-flex flex-column align-items-center justify-content-center mb-3"
                style={{
                  minHeight: "200px",
                  cursor: "pointer",
                  borderStyle: "dashed",
                  borderColor: "#adb5bd",
                }}
                onClick={() => fileInputRef.current?.click()}
              >
                <span style={{ fontSize: "2.5rem" }}>🖼️</span>
                <p className="text-secondary mb-0 text-center small mt-2">
                  คลิกเพื่อเลือกรูปภาพ
                  <br />
                  <span className="text-muted">(เลือกได้หลายรูปพร้อมกัน)</span>
                </p>
                <Form.Control
                  ref={fileInputRef}
                  type="file"
                  accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                  multiple
                  hidden
                  onChange={handleFileChange}
                />
              </div>

              {previewUrls.length > 0 && (
                <div>
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <small className="fw-bold text-secondary">
                      เลือกแล้ว{" "}
                      <Badge bg="primary" className="rounded-pill">
                        {selectedFiles.length}
                      </Badge>{" "}
                      รูป
                    </small>
                    <Button
                      variant="link"
                      size="sm"
                      className="text-danger p-0"
                      onClick={() => {
                        setSelectedFiles([]);
                        setPreviewUrls([]);
                      }}
                    >
                      ล้างทั้งหมด
                    </Button>
                  </div>
                  <Row xs={3} className="g-2">
                    {previewUrls.map((url, idx) => (
                      <Col key={idx}>
                        <div className="position-relative">
                          <img
                            src={url}
                            alt={`preview-${idx}`}
                            className="img-fluid rounded"
                            style={{
                              height: "80px",
                              width: "100%",
                              objectFit: "cover",
                            }}
                          />
                          <Button
                            variant="danger"
                            size="sm"
                            className="position-absolute top-0 end-0 p-0 lh-1"
                            style={{
                              width: "20px",
                              height: "20px",
                              fontSize: "10px",
                              borderRadius: "50%",
                            }}
                            onClick={() => removeFile(idx)}
                          >
                            ✕
                          </Button>
                        </div>
                      </Col>
                    ))}
                  </Row>
                </div>
              )}
            </Col>

            <Col md={7}>
              <Form.Group className="mb-3 position-relative" ref={dropdownRef}>
                <Form.Label className="fw-bold">เลือก Event</Form.Label>
                <div className="input-group">
                  <Form.Control
                    type="text"
                    placeholder="ค้นหาชื่อกิจกรรม..."
                    value={formData.title}
                    required
                    onChange={(e) => {
                      setFormData({ ...formData, title: e.target.value });
                      setIsDropdownOpen(true);
                    }}
                    onFocus={() => setIsDropdownOpen(true)}
                  />
                  <Button
                    variant="outline-secondary"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  >
                    {isDropdownOpen ? "▲" : "▼"}
                  </Button>
                </div>

                {isDropdownOpen && filteredEvents.length > 0 && (
                  <div
                    className="position-absolute w-100 shadow-lg border rounded bg-white mt-1"
                    style={{
                      zIndex: 1050,
                      maxHeight: "220px",
                      overflowY: "auto",
                    }}
                  >
                    {filteredEvents.map((ev) => (
                      <div
                        key={ev.id}
                        className="px-3 py-2 border-bottom d-flex justify-content-between align-items-center"
                        style={{ cursor: "pointer" }}
                        onMouseOver={(e) =>
                          (e.currentTarget.style.backgroundColor = "#f0f4ff")
                        }
                        onMouseOut={(e) =>
                          (e.currentTarget.style.backgroundColor = "#fff")
                        }
                        onClick={() => {
                          setFormData({
                            ...formData,
                            title: ev.event_name,
                            event_date: ev.event_date.split("T")[0],
                          });
                          setIsDropdownOpen(false);
                        }}
                      >
                        <span className="fw-bold text-primary">
                          {ev.event_name}
                        </span>
                        <span className="text-muted small">
                          {ev.event_date.split("T")[0]}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {isDropdownOpen && eventsLoaded && events.length === 0 && (
                  <div
                    className="position-absolute w-100 shadow border rounded bg-white mt-1 p-3 text-center"
                    style={{ zIndex: 1050 }}
                  >
                    <span style={{ fontSize: "1.4rem" }}>📭</span>
                    <p className="mb-1 fw-bold text-secondary small mt-1">
                      ไม่มี Event
                    </p>
                    <p className="mb-0 text-muted" style={{ fontSize: "12px" }}>
                      {isAdminOrPresident(user)
                        ? 'กดปุ่ม "+ สร้างกิจกรรมใหม่" เพื่อเพิ่ม Event แรก'
                        : "ยังไม่มีกิจกรรมในระบบ"}
                    </p>
                  </div>
                )}

                {isDropdownOpen &&
                  eventsLoaded &&
                  events.length > 0 &&
                  filteredEvents.length === 0 &&
                  formData.title && (
                    <div
                      className="position-absolute w-100 border rounded bg-white mt-1 p-3 text-muted small"
                      style={{ zIndex: 1050 }}
                    >
                      ไม่พบกิจกรรมที่ตรงกับ "
                      <strong>{formData.title}</strong>"
                    </div>
                  )}

                {!isValidEvent && formData.title !== "" && (
                  <Form.Text className="text-danger">
                    * โปรดเลือกจากกิจกรรมที่มีอยู่ในฐานข้อมูล
                  </Form.Text>
                )}
              </Form.Group>

              <Row className="mb-3">
                <Col md={7}>
                  <Form.Group>
                    <Form.Label className="fw-bold">คณะ</Form.Label>
                    <Form.Select
                      value={formData.faculty}
                      onChange={(e) =>
                        setFormData({ ...formData, faculty: e.target.value })
                      }
                    >
                      <option value="">-- ไม่ระบุ --</option>
                      <option>มหาวิทยาลัย</option>
                      <option>คณะวิศวกรรมศาสตร์</option>
                      <option>ครุศาสตร์อุตสาหกรรม</option>
                      <option>วิทยาศาสตร์ประยุกต์</option>
                      <option>เทคโนโลยีสารสนเทศและนวัตกรรมดิจิทัล</option>
                      <option>ศิลปศาสตร์ประยุกต์</option>
                      <option>สถาปัตยกรรมและการออกแบบ</option>
                      <option>พัฒนาธุรกิจและอุตสาหกรรม</option>
                      <option>วิทยาลัยเทคโนโลยีอุตสาหกรรม</option>
                      <option>วิทยาลัยนานาชาติ</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={5}>
                  <Form.Group>
                    <Form.Label className="fw-bold">ปีการศึกษา</Form.Label>
                    <Form.Select
                      ref={yearSelectRef}
                      value={formData.academic_year}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          academic_year: e.target.value,
                        })
                      }
                    >
                      <option value="">-- ไม่ระบุ --</option>
                      {YEARS.map((y) => (
                        <option key={y} value={y}>
                          {y}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>

              <Form.Group className="mb-3">
                <Form.Label className="fw-bold text-secondary">
                  วันที่จัดกิจกรรม (ล็อกตามระบบ)
                </Form.Label>
                <Form.Control
                  type="date"
                  value={formData.event_date}
                  readOnly
                  className="bg-light"
                  tabIndex={-1}
                />
                {isValidEvent && (
                  <Form.Text className="text-muted">
                    กิจกรรม: <strong>{formData.title}</strong>
                  </Form.Text>
                )}
              </Form.Group>

              <Form.Group className="mb-4">
                <Form.Label className="fw-bold">คำอธิบายรูปภาพ</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </Form.Group>

              {loading && uploadProgress > 0 && (
                <div className="mb-3">
                  <small className="text-muted">
                    กำลังอัปโหลด {uploadProgress}%
                  </small>
                  <ProgressBar
                    now={uploadProgress}
                    animated
                    striped
                    variant="primary"
                  />
                </div>
              )}

              <div className="d-grid gap-2">
                <Button
                  variant="success"
                  type="submit"
                  className="fw-bold py-2"
                  disabled={
                    loading || selectedFiles.length === 0 || !isValidEvent
                  }
                >
                  {loading ? (
                    <>
                      <Spinner size="sm" className="me-1" />
                      กำลังอัปโหลด...
                    </>
                  ) : (
                    `🚀 อัปโหลด ${selectedFiles.length > 1 ? `${selectedFiles.length} รูป` : "รูปภาพ"}`
                  )}
                </Button>
                <Button variant="light" onClick={() => navigate("/photos")}>
                  ยกเลิก
                </Button>
              </div>
            </Col>
          </Row>
        </Form>
      </Card>

      {/* ===== Modal ไฟล์ไม่รองรับ ===== */}
      <Modal
        show={showInvalidModal}
        onHide={() => setShowInvalidModal(false)}
        centered
      >
        <Modal.Header closeButton className="bg-danger text-white">
          <Modal.Title className="fw-bold">⚠️ ไฟล์ไม่รองรับ</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="mb-2">
            ไฟล์ต่อไปนี้ไม่รองรับ{" "}
            <strong>(รองรับเฉพาะ JPG, PNG)</strong>
          </p>
          <ul className="mb-0">
            {invalidFiles.map((name, i) => (
              <li key={i} className="text-danger small">
                📄 {name}
              </li>
            ))}
          </ul>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="danger" onClick={() => setShowInvalidModal(false)}>
            ตกลง
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ===== Modal สร้าง Event ใหม่ ===== */}
      <Modal
        show={showAddEventModal}
        onHide={() => setShowAddEventModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold text-primary">
            เพิ่มกิจกรรมใหม่
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {addError && (
            <Alert variant="danger" className="mb-3">
              {addError}
            </Alert>
          )}
          <Form.Group className="mb-3">
            <Form.Label className="fw-medium">
              ชื่อกิจกรรม <span className="text-danger">*</span>
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
              วันที่จัดกิจกรรม <span className="text-danger">*</span>
            </Form.Label>
            <div>
              <CustomDatePicker
                value={newEventData.date}
                max={todayStr}
                onChange={(v) => setNewEventData({ ...newEventData, date: v })}
                placeholder="DD/MM/YYYY"
              />
            </div>
            <Form.Text className="text-muted">
              เลือกได้เฉพาะวันนี้หรือวันที่ผ่านมา
            </Form.Text>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowAddEventModal(false)}
          >
            ยกเลิก
          </Button>
          <Button variant="primary" onClick={handleCreateEvent}>
            บันทึก
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ===== Modal ผลการอัปโหลด ===== */}
      <Modal
        show={modalConfig.show}
        onHide={() => {
          setModalConfig({ ...modalConfig, show: false });
          setShowFailDetail(false);
          if (modalConfig.isSuccess) navigate("/photos");
        }}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title
            className={`fw-bold ${modalConfig.variant === "success" ? "text-success" : "text-warning"}`}
          >
            {modalConfig.variant === "success" ? "✅" : "⚠️"}{" "}
            {modalConfig.title}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center py-3">
          <p className="fs-5 mb-3">{modalConfig.message}</p>

          {modalConfig.failedFiles.length > 0 && (
            <Button
              variant="outline-danger"
              size="sm"
              className="rounded-pill px-3 mb-2"
              onClick={() => setShowFailDetail((v) => !v)}
            >
              {showFailDetail ? "▲ ซ่อนสาเหตุ" : "▼ สาเหตุ"}
            </Button>
          )}

          {showFailDetail && modalConfig.failedFiles.length > 0 && (
            <div
              className="text-start mt-2 border rounded p-2"
              style={{
                maxHeight: 220,
                overflowY: "auto",
                background: "#fff8f8",
              }}
            >
              <p className="text-danger fw-bold small mb-2">
                รูปที่อัปโหลดไม่สำเร็จ ({modalConfig.failedFiles.length} รูป)
              </p>
              {modalConfig.failedFiles.map((f, i) => (
                <div key={i} className="mb-2 pb-2 border-bottom">
                  {/*@ ถ้าเป็นรูปซ้ำ (409) แสดง thumbnail + กดแล้ว navigate ตรงไปรูปนั้น */}
                  {f.isDuplicate ? (
                    <div
                      className="d-flex align-items-center gap-2"
                      style={{ cursor: "pointer" }}
                      onClick={() => goToGalleryFolder(f)}
                      title={`ไปดูรูปใน ${f.eventName}`}
                    >
                      {f.duplicateThumb ? (
                        <img
                          src={f.duplicateThumb}
                          alt={f.name}
                          style={{
                            width: 48,
                            height: 48,
                            objectFit: "cover",
                            borderRadius: 6,
                            border: "2px solid #0d6efd",
                            flexShrink: 0,
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: 48,
                            height: 48,
                            background: "#e9ecef",
                            borderRadius: 6,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 20,
                          }}
                        >
                          🖼️
                        </div>
                      )}
                      <div>
                        <div
                          className="fw-medium small text-primary text-decoration-underline text-truncate"
                          style={{ maxWidth: 200 }}
                        >
                          {f.name}
                        </div>
                        <div className="text-muted" style={{ fontSize: 11 }}>
                          👆 กดเพื่อดูรูปใน gallery
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div
                      className="fw-medium small text-truncate"
                      style={{ maxWidth: "100%" }}
                      title={f.name}
                    >
                      📄 {f.name}
                    </div>
                  )}
                  <div className="text-danger small mt-1">⚠️ {f.reason}</div>
                </div>
              ))}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant={modalConfig.variant === "success" ? "success" : "primary"}
            onClick={() => {
              setModalConfig({ ...modalConfig, show: false });
              setShowFailDetail(false);
              if (modalConfig.isSuccess) navigate("/photos");
            }}
          >
            ตกลง
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};