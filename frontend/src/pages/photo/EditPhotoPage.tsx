import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Container,
  Form,
  Button,
  Card,
  Spinner,
  Alert,
  Modal,
} from "react-bootstrap";
import { PhotoService } from "../../services/PhotoService";
import { AlertModal } from "../../components/common/AlertModal";

export const EditPhotoPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // ✅ 1. สร้าง State จำข้อมูล "ต้นฉบับ" ก่อนถูกแก้
  const [originalData, setOriginalData] = useState({
    title: "",
    description: "",
    image_url: "",
  });

  // State สำหรับข้อมูลที่กำลังพิมพ์ในฟอร์ม
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    image_url: "",
  });

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [modalConfig, setModalConfig] = useState({
    show: false,
    title: "",
    message: "",
    variant: "primary" as "success" | "danger",
    isSuccess: false,
  });

  const handleCloseModal = () => {
    setModalConfig({ ...modalConfig, show: false });
    if (modalConfig.isSuccess) navigate("/photos");
  };

  const [showConfirm, setShowConfirm] = useState(false);
  const handleCloseConfirm = () => setShowConfirm(false);

  useEffect(() => {
    const loadPhoto = async () => {
      try {
        setLoading(true);
        const res = await PhotoService.getAll();
        const photo = res.data.find((p: any) => p.id === Number(id));

        if (photo) {
          const initData = {
            title: photo.title,
            description: photo.description || "",
            image_url: photo.image_url,
          };
          setFormData(initData);
          setOriginalData(initData); // ✅ 2. เก็บข้อมูลเริ่มต้นไว้ใน originalData ด้วย
        } else {
          setError("ไม่พบข้อมูลรูปภาพนี้");
        }
      } catch (err) {
        setError("โหลดข้อมูลล้มเหลว");
      } finally {
        setLoading(false);
      }
    };
    loadPhoto();
  }, [id]);

  // ✅ 3. เช็คว่ามีข้อมูลไหนที่ถูกเปลี่ยนไปจากตอนแรกบ้าง? (ถ้ามีตัวใดตัวหนึ่งเปลี่ยน จะมีค่าเป็น true)
  const hasChanges =
    formData.title !== originalData.title ||
    formData.description !== originalData.description ||
    formData.image_url !== originalData.image_url;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // ✅ 4. ดักไว้อีกชั้น: ถ้าไม่มีการแก้ไข แต่ผู้ใช้บังเอิญกด Enter จะไม่เกิดอะไรขึ้น
    if (!hasChanges) return;
    setShowConfirm(true);
  };

  const confirmSave = async () => {
    setShowConfirm(false);
    setSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const res = await PhotoService.update(Number(id), formData, token!);

      if (res.success) {
        setModalConfig({
          show: true,
          title: "สำเร็จ!",
          message: "แก้ไขข้อมูลรูปภาพเรียบร้อยแล้ว",
          variant: "success",
          isSuccess: true,
        });
      }
    } catch (err: any) {
      setModalConfig({
        show: true,
        title: "เกิดข้อผิดพลาด",
        message: err.response?.data?.message || "ไม่สามารถแก้ไขข้อมูลได้",
        variant: "danger",
        isSuccess: false,
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading)
    return (
      <div className="text-center py-5">
        <Spinner animation="border" />
      </div>
    );

  return (
    <Container className="py-5">
      <Card
        className="shadow-sm border-0 p-4 mx-auto"
        style={{ maxWidth: "600px" }}
      >
        <h3 className="fw-bold mb-4">แก้ไขข้อมูลรูปภาพ</h3>
        {error && <Alert variant="danger">{error}</Alert>}

        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>ชื่อรูปภาพ</Form.Label>
            <Form.Control
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>คำอธิบาย</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
          </Form.Group>

          <Form.Group className="mb-4">
            <Form.Label>URL รูปภาพ</Form.Label>
            <Form.Control
              type="text"
              value={formData.image_url}
              onChange={(e) =>
                setFormData({ ...formData, image_url: e.target.value })
              }
              required
            />
          </Form.Group>

          <div className="d-flex gap-2">
            {/* ✅ 5. เพิ่มเงื่อนไข !hasChanges เข้าไปใน disabled เพื่อล็อกปุ่มถ้าข้อมูลยังไม่ถูกแก้ */}
            <Button
              variant="warning"
              type="submit"
              disabled={submitting || !hasChanges}
              // ✅ เพิ่ม style ตรงนี้: ถ้าปุ่มโดนล็อก ให้ความทึบเหลือแค่ 0.4 (จางลงมาก) ถ้าปกติให้เป็น 1
              style={{ opacity: submitting || !hasChanges ? 0.2 : 1 }}
            >
              {submitting ? "กำลังเตรียมข้อมูล..." : "บันทึกการแก้ไข"}
            </Button>
            <Button variant="secondary" onClick={() => navigate("/photos")}>
              ยกเลิก
            </Button>
          </div>
        </Form>
      </Card>

      <Modal show={showConfirm} onHide={handleCloseConfirm} centered>
        <Modal.Header closeButton>
          <Modal.Title className="text-warning fw-bold">
            ยืนยันการแก้ไขข้อมูล
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="fs-5 text-center py-4">
          คุณตรวจสอบข้อมูลถูกต้องแล้ว และต้องการบันทึกการแก้ไขใช่หรือไม่?
        </Modal.Body>
        <Modal.Footer className="justify-content-center">
          <Button
            variant="secondary"
            onClick={handleCloseConfirm}
            className="px-4"
          >
            ยกเลิก
          </Button>
          <Button variant="warning" onClick={confirmSave} className="px-4">
            ยืนยันการบันทึก
          </Button>
        </Modal.Footer>
      </Modal>

      <AlertModal
        show={modalConfig.show}
        title={modalConfig.title}
        message={modalConfig.message}
        variant={modalConfig.variant}
        onClose={handleCloseModal}
      />
    </Container>
  );
};
