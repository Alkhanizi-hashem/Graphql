// Enhanced XP Progress Chart with SVG
function drawXPChart(containerId, transactions) {
    if (!transactions || !transactions.length) {
        document.getElementById(containerId).innerHTML = '<p style="color:white;">No XP data available</p>';
        return;
    }

    transactions.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    const container = document.getElementById(containerId);
    const width = container.clientWidth; // fill available space for largest chart
    const height = 500; // taller to emphasize XP as the biggest chart
    const pad = 50;

    // Prepare cumulative XP data
    let cumulativeXP = 0;
    const dataPoints = transactions.map(tx => {
        cumulativeXP += tx.amount;
        return {
            date: new Date(tx.createdAt),
            xp: tx.amount,
            total: cumulativeXP,
            timestamp: new Date(tx.createdAt).getTime()
        };
    });

    const minDate = dataPoints[0].timestamp;
    const maxDate = dataPoints[dataPoints.length - 1].timestamp;
    const maxXP = Math.max(...dataPoints.map(d => d.total));

    const scaleX = t => pad + (t - minDate) / (maxDate - minDate) * (width - 2 * pad);
    const scaleY = xp => height - pad - (xp / maxXP) * (height - 2 * pad);

    // Draw line and area
    let linePath = "";
    let areaPath = `M ${scaleX(dataPoints[0].timestamp)} ${height - pad}`;
    dataPoints.forEach((p, i) => {
        const x = scaleX(p.timestamp), y = scaleY(p.total);
        linePath += `${i === 0 ? "M" : "L"} ${x} ${y}`;
        areaPath += ` L ${x} ${y}`;
    });
    areaPath += ` L ${scaleX(dataPoints[dataPoints.length - 1].timestamp)} ${height - pad} Z`;

    // Grid lines and Y labels
    let gridLines = "", yLabels = "";
    for (let i = 0; i <= 5; i++) {
        const y = pad + (height - 2 * pad) * i / 5;
        const value = Math.round(maxXP * (5 - i) / 5);
        gridLines += `<line x1="${pad}" y1="${y}" x2="${width - pad}" y2="${y}" stroke="rgba(255,255,255,0.1)" stroke-width="1" stroke-dasharray="3,3"/>`;
    }

    // X labels
    let xLabels = "";
    const labelCount = 4;
    for (let i = 0; i <= labelCount; i++) {
        const t = minDate + (maxDate - minDate) * i / labelCount;
        const x = scaleX(t);
        const date = new Date(t);
        xLabels += `<text x="${x}" y="${height - pad + 20}" fill="rgba(255,255,255,0.7)" font-size="12" text-anchor="middle">${date.toLocaleDateString()}</text>`;
    }

    // Data points with hover tooltips
    const fmt = (n) => new Intl.NumberFormat().format(Math.round(n));
    let dataPointsHTML = "";
    dataPoints.forEach(p => {
        const x = scaleX(p.timestamp), y = scaleY(p.total);
        const labelDate = p.date.toLocaleDateString();
        dataPointsHTML += `
          <circle class="xp-point" cx="${x}" cy="${y}" r="5"
                  fill="#000000ff" stroke="#38bdf8" stroke-width="2"
                  data-date="${labelDate}"
                  data-xp="${fmt(p.xp)}"
                  data-total="${fmt(p.total)}"></circle>`;
    });

    // Axes
    let axes = `
        <!-- Y-axis -->
        <line x1="${pad}" y1="${pad}" x2="${pad}" y2="${height - pad}" stroke="#8b5cf6" stroke-width="2"/>
        <!-- X-axis -->
        <line x1="${pad}" y1="${height - pad}" x2="${width - pad}" y2="${height - pad}" stroke="#8b5cf6" stroke-width="2"/>
    `;

    container.innerHTML = `
        <svg width="${width}" height="${height}">
            <defs>
                <linearGradient id="xpGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style="stop-color:#2563eb;stop-opacity:0.3"/>
                    <stop offset="100%" style="stop-color:#2563eb;stop-opacity:0.05"/>
                </linearGradient>
            </defs>
            ${axes}
            ${gridLines}${yLabels}${xLabels}
            <path d="${areaPath}" fill="url(#xpGradient)" opacity="0.7"/>
            <path d="${linePath}" fill="none" stroke="#38bdf8" stroke-width="2" style="filter: drop-shadow(0 0 6px #40cad9)"/>
            ${dataPointsHTML}
        </svg>
        <div class="chart-tooltip" style="display:none;"></div>
    `;

    // Interactive tooltip behavior
    container.style.position = 'relative';
    const tooltip = container.querySelector('.chart-tooltip');
    const circles = container.querySelectorAll('circle.xp-point');
    circles.forEach(c => {
        c.addEventListener('mouseenter', (e) => {
            const date = c.getAttribute('data-date');
            const xp = c.getAttribute('data-xp');
            const total = c.getAttribute('data-total');
            tooltip.innerHTML = `
              <div><strong>${date}</strong></div>
              <div>XP gained: ${xp}</div>
              <div>Total XP: ${total}</div>
            `;
            tooltip.style.display = 'block';
        });
        c.addEventListener('mousemove', (e) => {
            const rect = container.getBoundingClientRect();
            const left = Math.min(rect.width - 10, Math.max(10, e.clientX - rect.left + 12));
            const top = Math.min(rect.height - 10, Math.max(10, e.clientY - rect.top - 12));
            tooltip.style.left = left + 'px';
            tooltip.style.top = top + 'px';
        });
        c.addEventListener('mouseleave', () => {
            tooltip.style.display = 'none';
        });
    });
}




