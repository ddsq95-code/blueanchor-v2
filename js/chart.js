// ==========================================
// 📄 js/chart.js
// 역할: Chart.js를 이용한 조석(물때) 파동 그래프 렌더링 전담 모듈
// ==========================================

let tideChartInstance = null; // 전역 차트 인스턴스 보관용

// 차트 플러그인: 고조/저조 피크 점 찍기 및 텍스트 표시
const drawPeaksPlugin = {
    id: 'peakTides',
    afterDraw: function(chart, args, options) {
        const peakData = options.peakData; 
        if(!peakData || !peakData.length) return;
        const ctx = chart.ctx; 
        const meta = chart.getDatasetMeta(0);
        const bottomY = chart.scales.y.bottom;

        peakData.forEach(p => {
            const idx = p.idx;
            if(idx >= 0 && Math.floor(idx) < meta.data.length - 1) {
                const iF = Math.floor(idx); 
                const r = idx - iF;
                const p1 = meta.data[iF]; 
                const p2 = meta.data[iF + 1];
                
                if(p1 && p2 && p1.y !== null && p2.y !== null) {
                    const x = p1.x + r * (p2.x - p1.x); 
                    const y = p1.y + r * (p2.y - p1.y);
                    const isH = p.type === '고조'; 
                    const c = isH ? '#ef4444' : '#3b82f6'; 

                    ctx.save(); 
                    ctx.beginPath(); 
                    ctx.setLineDash([4, 4]); 
                    ctx.moveTo(x, y + 8); 
                    ctx.lineTo(x, bottomY);
                    ctx.strokeStyle = c; 
                    ctx.lineWidth = 1; 
                    ctx.stroke(); 
                    ctx.restore();
                    
                    ctx.beginPath(); 
                    ctx.arc(x, y, 6, 0, 2 * Math.PI); 
                    ctx.fillStyle = c; 
                    ctx.fill(); 
                    ctx.strokeStyle = '#fff'; 
                    ctx.lineWidth = 2.5; 
                    ctx.stroke();
                    
                    ctx.textAlign = 'center'; 
                    ctx.font = '900 13px Pretendard'; 
                    ctx.fillStyle = c; 
                    ctx.fillText(p.hgt, x, y - 38);
                    
                    if(p.diff) { 
                        ctx.font = 'bold 11px Pretendard'; 
                        ctx.fillText(p.diff, x, y - 24); 
                    }
                    ctx.font = '600 11px Pretendard'; 
                    ctx.fillStyle = '#0f172a'; 
                    ctx.fillText(p.time, x, y - 10);
                }
            }
        });
    }
};

/**
 * 통합 조석 파동 차트 렌더링 함수
 * @param {Array} labels - X축 라벨 (시간, 날짜)
 * @param {Array} dataPoints - Y축 조위 데이터 배열
 * @param {Array} peakData - 고조/저조 피크 데이터 배열
 */
function drawUnifiedTideChart(labels, dataPoints, peakData) {
    const vt = dataPoints.filter(v => v !== null && !isNaN(v));
    const minT = vt.length ? Math.min(...vt) : 0; 
    const maxT = vt.length ? Math.max(...vt) : 800;
    
    let cc = document.getElementById('tideChartContainer');
    if (!cc) return;

    const pointGap = window.innerWidth < 768 ? 15 : 40; 
    const strictWidth = Math.max(cc.parentElement.clientWidth, labels.length * pointGap);
    cc.style.width = strictWidth + "px"; 
    cc.style.minWidth = strictWidth + "px";
    
    const canvas = document.getElementById('tideChart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (tideChartInstance) tideChartInstance.destroy(); 
    
    Chart.register(drawPeaksPlugin);

    // 바다 느낌의 투명한 그라데이션 생성
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, 'rgba(6, 182, 212, 0.4)'); // 상단: 반투명 청록색
    gradient.addColorStop(1, 'rgba(6, 182, 212, 0.0)'); // 하단: 완전 투명

    tideChartInstance = new Chart(ctx, {
        type: 'line',
        data: { 
            labels: labels, 
            datasets: [{ 
                data: dataPoints, 
                borderColor: '#06b6d4', 
                borderWidth: 3, 
                tension: 0.4, 
                fill: true, 
                backgroundColor: gradient, 
                spanGaps: true, 
                pointBackgroundColor: 'transparent', 
                pointBorderColor: 'transparent',
                pointHoverBackgroundColor: '#06b6d4', 
                pointHoverBorderColor: '#fff',
                pointHoverBorderWidth: 2,
                pointHoverRadius: 6
            }] 
        },
        options: {
            responsive: true, 
            maintainAspectRatio: false, 
            layout: { padding: { top: 60, bottom: 20, left: 20, right: 20 } }, 
            scales: { 
                x: { 
                    grid: { display: false, drawBorder: false },
                    ticks: { 
                        padding: 10,
                        autoSkip: false, 
                        maxRotation: 0,
                        callback: function(value, index) {
                            const lbl = labels[index];
                            if (!lbl) return '';
                            
                            // 날짜 데이터 출력
                            if (lbl.includes('/')) return lbl;
                            
                            // 시간 텍스트 간격 조정
                            const step = window.innerWidth < 768 ? 4 : 2; 
                            if (index % step === 0) return lbl;
                            
                            return ''; 
                        },
                        color: function(context) { 
                            const lbl = labels[context.index]; 
                            if (!lbl) return '#0f172a';
                            return lbl.includes('/') ? '#ea580c' : '#94a3b8'; 
                        },
                        font: function(context) { 
                            const lbl = labels[context.index]; 
                            return (lbl && lbl.includes('/')) ? { size: 12, weight: '900' } : { size: 11, weight: '500' }; 
                        }
                    }
                }, 
                y: { display: false, min: minT - 80, max: maxT + 80 } 
            },
            plugins: { 
                legend: { display: false }, 
                peakTides: { peakData: peakData },
                tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.9)', 
                    titleFont: { size: 13, family: 'Pretendard', weight: 'bold' },
                    bodyFont: { size: 15, family: 'Pretendard', weight: '900' },
                    padding: 12,
                    cornerRadius: 10,
                    displayColors: false, 
                    callbacks: {
                        label: function(context) {
                            return '수위: ' + Math.round(context.raw) + 'cm';
                        }
                    }
                }
            },
            interaction: { mode: 'index', intersect: false }
        }
    });

    // ui.js에서 이전 인스턴스를 파기할 수 있도록 window 객체에 저장
    window.tideChartInstance = tideChartInstance;
}

// ui.js에서 호출할 수 있도록 명시적 바인딩
window.drawUnifiedTideChart = drawUnifiedTideChart;