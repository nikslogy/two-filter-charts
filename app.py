from flask import Flask, render_template, request, jsonify, send_file
import pandas as pd
import io
import os
import json
import numpy as np
from werkzeug.utils import secure_filename

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16 MB max upload
app.config['ALLOWED_EXTENSIONS'] = {'xlsx', 'xls'}

# Create uploads folder if it doesn't exist
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Custom JSON encoder to handle NumPy data types
class CustomJSONEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, np.integer):
            return int(obj)
        if isinstance(obj, np.floating):
            # Handle NaN
            return None if np.isnan(obj) else float(obj)
        if isinstance(obj, np.ndarray):
            return obj.tolist()
        if pd.isna(obj):
            return None
        return super().default(obj)

# Configure Flask to use the custom JSON encoder
app.json_encoder = CustomJSONEncoder

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in app.config['ALLOWED_EXTENSIONS']

# Function to replace NaN and NumPy types with native Python types in nested structures
def convert_to_serializable(obj):
    if isinstance(obj, dict):
        return {k: convert_to_serializable(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [convert_to_serializable(item) for item in obj]
    elif isinstance(obj, (np.integer, np.int64, np.int32, np.int16, np.int8)):
        return int(obj)
    elif isinstance(obj, (np.floating, np.float64, np.float32, np.float16)):
        return None if np.isnan(obj) else float(obj)
    elif isinstance(obj, np.ndarray):
        return obj.tolist()
    elif isinstance(obj, (pd.Timestamp, pd._libs.tslibs.timestamps.Timestamp)):
        return obj.isoformat()
    elif pd and pd.isna(obj):  # Check if it's a pandas NA value
        return None
    else:
        return obj

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'excelFile' not in request.files:
        return jsonify({'success': False, 'error': 'No file part'})
    
    file = request.files['excelFile']
    if file.filename == '':
        return jsonify({'success': False, 'error': 'No file selected'})
    
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        try:
            # Get all sheet names (without loading data)
            xls = pd.ExcelFile(filepath)  # Just reads metadata
            sheet_names = xls.sheet_names
            
            return jsonify({
                'success': True, 
                'filename': filename,
                'sheets': sheet_names
            })
        except Exception as e:
            return jsonify({'success': False, 'error': str(e)})
    
    return jsonify({'success': False, 'error': 'Invalid file type'})

@app.route('/get_sheet_data', methods=['POST'])
def get_sheet_data():
    data = request.json
    filename = data.get('filename')
    sheet_name = data.get('sheet')
    
    if not filename or not sheet_name:
        return jsonify({'success': False, 'error': 'Missing filename or sheet name'})
    
    filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    if not os.path.exists(filepath):
        return jsonify({'success': False, 'error': 'File not found'})
    
    try:
        # Read the sheet data with pandas
        df = pd.read_excel(filepath, sheet_name=sheet_name, keep_default_na=True)
        
        # Get column names
        columns = df.columns.tolist()
        
        # Convert data to a list of dictionaries for easier processing in JavaScript
        data = df.to_dict('records')
        
        # Convert all data to be JSON serializable
        data = convert_to_serializable(data)
        
        # Print for debugging
        print(f"First row of data (after serialization): {data[0] if data else 'No data'}")
        
        return jsonify({
            'success': True,
            'columns': columns,
            'data': data,
            'rowCount': len(data)
        })
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)})

