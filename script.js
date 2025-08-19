// --------- ecbData should be loaded first (from your ecb-data.js or at top of this file) ----------

// Chart.js color styles
const chartColors = {
  refi: { border: '#002147', background: 'rgba(0,33,71,0.12)' },
  deposit: { border: '#28a745', background: 'rgba(40,167,69,0.12)' },
  lending: { border: '#dc3545', background: 'rgba(220,53,69,0.12)' }
};
let charts = {};

// Get latest rate value and trend for a rate type
function getLatestRateAndTrend(type) {
  const data = ecbData[type];
  // Find latest year with a value
  const years = Object.keys(data).sort((a, b) => b - a);
  let latest = null, previous = null;
  for (let y of years) {
    for (let i = data[y].length - 1; i >= 0; i--) {
      if (data[y][i].value !== null && data[y][i].value !== undefined) {
        if (!latest) latest = data[y][i].value;
        else if (!previous) previous = data[y][i].value;
        if (latest && previous) break;
      }
    }
    if (latest && previous) break;
  }
  let trend = "↔ No change";
  if (latest && previous) {
    if (latest > previous) trend = "↗ Increasing";
    else if (latest < previous) trend = "↘ Decreasing";
  }
  return { value: latest ?? '?', trend };
}

// Fill rate boxes on index.html
function fillBoxes() {
  const types = [
    { type: 'refi', name: 'Main Refinancing Rate' },
    { type: 'deposit', name: 'Deposit Facility Rate' },
    { type: 'lending', name: 'Marginal Lending Rate' }
  ];
  types.forEach(({ type, name }) => {
    // For index.html
    document.querySelectorAll('.rate-box').forEach(box => {
      const title = box.querySelector('h3');
      if (title && title.textContent.includes(name)) {
        const { value, trend } = getLatestRateAndTrend(type);
        const rateVal = box.querySelector('.rate-value');
        if (rateVal) rateVal.textContent = value + "%";
        const rateTrend = box.querySelector('.rate-trend');
        if (rateTrend) {
          rateTrend.textContent = trend;
          rateTrend.classList.remove('up', 'down', 'neutral');
          if (trend.includes('Increasing')) rateTrend.classList.add('up');
          else if (trend.includes('Decreasing')) rateTrend.classList.add('down');
          else rateTrend.classList.add('neutral');
        }
      }
    });
    // For rates.html
    document.querySelectorAll('.rate-card').forEach(card => {
      const title = card.querySelector('h3');
      if (title && title.textContent.includes(name)) {
        const { value, trend } = getLatestRateAndTrend(type);
        const rateVal = card.querySelector('.rate-value-large');
        if (rateVal) rateVal.textContent = value + "%";
        const rateTrend = card.querySelector('.rate-trend-large');
        if (rateTrend) {
          rateTrend.textContent = trend;
          rateTrend.classList.remove('up', 'down', 'neutral');
          if (trend.includes('Increasing')) rateTrend.classList.add('up');
          else if (trend.includes('Decreasing')) rateTrend.classList.add('down');
          else rateTrend.classList.add('neutral');
        }
      }
    });
  });
}

// Chart display for modals, by year (for rates.html and index.html)
function filterToJune2025(labels, values) {
  // Only keep data up to and including 2025-06
  let cutoffIndex = labels.findIndex(lab => lab.startsWith('2025-07'));
  if (cutoffIndex === -1) return { labels, values };
  return { labels: labels.slice(0, cutoffIndex), values: values.slice(0, cutoffIndex) };
}