function drawXpLines(containerId, done, received) {
  // Normalize values
  received = Number(received) || 0;
  done = Number(done) || 0;

  const container = document.getElementById(containerId);
  if (!container) return;

  const bounds = container.getBoundingClientRect();
  const width = Math.max(280, Math.min(640, Math.floor(bounds.width)));
  const height = 200; // compact height to avoid clipping
  const barHeight = 18;
  const gap = 36; // space between bars
  const labelWidth = 86; // space for left labels
  const paddingRight = 20; // breathing room on right end

  const maxValue = Math.max(received, done, 1);
  const scale = value => (value / maxValue) * (width - labelWidth - paddingRight);

  const receivedLength = scale(received);
  const doneLength = scale(done);
  const ratio = received > 0 ? (done / received) : 0;

  // Ratio grading colors
  let ratioColor = "#60a5fa", grade = "";
  if (ratio <= 0.2) { grade = "Very Low"; ratioColor = "#ef4444"; }
  else if (ratio <= 0.5) { grade = "Low"; ratioColor = "#f59e0b"; }
  else if (ratio <= 0.7) { grade = "Average"; ratioColor = "#22c55e"; }
  else if (ratio <= 0.9) { grade = "Good"; ratioColor = "#10b981"; }
  else { grade = "Excellent"; ratioColor = "#059669"; }

  // Vertical positioning
  const totalBarsHeight = barHeight * 2 + gap;
  const offsetY = (height - totalBarsHeight) / 2 + barHeight / 2;
  const startX = labelWidth;

  const fmt = (v) => {
    const n = Number(v) || 0;
    if (n >= 1000) return n.toFixed(0);
    if (n >= 100) return n.toFixed(1);
    return n.toString();
  };

  container.innerHTML = `
    <svg width="100%" height="${height}" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" style="font-family: Inter, sans-serif;">
      <!-- Background band -->
      <rect x="0" y="0" width="${width}" height="${height}" rx="10" fill="rgba(255,255,255,0.04)" />

      <!-- Left labels -->
      <text x="6" y="${offsetY}" font-size="13" fill="#e5e7eb" alignment-baseline="middle">Received</text>
      <text x="6" y="${offsetY + gap}" font-size="13" fill="#e5e7eb" alignment-baseline="middle">Done</text>

      <!-- Received bar -->
      <line x1="${startX}" y1="${offsetY}" x2="${startX + receivedLength}" y2="${offsetY}"
            stroke="#6366f1" stroke-width="${barHeight}" stroke-linecap="round" />
      <text x="${startX + Math.max(20, receivedLength / 2)}" y="${offsetY}" font-size="12" fill="#ffffff" text-anchor="middle" alignment-baseline="middle">
        ${fmt(received)}
      </text>

      <!-- Done bar -->
      <line x1="${startX}" y1="${offsetY + gap}" x2="${startX + doneLength}" y2="${offsetY + gap}"
            stroke="#34d399" stroke-width="${barHeight}" stroke-linecap="round" />
      <text x="${startX + Math.max(20, doneLength / 2)}" y="${offsetY + gap}" font-size="12" fill="#111827" text-anchor="middle" alignment-baseline="middle">
        ${fmt(done)}
      </text>

      <!-- Ratio text -->
      <text x="${width - 8}" y="${offsetY + gap + 34}" font-size="14" font-weight="bold" fill="${ratioColor}" text-anchor="end">
        Ratio: ${ratio.toFixed(1)} • ${grade}
      </text>
    </svg>
  `;

}
function drawSpiderChart(containerId, transactions) {
  // Clean category names: remove leading "skill" and prettify
  const categories = transactions.map(t => (
    t.type
      .replace(/^skill[_-]?/i, "")
      .replace(/[_\-]/g, " ")
  ));
  const amounts = transactions.map(t => t.amount);

  // Wider future-proof range: pad and round up to a nice ceiling
  const maxAmount = Math.max(...amounts, 0);
  const niceCeil = (n) => {
    if (n <= 0) return 10;
    const exp = Math.pow(10, Math.floor(Math.log10(n)));
    const scaled = n / exp;
    let niceScaled;
    if (scaled <= 1) niceScaled = 1;
    else if (scaled <= 2) niceScaled = 2;
    else if (scaled <= 5) niceScaled = 5;
    else niceScaled = 10;
    return niceScaled * exp;
  };
  const paddedMax = niceCeil(maxAmount * 1.6);

  const options = {
    chart: {
      type: 'radar',
      height: 350, // smaller than XP chart
      toolbar: { show: false },
      foreColor: '#e5e7eb'
    },
    series: [{
      name: "XP",
      data: amounts
    }],
    xaxis: {
      categories: categories,
      labels: {
        style: { colors: "#f3f4f6", fontSize: "13px", fontWeight: 600 }
      }
    },
    yaxis: {
      show: true,
      min: 0,
      max: paddedMax,
      tickAmount: 5,
      labels: { style: { colors: "#9ca3af" } }
    },
    stroke: {
      width: 2,
      colors: ["#38bdf8"]
    },
    fill: {
      opacity: 0.3,
      colors: ["#38bdf8"]
    },
    markers: {
      size: 5,
      colors: ["#0f172a"],
      strokeColors: "#38bdf8",
      strokeWidth: 2
    },
    plotOptions: {
      radar: {
        polygons: {
          strokeColors: "rgba(255,255,255,0.1)",
          connectorColors: "rgba(255,255,255,0.15)"
        }
      }
    },
    tooltip: {
      theme: "dark",
      y: { formatter: (val) => val + " XP" }
    }
  };

  const chart = new ApexCharts(document.querySelector(`#${containerId}`), options);
  chart.render();
}
