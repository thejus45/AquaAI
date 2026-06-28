/* ==============================================
   AQUAAI — AI Water Quality Prediction Engine
   Weighted WQI Model · Chart.js Visualizations
   ============================================== */

'use strict';

// =============================================
// PARAMETER CONFIGURATION
// WHO/BIS Standard reference values & weights
// =============================================
const PARAMS_CONFIG = {
    ph: { ideal: 7.0, min: 6.5, max: 8.5, weight: 0.122, label: 'pH', unit: '' },
    turbidity: { ideal: 0, min: 0, max: 1, weight: 0.104, label: 'Turbidity', unit: 'NTU' },
    tds: { ideal: 0, min: 0, max: 500, weight: 0.095, label: 'TDS', unit: 'mg/L' },
    hardness: { ideal: 0, min: 0, max: 300, weight: 0.072, label: 'Hardness', unit: 'mg/L' },
    do: { ideal: 10, min: 6, max: 14, weight: 0.118, label: 'DO', unit: 'mg/L', inverse: true },
    conductivity: { ideal: 0, min: 0, max: 1500, weight: 0.070, label: 'Conductivity', unit: 'µS/cm' },
    nitrates: { ideal: 0, min: 0, max: 10, weight: 0.110, label: 'Nitrates', unit: 'mg/L' },
    chlorides: { ideal: 0, min: 0, max: 250, weight: 0.065, label: 'Chlorides', unit: 'mg/L' },
    sulfates: { ideal: 0, min: 0, max: 250, weight: 0.065, label: 'Sulfates', unit: 'mg/L' },
    iron: { ideal: 0, min: 0, max: 0.3, weight: 0.068, label: 'Iron', unit: 'mg/L' },
    temperature: { ideal: 25, min: 20, max: 30, weight: 0.043, label: 'Temperature', unit: '°C' },
    coliform: { ideal: 0, min: 0, max: 0, weight: 0.068, label: 'Coliform', unit: 'MPN/100ml' }
};

const WQI_CLASSES = [
    { label: 'Excellent', min: 0, max: 25, color: '#00e5b0', cls: 'excellent', emoji: '🟢' },
    { label: 'Good', min: 25, max: 50, color: '#80d830', cls: 'good', emoji: '🟡' },
    { label: 'Poor', min: 50, max: 75, color: '#ffc830', cls: 'poor', emoji: '🟠' },
    { label: 'Very Poor', min: 75, max: 100, color: '#ff7730', cls: 'vpoor', emoji: '🔴' },
    { label: 'Unfit', min: 100, max: Infinity, color: '#ff3355', cls: 'unfit', emoji: '⛔' }
];

// =============================================
// PRESET SCENARIOS
// =============================================
const PRESETS = {
    ground: {
        ph: 7.2, turbidity: 1.4, tds: 420, hardness: 240, do: 5.8,
        conductivity: 820, nitrates: 7.5, chlorides: 180, sulfates: 120,
        iron: 0.22, temperature: 24, coliform: 2
    },
    river: {
        ph: 7.8, turbidity: 8.5, tds: 680, hardness: 195, do: 4.2,
        conductivity: 1100, nitrates: 14.2, chlorides: 210, sulfates: 95,
        iron: 0.55, temperature: 28, coliform: 18
    },
    municipal: {
        ph: 7.1, turbidity: 0.3, tds: 180, hardness: 95, do: 8.5,
        conductivity: 310, nitrates: 2.1, chlorides: 55, sulfates: 40,
        iron: 0.04, temperature: 23, coliform: 0
    },
    industrial: {
        ph: 4.8, turbidity: 15.0, tds: 1650, hardness: 480, do: 1.8,
        conductivity: 2600, nitrates: 32.5, chlorides: 420, sulfates: 380,
        iron: 1.8, temperature: 38, coliform: 55
    }
};

// =============================================
// STATE
// =============================================
let chartRadar = null;
let chartDonut = null;
let chartTrend = null;
let trendPeriod = 7;
let lastWQI = 0;
let lastScores = {};