@app.route('/generate_chart', methods=['POST'])
def generate_chart():
    data = request.json
    filename = data.get('filename')
    sheet_name = data.get('sheet')
    x_axis = data.get('xAxis')
    y_axes = data.get('yAxes', [])
    chart_type = data.get('chartType')
    filter_column = data.get('filterColumn')
    filter_value = data.get('filterValue')
    chart_filter_column = data.get('chartFilterColumn')
    chart_filter_column2 = data.get('chartFilterColumn2')
    start_row = data.get('startRow', 0)
    end_row = data.get('endRow')
    
    if not filename or not sheet_name or not x_axis or not y_axes or not chart_type:
        return jsonify({
            'success': False, 
            'error': 'Missing required parameters'
        })
    
    filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    if not os.path.exists(filepath):
        return jsonify({'success': False, 'error': 'File not found'})
    
    try:
        # Read the data
        df = pd.read_excel(filepath, sheet_name=sheet_name, keep_default_na=True)
        
        # Apply row range filter
        if start_row > 0:
            start_row = start_row - 2  # Adjust for Excel row numbering
            if start_row < 0:
                start_row = 0
        
        if end_row:
            end_row = end_row - 1
            df = df.iloc[start_row:end_row]
        else:
            df = df.iloc[start_row:]
        
        # Apply column filter if specified
        if filter_column and filter_value:
            df = df[df[filter_column] == filter_value]
        
        # Process data for chart
        chart_data = process_chart_data(df, x_axis, y_axes, chart_type)
        
        # Convert all data to be JSON serializable
        chart_data = convert_to_serializable(chart_data)
        
        # Prepare chart filter values
        chart_filter_values = []
        if chart_filter_column:
            chart_filter_values = df[chart_filter_column].dropna().unique().tolist()
            # Convert to serializable
            chart_filter_values = convert_to_serializable(chart_filter_values)
        
        # Prepare second chart filter values if specified
        chart_filter_values2 = []
        if chart_filter_column2:
            chart_filter_values2 = df[chart_filter_column2].dropna().unique().tolist()
            # Convert to serializable
            chart_filter_values2 = convert_to_serializable(chart_filter_values2)
        
        # Test JSON serialization to catch any issues
        try:
            test_json = json.dumps({
                'chartData': chart_data,
                'chartType': chart_type,
                'chartFilterValues': chart_filter_values,
                'chartFilterValues2': chart_filter_values2
            }, cls=CustomJSONEncoder)
            print(f"JSON serialization test successful, size: {len(test_json)}")
        except Exception as e:
            print(f"JSON serialization test failed: {str(e)}")
            # If serialization fails, we'll try to find and fix the issue
            import traceback
            traceback.print_exc()
            # Last resort fix: manually convert everything to strings
            if 'is not JSON serializable' in str(e):
                print("Attempting last resort fix...")
                chart_data = force_json_serializable(chart_data)
                chart_filter_values = force_json_serializable(chart_filter_values)
                chart_filter_values2 = force_json_serializable(chart_filter_values2)
        
        return jsonify({
            'success': True,
            'chartData': chart_data,
            'chartType': chart_type,
            'chartFilterValues': chart_filter_values,
            'chartFilterValues2': chart_filter_values2
        })
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)})

