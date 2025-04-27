/**
 * Line Chart Module
 * Handles all functionality related to line charts
 */

// Line Chart Handler Object
const LineChartHandler = {
    // Create line chart with Chart.js
    createLineChart: function(chartData, chartCanvas, currentChart) {
        // Clean up existing custom legend if any
        const existingLegend = chartCanvas.parentElement.querySelector('.custom-legend');
        if (existingLegend) {
            existingLegend.remove();
        }
        
        // Clear the canvas
        const ctx = chartCanvas.getContext('2d');
        ctx.clearRect(0, 0, chartCanvas.width, chartCanvas.height);
        
        // Set appropriate height for the chart container
        chartCanvas.parentElement.style.height = '600px';
        
        // Default color palette
        const colorPalette = [
            '#1a4570', '#ee8939', '#f5b843', '#8b3834', '#e0ba3f',
            '#e6e770', '#4d83c5', '#d3a037', '#779c51', '#b2d571'
        ];
        
        // Apply color palette to datasets if not already set
        for (let i = 0; i < chartData.datasets.length; i++) {
            const dataset = chartData.datasets[i];
            if (!dataset.backgroundColor || dataset.backgroundColor === 'rgba(243, 124, 5, 0.88)' ||
                dataset.backgroundColor.startsWith('rgba(26, 69, 112,')) {
                const colorIndex = i % colorPalette.length;
                dataset.backgroundColor = colorPalette[colorIndex];
                dataset.borderColor = colorPalette[colorIndex];
            }
        }
        
        // Set line chart specific options
        chartData.datasets.forEach(dataset => {
            dataset.fill = false;
            dataset.tension = 0; // Line smoothness
            dataset.borderWidth = 1;
            dataset.pointRadius = 0;
            dataset.pointBackgroundColor = dataset.borderColor;
            dataset.pointHoverRadius = 3;
            dataset.spanGaps = false; // Don't connect points across null values
            
            // Make sure null values are preserved (not converted to 0)
            dataset.data = dataset.data.map(value => 
                value === null || value === undefined || Number.isNaN(value) ? null : value
            );
        });
        


        
        // Set chart configuration for line charts
        const config = {
            type: 'line',
            data: chartData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: {
                    duration: 750,
                    easing: 'easeInOutQuart'
                },
                plugins: {
                    legend: {
                        display: false,
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: false,
                            drawBorder: true
                        }
                    },
                    y: {
                        grid: {
                            drawBorder: false,
                        },
                        ticks: {
                            callback: function(value) {
                                return formatIndianNumber(value);
                            },
                            precision: 0, 
                            maxTicksLimit: 7,  
                            color: '#333',

                        }
                    }
                },
                spanGaps: false // Important: this must be false to break lines at null values
            }
        };
        
        // Log the final config before creating the chart
        console.log("Line chart configuration:", config);
        
        // Create the chart
        try {
            const newChart = new Chart(ctx, config);
            console.log("Line chart created successfully");
            
            // Create custom legend
            this.createCustomLegend(chartData, newChart, chartCanvas);
            
            return newChart;
        } catch (error) {
            console.error("Error creating line chart:", error);
            alert("Error creating chart: " + error.message);
            return null;
        }
    },
    
    // Create a custom legend for line charts
    createCustomLegend: function(chartData, chart, chartCanvas) {
        const legendContainer = document.createElement('div');
        legendContainer.className = 'custom-legend';
        
        chartData.datasets.forEach((dataset, index) => {
            const legendItem = document.createElement('div');
            legendItem.className = 'legend-item';
            legendItem.style.backgroundColor = dataset.borderColor + '15';
            legendItem.style.border = '1px solid ' + dataset.borderColor + '40';
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = true;
            
            const label = document.createElement('span');
            label.textContent = dataset.label;
            label.style.color = dataset.borderColor;
            
            legendItem.appendChild(checkbox);
            legendItem.appendChild(label);
            
            // Add click handlers
            [checkbox, label, legendItem].forEach(element => {
                element.addEventListener('click', (e) => {
                    if (e.target !== checkbox) {
                        checkbox.checked = !checkbox.checked;
                    }
                    
                    const meta = chart.getDatasetMeta(index);
                    meta.hidden = !checkbox.checked;
                    
                    // Update legend item appearance
                    legendItem.style.backgroundColor = checkbox.checked ? 
                        dataset.borderColor + '15' : 
                        '#f5f5f5';
                    label.style.color = checkbox.checked ? 
                        dataset.borderColor : 
                        '#999';
                    
                    chart.update();
                });
            });
            
            legendContainer.appendChild(legendItem);
        });
        
        // Add legend to the chart container
        chartCanvas.parentElement.insertBefore(legendContainer, chartCanvas);
    },
    
    // Update an existing line chart with new data
    updateLineChart: function(chartData, chart) {
        if (!chart) return;
        
        // Update the chart data
        chart.data.labels = chartData.labels;
        
        // Update each dataset
        for (let i = 0; i < chartData.datasets.length; i++) {
            if (i < chart.data.datasets.length) {
                // Preserve hidden state
                const wasHidden = chart.getDatasetMeta(i).hidden;
                
                // Update data
                chart.data.datasets[i].data = chartData.datasets[i].data;
                
                // Restore hidden state
                chart.getDatasetMeta(i).hidden = wasHidden;
            }
        }
        
        // Update the chart
        chart.update();
    },
    
    // Generate HTML for exporting line chart
    generateLineChartHTML: function(chartConfig, chartTitle, description, additionalInfo, chartFilterColumn, chartFilterOptions, selectedFilterValue, preFilteredData, chartFilterColumn2, chartFilterOptions2, selectedFilterValue2, mainFilterColumn, mainFilterValue) {
        return `
<!DOCTYPE html>
<html>
<head>
    <title>${chartTitle}</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <link href="https://fonts.googleapis.com/css2?family=Lato:wght@400&display=swap" rel="stylesheet">
    <style>
        body { 
            font-family: Lato; 
            margin: 20px; 
            background-color: #f5f5f5;
        }
        .chart-container { 
            max-width: 1000px; 
            margin: 0 auto 20px auto; 
            background-color: white;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
            border-radius: 8px;
            padding: 20px;
            position: relative;
        }
        .chart-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
        }
        .chart-title {
            font-size: 20px;
            font-weight: bold;
            color: #2c3e50;
            flex-grow: 1;
            text-align: center;
            margin-left: 90px;
        }
        .chart-logo {
            width: 90px;
            height: auto;
        }
        .chart-filter-controls {
            display: flex;
            align-items: center;
            padding: 8px 8px 0px 8px;
            border-radius: 4px;
        }
        .chart-filter-group {
            display: flex;
            align-items: center;
            margin-left:45px;
            margin-right: 20px;
        }
        .chart-filter-group label {
            margin-right: 5px;
            font-size: 12px;
            color: black;
        }
        .chart-filter-group select {
            padding: 6px 5px;
            color:rgb(0, 0, 0);
            border: 1px solid #863F3F;
            font-size: 12px;
            min-width: 100px;
        }
        .chart-canvas-container {
            height: 500px;
            width: 100%;
        }
        .chart-footer {
            display: flex;
            justify-content: space-between;
            margin-top: 10px;
            padding-top: 5px;
            border-top: 1px solid #e9ecef;
        }
        .chart-info {
            flex: 1;
        }
        .chart-description {
            margin-top: 0;
            padding: 2px;
            font-size: 10px;
            padding-left: 53px;
        }
        .chart-additional-info {
            margin-top: 2px;
            padding: 2px;
            font-size: 10px;
            padding-left: 53px;
        }
        .chart-actions {
            display: flex;
            align-items: flex-start;
            margin-left: 15px;
        }
        .chart-date {
            font-size: 12px;
            color: #6c757d;
        }
        .icon-btn {
            background: none;
            border: none;
            cursor: pointer;
            color: #6c757d;
            padding: 0;
            margin: 0;
            margin-top: 7px;
        }
        .icon-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }
    </style>
</head>
<body>
    <!-- ChartFlask Chart Data -->
    <script type="application/json" id="chart-filter-data">
        ${JSON.stringify({
            chartTitle: chartTitle,
            mainFilterColumn: mainFilterColumn || '',
            mainFilterValue: mainFilterValue || '',
            filterColumn: chartFilterColumn,
            selectedFilterValue: selectedFilterValue,
            filterColumn2: chartFilterColumn2,
            selectedFilterValue2: selectedFilterValue2,
            chartType: 'line'
        })}
    </script>
    
    <div class="chart-container">
        <div class="chart-header">
            <div class="chart-title">${chartTitle}</div>
            <img class="chart-logo" src="logo.png" alt="ChartFlask Logo">
        </div>
        ${chartFilterColumn || chartFilterColumn2 ? `
        <div class="chart-filter-controls">
            ${chartFilterColumn ? `
            <div class="chart-filter-group">
                <label for="chartFilter">${chartFilterColumn}:</label>
                <select id="chartFilter" onchange="filterChartData()">
                    <option value="">All</option>
                    ${chartFilterOptions.map(value => value ? `<option value="${value}" ${value === selectedFilterValue ? 'selected' : ''}>${value}</option>` : '').join('')}
                </select>
            </div>
            ` : ''}
            ${chartFilterColumn2 ? `
            <div class="chart-filter-group">
                <label for="chartFilter2">${chartFilterColumn2}:</label>
                <select id="chartFilter2" onchange="filterChartData()">
                    <option value="">All</option>
                    ${chartFilterOptions2 && chartFilterOptions2.length > 0 ? chartFilterOptions2.map(value => value ? `<option value="${value}" ${value === selectedFilterValue2 ? 'selected' : ''}>${value}</option>` : '').join('') : ''}
                </select>
            </div>
            ` : ''}
        </div>
        ` : ''}
        <div class="chart-canvas-container">
            <canvas id="myChart"></canvas>
        </div>
        <div class="chart-footer">
            <div class="chart-info">
            ${additionalInfo ? `<div class="chart-additional-info">${additionalInfo}</div>` : ''}
                ${description ? `<span class="chart-description">Source: ${description}</span>` : ''}
            </div>
            <div class="chart-actions">
                <button id="downloadChartBtn" class="icon-btn" title="Download Chart">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                </button>
            </div>
        </div>
    </div>
    
    <script>
        // Indian number formatting function
        function formatIndianNumber(num) {
            if (num === null || num === undefined || isNaN(num)) return '';  // Return empty string for null values
            
            let isNegative = false;
            if (num < 0) {
                isNegative = true;
                num = Math.abs(num);
            }
            
            let formattedNumber;
            if (num < 1000) {
                formattedNumber = num.toString();
            } else {
                const parts = num.toString().split('.');
                let integerPart = parts[0];
                
                const lastThree = integerPart.substring(integerPart.length - 3);
                const remaining = integerPart.substring(0, integerPart.length - 3);
                
                let formattedRemaining = '';
                if (remaining) {
                    formattedRemaining = remaining.replace(/\\B(?=(\\d{2})+(?!\\d))/g, ',');
                }
                
                formattedNumber = formattedRemaining ? formattedRemaining + ',' + lastThree : lastThree;
                
                if (parts.length > 1) {
                    formattedNumber += '.' + parts[1];
                }
            }
            
            return isNegative ? '-' + formattedNumber : formattedNumber;
        }

        // Store original chart data for filtering
        const originalChartData = ${JSON.stringify(chartConfig.data, null, 2)};
        
        // Pre-filtered data for each district and taluka
        const preFilteredData = ${JSON.stringify(preFilteredData, null, 2)};
        
        // Function to get URL query parameters
        function getQueryParam(param) {
            const urlParams = new URLSearchParams(window.location.search);
            return urlParams.get(param);
        }
        
        // Function to aggregate data for all talukas in a district
        function getDistrictAggregateData(district) {
            if (!preFilteredData[district]) return null;
            
            const talukas = Object.keys(preFilteredData[district]);
            if (talukas.length === 0) return null;
            
            // Use the first taluka to get the labels (assuming all talukas in a district have the same years)
            const firstTaluka = talukas[0];
            const labels = [...preFilteredData[district][firstTaluka].labels];
            
            // Initialize aggregated data array with zeros
            let aggregatedData = new Array(labels.length).fill(0);
            
            // Sum data from all talukas for each year
            talukas.forEach(taluka => {
                const talukaData = preFilteredData[district][taluka];
                if (talukaData && talukaData.datasets && talukaData.datasets[0] && talukaData.datasets[0].data) {
                    talukaData.datasets[0].data.forEach((value, index) => {
                        // Handle null/undefined values as 0 for aggregation
                        if (value !== null && value !== undefined && !isNaN(value)) {
                            aggregatedData[index] += value;
                        }
                    });
                }
            });
            
            // Create a dataset object with the aggregated data
            return {
                labels: labels,
                datasets: [{
                    backgroundColor: "#1a4570",
                    borderColor: "#1a4570",
                    borderWidth: 1,
                    data: aggregatedData,
                    fill: false,
                    label: \`Total \`,
                    pointHoverRadius: 3,
                    pointRadius: 0,
                    spanGaps: false,
                    tension: 0,
                    pointBackgroundColor: "#1a4570"
                }]
            };
        }
        
        // Function to populate taluka dropdown based on selected district
        function populateTalukaDropdown(district) {
            const talukaDropdown = document.getElementById('chartFilter');
            
            // Clear existing options except the "All" option
            while (talukaDropdown.options.length > 1) {
                talukaDropdown.remove(1);
            }
            
            if (!district || !preFilteredData[district]) {
                // If no district specified or invalid district, show all talukas
                const allTalukas = [];
                
                // Collect all talukas from all districts
                Object.keys(preFilteredData).forEach(districtName => {
                    Object.keys(preFilteredData[districtName]).forEach(talukaName => {
                        allTalukas.push(talukaName);
                    });
                });
                
                // Sort talukas alphabetically
                allTalukas.sort();
                
                // Add all talukas to dropdown
                allTalukas.forEach(taluka => {
                    const option = document.createElement('option');
                    option.value = taluka;
                    option.text = taluka;
                    talukaDropdown.add(option);
                });
            } else {
                // Show only talukas for the specified district
                const districtTalukas = Object.keys(preFilteredData[district]);
                
                // Sort talukas alphabetically
                districtTalukas.sort();
                
                // Add district's talukas to dropdown
                districtTalukas.forEach(taluka => {
                    const option = document.createElement('option');
                    option.value = taluka;
                    option.text = taluka;
                    talukaDropdown.add(option);
                });
                
                // Update the chart title to include district name
                const chartTitle = document.querySelector('.chart-title');
                
                
                // Update filter data JSON
                const chartFilterData = document.getElementById('chart-filter-data');
                if (chartFilterData) {
                    const filterDataObj = JSON.parse(chartFilterData.textContent);
                    filterDataObj.mainFilterValue = district;
                    chartFilterData.textContent = JSON.stringify(filterDataObj);
                }
            }
        }
        
        // Determine if we're using district-taluka hierarchy
        const isHierarchicalData = ${mainFilterColumn === 'District' && chartFilterColumn === 'Taluka'};
        
        // Chart configuration
        const ctx = document.getElementById('myChart').getContext('2d');
        const chartData = ${JSON.stringify(chartConfig.data, null, 2)};
        const chartOptions = ${JSON.stringify(chartConfig.options, null, 2)};

        // Create chart with exact same configuration but remove redundant title
        const hasMin = chartOptions?.scales?.y?.min !== undefined;

        const chart = new Chart(ctx, {
            type: 'line',
            data: chartData,
            options: {
                ...chartOptions,
                interaction: {
                    mode: 'index',
                    intersect: false
                },
                plugins: {
                    ...chartOptions.plugins,
                    // Remove title from chart as it's now in the header
                    title: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'white', // Yellow tooltip background
                        titleColor: 'black',
                        bodyColor: 'black',
                        animation: {
                            duration: 50, // milliseconds (default is 400)
                            easing: 'easeOutQuart' // easing function
                        },
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                
                                if (context.parsed.y !== null && context.parsed.y !== undefined) {
                                    label += formatIndianNumber(context.parsed.y);
                                } else {
                                    label += 'No data'; // For null values, show 'No data' in tooltip
                                }
                                return label;
                            }
                        }
                    },
                    legend: {
                        display: true,
                        labels: {
                            boxWidth: 20,        // Width of the color box
                            boxHeight: 20,       // Height of the color box
                            usePointStyle: true, // Makes it more like a round dot or checkbox
                            pointStyle: 'rect',  // Use 'circle', 'rect', 'rectRounded', 'cross', etc.
                            padding: 15,
                            color: '#333',       // Label text color
                            font: {
                                size: 12,
                            }
                        }
                    }
                },
                scales: {
                    ...chartOptions.scales,
                    x: {
                        ...chartOptions.scales?.x,
                        offset: true,
                        grid: {
                            drawTicks: true,
                            drawOnChartArea: false,
                        },
                        ticks: {
                            color: '#333'       // Optional: customize tick color
                        }
                    },
                    y: {
                        min: 0,
                        ...chartOptions.scales?.y,
                         offset: hasMin,
                        grid: {
                            color: 'rgba(0,0,0,0.06)', // Optional: customize grid color
                            drawBorder: false     // ✅ Show tick marks
                        },
                        ticks: {
                            callback: function(value) {
                                return formatIndianNumber(value);
                            },
                            precision: 0,  // No decimals
                            maxTicksLimit: 7,  // Maximum 7 ticks
    
                            color: '#333'       // Optional: customize tick color
                        }
                    }
                },
                spanGaps: false // Don't connect points across null values for line charts
            }
        });

        ${(chartFilterColumn || chartFilterColumn2) ? `
        // Function to check if preFilteredData has hierarchical structure
        function hasHierarchicalStructure() {
            if (!preFilteredData) return false;
            
            // Check if the first level keys contain data objects with labels and datasets properties
            const firstLevelKeys = Object.keys(preFilteredData);
            if (firstLevelKeys.length === 0) return false;
            
            // Check first key - if it has labels/datasets, it's flat; if it has child objects, it's hierarchical
            const firstKey = firstLevelKeys[0];
            const firstValue = preFilteredData[firstKey];
            
            // Check if this is a data object (has labels and datasets)
            if (firstValue && firstValue.labels && firstValue.datasets) {
                return false; // Flat structure
            }
            
            // Check if this is a district with taluka children
            if (firstValue && typeof firstValue === 'object') {
                const childKeys = Object.keys(firstValue);
                if (childKeys.length > 0) {
                    const childValue = firstValue[childKeys[0]];
                    // If child has labels and datasets, this is hierarchical
                    if (childValue && childValue.labels && childValue.datasets) {
                        return true; // Hierarchical structure
                    }
                }
            }
            
            return false;
        }
        
        // Function to filter chart data based on selected value
        function filterChartData() {
            const filterValue = document.getElementById('chartFilter') ? document.getElementById('chartFilter').value : '';
            const filterValue2 = document.getElementById('chartFilter2') ? document.getElementById('chartFilter2').value : '';
            
            // Get the district from URL or filter data
            const district = getQueryParam('district') || 
                            (document.getElementById('chart-filter-data') ? 
                             JSON.parse(document.getElementById('chart-filter-data').textContent).mainFilterValue : '');
            
            // Update the chart filter data in the JSON
            const chartFilterData = document.getElementById('chart-filter-data');
            if (chartFilterData) {
                const filterDataObj = JSON.parse(chartFilterData.textContent);
                filterDataObj.selectedFilterValue = filterValue;
                filterDataObj.selectedFilterValue2 = filterValue2;
                chartFilterData.textContent = JSON.stringify(filterDataObj);
            }
            
            if (!chart || !chart.data) return;
            
            try {
                // Store current dataset visibility
                const visibility = [];
                chart.data.datasets.forEach((dataset, index) => {
                    visibility.push(!chart.getDatasetMeta(index).hidden);
                });
                
                // Handle the "All Values" option for both filters
                if (!filterValue && !filterValue2) {
                    // If district is specified, show aggregate data for all talukas in that district
                    if (district && preFilteredData[district]) {
                        const districtData = getDistrictAggregateData(district);
                        if (districtData) {
                            chart.data.labels = districtData.labels;
                            districtData.datasets.forEach((dataset, i) => {
                                if (i < chart.data.datasets.length) {
                                    chart.data.datasets[i].data = dataset.data;
                                    chart.data.datasets[i].label = dataset.label;
                                }
                            });
                        } else {
                            // Reset to full data if aggregation fails
                            chart.data.labels = originalChartData.labels;
                            chart.data.datasets.forEach((dataset, i) => {
                                dataset.data = originalChartData.datasets[i].data;
                                //dataset.label = originalChartData.datasets[i].label;
                            });
                        }
                    } else {
                        // Reset to full data when no district is specified
                        chart.data.labels = originalChartData.labels;
                        chart.data.datasets.forEach((dataset, i) => {
                            dataset.data = originalChartData.datasets[i].data;
                            dataset.label = originalChartData.datasets[i].label;
                        });
                    }
                } 
                // Check for first filter only
                else if (filterValue && !filterValue2) {
                    // If we have a district specified, look directly in that district
                    if (district && preFilteredData[district] && preFilteredData[district][filterValue]) {
                        const filteredData = preFilteredData[district][filterValue];
                        chart.data.labels = filteredData.labels;
                        filteredData.datasets.forEach((dataset, i) => {
                            if (i < chart.data.datasets.length) {
                                chart.data.datasets[i].data = dataset.data;
                                //chart.data.datasets[i].label = \`\${filterValue} - \${dataset.label}\`;
                            }
                        });
                    }
                    // Otherwise use the existing logic to search all districts
                    else if (hasHierarchicalStructure()) {
                        // If hierarchical, we need to find which district contains this taluka
                        let filteredData = null;
                        let foundDistrict = '';
                        
                        // Iterate through districts to find the filtered taluka
                        for (const districtName in preFilteredData) {
                            if (preFilteredData[districtName][filterValue]) {
                                filteredData = preFilteredData[districtName][filterValue];
                                foundDistrict = districtName;
                                break;
                            }
                        }
                        
                        if (filteredData) {
                            // Update labels and datasets
                            chart.data.labels = filteredData.labels;
                            filteredData.datasets.forEach((dataset, i) => {
                                if (i < chart.data.datasets.length) {
                                    chart.data.datasets[i].data = dataset.data;
                                    // chart.data.datasets[i].label = \`\${filterValue} (\${foundDistrict}) - \${dataset.label}\`;
                                }
                            });
                        } else {
                            // If not found in hierarchy, try flat structure as fallback
                            if (preFilteredData[filterValue]) {
                                const flatData = preFilteredData[filterValue];
                                chart.data.labels = flatData.labels;
                                flatData.datasets.forEach((dataset, i) => {
                                    if (i < chart.data.datasets.length) {
                                        chart.data.datasets[i].data = dataset.data;
                                        chart.data.datasets[i].label = dataset.label;
                                    }
                                });
                            } else {
                                // No data found, display message
                                displayFilterMessage(filterValue);
                            }
                        }
                    } else {
                        // Use flat structure (original behavior)
                        if (preFilteredData[filterValue]) {
                            const filteredData = preFilteredData[filterValue];
                            
                            if (filteredData && filteredData.labels && filteredData.datasets) {
                                chart.data.labels = filteredData.labels;
                                filteredData.datasets.forEach((dataset, i) => {
                                    if (i < chart.data.datasets.length) {
                                        chart.data.datasets[i].data = dataset.data;
                                        chart.data.datasets[i].label = dataset.label;
                                    }
                                });
                            }
                        } else {
                            displayFilterMessage(filterValue);
                        }
                    }
                } 
                // Handle second filter and combinations similar to existing code
                // ... existing code for other filter scenarios ...
                
                // Restore dataset visibility
                chart.data.datasets.forEach((dataset, index) => {
                    if (chart.getDatasetMeta(index).hidden === undefined) {
                        chart.getDatasetMeta(index).hidden = !visibility[index];
                    }
                });
                
                // Update the chart
                chart.update();
            } catch (error) {
                console.error("Error filtering chart:", error);
                // Show error message and reset to full data
                displayFilterMessage(filterValue || filterValue2, true);
                
                // Reset to full data
                chart.data.labels = originalChartData.labels;
                chart.data.datasets.forEach((dataset, i) => {
                    dataset.data = originalChartData.datasets[i].data;
                    dataset.label = originalChartData.datasets[i].label;
                });
                chart.update();
            }
        }
        
        // Helper function to display filter messages
        function displayFilterMessage(filterValue, isError = false) {
            const messageDiv = document.createElement('div');
            
            if (isError) {
                messageDiv.style.cssText = 'padding: 10px; margin: 10px 0; background-color: #f8d7da; color: #721c24; border-radius: 4px; border-left: 4px solid #f5c6cb;';
                messageDiv.innerHTML = '<strong>Error:</strong> Could not filter data for "' + filterValue + 
                    '". Showing all values.';
            } else {
                messageDiv.style.cssText = 'padding: 10px; margin: 10px 0; background-color: #cfe8ff; color: #084298; border-radius: 4px; border-left: 4px solid #084298;';
                messageDiv.innerHTML = '<strong>Note:</strong> No filter data available for "' + filterValue + 
                    '". Showing all values.';
            }
            
            messageDiv.className = 'filter-message';
            
            const chartContainer = document.querySelector('.chart-container');
            const existingMessage = chartContainer.querySelector('.filter-message');
            if (existingMessage) {
                chartContainer.removeChild(existingMessage);
            }
            
            const canvasContainer = document.querySelector('.chart-canvas-container');
            chartContainer.insertBefore(messageDiv, canvasContainer);
            
            // Auto-remove after 4 seconds
            setTimeout(() => {
                if (messageDiv.parentNode) {
                    messageDiv.parentNode.removeChild(messageDiv);
                }
            }, 4000);
        }
        ` : ''}

        // Add download functionality
        document.getElementById('downloadChartBtn').addEventListener('click', function() {
            const canvas = document.getElementById('myChart');
            const image = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.download = '${chartTitle.replace(/\\s+/g, '_')}.png';
            link.href = image;
            link.click();
        });
        
        // Initialize the page based on URL parameters
        document.addEventListener('DOMContentLoaded', function() {
            // Check for district in URL parameters
            const district = getQueryParam('district');
            
            // Populate the taluka dropdown based on the district
            populateTalukaDropdown(district);
            
            // If there's a taluka parameter, select it in the dropdown
            const taluka = getQueryParam('taluka');
            if (taluka) {
                const talukaDropdown = document.getElementById('chartFilter');
                if (talukaDropdown) {
                    // Find and select the option
                    for (let i = 0; i < talukaDropdown.options.length; i++) {
                        if (talukaDropdown.options[i].value === taluka) {
                            talukaDropdown.selectedIndex = i;
                            break;
                        }
                    }
                }
            }
            
            // Apply the filter based on URL parameters
            filterChartData();
        });
    </script>
</body>
</html>`;
    }
};

