// ==========================================
// 📄 js/ui.js
// 역할: 화면 렌더링, 이벤트 제어 및 전국 50개 조위관측소 매핑 모듈
// ==========================================

const API_BASE_URL = window.location.origin.includes('localhost') || window.location.origin.includes('127.0.0.1') ? 'http://127.0.0.1:8000' : '';

let currentObsCode = 'DT_0025';
const realTimeNow = new Date();
let currentSelectedDate = new Date(realTimeNow.getFullYear(), realTimeNow.getMonth(), realTimeNow.getDate());

// ==========================================
// ✨ 1. 앱 전용 고급 UI 요소 (토스트 알림, 스켈레톤, 빈 화면)
// ==========================================

// 💡 브라우저 기본 alert 대신 예쁜 토스트 알림 표시
window.showToast = function(message, isError = false) {
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        toastContainer.className = 'fixed bottom-24 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-2 pointer-events-none';
        document.body.appendChild(toastContainer);
    }
    
    const toast = document.createElement('div');
    const icon = isError ? '<i class="fa-solid fa-circle-exclamation text-rose-400"></i>' : '<i class="fa-solid fa-circle-info text-blue-400"></i>';
    toast.className = 'bg-gray-800 text-white text-[13px] font-bold px-5 py-3 rounded-full shadow-lg transition-all duration-300 transform translate-y-10 opacity-0 flex items-center gap-2 whitespace-nowrap';
    toast.innerHTML = `${icon} ${message}`;
    toastContainer.appendChild(toast);

    requestAnimationFrame(() => {
        toast.classList.remove('translate-y-10', 'opacity-0');
        toast.classList.add('translate-y-0', 'opacity-100');
    });

    setTimeout(() => {
        toast.classList.remove('translate-y-0', 'opacity-100');
        toast.classList.add('translate-y-10', 'opacity-0');
        setTimeout(() => toast.remove(), 300);
    }, 2500);
};

// 💡 DB 데이터 생성(초기화) 버튼 함수 추가 (복구됨!)
window.initDatabase = async function() {
    showToast("데이터를 생성하는 중입니다...");
    try {
        const res = await fetch(`${API_BASE_URL}/api/boat/init-db`);
        if(res.ok) {
            showToast("데이터 생성 완료! 화면을 새로고침합니다.");
            setTimeout(() => location.reload(), 1500);
        } else {
            showToast("데이터 생성에 실패했습니다.", true);
        }
    } catch(e) {
        showToast("서버와 연결할 수 없습니다.", true);
    }
}

// 💡 스켈레톤 로딩 애니메이션 HTML
function getSkeletonHtml(isIndexPage) {
    const cardClass = isIndexPage ? "w-[300px] md:w-[340px] shrink-0" : "w-full";
    return `
        <div class="${cardClass} bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm animate-pulse flex flex-col h-[340px]">
            <div class="h-[200px] bg-slate-200 w-full"></div>
            <div class="p-4 flex flex-col flex-1">
                <div class="h-4 bg-slate-200 rounded w-1/3 mb-3"></div>
                <div class="h-6 bg-slate-200 rounded w-2/3 mb-4"></div>
                <div class="h-4 bg-slate-200 rounded w-1/2 mb-2 mt-auto"></div>
                <div class="h-8 bg-slate-200 rounded w-full mt-4"></div>
            </div>
        </div>
    `;
}

// 💡 데이터가 없을 때 표시할 빈 화면 HTML (초기화 버튼 포함 복구됨!)
function getEmptyStateHtml() {
    return `
        <div class="col-span-full py-16 px-4 text-center flex flex-col items-center">
            <div class="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                <i class="fa-solid fa-ship text-3xl text-slate-300"></i>
            </div>
            <h3 class="font-black text-slate-800 text-lg mb-1">등록된 선사가 없습니다</h3>
            <p class="text-sm text-slate-500 font-medium mb-6">현재 데이터베이스가 비어있습니다.</p>
            <button onclick="initDatabase()" class="bg-blue-600 text-white font-bold px-5 py-2.5 rounded-xl shadow-md active:scale-95 transition-transform">
                <i class="fa-solid fa-magic"></i> 클릭하여 더미 데이터 생성하기
            </button>
        </div>
    `;
}

// ==========================================
// 💡 2. 데이터 및 API 매핑
// ==========================================

const regionGroups = {
    '서해 중북부': [
        { name: '인천', code: 'DT_0001', lat: 37.451944, lon: 126.592222 },
        { name: '인천송도', code: 'DT_0052', lat: 37.338056, lon: 126.586111 },
        { name: '영종대교', code: 'DT_0044', lat: 37.545556, lon: 126.584444 },
        { name: '경인항', code: 'DT_0058', lat: 37.560833, lon: 126.601111 },
        { name: '강화대교', code: 'DT_0032', lat: 37.731944, lon: 126.522222 },
        { name: '영흥도', code: 'DT_0043', lat: 37.238611, lon: 126.428611 },
        { name: '안산', code: 'DT_0008', lat: 37.192222, lon: 126.647222 },
        { name: '평택', code: 'DT_0002', lat: 36.966944, lon: 126.822778 },
        { name: '대산', code: 'DT_0017', lat: 37.0075, lon: 126.352778 },
        { name: '태안', code: 'DT_0050', lat: 36.913056, lon: 126.238889 },
        { name: '안흥(구)', code: 'DT_0034', lat: 36.673611, lon: 126.132222 },
        { name: '보령', code: 'DT_0025', lat: 36.406389, lon: 126.486111 },
        { name: '장항', code: 'DT_0024', lat: 36.006944, lon: 126.6875 },
        { name: '서천마량', code: 'DT_0051', lat: 36.128889, lon: 126.495278 },
        { name: '굴업도', code: 'DT_0038', lat: 37.194444, lon: 125.995 },
        { name: '소청초', code: 'IE_0062', lat: 37.423056, lon: 124.738056 }
    ],
    '서해 남부': [
        { name: '군산', code: 'DT_0018', lat: 35.975556, lon: 126.563056 },
        { name: '어청도', code: 'DT_0037', lat: 36.117222, lon: 125.984722 },
        { name: '위도(구)', code: 'DT_0030', lat: 35.618056, lon: 126.301667 },
        { name: '영광', code: 'DT_0003', lat: 35.426111, lon: 126.420556 },
        { name: '목포', code: 'DT_0007', lat: 34.779722, lon: 126.375556 },
        { name: '진도', code: 'DT_0028', lat: 34.377778, lon: 126.308611 },
        { name: '흑산도', code: 'DT_0035', lat: 34.684167, lon: 125.435556 },
        { name: '가거초', code: 'IE_0061', lat: 33.941944, lon: 124.592778 }
    ],
    '남해안': [
        { name: '완도', code: 'DT_0027', lat: 34.315556, lon: 126.759722 },
        { name: '고흥발포', code: 'DT_0026', lat: 34.481111, lon: 127.342778 },
        { name: '여수', code: 'DT_0016', lat: 34.747222, lon: 127.765556 },
        { name: '거문도', code: 'DT_0031', lat: 34.028333, lon: 127.308889 },
        { name: '광양', code: 'DT_0049', lat: 34.903672, lon: 127.754836 },
        { name: '순천만', code: 'DT_0055', lat: 34.884111, lon: 127.512556 },
        { name: '삼천포', code: 'DT_0061', lat: 34.924167, lon: 128.069722 },
        { name: '통영', code: 'DT_0014', lat: 34.827778, lon: 128.434722 },
        { name: '거제도', code: 'DT_0029', lat: 34.801389, lon: 128.699167 },
        { name: '가덕도(구)', code: 'DT_0019', lat: 35.024167, lon: 128.810833 },
        { name: '부산', code: 'DT_0005', lat: 35.096389, lon: 129.035278 },
        { name: '부산항신항', code: 'DT_0056', lat: 35.0775, lon: 128.786944 }
    ],
    '동해안': [
        { name: '울산', code: 'DT_0020', lat: 35.501944, lon: 129.387222 },
        { name: '포항_구', code: 'DT_0901', lat: 36.051581, lon: 129.374499 },
        { name: '포항(과거)', code: 'DT_0009', lat: 36.047222, lon: 129.383889 },
        { name: '후포', code: 'DT_0011', lat: 36.6775, lon: 129.453056 },
        { name: '묵호', code: 'DT_0006', lat: 37.550278, lon: 129.116389 },
        { name: '동해항', code: 'DT_0057', lat: 37.494722, lon: 129.143889 },
        { name: '속초', code: 'DT_0012', lat: 38.207222, lon: 128.594167 },
        { name: '울릉도', code: 'DT_0013', lat: 37.491389, lon: 130.913611 }
    ],
    '제주/기타': [
        { name: '제주', code: 'DT_0004', lat: 33.5275, lon: 126.543056 },
        { name: '서귀포', code: 'DT_0010', lat: 33.24, lon: 126.561667 },
        { name: '성산포', code: 'DT_0022', lat: 33.474722, lon: 126.927778 },
        { name: '모슬포', code: 'DT_0023', lat: 33.214444, lon: 126.251111 },
        { name: '추자도', code: 'DT_0021', lat: 33.961944, lon: 126.300278 },
        { name: '이어도', code: 'IE_0060', lat: 32.122778, lon: 125.182222 }
    ]
};
const speciesList = ["전체", "광어", "참돔", "쭈꾸미", "갑오징어", "우럭", "농어", "갈치", "문어", "한치"];

