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
    generatePercentStackedBarChartHTML: function(chartConfig, chartTitle, description, additionalInfo, chartFilterColumn, chartFilterOptions, selectedFilterValue, preFilteredData, chartFilterColumn2, chartFilterOptions2, selectedFilterValue2, mainFilterColumn, mainFilterValue) {
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
            chartType: 'percentStackedBar'
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
        
        // Get URL parameters
        function getUrlParams() {
            const params = {};
            const queryString = window.location.search.substring(1);
            const pairs = queryString.split('&');
            
            for (const pair of pairs) {
                if (pair) {
                    const [key, value] = pair.split('=');
                    params[decodeURIComponent(key)] = decodeURIComponent(value || '');
                }
            }
            return params;
        }

        // Function to get a specific URL query parameter
        function getQueryParam(param) {
            const urlParams = new URLSearchParams(window.location.search);
            return urlParams.get(param);
        }

        // Populate secondary dropdown based on selected primary filter
        function populateSecondaryDropdown(primaryValue) {
            const secondaryDropdown = document.getElementById('chartFilter');
            if (!secondaryDropdown) return;
            
            // Clear existing options except "All"
            while (secondaryDropdown.options.length > 1) {
                secondaryDropdown.remove(1);
            }
            
            // If hierarchical, populate based on primary value
            if (hasHierarchicalStructure()) {
                if (!primaryValue || !preFilteredData[primaryValue]) {
                    // If no primary value selected, show all secondary values from all primary values
                    const allSecondaryValues = [];
                    Object.values(preFilteredData).forEach(primaryData => {
                        if (typeof primaryData === 'object' && !primaryData.labels) {
                            Object.keys(primaryData).forEach(secondaryValue => {
                                if (!allSecondaryValues.includes(secondaryValue)) {
                                    allSecondaryValues.push(secondaryValue);
                                }
                            });
                        }
                    });
                    
                    allSecondaryValues.sort();
                    allSecondaryValues.forEach(value => {
                        const option = document.createElement('option');
                        option.value = value;
                        option.text = value;
                        secondaryDropdown.appendChild(option);
                    });
                } else {
                    // Show only secondary values for the selected primary value
                    const secondaryValues = Object.keys(preFilteredData[primaryValue]).sort();
                    secondaryValues.forEach(value => {
                        const option = document.createElement('option');
                        option.value = value;
                        option.text = value;
                        secondaryDropdown.appendChild(option);
                    });
                }
            }
        }

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
            
            // Get the main filter/district from URL or filter data
            const mainFilter = getQueryParam('district') || 
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
                
                // Prepare to store the raw data before percentage conversion
                let rawData = {
                    labels: [],
                    datasets: []
                };
                
                // Process based on filter combinations
                
                // If hierarchical data structure (like District -> Taluka)
                if (hasHierarchicalStructure()) {
                    // Case 1: Main filter and filterValue (e.g., District and Taluka)
                    if (mainFilter && filterValue && 
                        preFilteredData[mainFilter] && 
                        preFilteredData[mainFilter][filterValue]) {
                        // Use specific sub-filter data
                        rawData = JSON.parse(JSON.stringify(preFilteredData[mainFilter][filterValue]));
                    }
                    // Case 2: Main filter but no filterValue (show all for this main filter)
                    else if (mainFilter && !filterValue && preFilteredData[mainFilter]) {
                        // Aggregate data for all sub-filters
                        rawData = aggregateSubFilterData(mainFilter);
                    }
                    // Case 3: No main filter but has filterValue (find it in any main filter)
                    else if (!mainFilter && filterValue) {
                        let found = false;
                        // Search in all main filters
                        for (const main in preFilteredData) {
                            if (preFilteredData[main][filterValue]) {
                                rawData = JSON.parse(JSON.stringify(preFilteredData[main][filterValue]));
                                found = true;
                                break;
                            }
                        }
                        
                        if (!found) {
                            // If not found but we have flat data as fallback
                            if (preFilteredData[filterValue]) {
                                rawData = JSON.parse(JSON.stringify(preFilteredData[filterValue]));
                            } else {
                                // No data found, show message and use original data
                                displayFilterMessage(filterValue);
                                rawData = JSON.parse(JSON.stringify(originalChartData));
                            }
                        }
                    }
                    // Case 4: No filters, use original data
                    else {
                        rawData = JSON.parse(JSON.stringify(originalChartData));
                    }
                } 
                // Flat data structure
                else {
                    // If we have a direct filter value match
                    if (filterValue && preFilteredData && preFilteredData[filterValue]) {
                        rawData = JSON.parse(JSON.stringify(preFilteredData[filterValue]));
                    } 
                    // Secondary filter if exists
                    else if (filterValue2 && preFilteredData && preFilteredData.filter2 && 
                             preFilteredData.filter2[filterValue2]) {
                        rawData = JSON.parse(JSON.stringify(preFilteredData.filter2[filterValue2]));
                    }
                    // No filters or no match, use original
                    else {
                        if (filterValue && !preFilteredData[filterValue]) {
                            displayFilterMessage(filterValue);
                        }
                        rawData = JSON.parse(JSON.stringify(originalChartData));
                    }
                }
                
                // Ensure raw data has _originalData for percentage calculation
                rawData.datasets.forEach((dataset, i) => {
                    dataset._originalData = [...dataset.data];
                });
                
                // Update chart with new data and labels
                chart.data.labels = rawData.labels;
                
                // Update datasets
                for (let i = 0; i < rawData.datasets.length && i < chart.data.datasets.length; i++) {
                    chart.data.datasets[i]._originalData = rawData.datasets[i]._originalData || rawData.datasets[i].data;
                }
                
                // Convert to percentages
                const percentData = convertToPercentages(rawData);
                
                // Update chart data with percentages
                for (let i = 0; i < percentData.datasets.length && i < chart.data.datasets.length; i++) {
                    chart.data.datasets[i].data = percentData.datasets[i].data;
                }
                
                // Restore dataset visibility
                chart.data.datasets.forEach((dataset, index) => {
                    if (index < visibility.length) {
                        chart.getDatasetMeta(index).hidden = !visibility[index];
                    }
                });
                
                // Get the visible datasets for percentage recalculation
                const visibleDatasets = [];
                chart.data.datasets.forEach((dataset, i) => {
                    if (!chart.getDatasetMeta(i).hidden) {
                        visibleDatasets.push(i);
                    }
                });
                
                // Recalculate percentages based on visible datasets
                if (visibleDatasets.length > 0) {
                    recalculatePercentages(chart, visibleDatasets);
                }
                
                // Update the chart
                chart.update();
            } catch (error) {
                console.error("Error filtering chart:", error);
                displayFilterMessage(filterValue || filterValue2, true);
                
                // Reset to original data on error
                chart.data.labels = originalChartData.labels;
                
                // Reset original data
                chart.data.datasets.forEach((dataset, i) => {
                    if (i < originalChartData.datasets.length) {
                        dataset._originalData = [...originalChartData.datasets[i]._originalData];
                    }
                });
                
                // Recalculate percentages
                const percentData = convertToPercentages(chart.data);
                chart.data.datasets.forEach((dataset, i) => {
                    if (i < percentData.datasets.length) {
                        dataset.data = percentData.datasets[i].data;
                    }
                });
                
                chart.update();
            }
        }

        // Function to aggregate data for all sub-filters in a main filter
        function aggregateSubFilterData(mainFilter) {
            if (!preFilteredData[mainFilter]) return originalChartData;
            
            const subFilters = Object.keys(preFilteredData[mainFilter]);
            if (subFilters.length === 0) return originalChartData;
            
            // Use the first sub-filter to get structure
            const firstSubFilter = subFilters[0];
            const firstData = preFilteredData[mainFilter][firstSubFilter];
            
            if (!firstData || !firstData.labels || !firstData.datasets) return originalChartData;
            
            // Create new data structure with same labels and dataset structure
            const aggregated = {
                labels: [...firstData.labels],
                datasets: firstData.datasets.map(ds => ({
                    ...ds,
                    data: new Array(ds.data.length).fill(0)
                }))
            };
            
            // Aggregate data from all sub-filters
            subFilters.forEach(sub => {
                const subData = preFilteredData[mainFilter][sub];
                if (subData && subData.datasets) {
                    subData.datasets.forEach((ds, i) => {
                        if (i < aggregated.datasets.length) {
                            ds.data.forEach((val, j) => {
                                if (val !== null && val !== undefined && !isNaN(val)) {
                                    aggregated.datasets[i].data[j] += val;
                                }
                            });
                        }
                    });
                }
            });
            
            return aggregated;
        }

        // Recalculate percentages when hiding/showing datasets
        function recalculatePercentages(chart, visibleDatasets) {
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
            // Check for main filter (like district) in URL parameters
            const mainFilter = getQueryParam('district') || '';
            const subFilter = getQueryParam('taluka') || getQueryParam('filter') || '';
            
            // If hierarchical, populate secondary dropdown
            if (hasHierarchicalStructure()) {
                populateSecondaryDropdown(mainFilter);
            
                // Set sub-filter dropdown value if provided in URL
                if (subFilter && document.getElementById('chartFilter')) {
                    const subFilterSelect = document.getElementById('chartFilter');
                    // Find and select the option with matching value
                    for (let i = 0; i < subFilterSelect.options.length; i++) {
                        if (subFilterSelect.options[i].value === subFilter) {
                            subFilterSelect.selectedIndex = i;
                            break;
                        }
                    }
                }
            }
            
            // Apply filters based on URL parameters
            filterChartData();
        });
    </script>
</body>
</html>`;
    }
};