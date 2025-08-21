from flask import Flask, request, jsonify, send_from_directory
from werkzeug.utils import secure_filename
import os
import cv2
from bar_graph_analyzer import BarGraphAnalyzer

app = Flask(__name__)
app.secret_key = "b'\xca\xa4\xf2\x80!\xfe\x85\xba\xd7\xcf\xe7\xc9\xf1)I\xac\x10Y5M\x95\xed\xfb\xc4'"

# Resolve paths relative to this file
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_DIR = os.path.join(BASE_DIR, 'static', 'uploads')
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_DIR

# Resolve model path relative to this file
model_path = os.path.join(BASE_DIR, 'models', 'best.pt')
class_names = ['label', 'ymax', 'origin', 'yaxis', 'bar', 'uptail', 'legend', 'legend_group', 'xaxis', 'x_group']
analyzer = BarGraphAnalyzer(model_path, class_names, pytesseract_cmd='tesseract')

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in {'png', 'jpg', 'jpeg'}

def clear_upload_folder():
    upload_dir = app.config['UPLOAD_FOLDER']
    if not os.path.isdir(upload_dir):
        os.makedirs(upload_dir, exist_ok=True)
        return
    for filename in os.listdir(upload_dir):
        file_path = os.path.join(upload_dir, filename)
        try:
            if os.path.isfile(file_path) or os.path.islink(file_path):
                os.unlink(file_path)
        except Exception as e:
            print(f'Failed to delete {file_path}. Reason: {e}')

@app.route('/api/bar_analyzer', methods=['POST'])
def api_bar_analyzer():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    # Ensure a concrete string for type checkers
    filename_raw = (file.filename or "")

    if file and allowed_file(filename_raw):
        filename = secure_filename(filename_raw)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        clear_upload_folder()
        file.save(filepath)

        try:
            analyzer.detect_box(filepath)
            detection_boxes = analyzer.detections
            img = analyzer.image
            if img is None:
                return jsonify({'error': 'Failed to process image'}), 400
            image_shape = list(img.shape[:2])
            return jsonify({
                'filename': filename,
                'detection_boxes': detection_boxes,
                'image_shape': image_shape,
                'image_url': f'/static/uploads/{filename}',
                'origin_value': analyzer.origin_value,
                'ymax_value': analyzer.ymax_value
            })
        except ValueError as e:
            return jsonify({'error': str(e)}), 400

    return jsonify({'error': 'Invalid file type'}), 400

@app.route('/api/update_values', methods=['POST'])
def api_update_values():
    try:
        data = request.get_json()
        origin_value = data.get('origin_value')
        ymax_value = data.get('ymax_value')
        
        if origin_value is not None:
            analyzer.origin_value = origin_value
        if ymax_value is not None:
            analyzer.ymax_value = ymax_value
            
        return jsonify({
            'success': True,
            'origin_value': analyzer.origin_value,
            'ymax_value': analyzer.ymax_value
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/static/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=9000, debug=True)
