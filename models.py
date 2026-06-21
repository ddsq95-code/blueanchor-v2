# ==========================================
# 📄 models.py
# 역할: 데이터베이스의 '선사(Boat)' 및 '회원(User)' 테이블 구조 정의
# ==========================================

from sqlalchemy import Column, Integer, String, Float, Boolean
from core.database import Base
# 💡 신규: 외래키 및 날짜 처리를 위한 모듈 임포트
from sqlalchemy import ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime

# 기존 선사 테이블
class Boat(Base):
    __tablename__ = "boats"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    region = Column(String, nullable=False)
    port = Column(String, nullable=False)
    tonnage = Column(String)
    max_guests = Column(Integer)
    price = Column(Integer)
    description = Column(String)
    image_url = Column(String)
    rating = Column(Float, default=0.0)
    review_count = Column(Integer, default=0)
    tags = Column(String)
    is_closing_soon = Column(Boolean, default=False)

# 💡 신규: 회원(User) 테이블 추가
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    name = Column(String, nullable=False)
    phone = Column(String)
    token = Column(String, index=True) # 로그인 유지를 위한 인증 토큰

# 💡 신규: 예약(Reservation) 테이블 추가
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

    # 연결된 유저와 선사 정보를 쉽게 가져오기 위한 관계 설정
    user = relationship("User")
    boat = relationship("Boat")