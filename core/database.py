# ==========================================
# 📄 core/database.py
# 역할: SQLite 데이터베이스 연결 및 세션 관리
# ==========================================

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# SQLite 데이터베이스 파일 경로 (프로젝트 폴더 내 blueanchor.db 로 자동 생성됨)
SQLALCHEMY_DATABASE_URL = "sqlite:///./blueanchor.db"

# SQLite는 기본적으로 다중 스레드 접근을 막기 때문에, FastAPI에서 쓰기 위해 옵션 해제
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)

# 데이터베이스와 통신할 세션(Session) 클래스 생성
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 모든 DB 모델(테이블)이 상속받을 뼈대 클래스
Base = declarative_base()

# DB 세션 의존성 주입용 함수 (API 호출 시마다 DB를 열고 닫아줌)
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()