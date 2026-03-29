//? Page: Activity Detail Page
//@ หน้าแสดงรายละเอียดกิจกรรมโหวต
//  - GUEST → ดูได้อย่างเดียว ถ้ากดโหวตจะขึ้น Modal ให้ Login/Register
//  - EXTERNAL_USER → โหวตได้ 1 ครั้งต่อกิจกรรม
//  - ADMIN / CLUB_PRESIDENT → ลบรูปออกจากกิจกรรมได้

import React, { useState, useCallback, useEffect } from 'react';
import {
  Container, Row, Col, Card, Button, Modal,
  Spinner, Alert, Badge, ProgressBar,
} from 'react-bootstrap';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ActivityService }              from '@/services/ActivityService';
import { VoteService }                  from '@/services/VoteService';
import { VoteButton }                   from '@/components/activity/VoteButton';
import { useAuth }                      from '@/hooks/useAuth';
import { isAdminOrPresident }           from '@/utils/roleChecker';
import { parseApiError }                from '@/utils/apiError';

const BASE_URL = 'http://localhost:5000';

//@ แปลง image_url เป็น src URL ที่ใช้ได้
const getImageUrl = (imageUrl: unknown): string => {
  if (!imageUrl) return '';
  if (typeof imageUrl === 'string') {
    return imageUrl.startsWith('http') ? imageUrl : `${BASE_URL}${imageUrl}`;
  }
  return '';
};

//@ กำหนด type ของรูปใน Activity (activity_photos join photos)
interface ActivityPhoto {
  activity_photo_id: number; // id ใน activity_photos
  photo_id:          number; // id ใน photos
  image_url:         string;
  thumbnail_url:     string | null;
  photo_title:       string;
  faculty?:          string;
  academic_year?:    string;
  vote_count:        number;
  sort_order:        number;
}

//@ กำหนด type ของ Activity ที่รับมาจาก API
interface ActivityDetail {
  id:           number;
  title:        string;
  description?: string;
  category?:    string;
  faculty?:     string; // ✅ เพิ่มบรรทัดนี้ เพื่อให้ระบบรู้จัก faculty โดยไม่ต้องใช้ any
  event_name:   string;
  start_at:     string;
  end_at:       string;
  status:       'UPCOMING' | 'ACTIVE' | 'ENDED';
  creator_name: string;
  vote_count:   number;
  photos:       ActivityPhoto[];
}

