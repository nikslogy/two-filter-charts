/**
 * Stacked Bar Chart Module
 * Handles all functionality related to stacked bar charts
 */

// Stacked Bar Chart Handler Object
const StackedBarChartHandler = {
    // Create stacked bar chart with Chart.js
    createStackedBarChart: function(chartData, chartCanvas, currentChart) {
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
        
        // Set stacked bar chart specific options
        chartData.datasets.forEach(dataset => {
            dataset.borderWidth = 1;
            dataset.barPercentage = 0.9; // Controls the width of the bars
            dataset.categoryPercentage = 0.8; // Controls the spacing between categories
            
            // Make sure null values are preserved (not converted to 0)
            dataset.data = dataset.data.map(value => 
                value === null || value === undefined || Number.isNaN(value) ? null : value
            );
        });
        
        // Set chart configuration for stacked bar charts
        const config = {
            type: 'bar',
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
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.parsed.y !== null) {
                                    label += formatIndianNumber(context.parsed.y);
                                }
                                return label;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: false,
                            drawBorder: true
                        },
                        stacked: true
                    },
                    y: {
                        beginAtZero: true,
                        stacked: true,
                        grid: {
                            drawBorder: false,
                        },
                        ticks: {
                            callback: function(value) {
                                return formatIndianNumber(value);
                            },
                            maxTicksLimit: 6,
                            color: '#333' // Optional: customize tick color
                        }
                    }
                }
            }
        };
        
        // Log the final config before creating the chart
        console.log("Stacked bar chart configuration:", config);
        
        // Create the chart
        try {
            const newChart = new Chart(ctx, config);
            console.log("Stacked bar chart created successfully");
            
            // Create custom legend
            this.createCustomLegend(chartData, newChart, chartCanvas);
            
            return newChart;
        } catch (error) {
            console.error("Error creating stacked bar chart:", error);
            alert("Error creating chart: " + error.message);
            return null;
        }
    },
    
    // Create a custom legend for stacked bar charts
    createCustomLegend: function(chartData, chart, chartCanvas) {
        const legendContainer = document.createElement('div');
        legendContainer.className = 'custom-legend';
        
        chartData.datasets.forEach((dataset, index) => {
            const legendItem = document.createElement('div');
            legendItem.className = 'legend-item';
            legendItem.style.backgroundColor = dataset.backgroundColor + '15';
            legendItem.style.border = '1px solid ' + dataset.backgroundColor + '40';
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = true;
            
            const label = document.createElement('span');
            label.textContent = dataset.label;
            label.style.color = dataset.backgroundColor;
            
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
                        dataset.backgroundColor + '15' : 
                        '#f5f5f5';
                    label.style.color = checkbox.checked ? 
                        dataset.backgroundColor : 
                        '#999';
                    
                    chart.update();
                });
            });
            
            legendContainer.appendChild(legendItem);
        });
        
        // Add legend to the chart container
        chartCanvas.parentElement.insertBefore(legendContainer, chartCanvas);
    },
    
    // Update an existing stacked bar chart with new data
    updateStackedBarChart: function(chartData, chart) {
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
    
    // Generate HTML for exporting stacked bar chart
    generateStackedBarChartHTML: function(chartConfig, chartTitle, description, additionalInfo, chartFilterColumn, chartFilterOptions, selectedFilterValue, preFilteredData, chartFilterColumn2, chartFilterOptions2, selectedFilterValue2) {
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
            margin-left: 45px;

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
    <div class="chart-container">
        <div class="chart-header">
            <div class="chart-title">${chartTitle}</div>
            <img class="chart-logo" src="logo.png" alt="ChartFlask Logo">
        </div>
        ${chartFilterColumn || chartFilterColumn2 ? `
        <div class="chart-filter-controls">
            ${chartFilterColumn ? `
            <div class="chart-filter-group">
                <label for="chartFilter">${chartFilterColumn}</label>
                <select id="chartFilter" onchange="filterChartData()">
                    <option value="">All</option>
                    ${chartFilterOptions.map(value => value ? `<option value="${value}" ${value === selectedFilterValue ? 'selected' : ''}>${value}</option>` : '').join('')}
                </select>
            </div>
            ` : ''}
            ${chartFilterColumn2 ? `
            <div class="chart-filter-group">
                <label for="chartFilter2">${chartFilterColumn2}</label>
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
        
        // Pre-filtered data for each district
        const preFilteredData = ${JSON.stringify(preFilteredData, null, 2)};

        // Chart configuration
        const ctx = document.getElementById('myChart').getContext('2d');
        const chartData = ${JSON.stringify(chartConfig.data, null, 2)};
        const chartOptions = ${JSON.stringify(chartConfig.options, null, 2)};

        // Create chart with exact same configuration but remove redundant title
        const chart = new Chart(ctx, {
            type: 'bar',
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
                        position: 'top',
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
                        stacked: true,
                        grid: {
                            display: true,
                            drawOnChartArea: false,
                        },
                        ticks: {
                            color: '#333'       // Optional: customize tick color
                        }
                    },
                    y: {
                        ...chartOptions.scales?.y,
                        stacked: true,
                        beginAtZero: true,
                        grid: {
                            drawBorder: false,     // ✅ Add comma here
                            color: 'rgba(0,0,0,0.06)', // Optional: customize grid color
                        },
                        ticks: {
                            callback: function(value) {
                                return formatIndianNumber(value);
                            },
                            maxTicksLimit: 6,
                            color: '#333'       // Optional: customize tick color
                        }
                    }
                }
            }
        });

        ${(chartFilterColumn || chartFilterColumn2) ? `
        // Function to filter chart data based on selected value
        function filterChartData() {
            const filterValue = document.getElementById('chartFilter') ? document.getElementById('chartFilter').value : '';
            const filterValue2 = document.getElementById('chartFilter2') ? document.getElementById('chartFilter2').value : '';
            
            if (!chart || !chart.data) return;
            
            try {
                // Store current dataset visibility
                const visibility = [];
                chart.data.datasets.forEach((dataset, index) => {
                    visibility.push(!chart.getDatasetMeta(index).hidden);
                });
                
                // Handle the "All Values" option for both filters
                if (!filterValue && !filterValue2) {
                    // Reset to full data
                    chart.data.labels = originalChartData.labels;
                    chart.data.datasets.forEach((dataset, i) => {
                        dataset.data = originalChartData.datasets[i].data;
                    });
                } 
                // Check for first filter
                else if (filterValue && !filterValue2 && preFilteredData[filterValue]) {
                    // Use pre-filtered data from the server for filter 1
                    const filteredData = preFilteredData[filterValue];
                    
                    // Check if we have valid data
                    if (filteredData && filteredData.labels && filteredData.datasets) {
                        // Update labels and datasets
                        chart.data.labels = filteredData.labels;
                        
                        // Update each dataset's data while preserving other properties
                        filteredData.datasets.forEach((dataset, i) => {
                            if (i < chart.data.datasets.length) {
                                chart.data.datasets[i].data = dataset.data;
                            }
                        });
                    }
                } 
                // Check for second filter
                else if (!filterValue && filterValue2 && preFilteredData.filter2 && preFilteredData.filter2[filterValue2]) {
                    // Use pre-filtered data from the server for filter 2
                    const filteredData = preFilteredData.filter2[filterValue2];
                    
                    // Check if we have valid data
                    if (filteredData && filteredData.labels && filteredData.datasets) {
                        // Update labels and datasets
                        chart.data.labels = filteredData.labels;
                        
                        // Update each dataset's data while preserving other properties
                        filteredData.datasets.forEach((dataset, i) => {
                            if (i < chart.data.datasets.length) {
                                chart.data.datasets[i].data = dataset.data;
                            }
                        });
                    }
                }
                // If both filters have values, use the second one (simplification)
                else if (filterValue && filterValue2 && preFilteredData.filter2 && preFilteredData.filter2[filterValue2]) {
                    // Use pre-filtered data from the server for filter 2
                    const filteredData = preFilteredData.filter2[filterValue2];
                    
                    // Check if we have valid data
                    if (filteredData && filteredData.labels && filteredData.datasets) {
                        // Update labels and datasets
                        chart.data.labels = filteredData.labels;
                        
                        // Update each dataset's data while preserving other properties
                        filteredData.datasets.forEach((dataset, i) => {
                            if (i < chart.data.datasets.length) {
                                chart.data.datasets[i].data = dataset.data;
                            }
                        });
                    }
                } else {
                    // Fallback to client-side filtering if no pre-filtered data is available
                    console.log("No pre-filtered data available, using fallback filter");
                    
                    // Try exact match in x-axis labels (categorical data)
                    const matchingIndices = [];
                    originalChartData.labels.forEach((label, i) => {
                        if ((filterValue && String(label).toLowerCase() === String(filterValue).toLowerCase()) ||
                            (filterValue2 && String(label).toLowerCase() === String(filterValue2).toLowerCase())) {
                            matchingIndices.push(i);
                        }
                    });
                    
                    if (matchingIndices.length > 0) {
                        // Filter data to only show matching categories
                        chart.data.labels = matchingIndices.map(i => originalChartData.labels[i]);
                        chart.data.datasets.forEach((dataset, i) => {
                            dataset.data = matchingIndices.map(i => originalChartData.datasets[i].data[i]);
                        });
                    } else {
                        // No exact matches found, show message
                        displayFilterMessage(filterValue || filterValue2);
                    }
                }
                
                // Restore dataset visibility that wasn't specifically changed
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
                });
                chart.update();
            }
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
        
        // Apply the initial filter value if one is selected
        ${selectedFilterValue ? 'setTimeout(() => filterChartData(), 100);' : ''}
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
            formattedRemaining = remaining.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
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