let modalSelectedDate = new Date(currentSelectedDate);
let modalCalendarMonth = new Date(currentSelectedDate.getFullYear(), currentSelectedDate.getMonth(), 1);
let modalSelectedRegion = { name: '보령', code: 'DT_0025' };
let modalCoastTab = '서해 중북부'; 
let modalGuestCount = 1;
let modalSelectedSpecies = '전체';

async function safeFetchDailyData(obsCode, dateStr) {
    try {
        const res = await fetch(`${API_BASE_URL}/api/daily-data?obs_code=${obsCode}&date_str=${dateStr}`, { cache: 'no-store' });
        if(!res.ok) return { peaks: [], tides: [], sunInfo: [] };
        return await res.json();
    } catch(e) { return { peaks: [], tides: [], sunInfo: [] }; }
}

async function safeFetchShortTermWeather(regionName) {
    try {
        const res = await fetch(`${API_BASE_URL}/api/weather/hourly?region=${encodeURIComponent(regionName)}`, { cache: 'no-store' });
        if(!res.ok) return [];
        return await res.json();
    } catch(e) { return []; }
}

async function safeFetchMidTermWeather(regionName) {
    try {
        const res = await fetch(`${API_BASE_URL}/api/weather/mid-term?region=${encodeURIComponent(regionName)}`, { cache: 'no-store' });
        if(!res.ok) return {};
        return await res.json();
    } catch(e) { return {}; }
}

async function safeFetchRealtimeMarine(obsCode, dateStr) {
    try {
        const res = await fetch(`${API_BASE_URL}/api/realtime-marine?obs_code=${obsCode}&date_str=${dateStr}`, { cache: 'no-store' });
        if(!res.ok) return { waterTemp: "-", waveHeight: "-" };
        return await res.json();
    } catch(e) { return { waterTemp: "-", waveHeight: "-" }; }
}

function getWeatherRegionName(portName) {
    const name = portName.replace('(구)', '').replace('(과거)', '').replace('_구', '').trim();
    if (name.includes('인천') || name.includes('영종') || name.includes('강화') || name.includes('영흥') || name.includes('경인') || name.includes('소청') || name.includes('굴업')) return '인천';
    if (name.includes('안산') || name.includes('평택')) return '수원'; 
    if (name.includes('보령') || name.includes('오천') || name.includes('무창포') || name.includes('장항') || name.includes('서천')) return '보령';
    if (name.includes('태안') || name.includes('안흥') || name.includes('대산')) return '태안';
    if (name.includes('군산') || name.includes('비응') || name.includes('어청') || name.includes('위도')) return '군산';
    if (name.includes('여수') || name.includes('국동') || name.includes('거문')) return '여수';
    if (name.includes('제주') || name.includes('도두') || name.includes('추자')) return '제주';
    if (name.includes('서귀포') || name.includes('모슬포') || name.includes('성산') || name.includes('이어도')) return '서귀포';
    if (name.includes('목포') || name.includes('흑산') || name.includes('진도') || name.includes('가거') || name.includes('영광')) return '목포';
    if (name.includes('부산') || name.includes('가덕') || name.includes('신항')) return '부산';
    if (name.includes('포항') || name.includes('후포') || name.includes('울릉')) return '포항';
    if (name.includes('강릉') || name.includes('묵호') || name.includes('동해') || name.includes('속초')) return '강릉';
    if (name.includes('완도') || name.includes('고흥') || name.includes('광양') || name.includes('순천')) return '완도';
    if (name.includes('통영') || name.includes('삼천포') || name.includes('거제')) return '통영';
    return name;
}

function extractTime(r) {
    if (!r) return '';
    const str = String(r);
    return (str.length >= 16 && str.includes('-') ? str.substring(11, 16) : (str.length >= 5 ? str.substring(0, 5) : str));
}

function getTideDetail(date) {
    const baseDate = new Date("2000-01-06T00:00:00Z");
    const LUNAR_MONTH = 29.530588853; 
    
    const diffDays = (date.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24);
    let phase = diffDays % LUNAR_MONTH;
    if (phase < 0) phase += LUNAR_MONTH;
    
    const lunarDay = Math.floor(phase) + 1;

    const tideMap = {
        1: '7물(사리)', 16: '7물(사리)',
        2: '8물',       17: '8물',
        3: '9물',       18: '9물',
        4: '10물',      19: '10물',
        5: '11물',      20: '11물',
        6: '12물',      21: '12물',
        7: '13물',      22: '13물',
        8: '조금',      23: '조금',
        9: '무시',      24: '무시',
        10: '1물',      25: '1물',
        11: '2물',      26: '2물',
        12: '3물',      27: '3물',
        13: '4물',      28: '4물',
        14: '5물',      29: '5물',
        15: '6물',      30: '6물'
    };

    return { name: tideMap[lunarDay] || '무시', lunarDay: lunarDay };
}

function getModalElement() { return document.getElementById('filter-modal'); }

function openSearchModal() {
    const modal = getModalElement();
    if (modal) { modal.classList.remove('hidden'); modal.classList.add('flex'); }
    modalSelectedDate = new Date(currentSelectedDate);
    modalCalendarMonth = new Date(currentSelectedDate.getFullYear(), currentSelectedDate.getMonth(), 1);
    
    renderCalendar();
    renderRegionTabs();
    renderRegions();
    renderSpecies();
    renderTideCard(); 
    
    const guestText = document.getElementById('modalGuestText');
    if (guestText) guestText.innerText = modalGuestCount;
}

function closeSearchModal() {
    const modal = getModalElement();
    if (modal) { modal.classList.add('hidden'); modal.classList.remove('flex'); }
}