function updateHistoricalChart(chartId, type, year = null) {
  const canvas = document.getElementById(chartId);
  if (!canvas) return;
  if (charts[type]) charts[type].destroy();

  const isIndex = window.location.pathname.endsWith('index.html') || window.location.pathname === '/' || window.location.pathname === '';
  let labels = [], values = [];
  if (isIndex) {
    const years = Object.keys(ecbData[type]).sort((a, b) => a - b);
    years.forEach(year => {
      ecbData[type][year].forEach(entry => {
        labels.push(year + '-' + entry.date.split('-')[1]);
        values.push(entry.value);
      });
    });
    // Filter to June 2025
    ({ labels, values } = filterToJune2025(labels, values));
  } else {
    const years = Object.keys(ecbData[type]).sort((a, b) => b - a);
    if (!year) year = years[0];
    const yearData = ecbData[type][year];
    labels = yearData.map(entry => entry.date);
    values = yearData.map(entry => entry.value);
    // If year is 2025, filter to June
    if (year === '2025') {
      const cutoffIdx = labels.findIndex(lab => lab.startsWith('2025-07'));
      if (cutoffIdx !== -1) {
        labels = labels.slice(0, cutoffIdx);
        values = values.slice(0, cutoffIdx);
      }
    }
  }

  charts[type] = new Chart(canvas.getContext('2d'), {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: type.charAt(0).toUpperCase() + type.slice(1) + (isIndex ? ' Rate (1999-2025)' : ' Rate - ' + (year || '')),
        data: values,
        borderColor: chartColors[type].border,
        backgroundColor: chartColors[type].background,
        borderWidth: 3,
        fill: true,
        tension: 0.35,
        pointRadius: 4,
        pointHoverRadius: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: true, position: 'top', labels: { font: { size: 15 } } },
        tooltip: { enabled: true, mode: 'index', intersect: false }
      },
      hover: { mode: 'nearest', intersect: false },
      scales: {
        x: {
          title: { display: true, text: isIndex ? 'Year-Month' : 'Month', font: { size: 14 } },
          grid: { color: '#e9ecef' },
          ticks: { maxTicksLimit: isIndex ? 30 : undefined }
        },
        y: {
          beginAtZero: false,
          title: { display: true, text: 'Rate (%)', font: { size: 14 } },
          grid: { color: '#e9ecef' },
          ticks: { callback: v => v.toFixed(1) + '%' }
        }
      }
    }
  });
  if (!isIndex) {
    if (document.getElementById(`year-${type}`)) document.getElementById(`year-${type}`).textContent = year;
    if (document.getElementById(`${type}-chart-title`)) document.getElementById(`${type}-chart-title`).textContent =
      (type.charAt(0).toUpperCase() + type.slice(1)) + ' Rate - ' + year;
  }
}

// Modal logic
function openModal(type) {
  const modal = document.getElementById(`modal-${type}`);
  if (modal) {
    modal.style.display = 'block';
    updateHistoricalChart(`chart${type.charAt(0).toUpperCase() + type.slice(1)}`, type);
  }
}
function closeModal(type) {
  const modal = document.getElementById(`modal-${type}`);
  if (modal) modal.style.display = 'none';
}

// Year navigation for modal charts (rates.html)
function changeYear(type, direction) {
  const years = Object.keys(ecbData[type]).sort((a, b) => b - a);
  let currentYear = document.getElementById(`year-${type}`).textContent;
  let idx = years.indexOf(currentYear);
  if (direction === 'prev' && idx < years.length - 1) idx++;
  if (direction === 'next' && idx > 0) idx--;
  updateHistoricalChart(`chart${type.charAt(0).toUpperCase() + type.slice(1)}`, type, years[idx]);
}

// Clicking outside modal closes it
window.onclick = function(event) {
  document.querySelectorAll('.modal').forEach(modal => {
    if (event.target === modal) modal.style.display = 'none';
  });
};

