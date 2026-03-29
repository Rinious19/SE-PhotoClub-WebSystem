//? Page: Photo List Page (Gallery — Folder View)
//@ แสดงอีเว้นท์เป็น Folder แต่ละอันมี preview 3 รูป
//  ✅ Lazy Load folders เมื่อ scroll ถึงด้านล่าง
//  ✅ ค้นหาด้วยชื่อ Event และวันที่
//  ✅ แยก folder ตาม (event_name + faculty + academic_year)

interface PreviewItem {
  id:            number;
  image_url:     string;
  thumbnail_url: string | null;
}

interface FolderItem {
  event_id:      number;
  event_name:    string;
  event_date:    string | null;
  photo_count:   number;
  faculty:       string | null;
  academic_year: string | null;
  previews:      PreviewItem[];
}

import React, {
  useEffect,
  useState,
  useRef,
  useMemo,
  useCallback,
} from "react";
import {
  Container,
  Row,
  Col,
  Spinner,
  Alert,
  Form,
  InputGroup,
  Button,
} from "react-bootstrap";
import { useNavigate, Link } from "react-router-dom";
import { PhotoService } from "../../services/PhotoService";
import { useAuth } from "@/hooks/useAuth";
import {
  DateRangeFilter,
  emptyDateFilter,
  matchesDateFilter,
} from "@/components/common/DateRangeFilter";
import type { DateFilter } from "@/components/common/DateRangeFilter";
import { parseApiError } from "@/utils/apiError";

// ✅ แปลง image_url เป็น src URL โดยตรง
const BASE_URL = "http://localhost:5000";
const getImageUrl = (imageUrl: string | null | undefined): string => {
  if (!imageUrl) return '';
  if (typeof imageUrl === 'string') {
    return imageUrl.startsWith('http') ? imageUrl : `${BASE_URL}${imageUrl}`;
  }
  return '';
};