function renderCalendar() {
    const container = document.getElementById('calendarContainer');
    if (!container) return;

    const y = modalCalendarMonth.getFullYear(); 
    const m = modalCalendarMonth.getMonth();
    const firstDay = new Date(y, m, 1).getDay(); 
    const lastDate = new Date(y, m + 1, 0).getDate();
    const days = ['일','월','화','수','목','금','토'];
    
    let html = `
        <div class="flex justify-between items-center mb-4 px-1">
            <button type="button" onclick="changeCalendarMonth(-1)" class="w-8 h-8 flex items-center justify-center bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 text-slate-500 transition-all"><i class="fa-solid fa-chevron-left text-xs"></i></button>
            <div class="font-black text-[15px] text-slate-800">${y}년 ${m + 1}월</div>
            <button type="button" onclick="changeCalendarMonth(1)" class="w-8 h-8 flex items-center justify-center bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 text-slate-500 transition-all"><i class="fa-solid fa-chevron-right text-xs"></i></button>
        </div>
        <div class="grid grid-cols-7 text-center text-xs font-bold gap-y-1.5 w-full">
    `;
    
    days.forEach(d => html += `<div class="py-1 text-slate-400 font-medium">${d}</div>`);
    for(let i = 0; i < firstDay; i++) { html += `<div class="text-slate-200 opacity-20 py-2"></div>`; }
    
    const todayForCal = new Date(realTimeNow.getFullYear(), realTimeNow.getMonth(), realTimeNow.getDate());
    
    for(let d = 1; d <= lastDate; d++) {
        const cellDate = new Date(y, m, d);
        const isPast = cellDate < todayForCal;
        const isSel = modalSelectedDate.getFullYear() === y && modalSelectedDate.getMonth() === m && modalSelectedDate.getDate() === d;
        
        if (isPast) {
            html += `<div class="text-slate-300 line-through py-2 select-none opacity-30 text-center">${d}</div>`;
        } else {
            const activeClass = isSel ? 'bg-blue-600 text-white shadow-sm font-black scale-105' : 'text-slate-800 font-extrabold hover:bg-slate-100';
            html += `<div class="py-2 rounded-xl cursor-pointer transition-all text-center ${activeClass}" onclick="selectModalDate(${y}, ${m}, ${d})">${d}</div>`;
        }
    }
    container.innerHTML = html + `</div>`;
}

function changeCalendarMonth(offset) { 
    modalCalendarMonth.setMonth(modalCalendarMonth.getMonth() + offset); 
    renderCalendar(); 
}

function selectModalDate(y, m, d) {
    modalSelectedDate = new Date(y, m, d);
    renderCalendar();
    renderTideCard();
}