// --- Detailed Charts for rates.html ---
function renderCombinedRatesChart() {
  const canvas = document.getElementById('combinedRatesChart');
  if (!canvas) return;
  if (charts['combined']) charts['combined'].destroy();

  const years = Object.keys(ecbData.refi).sort((a, b) => a - b);
  let labels = [];
  let refiData = [];
  let depositData = [];
  let lendingData = [];

  years.forEach(year => {
    if (ecbData.refi[year]) {
      ecbData.refi[year].forEach(entry => {
        // Only include data up to June 2025
        if (year === '2025' && parseInt(entry.date.split('-')[1]) > 6) {
          return; // Skip months after June 2025
        }
        
        labels.push(entry.date.substring(0, 7)); // YYYY-MM format
        refiData.push(entry.value);
        
        // Find corresponding deposit and lending data
        const depositEntry = ecbData.deposit[year] ? ecbData.deposit[year].find(e => e.date === entry.date) : null;
        const lendingEntry = ecbData.lending[year] ? ecbData.lending[year].find(e => e.date === entry.date) : null;
        
        depositData.push(depositEntry ? depositEntry.value : null);
        lendingData.push(lendingEntry ? lendingEntry.value : null);
      });
    }
  });



  charts['combined'] = new Chart(canvas.getContext('2d'), {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Main Refinancing Rate',
          data: refiData,
          borderColor: chartColors.refi.border,
          backgroundColor: 'rgba(0,33,71,0.08)',
          borderWidth: 3,
          fill: false,
          tension: 0.35,
          pointRadius: 2,
          pointHoverRadius: 6,
          spanGaps: true,
        },
        {
          label: 'Deposit Facility Rate',
          data: depositData,
          borderColor: chartColors.deposit.border,
          backgroundColor: 'rgba(40,167,69,0.08)',
          borderWidth: 3,
          fill: false,
          tension: 0.35,
          pointRadius: 2,
          pointHoverRadius: 6,
          spanGaps: true,
        },
        {
          label: 'Marginal Lending Rate',
          data: lendingData,
          borderColor: chartColors.lending.border,
          backgroundColor: 'rgba(220,53,69,0.08)',
          borderWidth: 3,
          fill: false,
          tension: 0.35,
          pointRadius: 2,
          pointHoverRadius: 6,
          spanGaps: true,
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: true, position: 'top', labels: { font: { size: 16 } } },
        tooltip: { enabled: true, mode: 'index', intersect: false }
      },
      hover: { mode: 'nearest', intersect: false },
      scales: {
        x: {
          title: { display: true, text: 'Year', font: { size: 15 } },
          grid: { color: '#e9ecef' },
          ticks: { 
            maxTicksLimit: 50,
            callback: function(value, index, values) {
              const label = this.getLabelForValue(value);
              // Show January of each year (YYYY-01) and the last data point
              if (label && (label.endsWith('-01') || index === values.length - 1)) {
                return label.split('-')[0]; // Show just the year (e.g., "2024")
              }
              return '';
            }
          }
        },
        y: {
          beginAtZero: false,
          title: { display: true, text: 'Rate (%)', font: { size: 15 } },
          grid: { color: '#e9ecef' },
          ticks: { callback: v => v.toFixed(1) + '%' }
        }
      }
    }
  });
}

function renderDetailedYearlyChart(type, year) {
  const canvasId = {
    refi: 'detailedRefiChart',
    deposit: 'detailedDepositChart',
    lending: 'detailedLendingChart'
  }[type];
  if (!canvasId) return;
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  if (charts[canvasId]) charts[canvasId].destroy();

  const yearData = ecbData[type][year];
  if (!yearData) return;
  let labels = yearData.map(entry => entry.date.split('-')[1]);
  let values = yearData.map(entry => entry.value);
  if (year === '2025') {
    const cutoffIdx = labels.findIndex(m => m === '07');
    if (cutoffIdx !== -1) {
      labels = labels.slice(0, cutoffIdx);
      values = values.slice(0, cutoffIdx);
    }
  }

  charts[canvasId] = new Chart(canvas.getContext('2d'), {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: type.charAt(0).toUpperCase() + type.slice(1) + ' Rate - ' + year,
        data: values,
        borderColor: chartColors[type].border,
        backgroundColor: chartColors[type].background,
        borderWidth: 3,
        fill: true,
        tension: 0.35,
        pointRadius: 4,
        pointHoverRadius: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: true, position: 'top', labels: { font: { size: 15 } } },
        tooltip: { enabled: true, mode: 'index', intersect: false }
      },
      hover: { mode: 'nearest', intersect: false },
      scales: {
        x: {
          title: { display: true, text: 'Month', font: { size: 14 } },
          grid: { color: '#e9ecef' }
        },
        y: {
          beginAtZero: false,
          title: { display: true, text: 'Rate (%)', font: { size: 14 } },
          grid: { color: '#e9ecef' },
          ticks: { callback: v => v.toFixed(1) + '%' }
        }
      }
    }
  });
  document.getElementById('detailed-year-' + type).textContent = year;
}

