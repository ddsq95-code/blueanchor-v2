# ==========================================
# 📄 main.py
# 역할: 모든 API와 HTML 화면을 연결하는 서버의 심장부
# ==========================================

from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

# 💡 우리가 만든 라우터(기능)들 불러오기
from routers import api_boat, api_marine, api_weather, api_auth, api_reservation
from core.database import engine
import models

# 💡 데이터베이스 테이블 자동 생성
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="블루앵커 낚시 플랫폼")

# 정적 파일(디자인, 자바스크립트, 이미지) 경로 연결
app.mount("/css", StaticFiles(directory="css"), name="css")
app.mount("/js", StaticFiles(directory="js"), name="js")
app.mount("/images", StaticFiles(directory="images"), name="images")

# HTML 템플릿(화면) 폴더 연결
templates = Jinja2Templates(directory="templates")

# ==========================================
# 🔌 백엔드 API 연결 (라우터 등록)
# ==========================================
app.include_router(api_boat.router, prefix="/api/boat", tags=["Boat"])
app.include_router(api_marine.router, prefix="/api/marine", tags=["Marine"])
app.include_router(api_weather.router, prefix="/api/weather", tags=["Weather"])
app.include_router(api_auth.router, prefix="/api/auth", tags=["Auth"])
# 💡 결제/예약 API 연결! (이 줄이 누락되어서 404 에러가 났을 것입니다)
app.include_router(api_reservation.router, prefix="/api/reservation", tags=["Reservation"])

# ==========================================
# 🌐 프론트엔드 HTML 화면 연결
# ==========================================
@app.get("/", response_class=HTMLResponse)
@app.get("/index.html", response_class=HTMLResponse)
async def read_index(request: Request):
    return templates.TemplateResponse(request=request, name="index.html")

@app.get("/search.html", response_class=HTMLResponse)
async def read_search(request: Request):
    return templates.TemplateResponse(request=request, name="search.html")

@app.get("/detail.html", response_class=HTMLResponse)
async def read_detail(request: Request):
    return templates.TemplateResponse(request=request, name="detail.html")

@app.get("/login.html", response_class=HTMLResponse)
async def read_login(request: Request):
    return templates.TemplateResponse(request=request, name="login.html")

@app.get("/signup.html", response_class=HTMLResponse)
async def read_signup(request: Request):
    return templates.TemplateResponse(request=request, name="signup.html")

@app.get("/payment.html", response_class=HTMLResponse)
async def read_payment(request: Request):
    return templates.TemplateResponse(request=request, name="payment.html")

# 💡 마이페이지 화면 연결!
@app.get("/mypage.html", response_class=HTMLResponse)
async def read_mypage(request: Request):
    return templates.TemplateResponse(request=request, name="mypage.html")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)