async function fetchAndBuildTideCardHtml(targetDate, regionCode, regionName) {
    const selTide = getTideDetail(targetDate);
    const y = targetDate.getFullYear();
    const m = targetDate.getMonth();
    const d = targetDate.getDate();
    const mStr = String(m + 1).padStart(2, '0');
    const dStr = String(d).padStart(2, '0');
    const dateStr = `${y}${mStr}${dStr}`;
    const dayName = ['일','월','화','수','목','금','토'][targetDate.getDay()];
    const formattedSelDate = `${m + 1}월 ${d}일(${dayName})`;

    const todayMid = new Date(realTimeNow.getFullYear(), realTimeNow.getMonth(), realTimeNow.getDate());
    const targetMid = new Date(y, m, d);
    const diffDays = Math.round((targetMid - todayMid) / (1000 * 60 * 60 * 24));

    let rLat = 36.402, rLon = 126.483;
    Object.values(regionGroups).forEach(group => {
        const found = group.find(r => r.code === regionCode);
        if (found) { rLat = found.lat; rLon = found.lon; }
    });
    const windyUrl = `https://www.windy.com/?${rLat},${rLon},10`;

    let tideTip = '조류 소통이 원활하여 다양한 선상 루어 낚시 및 어종을 공략하기 적합한 물때입니다.';
    if(selTide.name.includes('사리')) tideTip = '조류가 강하게 흐르는 물때입니다. 무거운 봉돌 운용이 필수적이며 타이라바/다운샷 활성도가 높습니다.';
    else if(selTide.name.includes('조금') || selTide.name.includes('무시')) tideTip = '물돌이가 안정적이고 흐름이 완만합니다. 초보자나 심해 낚시에 최적화된 날입니다.';

    let peaksHtml = '';
    let sunrise = "-", sunset = "-";
    
    let wtDisplay = "- ℃"; 
    let wtLabel = `<span class="bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded text-[10px] font-bold mr-1 border border-slate-200">미관측</span>`;

    try {
        const marineData = await safeFetchRealtimeMarine(regionCode, dateStr);
        const temp = marineData?.waterTemp;
        if (temp && temp !== "-" && temp.trim() !== "") {
            wtDisplay = `${temp}℃`;
            wtLabel = `<span class="bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded text-[10px] font-bold mr-1 border border-blue-100">실측</span>`;
        } 
    } catch(e) { }

    try {
        const daily = await safeFetchDailyData(regionCode, dateStr);
        let tP = Array.isArray(daily.peaks) ? daily.peaks : [];
        let hH = '', lH = '';

        if (tP.length === 0) {
            tP = [
                { tphlSe: '고', tph_time: '04:15', tph_level: '650' },
                { tphlSe: '저', tph_time: '10:45', tph_level: '120' },
                { tphlSe: '고', tph_time: '16:30', tph_level: '710' }
            ];
        }

        if (!daily.sunInfo || daily.sunInfo.length === 0) {
            sunrise = "05:25"; sunset = "19:40";
        } else {
            const sunData = daily.sunInfo[0];
            if (sunData.sunrise) sunrise = sunData.sunrise.substring(0, 2) + ":" + sunData.sunrise.substring(2, 4);
            if (sunData.sunset) sunset = sunData.sunset.substring(0, 2) + ":" + sunData.sunset.substring(2, 4);
        }

        tP.forEach(p => {
            const tm = extractTime(p.predcDt || p.tph_time || p.tphl_time || p.fcstTime);
            const hgt = p.predcTdlvVl || p.tph_level || p.tphl_lvl || p.tphlVal || '-';
            const tyCode = String(p.extrSe || p.hl_code || p.tphlSe || '').trim().toUpperCase();
            
            if(['고조', '고', 'H', '1', '3'].includes(tyCode)) {
                hH += `<div class="text-[13px] font-bold text-slate-700 mt-1.5">${tm} <span class="text-rose-500 text-xs">(${hgt}cm)</span></div>`;
            } else if(['저조', '저', 'L', '2', '4'].includes(tyCode)) {
                lH += `<div class="text-[13px] font-bold text-slate-700 mt-1.5">${tm} <span class="text-blue-500 text-xs">(${hgt}cm)</span></div>`;
            }
        });

        if(!hH) hH = `<div class="text-[13px] text-slate-400 mt-1.5">-</div>`;
        if(!lH) lH = `<div class="text-[13px] text-slate-400 mt-1.5">-</div>`;

        peaksHtml = `
            <div class="flex gap-3 mt-3 mb-4 shrink-0 relative z-10 w-full">
                <div class="flex-1 bg-slate-50 py-3 px-2 rounded-xl border border-rose-100 shadow-sm flex flex-col items-center justify-center">
                    <span class="text-xs font-black text-rose-500 mb-0.5">고조 (만조)</span>
                    ${hH}
                </div>
                <div class="flex-1 bg-slate-50 py-3 px-2 rounded-xl border border-blue-100 shadow-sm flex flex-col items-center justify-center">
                    <span class="text-xs font-black text-blue-500 mb-0.5">저조 (간조)</span>
                    ${lH}
                </div>
            </div>
        `;
    } catch(err) {
        peaksHtml = `<div class="text-xs text-rose-500 mt-3 mb-4 text-center w-full">데이터 처리 중 오류가 발생했습니다.</div>`;
    }

    const sunHtml = `
        <div class="border-t border-slate-200 pt-3 flex justify-between items-center text-center w-full mt-3">
            <div class="flex-1 border-r border-slate-200">
                <p class="text-[10px] font-bold text-slate-400 flex justify-center items-center gap-1.5"><i class="fa-regular fa-sun text-rose-500 text-sm"></i> 일출</p>
                <p class="font-black text-slate-700 text-[14px] mt-1">${sunrise}</p>
            </div>
            <div class="flex-1">
                <p class="text-[10px] font-bold text-slate-400 flex justify-center items-center gap-1.5"><i class="fa-solid fa-moon text-amber-500 text-sm"></i> 일몰</p>
                <p class="font-black text-slate-700 text-[14px] mt-1">${sunset}</p>
            </div>
        </div>
    `;

    let weatherHtml = '';
    const weatherRegion = getWeatherRegionName(regionName);

    if (diffDays <= 2) {
        const shortData = await safeFetchShortTermWeather(weatherRegion);
        const dayData = shortData.filter(d => d.date === dateStr);
        let rep = dayData.find(d => parseInt(d.time.split(':')[0]) >= 12);
        if(!rep && dayData.length > 0) rep = dayData[dayData.length - 1];

        if(rep && rep.tmp && rep.tmp !== '-') {
            let wIcon = '<i class="fa-solid fa-sun text-rose-400"></i>';
            if (rep.pty !== '0') wIcon = '<i class="fa-solid fa-cloud-showers-water text-blue-500"></i>';
            else if (rep.sky === '3' || rep.sky === '4') wIcon = '<i class="fa-solid fa-cloud text-slate-400"></i>';
            
            let minTemp = 99, maxTemp = -99, maxWave = 0, totalPrecip = 0;
            dayData.forEach(hour => {
                const t = parseFloat(hour.tmp);
                if (!isNaN(t)) { if (t < minTemp) minTemp = t; if (t > maxTemp) maxTemp = t; }
                const w = parseFloat(hour.wav);
                if (!isNaN(w) && w > maxWave) maxWave = w;
                const pcp = parseFloat(hour.pcp);
                if (!isNaN(pcp)) totalPrecip += pcp;
            });

            let tempStr = (minTemp !== 99) ? `${minTemp}°C/${maxTemp}°C` : `${rep.tmp}°C`;
            let rainStr = totalPrecip === 0 ? '0mm' : `${totalPrecip.toFixed(1)}mm`;
            let waveStr = (maxWave === 0 || maxWave < 0.5) ? '0.5m↓' : `${maxWave}m`;

            weatherHtml = buildWeatherCard(windyUrl, wIcon, tempStr, waveStr, rainStr, sunHtml);
        }
    } else if (diffDays >= 3 && diffDays <= 10) {
        const midDataDict = await safeFetchMidTermWeather(weatherRegion);
        const mid = midDataDict[dateStr];
        if(mid && (mid.taMin || mid.whMin || mid.wf)) {
            let wIcon = '<i class="fa-solid fa-sun text-rose-400"></i>';
            const wf = String(mid.wf || "");
            if (wf.includes('비') || wf.includes('눈') || wf.includes('소나기')) wIcon = '<i class="fa-solid fa-cloud-showers-water text-blue-500"></i>';
            else if (wf.includes('구름') || wf.includes('흐림')) wIcon = '<i class="fa-solid fa-cloud text-slate-400"></i>';

            let waveStr = '-';
            if(mid.whMin && mid.whMax) waveStr = `${mid.whMin}~${mid.whMax}m`;
            else if(mid.whMin) waveStr = `${mid.whMin}m`;

            let tempStr = `${mid.taMin||'-'}°C/${mid.taMax||'-'}°C`;
            let rainStr = mid.rnSt ? mid.rnSt+'%' : '-';

            weatherHtml = buildWeatherCard(windyUrl, wIcon, tempStr, waveStr, rainStr, sunHtml);
        }
    }

    if(!weatherHtml) {
        weatherHtml = buildWeatherCard(windyUrl, '<i class="fa-solid fa-cloud-sun text-slate-400"></i>', '22°C/26°C', '0.5m~1.0m', '0%', sunHtml);
    }
    
    return `
        <div class="h-full flex flex-col bg-white rounded-2xl p-6 text-slate-800 border border-slate-200/80 shadow-sm relative overflow-hidden">
            <div class="absolute -right-4 -bottom-4 text-slate-50 text-7xl pointer-events-none"><i class="fa-solid fa-water"></i></div>
            
            <div class="flex justify-between items-center mb-4 shrink-0 relative z-10 w-full">
                <span class="text-sm font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-md border border-slate-200/60">${formattedSelDate}</span>
                <span class="text-xs bg-blue-50 text-blue-600 border border-blue-100 px-2.5 py-1 rounded-full font-black">음력 ${selTide.lunarDay}일</span>
            </div>

            <div class="mb-2 shrink-0 relative z-10 w-full">
                <div class="flex justify-between items-end w-full">
                    <div>
                        <div class="text-xs font-bold text-slate-400 mb-1 flex items-center gap-1"><i class="fa-solid fa-water text-blue-400"></i> 확정 물때</div>
                        <div class="text-4xl font-black text-blue-600 tracking-tight">${selTide.name}</div>
                    </div>
                    <div class="text-[13px] font-bold text-slate-600 mb-2 flex items-center gap-1 text-right">
                        <i class="fa-solid fa-droplet text-cyan-500"></i> ${wtLabel} 수온: <span class="text-cyan-600 font-black">${wtDisplay}</span>
                    </div>
                </div>
            </div>

            ${weatherHtml}
            <div class="text-right w-full relative z-10 mt-1.5">
                <span class="text-[10px] text-slate-400 font-medium tracking-tight"><i class="fa-solid fa-wind text-blue-400"></i> 날씨를 누르면 윈디(Windy)로 이동합니다</span>
            </div>

            ${peaksHtml}

            <div class="mt-auto bg-slate-50 p-4 rounded-xl border border-slate-100 shadow-sm shrink-0 relative z-10 w-full">
                <div class="text-xs font-black text-blue-500 mb-2 flex items-center gap-1.5"><i class="fa-solid fa-circle-info"></i> 마스터 출조 가이드</div>
                <p class="text-[13px] text-slate-500 leading-relaxed font-semibold break-keep">${tideTip}</p>
            </div>
        </div>
    `;
}

function buildWeatherCard(windyUrl, wIcon, tempStr, waveStr, rainStr, sunHtml) {
    return `
        <div onclick="window.open('${windyUrl}', '_blank')" class="bg-slate-50 py-3 px-3 rounded-xl border border-slate-100 mt-3 flex flex-col items-center shadow-sm relative z-10 w-full cursor-pointer hover:bg-blue-50 hover:border-blue-200 transition-all group" title="윈디(Windy)에서 상세 확인">
            <div class="flex justify-between items-center w-full">
                <div class="text-3xl w-10 text-center shrink-0 group-hover:scale-110 transition-transform">${wIcon}</div>
                <div class="flex flex-1 justify-around items-center px-1">
                    <div class="text-center shrink-0">
                        <div class="text-[11px] font-bold text-slate-500 mb-0.5 whitespace-nowrap">기온</div>
                        <div class="text-[14px] font-black text-slate-800 tracking-tighter whitespace-nowrap">${tempStr}</div>
                    </div>
                    <div class="text-center shrink-0">
                        <div class="text-[11px] font-bold text-slate-500 mb-0.5 whitespace-nowrap">파고</div>
                        <div class="text-[14px] font-black text-slate-800 tracking-tighter whitespace-nowrap">${waveStr}</div>
                    </div>
                    <div class="text-center shrink-0">
                        <div class="text-[11px] font-bold text-slate-500 mb-0.5 whitespace-nowrap">강수</div>
                        <div class="text-[14px] font-black text-slate-800 tracking-tighter whitespace-nowrap">${rainStr}</div>
                    </div>
                </div>
                <div class="text-slate-300 group-hover:text-blue-500 transition-colors pl-1 shrink-0">
                    <i class="fa-solid fa-chevron-right text-sm"></i>
                </div>
            </div>
            ${sunHtml}
        </div>
    `;
}

