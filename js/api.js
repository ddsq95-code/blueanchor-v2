// ==========================================
// 📄 js/api.js
// 역할: 백엔드 서버(FastAPI)와 통신하여 데이터를 가져오는 전담 모듈
// ==========================================

/**
 * 1. 실시간 해양 관측 데이터 (수온, 파고) 가져오기
 * @param {string} obsCode - 관측소 코드
 * @param {string} dateStr - YYYYMMDD 날짜 문자열
 */
export async function fetchRealtimeMarine(obsCode, dateStr) {
    try {
        const res = await fetch(`/api/realtime-marine?obs_code=${obsCode}&date_str=${dateStr}`);
        if (!res.ok) throw new Error('네트워크 응답 오류');
        return await res.json();
    } catch (error) {
        console.error("실시간 해양 데이터 로드 실패:", error);
        return { waterTemp: "-", waveHeight: "-" };
    }
}

/**
 * 2. 중기 예보 데이터 (4~10일 차 기온/파고 범위) 가져오기
 * @param {string} regionName - 지역명 (예: '보령')
 */
export async function fetchMidTermWeather(regionName) {
    try {
        const res = await fetch(`/api/weather/mid-term?region=${encodeURIComponent(regionName)}`);
        if (!res.ok) throw new Error('네트워크 응답 오류');
        return await res.json();
    } catch (error) {
        console.error("중기예보 로드 실패:", error);
        return {}; // 실패 시 빈 객체 반환
    }
}

/**
 * 3. 단기 예보 데이터 (1~3일 차 시간별 정밀 기상) 가져오기
 * @param {string} regionName - 지역명 (예: '보령')
 */
export async function fetchShortTermWeather(regionName) {
    try {
        const res = await fetch(`/api/weather/hourly?region=${encodeURIComponent(regionName)}`);
        if (!res.ok) throw new Error('네트워크 응답 오류');
        return await res.json();
    } catch (error) {
        console.error("단기예보 로드 실패:", error);
        return []; // 실패 시 빈 배열 반환
    }
}

/**
 * 4. 일별 해양 데이터 (조석 피크, 시간별 조위, 일출/일몰) 가져오기
 * @param {string} obsCode - 관측소 코드
 * @param {string} dateStr - YYYYMMDD 날짜 문자열
 */
export async function fetchDailyData(obsCode, dateStr) {
    try {
        const res = await fetch(`/api/daily-data?obs_code=${obsCode}&date_str=${dateStr}`);
        if (!res.ok) throw new Error("서버 응답 지연");
        return await res.json();
    } catch (error) {
        console.error(`일별 데이터 로드 실패 (${dateStr}):`, error);
        throw error; // UI 쪽에서 에러 카드를 띄우기 위해 에러를 그대로 던짐
    }
}