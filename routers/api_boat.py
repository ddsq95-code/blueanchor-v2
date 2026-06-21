# ==========================================
# 📄 routers/api_boat.py
# 역할: 프론트엔드와 DB를 연결해주는 선사 데이터 전송 API
# ==========================================

from fastapi import APIRouter, Query, Depends
from sqlalchemy.orm import Session
import asyncio
from datetime import datetime

from routers.api_weather import get_weather_hourly, get_mid_term_weather
from routers.api_marine import get_realtime_marine

# 💡 DB 관련 모듈 임포트
from core.database import get_db, engine, Base
from models import Boat

router = APIRouter()

# ==========================================
# 💡 1. DB 초기화 및 더미 데이터 삽입 API (최초 1회 호출용)
# ==========================================
# 💡 브라우저 주소창에서 바로 실행할 수 있도록 POST를 GET으로 수정했습니다!
@router.get("/init-db")
def init_db(db: Session = Depends(get_db)):
    # models.py에 정의된 테이블 생성 (이미 있으면 무시됨)
    Base.metadata.create_all(bind=engine)
    
    # 이미 데이터가 있으면 스킵
    if db.query(Boat).count() > 0:
        return {"msg": "이미 선사 데이터가 DB에 존재합니다."}
        
    # HTML에 흩어져 있던 8개 선사 데이터를 DB로 깔끔하게 이전
    mock_boats = [
        {
            "name": "블루오션호", "region": "충남 보령시", "port": "오천항",
            "tonnage": "9.77t", "max_guests": 22, "price": 150000,
            "description": "서해안 최고의 포인트만 공략하는 베테랑 선장님! 초보자도 쉽게 낚시를 즐길 수 있도록 1:1 맞춤 지도를 해드립니다.",
            "image_url": "https://images.unsplash.com/photo-1544329621-e00eb2c300ea?auto=format&fit=crop&q=80&w=800",
            "rating": 4.9, "review_count": 128, "tags": "참돔 타이라바,광어 다운샷", "is_closing_soon": True
        },
        {
            "name": "에이스마스터호", "region": "인천 중구", "port": "남항부두",
            "tonnage": "7.31t", "max_guests": 18, "price": 100000,
            "description": "수도권에서 가장 접근성이 좋은 인천 남항 출항. 쾌적한 실내 공간과 최신식 어군 탐지기를 보유하고 있습니다.",
            "image_url": "https://images.unsplash.com/photo-1533261968817-063a8a3854eb?auto=format&fit=crop&q=80&w=800",
            "rating": 4.7, "review_count": 85, "tags": "우럭 외연낚시,광어 다운샷", "is_closing_soon": False
        },
        {
            "name": "레전드피싱호", "region": "전북 군산시", "port": "비응항",
            "tonnage": "9.77t", "max_guests": 20, "price": 140000,
            "description": "참돔 타이라바 전문! 매 시즌 짜릿한 손맛을 보장합니다. 깨끗한 화장실과 휴게실 완비.",
            "image_url": "https://images.unsplash.com/photo-1517409205562-b13c32d4cb05?auto=format&fit=crop&q=80&w=800",
            "rating": 5.0, "review_count": 214, "tags": "쭈꾸미 생미끼,갑오징어", "is_closing_soon": True
        },
        {
            "name": "블루스카이호", "region": "전남 여수시", "port": "국동항",
            "tonnage": "5.00t", "max_guests": 12, "price": 180000,
            "description": "여수 앞바다 갈치 지깅 전문! 쿨러 가득 채워가세요.",
            "image_url": "https://images.unsplash.com/photo-1596401057633-54a8fe8ef647?auto=format&fit=crop&q=80&w=800",
            "rating": 4.8, "review_count": 155, "tags": "갈치 지깅,한치 한가득", "is_closing_soon": False
        },
        {
            "name": "강릉 포세이돈", "region": "강원 강릉시", "port": "강릉항",
            "tonnage": "7.93t", "max_guests": 16, "price": 80000,
            "description": "동해바다 대구, 가자미, 문어 낚시 전문 선사입니다. 넓은 선상 공간으로 편안한 낚시가 가능합니다.",
            "image_url": "https://images.unsplash.com/photo-1551024739-78e9d60c45cb?auto=format&fit=crop&q=80&w=800",
            "rating": 4.6, "review_count": 52, "tags": "대구 지깅,가자미", "is_closing_soon": False
        },
        {
            "name": "통영 몬스터호", "region": "경남 통영시", "port": "통영항",
            "tonnage": "9.77t", "max_guests": 20, "price": 120000,
            "description": "남해안 몬스터 무늬오징어를 찾아서! 야간 출항 전문. 짜릿한 손맛을 원하신다면 몬스터호와 함께하세요.",
            "image_url": "https://images.unsplash.com/photo-1506452843477-80be406322b7?auto=format&fit=crop&q=80&w=800",
            "rating": 4.9, "review_count": 210, "tags": "무늬오징어 팁런,한치 야간", "is_closing_soon": False
        },
        {
            "name": "제주 드림호", "region": "제주 서귀포시", "port": "성산항",
            "tonnage": "9.77t", "max_guests": 18, "price": 160000,
            "description": "한치 야간 낚시와 무늬오징어 팁런 전문! 초보자도 쉽게 낚시를 즐길 수 있도록 지도해 드립니다.",
            "image_url": "https://images.unsplash.com/photo-1544329621-e00eb2c300ea?auto=format&fit=crop&q=80&w=800",
            "rating": 4.7, "review_count": 98, "tags": "참돔 타이라바,방어 지깅", "is_closing_soon": True
        },
        {
            "name": "완도 빅히트호", "region": "전남 완도군", "port": "완도항",
            "tonnage": "9.77t", "max_guests": 22, "price": 110000,
            "description": "소수 정예 독배 전문. 쾌적한 낚시 환경을 제공하며 전투 낚시를 즐기시는 분들께 적극 추천합니다.",
            "image_url": "https://images.unsplash.com/photo-1596401057633-54a8fe8ef647?auto=format&fit=crop&q=80&w=800",
            "rating": 5.0, "review_count": 320, "tags": "대광어 다운샷,문어", "is_closing_soon": False
        }
    ]
    
    for b in mock_boats:
        db.add(Boat(**b))
    
    db.commit()
    return {"msg": "초기 선사 데이터 8건이 DB에 성공적으로 저장되었습니다!"}

