# ==========================================
# 📄 models.py
# 역할: 데이터베이스의 '선사(Boat)' 및 '회원(User)' 테이블 구조 정의
# ==========================================

from sqlalchemy import Column, Integer, String, Float, Boolean
from core.database import Base

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