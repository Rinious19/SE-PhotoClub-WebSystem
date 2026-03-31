import React, { useState, useMemo } from "react";
import { Card, Button, Modal, Row, Col } from "react-bootstrap";
import { PhotoService } from "../../services/PhotoService";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { AlertModal } from "../common/AlertModal";

interface PhotoCardProps {
  // 🌟 ปรับเพิ่ม event_name, faculty, academic_year เข้ามาเผื่อรองรับข้อมูลจากหลังบ้าน
  photo: { 
    id: number; 
    title: string; 
    description?: string; 
    image_url: any;
    event_name?: string;
    faculty?: string;
    academic_year?: string;
    [key: string]: any;
  };
  onPhotoDeleted?: () => void;
}

export const PhotoCard: React.FC<PhotoCardProps> = ({
  photo,
  onPhotoDeleted,
}) => {
  const { user } = useAuth();
  const canManage = user?.role === "ADMIN" || user?.role === "CLUB_PRESIDENT";

  // --- [จัดการเรื่องการแสดงผลรูปภาพ BLOB] ---
  const displayImage = useMemo(() => {
    const imageUrl = photo.image_url;
    if (!imageUrl) return "https://via.placeholder.com/300x200?text=No+Image";

    // 1. ถ้าเป็น String (URL เดิม หรือ Base64)
    if (typeof imageUrl === "string") {
      return imageUrl.startsWith("http")
        ? imageUrl
        : `http://localhost:5000${imageUrl}`;
    }

    // 2. ถ้าเป็น BLOB / Buffer จาก Database
    try {
      // ตรวจสอบโครงสร้าง { type: 'Buffer', data: [...] }
      const uint8Array = new Uint8Array(imageUrl.data || imageUrl);
      const blob = new Blob([uint8Array], { type: "image/jpeg" });
      return URL.createObjectURL(blob);
    } catch (e) {
      console.error("Image rendering error:", e);
      return "https://via.placeholder.com/300x200?text=Error";
    }
  }, [photo.image_url]);

  // --- [1. State ควบคุม AlertModal] ---
  const [modalConfig, setModalConfig] = useState({
    show: false,
    title: "",
    message: "",
    variant: "primary" as "success" | "danger",
    isSuccess: false,
  });

  const handleCloseAlertModal = () => {
    setModalConfig({ ...modalConfig, show: false });
    if (modalConfig.isSuccess) {
      if (onPhotoDeleted) onPhotoDeleted();
      else window.location.reload();
    }
  };

  // --- [2. State ควบคุม Lightbox Modal] ---
  const [showLightbox, setShowLightbox] = useState(false);
  const handleOpenLightbox = () => setShowLightbox(true);
  const handleCloseLightbox = () => setShowLightbox(false);

  // --- [3. Confirm Modal] ---
  const [showConfirm, setShowConfirm] = useState(false);
  const handleOpenConfirm = () => setShowConfirm(true);
  const handleCloseConfirm = () => setShowConfirm(false);

  // --- [4. ฟังก์ชันลบรูปภาพ] ---
  const confirmDelete = async () => {
    handleCloseConfirm();
    try {
      const token = localStorage.getItem("token");
      const res = await PhotoService.delete(photo.id, token!);
      if (res.success) {
        setModalConfig({
          show: true,
          title: "ลบสำเร็จ!",
          message: "รูปภาพถูกย้ายลงถังขยะเรียบร้อยแล้ว",
          variant: "success",
          isSuccess: true,
        });
      }
    } catch (err: any) {
      setModalConfig({
        show: true,
        title: "เกิดข้อผิดพลาด",
        message: err.response?.data?.message || "ไม่สามารถลบรูปภาพได้",
        variant: "danger",
        isSuccess: false,
      });
    }
  };

  return (
    <>
      <Card className="h-100 border-0 shadow-sm overflow-hidden">
        <div
          onClick={handleOpenLightbox}
          style={{ cursor: "pointer", overflow: "hidden" }}
          title="คลิกเพื่อดูภาพขนาดใหญ่"
        >
          <Card.Img
            variant="top"
            src={displayImage} // 🌟 ใช้รูปที่ผ่านการแปลงแล้ว
            style={{
              height: "250px",
              objectFit: "cover",
              transition: "transform 0.3s ease",
            }}
            onMouseOver={(e) =>
              (e.currentTarget.style.transform = "scale(1.05)")
            }
            onMouseOut={(e) => (e.currentTarget.style.transform = "scale(1)")}
          />
        </div>

        <Card.Body className="d-flex flex-column">
          <Card.Title className="fw-bold text-dark">
            {photo.display_title || photo.title}
          </Card.Title>
          <Card.Text className="small text-muted text-truncate">
            {photo.description || "-"}
          </Card.Text>
          {canManage && (
            <div className="d-flex gap-2 mt-auto pt-3">
              <Link
                to={`/photos/edit/${photo.id}`}
                className="btn btn-outline-warning btn-sm flex-fill"
              >
                แก้ไข
              </Link>
              <Button
                variant="outline-danger"
                size="sm"
                className="flex-fill"
                onClick={handleOpenConfirm}
              >
                ลบ
              </Button>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* 🔴 Lightbox Modal (ดีไซน์ใหม่ให้เหมือนหน้าโหวต) */}
      <Modal
        show={showLightbox}
        onHide={handleCloseLightbox}
        size="lg"
        centered
      >
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold fs-5 text-muted">
            รายละเอียดรูปภาพ
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center p-3">
          <img
            src={displayImage}
            alt={photo.title}
            style={{
              width: "100%",
              maxHeight: "65vh",
              objectFit: "contain",
              borderRadius: "8px",
              backgroundColor: "#f8f9fa",
            }}
          />
          <h4 className="mt-3 mb-1 fw-bold text-dark">
            {photo.display_title || photo.title}
          </h4>
          {photo.description && (
            <p className="text-secondary mt-2 mb-0 px-md-5">
              {photo.description}
            </p>
          )}
        </Modal.Body>
        <Modal.Footer className="d-flex justify-content-between align-items-center bg-light border-0 rounded-bottom">
          <div className="w-100 text-start">
            <Row>
              <Col md={12}>
                <p className="mb-1 small">
                  <strong className="text-secondary">📂 อีเว้นท์:</strong>{" "}
                  <span className="text-dark fw-medium">
                    {photo.event_name || "ไม่ระบุ"}
                  </span>
                </p>
                <p className="mb-1 small">
                  <strong className="text-secondary">🏫 คณะ:</strong>{" "}
                  <span className="text-dark fw-medium">
                    {photo.faculty && photo.faculty !== "undefined"
                      ? photo.faculty
                      : "ไม่ระบุ"}
                  </span>
                </p>
                <p className="mb-0 small">
                  <strong className="text-secondary">🎓 ปีการศึกษา:</strong>{" "}
                  <span className="text-dark fw-medium">
                    {photo.academic_year && photo.academic_year !== "undefined"
                      ? photo.academic_year
                      : "ไม่ระบุ"}
                  </span>
                </p>
              </Col>
            </Row>
          </div>
        </Modal.Footer>
      </Modal>

      {/* 🔴 Confirm Modal */}
      <Modal show={showConfirm} onHide={handleCloseConfirm} centered>
        <Modal.Header closeButton>
          <Modal.Title className="text-danger fw-bold">
            ยืนยันการลบรูปภาพ
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="fs-5 text-center py-4">
          คุณแน่ใจหรือไม่ว่าต้องการย้ายรูปภาพ <b>"{photo.title}"</b> ลงถังขยะ?
        </Modal.Body>
        <Modal.Footer className="justify-content-center">
          <Button
            variant="secondary"
            onClick={handleCloseConfirm}
            className="px-4"
          >
            ยกเลิก
          </Button>
          <Button variant="danger" onClick={confirmDelete} className="px-4">
            ยืนยันการลบ
          </Button>
        </Modal.Footer>
      </Modal>

      {/* 🔴 AlertModal */}
      <AlertModal
        show={modalConfig.show}
        title={modalConfig.title}
        message={modalConfig.message}
        variant={modalConfig.variant}
        onClose={handleCloseAlertModal}
      />
    </>
  );
};