# Last resort function to force JSON serialization by converting all values to strings
def force_json_serializable(obj):
    if isinstance(obj, dict):
        return {k: force_json_serializable(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [force_json_serializable(item) for item in obj]
    elif obj is None:
        return None
    elif isinstance(obj, (int, float, str, bool)):
        return obj
    else:
        # Convert any other type to string
        try:
            return str(obj)
        except:
            return "Non-serializable value"

# Helper function to generate colors for pie/doughnut charts
def generate_colors(count):
    # Use a predefined color palette for better visual appeal
    color_palette = [
        '#1a4570', '#ee8939', '#f5b843', '#8b3834', '#e0ba3f',
        '#e6e770', '#4d83c5', '#d3a037', '#779c51', '#b2d571'
    ]
    
    colors = []
    for i in range(count):
        colors.append(color_palette[i % len(color_palette)])
    return colors

# Helper function to calculate percentage data for stacked bar charts
def calculate_percentage_data(datasets, labels, visible_indices=None):
    # For each label/category, calculate the sum of all dataset values
    totals = [0] * len(labels)
    
    # If visible_indices is not provided, use all datasets
    if visible_indices is None:
        visible_indices = list(range(len(datasets)))
    
    # Sum only the visible datasets
    for idx in visible_indices:
        if idx < len(datasets):
            dataset = datasets[idx]
            for i, value in enumerate(dataset['data']):
                if i < len(totals):  # Ensure we don't go out of bounds
                    totals[i] += abs(float(value)) if value is not None else 0
    
    # Convert each dataset value to a percentage of the total
    percentage_datasets = []
    for idx, dataset in enumerate(datasets):
        percentage_data = []
        
        # Only process visible datasets for the result
        if idx in visible_indices:
            for i, value in enumerate(dataset['data']):
                if i < len(totals) and totals[i] > 0:
                    val = abs(float(value)) if value is not None else 0
                    percentage_data.append((val / totals[i]) * 100)
                else:
                    percentage_data.append(0)
            
            percentage_dataset = dataset.copy()
            percentage_dataset['data'] = percentage_data
            percentage_datasets.append(percentage_dataset)
        else:
            # For hidden datasets, include them with zeros
            percentage_dataset = dataset.copy()
            percentage_dataset['data'] = [0] * len(dataset['data'])
            percentage_datasets.append(percentage_dataset)
    
    return percentage_datasets

@app.route('/apply_chart_filter', methods=['POST'])
def apply_chart_filter():
    data = request.json
    filename = data.get('filename')
    sheet_name = data.get('sheet')
    x_axis = data.get('xAxis')
    y_axes = data.get('yAxes', [])
    chart_type = data.get('chartType')
    filter_column = data.get('filterColumn')
    filter_value = data.get('filterValue')
    chart_filter_column = data.get('chartFilterColumn')
    chart_filter_value = data.get('chartFilterValue')
    chart_filter_column2 = data.get('chartFilterColumn2')
    chart_filter_value2 = data.get('chartFilterValue2')
    start_row = data.get('startRow', 0)
    end_row = data.get('endRow')
    
    # New parameter to identify parent-child relationship for hierarchical filters
    district_column = data.get('districtColumn')  # Column name for districts
    taluka_column = data.get('talukaColumn')      # Column name for talukas
    
    if not filename or not sheet_name:
        return jsonify({
            'success': False, 
            'error': 'Missing required parameters'
        })
    
    filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    if not os.path.exists(filepath):
        return jsonify({'success': False, 'error': 'File not found'})
    
    try:
        # Read the sheet data with pandas
        df = pd.read_excel(filepath, sheet_name=sheet_name, keep_default_na=True)
        
        # Apply row range filter
        if start_row > 0:
            start_row = start_row - 2
            if start_row < 0:
                start_row = 0
        
        if end_row:
            end_row = end_row - 1
            df = df.iloc[start_row:end_row]
        else:
            df = df.iloc[start_row:]
        
        # Apply main filter if specified
        if filter_column and filter_value:
            df = df[df[filter_column] == filter_value]
            
        # Apply chart filter if specified
        if chart_filter_column and chart_filter_value:
            df = df[df[chart_filter_column] == chart_filter_value]
        
        # Apply second chart filter if specified
        if chart_filter_column2 and chart_filter_value2:
            df = df[df[chart_filter_column2] == chart_filter_value2]
        
        # Process data for chart
        chart_data = process_chart_data(df, x_axis, y_axes, chart_type)
        
        # Include parent-child hierarchy information if hierarchical fields are specified
        hierarchy_info = None
        if district_column and taluka_column and chart_filter_column == taluka_column:
            # Get the parent district for this taluka (if available)
            if chart_filter_value and not df.empty:
                matching_rows = df[df[taluka_column] == chart_filter_value]
                if not matching_rows.empty and district_column in matching_rows.columns:
                    parent_districts = matching_rows[district_column].unique().tolist()
                    if parent_districts:
                        hierarchy_info = {
                            'parentColumn': district_column,
                            'childColumn': taluka_column,
                            'parentValues': parent_districts,
                            'childValue': chart_filter_value
                        }
        
        # Convert all data to be JSON serializable
        chart_data = convert_to_serializable(chart_data)
        
        # Add information about visible datasets
        visible_indices = data.get('visibleDatasets')
        
        # For percentage stacked bar, ensure we always show 100%
        if chart_type == 'percentStackedBar' and chart_data and 'datasets' in chart_data:
            # If we have information about which datasets are visible, use it
            if visible_indices is not None:
                chart_data['datasets'] = calculate_percentage_data(
                    chart_data['datasets'], 
                    chart_data['labels'],
                    visible_indices
                )
            else:
                # Otherwise recalculate with all datasets
                chart_data['datasets'] = calculate_percentage_data(
                    chart_data['datasets'], 
                    chart_data['labels']
                )
        
        return jsonify({
            'success': True,
            'chartData': chart_data,
            'filteredRowCount': len(df),
            'hierarchyInfo': hierarchy_info  # Include hierarchy info in response
        })
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)})