async function renderTideCard() {
    const container = document.getElementById('tideCardContainer');
    if(!container) return;
    container.innerHTML = `<div class="flex flex-col items-center justify-center bg-white rounded-2xl border border-slate-200/80 text-slate-400 py-10 h-full min-h-[300px] shadow-sm"><i class="fa-solid fa-spinner fa-spin text-3xl text-blue-500 mb-3"></i><span class="text-xs font-bold text-center mt-2">선택하신 날짜와 지역의<br>해양 데이터를 분석 중입니다...</span></div>`;
    container.innerHTML = await fetchAndBuildTideCardHtml(modalSelectedDate, modalSelectedRegion.code, modalSelectedRegion.name);
}

async function updateSidebarSeaCondition() {
    const container = document.getElementById('sidebarTideCardContainer');
    if (!container) return; 
    container.innerHTML = `<div class="flex flex-col items-center justify-center bg-white rounded-2xl border border-slate-200/80 text-slate-400 py-10 h-full min-h-[300px] shadow-sm"><i class="fa-solid fa-spinner fa-spin text-3xl text-blue-500 mb-3"></i><span class="text-xs font-bold text-center mt-2">선택하신 날짜와 지역의<br>해양 데이터를 분석 중입니다...</span></div>`;
    
    let rName = '보령';
    const filterRegionBtn = document.getElementById('filter-region-btn');
    if (filterRegionBtn) rName = filterRegionBtn.innerText;

    container.innerHTML = await fetchAndBuildTideCardHtml(currentSelectedDate, currentObsCode, rName);
}

// 💡 신규 추가: 메인 화면 모바일 전용 날씨/물때 위젯 업데이트 함수
async function updateMobileWeatherWidget() {
    const regionEl = document.getElementById('mobile-weather-region');
    if (!regionEl) return; // 메인 페이지가 아니면 실행 안 함
    
    const regionName = '보령'; // 현재는 기본 지역인 보령 기준으로 설정 (추후 위치 기반으로 확장 가능)
    const today = new Date();
    const dateStr = `${today.getFullYear()}${String(today.getMonth()+1).padStart(2,'0')}${String(today.getDate()).padStart(2,'0')}`;
    const weatherRegion = getWeatherRegionName(regionName);
    
    // 1. 오늘 날짜 기반으로 물때 자동 계산 (좁은 화면을 위해 '사리' 등 부가 설명은 제거)
    const tide = getTideDetail(today);
    document.getElementById('mobile-weather-tide').innerText = tide.name.replace('(사리)', '').trim();
    
    // 2. 기상청 날씨 데이터 호출 및 연동
    try {
        const shortData = await safeFetchShortTermWeather(weatherRegion);
        const dayData = shortData.filter(d => d.date === dateStr);
        let rep = dayData.find(d => parseInt(d.time.split(':')[0]) >= 12);
        if(!rep && dayData.length > 0) rep = dayData[dayData.length - 1];

        if(rep && rep.tmp && rep.tmp !== '-') {
            let wIconClass = 'fa-solid fa-sun text-rose-400';
            let condText = '맑음';
            
            if (rep.pty !== '0') {
                wIconClass = 'fa-solid fa-cloud-showers-water text-blue-500';
                condText = '비';
            } else if (rep.sky === '3' || rep.sky === '4') {
                wIconClass = 'fa-solid fa-cloud text-slate-400';
                condText = '흐림';
            }
            
            document.getElementById('mobile-weather-icon').className = `${wIconClass} mb-2 text-xl`;
            document.getElementById('mobile-weather-cond').innerText = condText;
            document.getElementById('mobile-weather-temp').innerText = `${rep.tmp}°C`;
            document.getElementById('mobile-weather-wind').innerText = `${rep.wsd}m/s`;
            document.getElementById('mobile-weather-wave').innerText = (rep.wav === '-' || rep.wav === '0') ? '0.5m' : `${rep.wav}m`;
        }
    } catch(e) {
        console.error("모바일 날씨 위젯 로딩 실패", e);
    }
}

function renderRegionTabs() {
    const container = document.getElementById('regionTabs');
    if(container) {
        container.innerHTML = Object.keys(regionGroups).map(c => `<button type="button" onclick="selectCoastTab('${c}')" class="flex-1 py-1.5 px-2 whitespace-nowrap rounded-lg text-[13px] font-bold transition-all ${modalCoastTab === c ? 'bg-white text-blue-600 shadow-sm font-black' : 'text-slate-500 hover:text-slate-700'}" style="border:none;">${c}</button>`).join('');
    }
}
function selectCoastTab(c) { modalCoastTab = c; renderRegionTabs(); renderRegions(); }

function renderRegions() {
    const container = document.getElementById('regionGrid');
    if(container) {
        container.innerHTML = regionGroups[modalCoastTab].map(r => `
            <button type="button" onclick="selectModalRegion('${r.name}', '${r.code}')" class="w-full py-2.5 rounded-xl border text-[13px] font-bold transition-all ${modalSelectedRegion.name === r.name ? 'bg-blue-600 border-blue-600 text-white shadow-md font-black' : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-blue-400 hover:text-blue-500'}">${r.name}</button>
        `).join('');
    }
}
function selectModalRegion(n, c) {
    modalSelectedRegion = { name: n, code: c };
    renderRegions();
    renderTideCard();
}

function changeGuest(v) {
    modalGuestCount = Math.max(1, modalGuestCount + v);
    const textEl = document.getElementById('modalGuestText');
    if (textEl) textEl.innerText = modalGuestCount;
}

function renderSpecies() {
    const container = document.getElementById('speciesGrid');
    if(container) {
        container.innerHTML = speciesList.map(s => `
            <button type="button" onclick="selectModalSpecies('${s}')" class="w-full py-2 bg-slate-50 border text-[13px] font-bold transition-all ${modalSelectedSpecies === s ? 'bg-blue-600 border-blue-600 text-white shadow-md font-black' : 'border-slate-200 text-slate-600 hover:border-blue-400 hover:text-blue-500'}">${s}</button>
        `).join('');
    }
}
function selectModalSpecies(n) { modalSelectedSpecies = n; renderSpecies(); }

function applyFilters() {
    currentSelectedDate = new Date(modalSelectedDate); 
    currentObsCode = modalSelectedRegion.code;
    const d = currentSelectedDate;
    
    const bDate = document.getElementById('barDate');
    const bReg = document.getElementById('barRegion');
    const bGst = document.getElementById('barGuests');
    const bSpc = document.getElementById('barSpecies');

    if(bDate) bDate.innerText = `${d.getFullYear()}. ${String(d.getMonth()+1).padStart(2,'0')}. ${String(d.getDate()).padStart(2,'0')}`;
    if(bReg) bReg.innerText = modalSelectedRegion.name;
    if(bGst) bGst.innerText = modalGuestCount + '명';
    if(bSpc) bSpc.innerText = modalSelectedSpecies;
    
    const fDate = document.getElementById('filter-date-btn');
    const fReg = document.getElementById('filter-region-btn');
    const fGst = document.getElementById('filter-guest-btn');
    const fSpc = document.getElementById('filter-species-btn');

    if(fDate) fDate.innerText = `${String(d.getMonth()+1).padStart(2,'0')}. ${String(d.getDate()).padStart(2,'0')}`;
    if(fReg) fReg.innerText = modalSelectedRegion.name;
    if(fGst) fGst.innerText = modalGuestCount + '명';
    if(fSpc) fSpc.innerText = modalSelectedSpecies;
    
    closeSearchModal();
    updateSidebarSeaCondition();
}

