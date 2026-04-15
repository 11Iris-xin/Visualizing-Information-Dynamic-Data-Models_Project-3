/* ══════════════════════════════════════
   PawInsight Mobile — app.js
   ══════════════════════════════════════ */

/* ════════════════════════════════════════
   LANDING PAGE LOGIC
   ════════════════════════════════════════ */

let currentScreen = 'splash';

// Auto-transition from splash after 1.8s
window.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    goToScreen('ob1');
  }, 1800);

  // Set default datetime for log form
  const timeInput = document.getElementById('timeInput');
  if (timeInput) {
    timeInput.value = new Date().toISOString().slice(0, 16);
  }
});

function goToScreen(id) {
  const current = document.querySelector('.lp-screen.active');
  const next = document.getElementById(id);
  if (!next || current === next) return;

  // Exit current
  current.classList.add('exit');
  current.classList.remove('active');
  setTimeout(() => {
    current.classList.remove('exit');
    current.style.display = 'none';
  }, 400);

  // Bring in next
  next.style.display = '';
  // Force reflow
  void next.offsetWidth;
  next.classList.add('active');
  currentScreen = id;
}

function startApp() {
  const landingView = document.getElementById('landing-view');
  const appView = document.getElementById('app-view');

  // Fade out landing
  landingView.style.transition = 'opacity 0.4s ease';
  landingView.style.opacity = '0';
  landingView.style.pointerEvents = 'none';

  setTimeout(() => {
    landingView.style.display = 'none';
    appView.style.display = 'flex';
    appView.style.opacity = '0';
    appView.style.transition = 'opacity 0.4s ease';
    // Force reflow
    void appView.offsetWidth;
    appView.style.opacity = '1';

    // Init charts after app is visible
    initCharts();
  }, 400);
}


/* ════════════════════════════════════════
   APP NAVIGATION
   ════════════════════════════════════════ */

function showPage(id, navEl) {
  // Update page sections
  document.querySelectorAll('.page-section').forEach(s => s.classList.remove('active'));
  const el = document.getElementById('page-' + id);
  if (el) el.classList.add('active');

  // Update bottom nav
  document.querySelectorAll('.bn-item').forEach(n => n.classList.remove('active'));
  if (navEl) navEl.classList.add('active');

  // Update header
  const titles = {
    dashboard: ['Dashboard', 'Weekly Overview'],
    log:       ['Behavior Log', 'Record a new event'],
    insights:  ['Insights & Patterns', 'AI-powered analysis'],
    profile:   ['Profile & Settings', 'Manage your account'],
  };
  const t = titles[id] || ['PawInsight', ''];
  const titleEl = document.getElementById('topbarTitle');
  const subEl = document.getElementById('topbarSub');
  if (titleEl) titleEl.textContent = t[0];
  if (subEl) subEl.textContent = t[1];

  // Scroll content to top
  const content = document.querySelector('.app-content');
  if (content) content.scrollTop = 0;

  // Lazy-init insights chart when switching to insights page
  if (id === 'insights' && !window.insightsMoodChartRendered) {
    setTimeout(renderInsightsMoodChart, 100);
    window.insightsMoodChartRendered = true;
  }
}


/* ════════════════════════════════════════
   FORM INTERACTIONS
   ════════════════════════════════════════ */

function selectMood(btn, mood) {
  document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  btn.dataset.mood = mood;
}

function submitLog() {
  const activity = document.getElementById('activityInput').value;
  if (!activity) {
    showToast('Please select an activity first!', true);
    return;
  }
  const selected = document.querySelector('.mood-btn.selected');
  if (!selected) {
    showToast('Please select a mood!', true);
    return;
  }
  showToast('Behavior logged successfully! 🐾');
  resetForm();
}

function resetForm() {
  const actInput = document.getElementById('activityInput');
  const timeInput = document.getElementById('timeInput');
  const intensityRange = document.getElementById('intensityRange');
  const intensityVal = document.getElementById('intensityVal');

  if (actInput) actInput.value = '';
  if (timeInput) timeInput.value = new Date().toISOString().slice(0, 16);
  if (intensityRange) intensityRange.value = 5;
  if (intensityVal) intensityVal.textContent = '5';
  document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('selected'));
}

