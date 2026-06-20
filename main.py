import os
from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
import uvicorn

# 라우터 모듈 임포트
from routers import api_boat, api_marine, api_weather

app = FastAPI(title="낚시 플랫폼 API")

# 🔥 [최종 핵심 수정] 배포 환경(Render) 500 에러 절대 방지
# getcwd()에 의존하지 않고, 무조건 main.py 파일이 있는 폴더를 Root로 강제 고정합니다.
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# 1. 정적 파일 마운트 (절대 경로 사용)
app.mount("/css", StaticFiles(directory=os.path.join(BASE_DIR, "css")), name="css")
app.mount("/js", StaticFiles(directory=os.path.join(BASE_DIR, "js")), name="js")
app.mount("/images", StaticFiles(directory=os.path.join(BASE_DIR, "images")), name="images")

# 2. 템플릿 엔진 설정 (절대 경로 사용)
templates = Jinja2Templates(directory=os.path.join(BASE_DIR, "templates"))

# 🔥 [핵심 수정 2] API 라우터 등록 (프론트엔드 JS fetch 경로와 일치하도록 prefix 추가)
app.include_router(api_boat.router, prefix="/api/boats")
app.include_router(api_marine.router, prefix="/api")
app.include_router(api_weather.router, prefix="/api/weather")

# ---------------------------------------------------------
# 🌐 프론트엔드 페이지 렌더링 라우터
# ---------------------------------------------------------

# 메인 홈 화면 (최신 FastAPI TemplateResponse 문법 적용)
@app.get("/", response_class=HTMLResponse)
async def read_root(request: Request):
    return templates.TemplateResponse(request=request, name="index.html")

@app.get("/index.html", response_class=HTMLResponse)
async def read_index(request: Request):
    return templates.TemplateResponse(request=request, name="index.html")

# 검색 페이지 ( /search 및 /search.html 모두 지원 )
@app.get("/search", response_class=HTMLResponse)
@app.get("/search.html", response_class=HTMLResponse)
async def read_search(request: Request):
    return templates.TemplateResponse(request=request, name="search.html")

# 🔥 [핵심 수정 3] 상세 페이지 URL 경로 매핑 (/detail/1 형태 지원)
@app.get("/detail/{boat_id}", response_class=HTMLResponse)
async def read_detail(request: Request, boat_id: str):
    # detail.html 템플릿 내부의 {{ boat_id }} 변수에 값을 안전하게 전달합니다.
    return templates.TemplateResponse(request=request, name="detail.html", context={"boat_id": boat_id})

# (기존 호환성용 - /detail.html?id=1 형태)
@app.get("/detail.html", response_class=HTMLResponse)
async def read_detail_legacy(request: Request, id: str = None):
    return templates.TemplateResponse(request=request, name="detail.html", context={"boat_id": id})

# 결제 페이지 연결 라우터
@app.get("/payment.html", response_class=HTMLResponse)
async def read_payment(request: Request):
    return templates.TemplateResponse(request=request, name="payment.html")

if __name__ == "__main__":
    # Render 환경에서 할당하는 포트를 가져오고, 없으면 기본값 8000 사용
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)