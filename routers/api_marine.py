# ==========================================
# 📄 routers/api_marine.py
# 역할: 조석, 수온, 파고 등 해양 관련 데이터 라우팅
# ==========================================

<<<<<<< HEAD
from fastapi import APIRouter, Response
=======
from fastapi import APIRouter, Query
>>>>>>> 5eb606330577d7f5852c11567fef36ae049d079a
import httpx
import asyncio
from core.config import API_KEY, KMA_API_KEY, REGION_MAP, KMA_BUOY_MAP
from services.api_client import safe_fetch, SEMAPHORE

router = APIRouter()

@router.get("/realtime-marine")
<<<<<<< HEAD
async def get_realtime_marine(obs_code: str, date_str: str, response: Response):
    # 💡 브라우저 캐싱 방지: 이전에 잘못 가져온 16.6도 데이터가 계속 뜨는 것을 막기 위함
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"

    # 💡 치명적 버그 수정: 제주, 동해, 남해 등 지역별 기상청 부이(Buoy) 고유 번호 하드코딩 방어맵
    # config.py의 설정이 잘못되어 있을 경우를 대비해, 이 맵을 '최우선'으로 적용합니다.
    SAFE_BUOY_MAP = {
        "DT_0004": "22106", # 제주 도두항 -> 서귀포 해양기상부이 (제주 남부) - 약 21도
        "DT_0010": "22184", # 제주 성산항 -> 우도 해양기상부이 (제주 동부)
        "DT_0016": "22103", # 여수 국동항 -> 거문도 해양기상부이 (남해 중부)
        "DT_0014": "22104", # 통영항 -> 거제도 해양기상부이 (남해 동부)
        "DT_0012": "22216", # 강릉항 -> 동해 해양기상부이 (동해 중부)
        "DT_0018": "22105", # 군산 비응항 -> 외연도 해양기상부이 (서해 중부)
        "DT_0025": "22105", # 보령 오천항 -> 외연도 해양기상부이 (서해 중부) - 약 16도
    }

    # 1. 최우선: 하드코딩된 안전한 맵에서 먼저 찾는다. (제주도 수온 출력 오류의 주범 해결)
    stn_code = SAFE_BUOY_MAP.get(obs_code)
    
    # 2. 없으면 config.py에서 찾는다.
    if not stn_code:
        stn_code = KMA_BUOY_MAP.get(obs_code)
        
    # 3. 그래도 없으면 최후의 수단으로 22105(외연도) 적용
    if not stn_code:
        stn_code = '22105'

    url = f"https://apihub.kma.go.kr/api/typ01/url/kma_buoy.php?stn={stn_code}&help=0&authKey={KMA_API_KEY}"
    
    # 💡 배포 방어: verify=False 적용
=======
async def get_realtime_marine(obs_code: str = Query(..., description="관측소 코드"), date_str: str = Query(None)):
    stn_code = KMA_BUOY_MAP.get(obs_code, '22105') # 기본값 설정
    
    # 💡 수정: http -> https 로 변경 (기상청 API 허브)
    url = f"https://apihub.kma.go.kr/api/typ01/url/kma_buoy.php?stn={stn_code}&help=0&authKey={KMA_API_KEY}"
    
    # 💡 수정: 배포 환경 SSL 인증서 무시 (verify=False)
>>>>>>> 5eb606330577d7f5852c11567fef36ae049d079a
    async with httpx.AsyncClient(verify=False) as client:
        try:
            async with SEMAPHORE:
                await asyncio.sleep(0.3)
                headers = {'User-Agent': 'Mozilla/5.0'}
                res = await client.get(url, headers=headers, timeout=15.0)
                
                if res.status_code == 200:
                    text_data = res.text.strip()
                    
                    # 에러나 HTML 응답이 아닌 정상 텍스트 데이터인지 확인
                    if not ("AUTH_ERROR" in text_data or "ERROR" in text_data or text_data.startswith("<") or text_data.startswith("[")):
                        lines = text_data.split('\n')
                        header_line = None
                        data_line = None
                        
                        for line in lines:
                            if line.startswith('# YYMMDDHHMI'): 
                                header_line = line
                            elif not line.startswith('#') and len(line.strip()) > 0 and not line.strip().startswith('='): 
                                data_line = line
                        
                        if header_line and data_line:
                            headers_list = header_line.replace('#', '').split()
                            data = data_line.split()
                            tw_val = "-"
                            wh_val = "-"
                            
<<<<<<< HEAD
=======
                            # 수온(TW) 파싱