function showToast(msg, isError) {
  const t = document.getElementById('toast');
  if (!t) return;

  if (isError) {
    t.style.borderColor = 'var(--red-accent)';
    t.style.boxShadow = '4px 4px 0 var(--red-accent)';
    t.style.color = 'var(--red-accent)';
  } else {
    t.style.borderColor = 'var(--green-accent)';
    t.style.boxShadow = '4px 4px 0 var(--green-accent)';
    t.style.color = 'var(--green-accent)';
  }

  if (msg) t.childNodes[t.childNodes.length - 1].textContent = ' ' + msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2800);
}


/* ════════════════════════════════════════
   CHARTS (Chart.js)
   ════════════════════════════════════════ */

// Helper: rounded rectangle path
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

let chartsInitialized = false;

function initCharts() {
  if (chartsInitialized) return;
  chartsInitialized = true;

  Chart.defaults.font.family = 'Nunito';
  Chart.defaults.color = '#8B6347';

  const COLORS = {
    green:  '#5DBB7A',
    red:    '#F07070',
    blue:   '#5A9ED4',
    orange: '#FF9E52',
    yellow: '#FFCF4B',
    cream:  '#FFF8EC',
    border: '#E8C97A',
    brown:  '#5C3D2E',
  };

  const tooltipBase = {
    backgroundColor: '#FFF8EC',
    titleColor: '#5C3D2E',
    bodyColor: '#8B6347',
    borderColor: '#E8C97A',
    borderWidth: 1.5,
    padding: 10,
    cornerRadius: 12,
    titleFont: { weight: '800' },
  };

  // ── 1. LINE CHART: Mood Over Time ──
  (function () {
    const ctx = document.getElementById('moodLineChart');
    if (!ctx) return;
    const labels = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
    const data   = [6.2, 7.1, 5.8, 8.3, 7.9, 9.1, 8.8];
    const gradient = ctx.getContext('2d').createLinearGradient(0, 0, 0, 160);
    gradient.addColorStop(0, 'rgba(93,187,122,0.3)');
    gradient.addColorStop(1, 'rgba(93,187,122,0.01)');

    new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Mood Score',
          data,
          borderColor: COLORS.green,
          borderWidth: 2.5,
          pointBackgroundColor: (c) => c.dataIndex === 5 ? '#FFCF4B' : COLORS.green,
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: (c) => c.dataIndex === 5 ? 8 : 5,
          pointHoverRadius: 7,
          tension: 0.4,
          fill: true,
          backgroundColor: gradient,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: tooltipBase,
        },
        scales: {
          x: {
            grid: { color: 'rgba(245,233,196,0.4)' },
            ticks: { font: { size: 10, weight: '700' } },
          },
          y: {
            grid: { color: 'rgba(245,233,196,0.4)' },
            min: 0, max: 10,
            ticks: { font: { size: 10, weight: '700' } },
          },
        },
      },
      plugins: [{
        id: 'peakLabel',
        afterDraw(chart) {
          const meta = chart.getDatasetMeta(0);
          const pt = meta.data[5]; // Saturday = index 5, peak
          if (!pt) return;
          const { ctx: c } = chart;
          c.save();
          // bubble
          const bx = pt.x, by = Math.max(pt.y - 18, 18);
          const text = 'Peak: play session';
          c.font = 'bold 10px Nunito, sans-serif';
          const tw = c.measureText(text).width;
          const pad = 6;
          c.fillStyle = '#FFCF4B';
          c.strokeStyle = '#5C3D2E';
          c.lineWidth = 1.5;
          roundRect(c, bx - tw/2 - pad, by - 12, tw + pad*2, 18, 6);
          c.fill(); c.stroke();
          // text
          c.fillStyle = '#5C3D2E';
          c.textAlign = 'center';
          c.textBaseline = 'middle';
          c.fillText(text, bx, by - 3);
          // stem
          c.beginPath();
          c.moveTo(bx, by + 7);
          c.lineTo(bx, pt.y - 10);
          c.strokeStyle = '#5C3D2E';
          c.lineWidth = 1;
          c.stroke();
          c.restore();
        }
      }],
    });
  })();

  // ── 2. DONUT: Behavior Breakdown ──
  (function () {
    const ctx = document.getElementById('behaviorDonut');
    if (!ctx) return;
    new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Playing','Napping','Walking','Eating','Other'],
        datasets: [{
          data: [35, 25, 20, 15, 5],
          backgroundColor: [
            '#FFCF4B',   // Playing  → yellow
            '#C4A882',   // Napping  → warm brown
            '#5DBB7A',   // Walking  → green
            '#FF9E52',   // Eating   → orange
            '#E0D5C8',   // Other    → light
          ],
          borderColor: '#fff',
          borderWidth: 2,
          hoverOffset: 5,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '62%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 10,
              font: { size: 10, weight: '700' },
              color: '#8B6347',
              usePointStyle: true,
              pointStyleWidth: 7,
            },
          },
          tooltip: tooltipBase,
        },
      },
    });
  })();

  // ── 3. BAR CHART: Activity Distribution ──
  (function () {
    const ctx = document.getElementById('activityBar');
    if (!ctx) return;
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
        datasets: [
          { label: 'Playing',  data: [3,4,2,5,4,6,5], backgroundColor: COLORS.yellow, borderRadius: 6, barPercentage: 0.55 },
          { label: 'Walking',  data: [1,2,1,2,1,3,2], backgroundColor: COLORS.green,  borderRadius: 6, barPercentage: 0.55 },
          { label: 'Napping',  data: [4,3,5,2,3,2,3], backgroundColor: '#C4A882',     borderRadius: 6, barPercentage: 0.55 },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            align: 'end',
            labels: {
              padding: 10,
              font: { size: 10, weight: '700' },
              color: '#8B6347',
              usePointStyle: true,
              pointStyleWidth: 7,
            },
          },
          tooltip: tooltipBase,
        },
        scales: {
          x: {
            stacked: false,
            grid: { display: false },
            ticks: { font: { size: 10, weight: '700' } },
          },
          y: {
            grid: { color: 'rgba(245,233,196,0.4)' },
            ticks: { font: { size: 10, weight: '700' } },
          },
        },
      },
    });
  })();

  // ── 4. SCATTER PLOT: Behavior vs Mood ──
  (function () {
    const ctx = document.getElementById('scatterPlot');
    if (!ctx) return;
    const playData = [{x:15,y:8.2},{x:20,y:8.9},{x:30,y:9.1},{x:10,y:7.5},{x:25,y:8.7},{x:35,y:9.4},{x:5,y:6.8}];
    const walkData = [{x:10,y:7.8},{x:20,y:8.3},{x:30,y:8.9},{x:15,y:8.0},{x:25,y:8.5}];

    new Chart(ctx, {
      type: 'scatter',
      data: {
        datasets: [
          { label: 'Play', data: playData, backgroundColor: COLORS.yellow + 'CC', pointRadius: 6, pointHoverRadius: 8 },
          { label: 'Walk', data: walkData, backgroundColor: COLORS.green  + 'CC', pointRadius: 6, pointHoverRadius: 8 },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            align: 'end',
            labels: { font: { size: 10, weight: '700' }, color: '#8B6347', usePointStyle: true, pointStyleWidth: 7 },
          },
          tooltip: {
            ...tooltipBase,
            callbacks: { label: ctx => `${ctx.dataset.label}: ${ctx.raw.x}min, mood ${ctx.raw.y}` },
          },
        },
        scales: {
          x: {
            title: { display: true, text: 'Duration (min)', color: '#8B6347', font: { size: 9, weight: '700' } },
            grid: { color: '#F5E9C4' },
            ticks: { font: { size: 9 } },
          },
          y: {
            title: { display: true, text: 'Mood', color: '#8B6347', font: { size: 9, weight: '700' } },
            min: 5, max: 10,
            grid: { color: '#F5E9C4' },
            ticks: { font: { size: 9 } },
          },
        },
      },
    });
  })();

  // ── 5. HEATMAP ──
  (function () {
    const container = document.getElementById('heatmapContainer');
    if (!container) return;

    const hours = ['6AM','9AM','12PM','3PM','6PM','9PM'];
    const days  = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
    const raw   = [
      [6,7,8,7,6,4,3],
      [8,9,9,8,8,7,6],
      [7,8,7,9,7,8,7],
      [7,8,8,8,9,9,8],
      [5,6,7,7,6,7,6],
      [3,4,3,4,2,5,4],
    ];

    const grid = document.createElement('div');
    grid.className = 'heatmap-grid';

    // Header row
    const corner = document.createElement('div');
    corner.className = 'hm-day-label';
    grid.appendChild(corner);
    days.forEach(d => {
      const lbl = document.createElement('div');
      lbl.className = 'hm-day-label';
      lbl.textContent = d;
      grid.appendChild(lbl);
    });

    // Data rows
    hours.forEach((h, ri) => {
      const rowLabel = document.createElement('div');
      rowLabel.className = 'hm-label';
      rowLabel.textContent = h;
      grid.appendChild(rowLabel);

      raw[ri].forEach((val, ci) => {
        const cell = document.createElement('div');
        cell.className = 'hm-cell';
        const intensity = val / 10;
        const r = Math.round(255 - intensity * (255 - 93));
        const g = Math.round(233 - intensity * (233 - 187));
        const b = Math.round(160 - intensity * (160 - 122));
        cell.style.background = `rgba(${r},${g},${b},${0.3 + intensity * 0.7})`;
        cell.title = `${days[ci]} ${h}: Mood ${val}/10`;
        grid.appendChild(cell);
      });
    });

    container.appendChild(grid);
  })();
}


