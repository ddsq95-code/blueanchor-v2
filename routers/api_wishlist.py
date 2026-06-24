# ==========================================
# 📄 routers/api_wishlist.py
# 역할: 선사 찜하기(좋아요) 토글 및 유저별 찜 목록 조회
# ==========================================

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from core.database import get_db, engine
from models import Base, User, Boat, Wishlist
from routers.api_reservation import get_current_user  # 기존 로그인 확인 함수 재사용
from pydantic import BaseModel

router = APIRouter()
Base.metadata.create_all(bind=engine)

class WishlistRequest(BaseModel):
    boat_id: int

# 1. 찜하기 토글 (추가/취소)
@router.post("/toggle")
def toggle_wishlist(req: WishlistRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    boat = db.query(Boat).filter(Boat.id == req.boat_id).first()
    if not boat:
        raise HTTPException(status_code=404, detail="선사를 찾을 수 없습니다.")
    
    # 이미 찜했는지 확인
    existing_wish = db.query(Wishlist).filter(Wishlist.user_id == user.id, Wishlist.boat_id == boat.id).first()
    
    if existing_wish:
        # 이미 찜한 상태면 삭제 (하트 끄기)
        db.delete(existing_wish)
        db.commit()
        return {"msg": "찜하기가 취소되었습니다.", "is_wished": False}
    else:
        # 찜한 상태가 아니면 추가 (하트 켜기)
        new_wish = Wishlist(user_id=user.id, boat_id=boat.id)
        db.add(new_wish)
        db.commit()
        return {"msg": "찜 목록에 추가되었습니다.", "is_wished": True}

# 2. 내 찜 목록 불러오기 (마이페이지용)
@router.get("/my")
def get_my_wishlist(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    wishlists = db.query(Wishlist).filter(Wishlist.user_id == user.id).order_by(Wishlist.created_at.desc()).all()
    
    result = []
    for w in wishlists:
        result.append({
            "id": w.boat.id,
            "name": w.boat.name,
            "region": w.boat.region,
            "port": w.boat.port,
            "tonnage": w.boat.tonnage,
            "max_guests": w.boat.max_guests,
            "price": w.boat.price,
            "image_url": w.boat.image_url,
            "rating": w.boat.rating,
            "review_count": w.boat.review_count,
            "tags": w.boat.tags
        })
    return result