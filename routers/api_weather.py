# ==========================================
# 📄 routers/api_weather.py
# 역할: 기상청 단기(시간별), 중기 날씨 예보 라우팅
# ==========================================

from fastapi import APIRouter, Query
import httpx
import asyncio
from datetime import datetime, timedelta
from core.config import API_KEY, KMA_GRID_MAP, MID_SEA_REG_MAP, MID_LAND_REG_MAP, MID_TEMP_REG_MAP
from services.api_client import safe_fetch

router = APIRouter()

@router.get("/hourly")
async def get_weather_hourly(region: str = Query('보령', description="지역명")):
    grid = KMA_GRID_MAP.get(region, {'nx': '53', 'ny': '100'})
    
    now = datetime.utcnow() + timedelta(hours=9) - timedelta(minutes=30)

    if now.hour < 2:
        base_date = (now - timedelta(days=1)).strftime('%Y%m%d')
        base_time = '2300'
    else:
        base_date = now.strftime('%Y%m%d')
        valid_times = [2, 5, 8, 11, 14, 17, 20, 23]
        target_hour = max([t for t in valid_times if t <= now.hour])
        base_time = f"{target_hour:02d}00"

    # 💡 수정: http -> https 로 변경
    url = 'https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst'
    params = {
        'serviceKey': API_KEY, 'pageNo': '1', 'numOfRows': '1000', 'dataType': 'JSON',
        'base_date': base_date, 'base_time': base_time, 'nx': grid['nx'], 'ny': grid['ny']
    }
    cache_key = f"weather_{region}_{base_date}_{base_time}"

    # 💡 수정: 배포 환경 SSL 인증서 무시 (verify=False)
    async with httpx.AsyncClient(verify=False) as client:
        items = await safe_fetch(client, url, params, cache_key)

    hourly_data = {}
    for item in items:
        fcst_date = item.get('fcstDate'); fcst_time = item.get('fcstTime')
        if not fcst_date or not fcst_time: continue
        time_key = f"{fcst_date}_{fcst_time}"

        if time_key not in hourly_data:
            hourly_data[time_key] = { 'date': fcst_date, 'time': f"{fcst_time[:2]}:00", 'tmp': '-', 'wsd': '-', 'vec': '-', 'pcp': '0', 'sky': '1', 'pty': '0', 'wav': '-' }

        category = item.get('category'); value = item.get('fcstValue')
        if category == 'TMP': hourly_data[time_key]['tmp'] = value
        elif category == 'WSD': hourly_data[time_key]['wsd'] = value
        elif category == 'VEC': hourly_data[time_key]['vec'] = value
        elif category == 'SKY': hourly_data[time_key]['sky'] = value
        elif category == 'PTY': hourly_data[time_key]['pty'] = value
        elif category == 'WAV': hourly_data[time_key]['wav'] = value 
        elif category == 'PCP': 
            val = value.replace('강수없음', '0').replace('mm', '').strip()
            if '미만' in val:
                val = '0.1' 
            elif '~' in val:
                val = val.split('~')[0]
            hourly_data[time_key]['pcp'] = val

    sorted_keys = sorted(hourly_data.keys())
    return [hourly_data[k] for k in sorted_keys]

@router.get("/mid-term")
async def get_mid_term_weather(region: str = Query('보령', description="지역명")):
    reg_sea = MID_SEA_REG_MAP.get(region, '12A20000')
    reg_land = MID_LAND_REG_MAP.get(region, '11C20000')
    reg_temp = MID_TEMP_REG_MAP.get(region, '11C20202')
    now = datetime.utcnow() + timedelta(hours=9)

    if now.hour < 7:
        base_time_dt = now - timedelta(days=1)
        tm_fc = f"{base_time_dt.strftime('%Y%m%d')}1800"
    elif now.hour < 19:
        base_time_dt = now
        tm_fc = f"{base_time_dt.strftime('%Y%m%d')}0600"
    else:
        base_time_dt = now
        tm_fc = f"{base_time_dt.strftime('%Y%m%d')}1800"

    # 💡 수정: http -> https 로 변경
    url_sea = 'https://apis.data.go.kr/1360000/MidFcstInfoService/getMidSeaFcst'
    url_land = 'https://apis.data.go.kr/1360000/MidFcstInfoService/getMidLandFcst'
    url_temp = 'https://apis.data.go.kr/1360000/MidFcstInfoService/getMidTa' 
    
    params_sea = {'serviceKey': API_KEY, 'pageNo': '1', 'numOfRows': '10', 'dataType': 'JSON', 'regId': reg_sea, 'tmFc': tm_fc}
    params_land = {'serviceKey': API_KEY, 'pageNo': '1', 'numOfRows': '10', 'dataType': 'JSON', 'regId': reg_land, 'tmFc': tm_fc}
    params_temp = {'serviceKey': API_KEY, 'pageNo': '1', 'numOfRows': '10', 'dataType': 'JSON', 'regId': reg_temp, 'tmFc': tm_fc}

    # 💡 수정: 배포 환경 SSL 인증서 무시 (verify=False)
    async with httpx.AsyncClient(verify=False) as client:
        sea_items = await safe_fetch(client, url_sea, params_sea, f"mid_sea_{reg_sea}_{tm_fc}")
        await asyncio.sleep(0.5) 
        land_items = await safe_fetch(client, url_land, params_land, f"mid_land_{reg_land}_{tm_fc}")
        await asyncio.sleep(0.5)
        temp_items = await safe_fetch(client, url_temp, params_temp, f"mid_temp_{reg_temp}_{tm_fc}")

    raw_data = {}
    if sea_items: raw_data.update(sea_items[0])
    if land_items: raw_data.update(land_items[0])
    if temp_items: raw_data.update(temp_items[0])

    processed_data = {}
    base_date_obj = datetime.strptime(tm_fc[:8], '%Y%m%d')

    def get_val(key1, key2=None):
        v = raw_data.get(key1)
        if v is None and key2: v = raw_data.get(key2)
        return str(v) if v is not None else ""

    for day_offset in range(3, 11):
        target_date = (base_date_obj + timedelta(days=day_offset)).strftime('%Y%m%d')
        
        wf = get_val(f'wf{day_offset}Am', f'wf{day_offset}')
        rnSt = get_val(f'rnSt{day_offset}Am', f'rnSt{day_offset}')
        whMin = get_val(f'wh{day_offset}AAm', f'wh{day_offset}A')
        whMax = get_val(f'wh{day_offset}BAm', f'wh{day_offset}B')
        taMin = get_val(f'taMin{day_offset}')
        taMax = get_val(f'taMax{day_offset}')

        if wf or rnSt or whMin or whMax or taMin or taMax:
            processed_data[target_date] = {
                "wf": wf,
                "rnSt": rnSt,
                "whMin": whMin,
                "whMax": whMax,
                "taMin": taMin,
                "taMax": taMax
            }

    return processed_data
