# ==========================================
# 📄 routers/api_boat.py
# ==========================================
from fastapi import APIRouter, Query
from typing import Optional

router = APIRouter()

# 가상의 선사(Boat) 데이터베이스
MOCK_BOATS = [
    {
        "id": "boat_001", "name": "블루오션호", "region": "보령", "port": "오천항",
        "tons": "9.77t", "max_capacity": 22, "current_booking": 19, "price": 150000,
        "rating": 4.9, "review_count": 128, "species": ["참돔 타이라바", "광어 다운샷"],
        "image": "https://images.unsplash.com/photo-1569263979104-865ab7cd8d13?q=80&w=400&auto=format&fit=crop",
        "status": "마감임박"
    },
    {
        "id": "boat_002", "name": "에이스마스터호", "region": "인천", "port": "남항부두",
        "tons": "7.31t", "max_capacity": 18, "current_booking": 10, "price": 100000,
        "rating": 4.7, "review_count": 85, "species": ["우럭 외줄낚시", "광어 다운샷"],
        "image": "https://images.unsplash.com/photo-1544551763-46a013bb70d5?q=80&w=400&auto=format&fit=crop",
        "status": "예약가능"
    },
    {
        "id": "boat_003", "name": "레전드피싱호", "region": "군산", "port": "비응항",
        "tons": "9.77t", "max_capacity": 20, "current_booking": 19, "price": 140000,
        "rating": 5.0, "review_count": 214, "species": ["쭈꾸미 생미끼", "갑오징어"],
        "image": "https://images.unsplash.com/photo-1559136555-9303baea8ebd?q=80&w=400&auto=format&fit=crop",
        "status": "마감임박"
    },
    {
        "id": "boat_004", "name": "블루스카이호", "region": "여수", "port": "국동항",
        "tons": "5.00t", "max_capacity": 12, "current_booking": 7, "price": 180000,
        "rating": 4.8, "review_count": 156, "species": ["갈치 지깅", "한치 한가득"],
        "image": "https://images.unsplash.com/photo-1614649024145-7f8b421c3b3f?q=80&w=400&auto=format&fit=crop",
        "status": "예약가능"
    },
    {
        "id": "boat_005", "name": "강릉대물호", "region": "강릉", "port": "강릉항",
        "tons": "7.93t", "max_capacity": 16, "current_booking": 2, "price": 110000,
        "rating": 4.5, "review_count": 42, "species": ["대구 지깅", "피문어"],
        "image": "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=400&auto=format&fit=crop",
        "status": "예약가능"
    }
]

@router.get("/list")
async def get_boats(
    region: Optional[str] = Query(None, description="출항 지역"),
    species: Optional[str] = Query(None, description="대상 어종"),
    date: Optional[str] = Query(None, description="출조일"),
    q: Optional[str] = Query(None, description="선사 이름 검색어"),
    sort: Optional[str] = Query("recommend", description="정렬 조건")
):
    filtered_boats = MOCK_BOATS
    
    # 1. 지역 필터
    if region and region != "전체":
        filtered_boats = [b for b in filtered_boats if region in b["region"] or region in b["port"]]
        
    # 2. 어종 필터
    if species and species != "전체":
        filtered_boats = [b for b in filtered_boats if any(species in s for s in b["species"])]
        
    # 3. 검색어 필터 (선사 이름)
    if q:
        filtered_boats = [b for b in filtered_boats if q.replace(" ", "") in b["name"].replace(" ", "")]
        
    # 4. 정렬 로직
    if sort == "rating":
        filtered_boats.sort(key=lambda x: x["rating"], reverse=True)
    elif sort == "review":
        filtered_boats.sort(key=lambda x: x["review_count"], reverse=True)
    elif sort == "price_low":
        filtered_boats.sort(key=lambda x: x["price"])
    # recommend(추천순)는 기본 리스트 순서를 유지합니다.
        
    return {"total": len(filtered_boats), "boats": filtered_boats}