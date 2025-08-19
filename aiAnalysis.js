// aiAnalysis.js
// Analysis utilities: numeric stats and rich text insights

// --- Helper numeric functions ---
function mean(values) {
  if (!values.length) return NaN;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}
function median(values) {
  if (!values.length) return NaN;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}
function variance(values) {
  if (values.length < 2) return 0;
  const m = mean(values);
  return values.reduce((acc, v) => acc + Math.pow(v - m, 2), 0) / values.length;
}
function standardDeviation(values) {
  return Math.sqrt(variance(values));
}
function pearsonCorrelation(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length || a.length < 2) return null;
  const ma = mean(a);
  const mb = mean(b);
  const denomA = Math.sqrt(a.reduce((acc, v) => acc + Math.pow(v - ma, 2), 0));
  const denomB = Math.sqrt(b.reduce((acc, v) => acc + Math.pow(v - mb, 2), 0));
  if (denomA === 0 || denomB === 0) return null;
  const cov = a.reduce((acc, v, i) => acc + (v - ma) * (b[i] - mb), 0);
  return cov / (denomA * denomB);
}

// --- Part 1: Single Dataset Analyzer (numeric) ---
// analyzeDataset(array) -> { mean, median, min, max, range, variance, standardDeviation, trend }
function analyzeDatasetNumbers(array) {
  const values = (array || []).map(Number).filter(v => Number.isFinite(v));
  if (values.length < 2) {
    return {
      mean: NaN,
      median: NaN,
      min: NaN,
      max: NaN,
      range: NaN,
      variance: NaN,
      standardDeviation: NaN,
      trend: 'increasing'
    };
  }
  const m = mean(values);
  const med = median(values);
  const minv = Math.min(...values);
  const maxv = Math.max(...values);
  const rang = maxv - minv;
  const vari = variance(values);
  const sd = Math.sqrt(vari);
  const trend = values[values.length - 1] >= values[0] ? 'increasing' : 'decreasing';
  return {
    mean: m,
    median: med,
    min: minv,
    max: maxv,
    range: rang,
    variance: vari,
    standardDeviation: sd,
    trend
  };
}

// --- Part 2: Comparative Analyzer ---
function compareDatasets(arrayA, arrayB) {
  const aVals = (arrayA || []).map(Number).filter(v => Number.isFinite(v));
  const bVals = (arrayB || []).map(Number).filter(v => Number.isFinite(v));
  const datasetA = analyzeDatasetNumbers(aVals);
  const datasetB = analyzeDatasetNumbers(bVals);
  const comparison = {
    meanDifference: datasetA.mean - datasetB.mean,
    medianDifference: datasetA.median - datasetB.median,
    moreVolatile: (datasetA.standardDeviation || 0) >= (datasetB.standardDeviation || 0) ? 'A' : 'B',
    trendRelation: datasetA.trend === datasetB.trend ? 'same' : 'different',
    correlation: aVals.length === bVals.length ? pearsonCorrelation(aVals, bVals) : null
  };
  return { datasetA, datasetB, comparison };
}

// --- Backward-compatible rich analyzer (CSV / objects) used elsewhere in app ---
function analyzeDatasetRich(data, meta = {}) {
  let rows = [];
  if (typeof data === 'string') {
    const lines = data.split(/\n|\r/).filter(Boolean);
    if (lines.length < 2) return { error: 'Not enough data.' };
    const [header, ...rest] = lines;
    const [xKey, yKey] = header.split(',').map(s => s.trim());
    rows = rest.map(line => {
      const [x, y] = line.split(',');
      return { x: x.trim(), y: Number(y.trim()) };
    });
    meta.columns = [xKey, yKey];
  } else if (Array.isArray(data)) {
    if (data.length === 0) return { error: 'Empty dataset.' };
    if (Array.isArray(data[0])) {
      rows = data.map(([x, y]) => ({ x, y: Number(y) }));
    } else if (typeof data[0] === 'object') {
      rows = data.map(({ x, y }) => ({ x, y: Number(y) }));
    }
  } else {
    return { error: 'Unsupported data format.' };
  }
  if (rows.length < 2) return { error: 'Not enough data rows.' };

  const values = rows.map(r => r.y).filter(v => !isNaN(v));
  const m = mean(values);
  const med = median(values);
  const vari = variance(values);
  const minv = Math.min(...values);
  const maxv = Math.max(...values);
  let trend = 'stable';
  if (values[0] < values[values.length-1]) trend = 'increasing';
  else if (values[0] > values[values.length-1]) trend = 'decreasing';
  const stddev = Math.sqrt(vari);
  const anomalies = rows.filter(r => Math.abs(r.y - m) > 2 * stddev);
  const patterns = [];
  if (rows.length >= 12 && meta.columns && /month|date|time/i.test(meta.columns[0])) {
    patterns.push('Possible seasonality detected (needs deeper analysis).');
  }
  let contextual_insights = 'Contextual insights and economic context coming soon.';
  let plain_text = `${meta.columns ? meta.columns[1] : 'Value'} shows a ${trend} trend from ${rows[0].x} to ${rows[rows.length-1].x}.\n`;
  plain_text += `Mean: ${m.toFixed(3)}, Median: ${med.toFixed(3)}, Min: ${minv}, Max: ${maxv}, Variance: ${vari.toFixed(3)}.\n`;
  if (anomalies.length) plain_text += `Anomalies detected at: ${anomalies.map(a => a.x).join(', ')}.\n`;
  if (patterns.length) plain_text += `Patterns: ${patterns.join('; ')}\n`;
  plain_text += contextual_insights;
  return {
    summary_statistics: { mean: m, median: med, min: minv, max: maxv, variance: vari, stddev },
    trends: trend,
    anomalies,
    patterns,
    contextual_insights,
    plain_text
  };
}

// --- Public API ---
function analyzeDataset(data, meta) {
  // If input looks like an array of numbers, return numeric stats per requirements
  if (Array.isArray(data) && (data.length === 0 || typeof data[0] !== 'object')) {
    return analyzeDatasetNumbers(data);
  }
  // Otherwise, use the rich analyzer (CSV / objects) for existing pages
  return analyzeDatasetRich(data, meta);
}

// Expose to browser
if (typeof window !== 'undefined') {
  window.analyzeDataset = analyzeDataset;
  window.compareDatasets = compareDatasets;
  window.analyzeDatasetNumbers = analyzeDatasetNumbers;
}
// Export for Node
if (typeof module !== 'undefined') module.exports = { analyzeDataset, compareDatasets, analyzeDatasetNumbers };