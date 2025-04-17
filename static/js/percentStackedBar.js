/**
 * Percent Stacked Bar Chart Module
 * Handles all functionality related to percent stacked bar charts
 */

// Percent Stacked Bar Chart Handler Object
const PercentStackedBarChartHandler = {
    // Create percent stacked bar chart with Chart.js
    createPercentStackedBarChart: function(chartData, chartCanvas, currentChart) {
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
        
        // Convert data to percentages for each x-axis category
        const percentData = this.convertToPercentages(chartData);
        
        // Set percent stacked bar chart specific options
        percentData.datasets.forEach(dataset => {
            dataset.borderWidth = 1;
            dataset.barPercentage = 0.9; // Controls the width of the bars
            dataset.categoryPercentage = 0.8; // Controls the spacing between categories
        });
        
        // Set chart configuration for percent stacked bar charts
        const config = {
            type: 'bar',
            data: percentData,
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
                            animation: {
                                duration: 50, // milliseconds (default is 400)
                                easing: 'easeOutQuart' // easing function
                              },
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.parsed.y !== null) {
                                    label += context.parsed.y.toFixed(1) + '%';
                                }
                                return label;
                            }
                        }
                    },
                    // Add datalabels plugin configuration to display percentages on the bars
                    datalabels: {
                        display: function(context) {
                            return context.dataset.data[context.dataIndex] > 5; // Only show if percentage > 5%
                        },
                        formatter: function(value) {
                            return value.toFixed(1) + '%';
                        },
                        color: 'white',
                        font: {
                            weight: 'bold',
                            size: 11
                        },
                        anchor: 'center',
                        align: 'center'
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
                        stacked: true,
                        beginAtZero: true,
                        min: 0,
                        max: 100, // Always show 0-100% scale
                        grid:{
                            color: 'rgba(0,0,0,0.06)', // Optional: customize grid color
                        },
                        ticks: {
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    }
                }
            }
        };
        
        // Log the final config before creating the chart
        console.log("Percent stacked bar chart configuration:", config);
        
        // Create the chart
        try {
            // Check for datalabels plugin in a compatible way with newer Chart.js versions
            let hasDataLabelsPlugin = false;
            try {
                // Try Chart.js v3+ method
                hasDataLabelsPlugin = Chart.helpers.getRegisteredControllers().some(controller => 
                    controller.id === 'datalabels' || controller._type === 'datalabels'
                );
            } catch (e) {
                // Fallback for all Chart.js versions - datalabels will be available if script is included
                console.log("Using fallback method to check for datalabels plugin");
                hasDataLabelsPlugin = window.ChartDataLabels !== undefined;
            }
            
            if (!hasDataLabelsPlugin) {
                console.log("No datalabels plugin found, displaying percentages without it");
                delete config.options.plugins.datalabels;
            }

            const newChart = new Chart(ctx, config);
            console.log("Percent stacked bar chart created successfully");
            
            // Create custom legend
            this.createCustomLegend(percentData, newChart, chartCanvas);
            
            return newChart;
        } catch (error) {
            console.error("Error creating percent stacked bar chart:", error);
            alert("Error creating chart: " + error.message);
            return null;
        }
    },
    
    // Convert normal values to percentage values
    convertToPercentages: function(chartData) {
        const percentData = {
            labels: [...chartData.labels],
            datasets: []
        };
        
        // Make a deep copy of the datasets
        for (let i = 0; i < chartData.datasets.length; i++) {
            percentData.datasets.push({...chartData.datasets[i], data: [...chartData.datasets[i].data]});
        }
        
        // Calculate the percentages for each x-axis position
        for (let i = 0; i < chartData.labels.length; i++) {
            let total = 0;
            
            // Calculate total for this category
            for (let j = 0; j < chartData.datasets.length; j++) {
                const value = chartData.datasets[j].data[i];
                if (value !== null && value !== undefined && !isNaN(value)) {
                    total += Math.abs(parseFloat(value));
                }
            }
            
            // Calculate percentage for each dataset
            if (total > 0) {
                for (let j = 0; j < percentData.datasets.length; j++) {
                    const value = chartData.datasets[j].data[i];
                    if (value !== null && value !== undefined && !isNaN(value)) {
                        percentData.datasets[j].data[i] = (Math.abs(parseFloat(value)) / total) * 100;
                    } else {
                        percentData.datasets[j].data[i] = 0;
                    }
                }
            } else {
                // Set to zero if total is zero
                for (let j = 0; j < percentData.datasets.length; j++) {
                    percentData.datasets[j].data[i] = 0;
                }
            }
        }
        
        return percentData;
    },
    
    // Create a custom legend for percent stacked bar charts
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
                    
                    // Get the visible datasets
                    const visibleDatasets = [];
                    chart.data.datasets.forEach((dataset, i) => {
                        if (!chart.getDatasetMeta(i).hidden) {
                            visibleDatasets.push(i);
                        }
                    });
                    
                    // We need to recalculate percentages when toggling datasets
                    if (visibleDatasets.length > 0) {
                        this.recalculatePercentages(chart, visibleDatasets);
                    }
                    
                    chart.update();
                });
            }, this);
            
            legendContainer.appendChild(legendItem);
        });
        
        // Add legend to the chart container
        chartCanvas.parentElement.insertBefore(legendContainer, chartCanvas);
    },
    
    // Recalculate percentages when hiding/showing datasets
    recalculatePercentages: function(chart, visibleDatasets) {
        // For each data point, recalculate percentages based on visible datasets
        for (let i = 0; i < chart.data.labels.length; i++) {
            let total = 0;
            
            // Calculate total of visible datasets
            visibleDatasets.forEach(datasetIndex => {
                const originalValue = chart.data.datasets[datasetIndex]._originalData[i];
                if (originalValue !== null && originalValue !== undefined && !isNaN(originalValue)) {
                    total += Math.abs(parseFloat(originalValue));
                }
            });
            
            // Update percentages for all datasets
            chart.data.datasets.forEach((dataset, datasetIndex) => {
                const originalValue = dataset._originalData ? dataset._originalData[i] : 0;
                
                if (visibleDatasets.includes(datasetIndex) && total > 0) {
                    if (originalValue !== null && originalValue !== undefined && !isNaN(originalValue)) {
                        dataset.data[i] = (Math.abs(parseFloat(originalValue)) / total) * 100;
                    } else {
                        dataset.data[i] = 0;
                    }
                } else {
                    dataset.data[i] = 0;
                }
            });
        }
    },
    
    // Update an existing percent stacked bar chart with new data
    updatePercentStackedBarChart: function(chartData, chart) {
        if (!chart) return;
        
        // Store the original data for percentage recalculation
        chartData.datasets.forEach(dataset => {
            dataset._originalData = [...dataset.data];
        });
        
        // Convert to percentages
        const percentData = this.convertToPercentages(chartData);
        
        // Update the chart data
        chart.data.labels = percentData.labels;
        
        // Update each dataset
        for (let i = 0; i < percentData.datasets.length; i++) {
            if (i < chart.data.datasets.length) {
                // Preserve hidden state
                const wasHidden = chart.getDatasetMeta(i).hidden;
                
                // Update data and store original values
                chart.data.datasets[i].data = percentData.datasets[i].data;
                chart.data.datasets[i]._originalData = [...chartData.datasets[i].data];
                
                // Restore hidden state
                chart.getDatasetMeta(i).hidden = wasHidden;
            }
        }
        
        // Get the visible datasets
        const visibleDatasets = [];
        chart.data.datasets.forEach((dataset, i) => {
            if (!chart.getDatasetMeta(i).hidden) {
                visibleDatasets.push(i);
            }
        });
        
        // Recalculate percentages based on visible datasets
        if (visibleDatasets.length > 0) {
            this.recalculatePercentages(chart, visibleDatasets);
        }
        
        // Update the chart
        chart.update();
    },
    
    // Generate HTML for exporting percent stacked bar chart
    generatePercentStackedBarChartHTML: function(chartConfig, chartTitle, description, additionalInfo, chartFilterColumn, chartFilterOptions, selectedFilterValue, preFilteredData, chartFilterColumn2, chartFilterOptions2, selectedFilterValue2) {
        return `
<!DOCTYPE html>
<html>
<head>
    <title>${chartTitle}</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/chartjs-plugin-datalabels@2.0.0"></script>
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
        /* Legend styles */
        .custom-legend {
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            gap: 10px;
            margin-bottom: 15px;
        }
        .legend-item {
            display: flex;
            align-items: center;
            padding: 5px 10px;
            border-radius: 4px;
            cursor: pointer;
        }
        .legend-item input {
            margin-right: 5px;
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
        // Register Chart.js plugins
        Chart.register(ChartDataLabels);

        // Store original data for percentage calculations
        const originalChartData = ${JSON.stringify(chartConfig.data, null, 2)};
        originalChartData.datasets.forEach(dataset => {
            dataset._originalData = [...dataset.data];
        });
        
        // Convert to percentage data
        function convertToPercentages(chartData) {
            const percentData = {
                labels: [...chartData.labels],
                datasets: JSON.parse(JSON.stringify(chartData.datasets))
            };
            
            // Calculate the percentages for each x-axis position
            for (let i = 0; i < chartData.labels.length; i++) {
                let total = 0;
                
                // Calculate total for this category
                for (let j = 0; j < chartData.datasets.length; j++) {
                    const value = chartData.datasets[j]._originalData[i];
                    if (value !== null && value !== undefined && !isNaN(value)) {
                        total += Math.abs(parseFloat(value));
                    }
                }
                
                // Calculate percentage for each dataset
                if (total > 0) {
                    for (let j = 0; j < percentData.datasets.length; j++) {
                        const value = chartData.datasets[j]._originalData[i];
                        if (value !== null && value !== undefined && !isNaN(value)) {
                            percentData.datasets[j].data[i] = (Math.abs(parseFloat(value)) / total) * 100;
                        } else {
                            percentData.datasets[j].data[i] = 0;
                        }
                    }
                } else {
                    // Set to zero if total is zero
                    for (let j = 0; j < percentData.datasets.length; j++) {
                        percentData.datasets[j].data[i] = 0;
                    }
                }
            }
            
            return percentData;
        }
        
        // Format number with percentage
        function formatPercentage(num) {
            if (num === null || num === undefined || isNaN(num)) return '';
            return num.toFixed(1) + '%';
        }

        // Pre-filtered data for each value
        const preFilteredData = ${JSON.stringify(preFilteredData, null, 2)};

        // Chart configuration
        const ctx = document.getElementById('myChart').getContext('2d');
        const chartData = convertToPercentages(originalChartData);
        const chartOptions = ${JSON.stringify(chartConfig.options, null, 2)};

        // Create chart with exact same configuration but adjust for percentages
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
                                    label += formatPercentage(context.parsed.y);
                                } else {
                                    label += 'No data';
                                }
                                return label;
                            }
                        }
                    },
                    datalabels: {
                        display: function(context) {
                            return context.dataset.data[context.dataIndex] > 5; // Only show if percentage > 5%
                        },
                        formatter: function(value) {
                            return formatPercentage(value);
                        },
                        color: 'white',
                        font: {
                            weight: 'bold',
                            size: 11
                        },
                        anchor: 'center',
                        align: 'center'
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
                        min: 0,
                        max: 100,
                        grid: {
                            drawBorder: false,    // Show tick marks
                            color: 'rgba(0,0,0,0.06)', // Optional: customize grid color

                        },
                        ticks: {
                            callback: function(value) {
                                return value + '%';
                            },
                             stepSize: 20,
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
            // Reset to original data
            for (let i = 0; i < originalChartData.datasets.length; i++) {
                chart.data.datasets[i]._originalData = [...originalChartData.datasets[i]._originalData];
            }
            chart.data.labels = originalChartData.labels;

            // Recalculate percentages
            const percentData = convertToPercentages(chart.data);
            chart.data.datasets.forEach((dataset, i) => {
                dataset.data = percentData.datasets[i].data;
            });
        // Use pre-filtered data if available
        } else if (filterValue && preFilteredData && preFilteredData[filterValue]) {
            // Use pre-filtered data for filter 1
            const filteredData = preFilteredData[filterValue];
            
            // Check if we have valid data
            if (filteredData && filteredData.labels && filteredData.datasets) {
                // Update labels
                chart.data.labels = filteredData.labels;
                
                // Update each dataset's original data
                filteredData.datasets.forEach((dataset, i) => {
                    if (i < chart.data.datasets.length) {
                        chart.data.datasets[i]._originalData = dataset.data;
                    }
                });
                
                // Recalculate percentages
                const percentData = convertToPercentages(chart.data);
                chart.data.datasets.forEach((dataset, i) => {
                    dataset.data = percentData.datasets[i].data;
                });
            }
        } else if (filterValue2 && preFilteredData && preFilteredData.filter2 && preFilteredData.filter2[filterValue2]) {
            // Use pre-filtered data for filter 2
            const filteredData = preFilteredData.filter2[filterValue2];
            
            // Check if we have valid data
            if (filteredData && filteredData.labels && filteredData.datasets) {
                // Update labels
                chart.data.labels = filteredData.labels;
                
                // Update each dataset's original data
                filteredData.datasets.forEach((dataset, i) => {
                    if (i < chart.data.datasets.length) {
                        chart.data.datasets[i]._originalData = dataset.data;
                    }
                });
                
                // Recalculate percentages
                const percentData = convertToPercentages(chart.data);
                chart.data.datasets.forEach((dataset, i) => {
                    dataset.data = percentData.datasets[i].data;
                });
            }
        } else {
            // Fallback to client-side filtering if no pre-filtered data
            console.log("No pre-filtered data available, using fallback filter");
            displayFilterMessage(filterValue || filterValue2);
        }
        
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
        displayFilterMessage(filterValue || filterValue2, true);
        
        // Reset to original data on error
        for (let i = 0; i < originalChartData.datasets.length; i++) {
            chart.data.datasets[i]._originalData = [...originalChartData.datasets[i]._originalData];
        }
        chart.data.labels = originalChartData.labels;
        
        // Recalculate percentages
        const percentData = convertToPercentages(chart.data);
        chart.data.datasets.forEach((dataset, i) => {
            dataset.data = percentData.datasets[i].data;
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
        
        // Apply the initial filter value if one is selected
        ${selectedFilterValue || selectedFilterValue2 ? 'setTimeout(() => filterChartData(), 100);' : ''}
    </script>
</body>
</html>`;
    }
};