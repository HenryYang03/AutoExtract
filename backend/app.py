from flask import Flask, request, jsonify, send_from_directory
from werkzeug.utils import secure_filename
import os
import cv2
from bar_graph_analyzer import BarGraphAnalyzer

app = Flask(__name__)
app.secret_key = "b'\xca\xa4\xf2\x80!\xfe\x85\xba\xd7\xcf\xe7\xc9\xf1)I\xac\x10Y5M\x95\xed\xfb\xc4'"
app.config['UPLOAD_FOLDER'] = 'static/uploads/'

model_path = 'models/best.pt'
class_names = ['label', 'ymax', 'origin', 'yaxis', 'bar', 'uptail', 'legend', 'legend_group', 'xaxis', 'x_group']
analyzer = BarGraphAnalyzer(model_path, class_names, pytesseract_cmd='tesseract')

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in {'png', 'jpg', 'jpeg'}

def clear_upload_folder():
    for filename in os.listdir(app.config['UPLOAD_FOLDER']):
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
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

    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        clear_upload_folder()
        file.save(filepath)

        try:
            analyzer.detect_box(filepath)
            detection_boxes = analyzer.detections
            image_shape = list(analyzer.image.shape[:2])
            return jsonify({
                'filename': filename,
                'detection_boxes': detection_boxes,
                'image_shape': image_shape,
                'image_url': f'/static/uploads/{filename}'
            })
        except ValueError as e:
            return jsonify({'error': str(e)}), 400

    return jsonify({'error': 'Invalid file type'}), 400

@app.route('/static/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=9000, debug=True)
