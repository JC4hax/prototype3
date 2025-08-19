// bloomberg.js

document.addEventListener('DOMContentLoaded', () => {
	// Ticker data (mock)
	const symbols = [
		{ sym: 'EURUSD', price: 1.105, chg: +0.14 },
		{ sym: 'DXY', price: 103.2, chg: -0.12 },
		{ sym: 'SPX', price: 5480, chg: +0.42 },
		{ sym: 'BTC', price: 67420, chg: -1.3 },
		{ sym: 'GOLD', price: 2385, chg: +0.22 }
	];
	const ticker = document.getElementById('marketTicker');
	if (ticker) {
		ticker.innerHTML = symbols.map(s => {
			const dir = s.chg>=0 ? '▲' : '▼';
			return `<span class="bb-tick"><span class="sym">${s.sym}</span><span class="price">${s.price}</span> <span class="chg">${dir} ${s.chg}%</span></span>`;
		}).join('');
	}

	// Main chart data (placeholder EURUSD yearly)
	const labels = ['2019','2020','2021','2022','2023','2024','2025'];
	const data = [1.12,1.14,1.18,1.05,1.08,1.08,1.11];
	const ctx = document.getElementById('mainChart');
	let mainChart;
	if (ctx) {
		mainChart = new Chart(ctx.getContext('2d'), {
			type: 'line',
			data: { labels, datasets: [{ label: 'EURUSD', data, borderColor: '#ffffff', backgroundColor: 'rgba(255,255,255,0.12)', tension: 0.25, fill: true, pointRadius: 0 }] },
			options: { responsive: true, plugins: { legend: { display: false } }, scales: { x: { grid: { color: '#1f2024' } }, y: { grid: { color: '#1f2024' } } } }
		});
	}

	// Stats cards
	const open = data[0], close = data[data.length-1], high = Math.max(...data), low = Math.min(...data);
	const setText = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = typeof v === 'number' ? v.toFixed(2) : v; };
	setText('statOpen', open); setText('statHigh', high); setText('statLow', low); setText('statClose', close);

	// AI Insights via analyzeDataset if available
	const insightsEl = document.getElementById('bbInsights');
	if (insightsEl) {
		const csv = ['Year,Value', ...labels.map((l,i)=>`${l},${data[i]}`)].join('\n');
		if (typeof analyzeDataset === 'function') {
			const res = analyzeDataset(csv);
			insightsEl.textContent = res.plain_text || 'Insights unavailable.';
		} else {
			insightsEl.textContent = 'AI module not loaded.';
		}
	}

	// Range buttons (demo: slice data)
	document.querySelectorAll('.bb-actions button').forEach(btn => {
		btn.addEventListener('click', () => {
			const range = btn.getAttribute('data-range');
			let slice = labels.length;
			if (range === '1M') slice = 1; if (range==='3M') slice=3; if (range==='1Y') slice=12; if (range==='5Y') slice=60;
			// For demo, just show last N points up to available length
			const n = Math.min(labels.length, slice);
			mainChart.data.labels = labels.slice(-n);
			mainChart.data.datasets[0].data = data.slice(-n);
			mainChart.update();
		});
	});

	// Mock news
	const news = [
		{ title: 'ECB keeps rates unchanged, signals cautious outlook', url: '#' },
		{ title: 'Dollar steady ahead of key US CPI print', url: '#' },
		{ title: 'Euro edges higher on improved German PMI', url: '#' }
	];
	const newsList = document.getElementById('newsList');
	if (newsList) {
		newsList.innerHTML = news.map(n => `<li><a href="${n.url}">${n.title}</a></li>`).join('');
	}
});