// Format number in Indian format (e.g., 1,00,000)
function formatIndianNumber(num) {
    if (num === null || num === undefined || isNaN(num)) return '';  // Return empty string for null values
    
    // Handle negative numbers
    let isNegative = false;
    if (num < 0) {
        isNegative = true;
        num = Math.abs(num);
    }
    
    // Format number to handle different magnitudes properly
    let formattedNumber;
    
    // For numbers less than 1,000, no special formatting needed
    if (num < 1000) {
        formattedNumber = num.toString();
    } else {
        // Convert to string and split at decimal point
        const parts = num.toString().split('.');
        let integerPart = parts[0];
        
        // First we get the last 3 digits
        const lastThree = integerPart.substring(integerPart.length - 3);
        // Then we get the remaining digits
        const remaining = integerPart.substring(0, integerPart.length - 3);
        
        // Now we format the remaining digits with commas after every 2 digits
        let formattedRemaining = '';
        if (remaining) {
            formattedRemaining = remaining.replace(/\\B(?=(\\d{2})+(?!\\d))/g, ',');
        }
        
        // Combine the parts
        formattedNumber = formattedRemaining ? formattedRemaining + ',' + lastThree : lastThree;
        
        // Add decimal part if exists
        if (parts.length > 1) {
            formattedNumber += '.' + parts[1];
        }
    }
    
    // Add negative sign if needed
    if (isNegative) {
        formattedNumber = '-' + formattedNumber;
    }
    
    return formattedNumber;
}