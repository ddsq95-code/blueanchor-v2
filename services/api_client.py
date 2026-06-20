# ==========================================
# 📄 services/api_client.py
# 역할: 공공데이터 API 비동기 호출, 캐싱, 트래픽 제어 및 배포 환경 에러 방어
# ==========================================

import asyncio
import xml.etree.ElementTree as ET
import traceback

# 메모리 캐시 및 동시성 제어 (트래픽 제한 방어용)
CACHE = {}
SEMAPHORE = asyncio.Semaphore(3) 

async def safe_fetch(client, url, params, cache_key, retries=3):
    if cache_key in CACHE and CACHE[cache_key]: 
        return CACHE[cache_key]
    
    for attempt in range(retries):
        async with SEMAPHORE:
            await asyncio.sleep(0.3) 
            try:
                # 💡 수정: timeout을 조금 더 넉넉하게 주고 클라우드 환경 대응
                res = await client.get(url, params=params, timeout=20.0)
                
                if res.status_code == 200:
                    text_data = res.text
                    
                    if "LIMITED" in text_data or "<resultCode>22</resultCode>" in text_data or "<resultCode>30</resultCode>" in text_data:
                        raise Exception("API 트래픽 제한 걸림")
                        
                    # 💡 배포 환경 방어: 기상청이 HTML 에러 페이지를 뱉는 경우 즉시 차단
                    if text_data.strip().startswith("<!DOCTYPE html>") or text_data.strip().startswith("<html"):
                        raise Exception("기상청 서버에서 HTML 에러 페이지 반환 (502 Bad Gateway 등)")

                    try:
                        # 1차 시도: JSON 파싱
                        data = res.json()
                        items = data.get("response", {}).get("body", {}).get("items", {}).get("item", [])
                        if not items: items = data.get("body", {}).get("items", {}).get("item", [])
                        if not items: items = data.get("result", {}).get("data", [])
                        r = items if isinstance(items, list) else [items] if items else []
                        if r: CACHE[cache_key] = r
                        return r
                    except Exception as json_err:
                        try:
                            # 2차 시도: XML 파싱 (배포 환경에서 파싱 에러 시 크래시 방지)
                            root = ET.fromstring(text_data)
                            items = [{c.tag: c.text for c in item} for item in root.findall('.//item')]
                            if items: CACHE[cache_key] = items
                            return items
                        except ET.ParseError as xml_err:
                            raise Exception(f"JSON 및 XML 파싱 모두 실패. 데이터 손상 의심.")
                            
            except Exception as e:
                print(f"⚠️ API Error [{cache_key}] (Attempt {attempt+1}/{retries}): {str(e)[:100]}")
                if attempt == retries - 1: return [] 
                await asyncio.sleep(1.5) 
    return []
    
