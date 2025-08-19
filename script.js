// Granylst Main Script

document.addEventListener('DOMContentLoaded', () => {
  // Dark mode toggle
  const darkModeToggle = document.getElementById('darkModeToggle');
  if (darkModeToggle) {
    darkModeToggle.addEventListener('click', () => {
      document.body.classList.toggle('dark-mode');
      localStorage.setItem('granylst-dark', document.body.classList.contains('dark-mode'));
      darkModeToggle.textContent = document.body.classList.contains('dark-mode') ? '☀️' : '🌙';
    });
    // Load dark mode preference
    if (localStorage.getItem('granylst-dark') === 'true') {
      document.body.classList.add('dark-mode');
      darkModeToggle.textContent = '☀️';
    }
  }

  // Home sample chart
  const homeCanvas = document.getElementById('homeSampleChart');
  if (homeCanvas) {
    const ctx = homeCanvas.getContext('2d');
    const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const data = [10, 14, 12, 18, 22, 20];
    new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Sample Dataset',
          data,
          borderColor: 'rgba(45,108,223,1)',
          backgroundColor: 'rgba(45,108,223,0.12)',
          borderWidth: 3,
          fill: true,
          tension: 0.35,
          pointRadius: 3,
          pointHoverRadius: 6
        }]
      },
      options: { responsive: true, plugins: { legend: { position: 'top' } } }
    });
  }

  // Create Graph Page Logic
  const graphForm = document.getElementById('graphForm');
  let chartInstance;
  if (graphForm) {
    graphForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const dataInput = document.getElementById('dataInput').value.trim();
      const graphType = document.getElementById('graphType').value;
      const { labels, data } = parseCSVData(dataInput);
      const ctx = document.getElementById('graphCanvas').getContext('2d');
      if (chartInstance) chartInstance.destroy();
      chartInstance = new Chart(ctx, getChartConfig(graphType, labels, data));
      // Run AI analysis on the CSV string
      showAIAnalysis(dataInput);
    });
    // Download Graph Button
    const downloadBtn = document.getElementById('downloadGraph');
    if (downloadBtn) {
      downloadBtn.addEventListener('click', () => {
        const canvas = document.getElementById('graphCanvas');
        const link = document.createElement('a');
        link.href = canvas.toDataURL('image/png');
        link.download = 'granylst-graph.png';
        link.click();
      });
    }
  }

  // --- Advanced Data Input for Create Graph ---
  if (graphForm) {
    // Table row add/remove
    const dataTable = document.getElementById('dataTable');
    const addRowBtn = document.getElementById('addRow');
    addRowBtn.addEventListener('click', () => addTableRow(dataTable));
    dataTable.addEventListener('click', (e) => {
      if (e.target.classList.contains('remove-row')) {
        e.target.closest('tr').remove();
      }
    });
    // Sync table to textarea
    dataTable.addEventListener('input', () => {
      document.getElementById('dataInput').value = tableToCSV(dataTable);
    });
    // CSV upload
    document.getElementById('csvUpload').addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (evt) => {
          document.getElementById('dataInput').value = evt.target.result.trim();
          csvToTable(evt.target.result, dataTable);
        };
        reader.readAsText(file);
      }
    });
  }

  // --- AI Integration for Natural Language Prompt (Create Graph) ---
  const aiPrompt = document.getElementById('aiPrompt');
  const aiInterpretBtn = document.getElementById('aiInterpret');
  const aiFeedback = document.getElementById('aiFeedback');
  if (aiPrompt && aiInterpretBtn && aiFeedback) {
    aiInterpretBtn.addEventListener('click', async () => {
      const prompt = aiPrompt.value.trim();
      if (!prompt) {
        aiFeedback.textContent = 'Please enter a description.';
        return;
      }
      aiFeedback.textContent = 'Interpreting with AI...';
      setTimeout(() => {
        const { csv, explanation } = normalizeTextToTwoColumnCSV(prompt);
        document.getElementById('dataInput').value = csv;
        aiFeedback.textContent = explanation + ' (Edit if needed.)';
        const typeSelect = document.getElementById('graphType');
        if (typeSelect && !typeSelect.value) typeSelect.value = 'line';
        if (graphForm && typeof graphForm.requestSubmit === 'function') {
          graphForm.requestSubmit();
        } else if (graphForm) {
          graphForm.dispatchEvent(new Event('submit'));
        }
      }, 300);
    });
  }

  // Compare Data Page Logic
  const compareForm = document.getElementById('compareForm');
  let compareChart;
  if (compareForm) {
    compareForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const dataset1 = document.getElementById('dataset1').value.trim();
      const dataset2 = document.getElementById('dataset2').value.trim();
      const { labels: labels1, data: data1 } = parseCSVData(dataset1);
      const { labels: labels2, data: data2 } = parseCSVData(dataset2);
      const labels = labels1.length > labels2.length ? labels1 : labels2;
      const compareTypeSel = document.getElementById('compareType');
      const compareType = compareTypeSel ? compareTypeSel.value : 'bar';
      const ctx = document.getElementById('compareCanvas').getContext('2d');
      if (compareChart) compareChart.destroy();

      const color1 = 'rgba(45,108,223,1)';
      const color1bg = 'rgba(45,108,223,0.12)';
      const color2 = 'rgba(245,176,65,1)';
      const color2bg = 'rgba(245,176,65,0.12)';

      function datasetConfig(type, label, data, border, bg) {
        if (type === 'line') {
          return { label, data, borderColor: border, backgroundColor: bg, borderWidth: 3, fill: false, tension: 0.35, pointRadius: 2, pointHoverRadius: 6 };
        }
        if (type === 'radar') {
          return { label, data, borderColor: border, backgroundColor: bg, borderWidth: 2, fill: true };
        }
        // default bar
        return { label, data, backgroundColor: bg, borderColor: border, borderWidth: 2 };
      }

      compareChart = new Chart(ctx, {
        type: compareType === 'line' ? 'line' : (compareType === 'radar' ? 'radar' : 'bar'),
        data: {
          labels,
          datasets: [
            datasetConfig(compareType, 'Dataset 1', data1, color1, compareType === 'bar' ? 'rgba(45,108,223,0.7)' : color1bg),
            datasetConfig(compareType, 'Dataset 2', data2, color2, compareType === 'bar' ? 'rgba(245,176,65,0.7)' : color2bg)
          ]
        },
        options: { responsive: true, plugins: { legend: { position: 'top' } } }
      });
      // Build comparative AI insights using numeric analyzer
      try {
        if (typeof compareDatasets === 'function') {
          const comp = compareDatasets(data1, data2);
          const a = comp.datasetA;
          const b = comp.datasetB;
          const c = comp.comparison;
          const html = `
            <table class="ai-table">
              <thead><tr><th>Metric</th><th>Dataset 1</th><th>Dataset 2</th></tr></thead>
              <tbody>
                <tr><td>Mean</td><td>${a.mean.toFixed(3)}</td><td>${b.mean.toFixed(3)}</td></tr>
                <tr><td>Median</td><td>${a.median.toFixed(3)}</td><td>${b.median.toFixed(3)}</td></tr>
                <tr><td>Min</td><td>${a.min}</td><td>${b.min}</td></tr>
                <tr><td>Max</td><td>${a.max}</td><td>${b.max}</td></tr>
                <tr><td>Std Dev</td><td>${a.standardDeviation.toFixed(3)}</td><td>${b.standardDeviation.toFixed(3)}</td></tr>
                <tr><td>Trend</td><td>${a.trend}</td><td>${b.trend}</td></tr>
              </tbody>
            </table>
            <table class="ai-table" style="margin-top:.75rem;">
              <thead><tr><th colspan="2">Comparison</th></tr></thead>
              <tbody>
                <tr><td>Mean Difference (A - B)</td><td>${c.meanDifference.toFixed(3)}</td></tr>
                <tr><td>Median Difference (A - B)</td><td>${c.medianDifference.toFixed(3)}</td></tr>
                <tr><td>More Volatile</td><td>${c.moreVolatile}</td></tr>
                <tr><td>Trend Relation</td><td>${c.trendRelation}</td></tr>
                <tr><td>Correlation</td><td>${c.correlation === null ? 'n/a' : c.correlation.toFixed(3)}</td></tr>
              </tbody>
            </table>`;
          setAIInsights('ai-insights', html);
        } else {
          setAIInsights('ai-insights', 'AI analysis module not loaded.');
        }
      } catch (err) {
        setAIInsights('ai-insights', 'Could not compute analysis.');
      }
    });
    // Download Compare Graph Button
    const downloadCompareBtn = document.getElementById('downloadCompareGraph');
    if (downloadCompareBtn) {
      downloadCompareBtn.addEventListener('click', () => {
        const canvas = document.getElementById('compareCanvas');
        const link = document.createElement('a');
        link.href = canvas.toDataURL('image/png');
        link.download = 'granylst-compare-graph.png';
        link.click();
      });
    }
  }

  // --- Advanced Data Input for Compare Data ---
  if (compareForm) {
    // Dataset 1
    const dataTable1 = document.getElementById('dataTable1');
    const addRowBtn1 = document.getElementById('addRow1');
    addRowBtn1.addEventListener('click', () => addTableRow(dataTable1));
    dataTable1.addEventListener('click', (e) => {
      if (e.target.classList.contains('remove-row')) {
        e.target.closest('tr').remove();
      }
    });
    dataTable1.addEventListener('input', () => {
      document.getElementById('dataset1').value = tableToCSV(dataTable1);
    });
    document.getElementById('csvUpload1').addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (evt) => {
          document.getElementById('dataset1').value = evt.target.result.trim();
          csvToTable(evt.target.result, dataTable1);
        };
        reader.readAsText(file);
      }
    });
    // Dataset 2
    const dataTable2 = document.getElementById('dataTable2');
    const addRowBtn2 = document.getElementById('addRow2');
    addRowBtn2.addEventListener('click', () => addTableRow(dataTable2));
    dataTable2.addEventListener('click', (e) => {
      if (e.target.classList.contains('remove-row')) {
        e.target.closest('tr').remove();
      }
    });
    dataTable2.addEventListener('input', () => {
      document.getElementById('dataset2').value = tableToCSV(dataTable2);
    });
    document.getElementById('csvUpload2').addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (evt) => {
          document.getElementById('dataset2').value = evt.target.result.trim();
          csvToTable(evt.target.result, dataTable2);
        };
        reader.readAsText(file);
      }
    });
  }

  // Compare page AI interpret buttons
  const aiPrompt1 = document.getElementById('aiPrompt1');
  const aiInterpret1 = document.getElementById('aiInterpret1');
  const aiFeedback1 = document.getElementById('aiFeedback1');
  if (aiPrompt1 && aiInterpret1 && aiFeedback1) {
    aiInterpret1.addEventListener('click', () => {
      const prompt = aiPrompt1.value.trim();
      if (!prompt) { aiFeedback1.textContent = 'Please enter a description.'; return; }
      const { csv, explanation } = normalizeTextToTwoColumnCSV(prompt);
      document.getElementById('dataset1').value = csv;
      aiFeedback1.textContent = explanation;
    });
  }
  const aiPrompt2 = document.getElementById('aiPrompt2');
  const aiInterpret2 = document.getElementById('aiInterpret2');
  const aiFeedback2 = document.getElementById('aiFeedback2');
  if (aiPrompt2 && aiInterpret2 && aiFeedback2) {
    aiInterpret2.addEventListener('click', () => {
      const prompt = aiPrompt2.value.trim();
      if (!prompt) { aiFeedback2.textContent = 'Please enter a description.'; return; }
      const { csv, explanation } = normalizeTextToTwoColumnCSV(prompt);
      document.getElementById('dataset2').value = csv;
      aiFeedback2.textContent = explanation;
    });
  }
});