// =============================================
// CANVAS WAVE ANIMATION
// =============================================
(function initCanvas() {
    const canvas = document.getElementById('heroCanvas');
    const ctx = canvas.getContext('2d');
    let W, H, particles = [], time = 0;

    function resize() {
        W = canvas.width = window.innerWidth;
        H = canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    // Create particles
    for (let i = 0; i < 60; i++) {
        particles.push({
            x: Math.random() * 1500,
            y: Math.random() * 900,
            r: Math.random() * 2.5 + 0.5,
            vx: (Math.random() - 0.5) * 0.3,
            vy: (Math.random() - 0.5) * 0.3,
            alpha: Math.random() * 0.4 + 0.1
        });
    }

    function drawWave(y, amplitude, freq, offset, color) {
        ctx.beginPath();
        ctx.moveTo(0, H);
        for (let x = 0; x <= W; x += 4) {
            const wave = amplitude * Math.sin((x * freq) + time + offset);
            ctx.lineTo(x, y + wave);
        }
        ctx.lineTo(W, H);
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
    }

    function animate() {
        ctx.clearRect(0, 0, W, H);

        // Radial glow
        const grad = ctx.createRadialGradient(W * 0.3, H * 0.3, 0, W * 0.3, H * 0.3, W * 0.6);
        grad.addColorStop(0, 'rgba(0, 100, 220, 0.08)');
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);

        const grad2 = ctx.createRadialGradient(W * 0.75, H * 0.6, 0, W * 0.75, H * 0.6, W * 0.5);
        grad2.addColorStop(0, 'rgba(0, 200, 180, 0.05)');
        grad2.addColorStop(1, 'transparent');
        ctx.fillStyle = grad2;
        ctx.fillRect(0, 0, W, H);

        // Waves
        drawWave(H * 0.72, 28, 0.004, 0, 'rgba(0, 100, 255, 0.06)');
        drawWave(H * 0.74, 22, 0.006, 2, 'rgba(0, 160, 255, 0.05)');
        drawWave(H * 0.78, 18, 0.008, 4, 'rgba(0, 200, 200, 0.04)');
        drawWave(H * 0.82, 14, 0.005, 1, 'rgba(0, 80, 200, 0.04)');

        // Particles
        particles.forEach(p => {
            ctx.beginPath();
            ctx.arc(p.x % W, p.y % H, p.r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(0, 200, 255, ${p.alpha})`;
            ctx.fill();
            p.x += p.vx; p.y += p.vy;
        });

        time += 0.012;
        requestAnimationFrame(animate);
    }
    animate();
})();

// =============================================
// SLIDER SYNC
// =============================================
function syncValue(param) {
    const sl = document.getElementById(`sl-${param}`);
    const val = document.getElementById(`val-${param}`);
    val.value = sl.value;
    updateSliderFill(param);
    updateParamDot(param, parseFloat(sl.value));
    livePredict();
}

function syncSlider(param) {
    const sl = document.getElementById(`sl-${param}`);
    const val = document.getElementById(`val-${param}`);
    const v = parseFloat(val.value);
    const min = parseFloat(sl.min), max = parseFloat(sl.max);
    if (!isNaN(v)) {
        sl.value = Math.min(Math.max(v, min), max);
        updateSliderFill(param);
        updateParamDot(param, parseFloat(sl.value));
        livePredict();
    }
}

function updateSliderFill(param) {
    const sl = document.getElementById(`sl-${param}`);
    const pct = ((sl.value - sl.min) / (sl.max - sl.min)) * 100;
    sl.style.setProperty('--val', pct + '%');
    sl.style.background = `linear-gradient(to right, var(--c-primary) ${pct}%, rgba(255,255,255,0.08) ${pct}%)`;
}

function updateParamDot(param, value) {
    const dot = document.getElementById(`dot-${param}`);
    if (!dot) return;
    const cfg = PARAMS_CONFIG[param];
    const status = getParamStatus(param, value, cfg);
    dot.className = 'param-status-dot ' + (status === 'ok' ? 'ok' : status === 'warn' ? 'warn' : 'bad');
}

function getParamStatus(param, value, cfg) {
    if (param === 'ph') {
        if (value >= 6.5 && value <= 8.5) return 'ok';
        if (value >= 6.0 && value <= 9.0) return 'warn';
        return 'bad';
    }
    if (param === 'do') {
        if (value >= 6) return 'ok';
        if (value >= 4) return 'warn';
        return 'bad';
    }
    if (param === 'temperature') {
        if (value >= 20 && value <= 30) return 'ok';
        if (value >= 15 && value <= 35) return 'warn';
        return 'bad';
    }
    if (param === 'coliform') {
        if (value === 0) return 'ok';
        if (value <= 5) return 'warn';
        return 'bad';
    }
    const ratio = value / cfg.max;
    if (ratio <= 0.5) return 'ok';
    if (ratio <= 0.85) return 'warn';
    return 'bad';
}

// =============================================
// AI WQI ENGINE
// =============================================
function computeSubIndex(param, value) {
    const cfg = PARAMS_CONFIG[param];

    if (param === 'ph') {
        if (value >= 6.5 && value <= 8.5) return 0;
        const deviation = value < 6.5 ? (6.5 - value) : (value - 8.5);
        return Math.min(100, (deviation / 3) * 100);
    }
    if (param === 'do') {
        if (value >= 6) return 0;
        if (value <= 0) return 100;
        return ((6 - value) / 6) * 100;
    }
    if (param === 'temperature') {
        if (value >= 20 && value <= 30) return 0;
        const dev = value < 20 ? (20 - value) : (value - 30);
        return Math.min(100, (dev / 15) * 100);
    }
    if (param === 'coliform') {
        if (value === 0) return 0;
        return Math.min(100, 30 + (value / 100) * 70);
    }
    // For upper-bounded params
    const ratio = value / cfg.max;
    return Math.min(100, ratio * 80 + (ratio > 1 ? 20 : 0));
}

function computeWQI(values) {
    let wqi = 0;
    const scores = {};
    Object.keys(PARAMS_CONFIG).forEach(param => {
        const cfg = PARAMS_CONFIG[param];
        const val = values[param];
        const si = computeSubIndex(param, val);
        scores[param] = si;
        wqi += si * cfg.weight;
    });
    return { wqi: Math.round(wqi * 10) / 10, scores };
}

function getWQIClass(wqi) {
    return WQI_CLASSES.find(c => wqi >= c.min && wqi < c.max) || WQI_CLASSES[4];
}

function getCurrentValues() {
    const v = {};
    Object.keys(PARAMS_CONFIG).forEach(p => {
        v[p] = parseFloat(document.getElementById(`val-${p}`).value) || 0;
    });
    return v;
}

// =============================================
// LIVE PREDICT (lightweight, on slider move)
// =============================================
function livePredict() {
    const values = getCurrentValues();
    const { wqi, scores } = computeWQI(values);
    lastWQI = wqi;
    lastScores = scores;
    updateNavBadge(wqi);
}

// =============================================
// FULL PREDICTION (on button click)
// =============================================
function runPrediction() {
    const btn = document.getElementById('predictBtn');
    btn.style.transform = 'scale(0.98)';
    setTimeout(() => btn.style.transform = '', 200);

    const values = getCurrentValues();
    const { wqi, scores } = computeWQI(values);
    lastWQI = wqi;
    lastScores = scores;
    const cls = getWQIClass(wqi);

    animateGauge(wqi, cls);
    updateParamStatus(values, scores);
    updateNavBadge(wqi);
    renderRadarChart(scores);
    renderDonutChart(values, scores);
    renderTrendChart(wqi);
    renderRecommendations(values, scores, cls);

    // Smooth scroll to results
    setTimeout(() => document.getElementById('results').scrollIntoView({ behavior: 'smooth', block: 'start' }), 300);
}

// =============================================
// GAUGE ANIMATION
// =============================================
function animateGauge(wqi, cls) {
    const arc = document.getElementById('gaugeArc');
    const needle = document.getElementById('gaugeNeedle');
    const score = document.getElementById('gaugeScore');
    const badge = document.getElementById('wqiBadge');

    const maxWQI = 120;
    const pct = Math.min(wqi / maxWQI, 1);
    const arcLen = 283;
    const offset = arcLen - pct * arcLen;
    const needleAngle = -90 + pct * 180;

    arc.style.strokeDashoffset = offset;
    needle.style.transform = `rotate(${needleAngle}deg)`;

    // Animate number
    const startVal = parseInt(score.textContent) || 0;
    const endVal = wqi;
    const dur = 800, startTime = performance.now();
    function tick(now) {
        const t = Math.min((now - startTime) / dur, 1);
        const ease = 1 - Math.pow(1 - t, 3);
        score.textContent = (startVal + (endVal - startVal) * ease).toFixed(1);
        if (t < 1) requestAnimationFrame(tick);
        else score.textContent = endVal.toFixed(1);
    }
    requestAnimationFrame(tick);

    score.style.color = cls.color;
    badge.textContent = `${cls.emoji} ${cls.label}`;
    badge.style.background = cls.color + '18';
    badge.style.borderColor = cls.color + '50';
    badge.style.color = cls.color;
}

// =============================================
// PARAM STATUS BARS
// =============================================
function updateParamStatus(values, scores) {
    Object.keys(PARAMS_CONFIG).forEach(param => {
        const si = scores[param];
        const val = values[param];
        const cfg = PARAMS_CONFIG[param];
        const fill = document.getElementById(`psf-${param}`);
        const psVal = document.getElementById(`psv-${param}`);
        if (!fill || !psVal) return;

        // Display value with unit
        const unit = cfg.unit;
        psVal.textContent = `${val}${unit ? ' ' + unit : ''}`;

        // Bar width = sub-index severity (0=clean, 100=terrible)
        const pct = Math.min(si, 100);
        fill.style.width = pct + '%';
        // Color
        const color = si < 25 ? '#00e5b0' : si < 50 ? '#80d830' : si < 75 ? '#ffc830' : si < 90 ? '#ff7730' : '#ff3355';
        fill.style.background = color;
        fill.style.boxShadow = `0 0 6px ${color}`;
    });
}

// =============================================
// NAV BADGE
// =============================================
function updateNavBadge(wqi) {
    const dot = document.getElementById('navWqiDot');
    const label = document.getElementById('navWqiLabel');
    const cls = getWQIClass(wqi);
    dot.style.background = cls.color;
    label.textContent = `WQI ${wqi.toFixed(1)} · ${cls.label}`;
}

// =============================================
// CHART.JS — RADAR
// =============================================
function renderRadarChart(scores) {
    const ctx = document.getElementById('radarChart');
    const labels = Object.keys(PARAMS_CONFIG).map(p => PARAMS_CONFIG[p].label);
    // Compliance = 100 - sub-index score (higher = more compliant)
    const data = Object.keys(PARAMS_CONFIG).map(p => Math.max(0, 100 - scores[p]));

    if (chartRadar) chartRadar.destroy();
    chartRadar = new Chart(ctx, {
        type: 'radar',
        data: {
            labels,
            datasets: [{
                label: 'Compliance %',
                data,
                borderColor: '#00c8ff',
                backgroundColor: 'rgba(0, 200, 255, 0.12)',
                borderWidth: 2,
                pointBackgroundColor: data.map(v => v > 75 ? '#00e5b0' : v > 50 ? '#ffc830' : '#ff3355'),
                pointBorderColor: 'transparent',
                pointRadius: 4,
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            scales: {
                r: {
                    min: 0, max: 100,
                    grid: { color: 'rgba(255,255,255,0.06)' },
                    angleLines: { color: 'rgba(255,255,255,0.06)' },
                    ticks: { color: '#4a7090', font: { size: 9 }, stepSize: 25, backdropColor: 'transparent' },
                    pointLabels: { color: '#8ab4cc', font: { size: 10, family: 'Inter' } }
                }
            },
            plugins: { legend: { display: false } },
            animation: { duration: 800, easing: 'easeInOutQuart' }
        }
    });
}

// =============================================
// CHART.JS — DONUT
// =============================================
function renderDonutChart(values, scores) {
    const ctx = document.getElementById('donutChart');
    const legend = document.getElementById('donutLegend');

    // Group parameters by contamination severity
    const groups = {
        'Within Limits': { val: 0, color: '#00e5b0' },
        'Slightly High': { val: 0, color: '#80d830' },
        'Elevated': { val: 0, color: '#ffc830' },
        'Critical': { val: 0, color: '#ff3355' }
    };
    Object.keys(scores).forEach(p => {
        const si = scores[p];
        if (si < 25) groups['Within Limits'].val++;
        else if (si < 50) groups['Slightly High'].val++;
        else if (si < 75) groups['Elevated'].val++;
        else groups['Critical'].val++;
    });

    const labels = Object.keys(groups).filter(k => groups[k].val > 0);
    const data = labels.map(k => groups[k].val);
    const colors = labels.map(k => groups[k].color);

    if (chartDonut) chartDonut.destroy();
    chartDonut = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels,
            datasets: [{ data, backgroundColor: colors.map(c => c + 'cc'), borderColor: colors, borderWidth: 1.5, hoverOffset: 8 }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            cutout: '68%',
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: ctx => ` ${ctx.raw} parameter${ctx.raw > 1 ? 's' : ''}`
                    }
                }
            },
            animation: { duration: 800, easing: 'easeInOutQuart' }
        }
    });

    // Custom legend
    legend.innerHTML = labels.map((l, i) =>
        `<div class="donut-legend-item"><div class="donut-legend-dot" style="background:${colors[i]}"></div>${l} (${data[i]})</div>`
    ).join('');
}

// =============================================
// CHART.JS — TREND LINE
// =============================================
function renderTrendChart(currentWQI) {
    const ctx = document.getElementById('trendChart');
    const { labels, data } = generateTrendData(currentWQI, trendPeriod);
    const avg = (data.reduce((a, b) => a + b, 0) / data.length).toFixed(1);
    const min = Math.min(...data).toFixed(1);
    const max = Math.max(...data).toFixed(1);

    document.getElementById('trendAvg').textContent = avg;
    document.getElementById('trendMin').textContent = min;
    document.getElementById('trendMax').textContent = max;

    if (chartTrend) chartTrend.destroy();
    chartTrend = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [
                {
                    label: 'WQI Score',
                    data,
                    borderColor: '#00c8ff',
                    backgroundColor: (ctx2) => {
                        const canvas = ctx2.chart.ctx;
                        const grad = canvas.createLinearGradient(0, 0, 0, 280);
                        grad.addColorStop(0, 'rgba(0, 200, 255, 0.25)');
                        grad.addColorStop(1, 'rgba(0, 200, 255, 0.01)');
                        return grad;
                    },
                    borderWidth: 2.5,
                    fill: true,
                    pointRadius: 3,
                    pointBackgroundColor: '#00c8ff',
                    pointBorderColor: 'transparent',
                    tension: 0.45
                },
                {
                    label: 'Safe Threshold',
                    data: new Array(data.length).fill(50),
                    borderColor: 'rgba(255, 200, 48, 0.4)',
                    borderWidth: 1.5,
                    borderDash: [6, 4],
                    pointRadius: 0,
                    fill: false,
                    tension: 0
                }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            scales: {
                x: {
                    grid: { color: 'rgba(255,255,255,0.04)' },
                    ticks: { color: '#4a7090', font: { size: 10 }, maxRotation: 0 }
                },
                y: {
                    min: 0, max: Math.max(100, Math.max(...data) + 10),
                    grid: { color: 'rgba(255,255,255,0.04)' },
                    ticks: { color: '#4a7090', font: { size: 10 } }
                }
            },
            plugins: {
                legend: {
                    labels: { color: '#8ab4cc', font: { size: 11 }, boxWidth: 20 }
                }
            },
            animation: { duration: 800, easing: 'easeInOutQuart' }
        }
    });
}

function generateTrendData(currentWQI, days) {
    const now = new Date(2026, 1, 24); // Using established date
    const labels = [], data = [];
    for (let i = days - 1; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const label = days <= 7
            ? d.toLocaleDateString('en', { weekday: 'short', day: 'numeric' })
            : d.toLocaleDateString('en', { month: 'short', day: 'numeric' });
        labels.push(label);
        // Simulate fluctuation ±15% around current WQI
        const noise = (Math.sin(i * 1.3) * 0.12 + Math.cos(i * 0.7) * 0.08) * currentWQI;
        const variation = (Math.random() - 0.5) * 0.06 * currentWQI;
        data.push(Math.max(0, Math.round((currentWQI + noise + variation) * 10) / 10));
    }
    return { labels, data };
}

function setTrendPeriod(days, btn) {
    trendPeriod = days;
    document.querySelectorAll('.trend-tab').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
    if (lastWQI > 0) renderTrendChart(lastWQI);
}

// =============================================
// RECOMMENDATIONS ENGINE
// =============================================
const REC_RULES = {
    ph: {
        check: v => v < 6.5 || v > 8.5,
        severity: v => (v < 5.5 || v > 9.5) ? 'danger' : 'warn',
        icon: '⚗️',
        title: 'pH Imbalance',
        text: v => v < 6.5
            ? `pH of ${v} is acidic — may corrode pipes, mobilize heavy metals, and taste sour.`
            : `pH of ${v} is alkaline — affects taste and may indicate mineral contamination.`,
        action: v => v < 6.5 ? 'Add lime or soda ash to raise pH to 6.5–8.5 range' : 'Add CO₂ or citric acid to reduce alkalinity'
    },
    turbidity: {
        check: v => v > 1,
        severity: v => v > 10 ? 'danger' : v > 4 ? 'warn' : 'info',
        icon: '🌫️',
        title: 'High Turbidity',
        text: v => `Turbidity of ${v} NTU (limit: 1 NTU) indicates suspended particles, sediment, or biological matter.`,
        action: () => 'Apply coagulation + flocculation followed by sand/multimedia filtration'
    },
    tds: {
        check: v => v > 500,
        severity: v => v > 1200 ? 'danger' : v > 800 ? 'warn' : 'info',
        icon: '🧪',
        title: 'Elevated TDS',
        text: v => `TDS of ${v} mg/L exceeds WHO limit (500 mg/L) — indicates high mineral/salt content.`,
        action: () => 'Reverse Osmosis (RO) or nanofiltration recommended'
    },
    hardness: {
        check: v => v > 300,
        severity: v => v > 500 ? 'danger' : 'warn',
        icon: '🪨',
        title: 'Excessive Hardness',
        text: v => `Water hardness of ${v} mg/L (limit: 300 mg/L) causes scale buildup and affects lathering.`,
        action: () => 'Ion exchange water softening or lime-soda softening'
    },
    do: {
        check: v => v < 6,
        severity: v => v < 3 ? 'danger' : 'warn',
        icon: '💨',
        title: 'Low Dissolved Oxygen',
        text: v => `DO of ${v} mg/L is below safe drinking threshold (6 mg/L), indicating organic pollution risk.`,
        action: () => 'Aeration treatment — cascade aerators or diffused air system'
    },
    conductivity: {
        check: v => v > 1500,
        severity: v => v > 2500 ? 'danger' : 'warn',
        icon: '⚡',
        title: 'High Conductivity',
        text: v => `Conductivity of ${v} µS/cm (limit: 1500) signals high ionic content — likely salts or heavy metals.`,
        action: () => 'Investigate source contamination; apply demineralization'
    },
    nitrates: {
        check: v => v > 10,
        severity: v => v > 20 ? 'danger' : 'warn',
        icon: '🌿',
        title: 'Nitrate Contamination',
        text: v => `Nitrate level ${v} mg/L exceeds WHO limit (10 mg/L) — agricultural runoff suspected. Risk of methemoglobinemia.`,
        action: () => 'Ion exchange or biological denitrification; switch to alternate source'
    },
    chlorides: {
        check: v => v > 250,
        severity: v => v > 400 ? 'danger' : 'info',
        icon: '🧂',
        title: 'Elevated Chlorides',
        text: v => `Chloride at ${v} mg/L exceeds limit (250 mg/L), causing salty taste and pipe corrosion.`,
        action: () => 'Reverse osmosis or electrodialysis for desalination'
    },
    sulfates: {
        check: v => v > 250,
        severity: v => v > 400 ? 'danger' : 'info',
        icon: '☁️',
        title: 'Elevated Sulfates',
        text: v => `Sulfate at ${v} mg/L (limit: 250 mg/L) may cause laxative effects and pipe corrosion.`,
        action: () => 'Ion exchange or nanofiltration treatment'
    },
    iron: {
        check: v => v > 0.3,
        severity: v => v > 1 ? 'danger' : 'warn',
        icon: '🔩',
        title: 'Iron Contamination',
        text: v => `Iron at ${v} mg/L (limit: 0.3 mg/L) causes metallic taste, staining, and pipe corrosion.`,
        action: () => 'Aeration + oxidation + sand filtration or greensand filtration'
    },
    temperature: {
        check: v => v < 20 || v > 30,
        severity: v => (v < 10 || v > 40) ? 'danger' : 'info',
        icon: '🌡️',
        title: 'Abnormal Temperature',
        text: v => v > 30
            ? `Temperature of ${v}°C accelerates microbial growth and chemical reactions.`
            : `Temperature of ${v}°C may indicate industrial cooling discharge.`,
        action: () => 'Monitor source; ensure proper storage and distribution insulation'
    },
    coliform: {
        check: v => v > 0,
        severity: v => v > 10 ? 'danger' : 'warn',
        icon: '🦠',
        title: 'Coliform Detected',
        text: v => `Coliform count of ${v} MPN/100ml (MUST be 0) — indicates fecal contamination. IMMEDIATE ACTION REQUIRED.`,
        action: () => 'Disinfect with chlorination (0.5 mg/L residual), UV treatment, or boiling'
    }
};

function renderRecommendations(values, scores, wqiClass) {
    const grid = document.getElementById('recsGrid');
    grid.innerHTML = '';

    const alerts = [];
    Object.keys(REC_RULES).forEach(param => {
        const rule = REC_RULES[param];
        const val = values[param];
        if (rule.check(val)) {
            alerts.push({ param, rule, val, si: scores[param] });
        }
    });

    // Sort: most severe first
    alerts.sort((a, b) => b.si - a.si);

    if (alerts.length === 0) {
        grid.innerHTML = `
      <div class="rec-card success" style="grid-column: 1 / -1; text-align:center; padding: 40px;">
        <div style="font-size:2rem; margin-bottom:12px;">✅</div>
        <div style="font-weight:700; font-size:1.1rem; color:#00e5b0; margin-bottom:8px;">All Parameters Within Safe Limits</div>
        <div style="color:var(--c-text2); font-size:0.9rem;">This water sample meets WHO/BIS drinking water standards across all 12 measured parameters.</div>
      </div>`;
        return;
    }

    // Overall summary card
    const summaryCard = document.createElement('div');
    summaryCard.className = `rec-card ${wqiClass.cls === 'unfit' || wqiClass.cls === 'vpoor' ? 'danger' : wqiClass.cls === 'poor' ? 'warn' : 'info'}`;
    summaryCard.style.gridColumn = '1 / -1';
    summaryCard.innerHTML = `
    <div class="rec-card-header">
      <span class="rec-icon">${wqiClass.emoji}</span>
      <span class="rec-param">AI Assessment: ${wqiClass.label} Water Quality (WQI ${lastWQI})</span>
    </div>
    <p class="rec-text">${alerts.length} parameter${alerts.length > 1 ? 's' : ''} out of compliance. ${wqiClass.cls === 'unfit' ? '⚠️ This water is NOT SAFE for drinking without comprehensive treatment.' :
            wqiClass.cls === 'vpoor' ? 'Major treatment required before consumption.' :
                wqiClass.cls === 'poor' ? 'Moderate treatment recommended.' :
                    'Minor treatment may improve quality.'
        }</p>
  `;
    grid.appendChild(summaryCard);

    alerts.forEach((alert, idx) => {
        const { param, rule, val } = alert;
        const sev = rule.severity(val);
        const card = document.createElement('div');
        card.className = `rec-card ${sev}`;
        card.style.animationDelay = `${idx * 0.08}s`;
        const dotColor = sev === 'danger' ? '#ff3355' : sev === 'warn' ? '#ffc830' : '#00c8ff';
        card.innerHTML = `
      <div class="rec-card-header">
        <span class="rec-icon">${rule.icon}</span>
        <span class="rec-param">${rule.title}</span>
        <span class="rec-severity ${sev}">${sev === 'danger' ? 'Critical' : sev === 'warn' ? 'Warning' : 'Notice'}</span>
      </div>
      <p class="rec-text">${rule.text(val)}</p>
      <div class="rec-action">
        <div class="rec-action-dot" style="background:${dotColor}"></div>
        ${rule.action(val)}
      </div>
    `;
        grid.appendChild(card);
    });
}

// =============================================
// LOAD PRESET
// =============================================
function loadPreset(name) {
    const preset = PRESETS[name];
    Object.keys(preset).forEach(param => {
        const sl = document.getElementById(`sl-${param}`);
        const valEl = document.getElementById(`val-${param}`);
        if (sl && valEl) {
            valEl.value = preset[param];
            sl.value = preset[param];
            updateSliderFill(param);
            updateParamDot(param, preset[param]);
        }
    });

    // Highlight selected preset
    document.querySelectorAll('.preset-card').forEach(c => c.style.borderColor = '');
    const activeCard = document.getElementById(`preset-${name}`);
    if (activeCard) {
        activeCard.style.borderColor = 'var(--c-primary)';
        activeCard.style.boxShadow = 'var(--shadow-glow)';
        setTimeout(() => {
            if (activeCard) activeCard.style.borderColor = '';
            if (activeCard) activeCard.style.boxShadow = '';
        }, 2000);
    }

    livePredict();
    setTimeout(() => runPrediction(), 200);
}

// =============================================
// RESET
// =============================================
function resetValues() {
    const defaults = {
        ph: 7.0, turbidity: 0.5, tds: 250, hardness: 120, do: 8.0,
        conductivity: 400, nitrates: 3.0, chlorides: 80, sulfates: 60,
        iron: 0.1, temperature: 25, coliform: 0
    };
    Object.keys(defaults).forEach(param => {
        const sl = document.getElementById(`sl-${param}`);
        const valEl = document.getElementById(`val-${param}`);
        if (sl && valEl) {
            valEl.value = defaults[param];
            sl.value = defaults[param];
            updateSliderFill(param);
            updateParamDot(param, defaults[param]);
        }
    });
    // Reset nav badge
    const dot = document.getElementById('navWqiDot');
    const label = document.getElementById('navWqiLabel');
    dot.style.background = 'var(--c-text3)';
    label.textContent = '—';
    livePredict();
}

// =============================================
// NAVBAR SCROLL
// =============================================
window.addEventListener('scroll', () => {
    const navbar = document.getElementById('navbar');
    if (window.scrollY > 50) {
        navbar.style.background = 'rgba(4, 8, 15, 0.92)';
    } else {
        navbar.style.background = 'rgba(4, 8, 15, 0.75)';
    }
});

// =============================================
// INIT
// =============================================
document.addEventListener('DOMContentLoaded', () => {
    // Initialize all slider fills and dots on load
    Object.keys(PARAMS_CONFIG).forEach(param => {
        updateSliderFill(param);
        const val = parseFloat(document.getElementById(`val-${param}`).value);
        updateParamDot(param, val);
    });
    livePredict();
});