# ==========================================
# 💡 2. DB에서 전체 선사 목록 조회 API
# ==========================================
@router.get("/list")
def get_boat_list(db: Session = Depends(get_db)):
    boats = db.query(Boat).all()
    return boats

# ==========================================
# 💡 3. DB에서 특정 선사 상세 정보 조회 API
# ==========================================
@router.get("/detail/{boat_id}")
def get_boat_detail(boat_id: int, db: Session = Depends(get_db)):
    boat = db.query(Boat).filter(Boat.id == boat_id).first()
    return boat

# ==========================================
# 기존: 주간 해양 데이터 조합 API (그대로 유지)
# ==========================================
@router.get("/weekly-ocean")
async def get_weekly_ocean(region: str = Query('보령'), obs_code: str = Query('DT_0025')):
    today_str = datetime.now().strftime('%Y%m%d')
    realtime_task = get_realtime_marine(obs_code, today_str)        
    hourly_task = get_weather_hourly(region)           
    mid_term_task = get_mid_term_weather(region)
    
    results = await asyncio.gather(realtime_task, hourly_task, mid_term_task, return_exceptions=True)
    return {
        "realtime": results[0] if not isinstance(results[0], Exception) else {},
        "hourly": results[1] if not isinstance(results[1], Exception) else [],
        "mid_term": results[2] if not isinstance(results[2], Exception) else {}
    }