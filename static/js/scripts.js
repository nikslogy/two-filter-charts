document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const excelFileInput = document.getElementById('excelFile');
    const fileNameDisplay = document.getElementById('file-name');
    const loadingIndicator = document.getElementById('loading-indicator');
    const dataSelection = document.getElementById('data-selection');
    const sheetSelect = document.getElementById('sheetSelect');
    const xAxisSelect = document.getElementById('xAxisSelect');
    const yAxisSelectors = document.getElementById('yAxisSelectors');
    const xAxisPreview = document.getElementById('xAxisPreview');
    const yAxisPreview = document.getElementById('yAxisPreview');
    const addSeriesBtn = document.getElementById('addSeries');
    const chartTypeSelection = document.getElementById('chart-type-selection');
    const chartDisplay = document.getElementById('chart-display');
    const chartCanvas = document.getElementById('chartCanvas');
    const startRowInput = document.getElementById('startRow');
    const endRowInput = document.getElementById('endRow');
    const applyRangeBtn = document.getElementById('applyRange');
    const generateChartBtn = document.getElementById('generateChartBtn');
    const filterColumnSelect = document.getElementById('filterColumn');
    const filterValueSelect = document.getElementById('filterValue');
    const filterColumn2Select = document.getElementById('filterColumn2');
    const filterColumn3Select = document.getElementById('filterColumn3');
    const chartFilterValue = document.getElementById('chartFilterValue');
    const chartFilterValue2 = document.getElementById('chartFilterValue2');
    const chartFilterLabel = document.getElementById('chartFilterLabel');
    const chartFilterLabel2 = document.getElementById('chartFilterLabel2');
    const chartTitleInput = document.getElementById('chartTitle');
    const xAxisLabelInput = document.getElementById('xAxisLabel');
    const yAxisLabelInput = document.getElementById('yAxisLabel');
    const applyChartTitleBtn = document.getElementById('applyChartTitle');
    const applyAxisLabelsBtn = document.getElementById('applyAxisLabels');
    const downloadImageBtn = document.getElementById('downloadImageBtn');
    const downloadCodeBtn = document.getElementById('downloadCodeBtn');
    const copyDataBtn = document.getElementById('copyDataBtn');
    const chartTypeCards = document.querySelectorAll('.chart-type-card');
    
    // Y-axis range inputs
    const yMinValueInput = document.getElementById('yMinValue');
    const yMaxValueInput = document.getElementById('yMaxValue');
    const applyYAxisRangeBtn = document.getElementById('applyYAxisRange');
    const resetYAxisRangeBtn = document.getElementById('resetYAxisRange');
    
    // Chart description and sharing
    const chartDescription = document.getElementById('chartDescription');
    const chartAdditionalInfo = document.getElementById('chartAdditionalInfo');
    const shareChartBtn = document.getElementById('shareChartBtn');
    const downloadChartWithInfoBtn = document.getElementById('downloadChartWithInfoBtn');
    
    // State variables
    let currentFileName = '';
    let currentSheetName = '';
    let sheetData = [];
    let columns = [];
    let currentChart = null;
    let selectedChartType = 'line'; // Default to line chart
    
    // Define a default color palette for charts
    const colorPalette = [
        '#1a4570', '#ee8939', '#f5b843', '#8b3834', '#e0ba3f',
        '#e6e770', '#4d83c5', '#d3a037', '#779c51', '#b2d571'
    ];
    
    // File upload handling
    excelFileInput.addEventListener('change', function(e) {
        if (this.files && this.files[0]) {
            const file = this.files[0];
            fileNameDisplay.textContent = file.name;
            uploadFile(file);
        }
    });
    
    // Drag and drop handling
    const dropArea = document.querySelector('.file-upload-label');
    
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, preventDefaults, false);
    });
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    ['dragenter', 'dragover'].forEach(eventName => {
        dropArea.addEventListener(eventName, highlight, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, unhighlight, false);
    });
    
    function highlight() {
        dropArea.classList.add('highlight');
    }
    
    function unhighlight() {
        dropArea.classList.remove('highlight');
    }
    
    dropArea.addEventListener('drop', function(e) {
        const file = e.dataTransfer.files[0];
        excelFileInput.files = e.dataTransfer.files;
        fileNameDisplay.textContent = file.name;
        uploadFile(file);
    });
    
    // Function to upload the file to the server
    function uploadFile(file) {
        const formData = new FormData();
        formData.append('excelFile', file);
        
        loadingIndicator.classList.remove('hidden');
        
        fetch('/upload', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            loadingIndicator.classList.add('hidden');
            
            if (data.success) {
                currentFileName = data.filename;
                populateSheetSelect(data.sheets);
                dataSelection.classList.remove('hidden');
            } else {
                alert('Error: ' + data.error);
            }
        })
        .catch(error => {
            loadingIndicator.classList.add('hidden');
            console.error('Error:', error);
            alert('Error uploading file. Please try again.');
        });
    }
    
    // Populate sheet selector dropdown
    function populateSheetSelect(sheets) {
        sheetSelect.innerHTML = '';
        
        sheets.forEach(sheet => {
            const option = document.createElement('option');
            option.value = sheet;
            option.textContent = sheet;
            sheetSelect.appendChild(option);
        });
        
        // Trigger sheet selection to load first sheet
        sheetSelect.dispatchEvent(new Event('change'));
    }
    
    // Handle sheet selection
    sheetSelect.addEventListener('change', function() {
        currentSheetName = this.value;
        loadSheetData();
    });
    
    // Load data from selected sheet
    function loadSheetData() {
        loadingIndicator.classList.remove('hidden');

        // Reset filter values when changing sheets
        filterValueSelect.innerHTML = '<option value="">Select column first</option>';
        filterValueSelect.disabled = true;
        
        fetch('/get_sheet_data', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                filename: currentFileName,
                sheet: currentSheetName
            })
        })
        .then(response => response.json())
        .then(data => {
            loadingIndicator.classList.add('hidden');
            
            if (data.success) {
                columns = data.columns;
                sheetData = data.data;
                
                // Update row count
                endRowInput.value = data.rowCount + 1; // +1 for header row
                
                populateColumnSelectors();
                populateFilterColumns();
                chartTypeSelection.classList.remove('hidden');

                // Hide chart display when changing sheets
                chartDisplay.classList.add('hidden');
                if (currentChart) {
                    currentChart.destroy();
                    currentChart = null;
                }
                } else {
                alert('Error: ' + data.error);
            }
        })
        .catch(error => {
            loadingIndicator.classList.add('hidden');
            console.error('Error:', error);
            alert('Error loading sheet data. Please try again.');
        });
    }
    
    // Populate column selectors
    function populateColumnSelectors() {
        // Clear existing options
        xAxisSelect.innerHTML = '';
        document.querySelectorAll('.y-axis-select').forEach(select => {
            select.innerHTML = '';
        });
        
        // Add options for each column
        columns.forEach(column => {
            // Add to X-axis select
            const xOption = document.createElement('option');
            xOption.value = column;
            xOption.textContent = column;
            xAxisSelect.appendChild(xOption);
            
            // Add to Y-axis selects
            document.querySelectorAll('.y-axis-select').forEach(select => {
                const yOption = document.createElement('option');
                yOption.value = column;
                yOption.textContent = column;
                select.appendChild(yOption);
            });
        });
        
        // Trigger change events to update previews
        xAxisSelect.dispatchEvent(new Event('change'));
        document.querySelector('.y-axis-select').dispatchEvent(new Event('change'));
    }
    
    // Populate filter column selectors
    function populateFilterColumns() {
        // Clear existing options
        filterColumnSelect.innerHTML = '<option value="">No Filter</option>';
        filterColumn2Select.innerHTML = '<option value="">No Chart Filter</option>';
        filterColumn3Select.innerHTML = '<option value="">No Chart Filter</option>'; 
        
        // Also clear the chart filter dropdowns when changing sheets
        chartFilterValue.innerHTML = '<option value="">All Values</option>';
        chartFilterValue2.innerHTML = '<option value="">All Values</option>';

        // Hide chart filter controls when changing sheets
        document.querySelector('.chart-filter-controls').classList.add('hidden');
        chartFilterValue.parentElement.classList.add('hidden');
        chartFilterValue2.parentElement.classList.add('hidden');

        // Add options for each column
        columns.forEach(column => {
            // Add to filter column select
            const filterOption = document.createElement('option');
            filterOption.value = column;
            filterOption.textContent = column;
            filterColumnSelect.appendChild(filterOption.cloneNode(true));
            
            // Add to chart filter column selects
            filterColumn2Select.appendChild(filterOption.cloneNode(true));
            filterColumn3Select.appendChild(filterOption.cloneNode(true));
        });
    }
    
    // Handle X-axis selection
    xAxisSelect.addEventListener('change', function() {
        updateXAxisPreview();
    });
    
    // Update X-axis preview
    function updateXAxisPreview() {
        const selectedColumn = xAxisSelect.value;
        
        if (selectedColumn && sheetData.length > 0) {
            // Display first few values
            const previewValues = sheetData.slice(0, 5).map(row => row[selectedColumn]);
            xAxisPreview.innerHTML = previewValues.map(val => `<div>${val !== null ? val : '(empty)'}</div>`).join('');
        } else {
            xAxisPreview.innerHTML = '<em>No data to preview</em>';
        }
    }
    
    // Handle Y-axis selection changes
    yAxisSelectors.addEventListener('change', function(e) {
        if (e.target.classList.contains('y-axis-select')) {
            updateYAxisPreview();
        }
    });
    
    // Update Y-axis preview
    function updateYAxisPreview() {
        const selectedColumns = Array.from(document.querySelectorAll('.y-axis-select')).map(select => select.value);
        
        if (selectedColumns.length > 0 && selectedColumns[0] && sheetData.length > 0) {
            // Display first few values of first selected Y-axis
            const previewValues = sheetData.slice(0, 5).map(row => row[selectedColumns[0]]);
            yAxisPreview.innerHTML = previewValues.map(val => `<div>${val !== null ? val : '(empty)'}</div>`).join('');
        } else {
            yAxisPreview.innerHTML = '<em>No data to preview</em>';
        }
    }
    
    // Add another Y-axis series
    addSeriesBtn.addEventListener('click', function() {
        const yAxisItem = document.createElement('div');
        yAxisItem.className = 'y-axis-item';
        
        const select = document.createElement('select');
        select.className = 'y-axis-select';
        
        // Add options to the new select
        columns.forEach(column => {
            const option = document.createElement('option');
            option.value = column;
            option.textContent = column;
            select.appendChild(option);
        });
        
        const colorInput = document.createElement('input');
        colorInput.type = 'color';
        colorInput.className = 'series-color';
        colorInput.value = getRandomColor();
        
        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-y-axis';
        removeBtn.title = 'Remove series';
        removeBtn.textContent = '✕';
        removeBtn.addEventListener('click', function() {
            yAxisItem.remove();
        });
        
        yAxisItem.appendChild(select);
        yAxisItem.appendChild(colorInput);
        yAxisItem.appendChild(removeBtn);
        
        yAxisSelectors.appendChild(yAxisItem);
    });
    
    // Generate random color
    function getRandomColor() {
        // Get color from palette if possible, otherwise generate random
        const colorIndex = document.querySelectorAll('.y-axis-item').length % colorPalette.length;
        return colorPalette[colorIndex];
    }
    
    // Handle filter column selection
    filterColumnSelect.addEventListener('change', function() {
        if (this.value) {
            filterValueSelect.disabled = false;
            loadFilterValues(this.value);
        } else {
            filterValueSelect.disabled = true;
            filterValueSelect.innerHTML = '<option value="">Select column first</option>';
        }
    });
    
    // Load filter values for selected column
    function loadFilterValues(column) {
        // Get unique values for the column
        const uniqueValues = [...new Set(sheetData.map(row => row[column]).filter(val => val !== null))];
        
        // Clear and populate the filter value select
        filterValueSelect.innerHTML = '<option value="">All</option>';
        
        uniqueValues.forEach(value => {
            const option = document.createElement('option');
            option.value = value;
            option.textContent = value;
            filterValueSelect.appendChild(option);
        });
    }
    
    // Apply data range
    applyRangeBtn.addEventListener('click', function() {
        const startRow = parseInt(startRowInput.value);
        const endRow = parseInt(endRowInput.value);
        
        if (startRow > endRow) {
            alert('Start row cannot be greater than end row');
            return;
        }
        
        applyFilters();
    });
    
    // Apply filters (both row range and column filter)
    function applyFilters() {
        loadingIndicator.classList.remove('hidden');
        
        fetch('/filter_data', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                filename: currentFileName,
                sheet: currentSheetName,
                startRow: parseInt(startRowInput.value),
                endRow: parseInt(endRowInput.value),
                filterColumn: filterColumnSelect.value,
                filterValue: filterValueSelect.value
            })
        })
        .then(response => response.json())
        .then(data => {
            loadingIndicator.classList.add('hidden');
            
            if (data.success) {
                sheetData = data.data;
                
                // Update previews
                updateXAxisPreview();
                updateYAxisPreview();
                
                // Update any other filter dropdowns with new unique values
                if (filterColumn2Select.value && data.uniqueValues[filterColumn2Select.value]) {
                    // Update chart filter values
                    populateChartFilterValues(data.uniqueValues[filterColumn2Select.value], filterColumn2Select.value);
                }
            } else {
                alert('Error: ' + data.error);
            }
        })
        .catch(error => {
            loadingIndicator.classList.add('hidden');
            console.error('Error:', error);
            alert('Error applying filters. Please try again.');
        });
    }
    
    // Handle chart filter column selection
    filterColumn2Select.addEventListener('change', function() {
        if (this.value) {
            // Get unique values for this column
            const uniqueValues = [...new Set(sheetData.map(row => row[this.value]).filter(val => val !== null))];
            populateChartFilterValues(uniqueValues, this.value);
        } else {
            // Clear chart filter dropdown
            chartFilterValue.innerHTML = '<option value="">All</option>';
        }
    });
    
    // Handle second chart filter column selection
    filterColumn3Select.addEventListener('change', function() {
        // We don't need to update any dropdown values for this one
        // It will be applied when generating the chart
    });
    
    // Populate chart filter values
    function populateChartFilterValues(values, columnName) {
        chartFilterValue.innerHTML = '<option value="">All</option>';
        
        // Use a set to track unique values
        const uniqueValues = new Set();
        
        values.forEach(value => {
            // Only add actual filter values, not internal data structure keys
            if (value && typeof value === 'string' && 
                value !== 'datasets' && value !== 'labels' && 
                value.indexOf('+') === -1 && !value.match(/^\d+$/)) {
                
                // Skip duplicates
                if (!uniqueValues.has(value)) {
                    uniqueValues.add(value);
                    const option = document.createElement('option');
                    option.value = value;
                    option.textContent = value;
                    chartFilterValue.appendChild(option);
                }
            }
        });
    }
    
    // Populate second chart filter values
    function populateChartFilterValues2(values, columnName) {
        chartFilterValue2.innerHTML = '<option value="">All</option>';
        
        // Use a set to track unique values
        const uniqueValues = new Set();
        
        values.forEach(value => {
            // Only add actual filter values, not internal data structure keys
            if (value && typeof value === 'string' && 
                value !== 'datasets' && value !== 'labels' && 
                value.indexOf('+') === -1 && !value.match(/^\d+$/)) {
                
                // Skip duplicates
                if (!uniqueValues.has(value)) {
                    uniqueValues.add(value);
                    const option = document.createElement('option');
                    option.value = value;
                    option.textContent = value;
                    chartFilterValue2.appendChild(option);
                }
            }
        });
    }
    
    // Handle chart type selection
    chartTypeCards.forEach(card => {
        card.addEventListener('click', function() {
            // Remove active class from all cards
            chartTypeCards.forEach(c => c.classList.remove('active'));
            
            // Add active class to selected card
            this.classList.add('active');
            
            // Set selected chart type
            selectedChartType = this.getAttribute('data-type');
        });
    });
    
    // Generate chart
    generateChartBtn.addEventListener('click', function() {
        // Get selected axes
        const xAxis = xAxisSelect.value;
        const yAxes = Array.from(document.querySelectorAll('.y-axis-item')).map(item => {
            return {
                column: item.querySelector('.y-axis-select').value,
                color: item.querySelector('.series-color').value
            };
        });
        
        if (!xAxis || yAxes.length === 0 || !yAxes[0].column) {
            alert('Please select both X and Y axes');
            return;
        }
        
        // Generate the chart
        loadingIndicator.classList.remove('hidden');
        
        fetch('/generate_chart', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                filename: currentFileName,
                sheet: currentSheetName,
                xAxis: xAxis,
                yAxes: yAxes,
                chartType: selectedChartType,
                startRow: parseInt(startRowInput.value),
                endRow: parseInt(endRowInput.value),
                filterColumn: filterColumnSelect.value,
                filterValue: filterValueSelect.value,
                chartFilterColumn: filterColumn2Select.value,
                chartFilterColumn2: filterColumn3Select.value
            })
        })
        .then(response => response.json())
        .then(data => {
            loadingIndicator.classList.add('hidden');
            
            if (data.success) {
                // Show chart display section
                chartDisplay.classList.remove('hidden');
                
                // Create chart based on selected chart type
                createChart(data.chartData);
                
                // Scroll to chart
                chartDisplay.scrollIntoView({ behavior: 'smooth' });
                
                // Update chart filter values if chart filter column is selected
                if (filterColumn2Select.value && data.chartFilterValues && data.chartFilterValues.length > 0) {
                    populateChartFilterValues(data.chartFilterValues, filterColumn2Select.value);
                    chartFilterLabel.textContent = `Filter by ${filterColumn2Select.value}:`;
                    document.querySelector('.chart-filter-controls').classList.remove('hidden');
                } else {
                    // Hide only the first filter dropdown, not the entire controls div
                    chartFilterValue.parentElement.classList.add('hidden');
                }
                
                // Update second chart filter values if second chart filter column is selected
                if (filterColumn3Select.value && data.chartFilterValues2 && data.chartFilterValues2.length > 0) {
                    populateChartFilterValues2(data.chartFilterValues2, filterColumn3Select.value);
                    chartFilterLabel2.textContent = `Filter by ${filterColumn3Select.value}:`;
                    document.querySelector('.chart-filter-controls').classList.remove('hidden');
                    
                    // Make sure the second filter dropdown is visible
                    chartFilterValue2.parentElement.classList.remove('hidden');
                } else {
                    // Hide only the second filter dropdown
                    chartFilterValue2.parentElement.classList.add('hidden');
                }
                
                // Hide the entire controls if both dropdowns are hidden
                if (!filterColumn2Select.value && !filterColumn3Select.value) {
                    document.querySelector('.chart-filter-controls').classList.add('hidden');
                }
            } else {
                alert('Error: ' + data.error);
            }
        })
        .catch(error => {
            loadingIndicator.classList.add('hidden');
            console.error('Error:', error);
            alert('Error generating chart. Please try again.');
        });
    });
    
    // Create chart using appropriate handler based on chart type
    function createChart(chartData) {
        // Destroy existing chart if there is one
        if (currentChart) {
            try {
                currentChart.destroy();
                currentChart = null;
            } catch (error) {
                console.warn('Error destroying previous chart:', error);
            }
        }
        
        // Create chart based on selected type
        if (selectedChartType === 'line') {
            currentChart = LineChartHandler.createLineChart(chartData, chartCanvas);
        } else if (selectedChartType === 'bar') {
            currentChart = BarChartHandler.createBarChart(chartData, chartCanvas);
        } else if (selectedChartType === 'stackedBar') {
            currentChart = StackedBarChartHandler.createStackedBarChart(chartData, chartCanvas);
        } else if (selectedChartType === 'percentStackedBar') {
            currentChart = PercentStackedBarChartHandler.createPercentStackedBarChart(chartData, chartCanvas);
        } else {
            console.error('Unsupported chart type:', selectedChartType);
            alert('Unsupported chart type: ' + selectedChartType);
        }
    }
    
    // Filter chart by selected value
    chartFilterValue.addEventListener('change', function() {
        if (!currentChart || !filterColumn2Select.value) return;
        
        const filterValue = this.value;
        const isDistrictTalukaHierarchy = filterColumnSelect.value === 'District' && filterColumn2Select.value === 'Taluka';
        
        // Add a loading indicator
        const loadingMessage = document.createElement('div');
        loadingMessage.className = 'chart-loading-message';
        loadingMessage.textContent = 'Updating chart...';
        document.body.appendChild(loadingMessage);
        
        // Create request payload
        const requestBody = {
            filename: currentFileName,
            sheet: currentSheetName,
            xAxis: xAxisSelect.value,
            yAxes: Array.from(document.querySelectorAll('.y-axis-item')).map(item => {
                return {
                    column: item.querySelector('.y-axis-select').value,
                    color: item.querySelector('.series-color').value
                };
            }),
            chartType: selectedChartType,
            startRow: parseInt(startRowInput.value),
            endRow: parseInt(endRowInput.value),
            filterColumn: filterColumnSelect.value,
            filterValue: filterValueSelect.value,
            chartFilterColumn: filterColumn2Select.value,
            chartFilterValue: filterValue,
            chartFilterColumn2: filterColumn3Select.value,
            chartFilterValue2: chartFilterValue2.value
        };
        
        // Add hierarchy information if we're using district-taluka relationship
        if (isDistrictTalukaHierarchy) {
            requestBody.districtColumn = 'District';
            requestBody.talukaColumn = 'Taluka';
        }
        
        // Send request to apply filter
        fetch('/apply_chart_filter', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        })
        .then(response => response.json())
        .then(data => {
            // Remove loading message
            document.body.removeChild(loadingMessage);
            
            if (data.success) {
                // Update chart with filtered data based on chart type
                updateChart(data.chartData);
            } else {
                alert('Error applying filter: ' + data.error);
            }
        })
        .catch(error => {
            document.body.removeChild(loadingMessage);
            console.error('Error:', error);
            alert('Error applying chart filter. Please try again.');
        });
    });
    
    // Filter chart by selected value for second filter
    chartFilterValue2.addEventListener('change', function() {
        if (!currentChart || !filterColumn3Select.value) return;
        
        const filterValue2 = this.value;
        console.log("Second filter selected:", filterColumn3Select.value, filterValue2);
        
        // Add a loading indicator
        const loadingMessage = document.createElement('div');
        loadingMessage.className = 'chart-loading-message';
        loadingMessage.textContent = 'Updating chart...';
        document.body.appendChild(loadingMessage);
        
        // Create request data
        const requestData = {
            filename: currentFileName,
            sheet: currentSheetName,
            xAxis: xAxisSelect.value,
            yAxes: Array.from(document.querySelectorAll('.y-axis-item')).map(item => {
                return {
                    column: item.querySelector('.y-axis-select').value,
                    color: item.querySelector('.series-color').value
                };
            }),
            chartType: selectedChartType,
            startRow: parseInt(startRowInput.value),
            endRow: parseInt(endRowInput.value),
            filterColumn: filterColumnSelect.value,
            filterValue: filterValueSelect.value,
            chartFilterColumn: filterColumn2Select.value,
            chartFilterValue: chartFilterValue.value,
            chartFilterColumn2: filterColumn3Select.value,
            chartFilterValue2: filterValue2
        };
        
        console.log("Sending request with data:", JSON.stringify(requestData));
        
        // Send request to apply filter
        fetch('/apply_chart_filter', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestData)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok: ' + response.status);
            }
            return response.json();
        })
        .then(data => {
            // Remove loading message
            document.body.removeChild(loadingMessage);
            
            if (data.success) {
                console.log("Filter applied successfully, updating chart with new data");
                console.log("Received data:", JSON.stringify(data.chartData));
                // Update chart with filtered data based on chart type
                updateChart(data.chartData);
            } else {
                console.error("Error from server:", data.error);
                alert('Error applying filter: ' + data.error);
            }
        })
        .catch(error => {
            document.body.removeChild(loadingMessage);
            console.error('Error applying chart filter:', error);
            alert('Error applying chart filter. Please try again.');
        });
    });
    
    // Function to update an existing chart with new data
    function updateChart(chartData) {
        if (!currentChart) return;
        
        // Update chart based on selected type
        if (selectedChartType === 'line') {
            LineChartHandler.updateLineChart(chartData, currentChart);
        } else if (selectedChartType === 'bar') {
            BarChartHandler.updateBarChart(chartData, currentChart);
        } else if (selectedChartType === 'stackedBar') {
            StackedBarChartHandler.updateStackedBarChart(chartData, currentChart);
        } else if (selectedChartType === 'percentStackedBar') {
            PercentStackedBarChartHandler.updatePercentStackedBarChart(chartData, currentChart);
        }
    }
    
    // Apply chart title
    applyChartTitleBtn.addEventListener('click', function() {
        if (currentChart) {
            // Make sure options exists
            if (!currentChart.options.plugins) {
                currentChart.options.plugins = {};
            }
            if (!currentChart.options.plugins.title) {
                currentChart.options.plugins.title = {};
            }
            
            currentChart.options.plugins.title.text = chartTitleInput.value;
            currentChart.options.plugins.title.display = !!chartTitleInput.value;
            currentChart.update();
        }
    });
    
    // Apply axis labels
    applyAxisLabelsBtn.addEventListener('click', function() {
        if (currentChart) {
            if (!currentChart.options.scales) {
                currentChart.options.scales = { x: {}, y: {} };
            }
            
            currentChart.options.scales.x.title = {
                display: !!xAxisLabelInput.value,
                text: xAxisLabelInput.value
            };
            
            currentChart.options.scales.y.title = {
                display: !!yAxisLabelInput.value,
                text: yAxisLabelInput.value
            };
            
            currentChart.update();
        }
    });
    
    // Download chart as image
    downloadImageBtn.addEventListener('click', function() {
        if (currentChart) {
            const link = document.createElement('a');
            link.download = selectedChartType + '_chart.png';
            link.href = chartCanvas.toDataURL('image/png');
            link.click();
        }
    });
    
    // Download chart code
    downloadCodeBtn.addEventListener('click', function() {
        if (currentChart) {
            const chartConfig = currentChart.config;
            const chartTitle = chartTitleInput.value || 'Untitled Chart';
            const description = chartDescription.value || '';
            const additionalInfo = chartAdditionalInfo.value || '';
            
            // Get chart filter information
            const chartFilterColumn = filterColumn2Select.value;
            const chartFilterOptions = Array.from(chartFilterValue.options).map(opt => opt.value);
            const selectedFilterValue = chartFilterValue.value;
            
            // Get second chart filter information
            const chartFilterColumn2 = filterColumn3Select.value;
            const chartFilterOptions2 = Array.from(chartFilterValue2.options).map(opt => opt.value);
            const selectedFilterValue2 = chartFilterValue2.value;
            
            // Determine if we're dealing with a district-taluka hierarchy
            const isDistrictTalukaHierarchy = filterColumnSelect.value === 'District' && chartFilterColumn === 'Taluka';
            
            // Create loading indicator message for user feedback
            const loadingDiv = document.createElement('div');
            loadingDiv.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: rgba(0,0,0,0.8); color: white; padding: 20px; border-radius: 8px; z-index: 9999;';
            loadingDiv.textContent = 'Preparing chart data...';
            document.body.appendChild(loadingDiv);
            
            // Pre-generate filtered data for each filter option
            const preFilteredData = {};
            
            // Store hierarchy mappings (taluka -> district)
            const hierarchyMappings = {};
            
            // Store column metadata to help with filtering
            const columnMetadata = {
                filter1Column: chartFilterColumn,
                filter2Column: chartFilterColumn2
            };
            
            // Track the number of fetch operations and completions
            let fetchCount = 0;
            let completedFetches = 0;
            
            // Only process if there are filter options
            if ((chartFilterColumn && chartFilterOptions.length > 0) || 
                (chartFilterColumn2 && chartFilterOptions2.length > 0)) {
                // Save current chart data and state
                const currentLabels = [...currentChart.data.labels];
                const currentDatasets = JSON.parse(JSON.stringify(currentChart.data.datasets));
                const currentVisibility = [];
                currentChart.data.datasets.forEach((dataset, i) => {
                    currentVisibility.push(!currentChart.getDatasetMeta(i).hidden);
                });
                
                // Process each filter option sequentially for more reliable results
                const processFilterOptions = async () => {
                    // Create an array of promises for fetch operations
                    const fetchPromises = [];
                    
                    // Process first filter options
                    if (chartFilterColumn && chartFilterOptions.length > 0) {
                        for (const filterOption of chartFilterOptions) {
                            if (!filterOption) {
                                // Skip empty option (All Values)
                                continue;
                            }
                            
                            // Create the request body with hierarchy information if applicable
                            const requestBody = {
                                filename: currentFileName,
                                sheet: currentSheetName,
                                xAxis: xAxisSelect.value,
                                yAxes: Array.from(document.querySelectorAll('.y-axis-item')).map(item => {
                                    return {
                                        column: item.querySelector('.y-axis-select').value,
                                        color: item.querySelector('.series-color').value
                                    };
                                }),
                                chartType: selectedChartType,
                                startRow: parseInt(startRowInput.value),
                                endRow: parseInt(endRowInput.value),
                                filterColumn: filterColumnSelect.value,
                                filterValue: filterValueSelect.value,
                                chartFilterColumn: chartFilterColumn,
                                chartFilterValue: filterOption,
                                chartFilterColumn2: chartFilterColumn2,
                                chartFilterValue2: selectedFilterValue2
                            };
                            
                            // Add district-taluka hierarchy information if applicable
                            if (isDistrictTalukaHierarchy) {
                                requestBody.districtColumn = 'District';
                                requestBody.talukaColumn = 'Taluka';
                            }
                            
                            // Create a promise for this fetch operation
                            const fetchPromise = fetch('/apply_chart_filter', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify(requestBody)
                            })
                            .then(response => response.json())
                            .then(data => {
                                if (data.success) {
                                    // Tag this data as belonging to filter1
                                    const dataWithMetadata = {
                                        ...data.chartData,
                                        _filterColumn: chartFilterColumn,
                                        _filterValue: filterOption
                                    };
                                    
                                    // Handle hierarchy information if present
                                    if (data.hierarchyInfo) {
                                        const { parentColumn, childColumn, parentValues, childValue } = data.hierarchyInfo;
                                        
                                        // Store mapping from taluka to district
                                        if (parentValues && parentValues.length > 0) {
                                            hierarchyMappings[childValue] = parentValues[0]; // Using first parent if multiple
                                            
                                            // Store data in hierarchical structure
                                            const district = parentValues[0];
                                            if (!preFilteredData[district]) {
                                                preFilteredData[district] = {};
                                            }
                                            preFilteredData[district][filterOption] = dataWithMetadata;
                                        } else {
                                            // Fallback to flat structure if parent information is missing
                                            preFilteredData[filterOption] = dataWithMetadata;
                                        }
                                    } else {
                                        // Use flat structure for non-hierarchical data
                                        preFilteredData[filterOption] = dataWithMetadata;
                                    }
                                }
                                completedFetches++;
                                
                                // Update the loading message to show progress
                                loadingDiv.textContent = `Preparing chart data... (${completedFetches}/${fetchCount})`;
                            })
                            .catch(error => {
                                console.error('Error pre-filtering data for ' + filterOption, error);
                                completedFetches++;
                                loadingDiv.textContent = `Preparing chart data... (${completedFetches}/${fetchCount})`;
                            });
                            
                            fetchPromises.push(fetchPromise);
                            fetchCount++;
                        }
                    }
                    
                    // Process second filter options
                    if (chartFilterColumn2 && chartFilterOptions2.length > 0) {
                        for (const filterOption2 of chartFilterOptions2) {
                            if (!filterOption2) {
                                // Skip empty option (All Values)
                                continue;
                            }
                            
                            // Create the request body with hierarchy information if applicable
                            const requestBody = {
                                filename: currentFileName,
                                sheet: currentSheetName,
                                xAxis: xAxisSelect.value,
                                yAxes: Array.from(document.querySelectorAll('.y-axis-item')).map(item => {
                                    return {
                                        column: item.querySelector('.y-axis-select').value,
                                        color: item.querySelector('.series-color').value
                                    };
                                }),
                                chartType: selectedChartType,
                                startRow: parseInt(startRowInput.value),
                                endRow: parseInt(endRowInput.value),
                                filterColumn: filterColumnSelect.value,
                                filterValue: filterValueSelect.value,
                                chartFilterColumn: chartFilterColumn,
                                chartFilterValue: selectedFilterValue,
                                chartFilterColumn2: chartFilterColumn2,
                                chartFilterValue2: filterOption2
                            };
                            
                            // Create a promise for this fetch operation
                            const fetchPromise = fetch('/apply_chart_filter', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify(requestBody)
                            })
                            .then(response => response.json())
                            .then(data => {
                                if (data.success) {
                                    // Tag this data as belonging to filter2
                                    const dataWithMetadata = {
                                        ...data.chartData,
                                        _filterColumn: chartFilterColumn2,
                                        _filterValue: filterOption2
                                    };
                                    
                                    // Store data with second filter key
                                    preFilteredData[filterOption2] = dataWithMetadata;
                                }
                                completedFetches++;
                                
                                // Update the loading message to show progress
                                loadingDiv.textContent = `Preparing chart data... (${completedFetches}/${fetchCount})`;
                            })
                            .catch(error => {
                                console.error('Error pre-filtering data for second filter ' + filterOption2, error);
                                completedFetches++;
                                loadingDiv.textContent = `Preparing chart data... (${completedFetches}/${fetchCount})`;
                            });
                            
                            fetchPromises.push(fetchPromise);
                            fetchCount++;
                        }
                    }
                    
                    // Process combinations of both filters
                    if (chartFilterColumn && chartFilterOptions.length > 0 && 
                        chartFilterColumn2 && chartFilterOptions2.length > 0) {
                        for (const filterOption of chartFilterOptions) {
                            if (!filterOption) continue; // Skip empty option
                            
                            for (const filterOption2 of chartFilterOptions2) {
                                if (!filterOption2) continue; // Skip empty option
                                
                                // Create the request body for the combination
                                const requestBody = {
                                    filename: currentFileName,
                                    sheet: currentSheetName,
                                    xAxis: xAxisSelect.value,
                                    yAxes: Array.from(document.querySelectorAll('.y-axis-item')).map(item => {
                                        return {
                                            column: item.querySelector('.y-axis-select').value,
                                            color: item.querySelector('.series-color').value
                                        };
                                    }),
                                    chartType: selectedChartType,
                                    startRow: parseInt(startRowInput.value),
                                    endRow: parseInt(endRowInput.value),
                                    filterColumn: filterColumnSelect.value,
                                    filterValue: filterValueSelect.value,
                                    chartFilterColumn: chartFilterColumn,
                                    chartFilterValue: filterOption,
                                    chartFilterColumn2: chartFilterColumn2,
                                    chartFilterValue2: filterOption2
                                };
                                
                                // Add district-taluka hierarchy information if applicable
                                if (isDistrictTalukaHierarchy) {
                                    requestBody.districtColumn = 'District';
                                    requestBody.talukaColumn = 'Taluka';
                                }
                                
                                // Create a promise for this fetch operation
                                const fetchPromise = fetch('/apply_chart_filter', {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json',
                                    },
                                    body: JSON.stringify(requestBody)
                                })
                                .then(response => response.json())
                                .then(data => {
                                    if (data.success) {
                                        // Store the data with a combined key
                                        const combinedKey = filterOption + "+" + filterOption2;
                                        
                                        // Tag this data with both filters
                                        const dataWithMetadata = {
                                            ...data.chartData,
                                            _filterColumn1: chartFilterColumn,
                                            _filterValue1: filterOption,
                                            _filterColumn2: chartFilterColumn2,
                                            _filterValue2: filterOption2
                                        };
                                        
                                        // Store at the root level
                                        preFilteredData[combinedKey] = dataWithMetadata;
                                        
                                        // Also store hierarchically if applicable
                                        if (isDistrictTalukaHierarchy && hierarchyMappings[filterOption]) {
                                            const district = hierarchyMappings[filterOption];
                                            if (!preFilteredData[district]) {
                                                preFilteredData[district] = {};
                                            }
                                            preFilteredData[district][combinedKey] = dataWithMetadata;
                                        }
                                        
                                        // Store in the first filter's hierarchy if possible
                                        if (preFilteredData[filterOption] && typeof preFilteredData[filterOption] === 'object') {
                                            // Check if it's a data object rather than a nested structure
                                            if (!preFilteredData[filterOption].labels) {
                                                preFilteredData[filterOption][filterOption2] = dataWithMetadata;
                                            }
                                        }
                                    }
                                    completedFetches++;
                                    
                                    // Update the loading message to show progress
                                    loadingDiv.textContent = `Preparing chart data... (${completedFetches}/${fetchCount})`;
                                })
                                .catch(error => {
                                    console.error(`Error pre-filtering data for combination ${filterOption} + ${filterOption2}`, error);
                                    completedFetches++;
                                    loadingDiv.textContent = `Preparing chart data... (${completedFetches}/${fetchCount})`;
                                });
                                
                                fetchPromises.push(fetchPromise);
                                fetchCount++;
                            }
                        }
                    }
                    
                    // Wait for all fetch operations to complete
                    return Promise.all(fetchPromises);
                };
                
                // Execute the fetch operations and then generate the HTML
                processFilterOptions().then(() => {
                    // Remove loading message
                    document.body.removeChild(loadingDiv);
                    
                    // If using district-taluka hierarchy but data was not structured hierarchically,
                    // restructure it based on collected mappings
                    if (isDistrictTalukaHierarchy) {
                        const flatData = {};
                        const hierarchicalData = {};
                        
                        // Identify flat data entries
                        Object.keys(preFilteredData).forEach(key => {
                            if (typeof preFilteredData[key] === 'object' && 
                                preFilteredData[key] !== null &&
                                preFilteredData[key].labels && 
                                preFilteredData[key].datasets) {
                                // This is a flat taluka entry
                                flatData[key] = preFilteredData[key];
                            }
                        });
                        
                        // Restructure flat data into hierarchical format using mappings
                        Object.keys(flatData).forEach(taluka => {
                            const district = hierarchyMappings[taluka] || 'Unknown District';
                            
                            if (!hierarchicalData[district]) {
                                hierarchicalData[district] = {};
                            }
                            hierarchicalData[district][taluka] = flatData[taluka];
                            
                            // Remove the flat entry
                            delete preFilteredData[taluka];
                        });
                        
                        // Merge hierarchical data back into preFilteredData
                        Object.keys(hierarchicalData).forEach(district => {
                            if (!preFilteredData[district]) {
                                preFilteredData[district] = {};
                            }
                            Object.keys(hierarchicalData[district]).forEach(taluka => {
                                preFilteredData[district][taluka] = hierarchicalData[district][taluka];
                            });
                        });
                    }
                    
                    // Restore original chart state
                    currentChart.data.labels = currentLabels;
                    currentChart.data.datasets.forEach((dataset, i) => {
                        Object.assign(dataset, currentDatasets[i]);
                        currentChart.getDatasetMeta(i).hidden = !currentVisibility[i];
                    });
                    currentChart.update();
                    
                    // Generate the appropriate HTML based on chart type
                    generateAndDownloadChartHTML(chartConfig, chartTitle, description, additionalInfo, 
                                               chartFilterColumn, chartFilterOptions, selectedFilterValue, 
                                               preFilteredData, chartFilterColumn2, chartFilterOptions2, selectedFilterValue2, columnMetadata);
                });
            } else {
                // No filter options, just generate HTML
                document.body.removeChild(loadingDiv);
                generateAndDownloadChartHTML(chartConfig, chartTitle, description, additionalInfo, 
                                           chartFilterColumn, chartFilterOptions, selectedFilterValue, 
                                           preFilteredData, chartFilterColumn2, chartFilterOptions2, selectedFilterValue2, columnMetadata);
            }
        }
    });
    
    // Generate and download HTML for the current chart
    function generateAndDownloadChartHTML(chartConfig, chartTitle, description, additionalInfo, 
                                         chartFilterColumn, chartFilterOptions, selectedFilterValue, 
                                         preFilteredData, chartFilterColumn2, chartFilterOptions2, selectedFilterValue2, columnMetadata) {
        // Get chart type handler
        let chartHandler;
        if (selectedChartType === 'line') {
            chartHandler = LineChartHandler;
        } else if (selectedChartType === 'bar') {
            chartHandler = BarChartHandler;
        } else if (selectedChartType === 'stackedBar') {
            chartHandler = StackedBarChartHandler;
        } else if (selectedChartType === 'percentStackedBar') {
            chartHandler = PercentStackedBarChartHandler;
        } else {
            alert('Unsupported chart type: ' + selectedChartType);
            return;
        }
        
        // Get chart filter column names and values
        const chartFilterColumn1 = filterColumn2Select.value;
        
        // Get main filter information
        const mainFilterColumn = filterColumnSelect.value;
        const mainFilterValue = filterValueSelect.value;
        
        // Generate HTML for chart
        let chartHTML;
        if (selectedChartType === 'line') {
            chartHTML = chartHandler.generateLineChartHTML(
                chartConfig, chartTitle, description, additionalInfo, 
                chartFilterColumn1, chartFilterOptions, selectedFilterValue, 
                preFilteredData, chartFilterColumn2, chartFilterOptions2, selectedFilterValue2,
                mainFilterColumn, mainFilterValue, columnMetadata
            );
        } else if (selectedChartType === 'bar') {
            chartHTML = chartHandler.generateBarChartHTML(
                chartConfig, chartTitle, description, additionalInfo, 
                chartFilterColumn1, chartFilterOptions, selectedFilterValue, 
                preFilteredData, chartFilterColumn2, chartFilterOptions2, selectedFilterValue2,
                mainFilterColumn, mainFilterValue, columnMetadata
            );
        } else if (selectedChartType === 'stackedBar') {
            chartHTML = chartHandler.generateStackedBarChartHTML(
                chartConfig, chartTitle, description, additionalInfo, 
                chartFilterColumn1, chartFilterOptions, selectedFilterValue, 
                preFilteredData, chartFilterColumn2, chartFilterOptions2, selectedFilterValue2,
                mainFilterColumn, mainFilterValue, columnMetadata
            );
        } else if (selectedChartType === 'percentStackedBar') {
            chartHTML = chartHandler.generatePercentStackedBarChartHTML(
                chartConfig, chartTitle, description, additionalInfo, 
                chartFilterColumn1, chartFilterOptions, selectedFilterValue, 
                preFilteredData, chartFilterColumn2, chartFilterOptions2, selectedFilterValue2,
                mainFilterColumn, mainFilterValue, columnMetadata
            );
        }
        
        // Create download link
        const blob = new Blob([chartHTML], { type: 'text/html' });
        const link = document.createElement('a');
        link.download = chartTitle.replace(/\s+/g, '_') + '.html';
        link.href = URL.createObjectURL(blob);
        link.click();
    }
    
    // Copy chart data to clipboard
    copyDataBtn.addEventListener('click', function() {
        if (currentChart) {
            const data = currentChart.data;
            
            // Format data as CSV
            const headers = ['Label', ...data.datasets.map(ds => ds.label || 'Dataset')];
            const rows = data.labels.map((label, i) => {
                return [
                    label,
                    ...data.datasets.map(ds => ds.data[i])
                ];
            });
            
            const csv = [
                headers.join(','),
                ...rows.map(row => row.join(','))
            ].join('\n');
            
            // Copy to clipboard
            navigator.clipboard.writeText(csv)
                .then(() => alert('Chart data copied to clipboard!'))
                .catch(() => {
                    // Fallback for older browsers
                    const textarea = document.createElement('textarea');
                    textarea.value = csv;
                    document.body.appendChild(textarea);
                    textarea.select();
                    document.execCommand('copy');
                    document.body.removeChild(textarea);
                    alert('Chart data copied to clipboard!');
                });
        }
    });
    
    // Apply Y-axis range
    applyYAxisRangeBtn.addEventListener('click', function() {
        if (!currentChart) return;
        
        // Get min and max values
        const minValue = yMinValueInput.value.trim() === '' ? undefined : parseFloat(yMinValueInput.value);
        const maxValue = yMaxValueInput.value.trim() === '' ? undefined : parseFloat(yMaxValueInput.value);
        
        // Validate values
        if (minValue !== undefined && isNaN(minValue)) {
            alert('Min value must be a number');
            return;
        }
        
        if (maxValue !== undefined && isNaN(maxValue)) {
            alert('Max value must be a number');
            return;
        }
        
        if (minValue !== undefined && maxValue !== undefined && minValue >= maxValue) {
            alert('Min value must be less than max value');
            return;
        }
        
        // Update chart scales
        if (!currentChart.options.scales.y) {
            currentChart.options.scales.y = {};
        }
        
        currentChart.options.scales.y.min = minValue;
        currentChart.options.scales.y.max = maxValue;
        
        // Update the chart
        currentChart.update();
    });
    
    // Reset Y-axis range to auto
    resetYAxisRangeBtn.addEventListener('click', function() {
        if (!currentChart) return;
        
        yMinValueInput.value = '';
        yMaxValueInput.value = '';
        
        if (currentChart.options.scales.y) {
            delete currentChart.options.scales.y.min;
            delete currentChart.options.scales.y.max;
        }
        
        currentChart.update();
    });
    
    // Share chart
    shareChartBtn.addEventListener('click', function() {
        if (!currentChart) return;
        
        // Create a temporary hidden textarea
        const textarea = document.createElement('textarea');
        textarea.style.position = 'fixed';
        textarea.style.left = '-999999px';
        
        // Create share text with chart info
        let shareText = 'Chart: ' + (chartTitleInput.value || 'Untitled Chart') + '\n\n';
        
        if (chartDescription.value) {
            shareText += chartDescription.value + '\n\n';
        }
        
        if (chartAdditionalInfo.value) {
            shareText += chartAdditionalInfo.value + '\n\n';
        }
        
        shareText += 'Generated with ChartFlask Analytics Tool';
        
        // Copy to clipboard
        textarea.value = shareText;
        document.body.appendChild(textarea);
        textarea.select();
        
        try {
            document.execCommand('copy');
            alert('Chart information copied to clipboard!');
        } catch (err) {
            console.error('Failed to copy: ', err);
            alert('Failed to copy chart information');
        }
        
        document.body.removeChild(textarea);
    });
    
    // Download chart with additional info
    downloadChartWithInfoBtn.addEventListener('click', function() {
        if (!currentChart) return;
        
        // First, render the current chart to an image
        const chartImage = chartCanvas.toDataURL('image/png');
        
        // Create HTML content with chart info
        const description = chartDescription.value || '';
        const additionalInfo = chartAdditionalInfo.value || '';
        const chartTitle = chartTitleInput.value || 'Untitled Chart';
        
        const html = `<!DOCTYPE html>
<html>
<head>
    <title>${chartTitle}</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
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
        }
        .chart-title {
            text-align: center;
            font-size: 20px;
            font-weight: bold;
            margin-bottom: 20px;
            color: #2c3e50;
        }
        .chart-image {
            width: 100%;
            max-width: 100%;
            height: auto;
            border-radius: 4px;
            margin-bottom: 30px;
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
        .chart-footer {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: 30px;
            padding-top: 15px;
            border-top: 1px solid #e9ecef;
            font-size: 12px;
            color: #6c757d;
        }
        .chart-credit {
            display: flex;
            align-items: center;
        }
        .chart-credit img {
            width: 70px;
            height: auto;
            margin-right: 8px;
        }
    </style>
    <link href="https://fonts.googleapis.com/css?family=Lato" rel="stylesheet">
</head>
<body>
    <div class="chart-container">
        <div class="chart-title">${chartTitle}</div>
        <img class="chart-image" src="${chartImage}" alt="${chartTitle}">
        <div class="chart-description">${description}</div>
        <div class="chart-additional-info">${additionalInfo}</div>
        <div class="chart-footer">
            <div class="chart-credit">
                <img src="logo.png" alt="Logo">
                <span>Generated with ChartFlask Analytics Tool</span>
            </div>
            <div class="chart-date"> 
                <button id="downloadChartWithInfoBtn" class="icon-btn" title="Download Chart with Info">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                </button>
            </div>
        </div>
    </div>
</body>
</html>`;
        
        // Create download link
        const blob = new Blob([html], { type: 'text/html' });
        const link = document.createElement('a');
        link.download = chartTitle.replace(/\s+/g, '_') + '_with_info.html';
        link.href = URL.createObjectURL(blob);
        link.click();
    });
});