/* ════════════════════════════════════════
   INSIGHTS 30-DAY CHART (lazy)
   ════════════════════════════════════════ */

function renderInsightsMoodChart() {
  const ctx = document.getElementById('insightsMoodChart');
  if (!ctx) return;

  const labels = Array.from({ length: 30 }, (_, i) =>
    i === 0 ? 'Mar 14' : i === 14 ? 'Mar 28' : i === 29 ? 'Apr 13' : ''
  );
  const data = [
    5.5,6,5.8,6.2,5.9,6.5,7,6.8,7.2,7.5,
    7.1,7.8,8,7.6,8.2,7.9,8.3,8.1,8.5,8.2,
    8.6,8.4,8.8,8.5,8.9,9.0,8.7,9.1,8.8,9.2,
  ];

  const grad = ctx.getContext('2d').createLinearGradient(0, 0, 0, 150);
  grad.addColorStop(0, 'rgba(93,187,122,0.25)');
  grad.addColorStop(1, 'rgba(93,187,122,0.01)');

  new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Mood',
        data,
        borderColor: '#5DBB7A',
        borderWidth: 2.5,
        pointRadius: (c) => [0, 14, 29].includes(c.dataIndex) ? 5 : 0,
        pointBackgroundColor: '#5DBB7A',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        tension: 0.4,
        fill: true,
        backgroundColor: grad,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#FFF8EC',
          titleColor: '#5C3D2E',
          bodyColor: '#8B6347',
          borderColor: '#E8C97A',
          borderWidth: 1.5,
          padding: 8,
          cornerRadius: 12,
        },
      },
      scales: {
        x: {
          grid: { color: 'rgba(245,233,196,0.4)' },
          ticks: { font: { size: 10, weight: '700' }, maxRotation: 0 },
        },
        y: {
          grid: { color: 'rgba(245,233,196,0.4)' },
          min: 4, max: 10,
          ticks: { font: { size: 10, weight: '700' } },
        },
      },
    },
  });
}
