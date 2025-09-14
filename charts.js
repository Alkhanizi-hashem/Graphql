// Enhanced XP Progress Chart with SVG
function drawXPChart(containerId, transactions) {
    if (!transactions || !transactions.length) {
        document.getElementById(containerId).innerHTML = '<p style="color:white;">No XP data available</p>';
        return;
    }

    transactions.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    const container = document.getElementById(containerId);
    const width = Math.min(500, container.clientWidth);
    const height = 350;
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
        yLabels += `<text x="${pad - 10}" y="${y + 5}" fill="rgba(255,255,255,0.7)" font-size="12" text-anchor="end">${value}</text>`;
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

    // Data points
    let dataPointsHTML = "";
    dataPoints.forEach(p => {
        const x = scaleX(p.timestamp), y = scaleY(p.total);
        dataPointsHTML += `<circle cx="${x}" cy="${y}" r="5" fill="#63ccecff" stroke="white" stroke-width="2"></circle>`;
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
            <path d="${linePath}" fill="none" stroke="#40cad9ff" stroke-width="2" style="filter: drop-shadow(0 0 6px #40cad9)"/>
            ${dataPointsHTML}
        </svg>
    `;
}




function drawXpLines(containerId, done, received) {
    received = Number(received);
    done = Number(done);

    const container = document.getElementById(containerId);
    const width = Math.min(500, container.clientWidth);
    const height = 150; // total SVG height
    const barHeight = 20;
    const gap = 50;
    const labelWidth = 80; // space for left labels
    const padding = 25;

    const maxValue = Math.max(received, done, 1);
    const scale = value => (value / maxValue) * (width - labelWidth - padding);

    const receivedLength = scale(received);
    const doneLength = scale(done);
    const ratio = received > 0 ? (done / received).toFixed(1) : "0.0";

    // Ratio grading colors
    let ratioColor = "#6366f1", grade = "";
    if (ratio <= 0.2) { grade = "Very Low!"; ratioColor = "#ef4444"; }
    else if (ratio <= 0.5) { grade = "Low"; ratioColor = "#f59e0b"; }
    else if (ratio <= 0.7) { grade = "Average"; ratioColor = "#22c55e"; }
    else if (ratio <= 0.9) { grade = "Good"; ratioColor = "#10b981"; }
    else { grade = "Excellent"; ratioColor = "#059669"; }

    // Center the bars vertically
    const totalBarsHeight = barHeight * 2 + gap;
    const offsetY = (height - totalBarsHeight) / 2 + barHeight / 2;

    const startX = labelWidth;

    container.innerHTML = `
      <svg width="${width}" height="${height}" style="display:block; margin-top:${height/2}; font-family:sans-serif;">
        <!-- Left labels -->
        <text x="0" y="${offsetY}" font-size="14" fill="#ffffff" text-anchor="start" alignment-baseline="middle">Received</text>
        <text x="0" y="${offsetY + gap}" font-size="14" fill="#ffffff" text-anchor="start" alignment-baseline="middle">Done</text>

        <!-- Received bar -->
        <line x1="${startX}" y1="${offsetY}" x2="${startX + receivedLength}" y2="${offsetY}" 
              stroke="#6366f1" stroke-width="${barHeight}" stroke-linecap="round"/>
        <text x="${startX + receivedLength / 2}" y="${offsetY}" font-size="14" fill="#ffffff" text-anchor="middle" alignment-baseline="middle">
          ${received}
        </text>

        <!-- Done bar -->
        <line x1="${startX}" y1="${offsetY + gap}" x2="${startX + doneLength}" y2="${offsetY + gap}" 
              stroke="#4ade80" stroke-width="${barHeight}" stroke-linecap="round"/>
        <text x="${startX + doneLength / 2}" y="${offsetY + gap}" font-size="14" fill="#ffffff" text-anchor="middle" alignment-baseline="middle">
          ${done}
        </text>

        <!-- Ratio text -->
        <text x="${width / 2}" y="${offsetY + gap + 45}" font-size="16" font-weight="bold" fill="${ratioColor}" text-anchor="middle">
          Ratio: ${ratio} ${grade}
        </text>
      </svg>
    `;
}