// Utility: Parse CSV or comma-separated data
function parseCSVData(input) {
  const lines = input.split(/\n|\r/).filter(Boolean);
  if (lines.length < 2) return { labels: [], data: [] };
  const [header, ...rows] = lines;
  const labels = [], data = [];
  rows.forEach(row => {
    const parts = row.split(',');
    if (parts.length >= 2) {
      labels.push(parts[0].trim());
      data.push(Number(parts[1].trim()));
    }
  });
  return { labels, data };
}

// Utility: Chart.js config
function getChartConfig(type, labels, data) {
  let config = {
    type,
    data: {
      labels,
      datasets: [{
        label: 'Data',
        data,
        backgroundColor: [
          'rgba(45,108,223,0.7)',
          'rgba(245,176,65,0.7)',
          'rgba(46,204,113,0.7)',
          'rgba(231,76,60,0.7)',
          'rgba(155,89,182,0.7)'
        ],
        borderColor: 'rgba(45,108,223,1)',
        borderWidth: 2,
        fill: false
      }]
    },
    options: { responsive: true, plugins: { legend: { position: 'top' } } }
  };
  if (type === 'scatter') {
    config = {
      type: 'scatter',
      data: {
        datasets: [{
          label: 'Data',
          data: labels.map((l, i) => ({ x: l, y: data[i] })),
          backgroundColor: 'rgba(45,108,223,0.7)'
        }]
      },
      options: { responsive: true, plugins: { legend: { position: 'top' } } }
    };
  }
  if (type === 'pie') {
    config.options.plugins.legend.position = 'right';
  }
  return config;
}