// Year navigation for detailed charts
function changeDetailedYear(type, direction) {
  const years = Object.keys(ecbData[type]).sort((a, b) => b - a);
  let currentYear = document.getElementById('detailed-year-' + type).textContent;
  let idx = years.indexOf(currentYear);
  if (direction === 'prev' && idx < years.length - 1) idx++;
  if (direction === 'next' && idx > 0) idx--;
  renderDetailedYearlyChart(type, years[idx]);
}

// Initialize detailed charts on rates.html
function initDetailedCharts() {
  if (document.getElementById('combinedRatesChart')) {
    renderCombinedRatesChart();
  }
  ['refi', 'deposit', 'lending'].forEach(type => {
    const years = Object.keys(ecbData[type]).sort((a, b) => b - a);
    if (years.length > 0) {
      renderDetailedYearlyChart(type, years[0]);
    }
  });
}

// --- Context periods for ECB rates chart ---
const ecbContextPeriods = [
  {
    label: '1999–2001: The Beginning & Euro Stabilization',
    start: '1999-01', end: '2001-12',
    color: 'rgba(255,140,0,0.10)',
    description: 'Interest rates were roughly between 2.5% and 4.75%.<br><br>The ECB raised rates to support the newly introduced euro and to control potential inflation.<br><br>Economic growth was solid, so higher rates helped prevent the economy from overheating.'
  },
  {
    label: '2001–2003: Economic Slowdown (Dot-com crash, 9/11)',
    start: '2001-12', end: '2003-12',
    color: 'rgba(220,53,69,0.10)',
    description: 'The economy slowed sharply due to the dot-com bubble bursting and the shock of 9/11.<br><br>The ECB responded by cutting rates aggressively: the main refinancing rate (MRR) fell to around 2%, the marginal lending rate (MLR) to about 3%, and the deposit facility rate (DFR) to roughly 1%.<br><br>Lower rates made borrowing cheaper, encouraging consumption and investment to counteract the recession.'
  },
  {
    label: '2005–2008: Economic Boom & Rising Inflation',
    start: '2005-01', end: '2008-12',
    color: 'rgba(40,167,69,0.10)',
    description: 'The economy recovered and grew strongly, pushing inflation higher.<br><br>To prevent overheating, the ECB raised rates again: MRR to 4.25%, MLR to 5%, DFR around 3.25%.<br><br>This “pre-crisis tightening” aimed to slow down inflation without triggering a recession.'
  },
  {
    label: '2008–2012: Financial Crisis & Extreme Rate Cuts',
    start: '2008-12', end: '2012-01',
    color: 'rgba(108,117,125,0.13)',
    description: 'The global financial crisis caused severe recession and economic uncertainty.<br><br>The ECB slashed interest rates: MRR dropped from 4.25% to 1%.<br><br>A brief rate hike in 2011 was quickly reversed, showing the ECB’s struggle between controlling inflation and supporting a collapsing economy.'
  },
  {
    label: '2012–2016: Negative Rates & Unconventional Policies',
    start: '2012-01', end: '2016-12',
    color: 'rgba(0,123,255,0.10)',
    description: 'Deposit rates went negative (–0.1% to –0.4%), meaning banks were effectively penalized for holding money at the ECB rather than lending it.<br><br>The MRR eventually reached 0%.<br><br>These measures aimed to fight deflation, stimulate lending, and boost a stagnating economy.'
  },
  {
    label: '2016–2021: Long Period of Ultra-Low Rates',
    start: '2016-12', end: '2021-12',
    color: 'rgba(108,117,125,0.10)',
    description: 'Rates remained very low: DFR around –0.5%, MRR at 0%.<br><br>The ECB tried to revive growth during a prolonged period of weak inflation and slow recovery, often using quantitative easing alongside low rates.'
  },
  {
    label: '2022–2023: Post-COVID Inflation Shock',
    start: '2022-01', end: '2023-12',
    color: 'rgba(220,53,69,0.13)',
    description: 'After the pandemic, inflation surged to 8–10%, far above the ECB’s 2% target.<br><br>The ECB implemented its fastest rate hikes ever: MRR rose from 0% to around 4%, deposit rates from –0.5% to ~3.75%, and MLR to ~4.5%.<br><br>The aim was to quickly reduce inflation and stabilize prices.'
  },
  {
    label: '2024–2025: Slight Rate Cuts',
    start: '2024-01', end: '2025-06',
    color: 'rgba(40,167,69,0.13)',
    description: 'As inflation begins to decline, the ECB starts cutting rates slightly.<br><br>This indicates a focus on a “soft landing,” slowing down the economy gently without triggering a new recession.'
  }
];
let contextMode = false;
let hoveredPeriodIdx = null;

