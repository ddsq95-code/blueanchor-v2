# ==========================================
# 📄 routers/api_auth.py (새로 만들기)
# 역할: 회원가입, 로그인, 로그아웃 등 사용자 인증 처리
# ==========================================

import hashlib
import secrets
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from core.database import get_db, engine
from models import Base, User

router = APIRouter()

# 💡 모듈 로드 시 누락된 테이블(users) 자동 생성 (DB 초기화 없이 안전하게 테이블만 추가됨)
Base.metadata.create_all(bind=engine)

# 비밀번호 암호화 함수 (보안)
def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

# 클라이언트에서 받을 데이터 규격
class SignupRequest(BaseModel):
    email: str
    password: str
    name: str
    phone: str

class LoginRequest(BaseModel):
    email: str
    password: str

@router.post("/signup")
def signup(req: SignupRequest, db: Session = Depends(get_db)):
    # 이메일 중복 검사
    if db.query(User).filter(User.email == req.email).first():
        raise HTTPException(status_code=400, detail="이미 가입된 이메일입니다.")
    
    # 새 유저 DB 저장
    new_user = User(
        email=req.email,
        password_hash=hash_password(req.password),
        name=req.name,
        phone=req.phone
    )
    db.add(new_user)
    db.commit()
    return {"msg": "회원가입이 완료되었습니다!"}

@router.post("/login")
def login(req: LoginRequest, db: Session = Depends(get_db)):
    # 이메일과 암호화된 비밀번호 일치 확인
    user = db.query(User).filter(
        User.email == req.email, 
        User.password_hash == hash_password(req.password)
    ).first()
    
    if not user:
        raise HTTPException(status_code=401, detail="이메일 또는 비밀번호가 틀렸습니다.")
    
    # 로그인 성공 시 32자리 무작위 토큰 발급
    token = secrets.token_hex(32)
    user.token = token
    db.commit()
    
    return {"token": token, "name": user.name, "email": user.email}