export const ActivityDetailPage: React.FC = () => {
  const { id }             = useParams<{ id: string }>();
  const navigate           = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const canManage = isAdminOrPresident(user);

  //* ===== States =====
  const [activity,          setActivity]          = useState<ActivityDetail | null>(null);
  const [loading,           setLoading]           = useState(true);
  const [error,             setError]             = useState<string | null>(null);

  // สถานะโหวตของ user ปัจจุบัน
  const [userVotedPhotoId,  setUserVotedPhotoId]  = useState<number | null>(null);

  // Modal ยืนยันโหวต
  const [pendingVotePhotoId, setPendingVotePhotoId] = useState<number | null>(null);
  const [voteLoading,        setVoteLoading]        = useState(false);
  const [voteResultMsg,      setVoteResultMsg]      = useState<{
    show: boolean; success: boolean; msg: string;
  }>({ show: false, success: false, msg: '' });

  // Modal สำหรับ Guest ที่ยังไม่ Login
  const [showGuestModal,    setShowGuestModal]    = useState(false);

  // Modal ลบรูปออกจากกิจกรรม (Admin/President)
  const [deletePhotoTarget,    setDeletePhotoTarget]    = useState<ActivityPhoto | null>(null);
  const [deletePhotoLoading,   setDeletePhotoLoading]   = useState(false);

  //@ โหลดข้อมูลกิจกรรม
  const loadActivity = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const res = await ActivityService.getById(Number(id));
      setActivity(res.data);

      //@ ถ้า login แล้ว → ตรวจสอบว่าโหวตไปแล้วหรือยัง
      if (isAuthenticated) {
        const token = localStorage.getItem('token');
        if (token) {
          const voteRes = await VoteService.getMyVotes([Number(id)], token);
          const myVote  = (voteRes.data || []).find(
            (v: { activity_id: number; photo_id: number }) =>
              v.activity_id === Number(id)
          );
          if (myVote) setUserVotedPhotoId(myVote.photo_id);
        }
      }
    } catch (err: unknown) {
      setError(parseApiError(err, 'โหลดกิจกรรมไม่สำเร็จ'));
    } finally {
      setLoading(false);
    }
  }, [id, isAuthenticated]);

  useEffect(() => {
    loadActivity();
  }, [loadActivity]);

  //@ เปิด Modal ยืนยันโหวต
  const handleVoteClick = (activityPhotoId: number) => {
    if (!isAuthenticated) {
      setShowGuestModal(true);
      return;
    }
    setPendingVotePhotoId(activityPhotoId);
  };

  //@ ดำเนินการโหวตหลัง User ยืนยัน
  const confirmVote = async () => {
    if (!pendingVotePhotoId || !activity) return;
    setVoteLoading(true);
    try {
      const token = localStorage.getItem('token');
      await VoteService.castVote(
        { activity_id: activity.id, photo_id: pendingVotePhotoId },
        token!
      );
      setUserVotedPhotoId(pendingVotePhotoId);
      setVoteResultMsg({ show: true, success: true, msg: '✅ โหวตสำเร็จ! ขอบคุณที่ร่วมโหวต' });
      await loadActivity();
    } catch (err: unknown) {
      const msg = parseApiError(err, 'โหวตไม่สำเร็จ');
      setVoteResultMsg({ show: true, success: false, msg });
    } finally {
      setVoteLoading(false);
      setPendingVotePhotoId(null);
    }
  };

  //@ ลบรูปออกจากกิจกรรม (Admin/President)
  const confirmDeletePhoto = async () => {
    if (!deletePhotoTarget || !activity) return;
    setDeletePhotoLoading(true);
    try {
      const token = localStorage.getItem('token');
      await ActivityService.removePhoto(
        activity.id,
        deletePhotoTarget.activity_photo_id,
        token!
      );
      setDeletePhotoTarget(null);
      await loadActivity();
    } catch (err: unknown) {
      alert(parseApiError(err, 'ลบรูปไม่สำเร็จ'));
    } finally {
      setDeletePhotoLoading(false);
    }
  };

  //@ คำนวณ % ความคืบหน้าของกิจกรรม (สำหรับ progress bar)
  const getProgressPercent = (): number => {
    if (!activity) return 0;
    const start = new Date(activity.start_at).getTime();
    const end   = new Date(activity.end_at).getTime();
    const now   = Date.now();
    if (now <= start) return 0;
    if (now >= end)   return 100;
    return Math.round(((now - start) / (end - start)) * 100);
  };

  const getMaxVote = (): number => {
    if (!activity?.photos?.length) return 0;
    return Math.max(...activity.photos.map((p) => p.vote_count));
  };

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3 text-muted">กำลังโหลดกิจกรรม...</p>
      </Container>
    );
  }

  if (error || !activity) {
    return (
      <Container className="py-5">
        <Alert variant="danger">{error || 'ไม่พบกิจกรรมนี้'}</Alert>
        <Button variant="outline-secondary" onClick={() => navigate('/activities')}>
          ← กลับ
        </Button>
      </Container>
    );
  }

  const maxVote       = getMaxVote();
  const totalVotes    = activity.vote_count;
  const progressPct   = getProgressPercent();
  const hasVoted      = userVotedPhotoId !== null;

  const statusBadge: Record<string, { label: string; bg: string }> = {
    ACTIVE:   { label: '🟢 กำลังโหวต',      bg: 'success' },
    UPCOMING: { label: '🕐 รอเปิดกิจกรรม',  bg: 'warning' },
    ENDED:    { label: '🔴 สิ้นสุดแล้ว',     bg: 'secondary' },
  };
  const badge = statusBadge[activity.status] ?? { label: activity.status, bg: 'light' };

  // ✅ แสดงประเภทกิจกรรม โดยดึงค่าตรงๆ ไม่มี any มาเกะกะแล้ว
  const displayCategory = activity.faculty || activity.category;

  return (
    <Container className="py-5">
      <Button
        variant="outline-secondary"
        size="sm"
        className="mb-4 rounded-pill px-3"
        onClick={() => navigate('/activities')}
      >
        ← กลับ
      </Button>

      <Card className="border-0 shadow-sm rounded-4 mb-4 p-4">
        <div className="d-flex justify-content-between align-items-start flex-wrap gap-3">
          <div>
            <Badge bg={badge.bg} className="mb-2 rounded-pill px-3">
              {badge.label}
            </Badge>
            <h2 className="fw-bold mb-1">{activity.title}</h2>
            {displayCategory && (
              <Badge bg="light" text="dark" className="me-2">
                🏷️ {displayCategory}
              </Badge>
            )}
            <p className="text-muted small mt-2 mb-0">
              📅 {new Date(activity.start_at).toLocaleString('th-TH')} –{' '}
              {new Date(activity.end_at).toLocaleString('th-TH')}
            </p>
            {activity.description && (
              <p className="text-secondary mt-2 mb-0">{activity.description}</p>
            )}
          </div>

          {canManage && (
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

        {activity.status === 'ACTIVE' && (
          <div className="mt-3">
            <div className="d-flex justify-content-between small text-muted mb-1">
              <span>ความคืบหน้า</span>
              <span>{progressPct}%</span>
            </div>
            <ProgressBar now={progressPct} variant="success" style={{ height: 6, borderRadius: 4 }} />
          </div>
        )}

        <div className="d-flex gap-4 mt-3">
          <div className="text-center">
            <div className="fw-bold fs-4 text-primary">{totalVotes}</div>
            <div className="text-muted small">โหวตทั้งหมด</div>
          </div>
          <div className="text-center">
            <div className="fw-bold fs-4">{activity.photos.length}</div>
            <div className="text-muted small">รูปภาพ</div>
          </div>
        </div>
      </Card>

      {hasVoted && activity.status === 'ACTIVE' && (
        <Alert variant="success" className="rounded-3 mb-4">
          ✅ คุณได้โหวตในกิจกรรมนี้แล้ว ขอบคุณที่ร่วมกิจกรรม!
        </Alert>
      )}

      <Row xs={2} sm={3} md={4} lg={4} className="g-3">
        {activity.photos.map((photo) => {
          const imgSrc      = getImageUrl(photo.thumbnail_url || photo.image_url);
          const isWinner    = activity.status === 'ENDED' && photo.vote_count === maxVote && maxVote > 0;
          const votePct     = totalVotes > 0 ? Math.round((photo.vote_count / totalVotes) * 100) : 0;

          return (
            <Col key={photo.activity_photo_id}>
              <Card
                className="border-0 h-100 rounded-3 overflow-hidden"
                style={{
                  boxShadow: isWinner
                    ? '0 0 0 3px #ffc107, 0 4px 16px rgba(0,0,0,.15)'
                    : '0 2px 8px rgba(0,0,0,.08)',
                }}
              >
                <div style={{ position: 'relative', aspectRatio: '1', overflow: 'hidden' }}>
                  <img
                    src={imgSrc}
                    alt={photo.photo_title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    loading="lazy"
                  />
                  {isWinner && (
                    <div style={{
                      position: 'absolute', top: 8, left: 8,
                      background: '#ffc107', color: '#000',
                      borderRadius: 20, padding: '2px 10px',
                      fontSize: 12, fontWeight: 700,
                    }}>
                      🏆 อันดับ 1
                    </div>
                  )}
                  {canManage && activity.status !== 'ENDED' && (
                    <Button
                      size="sm"
                      variant="danger"
                      style={{
                        position: 'absolute', top: 6, right: 6,
                        padding: '2px 8px', fontSize: 11, borderRadius: 6,
                      }}
                      onClick={() => setDeletePhotoTarget(photo)}
                    >
                      ✕
                    </Button>
                  )}
                </div>

                <Card.Body className="p-2">
                  {activity.status !== 'UPCOMING' && (
                    <>
                      <div className="d-flex justify-content-between small text-muted mb-1">
                        <span>{photo.vote_count} โหวต</span>
                        <span>{votePct}%</span>
                      </div>
                      <ProgressBar
                        now={votePct}
                        variant={isWinner ? 'warning' : 'primary'}
                        style={{ height: 4, borderRadius: 4, marginBottom: 8 }}
                      />
                    </>
                  )}

                  <VoteButton
                    activityPhotoId={photo.activity_photo_id}
                    activityStatus={activity.status}
                    isLoggedIn={isAuthenticated}
                    hasVoted={hasVoted}
                    votedPhotoId={userVotedPhotoId ?? undefined}
                    voteCount={photo.vote_count}
                    onVote={handleVoteClick}
                    onGuestClick={() => setShowGuestModal(true)}
                  />
                </Card.Body>
              </Card>
            </Col>
          );
        })}
      </Row>

      <Modal
        show={pendingVotePhotoId !== null}
        onHide={() => !voteLoading && setPendingVotePhotoId(null)}
        centered
      >
        <Modal.Header closeButton={!voteLoading}>
          <Modal.Title className="fw-bold">🗳️ ยืนยันการโหวต</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center py-3">
          <p className="fs-5 mb-1">ต้องการโหวตให้รูปภาพนี้ใช่หรือไม่?</p>
          <small className="text-muted">คุณสามารถโหวตได้ 1 ครั้งต่อกิจกรรมเท่านั้น</small>
        </Modal.Body>
        <Modal.Footer className="justify-content-center gap-2">
          <Button
            variant="secondary"
            disabled={voteLoading}
            onClick={() => setPendingVotePhotoId(null)}
          >
            ยกเลิก
          </Button>
          <Button variant="primary" className="fw-bold" onClick={confirmVote} disabled={voteLoading}>
            {voteLoading ? <><Spinner size="sm" className="me-1" />กำลังโหวต...</> : 'ยืนยันโหวต'}
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal
        show={voteResultMsg.show}
        onHide={() => setVoteResultMsg((p) => ({ ...p, show: false }))}
        centered
      >
        <Modal.Header
          closeButton
          className={voteResultMsg.success ? 'bg-success text-white' : 'bg-danger text-white'}
        >
          <Modal.Title className="fw-bold">
            {voteResultMsg.success ? '✅ สำเร็จ' : '❌ เกิดข้อผิดพลาด'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center py-3 fs-5">{voteResultMsg.msg}</Modal.Body>
        <Modal.Footer className="justify-content-center">
          <Button
            variant={voteResultMsg.success ? 'success' : 'danger'}
            onClick={() => setVoteResultMsg((p) => ({ ...p, show: false }))}
          >
            ตกลง
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showGuestModal} onHide={() => setShowGuestModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold">🔒 ต้องเข้าสู่ระบบก่อนโหวต</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center py-4">
          <p className="fs-5 mb-1">กรุณาเข้าสู่ระบบหรือสมัครสมาชิกก่อน</p>
          <p className="text-muted small">เพื่อร่วมโหวตในกิจกรรมนี้</p>
        </Modal.Body>
        <Modal.Footer className="justify-content-center gap-2">
          <Link to="/login"    className="btn btn-primary fw-bold px-4"  onClick={() => setShowGuestModal(false)}>
            เข้าสู่ระบบ
          </Link>
          <Link to="/register" className="btn btn-outline-primary px-4" onClick={() => setShowGuestModal(false)}>
            สมัครสมาชิก
          </Link>
        </Modal.Footer>
      </Modal>

      <Modal
        show={deletePhotoTarget !== null}
        onHide={() => !deletePhotoLoading && setDeletePhotoTarget(null)}
        centered
      >
        <Modal.Header closeButton={!deletePhotoLoading} className="bg-danger text-white">
          <Modal.Title className="fw-bold">🗑️ ลบรูปออกจากกิจกรรม</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center py-3">
          <p className="fs-5 mb-1">ต้องการลบรูปภาพนี้ออกจากกิจกรรมใช่หรือไม่?</p>
          <small className="text-muted">รูปต้นฉบับในแกลเลอรี่จะยังคงอยู่</small>
        </Modal.Body>
        <Modal.Footer className="justify-content-center gap-2">
          <Button
            variant="secondary"
            disabled={deletePhotoLoading}
            onClick={() => setDeletePhotoTarget(null)}
          >
            ยกเลิก
          </Button>
          <Button variant="danger" className="fw-bold" onClick={confirmDeletePhoto} disabled={deletePhotoLoading}>
            {deletePhotoLoading
              ? <><Spinner size="sm" className="me-1" />กำลังลบ...</>
              : 'ยืนยันลบ'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};