function changeSort(sortType, element) {
    const textSpan = document.getElementById('sort-text');
    if(textSpan) textSpan.innerText = sortType;
    document.querySelectorAll('.sort-item').forEach(el => el.className = 'sort-item block px-4 py-2 text-[13px] font-medium text-slate-600 hover:bg-slate-50');
    if(element) element.className = 'sort-item block px-4 py-2 text-[13px] font-bold text-blue-600 bg-blue-50';
    document.activeElement.blur();

    const grid = document.getElementById('boat-list-grid') || document.querySelector('.grid.grid-cols-1.md\\:grid-cols-2');
    if(!grid) return;
    const cards = Array.from(grid.children);

    cards.sort((a, b) => {
        const ratingA = parseFloat(a.getAttribute('data-rating')) || 0;
        const ratingB = parseFloat(b.getAttribute('data-rating')) || 0;
        const priceA = parseInt(a.getAttribute('data-price')) || 0;
        const priceB = parseInt(b.getAttribute('data-price')) || 0;
        const newA = parseInt(a.getAttribute('data-new')) || 0;
        const newB = parseInt(b.getAttribute('data-new')) || 0;

        if (sortType === '평점 높은 순') return ratingB - ratingA; 
        if (sortType === '가격 낮은 순') return priceA - priceB;   
        if (sortType === '최신 등록 순') return newA - newB;       
        return 0;
    });

    grid.style.opacity = 0;
    setTimeout(() => { cards.forEach(card => grid.appendChild(card)); grid.style.opacity = 1; }, 150); 
}

const popularTags = {
    species: ['#참돔 타이라바', '#광어 다운샷', '#쭈꾸미 생미끼', '#갑오징어', '#갈치 지깅', '#한치 한가득', '#우럭 외연낚시', '#무늬오징어 팁런'],
    facility: ['#초보환영', '#장비대여', '#전투낚시', '#독배전문', '#가족환영', '#야간출항', '#수세식화장실', '#점심제공']
};
let selectedTags = [];

function openTagModal() {
    const modal = document.getElementById('tag-modal');
    if (modal) { modal.classList.remove('hidden'); modal.classList.add('flex'); renderTagButtons(); }
}
function closeTagModal() {
    const modal = document.getElementById('tag-modal');
    if (modal) { modal.classList.add('hidden'); modal.classList.remove('flex'); }
}
function toggleTag(tag) {
    if(selectedTags.includes(tag)) selectedTags = selectedTags.filter(t => t !== tag);
    else selectedTags.push(tag);
    renderTagButtons();
}
function resetTags() { selectedTags = []; renderTagButtons(); }
function applyTags() {
    closeTagModal();
    const btn = document.getElementById('btn-open-tag');
    if(btn) {
        if(selectedTags.length > 0) {
            btn.classList.add('bg-blue-600', 'text-white', 'border-blue-600');
            btn.classList.remove('bg-blue-50', 'text-blue-600', 'border-blue-200');
            btn.innerHTML = `<i class="fa-solid fa-tags"></i> 태그 ${selectedTags.length}개 적용`;
        } else {
            btn.classList.remove('bg-blue-600', 'text-white', 'border-blue-600');
            btn.classList.add('bg-blue-50', 'text-blue-600', 'border-blue-200');
            btn.innerHTML = `<i class="fa-solid fa-tags text-blue-500"></i> 태그 검색`;
        }
    }

    const grid = document.getElementById('boat-list-grid') || document.querySelector('.grid.grid-cols-1.md\\:grid-cols-2');
    if(!grid) return;

    const cards = Array.from(grid.children);
    let visibleCount = 0;

    grid.style.opacity = 0;
    setTimeout(() => {
        cards.forEach(card => {
            if (selectedTags.length === 0) {
                card.style.display = ''; visibleCount++;
            } else {
                const cardText = card.innerText || card.textContent;
                const hasAllTags = selectedTags.every(tag => cardText.includes(tag));
                if (hasAllTags) { card.style.display = ''; visibleCount++; }
                else { card.style.display = 'none'; }
            }
        });
        grid.style.opacity = 1;
        const countText = document.getElementById('total-boat-count') || document.querySelector('.mb-6 p.text-[13px].font-bold.text-slate-500');
        if(countText && countText.innerText.includes('예약 가능합니다')) countText.innerText = `총 ${visibleCount}척의 낚싯배가 예약 가능합니다`;
    }, 150);
}

function renderTagButtons() {
    const sg = document.getElementById('tag-group-species');
    const fg = document.getElementById('tag-group-facility');
    
    if(sg) {
        sg.innerHTML = popularTags.species.map(t => {
            const isActive = selectedTags.includes(t);
            return `<button type="button" onclick="toggleTag('${t}')" class="px-3 py-1.5 rounded-full text-[13px] font-bold border transition-all ${isActive ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 'bg-white border-slate-200 text-slate-600 hover:border-blue-400 hover:text-blue-500'}">${t}</button>`;
        }).join('');
    }
    
    if(fg) {
        fg.innerHTML = popularTags.facility.map(t => {
            const isActive = selectedTags.includes(t);
            return `<button type="button" onclick="toggleTag('${t}')" class="px-3 py-1.5 rounded-full text-[13px] font-bold border transition-all ${isActive ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 'bg-white border-slate-200 text-slate-600 hover:border-blue-400 hover:text-blue-500'}">${t}</button>`;
        }).join('');
    }
    const applyCount = document.getElementById('tag-apply-count');
    if(applyCount) applyCount.innerText = selectedTags.length;
}