>>>>>>> 5eb606330577d7f5852c11567fef36ae049d079a
                            if 'TW' in headers_list:
                                tw_idx = headers_list.index('TW')
                                if tw_idx < len(data) and data[tw_idx] not in ['-99.9', '-9.9', '=']: 
                                    tw_val = data[tw_idx]
                            
                            # 파고(WH) 파싱
                            if 'WH' in headers_list:
<<<<<<< HEAD
                                wh_sig_idx = headers_list.index('WH') + 1
=======
                                wh_sig_idx = headers_list.index('WH') + 1 
>>>>>>> 5eb606330577d7f5852c11567fef36ae049d079a
                                if wh_sig_idx < len(data) and data[wh_sig_idx] not in ['-99.9', '-9.9', '=']: 
                                    wh_val = data[wh_sig_idx]
                            
                            return {"waterTemp": tw_val, "waveHeight": wh_val}
        except Exception as e: 
<<<<<<< HEAD
            print(f"⚠️ 수온 API 통신 에러: {e}")
=======
            # 로그에 에러 원인 출력
            print(f"⚠️ 수온/파고 실시간 API 통신 에러: {str(e)[:200]}")
>>>>>>> 5eb606330577d7f5852c11567fef36ae049d079a
            pass
            
    return {"waterTemp": "-", "waveHeight": "-"}

@router.get("/daily-data")
<<<<<<< HEAD
async def get_daily_data(obs_code: str, date_str: str, response: Response):
    # 💡 브라우저 캐싱 방지 추가
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    
    bp = {"serviceKey": API_KEY, "ResultType": "json", "dataType": "JSON", "type": "json", "obsCode": obs_code, "pageNo": "1"}
    loc_name = REGION_MAP.get(obs_code, '보령')

    # 💡 배포 방어: 무조건 https 사용 및 verify=False
    async with httpx.AsyncClient(verify=False) as client:
        p_params = {**bp, "reqDate": date_str, "date": date_str, "numOfRows": "10"}
        t1 = safe_fetch(client, "https://apis.data.go.kr/1192136/tideFcstHghLw/GetTideFcstHghLwApiService", p_params, f"p_{obs_code}_{date_str}")
        t_params = {**bp, "reqDate": date_str, "date": date_str, "numOfRows": "24"}
        t2 = safe_fetch(client, "https://apis.data.go.kr/1192136/surveyTideLevel/GetSurveyTideLevelApiService", t_params, f"t_{obs_code}_{date_str}")
        s_params = {"serviceKey": API_KEY, "locdate": date_str, "location": loc_name}
        t3 = safe_fetch(client, "https://apis.data.go.kr/B090041/openapi/service/RiseSetInfoService/getAreaRiseSetInfo", s_params, f"s_{loc_name}_{date_str}")
=======
async def get_daily_data(obs_code: str = Query(...), date_str: str = Query(...)):
    loc_name = REGION_MAP.get(obs_code, '보령')

    # 💡 핵심 수정: 사용자님의 API 키는 '국립해양조사원(KHOA) 직접 API'용 키입니다.
    # 공공데이터포털(apis.data.go.kr)이 아닌 KHOA 고유의 안정적인 서버로 요청을 보냅니다.
    khoa_params = {
        "ServiceKey": API_KEY,
        "ResultType": "json",
        "ObsCode": obs_code,
        "Date": date_str
    }
    
    # 일출몰(천문연구원)은 기존 공공데이터포털 유지
    s_params = {
        "serviceKey": API_KEY, 
        "locdate": date_str, 
        "location": loc_name
    }

    async with httpx.AsyncClient(verify=False) as client:
        # 고조/저조 및 시간별 조위를 KHOA 직접 URL로 변경
        t1 = safe_fetch(client, "http://www.khoa.go.kr/oceangrid/grid/api/tideObsPre/search.do", khoa_params, f"p_{obs_code}_{date_str}")
        t2 = safe_fetch(client, "http://www.khoa.go.kr/oceangrid/grid/api/tideObsPreTab/search.do", khoa_params, f"t_{obs_code}_{date_str}")
        
        t3 = safe_fetch(client, "https://apis.data.go.kr/B090041/openapi/service/RiseSetInfoService/getAreaRiseSetInfo", s_params, f"s_{loc_name}_{date_str}")
        
>>>>>>> 5eb606330577d7f5852c11567fef36ae049d079a
        results = await asyncio.gather(t1, t2, t3)

    return { "date": date_str, "peaks": results[0], "tides": results[1], "sunInfo": results[2] }
