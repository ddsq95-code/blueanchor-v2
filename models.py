# ==========================================
# 📄 models.py
# 역할: DB 테이블 구조 정의 (선사, 유저, 예약, 찜하기)
# ==========================================

from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from core.database import Base
from datetime import datetime

# 1. 낚싯배 정보
class Boat(Base):
    __tablename__ = "boats"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    region = Column(String, index=True)
    port = Column(String)
    tonnage = Column(String)
    max_guests = Column(Integer)
    price = Column(Integer)
    image_url = Column(String)
    review_count = Column(Integer, default=0)
    rating = Column(Float, default=0.0)
    tags = Column(String)
    is_closing_soon = Column(Boolean, default=False)
    available_seats = Column(Integer, default=0) # 실시간 잔여석
    description = Column(String) # 💡 에러 원인: 이 컬럼이 누락되어 있었습니다!

# 2. 회원 정보
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    name = Column(String, nullable=False)
    phone = Column(String)
    token = Column(String, index=True)

# 3. 예약 정보
class Reservation(Base):
    __tablename__ = "reservations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    boat_id = Column(Integer, ForeignKey("boats.id"))
    reserve_date = Column(String, nullable=False)
    guests = Column(Integer, nullable=False)
    total_price = Column(Integer, nullable=False)
    status = Column(String, default="예약완료")
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User")
    boat = relationship("Boat")

# 4. 찜하기 정보
class Wishlist(Base):
    __tablename__ = "wishlists"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    boat_id = Column(Integer, ForeignKey("boats.id"))
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User")
    boat = relationship("Boat")