// 💡 스와이퍼(Swiper) 구조를 갖춘 카드 렌더링 함수로 완벽 수정!
function buildBoatCardHtml(boat, isIndexPage) {
    let availableSeats = Math.floor(Math.random() * (boat.max_guests - 1)) + 1;

    if (boat.is_closing_soon && availableSeats > 3) {
        availableSeats = Math.floor(Math.random() * 3) + 1; 
    } else if (!boat.is_closing_soon && availableSeats <= 3) {
        availableSeats = Math.floor(Math.random() * (boat.max_guests - 4)) + 4; 
    }

    const actuallyClosing = availableSeats <= 3;
    const closingBadge = actuallyClosing ? `<span class="bg-rose-500 text-white text-[11px] font-bold px-3 py-1.5 rounded shadow-sm animate-pulse">마감임박</span>` : `<span class="bg-amber-500 text-white text-[11px] font-bold px-3 py-1.5 rounded shadow-sm">예약가능</span>`;
    const seatColor = actuallyClosing ? 'text-rose-500' : 'text-blue-500';
    const seatIconColor = actuallyClosing ? 'text-rose-400' : 'text-blue-400';
    
    let tagsHtml = '';
    if(boat.tags) {
        const tagsArr = boat.tags.split(',');
        tagsArr.forEach(t => {
            tagsHtml += `<span class="border border-slate-100 bg-slate-50 text-slate-500 text-[11.5px] px-2.5 py-1 rounded-full font-medium">#${t.trim()}</span>`;
        });
    }

    const cardClass = isIndexPage ? "smart-link-card cursor-pointer bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl transition-all h-full flex flex-col group relative" : "smart-link-card cursor-pointer bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl transition-all flex flex-col group relative";
    const fallbackImage = "https://images.unsplash.com/photo-1544329621-e00eb2c300ea?auto=format&fit=crop&q=80&w=800";

    // 야놀자/어신 스타일의 카드 내부 다중 이미지를 위한 더미 배열
    const subImages = [
        boat.image_url,
        "https://images.unsplash.com/photo-1596401057633-54a8fe8ef647",
        "https://images.unsplash.com/photo-1583416750470-965b2707b355"
    ];

    let swiperSlidesHtml = subImages.map(img => `
        <div class="swiper-slide">
            <img src="${img}?auto=format&fit=crop&q=80&w=800" 
                 onerror="this.onerror=null; this.src='${fallbackImage}';" 
                 class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700">
        </div>
    `).join('');

    return `
        <div class="${cardClass}" onclick="location.href='detail.html?id=${boat.id}'" data-rating="${boat.rating}" data-price="${boat.price}" data-new="${boat.id}">
            <div class="relative ${isIndexPage ? 'h-[220px]' : 'h-[200px]'} bg-slate-100 overflow-hidden group">
                
                <!-- 💡 카드 내부 다중 이미지 스와이퍼 HTML 구조 추가 -->
                <div class="swiper innerImageSwiper w-full h-full absolute inset-0 z-0">
                    <div class="swiper-wrapper">
                        ${swiperSlidesHtml}
                    </div>
                    <div class="swiper-pagination z-10" onclick="event.stopPropagation()"></div>
                    <div class="swiper-button-prev z-10" onclick="event.stopPropagation()"></div>
                    <div class="swiper-button-next z-10" onclick="event.stopPropagation()"></div>
                </div>

                <div class="absolute top-4 left-4 flex gap-1.5 z-10 pointer-events-none">
                    <span class="bg-blue-600 text-white text-[11px] font-bold px-3 py-1.5 rounded shadow-sm">실시간예약</span>
                    ${closingBadge}
                </div>
                <div class="absolute bottom-4 right-4 z-10 pointer-events-none">
                    <span class="bg-slate-900/70 backdrop-blur-sm text-white text-[12px] font-bold px-2.5 py-1.5 rounded flex items-center gap-1.5">
                        <i class="fa-solid fa-anchor text-[10px]"></i> ${boat.tonnage}
                    </span>
                </div>
                
                <button type="button" class="wishlist-btn absolute bottom-4 left-4 w-9 h-9 bg-black/30 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center transition-all hover:bg-rose-500/90 hover:scale-110 z-20" data-boat-id="${boat.id}">
                    <i class="fa-regular fa-heart text-white text-[17px] mt-[1px] drop-shadow-md"></i>
                </button>
            </div>
            
            <div class="${isIndexPage ? 'p-5' : 'p-4'} flex flex-col flex-1 relative z-10 bg-white">
                ${!isIndexPage ? `<div class="text-[11px] font-bold text-slate-400 mb-1 tracking-tight">[${boat.region}]</div>` : ''}
                <div class="flex justify-between items-center mb-2">
                    <h3 class="${isIndexPage ? 'text-[20px]' : 'text-[17px]'} font-black text-slate-800 tracking-tight">${boat.name}</h3>
                    <span class="${seatColor} text-[13px] font-black flex items-center gap-1.5">
                        <i class="fa-solid fa-user-group ${seatIconColor}"></i> 잔여 ${availableSeats}석 
                        <span class="text-slate-900 text-[14px] font-bold ml-0.5">/ 총 ${boat.max_guests}명</span>
                    </span>
                </div>
                <div class="text-[12px] font-bold text-amber-500 ${isIndexPage ? 'mb-4' : 'mb-3'} flex items-center gap-1.5">
                    <i class="fa-solid fa-star text-[12px]"></i> ${boat.rating.toFixed(1)} <span class="text-slate-400 font-normal text-[12px]">(${boat.review_count})</span>
                </div>
                
                <div class="flex flex-col gap-2.5 mb-5 mt-auto">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-2">
                            <span class="border border-slate-200 bg-slate-50 text-slate-500 font-bold px-2 py-1 rounded text-[11.5px] whitespace-nowrap">문의</span>
                            <span class="font-bold text-[15px] text-slate-800">010-0000-0000</span>
                        </div>
                        <div class="flex items-center gap-1.5 ml-auto">
                            <a href="https://band.us" target="_blank" onclick="event.stopPropagation()" class="w-6 h-6 flex items-center justify-center rounded bg-[#03C75A]/10 text-[#03C75A] hover:bg-[#03C75A] hover:text-white transition-colors" title="네이버 밴드"><span class="font-black text-[11px]">B</span></a>
                            <a href="https://instagram.com" target="_blank" onclick="event.stopPropagation()" class="w-6 h-6 flex items-center justify-center rounded bg-pink-50 text-pink-500 hover:bg-gradient-to-tr hover:from-yellow-400 hover:via-pink-500 hover:to-purple-500 hover:text-white transition-all" title="인스타그램"><i class="fa-brands fa-instagram text-[13px]"></i></a>
                        </div>
                    </div>
                    <div class="flex items-center gap-2 text-[11px] text-slate-600">
                        <span class="border border-slate-200 bg-slate-50 text-slate-500 font-bold px-2 py-1 rounded text-[11.5px] whitespace-nowrap">위치</span>
                        <span class="font-medium text-[14px] text-slate-600 truncate">${boat.region} ${boat.port}</span>
                    </div>
                </div>

                <div class="flex flex-wrap gap-1.5 mb-3">
                    ${tagsHtml}
                </div>
                <div class="mt-auto border-t border-slate-100 pt-4 flex justify-between items-end">
                    <span class="text-[12px] text-slate-400 font-medium">1인 대여기준</span>
                    <div class="text-xl font-black text-slate-800 tracking-tight">
                        ${boat.price.toLocaleString()}<span class="text-[14px] font-bold ml-0.5">원</span>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// ==========================================
// 💡 화면 로드 시 실행 (스켈레톤 및 API 데이터 렌더링)
// ==========================================
window.onload = async function() {
    const barDateEl = document.getElementById('barDate');
    if (barDateEl) barDateEl.innerText = `${currentSelectedDate.getFullYear()}. ${String(currentSelectedDate.getMonth()+1).padStart(2,'0')}. ${String(currentSelectedDate.getDate()).padStart(2,'0')}`;
    
    const filterDateEl = document.getElementById('filter-date-btn');
    if (filterDateEl) filterDateEl.innerText = `${String(currentSelectedDate.getMonth()+1).padStart(2,'0')}. ${String(currentSelectedDate.getDate()).padStart(2,'0')}`;
    
    // 로그인 상태 반영
    const token = localStorage.getItem('blueanchor_token');
    const userName = localStorage.getItem('blueanchor_name');
    if(token && userName) {
        const loginLinks = document.querySelectorAll('a');
        loginLinks.forEach(link => {
            if(link.innerText.includes('로그인')) {
                link.innerHTML = `<i class="fa-solid fa-circle-user text-blue-500 text-lg"></i> <span class="font-black text-slate-800">${userName}님</span>`;
                link.href = 'mypage.html';
                link.onclick = null;
                link.title = "마이페이지 (예약 내역 확인)";
                link.classList.remove('text-slate-600');
                
                const logoutBtn = document.createElement('a');
                logoutBtn.href = "javascript:void(0)";
                logoutBtn.className = "text-[11px] font-bold text-slate-400 hover:text-rose-500 ml-3 bg-slate-100 px-2 py-1 rounded-md transition-colors";
                logoutBtn.innerText = "로그아웃";
                logoutBtn.onclick = function() {
                    if(confirm('로그아웃 하시겠습니까?')) {
                        localStorage.removeItem('blueanchor_token');
                        localStorage.removeItem('blueanchor_name');
                        location.href = 'index.html';
                    }
                };
                link.parentNode.insertBefore(logoutBtn, link.nextSibling);
            }
        });
    }

    if (typeof window.updateWishlistUI === 'function') window.updateWishlistUI();
    updateSidebarSeaCondition();
    
    // 💡 신규 추가: 화면이 로드될 때 모바일 날씨 위젯 함수도 함께 실행
    updateMobileWeatherWidget();

    const boatListContainerIndex = document.getElementById('boat-list-swiper-wrapper');
    const boatListContainerSearch = document.getElementById('boat-list-grid');
    const boatListMobileGrid = document.getElementById('boat-list-mobile-grid');

    const skeletonHtmlIndex = Array(3).fill(0).map(() => getSkeletonHtml(true)).join('');
    const skeletonHtmlGrid = Array(4).fill(0).map(() => getSkeletonHtml(false)).join('');
    
    if (boatListContainerIndex) boatListContainerIndex.innerHTML = skeletonHtmlIndex;
    if (boatListContainerSearch) boatListContainerSearch.innerHTML = skeletonHtmlGrid;
    if (boatListMobileGrid) boatListMobileGrid.innerHTML = skeletonHtmlGrid;

    try {
        const res = await fetch(`${API_BASE_URL}/api/boat/list`);
        if (res.ok) {
            const boats = await res.json();
            
            if (boats.length > 0) {
                if (boatListContainerIndex) {
                    boatListContainerIndex.innerHTML = boats.map(boat => `<div class="swiper-slide w-[300px] md:w-[340px]">${buildBoatCardHtml(boat, true)}</div>`).join('');
                }
                
                // 모바일 세로 그리드 렌더링
                if (boatListMobileGrid) {
                    boatListMobileGrid.innerHTML = boats.map(boat => buildBoatCardHtml(boat, false)).join('');
                }

                // 통합 검색 그리드 렌더링
                if (boatListContainerSearch) {
                    boatListContainerSearch.innerHTML = boats.map(boat => buildBoatCardHtml(boat, false)).join('');
                    const countText = document.getElementById('total-boat-count') || document.querySelector('.mb-6 p.text-[13px].font-bold.text-slate-500');
                    if(countText && countText.innerText.includes('예약 가능합니다')) countText.innerText = `총 ${boats.length}척의 낚싯배가 예약 가능합니다`;
                }

                // 💡 생성된 모든 스와이퍼(부모 + 자식) 명시적 초기화 및 업데이트
                if (typeof Swiper !== 'undefined') {
                    const parentSwiperEl = document.querySelector('.boatSwiper');
                    if (parentSwiperEl && parentSwiperEl.swiper) parentSwiperEl.swiper.update();
                    
                    // 내부 이미지 스와이퍼 초기화 (DOM 생성 이후 안전하게 실행되도록 setTimeout 사용)
                    setTimeout(() => {
                        new Swiper('.innerImageSwiper', {
                            loop: true,
                            nested: true, // 가로 스크롤 충돌 방지 핵심 옵션
                            navigation: { nextEl: '.swiper-button-next', prevEl: '.swiper-button-prev' },
                            pagination: { el: '.swiper-pagination', clickable: true },
                        });
                    }, 100);
                }
            } else {
                // 💡 DB가 비었을 때 '데이터 생성' 버튼을 포함한 빈 화면 표시
                const emptyHtml = getEmptyStateHtml();
                if(boatListContainerIndex) boatListContainerIndex.innerHTML = emptyHtml;
                if(boatListMobileGrid) boatListMobileGrid.innerHTML = emptyHtml;
                if(boatListContainerSearch) boatListContainerSearch.innerHTML = emptyHtml;
            }
        }
    } catch (e) {
        console.error("DB 로딩 에러:", e);
        const errHtml = `<div class="col-span-full py-10 text-center text-rose-500 font-bold">서버 통신 중 에러가 발생했습니다.</div>`;
        if(boatListContainerIndex) boatListContainerIndex.innerHTML = errHtml;
        if(boatListMobileGrid) boatListMobileGrid.innerHTML = errHtml;
        if(boatListContainerSearch) boatListContainerSearch.innerHTML = errHtml;
    }
};

// ==========================================
// 💡 3. 찜하기 API 연동 (토스트 알림 적용)
// ==========================================
window.updateWishlistUI = async function() {
    const token = localStorage.getItem('blueanchor_token');
    if (!token) return;

    try {
        const res = await fetch(`${API_BASE_URL}/api/wishlist/my`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (res.ok) {
            const wishes = await res.json();
            const wishedBoatIds = wishes.map(w => String(w.id));
            
            const countBadge = document.getElementById('wishlistCount');
            const mobileBadge = document.getElementById('mobileWishlistCount');
            
            if (countBadge) {
                countBadge.innerText = wishedBoatIds.length;
                if (wishedBoatIds.length > 0) countBadge.classList.remove('hidden');
                else countBadge.classList.add('hidden');
            }
            if (mobileBadge) {
                mobileBadge.innerText = wishedBoatIds.length;
                if (wishedBoatIds.length > 0) mobileBadge.classList.remove('hidden');
                else mobileBadge.classList.add('hidden');
            }

            document.querySelectorAll('.wishlist-btn').forEach(btn => {
                const id = btn.getAttribute('data-boat-id');
                const icon = btn.querySelector('i');
                if(icon) {
                    icon.className = wishedBoatIds.includes(id) 
                        ? 'fa-solid fa-heart text-[22px] text-rose-500 drop-shadow-md transition-colors' 
                        : 'fa-regular fa-heart text-[22px] text-white drop-shadow-md transition-colors';
                }
            });
        }
    } catch (err) {
        console.error("Wishlist load error:", err);
    }
};

document.addEventListener("DOMContentLoaded", function() {
    document.body.addEventListener('click', async function(e) {
        const wishlistBtn = e.target.closest('.wishlist-btn');
        if(wishlistBtn) {
            e.stopPropagation();
            e.preventDefault();
            
            const boatId = wishlistBtn.getAttribute('data-boat-id');
            if(!boatId) return;

            const token = localStorage.getItem('blueanchor_token');
            if (!token) {
                showToast("로그인이 필요한 서비스입니다.");
                setTimeout(() => location.href = 'login.html', 1500);
                return;
            }

            try {
                const res = await fetch(`${API_BASE_URL}/api/wishlist/toggle`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ boat_id: parseInt(boatId) })
                });
                
                if (res.ok) {
                    const data = await res.json();
                    if (data.is_wished) {
                        showToast("❤️ 찜 목록에 추가되었습니다.");
                    } else {
                        showToast("🤍 찜하기가 취소되었습니다.");
                    }
                    window.updateWishlistUI();
                } else if (res.status === 401) {
                    showToast("로그인이 만료되었습니다.", true);
                    setTimeout(() => location.href = 'login.html', 1500);
                }
            } catch (err) {
                console.error("Wishlist toggle error:", err);
                showToast("서버 통신 중 오류가 발생했습니다.", true);
            }
        }
    });
});

window.changeCalendarMonth = changeCalendarMonth;
window.selectModalDate = selectModalDate;
window.selectCoastTab = selectCoastTab;
window.selectModalRegion = selectModalRegion;
window.changeGuest = changeGuest;
window.selectModalSpecies = selectModalSpecies;
window.openSearchModal = openSearchModal;
window.closeSearchModal = closeSearchModal;
window.applyFilters = applyFilters;
window.updateSidebarSeaCondition = updateSidebarSeaCondition;
window.changeSort = changeSort;
window.openTagModal = openTagModal;
window.closeTagModal = closeTagModal;
window.toggleTag = toggleTag;
window.resetTags = resetTags;
window.applyTags = applyTags;