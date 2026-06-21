# ==========================================
# 📄 routers/api_reservation.py
# 역할: 결제(예약) 처리 및 마이페이지/선장님 대시보드 조회
# ==========================================

from fastapi import APIRouter, Depends, HTTPException, Header
from pydantic import BaseModel
from sqlalchemy.orm import Session
from core.database import get_db, engine
from models import Base, User, Boat, Reservation

router = APIRouter()
Base.metadata.create_all(bind=engine)

class ReserveRequest(BaseModel):
    boat_id: int
    reserve_date: str
    guests: int
    total_price: int

def get_current_user(authorization: str = Header(None), db: Session = Depends(get_db)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="로그인이 필요합니다.")
    
    token = authorization.split(" ")[1]
    user = db.query(User).filter(User.token == token).first()
    if not user:
        raise HTTPException(status_code=401, detail="유효하지 않은 로그인입니다.")
    return user

# 1. 새로운 예약 생성
@router.post("/")
def create_reservation(req: ReserveRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    boat = db.query(Boat).filter(Boat.id == req.boat_id).first()
    if not boat:
        raise HTTPException(status_code=404, detail="선사를 찾을 수 없습니다.")
    
    # 잔여 좌석 확인 및 차감
    if boat.available_seats < req.guests:
        raise HTTPException(status_code=400, detail=f"잔여 좌석이 부족합니다. (남은 좌석: {boat.available_seats}석)")
    boat.available_seats -= req.guests
    
    new_res = Reservation(
        user_id=user.id, boat_id=boat.id, reserve_date=req.reserve_date,
        guests=req.guests, total_price=req.total_price
    )
    db.add(new_res)
    db.commit()
    return {"msg": "예약이 완료되었습니다.", "reservation_id": new_res.id}

# 2. 내 예약 내역 불러오기 (손님 마이페이지용)
@router.get("/my")
def get_my_reservations(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    reservations = db.query(Reservation).filter(Reservation.user_id == user.id).order_by(Reservation.created_at.desc()).all()
    result = []
    for r in reservations:
        result.append({
            "id": r.id, "boat_name": r.boat.name, "boat_image": r.boat.image_url,
            "boat_region": r.boat.region, "reserve_date": r.reserve_date,
            "guests": r.guests, "total_price": r.total_price, "status": r.status,
            "created_at": r.created_at.strftime("%Y-%m-%d %H:%M")
        })
    return result

# 💡 3. 신규: 전체 예약 내역 불러오기 (선장님 대시보드용)
@router.get("/admin/all")
def get_all_reservations(db: Session = Depends(get_db)):
    reservations = db.query(Reservation).order_by(Reservation.created_at.desc()).all()
    result = []
    for r in reservations:
        result.append({
            "id": r.id,
            "user_name": r.user.name if r.user else "알 수 없음",
            "user_phone": r.user.phone if r.user else "연락처 없음",
            "boat_name": r.boat.name,
            "reserve_date": r.reserve_date,
            "guests": r.guests,
            "total_price": r.total_price,
            "status": r.status,
            "created_at": r.created_at.strftime("%Y-%m-%d %H:%M")
        })
    return result