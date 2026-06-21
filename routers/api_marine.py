# ==========================================
# 📄 routers/api_marine.py
# 역할: 조석, 수온(해양조사원 조위관측소) 등 해양 데이터 라우팅
# ==========================================

from fastapi import APIRouter
import httpx
import asyncio
from core.config import API_KEY, KMA_API_KEY, REGION_MAP
from services.api_client import safe_fetch, SEMAPHORE

router = APIRouter()

@router.get("/realtime-marine")
async def get_realtime_marine(obs_code: str, date_str: str):
    # 💡 1. 불안정한 기상청 부이(kma_buoy.php) 제거
    # 💡 2. 해양조사원(KHOA) 조위관측소 실시간 센서(tide_obs.php)로 전면 교체
    # obs_code(예: DT_0025 보령)를 그대로 사용하여 정확도 100% 매칭!
    url = f"https://apihub.kma.go.kr/api/typ01/url/tide_obs.php?stn={obs_code}&help=0&authKey={KMA_API_KEY}"
    
    async with httpx.AsyncClient(verify=False) as client:
        try:
            async with SEMAPHORE:
                await asyncio.sleep(0.3)
                headers = {'User-Agent': 'Mozilla/5.0'}
                res = await client.get(url, headers=headers, timeout=15.0)
                
                if res.status_code == 200:
                    text_data = res.text.strip()
                    
                    if not ("AUTH_ERROR" in text_data or "ERROR" in text_data or text_data.startswith("[")):
                        lines = text_data.split('\n')
                        header_line = None
                        data_line = None
                        
                        # 응답 텍스트에서 헤더와 가장 최신 데이터 줄 추출
                        for line in lines:
                            if line.startswith('# YYMMDDHHMI'): 
                                header_line = line
                            elif not line.startswith('#') and len(line.strip()) > 0 and not line.strip().startswith('='): 
                                data_line = line
                        
                        if header_line and data_line:
                            headers_list = header_line.replace('#', '').split()
                            data = data_line.split()
                            tw_val = "-"
                            
                            # 'TW'(Temperature of Water, 수온) 항목 추출
                            if 'TW' in headers_list:
                                tw_idx = headers_list.index('TW')
                                if tw_idx < len(data) and data[tw_idx] not in ['-99.9', '-9.9', '=', '-']: 
                                    tw_val = data[tw_idx]
                            
                            # 파고는 프론트엔드에서 기상예보를 사용하므로 '-'로 통일
                            return {"waterTemp": tw_val, "waveHeight": "-"}
        except Exception as e: 
            print(f"⚠️ 해양조사원 수온 API 통신 에러: {e}")
            pass
            
    return {"waterTemp": "-", "waveHeight": "-"}

@router.get("/daily-data")
async def get_daily_data(obs_code: str, date_str: str):
    bp = {"serviceKey": API_KEY, "ResultType": "json", "dataType": "JSON", "type": "json", "obsCode": obs_code, "pageNo": "1"}
    loc_name = REGION_MAP.get(obs_code, '보령')

    async with httpx.AsyncClient(verify=False) as client:
        p_params = {**bp, "reqDate": date_str, "date": date_str, "numOfRows": "10"}
        t1 = safe_fetch(client, "https://apis.data.go.kr/1192136/tideFcstHghLw/GetTideFcstHghLwApiService", p_params, f"p_{obs_code}_{date_str}")
        t_params = {**bp, "reqDate": date_str, "date": date_str, "numOfRows": "24"}
        t2 = safe_fetch(client, "https://apis.data.go.kr/1192136/surveyTideLevel/GetSurveyTideLevelApiService", t_params, f"t_{obs_code}_{date_str}")
        s_params = {"serviceKey": API_KEY, "locdate": date_str, "location": loc_name}
        t3 = safe_fetch(client, "https://apis.data.go.kr/B090041/openapi/service/RiseSetInfoService/getAreaRiseSetInfo", s_params, f"s_{loc_name}_{date_str}")
        results = await asyncio.gather(t1, t2, t3)

    return { "date": date_str, "peaks": results[0], "tides": results[1], "sunInfo": results[2] }