function getPeriodIndices(labels, start, end) {
  const startIdx = labels.findIndex(lab => lab >= start);
  const endIdx = labels.findIndex(lab => lab > end);
  return [startIdx, endIdx === -1 ? labels.length : endIdx];
}

function enableContextHover(labels) {
  const canvas = document.getElementById('combinedRatesChart');
  if (!canvas) return;
  const infoBox = document.getElementById('contextInfoBox');
  if (!infoBox) return;
  function mouseMoveHandler(event) {
    if (!contextMode) { infoBox.style.display = 'none'; return; }
    const chart = charts['combined'];
    if (!chart) return;
    const chartArea = chart.chartArea;
    if (!chartArea) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    let found = false;
    ecbContextPeriods.forEach((period, idx) => {
      const [startIdx, endIdx] = getPeriodIndices(labels, period.start, period.end);
      if (startIdx === -1) return;
      const xStart = chart.scales.x.getPixelForValue(labels[startIdx]);
      const xEnd = chart.scales.x.getPixelForValue(labels[endIdx - 1] || labels[labels.length - 1]);
      if (mouseX >= xStart && mouseX <= xEnd && mouseY >= chartArea.top && mouseY <= chartArea.bottom) {
        if (hoveredPeriodIdx !== idx) {
          hoveredPeriodIdx = idx;
          showContextInfoBox(period, true);
        }
        found = true;
      }
    });
    if (!found && hoveredPeriodIdx !== null) {
      hoveredPeriodIdx = null;
      hideContextInfoBox(true);
    }
  }
  function mouseLeaveHandler() {
    hoveredPeriodIdx = null;
    hideContextInfoBox(true);
  }
  canvas.addEventListener('mousemove', mouseMoveHandler);
  canvas.addEventListener('mouseleave', mouseLeaveHandler);
  // Remove old listeners if any (for re-renders)
  canvas._contextHoverCleanup = () => {
    canvas.removeEventListener('mousemove', mouseMoveHandler);
    canvas.removeEventListener('mouseleave', mouseLeaveHandler);
  };
}

function disableContextHover() {
  const canvas = document.getElementById('combinedRatesChart');
  if (canvas && canvas._contextHoverCleanup) {
    canvas._contextHoverCleanup();
    delete canvas._contextHoverCleanup;
  }
  hideContextInfoBox(true);
}