// Utility: Set AI Insights placeholder
function setAIInsights(sectionClass, textOrAnalysis) {
  const container = document.querySelector(`.${sectionClass} .ai-content`);
  if (!container) return;
  // If we receive a string, wrap it
  if (typeof textOrAnalysis === 'string') {
    const looksLikeHTML = /<\w+[^>]*>/.test(textOrAnalysis);
    container.innerHTML = looksLikeHTML ? textOrAnalysis : `<p>${textOrAnalysis}</p>`;
    return;
  }
  // Expect an analysis object from analyzeDataset
  const a = textOrAnalysis;
  if (!a || !a.summary_statistics) {
    container.innerHTML = `<p>No insights available.</p>`;
    return;
  }
  const { mean, median, min, max, variance, stddev } = a.summary_statistics;
  const anomalies = (a.anomalies || []).map(x => x.x).join(', ') || 'None';
  const range = a.range ? `${a.range.start} → ${a.range.end}` : '';
  const trend = a.trends || 'stable';
  const rows = [
    ['Trend', trend],
    ['Mean', mean.toFixed(3)],
    ['Median', median.toFixed(3)],
    ['Min', min],
    ['Max', max],
    ['Variance', variance.toFixed(3)],
    ['Std Dev', stddev.toFixed(3)],
    ['Anomalies', anomalies],
    ['Range', range]
  ];
  container.innerHTML = `<table class="ai-table"><thead><tr><th>Metric</th><th>Value</th></tr></thead><tbody>${rows.map(r => `<tr><td>${r[0]}</td><td>${r[1]}</td></tr>`).join('')}</tbody></table>`;
}

