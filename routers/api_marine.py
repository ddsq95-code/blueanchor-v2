# ==========================================
# 📄 routers/api_marine.py
# 역할: 조석, 수온, 파고 등 해양 관련 데이터 라우팅
# ==========================================

from fastapi import APIRouter, Response, Query
import httpx
import asyncio
from core.config import API_KEY, KMA_API_KEY, REGION_MAP, KMA_BUOY_MAP
from services.api_client import safe_fetch, SEMAPHORE

router = APIRouter()

@router.get("/realtime-marine")
async def get_realtime_marine(obs_code: str = Query(..., description="관측소 코드"), date_str: str = Query(None), response: Response = None):
    if response:
        response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
        response.headers["Pragma"] = "no-cache"
        response.headers["Expires"] = "0"

    SAFE_BUOY_MAP = {
        "DT_0004": "22215", 
        "DT_0010": "22102", 
        "DT_0016": "22103", 
        "DT_0014": "22104", 
        "DT_0012": "22216", 
        "DT_0018": "22185", 
        "DT_0025": "22105", 
    }

    stn_code = SAFE_BUOY_MAP.get(obs_code)
    if not stn_code:
        stn_code = KMA_BUOY_MAP.get(obs_code)
    if not stn_code:
        stn_code = '22105'

    url = f"https://apihub.kma.go.kr/api/typ01/url/kma_buoy.php?stn={stn_code}&help=0&authKey={KMA_API_KEY}"
    
    async with httpx.AsyncClient(verify=False) as client:
        try:
            async with SEMAPHORE:
                await asyncio.sleep(0.3)
                headers = {'User-Agent': 'Mozilla/5.0'}
                res = await client.get(url, headers=headers, timeout=15.0)
                
                if res.status_code == 200:
                    text_data = res.text.strip()
                    
                    # 💡 디버깅: 기상청에서 보내는 원본 데이터 중 앞부분을 Render 로그에 출력
                    print(f"[기상청 API 응답 확인] 부이코드: {stn_code} | 데이터 미리보기: {text_data[:100]}...")
                    
                    if not ("AUTH_ERROR" in text_data or "ERROR" in text_data or text_data.startswith("[")):
                        lines = text_data.split('\n')
                        header_line = None
                        data_line = None
                        for line in lines:
                            if line.startswith('# YYMMDDHHMI'): header_line = line
                            elif not line.startswith('#') and len(line.strip()) > 0 and not line.strip().startswith('='): data_line = line
                        
                        if header_line and data_line:
                            headers_list = header_line.replace('#', '').split()
                            data = data_line.split()
                            tw_val, wh_val = "-", "-"
                            
                            # 💡 수온 파싱 및 결측치 필터링 강화
                            if 'TW' in headers_list:
                                tw_idx = headers_list.index('TW')
                                if tw_idx < len(data) and data[tw_idx] not in ['-99.9', '-9.9', '-999', '=', '-']: 
                                    tw_val = data[tw_idx]
                                else:
                                    print(f"⚠️ [수온 결측치 발생] 부이 {stn_code} 센서 고장 또는 점검 중. 수신값: {data[tw_idx] if tw_idx < len(data) else '없음'}")
                            
                            # 💡 파고(유의 파고: WA) 파싱 버그 수정
                            if 'WA' in headers_list:
                                wa_idx = headers_list.index('WA')
                                if wa_idx < len(data) and data[wa_idx] not in ['-99.9', '-9.9', '-999', '=', '-']: 
                                    wh_val = data[wa_idx]
                                    
                            return {"waterTemp": tw_val, "waveHeight": wh_val}
        except Exception as e: 
            print(f"⚠️ 수온 API 통신 에러: {e}")
            pass
    return {"waterTemp": "-", "waveHeight": "-"}

@router.get("/daily-data")
async def get_daily_data(obs_code: str, date_str: str, response: Response = None):
    if response:
        response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    
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