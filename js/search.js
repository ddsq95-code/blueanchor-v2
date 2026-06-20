// ==========================================
// 📄 js/search.js
// 역할: 검색 페이지(search.html) 전용 동적 렌더링 스크립트
// ==========================================

// 현재 검색 상태를 저장하는 전역 객체
let currentParams = {};

document.addEventListener("DOMContentLoaded", () => {
    const urlParams = new URLSearchParams(window.location.search);
    const today = new Date();
    const defaultDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    
    currentParams = {
        date: urlParams.get('date') || defaultDate,
        region: urlParams.get('region') || "전체",
        species: urlParams.get('species') || "전체",
        q: "",
        sort: "recommend"
    };

    // 1. 최초 데이터 로드
    loadBoats();

    // 2. 이벤트 리스너 등록 (검색창 & 정렬)
    const searchInput = document.getElementById('searchInput');
    const sortSelect = document.getElementById('sortSelect');

    if(searchInput) {
        // 엔터키를 눌렀을 때 검색 실행
        searchInput.addEventListener('keyup', (e) => {
            if(e.key === 'Enter') {
                currentParams.q = e.target.value;
                loadBoats();
            }
        });
    }

    if(sortSelect) {
        // 정렬 조건이 변경되었을 때 즉시 로드
        sortSelect.addEventListener('change', (e) => {
            currentParams.sort = e.target.value;
            loadBoats();
        });
    }
});

async function loadBoats() {
    const container = document.getElementById('boatListContainer');
    const countEl = document.getElementById('totalBoatCount');
    const dateDisp = document.getElementById('searchDateDisplay');
    const regionDisp = document.getElementById('searchRegionDisplay');
    const speciesDisp = document.getElementById('searchSpeciesDisplay');
    
    // 필터 요약바 업데이트
    if(dateDisp) {
        const formattedDate = currentParams.date.replace(/-/g, '. ');
        dateDisp.innerText = formattedDate;
    }
    if(regionDisp) regionDisp.innerText = currentParams.region;
    if(speciesDisp) speciesDisp.innerText = currentParams.species;
    
    try {
        // API 쿼리 파라미터 조립
        let url = '/api/boats/list';
        const queryParams = new URLSearchParams();
        if (currentParams.region !== "전체") queryParams.append("region", currentParams.region);
        if (currentParams.species !== "전체") queryParams.append("species", currentParams.species);
        if (currentParams.q) queryParams.append("q", currentParams.q);
        queryParams.append("date", currentParams.date);
        queryParams.append("sort", currentParams.sort);
        
        url += '?' + queryParams.toString();

        // 백엔드 요청
        const res = await fetch(url);
        if(!res.ok) throw new Error("API 연동 에러");
        const data = await res.json();
        
        if(countEl) countEl.innerText = data.total;
        
        if(data.boats.length === 0) {
            container.innerHTML = `
                <div class="col-span-full py-32 flex flex-col items-center text-center">
                    <i class="fa-solid fa-ship text-6xl text-slate-200 mb-4"></i>
                    <p class="text-slate-500 font-bold text-lg">해당 조건에 맞는 선사가 없습니다.</p>
                    <p class="text-slate-400 text-sm mt-1">검색어를 지우거나 조건을 변경해 보세요.</p>
                </div>
            `;
            return;
        }

        // 카드 렌더링 (상세 페이지 이동 시 .html 확장자를 포함하도록 수정됨)
        container.innerHTML = data.boats.map(boat => {
            const remain = boat.max_capacity - boat.current_booking;
            const statusClass = remain <= 3 ? 'bg-rose-50 border-rose-100 text-rose-500' : 'bg-slate-50 border-slate-200 text-slate-500';
            const badgeClass = boat.status === '마감임박' ? 'bg-rose-500 animate-pulse' : 'bg-amber-500';
            
            return `
                <div onclick="location.href='/detail.html?id=${boat.id}'" class="bg-white h-full rounded-2xl overflow-hidden shadow-sm border border-slate-200 hover:shadow-lg transition-all flex flex-col relative group cursor-pointer">
                    <div class="relative aspect-[4/3] bg-slate-100 overflow-hidden">
                        <img src="${boat.image}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300">
                        <div class="absolute top-3 left-3 flex gap-1.5 z-10">
                            <span class="bg-blue-600 text-white text-[11px] font-black px-2.5 py-1 rounded-md shadow-sm">실시간예약</span>
                            <span class="${badgeClass} text-white text-[11px] font-black px-2.5 py-1 rounded-md shadow-sm">${boat.status}</span>
                        </div>
                        <button type="button" class="wishlist-btn absolute top-3 right-3 text-white/90 hover:text-rose-500 transition-colors drop-shadow-md text-2xl z-20" data-boat-id="${boat.id}"><i class="fa-regular fa-heart"></i></button>
                        <span class="absolute bottom-3 right-3 bg-slate-900/80 backdrop-blur-sm text-white text-[11px] font-bold px-2 py-1 rounded shadow-sm tracking-wide"><i class="fa-solid fa-anchor text-[9px] mr-0.5"></i> ${boat.tons} / ${boat.max_capacity}명</span>
                    </div>
                    <div class="p-4 flex-1 flex flex-col">
                        <div class="flex items-center justify-between mb-0.5">
                            <div class="flex items-center gap-1.5 overflow-hidden">
                                <h3 class="font-black text-base text-slate-800 truncate">${boat.name}</h3>
                            </div>
                            <span class="${statusClass} text-[11px] font-black px-2 py-0.5 rounded border shrink-0"><i class="fa-solid fa-user-group text-[9px]"></i> 잔여 ${remain}석</span>
                        </div>
                        <div class="flex items-center gap-1 mb-3">
                            <i class="fa-solid fa-star text-amber-400 text-[11px]"></i><span class="text-xs font-bold text-slate-700">${boat.rating}</span><span class="text-[11px] font-medium text-slate-400 underline">(${boat.review_count})</span>
                        </div>
                        <div class="flex flex-col gap-1.5 mb-3.5 mt-1">
                            <div class="flex items-center text-xs"><span class="bg-slate-100 text-slate-500 text-[10px] font-black px-1.5 py-0.5 rounded mr-2 shrink-0">위치</span><span class="font-bold text-slate-700 truncate">${boat.region} ${boat.port}</span></div>
                        </div>
                        <div class="flex flex-wrap gap-1 mb-4 mt-auto">
                            ${boat.species.map(s => `<span class="border border-slate-200 text-slate-500 text-[10px] font-bold px-2 py-0.5 rounded-full">${s}</span>`).join('')}
                        </div>
                        <div class="pt-3 border-t border-slate-100 flex items-center justify-between">
                            <span class="text-[11px] text-slate-400 font-bold">1인 대여기준</span><span class="font-black text-base text-slate-900">${boat.price.toLocaleString()}원</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        // 하트 버튼 아이콘 동기화 로직 (목록이 다시 그려진 후 UI 업데이트 호출)
        if(typeof window.updateWishlistUI === 'function') {
            window.updateWishlistUI();
        }

    } catch (err) {
        console.error(err);
        container.innerHTML = `<div class="col-span-full py-20 text-center text-rose-500 font-bold">서버와 통신 중 문제가 발생했습니다.</div>`;
    }
}