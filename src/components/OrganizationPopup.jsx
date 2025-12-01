import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as d3 from 'd3';
import { Box, IconButton, Typography, ToggleButtonGroup, ToggleButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

const OrganizationPopup = ({ organizationData, onClose }) => {
  const sankeyRef = useRef(null);
  const streamRef = useRef(null);
  const [selectedYear, setSelectedYear] = useState(0);

  const colors = {
    pageBg: '#141b2d',
    panelBg: '#1f2a40',
    positive: '#4dcdac',
    negative: '#ff6b6b',
    text: '#e0e0e0',
    textMuted: 'rgba(255,255,255,0.5)',
    gridLine: 'rgba(77, 205, 172, 0.12)'
  };

  // Year labels based on data slot position (reversed: oldest to newest)
  // yr1 = 2019, yr2 = 2020, yr3 = 2021, yr4 = 2022, yr5 = 2023
  const slotToYearMap = {
    1: '2019',
    2: '2020',
    3: '2021',
    4: '2022',
    5: '2023'
  };

  // Helper function to get year label from slot number
  const getYearLabel = useCallback((slotNumber) => {
    return slotToYearMap[slotNumber] || `${slotNumber}`;
  }, []);

  const formatCurrency = useCallback((value) => {
    const absValue = Math.abs(value);
    if (absValue >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (absValue >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
    if (absValue >= 1e3) return `$${(value / 1e3).toFixed(0)}K`;
    return `$${value.toFixed(0)}`;
  }, []);

  useEffect(() => {
    if (organizationData && organizationData.years && organizationData.years.length > 0) {
      setSelectedYear(0);
    }
  }, [organizationData]);

  const renderSankeyChart = (data, yearIndex) => {
    const svg = d3.select(sankeyRef.current);
    svg.selectAll('*').remove();
    
    const width = 580;
    const height = 400;
    const margin = { top: 45, right: 20, bottom: 15, left: 20 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    
    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);
    
    const yearData = data.years[yearIndex];
    
    // === LAYER 1: Revenue Sources (only use reliable metrics 65%+) ===
    const totalRevenue = yearData.totalRevenue || 0;
    const contributions = yearData.contributions || 0;        // 77% coverage
    const programRevenue = yearData.programRevenue || 0;      // 71% coverage
    const investmentIncome = yearData.investmentIncome || 0;  // 77% coverage
    
    // Calculate other revenue (what's left)
    const knownRevenue = contributions + programRevenue + investmentIncome;
    const otherRevenue = Math.max(0, totalRevenue - knownRevenue);
    
    // === LAYER 3: Expense breakdown ===
    const totalExpenses = yearData.totalExpenses || 0;        // 98% coverage
    const officerComp = yearData.officerCompensation || 0;    // 65% coverage
    const otherExpenses = Math.max(0, totalExpenses - officerComp);
    
    // === LAYER 3: Outcome ===
    const surplus = yearData.surplus || (totalRevenue - totalExpenses);  // 98% coverage
    
    // Skip rendering if no revenue data
    if (totalRevenue === 0) {
      g.append('text')
        .attr('x', innerWidth / 2)
        .attr('y', innerHeight / 2)
        .attr('text-anchor', 'middle')
        .attr('fill', colors.textMuted)
        .text('No financial data available');
      return;
    }
    
    // Column positions (3 layers)
    const col1X = 5;                    // Revenue sources
    const col2X = innerWidth * 0.42;    // Total Revenue
    const col3X = innerWidth - 20;      // Expenses + Surplus
    
    const nodeWidth = 12;
    const centerY = innerHeight / 2;
    
    // === BUILD DATA ARRAYS FIRST TO CALCULATE TOTAL HEIGHTS ===
    
    // Revenue sources
    const revenueSources = [
      { key: 'contributions', label: 'Contributions', value: contributions, color: '#3b82f6' },
      { key: 'programRevenue', label: 'Program Revenue', value: programRevenue, color: '#8b5cf6' },
      { key: 'investmentIncome', label: 'Investment', value: investmentIncome, color: '#f59e0b' },
      { key: 'otherRevenue', label: 'Other', value: otherRevenue, color: '#64748b' }
    ].filter(d => d.value > 0);
    
    // Destinations
    const surplusColor = surplus >= 0 ? '#10b981' : '#ef4444';
    const surplusLabel = surplus >= 0 ? 'Surplus' : 'Deficit';
    
    const destinations = [
      { key: 'officerComp', label: 'Officer Comp', value: officerComp, color: '#ef4444' },
      { key: 'otherExpenses', label: 'Other Expenses', value: otherExpenses, color: '#6b7280' },
      { key: 'surplus', label: surplusLabel, value: Math.abs(surplus), color: surplusColor }
    ].filter(d => d.value > 0);
    
    // === DYNAMIC HEIGHT CALCULATION ===
    // Calculate the maximum total value that needs to be displayed
    const sourceTotal = revenueSources.reduce((sum, s) => sum + s.value, 0);
    const destTotal = destinations.reduce((sum, d) => sum + d.value, 0);
    const maxTotal = Math.max(sourceTotal, destTotal, totalRevenue);
    
    // Calculate gaps
    const sourceGap = 5;
    const destGap = 5;
    const totalSourceGaps = (revenueSources.length - 1) * sourceGap;
    const totalDestGaps = (destinations.length - 1) * destGap;
    
    // Available height for nodes (leaving space for gaps)
    const availableHeight = innerHeight - Math.max(totalSourceGaps, totalDestGaps) - 20; // 20px padding
    
    // Create height scale that fits everything within available height
    const heightScale = d3.scaleLinear()
      .domain([0, maxTotal])
      .range([0, availableHeight]);
    
    // Minimum node height
    const minNodeHeight = 3;
    
    // Color palette
    const nodeColors = {
      totalRevenue: '#4dcdac'
    };
    
    // Tooltip
    const tooltip = d3.select('body').append('div')
      .attr('class', 'sankey-tooltip')
      .style('position', 'absolute')
      .style('visibility', 'hidden')
      .style('background-color', 'rgba(0, 0, 0, 0.9)')
      .style('color', '#fff')
      .style('padding', '8px 12px')
      .style('border-radius', '6px')
      .style('font-size', '11px')
      .style('pointer-events', 'none')
      .style('z-index', '10000');
    
    // ============ LAYER 1: Revenue Sources ============
    const totalSourceHeight = revenueSources.reduce((sum, s) => sum + Math.max(heightScale(s.value), minNodeHeight), 0);
    let sourceY = centerY - (totalSourceHeight + totalSourceGaps) / 2;
    
    const sourceNodes = [];
    revenueSources.forEach((source) => {
      const nodeHeight = Math.max(heightScale(source.value), minNodeHeight);
      sourceNodes.push({ ...source, x: col1X, y: sourceY, height: nodeHeight });
      
      // Draw node
      g.append('rect')
        .attr('x', col1X)
        .attr('y', sourceY)
        .attr('width', nodeWidth)
        .attr('height', nodeHeight)
        .attr('fill', source.color)
        .attr('rx', 2)
        .style('cursor', 'pointer')
        .on('mouseover', function(event) {
          d3.select(this).attr('opacity', 0.8);
          tooltip.style('visibility', 'visible')
            .html(`<strong>${source.label}</strong><br/>${formatCurrency(source.value)}<br/>${((source.value / totalRevenue) * 100).toFixed(1)}% of revenue`);
        })
        .on('mousemove', function(event) {
          tooltip.style('top', (event.pageY - 10) + 'px').style('left', (event.pageX + 10) + 'px');
        })
        .on('mouseout', function() {
          d3.select(this).attr('opacity', 1);
          tooltip.style('visibility', 'hidden');
        });
      
      // Label on right of node
      g.append('text')
        .attr('x', col1X + nodeWidth + 5)
        .attr('y', sourceY + nodeHeight / 2)
        .attr('font-size', '9px')
        .attr('fill', colors.text)
        .attr('dominant-baseline', 'middle')
        .text(source.label);
      
      sourceY += nodeHeight + sourceGap;
    });
    
    // ============ LAYER 2: Total Revenue ============
    const totalRevHeight = Math.max(heightScale(totalRevenue), minNodeHeight);
    const totalRevY = centerY - totalRevHeight / 2;
    
    g.append('rect')
      .attr('x', col2X)
      .attr('y', totalRevY)
      .attr('width', nodeWidth)
      .attr('height', totalRevHeight)
      .attr('fill', nodeColors.totalRevenue)
      .attr('rx', 2)
      .style('cursor', 'pointer')
      .on('mouseover', function(event) {
        d3.select(this).attr('opacity', 0.8);
        tooltip.style('visibility', 'visible')
          .html(`<strong>Total Revenue</strong><br/>${formatCurrency(totalRevenue)}`);
      })
      .on('mousemove', function(event) {
        tooltip.style('top', (event.pageY - 10) + 'px').style('left', (event.pageX + 10) + 'px');
      })
      .on('mouseout', function() {
        d3.select(this).attr('opacity', 1);
        tooltip.style('visibility', 'hidden');
      });
    
    // Label above
    g.append('text')
      .attr('x', col2X + nodeWidth / 2)
      .attr('y', totalRevY - 8)
      .attr('text-anchor', 'middle')
      .attr('font-size', '10px')
      .attr('font-weight', '600')
      .attr('fill', nodeColors.totalRevenue)
      .text('Total Revenue');
    
    // ============ LAYER 3: Destinations (Expenses + Surplus) ============
    const totalDestHeight = destinations.reduce((sum, d) => sum + Math.max(heightScale(d.value), minNodeHeight), 0);
    let destY = centerY - (totalDestHeight + totalDestGaps) / 2;
    
    const destNodes = [];
    destinations.forEach((dest) => {
      const nodeHeight = Math.max(heightScale(dest.value), minNodeHeight);
      destNodes.push({ ...dest, x: col3X - nodeWidth, y: destY, height: nodeHeight });
      
      g.append('rect')
        .attr('x', col3X - nodeWidth)
        .attr('y', destY)
        .attr('width', nodeWidth)
        .attr('height', nodeHeight)
        .attr('fill', dest.color)
        .attr('rx', 2)
        .style('cursor', 'pointer')
        .on('mouseover', function(event) {
          d3.select(this).attr('opacity', 0.8);
          const displayValue = dest.key === 'surplus' ? surplus : dest.value;
          const pctLabel = dest.key === 'surplus' ? 'of revenue' : 'of expenses';
          const pctBase = dest.key === 'surplus' ? totalRevenue : totalExpenses;
          tooltip.style('visibility', 'visible')
            .html(`<strong>${dest.label}</strong><br/>${formatCurrency(displayValue)}<br/>${((Math.abs(dest.value) / pctBase) * 100).toFixed(1)}% ${pctLabel}`);
        })
        .on('mousemove', function(event) {
          tooltip.style('top', (event.pageY - 10) + 'px').style('left', (event.pageX + 10) + 'px');
        })
        .on('mouseout', function() {
          d3.select(this).attr('opacity', 1);
          tooltip.style('visibility', 'hidden');
        });
      
      // Label on left of node
      g.append('text')
        .attr('x', col3X - nodeWidth - 5)
        .attr('y', destY + nodeHeight / 2)
        .attr('text-anchor', 'end')
        .attr('font-size', '9px')
        .attr('fill', dest.key === 'surplus' ? dest.color : colors.text)
        .attr('dominant-baseline', 'middle')
        .text(dest.label);
      
      destY += nodeHeight + destGap;
    });
    
    // ============ FLOWS: Revenue Sources → Total Revenue ============
    let targetY = totalRevY;
    sourceNodes.forEach(source => {
      const targetHeight = (source.value / totalRevenue) * totalRevHeight;
      
      const x1 = source.x + nodeWidth;
      const x2 = col2X;
      const cpOffset = (x2 - x1) * 0.5;
      
      const path = `
        M ${x1} ${source.y}
        C ${x1 + cpOffset} ${source.y}, ${x2 - cpOffset} ${targetY}, ${x2} ${targetY}
        L ${x2} ${targetY + targetHeight}
        C ${x2 - cpOffset} ${targetY + targetHeight}, ${x1 + cpOffset} ${source.y + source.height}, ${x1} ${source.y + source.height}
        Z
      `;
      
      g.append('path')
        .attr('d', path)
        .attr('fill', source.color)
        .attr('opacity', 0.35);
      
      targetY += targetHeight;
    });
    
    // ============ FLOWS: Total Revenue → Destinations ============
    let sourceY2 = totalRevY;
    destNodes.forEach(dest => {
      const sourceHeight = (dest.value / totalRevenue) * totalRevHeight;
      
      const x1 = col2X + nodeWidth;
      const x2 = dest.x;
      const cpOffset = (x2 - x1) * 0.5;
      
      const path = `
        M ${x1} ${sourceY2}
        C ${x1 + cpOffset} ${sourceY2}, ${x2 - cpOffset} ${dest.y}, ${x2} ${dest.y}
        L ${x2} ${dest.y + dest.height}
        C ${x2 - cpOffset} ${dest.y + dest.height}, ${x1 + cpOffset} ${sourceY2 + sourceHeight}, ${x1} ${sourceY2 + sourceHeight}
        Z
      `;
      
      g.append('path')
        .attr('d', path)
        .attr('fill', dest.color)
        .attr('opacity', 0.3);
      
      sourceY2 += sourceHeight;
    });
    
    // Title with Year Label
    const slotNumber = yearData.slot || (yearIndex + 1);
    const yearLabel = getYearLabel(slotNumber);
    g.append('text')
      .attr('x', innerWidth / 2)
      .attr('y', -25)
      .attr('text-anchor', 'middle')
      .attr('font-size', '12px')
      .attr('font-weight', '600')
      .attr('fill', colors.text)
      .text(`${yearLabel} Financial Flow`);
    
    return () => {
      tooltip.remove();
    };
  };

  // NEW: Asset Utilization Stream Chart
  const renderAssetUtilizationChart = (data) => {
    const svg = d3.select(streamRef.current);
    svg.selectAll('*').remove();
    
    const width = 580;
    const height = 400;
    const margin = { top: 50, right: 60, bottom: 55, left: 70 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    
    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);
    
    const sortedYears = [...data.years].sort((a, b) => (a.slot || 0) - (b.slot || 0));
    
    // Process data for Asset Utilization metrics
    const processedData = sortedYears.map((yr, i) => {
      const totalAssets = yr.totalAssets || 1;
      const totalLiabilities = yr.totalLiabilities || 0;
      const netAssets = yr.netAssets || 0;
      const totalRevenue = yr.totalRevenue || 0;
      
      // Y-axis: Asset Productivity (Revenue / Assets)
      const assetProductivity = totalAssets > 0 ? totalRevenue / totalAssets : 0;
      
      // Color: Debt Ratio (Liabilities / Assets) - higher = more red
      const debtRatio = totalAssets > 0 ? totalLiabilities / totalAssets : 0;
      
      // Use slot number for year label (yr1 = Year 1, yr2 = Year 2, etc.)
      const slotNumber = yr.slot || (i + 1);
      
      return {
        year: yr.year,
        slot: slotNumber,
        yearLabel: getYearLabel(slotNumber),
        assetProductivity,
        netAssets,
        totalAssets,
        totalLiabilities,
        totalRevenue,
        debtRatio
      };
    });
    
    // X Scale - use point scale for discrete year labels (only show years with data)
    const xScale = d3.scalePoint()
      .domain(processedData.map(d => d.yearLabel))
      .range([0, innerWidth])
      .padding(0.5);
    
    // Y Scale - Dynamic based on data
    const yExtent = d3.extent(processedData, d => d.assetProductivity);
    const yPadding = (yExtent[1] - yExtent[0]) * 0.15 || 0.1;
    const yScale = d3.scaleLinear()
      .domain([Math.max(0, yExtent[0] - yPadding), yExtent[1] + yPadding])
      .range([innerHeight, 0]);
    
    // Thickness scale based on ABSOLUTE net assets (not growth rate)
    const maxNetAssets = Math.max(...processedData.map(d => Math.abs(d.netAssets)), 1);
    const thicknessScale = d3.scaleLinear()
      .domain([0, maxNetAssets])
      .range([8, 45]);
    
    // Color scale for debt ratio (green = low debt, red = high debt)
    // Scale is 0-100% where 100% means liabilities >= assets
    const colorScale = d3.scaleLinear()
      .domain([0, 0.5, 1])
      .range(['#10b981', '#fbbf24', '#ef4444'])
      .clamp(true);
    
    // Grid lines
    g.selectAll('.grid-line-h')
      .data(yScale.ticks(5))
      .enter()
      .append('line')
      .attr('x1', 0)
      .attr('x2', innerWidth)
      .attr('y1', d => yScale(d))
      .attr('y2', d => yScale(d))
      .attr('stroke', colors.gridLine)
      .attr('stroke-dasharray', '3,3');
    
    const defs = svg.append('defs');
    
    // Tooltip
    const tooltip = d3.select('body').append('div')
      .attr('class', 'asset-tooltip')
      .style('position', 'absolute')
      .style('visibility', 'hidden')
      .style('background-color', 'rgba(0, 0, 0, 0.9)')
      .style('color', '#fff')
      .style('padding', '10px 14px')
      .style('border-radius', '8px')
      .style('font-size', '11px')
      .style('pointer-events', 'none')
      .style('z-index', '10000')
      .style('max-width', '220px')
      .style('line-height', '1.5');
    
    // Ribbons between years
    for (let i = 0; i < processedData.length - 1; i++) {
      const curr = processedData[i];
      const next = processedData[i + 1];
      
      const x1 = xScale(curr.yearLabel);
      const x2 = xScale(next.yearLabel);
      const y1 = yScale(curr.assetProductivity);
      const y2 = yScale(next.assetProductivity);
      
      // Thickness based on absolute net assets
      const thickness1 = thicknessScale(Math.abs(curr.netAssets));
      const thickness2 = thicknessScale(Math.abs(next.netAssets));
      
      // Gradient based on debt ratio
      const gradientId = `asset-ribbon-gradient-${i}`;
      const gradient = defs.append('linearGradient')
        .attr('id', gradientId)
        .attr('x1', '0%')
        .attr('y1', '0%')
        .attr('x2', '100%')
        .attr('y2', '0%');
      
      gradient.append('stop')
        .attr('offset', '0%')
        .attr('stop-color', colorScale(curr.debtRatio));
      
      gradient.append('stop')
        .attr('offset', '100%')
        .attr('stop-color', colorScale(next.debtRatio));
      
      const ribbonPath = `
        M ${x1} ${y1 - thickness1 / 2}
        C ${(x1 + x2) / 2} ${y1 - thickness1 / 2}, ${(x1 + x2) / 2} ${y2 - thickness2 / 2}, ${x2} ${y2 - thickness2 / 2}
        L ${x2} ${y2 + thickness2 / 2}
        C ${(x1 + x2) / 2} ${y2 + thickness2 / 2}, ${(x1 + x2) / 2} ${y1 + thickness1 / 2}, ${x1} ${y1 + thickness1 / 2}
        Z
      `;
      
      g.append('path')
        .attr('d', ribbonPath)
        .attr('fill', `url(#${gradientId})`)
        .attr('opacity', 0.75);
    }
    
    // Center line (dashed) - subtle connector
    const line = d3.line()
      .x(d => xScale(d.yearLabel))
      .y(d => yScale(d.assetProductivity))
      .curve(d3.curveCatmullRom.alpha(0.5));
    
    g.append('path')
      .datum(processedData)
      .attr('d', line)
      .attr('fill', 'none')
      .attr('stroke', '#94a3b8')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '4,4')
      .attr('opacity', 0.4);
    
    // Data points - SIMPLE single circle, color based on debt ratio
    processedData.forEach((d) => {
      const cx = xScale(d.yearLabel);
      const cy = yScale(d.assetProductivity);
      
      // Single circle with debt-ratio color
      g.append('circle')
        .attr('cx', cx)
        .attr('cy', cy)
        .attr('r', 7)
        .attr('fill', colorScale(d.debtRatio))
        .attr('stroke', colors.pageBg)
        .attr('stroke-width', 2)
        .style('cursor', 'pointer')
        .on('mouseover', function(event) {
          d3.select(this).attr('r', 9);
          const debtRatioDisplay = Math.min(d.debtRatio * 100, 100).toFixed(1);
          const overLeveraged = d.debtRatio > 1;
          tooltip.style('visibility', 'visible')
            .html(`
              <div style="font-weight:600; color:#4dcdac; margin-bottom:6px;">${d.yearLabel}</div>
              <div><span style="color:#94a3b8;">Total Revenue:</span> ${formatCurrency(d.totalRevenue)}</div>
              <div><span style="color:#94a3b8;">Total Assets:</span> ${formatCurrency(d.totalAssets)}</div>
              <div><span style="color:#94a3b8;">Total Liabilities:</span> ${formatCurrency(d.totalLiabilities)}</div>
              <div style="margin-top:4px; padding-top:4px; border-top:1px solid rgba(255,255,255,0.1);">
                <span style="color:#94a3b8;">Debt Ratio:</span> 
                <span style="color:${colorScale(Math.min(d.debtRatio, 1))};">${debtRatioDisplay}%${overLeveraged ? ' (Over-leveraged)' : ''}</span>
              </div>
            `);
        })
        .on('mousemove', function(event) {
          tooltip.style('top', (event.pageY - 10) + 'px')
            .style('left', (event.pageX + 15) + 'px');
        })
        .on('mouseout', function() {
          d3.select(this).attr('r', 7);
          tooltip.style('visibility', 'hidden');
        });
      
      // Asset productivity label above point
      g.append('text')
        .attr('x', cx)
        .attr('y', cy - 14)
        .attr('text-anchor', 'middle')
        .attr('font-size', '10px')
        .attr('font-weight', '600')
        .attr('fill', colors.text)
        .text(`${(d.assetProductivity * 100).toFixed(0)}%`);
    });
    
    // X Axis - shows only years with data using year labels
    const xAxis = d3.axisBottom(xScale);
    
    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(xAxis)
      .selectAll('text')
      .attr('font-size', '11px')
      .attr('fill', colors.textMuted);
    
    g.selectAll('.domain, .tick line').attr('stroke', colors.gridLine);
    
    // Y Axis
    const yAxis = d3.axisLeft(yScale)
      .ticks(5)
      .tickFormat(d => `${(d * 100).toFixed(0)}%`);
    
    g.append('g')
      .call(yAxis)
      .selectAll('text')
      .attr('font-size', '11px')
      .attr('fill', colors.textMuted);
    
    // Axis labels
    g.append('text')
      .attr('x', innerWidth / 2)
      .attr('y', innerHeight + 42)
      .attr('text-anchor', 'middle')
      .attr('font-size', '11px')
      .attr('fill', colors.textMuted)
      .text('Year');
    
    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -innerHeight / 2)
      .attr('y', -50)
      .attr('text-anchor', 'middle')
      .attr('font-size', '11px')
      .attr('fill', colors.textMuted)
      .text('Asset Productivity (Revenue ÷ Assets)');
    
    // Legend - Top left: Thickness explanation
    g.append('text')
      .attr('x', 0)
      .attr('y', -25)
      .attr('font-size', '9px')
      .attr('fill', colors.textMuted)
      .text('Thickness = Net Assets (absolute value)');
    
    // Legend - Top right: Color scale for debt ratio
    const legendWidth = 100;
    const legendX = innerWidth - legendWidth;
    const legendY = -30;
    
    const legendGradient = defs.append('linearGradient')
      .attr('id', 'debt-ratio-legend')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '100%')
      .attr('y2', '0%');
    
    legendGradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#10b981');
    
    legendGradient.append('stop')
      .attr('offset', '50%')
      .attr('stop-color', '#fbbf24');
    
    legendGradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#ef4444');
    
    g.append('rect')
      .attr('x', legendX)
      .attr('y', legendY)
      .attr('width', legendWidth)
      .attr('height', 10)
      .attr('fill', 'url(#debt-ratio-legend)')
      .attr('rx', 3);
    
    g.append('text')
      .attr('x', legendX)
      .attr('y', legendY - 5)
      .attr('font-size', '9px')
      .attr('fill', colors.textMuted)
      .text('Low Debt');
    
    g.append('text')
      .attr('x', legendX + legendWidth)
      .attr('y', legendY - 5)
      .attr('text-anchor', 'end')
      .attr('font-size', '9px')
      .attr('fill', colors.textMuted)
      .text('High Debt');
    
    // Cleanup tooltip on unmount
    return () => {
      tooltip.remove();
    };
  };

  // Effect to render charts when data or year changes
  useEffect(() => {
    if (organizationData && organizationData.years && organizationData.years.length > 0) {
      renderSankeyChart(organizationData, selectedYear);
      renderAssetUtilizationChart(organizationData);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizationData, selectedYear]);

  if (!organizationData) return null;

  const availableYears = organizationData.years || [];

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        zIndex: 9999,
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 3
      }}
      onClick={onClose}
    >
      <Box
        sx={{
          backgroundColor: '#141b2d',
          borderRadius: '16px',
          maxWidth: '1400px',
          maxHeight: '95vh',
          width: '100%',
          p: 3,
          position: 'relative',
          overflow: 'auto'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with org info */}
        <Box sx={{ textAlign: 'center', mb: 3, pb: 2, borderBottom: '1px solid rgba(255,255,255,0.1)', position: 'relative' }}>
          <IconButton
            onClick={onClose}
            sx={{
              position: 'absolute',
              left: 0,
              top: 0,
              backgroundColor: 'rgba(77, 205, 172, 0.15)',
              color: '#4dcdac',
              border: '1px solid rgba(77, 205, 172, 0.3)',
              '&:hover': {
                backgroundColor: 'rgba(77, 205, 172, 0.25)',
                borderColor: '#4dcdac'
              }
            }}
          >
            <CloseIcon />
          </IconButton>
          <Typography variant="h4" sx={{ color: '#4dcdac', fontWeight: 600, mb: 1 }}>
            {organizationData.name}
          </Typography>
          <Box sx={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)' }}>
            <Box
              component="span"
              sx={{
                display: 'inline-block',
                backgroundColor: 'rgba(77, 205, 172, 0.15)',
                color: '#4dcdac',
                px: 1.5,
                py: 0.5,
                borderRadius: '4px',
                fontWeight: 600,
                fontSize: '12px',
                mr: 1
              }}
            >
              {organizationData.ntee_letter}
            </Box>
            <span>{organizationData.city}, IL</span>
            <span style={{ opacity: 0.3, margin: '0 10px' }}>•</span>
            <span>EIN: {organizationData.ein}</span>
          </Box>
        </Box>

        {/* Two charts side by side */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
          
          {/* LEFT: Sankey Chart */}
          <Box sx={{ backgroundColor: '#1f2a40', borderRadius: '12px', p: 2.5, border: '1px solid rgba(255, 255, 255, 0.06)' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: '4px', height: '16px', backgroundColor: '#4dcdac', borderRadius: '2px' }} />
                <Typography variant="h6" sx={{ color: '#e0e0e0', fontWeight: 600 }}>
                  Financial Flow
                </Typography>
              </Box>
              
              {availableYears.length > 1 && (
                <ToggleButtonGroup
                  value={selectedYear}
                  exclusive
                  onChange={(e, newYear) => {
                    if (newYear !== null) setSelectedYear(newYear);
                  }}
                  size="small"
                  sx={{
                    '& .MuiToggleButton-root': {
                      color: 'rgba(255,255,255,0.5)',
                      borderColor: 'rgba(77, 205, 172, 0.3)',
                      fontSize: '11px',
                      px: 1.5,
                      py: 0.5,
                      '&.Mui-selected': {
                        backgroundColor: 'rgba(77, 205, 172, 0.25)',
                        color: '#4dcdac',
                        borderColor: '#4dcdac',
                        '&:hover': {
                          backgroundColor: 'rgba(77, 205, 172, 0.35)',
                        }
                      }
                    }
                  }}
                >
                  {availableYears.map((year, index) => (
                    <ToggleButton key={year.slot || index} value={index}>
                      {getYearLabel(year.slot || (index + 1))}
                    </ToggleButton>
                  ))}
                </ToggleButtonGroup>
              )}
            </Box>
            <Typography sx={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', mb: 2 }}>
              Revenue sources → Total revenue → Allocation (expenses & net income)
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <svg
                ref={sankeyRef}
                width="580"
                height="400"
                style={{ background: 'rgba(20, 27, 45, 0.6)', borderRadius: '8px', maxWidth: '100%', height: 'auto' }}
              />
            </Box>
          </Box>

          {/* RIGHT: Asset Utilization Stream Chart */}
          <Box sx={{ backgroundColor: '#1f2a40', borderRadius: '12px', p: 2.5, border: '1px solid rgba(255, 255, 255, 0.06)' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <Box sx={{ width: '4px', height: '16px', backgroundColor: '#4dcdac', borderRadius: '2px' }} />
              <Typography variant="h6" sx={{ color: '#e0e0e0', fontWeight: 600 }}>
                Asset Utilization
              </Typography>
            </Box>
            <Typography sx={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', mb: 2 }}>
              Height = asset productivity, thickness = net assets, color = debt ratio
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <svg
                ref={streamRef}
                width="580"
                height="400"
                style={{ background: 'rgba(20, 27, 45, 0.6)', borderRadius: '8px', maxWidth: '100%', height: 'auto' }}
              />
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default OrganizationPopup;