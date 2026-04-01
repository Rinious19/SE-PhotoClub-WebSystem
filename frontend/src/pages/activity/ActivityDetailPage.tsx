//? Page: Activity Detail Page
//@ หน้าแสดงรายละเอียดกิจกรรมโหวต

import React, { useState, useCallback, useEffect } from "react";
import {
  Container, Row, Col, Card, Button, Modal,
  Spinner, Alert, Badge, ProgressBar,
} from "react-bootstrap";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ActivityService } from "@/services/ActivityService";
import { VoteService } from "@/services/VoteService";
import { VoteButton } from "@/components/activity/VoteButton";
import { useAuth } from "@/hooks/useAuth";
import { isAdminOrPresident } from "@/utils/roleChecker";
import { parseApiError } from "@/utils/apiError";

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const getImageUrl = (imageUrl: unknown): string => {
  if (!imageUrl) return "";
  if (typeof imageUrl === "string") return imageUrl.startsWith("http") ? imageUrl : `${BASE_URL}${imageUrl}`;
  return "";
};

interface ActivityPhoto {
  activity_photo_id: number; 
  photo_id: number; 
  image_url: string;
  thumbnail_url: string | null;
  photo_title: string;
  photo_description?: string;
  faculty?: string;
  academic_year?: string;
  vote_count: number;
  sort_order: number;
}

interface ActivityDetail {
  id: number;
  title: string;
  description?: string;
  category?: string;
  faculty?: string;
  event_name: string;
  start_at: string;
  end_at: string;
  status: "UPCOMING" | "ACTIVE" | "ENDED";
  creator_name: string;
  vote_count: number;
  photos: ActivityPhoto[];
}

const formatThaiDate = (dateString: string) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const day = date.getDate();
  const month = date.toLocaleDateString("th-TH", { month: "short" }); 
  const year = date.getFullYear() + 543; 
  const time = date.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }); 
  return `${day} ${month} ${year} ${time} น.`;
};