// --- Utility functions for advanced input ---
function addTableRow(table) {
  const row = table.insertRow(-1);
  row.innerHTML = `<td><input type="text" class="label-input"></td><td><input type="number" class="value-input"></td><td><button type="button" class="remove-row">✖</button></td>`;
}
function tableToCSV(table) {
  let csv = 'Label,Value\n';
  Array.from(table.tBodies[0].rows).forEach(row => {
    const label = row.querySelector('.label-input').value;
    const value = row.querySelector('.value-input').value;
    if (label && value) csv += `${label},${value}\n`;
  });
  return csv.trim();
}
function csvToTable(csv, table) {
  // Remove all rows except the first
  while (table.tBodies[0].rows.length > 1) table.tBodies[0].deleteRow(1);
  const lines = csv.split(/\n|\r/).filter(Boolean);
  lines.slice(1).forEach(line => {
    const [label, value] = line.split(',');
    if (label && value) {
      addTableRow(table);
      const lastRow = table.tBodies[0].rows[table.tBodies[0].rows.length - 1];
      lastRow.querySelector('.label-input').value = label.trim();
      lastRow.querySelector('.value-input').value = value.trim();
    }
  });
}

// --- Robust normalization: free text -> two-column CSV ---
function normalizeTextToTwoColumnCSV(text) {
  const lines = text.split(/\r?\n/).map(l => l.trim());
  // Allow values like 4.14%, 4,14, or 4.14
  const dataPattern = /^(\d{4})\s+([-+]?\d{1,3}(?:[.,]\d+)?)(?:\s*%?)$/;
  let started = false;
  const extracted = [];
  let considered = 0;
  for (const line of lines) {
    if (!line) continue;
    const clean = line.replace(/,+\s*$/, '').trim();
    const csvLike = clean.includes(',');
    const partsCsv = csvLike ? clean.split(',').map(s => s.trim()) : null;
    const wsParts = clean.split(/\s+/).map(s => s.trim());
    // Detect start: either year value by whitespace, or two CSV cells with numeric second
    const match = clean.match(dataPattern);
    const isNumericLike = (v) => /^[-+]?\d{1,3}(?:[.,]\d+)?%?$/.test(v);
    const twoCells = (partsCsv && partsCsv.length >= 2 && /^\d{4}$/.test(partsCsv[0]) && isNumericLike(partsCsv[1])) ||
                     (wsParts.length >= 2 && /^\d{4}$/.test(wsParts[0]) && isNumericLike(wsParts[1]));
    // Fallback: extract year and next numeric value from a sentence
    let sentenceMatch = null;
    if (!match && !twoCells) {
      sentenceMatch = clean.match(/(?:^|\b)(19\d{2}|20\d{2})(?!\d).*?([-+]?\d{1,3}(?:[.,]\d+)?%?)/);
    }
    if (!started && (match || twoCells || sentenceMatch)) started = true;
    if (!started) continue; // skip headers/notes above data
    considered++;
    // Once started, accept rows that fit the pattern
    if (match) {
      const year = match[1];
      const val = match[2].replace(/%/g, '').replace(',', '.');
      extracted.push([year, val]);
      continue;
    }
    if (twoCells) {
      const year = partsCsv ? partsCsv[0] : wsParts[0];
      const raw = partsCsv ? partsCsv[1] : wsParts[1];
      const val = raw.replace(/%/g, '').replace(',', '.');
      extracted.push([year, val]);
      continue;
    }
    if (sentenceMatch) {
      const year = sentenceMatch[1];
      const val = sentenceMatch[2].replace(/%/g, '').replace(',', '.');
      extracted.push([year, val]);
      continue;
    }
    // tolerate blank or non-matching lines inside block by skipping
  }
  if (extracted.length === 0) {
    // Global fallback: scan entire text for (year, value) pairs
    const globalRe = /(?:^|\b)(19\d{2}|20\d{2})(?!\d)[^\n\r]*?([-+]?\d{1,3}(?:[.,]\d+)?%?)/g;
    const found = [];
    let m;
    while ((m = globalRe.exec(text)) !== null) {
      const y = m[1];
      const v = (m[2] || '').replace(/%/g, '').replace(',', '.');
      found.push([y, v]);
    }
    if (found.length === 0) {
      return { csv: 'Label,Value\nA,1', explanation: 'Could not detect year-value rows. Parsed 0 lines.' };
    }
    found.sort((a, b) => Number(a[0]) - Number(b[0]));
    const csv = ['Year,Value', ...found.map(r => r.join(','))].join('\n');
    return { csv, explanation: `Parsed ${found.length} rows using sentence scan.` };
  }
  // Sort chronologically
  const sorted = extracted.sort((a, b) => Number(a[0]) - Number(b[0]));
  const csv = ['Year,Value', ...sorted.map(r => r.join(','))].join('\n');
  return { csv, explanation: `Parsed ${extracted.length} of ${considered} lines as Year-Value (chronological).` };
}

// --- Modular AI Analysis Function ---
// Import the modular analysis function
// (Assume browser environment, so attach to window if needed)
// If using modules, use: import { analyzeDataset } from './aiAnalysis.js';
// For now, assume analyzeDataset is globally available after including aiAnalysis.js in HTML.

// --- Hook up AI analysis to graph generation ---
function showAIAnalysis(csv) {
  if (typeof analyzeDataset === 'function') {
    const result = analyzeDataset(csv);
    setAIInsights('ai-insights', result);
  } else {
    setAIInsights('ai-insights', 'AI analysis module not loaded.');
  }
}
// (Integrated analysis is handled within DOMContentLoaded submit handlers above.)