# Helper function to process chart data
def process_chart_data(df, x_axis, y_axes, chart_type):
    if chart_type in ['line', 'bar', 'stackedBar', 'percentStackedBar']:
        if df.empty:
            return {'labels': [], 'datasets': []}
            
        # Get the unique x-axis values and sort them
        x_values = sorted(df[x_axis].dropna().unique().tolist())
        
        chart_data = {
            'labels': x_values,
            'datasets': []
        }
        
        for i, y_axis_info in enumerate(y_axes):
            y_axis = y_axis_info.get('column')
            color = y_axis_info.get('color', f'rgba(26, 19, 142, {0.8 if i == 0 else 0.6})')
            
            # Create a new dataframe for this dataset
            y_data = []
            
            for x_val in x_values:
                # Get rows matching this x value
                matching_rows = df[df[x_axis] == x_val]
                
                # Check if we have data for this point
                if matching_rows.empty or matching_rows[y_axis].isna().all():
                    # No data or all NaN values
                    y_data.append(None)  # Use None for missing data
                else:
                    # Check if the values are numeric
                    try:
                        # Convert to numeric, coerce errors to NaN
                        numeric_series = pd.to_numeric(matching_rows[y_axis], errors='coerce')
                        # Sum only numeric values
                        value = numeric_series.sum(skipna=True)
                        # Check if the result is NaN (all values were non-numeric)
                        if pd.isna(value):
                            y_data.append(None)
                        else:
                            # Convert NumPy types to Python native types
                            if isinstance(value, (np.integer, np.floating)):
                                value = float(value) if isinstance(value, np.floating) else int(value)
                                # Check for NaN
                                if np.isnan(value):
                                    value = None
                            y_data.append(value)
                    except Exception as e:
                        print(f"Error processing value for {y_axis} at {x_val}: {str(e)}")
                        y_data.append(None)  # Use None for error cases
            
            # Create dataset with common properties for both line and bar charts
            dataset = {
                'label': y_axis,
                'data': y_data,
                'backgroundColor': color,
                'borderColor': color,
                'borderWidth': 1
            }
            
            # Add chart-specific properties
            if chart_type == 'line':
                dataset.update({
                    'fill': False,
                    'tension': 0,
                    'pointRadius': 0,
                    'pointHoverRadius': 3,
                    'spanGaps': False  # Don't connect points across null values
                })
            elif chart_type == 'bar':
                dataset.update({
                    'barPercentage': 0.8,
                    'categoryPercentage': 0.8
                })
            elif chart_type in ['stackedBar', 'percentStackedBar']:
                dataset.update({
                    'barPercentage': 0.9,
                    'categoryPercentage': 0.8
                })
            
            chart_data['datasets'].append(dataset)
        
        # For percent stacked bar, convert to percentages
        if chart_type == 'percentStackedBar':
            chart_data['datasets'] = calculate_percentage_data(
                chart_data['datasets'], 
                chart_data['labels']
            )
        
        # Make sure all values are JSON serializable 
        chart_data = convert_to_serializable(chart_data)
        
        # Print for debugging
        print(f"Processing {chart_type} chart data")
        if chart_data and 'datasets' in chart_data and len(chart_data['datasets']) > 0:
            first_dataset = chart_data['datasets'][0]
            print(f"Dataset label: {first_dataset.get('label')}")
            print(f"First 5 data points: {first_dataset.get('data', [])[0:5]}")
        
        return chart_data
    else:
        # Unsupported chart type
        print(f"Unsupported chart type: {chart_type}")
        return {'labels': [], 'datasets': []}

@app.route('/download_chart_code', methods=['POST'])
def download_chart_code():
    data = request.json
    chart_type = data.get('chartType')
    chart_data = data.get('chartData')
    
    if not chart_type or not chart_data:
        return jsonify({'success': False, 'error': 'Missing chart data'})
    
    return jsonify({'success': False, 'error': str('')})

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)