function renderCombinedRatesChart(context = false) {
  const canvas = document.getElementById('combinedRatesChart');
  if (!canvas) return;
  if (charts['combined']) charts['combined'].destroy();

  const years = Object.keys(ecbData.refi).sort((a, b) => a - b);
  let labels = [];
  let refiData = [];
  let depositData = [];
  let lendingData = [];

  years.forEach(year => {
    if (ecbData.refi[year]) {
      ecbData.refi[year].forEach(entry => {
        if (year === '2025' && parseInt(entry.date.split('-')[1]) > 6) {
          return;
        }
        labels.push(entry.date.substring(0, 7));
        refiData.push(entry.value);
        const depositEntry = ecbData.deposit[year] ? ecbData.deposit[year].find(e => e.date === entry.date) : null;
        const lendingEntry = ecbData.lending[year] ? ecbData.lending[year].find(e => e.date === entry.date) : null;
        depositData.push(depositEntry ? depositEntry.value : null);
        lendingData.push(lendingEntry ? lendingEntry.value : null);
      });
    }
  });

  let annotationPlugin = {};
  if (context) {
    annotationPlugin = {
      id: 'contextOverlay',
      beforeDraw: (chart) => {
        const ctx = chart.ctx;
        const chartArea = chart.chartArea;
        if (!chartArea) return;
        ecbContextPeriods.forEach((period, idx) => {
          const [startIdx, endIdx] = getPeriodIndices(labels, period.start, period.end);
          if (startIdx === -1) return;
          const xStart = chart.scales.x.getPixelForValue(labels[startIdx]);
          const xEnd = chart.scales.x.getPixelForValue(labels[endIdx - 1] || labels[labels.length - 1]);
          ctx.save();
          ctx.globalAlpha = 0.5;
          ctx.fillStyle = period.color;
          ctx.fillRect(xStart, chartArea.top, xEnd - xStart, chartArea.bottom - chartArea.top);
          ctx.restore();
        });
      }
    };
  }

  charts['combined'] = new Chart(canvas.getContext('2d'), {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Main Refinancing Rate',
          data: refiData,
          borderColor: chartColors.refi.border,
          backgroundColor: 'rgba(0,33,71,0.08)',
          borderWidth: 3,
          fill: false,
          tension: 0.35,
          pointRadius: 2,
          pointHoverRadius: 6,
          spanGaps: true,
        },
        {
          label: 'Deposit Facility Rate',
          data: depositData,
          borderColor: chartColors.deposit.border,
          backgroundColor: 'rgba(40,167,69,0.08)',
          borderWidth: 3,
          fill: false,
          tension: 0.35,
          pointRadius: 2,
          pointHoverRadius: 6,
          spanGaps: true,
        },
        {
          label: 'Marginal Lending Rate',
          data: lendingData,
          borderColor: chartColors.lending.border,
          backgroundColor: 'rgba(220,53,69,0.08)',
          borderWidth: 3,
          fill: false,
          tension: 0.35,
          pointRadius: 2,
          pointHoverRadius: 6,
          spanGaps: true,
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: true, position: 'top', labels: { font: { size: 16 } } },
        tooltip: { enabled: true, mode: 'index', intersect: false }
      },
      hover: { mode: 'nearest', intersect: false },
      scales: {
        x: {
          title: { display: true, text: 'Year', font: { size: 15 } },
          grid: { color: '#e9ecef' },
          ticks: { 
            maxTicksLimit: 50,
            callback: function(value, index, values) {
              const label = this.getLabelForValue(value);
              if (label && (label.endsWith('-01') || label.endsWith('-07'))) return label;
              return '';
            }
          }
        },
        y: {
          beginAtZero: false,
          title: { display: true, text: 'Rate (%)', font: { size: 15 } },
          grid: { color: '#e9ecef' },
          ticks: { callback: v => v.toFixed(1) + '%' }
        }
      }
    },
    plugins: context ? [annotationPlugin] : []
  });
  if (context) {
    enableContextHover(labels);
  } else {
    disableContextHover();
  }
  if (!context) hideContextInfoBox(true);
}

function showContextInfoBox(period, belowChart = false) {
  const infoBox = document.getElementById('contextInfoBox');
  if (!infoBox) return;
  infoBox.innerHTML = `<div style='font-weight:700;font-size:1.1em;margin-bottom:0.3em;'>${period.label}</div><div style='font-size:0.98em;'>${period.description}</div>`;
  infoBox.style.display = 'block';
}
function hideContextInfoBox(belowChart = false) {
  const infoBox = document.getElementById('contextInfoBox');
  if (!infoBox) return;
  infoBox.style.display = 'none';
}

// --- Context toggle button logic ---
document.addEventListener('DOMContentLoaded', () => {
  fillBoxes();
  if (window.location.pathname.includes('rates.html')) {
    initDetailedCharts();
    const btn = document.getElementById('contextToggleBtn');
    if (btn) {
      btn.addEventListener('click', () => {
        contextMode = !contextMode;
        renderCombinedRatesChart(contextMode);
        btn.textContent = contextMode ? '❌ Hide Context' : '🔍 See Context';
      });
    }
  }
});