// FolderCard component
const FolderCard: React.FC<{ folder: FolderItem; onClick: () => void }> = ({
  folder,
  onClick,
}) => {
  const previews = folder.previews || [];

  return (
    <div
      onClick={onClick}
      style={{
        cursor: "pointer",
        transition: "transform .18s ease-in-out",
        height: "100%",
        position: "relative",
        paddingTop: "10px", 
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(-6px)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = "";
      }}
    >
      {/* 📸 Stack ของรูปภาพ */}
      <div
        style={{
          position: "relative",
          height: 180, 
          width: "100%",
          marginBottom: 12,
        }}
      >
        {/* รูปที่ 3 (อยู่ล่างสุด - เอียงซ้าย) */}
        {previews.length >= 3 && (
          <img
            src={getImageUrl(previews[2].thumbnail_url || previews[2].image_url)}
            alt=""
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              borderRadius: 14,
              transform: "rotate(-6deg) translateY(4px) translateX(-4px)",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              opacity: 0.6,
              border: "2px solid #fff",
            }}
          />
        )}

        {/* รูปที่ 2 (ชั้นกลาง - เอียงขวา) */}
        {previews.length >= 2 && (
          <img
            src={getImageUrl(previews[1].thumbnail_url || previews[1].image_url)}
            alt=""
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              borderRadius: 14,
              transform: "rotate(4deg) translateY(2px) translateX(2px)",
              boxShadow: "0 4px 15px rgba(0,0,0,0.15)",
              opacity: 0.8,
              border: "2px solid #fff",
              zIndex: 2,
            }}
          />
        )}

        {/* รูปที่ 1 (ชั้นบนสุด - หน้าตรง) */}
        {previews.length >= 1 ? (
          <img
            src={getImageUrl(previews[0].thumbnail_url || previews[0].image_url)}
            alt=""
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              borderRadius: 14,
              boxShadow: "0 8px 20px rgba(0,0,0,0.2)",
              zIndex: 3,
              border: "2px solid #fff",
            }}
          />
        ) : (
          /* กรณีไม่มีรูปเลย */
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "#f1f3f5",
              borderRadius: 14,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 40,
              border: "2px dashed #dee2e6",
            }}
          >
            📁
          </div>
        )}

        {/* Badge แสดงจำนวนรูป (ปรับให้ใหญ่ขึ้น) */}
        <div
          style={{
            position: "absolute",
            bottom: 12,
            right: 12,
            background: "rgba(0,0,0,0.75)",
            backdropFilter: "blur(4px)",
            color: "#fff",
            borderRadius: 20,
            padding: "4px 14px", // ขยาย padding
            fontSize: 13, // เพิ่มขนาดตัวอักษร
            fontWeight: 700,
            zIndex: 10,
          }}
        >
          {folder.photo_count} รูป
        </div>
      </div>

      {/* 🏷️ ข้อมูลอีเว้นท์ */}
      <div style={{ textAlign: "center", padding: "0 4px", marginTop: "8px" }}>
        <div
          style={{
            fontWeight: 700,
            fontSize: 16, // เพิ่มขนาดตัวอักษรชื่ออีเว้นท์
            color: "#2d3436",
            lineHeight: 1.4,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {folder.event_name}
        </div>
        
        {/* ✅ ปรับปรุง: กรอบพื้นหลังสำหรับคณะและปีการศึกษา (Badge Style) */}
        {(folder.faculty || folder.academic_year) && (
          <div className="d-flex flex-wrap justify-content-center gap-2 mt-2 pt-1">
            {folder.faculty && (
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  backgroundColor: "#e0f2fe", // สีฟ้าอ่อน
                  color: "#0284c7", // สีน้ำเงินเข้ม
                  padding: "4px 10px",
                  borderRadius: "12px",
                  border: "1px solid #bae6fd",
                  whiteSpace: "nowrap"
                }}
              >
                🏛 {folder.faculty}
              </span>
            )}
            
            {folder.academic_year && (
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  backgroundColor: "#f1f5f9", // สีเทาอ่อน
                  color: "#475569", // สีเทาเข้ม
                  padding: "4px 10px",
                  borderRadius: "12px",
                  border: "1px solid #e2e8f0",
                  whiteSpace: "nowrap"
                }}
              >
                📚 ปี {folder.academic_year}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Main Page ───────────────────────────────────────────────
export const PhotoListPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const canUpload = user?.role === "ADMIN" || user?.role === "CLUB_PRESIDENT";

  const [folders, setFolders] = useState<FolderItem[]>([]);
  const pageRef = useRef(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalFolders, setTotalFolders] = useState(0);

  // Search
  const [searchName, setSearchName] = useState("");
  const [dateFilter, setDateFilter] = useState<DateFilter>(emptyDateFilter());
  const [filterFaculty, setFilterFaculty] = useState("");
  const [filterYear, setFilterYear] = useState("");

  // Sentinel ref สำหรับ IntersectionObserver
  const sentinelRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);
  const yearSelectRef = useRef<HTMLSelectElement>(null);

  const YEARS = useMemo(() => ["2568", "2567"], []);

  // Mouse wheel บน year dropdown
  useEffect(() => {
    const el = yearSelectRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      e.preventDefault();
      const opts = ["", ...YEARS];
      const idx = opts.indexOf(filterYear);
      if (e.deltaY > 0 && idx < opts.length - 1) setFilterYear(opts[idx + 1]);
      else if (e.deltaY < 0 && idx > 0) setFilterYear(opts[idx - 1]);
    };
    el.addEventListener("wheel", handler, { passive: false });
    return () => el.removeEventListener("wheel", handler);
  }, [filterYear,YEARS]);

  const fetchPage = useCallback(async (pageNum: number) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    try {
      const res = await PhotoService.getGrouped(pageNum);
      if (res.success) {
        setFolders((prev) =>
          pageNum === 1 ? res.data : [...prev, ...res.data],
        );
        setHasMore(res.pagination.hasMore);
        setTotalFolders(res.pagination.total);
      }
    } catch (err: unknown) {
      setError(
        parseApiError(
          err,
          "โหลดข้อมูลแกลเลอรี่ไม่สำเร็จ โปรดตรวจสอบการเชื่อมต่อ Database",
        ),
      );
    } finally {
      loadingRef.current = false;
      setLoadingMore(false);
      setInitialLoading(false);
    }
  }, []);

  // Load แรก
  useEffect(() => {
    fetchPage(1);
  }, [fetchPage]);

  // IntersectionObserver
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingRef.current) {
          setLoadingMore(true);
          pageRef.current += 1;
          fetchPage(pageRef.current);
        }
      },
      { threshold: 0.1 },
    );
    const el = sentinelRef.current;
    if (el) observer.observe(el);
    return () => {
      if (el) observer.unobserve(el);
    };
  }, [hasMore, fetchPage]);

  // Filter ฝั่ง client
  const filteredFolders = useMemo(() => {
    return folders.filter((f) => {
      const nameMatch = f.event_name
        .toLowerCase()
        .includes(searchName.toLowerCase());
      const dateMatch = matchesDateFilter(f.event_date || "", dateFilter);
      const facultyMatch =
        !filterFaculty || (f.faculty || "") === filterFaculty;
      const yearMatch = !filterYear || (f.academic_year || "") === filterYear;
      return nameMatch && dateMatch && facultyMatch && yearMatch;
    });
  }, [folders, searchName, dateFilter, filterFaculty, filterYear]);

  const hasFilter =
    searchName !== "" ||
    dateFilter.from !== "" ||
    dateFilter.to !== "" ||
    filterFaculty !== "" ||
    filterYear !== "";
  
  const clearAll = () => {
    setSearchName("");
    setDateFilter(emptyDateFilter());
    setFilterFaculty("");
    setFilterYear("");
  };

  const handleFolderClick = (folder: FolderItem) => {
    const params = new URLSearchParams();
    if (folder.faculty) params.append("faculty", folder.faculty);
    if (folder.academic_year) params.append("year", folder.academic_year);
    
    const queryString = params.toString() ? `?${params.toString()}` : '';
    navigate(`/photos/event/${folder.event_id}${queryString}`);
  };

  return (
    <Container className="py-5">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-0">
            แกลเลอรี่
            {!initialLoading && (
              <span className="text-secondary fs-4 fw-normal ms-2"> {/* ปรับ fs-4 ให้ใหญ่ขึ้น */}
                ({hasFilter ? `${filteredFolders.length} / ` : ""}
                {totalFolders} อีเว้นท์)
              </span>
            )}
          </h2>
        </div>
        {canUpload && (
          <Link
            to="/photos/upload"
            className="btn btn-success px-4 py-2 fw-bold shadow-sm rounded-pill fs-6"
          >
            + อัปโหลดรูปภาพ
          </Link>
        )}
      </div>

      {/* Search + Filter */}
      {!initialLoading && !error && folders.length > 0 && (
        <div className="bg-light rounded-4 p-4 mb-4"> {/* ขยาย padding */}
          <Row className="g-3 align-items-end">
            <Col md={4}>
              <Form.Label className="fw-medium text-secondary mb-2 fs-6">
                ชื่ออีเว้นท์
              </Form.Label>
              <InputGroup>
                <InputGroup.Text className="bg-white border-end-0">
                  🔍
                </InputGroup.Text>
                <Form.Control
                  className="border-start-0 py-2" // เพิ่มความสูง
                  placeholder="ค้นหาตามชื่ออีเว้นท์..."
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
            <Col md={3}>
              <Form.Label className="fw-medium text-secondary mb-2 fs-6">
                กรองตามวันที่จัดอีเว้นท์
              </Form.Label>
              <DateRangeFilter value={dateFilter} onChange={setDateFilter} />
            </Col>
            <Col md={3}>
              <Form.Label className="fw-medium text-secondary mb-2 fs-6">
                สังกัด / ปีการศึกษา
              </Form.Label>
              <Row className="g-2">
                <Col xs={7}>
                  <Form.Select
                    className="py-2" // เพิ่มความสูง (ลบ size="sm")
                    value={filterFaculty}
                    onChange={(e) => setFilterFaculty(e.target.value)}
                  >
                    <option value="">-- ไม่ระบุ --</option>
                    <option>มหาวิทยาลัย</option>
                    <option>คณะวิศวกรรมศาสตร์</option>
                    <option>คณะครุศาสตร์อุตสาหกรรม</option>
                    <option>คณะวิทยาศาสตร์ประยุกต์</option>
                    <option>คณะเทคโนโลยีสารสนเทศและนวัตกรรมดิจิทัล</option>
                    <option>คณะศิลปศาสตร์ประยุกต์</option>
                    <option>คณะสถาปัตยกรรมและการออกแบบ</option>
                    <option>คณะพัฒนาธุรกิจและอุตสาหกรรม</option>
                    <option>วิทยาลัยเทคโนโลยีอุตสาหกรรม</option>
                    <option>วิทยาลัยนานาชาติ</option>
                  </Form.Select>
                </Col>
                <Col xs={5}>
                  <Form.Select
                    className="py-2"
                    ref={yearSelectRef}
                    value={filterYear}
                    onChange={(e) => setFilterYear(e.target.value)}
                  >
                    <option value="">-- ไม่ระบุ --</option>
                    {YEARS.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </Form.Select>
                </Col>
              </Row>
            </Col>
            <Col md={2} className="d-flex flex-column justify-content-end">
              <Button
                variant="outline-danger"
                className="w-100 py-2 fw-medium"
                onClick={clearAll}
                disabled={!hasFilter}
              >
                ล้างทั้งหมด
              </Button>
            </Col>
          </Row>
          {hasFilter && (
            <div className="mt-3 pt-3 border-top">
              <span className="text-muted fs-6">
                พบ{" "}
                <strong className="text-primary fs-5">
                  {filteredFolders.length}
                </strong>{" "}
                อีเว้นท์
              </span>
            </div>
          )}
        </div>
      )}

      {/* Initial loading */}
      {initialLoading && (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3 text-muted fs-5">กำลังโหลด...</p>
        </div>
      )}

      {error && <Alert variant="danger" className="fs-5">{error}</Alert>}

      {/* Empty state */}
      {!initialLoading && !error && folders.length === 0 && (
        <div className="text-center py-5 text-muted">
          <p className="display-1">📭</p>
          <h4 className="fw-medium">ยังไม่มีรูปภาพในระบบ</h4>
        </div>
      )}

      {/* No search result */}
      {!initialLoading &&
        !error &&
        folders.length > 0 &&
        filteredFolders.length === 0 && (
          <div className="text-center py-5 text-muted">
            <p className="display-1">🔍</p>
            <h4 className="fw-medium mb-4">ไม่พบอีเว้นท์ที่ตรงกับการค้นหา</h4>
            <Button variant="outline-primary" className="px-4 py-2" onClick={clearAll}>
              ล้างการค้นหา
            </Button>
          </div>
        )}

      {/* Folder Grid */}
      {filteredFolders.length > 0 && (
        <Row xs={2} sm={3} md={4} lg={4} className="g-4">
          {filteredFolders.map((folder, i) => (
            <Col
              key={`folder-${folder.event_id}-${folder.faculty || 'all'}-${folder.academic_year || 'all'}-${i}`}
            >
              <FolderCard
                folder={folder}
                onClick={() => handleFolderClick(folder)}
              />
            </Col>
          ))}
        </Row>
      )}

      {/* Sentinel div */}
      <div ref={sentinelRef} style={{ height: 40, marginTop: 32 }} />

      {loadingMore && (
        <div className="text-center py-4">
          <Spinner animation="border" variant="secondary" />
          <span className="ms-3 text-muted fs-5">กำลังโหลดเพิ่มเติม...</span>
        </div>
      )}

      {!hasMore && folders.length > 0 && !hasFilter && (
        <p className="text-center text-muted fs-6 mt-3">
          แสดงทั้งหมด {totalFolders} อีเว้นท์
        </p>
      )}
    </Container>
  );
};