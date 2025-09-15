// Enhanced XP Progress Chart with SVG
function drawXPChart(containerId, transactions) {
    if (!transactions || !transactions.length) {
        document.getElementById(containerId).innerHTML = '<p style="color:white;">No XP data available</p>';
        return;
    }

    transactions.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    const container = document.getElementById(containerId);
    const width = container.clientWidth; // fill available space for largest chart
    // Make chart taller to reduce empty margins and improve readability
    const height = Math.max(440, Math.min(700, Math.round(width * 0.56)));
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

    // Reserve space for x-axis labels; define plot bounds
    const plotTop = pad;
    const plotBottom = height - (pad + 32);
    const plotHeight = plotBottom - plotTop;

    const scaleX = t => pad + (t - minDate) / (maxDate - minDate) * (width - 2 * pad);
    const scaleY = xp => plotBottom - (xp / maxXP) * plotHeight;

    // Draw line and area
    let linePath = "";
    let areaPath = `M ${scaleX(dataPoints[0].timestamp)} ${plotBottom}`;
    dataPoints.forEach((p, i) => {
        const x = scaleX(p.timestamp), y = scaleY(p.total);
        linePath += `${i === 0 ? "M" : "L"} ${x} ${y}`;
        areaPath += ` L ${x} ${y}`;
    });
    areaPath += ` L ${scaleX(dataPoints[dataPoints.length - 1].timestamp)} ${plotBottom} Z`;

    // Grid lines and Y labels
    let gridLines = "", yLabels = "";
    for (let i = 0; i <= 5; i++) {
        const y = plotTop + plotHeight * i / 5;
        const value = Math.round(maxXP * (5 - i) / 5);
        const labelY = Math.min(plotBottom - 6, Math.max(plotTop + 6, y));
        gridLines += `<line x1="${pad}" y1="${y}" x2="${width - pad}" y2="${y}" stroke="rgba(255,255,255,0.1)" stroke-width="1" stroke-dasharray="3,3"/>`;
        yLabels += `<text x="${pad + 6}" y="${labelY}" fill="rgba(255,255,255,0.85)" font-size="11" text-anchor="start" alignment-baseline="middle">${new Intl.NumberFormat().format(value)}</text>`;
    }

    // X labels (avoid clipping at edges)
    let xLabels = "";
    const labelCount = width < 520 ? 3 : 5;
    for (let i = 0; i <= labelCount; i++) {
        const t = minDate + (maxDate - minDate) * i / labelCount;
        const x = scaleX(t);
        const date = new Date(t);
        let anchor = 'middle';
        let dx = 0;
        if (i === 0) { anchor = 'start'; dx = 6; }
        else if (i === labelCount) { anchor = 'end'; dx = -6; }
        const fontSize = width < 420 ? 10 : 12;
        xLabels += `<text x="${x}" y="${plotBottom + 26}" dx="${dx}" fill="rgba(255,255,255,0.9)" font-size="${fontSize}" text-anchor="${anchor}">${date.toLocaleDateString()}</text>`;
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
        <line x1="${pad}" y1="${plotTop}" x2="${pad}" y2="${plotBottom}" stroke="#8b5cf6" stroke-width="2"/>
        <!-- X-axis -->
        <line x1="${pad}" y1="${plotBottom}" x2="${width - pad}" y2="${plotBottom}" stroke="#8b5cf6" stroke-width="2"/>
    `;

    container.style.height = height + 'px';
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

    // Debounced resize handler to re-render the SVG when layout changes
    if (container._xpResize) {
        window.removeEventListener('resize', container._xpResize);
    }
    container._xpResize = (() => {
        let timer;
        return () => {
            clearTimeout(timer);
            timer = setTimeout(() => drawXPChart(containerId, transactions), 150);
        };
    })();
    window.addEventListener('resize', container._xpResize);
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
  const el = document.getElementById(containerId);
  if (!el) return;

  // Clean category names and values
  const categories = transactions.map(t => (
    t.type.replace(/^skill[_-]?/i, '').replace(/[_\-]/g, ' ')
  ));
  const values = transactions.map(t => t.amount);

  // Responsive dimensions
  const bounds = el.getBoundingClientRect();
  const width = Math.max(360, Math.floor(bounds.width || 560));
  const height = Math.max(320, Math.min(520, Math.round(width * 0.72)));
  const cx = width / 2;
  const cy = height / 2 + 6; // nudge down to keep top labels inside
  const margin = 48; // a bit more side margin to keep long labels in-bounds
  const radius = Math.min(width, height) / 2 - margin;

  // Nice padded max for future-proof range
  const maxVal = Math.max(...values, 0);
  const niceCeil = (n) => {
    if (n <= 0) return 10;
    const exp = Math.pow(10, Math.floor(Math.log10(n)));
    const scaled = n / exp;
    const step = scaled <= 1 ? 1 : scaled <= 2 ? 2 : scaled <= 5 ? 5 : 10;
    return step * exp;
  };
  const paddedMax = niceCeil(maxVal * 1.6);
  const toR = (val) => (val / paddedMax) * radius;

  const n = Math.max(1, categories.length);
  const angleFor = i => (-Math.PI / 2) + (2 * Math.PI * i / n);
  const point = (i, r) => {
    const a = angleFor(i);
    return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
  };

  // Rings
  let rings = '';
  const levels = 5;
  for (let l = 1; l <= levels; l++) {
    const r = (radius * l) / levels;
    let d = '';
    for (let i = 0; i < n; i++) {
      const p = point(i, r);
      d += `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y} `;
    }
    d += 'Z';
    rings += `<path d="${d}" fill="none" stroke="rgba(255,255,255,0.12)" />`;
  }

  // Axes
  let axes = '';
  for (let i = 0; i < n; i++) {
    const p = point(i, radius);
    axes += `<line x1="${cx}" y1="${cy}" x2="${p.x}" y2="${p.y}" stroke="rgba(255,255,255,0.2)" />`;
  }

  // Labels (clamped inside viewBox)
  let labels = '';
  const labelFont = width < 520 ? 11 : 12;
  for (let i = 0; i < n; i++) {
    const a = angleFor(i);
    const pr = radius + 12;
    let px = cx + pr * Math.cos(a);
    let py = cy + pr * Math.sin(a);
    let anchor = (Math.cos(a) > 0.3) ? 'start' : (Math.cos(a) < -0.3) ? 'end' : 'middle';
    const dy = Math.sin(a) > 0.5 ? 10 : (Math.sin(a) < -0.5 ? -6 : 4);
    const padX = 12; // clamp a bit more to keep long words like "back end"
    if (px < padX) { px = padX; anchor = 'start'; }
    if (px > width - padX) { px = width - padX; anchor = 'end'; }
    labels += `<text x="${px}" y="${py + dy}" text-anchor="${anchor}" fill="#e5e7eb" font-size="${labelFont}" font-weight="600">${categories[i]}</text>`;
  }

  // Data polygon and markers
  let poly = '';
  let markers = '';
  for (let i = 0; i < n; i++) {
    const pr = toR(values[i]);
    const p = point(i, pr);
    poly += `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y} `;
    markers += `<circle cx="${p.x}" cy="${p.y}" r="4" fill="#0f172a" stroke="#38bdf8" stroke-width="2" />`;
  }
  poly += 'Z';

  // Radial tick labels (top axis)
  let ticks = '';
  for (let l = 1; l <= levels; l++) {
    const val = Math.round((paddedMax * l) / levels);
    const py = cy - ((radius * l) / levels);
    ticks += `<text x="${cx}" y="${py - 4}" fill="rgba(229,231,235,0.8)" font-size="10" text-anchor="middle">${val}</text>`;
  }

  // Render SVG
  el.innerHTML = `
    <svg width="100%" height="${height}" viewBox="0 0 ${width} ${height}" style="font-family: Inter, sans-serif;">
      ${rings}
      ${axes}
      <path d="${poly}" fill="rgba(56,189,248,0.25)" stroke="#38bdf8" stroke-width="2" />
      ${markers}
      ${labels}
      ${ticks}
    </svg>
  `;

  // Re-render on resize to keep labels visible when layout changes
  if (el._spiderResize) window.removeEventListener('resize', el._spiderResize);
  el._spiderResize = (() => { let t; return () => { clearTimeout(t); t = setTimeout(() => drawSpiderChart(containerId, transactions), 150); }; })();
  window.addEventListener('resize', el._spiderResize);
}