export const ActivityDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const canManage = isAdminOrPresident(user);

  const [activity, setActivity] = useState<ActivityDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [userVotedPhotoId, setUserVotedPhotoId] = useState<number | null>(null);
  const [pendingVotePhotoId, setPendingVotePhotoId] = useState<number | null>(null);
  const [voteLoading, setVoteLoading] = useState(false);
  const [voteResultMsg, setVoteResultMsg] = useState({ show: false, success: false, msg: "" });

  const [showGuestModal, setShowGuestModal] = useState(false);
  // ลบ State ที่เกี่ยวกับปุ่มลบรูปภาพออก
  // const [deletePhotoTarget, setDeletePhotoTarget] = useState<ActivityPhoto | null>(null);
  // const [deletePhotoLoading, setDeletePhotoLoading] = useState(false);

  const [viewPhoto, setViewPhoto] = useState<ActivityPhoto | null>(null);

  const loadActivity = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true); setError(null);
      const res = await ActivityService.getById(Number(id));
      setActivity(res.data);

      if (isAuthenticated) {
        const token = localStorage.getItem("token");
        if (token) {
          const voteRes = await VoteService.getMyVotes([Number(id)], token);
          const myVote = (voteRes.data || []).find((v: any) => v.activity_id === Number(id));
          if (myVote) setUserVotedPhotoId(myVote.photo_id);
        }
      }
    } catch (err: unknown) {
      setError(parseApiError(err, "โหลดกิจกรรมไม่สำเร็จ"));
    } finally {
      setLoading(false);
    }
  }, [id, isAuthenticated]);

  useEffect(() => { loadActivity(); }, [loadActivity]);

  const handleVoteClick = (activityPhotoId: number) => {
    if (!isAuthenticated) { setShowGuestModal(true); return; }
    setPendingVotePhotoId(activityPhotoId);
  };

  const confirmVote = async () => {
    if (!pendingVotePhotoId || !activity) return;
    setVoteLoading(true);
    try {
      const token = localStorage.getItem("token");
      await VoteService.castVote({ activity_id: activity.id, photo_id: pendingVotePhotoId }, token!);
      setUserVotedPhotoId(pendingVotePhotoId);
      setVoteResultMsg({ show: true, success: true, msg: "✅ โหวตสำเร็จ! ขอบคุณที่ร่วมโหวต" });
      await loadActivity();
    } catch (err: unknown) {
      setVoteResultMsg({ show: true, success: false, msg: parseApiError(err, "โหวตไม่สำเร็จ") });
    } finally {
      setVoteLoading(false); setPendingVotePhotoId(null);
    }
  };

  // ลบฟังก์ชัน confirmDeletePhoto ออก
  /*
  const confirmDeletePhoto = async () => {
    if (!deletePhotoTarget || !activity) return;
    setDeletePhotoLoading(true);
    try {
      const token = localStorage.getItem("token");
      await ActivityService.removePhoto(activity.id, deletePhotoTarget.activity_photo_id, token!);
      setDeletePhotoTarget(null);
      await loadActivity();
    } catch (err: unknown) {
      alert(parseApiError(err, "ลบรูปไม่สำเร็จ"));
    } finally {
      setDeletePhotoLoading(false);
    }
  };
  */

  const getProgressPercent = (): number => {
    if (!activity) return 0;
    const start = new Date(activity.start_at).getTime();
    const end = new Date(activity.end_at).getTime();
    const now = Date.now();
    if (now <= start) return 0;
    if (now >= end) return 100;
    return Math.round(((now - start) / (end - start)) * 100);
  };

  if (loading) return <Container className="py-5 text-center"><Spinner animation="border" variant="primary" /><p className="mt-3 text-muted">กำลังโหลดกิจกรรม...</p></Container>;
  if (error || !activity) return <Container className="py-5"><Alert variant="danger">{error || "ไม่พบกิจกรรมนี้"}</Alert><Button variant="outline-secondary" onClick={() => navigate("/activities")}>← กลับ</Button></Container>;

  const maxVote = Math.max(...(activity.photos.map(p => p.vote_count).length ? activity.photos.map(p => p.vote_count) : [0]));
  const progressPct = getProgressPercent();
  const hasVoted = userVotedPhotoId !== null;

  const statusBadge: Record<string, { label: string; bg: string }> = {
    ACTIVE: { label: "🟢 กำลังโหวต", bg: "success" },
    UPCOMING: { label: "🕐 รอเปิดกิจกรรม", bg: "warning" },
    ENDED: { label: "🔴 สิ้นสุดแล้ว", bg: "secondary" },
  };
  const badge = statusBadge[activity.status] ?? { label: activity.status, bg: "light" };

  return (
    <Container className="py-5">
      <Button variant="outline-secondary" size="sm" className="mb-4 rounded-pill px-3" onClick={() => navigate("/activities")}>← กลับ</Button>

      <Card className="border-0 shadow-sm rounded-4 mb-4 p-4">
        <div className="d-flex justify-content-between align-items-start flex-wrap gap-3">
          <div>
            <Badge bg={badge.bg} className="mb-2 rounded-pill px-3">{badge.label}</Badge>
            <h2 className="fw-bold mb-1">{activity.title}</h2>
            <p className="text-muted small mt-2 mb-0">📅 {formatThaiDate(activity.start_at)} – {formatThaiDate(activity.end_at)}</p>
            {activity.description && <p className="text-secondary mt-2 mb-0">{activity.description}</p>}
          </div>

          {canManage && activity.status === "UPCOMING" && (
            <Button 
              variant="outline-warning" 
              size="sm" 
              className="rounded-pill px-3" 
              onClick={() => navigate(`/activities/edit/${activity.id}`)}
            >
              ✏️ แก้ไขกิจกรรม
            </Button>
          )}
        </div>

        {activity.status === "ACTIVE" && (
          <div className="mt-3">
            <div className="d-flex justify-content-between small text-muted mb-1"><span>ความคืบหน้า</span><span>{progressPct}%</span></div>
            <ProgressBar now={progressPct} variant="success" style={{ height: 6, borderRadius: 4 }} />
          </div>
        )}

        <div className="d-flex gap-4 mt-3">
          <div className="text-center"><div className="fw-bold fs-4 text-primary">{activity.vote_count}</div><div className="text-muted small">โหวตทั้งหมด</div></div>
          <div className="text-center"><div className="fw-bold fs-4">{activity.photos.length}</div><div className="text-muted small">รูปภาพ</div></div>
        </div>
      </Card>

      {hasVoted && activity.status === "ACTIVE" && <Alert variant="success" className="rounded-3 mb-4">✅ คุณได้โหวตในกิจกรรมนี้แล้ว ขอบคุณที่ร่วมกิจกรรม!</Alert>}

      <Row xs={2} sm={3} md={4} lg={4} className="g-3">
        {activity.photos.map((photo) => {
          const imgSrc = getImageUrl(photo.thumbnail_url || photo.image_url);
          const isWinner = activity.status === "ENDED" && photo.vote_count === maxVote && maxVote > 0;

          return (
            <Col key={photo.activity_photo_id}>
              <Card className="border-0 h-100 rounded-3 overflow-hidden" style={{ boxShadow: isWinner ? "0 0 0 3px #ffc107, 0 4px 16px rgba(0,0,0,.15)" : "0 2px 8px rgba(0,0,0,.08)" }}>
                <div style={{ position: "relative", aspectRatio: "1", overflow: "hidden", cursor: "pointer" }} onClick={() => setViewPhoto(photo)}>
                  <img src={imgSrc} alt={photo.photo_title} style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.2s ease" }} onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.05)")} onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")} loading="lazy" />
                  {isWinner && <div style={{ position: "absolute", top: 8, left: 8, background: "#ffc107", color: "#000", borderRadius: 20, padding: "2px 10px", fontSize: 12, fontWeight: 700 }}>🏆 อันดับ 1</div>}
                  
                  {/* ✅ ลบโค้ดบล็อกของปุ่ม X (กากบาทลบรูปภาพ) ออกเรียบร้อยแล้ว */}
                </div>
                <Card.Body className="p-2">
                  {activity.status !== "UPCOMING" && <div className="text-center small fw-bold text-muted mb-2 mt-1">{photo.vote_count} โหวต</div>}
                  <VoteButton activityPhotoId={photo.activity_photo_id} activityStatus={activity.status} isLoggedIn={isAuthenticated} hasVoted={hasVoted} votedPhotoId={userVotedPhotoId ?? undefined} voteCount={photo.vote_count} onVote={handleVoteClick} onGuestClick={() => setShowGuestModal(true)} />
                </Card.Body>
              </Card>
            </Col>
          );
        })}
      </Row>

      <Modal show={viewPhoto !== null} onHide={() => setViewPhoto(null)} size="lg" centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold fs-5 text-muted">รายละเอียดรูปภาพ</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center p-3">
          {viewPhoto && (
            <>
              <img src={getImageUrl(viewPhoto.image_url || viewPhoto.thumbnail_url)} alt={viewPhoto.photo_title} style={{ width: "100%", maxHeight: "65vh", objectFit: "contain", borderRadius: "8px", backgroundColor: "#f8f9fa" }} />
              {viewPhoto.photo_title && viewPhoto.photo_title.trim() !== "" && (
                <h4 className="mt-3 mb-1 fw-bold text-dark">{viewPhoto.photo_title}</h4>
              )}
              {viewPhoto.photo_description && viewPhoto.photo_description.trim() !== "" && (
                <p className="text-secondary mt-2 mb-0 px-md-5">{viewPhoto.photo_description}</p>
              )}
            </>
          )}
        </Modal.Body>
        <Modal.Footer className="d-flex justify-content-between align-items-center bg-light border-0 rounded-bottom">
          {viewPhoto && (
            <div className="w-100 text-start">
              <Row>
                <Col md={8}>
                  <p className="mb-1 small"><strong className="text-secondary">📂 อีเว้นท์:</strong> <span className="text-dark fw-medium">{activity.event_name}</span></p>
                  <p className="mb-1 small"><strong className="text-secondary">🏫 คณะ:</strong> <span className="text-dark fw-medium">{viewPhoto.faculty && viewPhoto.faculty !== "undefined" ? viewPhoto.faculty : "ไม่ระบุ"}</span></p>
                  <p className="mb-0 small"><strong className="text-secondary">🎓 ปีการศึกษา:</strong> <span className="text-dark fw-medium">{viewPhoto.academic_year && viewPhoto.academic_year !== "undefined" ? viewPhoto.academic_year : "ไม่ระบุ"}</span></p>
                </Col>
                <Col md={4} className="text-md-end text-start mt-3 mt-md-0 d-flex align-items-center justify-content-md-end">
                  <Badge bg="primary" className="fs-5 rounded-pill px-4 py-2 shadow-sm">{viewPhoto.vote_count} โหวต</Badge>
                </Col>
              </Row>
            </div>
          )}
        </Modal.Footer>
      </Modal>

      <Modal show={pendingVotePhotoId !== null} onHide={() => !voteLoading && setPendingVotePhotoId(null)} centered><Modal.Header closeButton={!voteLoading}><Modal.Title className="fw-bold">🗳️ ยืนยันการโหวต</Modal.Title></Modal.Header><Modal.Body className="text-center py-3"><p className="fs-5 mb-1">ต้องการโหวตให้รูปภาพนี้ใช่หรือไม่?</p><small className="text-muted">คุณสามารถโหวตได้ 1 ครั้งต่อกิจกรรมเท่านั้น</small></Modal.Body><Modal.Footer className="justify-content-center gap-2"><Button variant="secondary" disabled={voteLoading} onClick={() => setPendingVotePhotoId(null)}>ยกเลิก</Button><Button variant="primary" className="fw-bold" onClick={confirmVote} disabled={voteLoading}>{voteLoading ? <><Spinner size="sm" className="me-1" />กำลังโหวต...</> : "ยืนยันโหวต"}</Button></Modal.Footer></Modal>
      <Modal show={voteResultMsg.show} onHide={() => setVoteResultMsg(p => ({ ...p, show: false }))} centered><Modal.Header closeButton className={voteResultMsg.success ? "bg-success text-white" : "bg-danger text-white"}><Modal.Title className="fw-bold">{voteResultMsg.success ? "✅ สำเร็จ" : "❌ เกิดข้อผิดพลาด"}</Modal.Title></Modal.Header><Modal.Body className="text-center py-3 fs-5">{voteResultMsg.msg}</Modal.Body><Modal.Footer className="justify-content-center"><Button variant={voteResultMsg.success ? "success" : "danger"} onClick={() => setVoteResultMsg(p => ({ ...p, show: false }))}>ตกลง</Button></Modal.Footer></Modal>
      <Modal show={showGuestModal} onHide={() => setShowGuestModal(false)} centered><Modal.Header closeButton><Modal.Title className="fw-bold">🔒 ต้องเข้าสู่ระบบก่อนโหวต</Modal.Title></Modal.Header><Modal.Body className="text-center py-4"><p className="fs-5 mb-1">กรุณาเข้าสู่ระบบหรือสมัครสมาชิกก่อน</p><p className="text-muted small">เพื่อร่วมโหวตในกิจกรรมนี้</p></Modal.Body><Modal.Footer className="justify-content-center gap-2"><Link to="/login" className="btn btn-primary fw-bold px-4" onClick={() => setShowGuestModal(false)}>เข้าสู่ระบบ</Link><Link to="/register" className="btn btn-outline-primary px-4" onClick={() => setShowGuestModal(false)}>สมัครสมาชิก</Link></Modal.Footer></Modal>
      
      {/* ลบ Modal ยืนยันการลบรูปภาพออก */}
      {/*
      <Modal show={deletePhotoTarget !== null} onHide={() => !deletePhotoLoading && setDeletePhotoTarget(null)} centered><Modal.Header closeButton={!deletePhotoLoading} className="bg-danger text-white"><Modal.Title className="fw-bold">🗑️ ลบรูปออกจากกิจกรรม</Modal.Title></Modal.Header><Modal.Body className="text-center py-3"><p className="fs-5 mb-1">ต้องการลบรูปภาพนี้ออกจากกิจกรรมใช่หรือไม่?</p><small className="text-muted">รูปต้นฉบับในแกลเลอรี่จะยังคงอยู่</small></Modal.Body><Modal.Footer className="justify-content-center gap-2"><Button variant="secondary" disabled={deletePhotoLoading} onClick={() => setDeletePhotoTarget(null)}>ยกเลิก</Button><Button variant="danger" className="fw-bold" onClick={confirmDeletePhoto} disabled={deletePhotoLoading}>{deletePhotoLoading ? <><Spinner size="sm" className="me-1" />กำลังลบ...</> : "ยืนยันลบ"}</Button></Modal.Footer></Modal>
      */}
    </Container>
  );
};