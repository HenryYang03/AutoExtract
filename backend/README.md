# AutoExtract Backend

A clean, modular Flask backend for automatic data extraction from graphs and charts using deep learning models.

## 🏗️ Architecture

The backend is organized into modular components for better maintainability and scalability:

```
backend/
├── app.py              # Main application entry point
├── config.py           # Configuration settings and constants
├── model_manager.py    # Model management and initialization
├── routes.py           # API route handlers
├── file_utils.py       # Utility functions and helpers
├── bar_graph_analyzer.py  # Core analysis logic (existing)
├── models/             # ML model weights
├── static/uploads/     # File upload directory
└── requirements.txt    # Python dependencies
```

## 🚀 Quick Start

1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Run the application:**
   ```bash
   python app.py
   ```

3. **Access the API:**
   - Server runs on `http://localhost:9000`
   - API endpoints available at `/api/*`

## 📁 Module Overview

### `app.py` - Main Application
- **Purpose**: Application factory and server startup
- **Key Functions**:
  - `create_app()`: Creates and configures Flask app
  - `register_routes()`: Registers all API endpoints
  - `register_error_handlers()`: Sets up error handling
  - `main()`: Entry point with model validation

### `config.py` - Configuration
- **Purpose**: Centralized configuration management
- **Contains**:
  - File paths and directories
  - Model parameters
  - Flask settings
  - Allowed file extensions

### `model_manager.py` - Model Management
- **Purpose**: Manages BarGraphAnalyzer instance
- **Key Features**:
  - Automatic model initialization
  - Error handling for model loading
  - Global access to analyzer instance

### `routes.py` - API Endpoints
- **Purpose**: Handles all HTTP requests
- **Endpoints**:
  - `POST /api/bar_analyzer`: Process graph images
  - `POST /api/update_values`: Update origin/ymax values
  - `GET /static/uploads/<filename>`: Serve uploaded files

### `file_utils.py` - Utility Functions
- **Purpose**: Common helper functions
- **Functions**:
  - File validation and security
  - Directory management
  - Error handling utilities

## 🔌 API Endpoints

### POST `/api/bar_analyzer`
Process uploaded images for graph analysis.

**Request:**
- `Content-Type: multipart/form-data`
- `file`: Image file (PNG, JPG, JPEG)

**Response:**
```json
{
  "filename": "image.png",
  "detection_boxes": [...],
  "image_shape": [height, width],
  "image_url": "/static/uploads/image.png",
  "origin_value": 0,
  "ymax_value": 25
}
```

### POST `/api/update_values`
Update origin and ymax values for calculations.

**Request:**
```json
{
  "origin_value": 0,
  "ymax_value": 25
}
```

**Response:**
```json
{
  "success": true,
  "origin_value": 0,
  "ymax_value": 25
}
```

## 🛠️ Development

### Adding New Routes
1. Add handler function to `routes.py`
2. Register route in `app.py` → `register_routes()`
3. Add proper error handling and documentation

### Adding New Models
1. Create model class in `models.py`
2. Add initialization logic to `ModelManager`
3. Update configuration in `config.py`

### Configuration Changes
- Modify `config.py` for new settings
- Use environment variables for sensitive data
- Update documentation for new options

## 🔒 Security Features

- **File Validation**: Only allows image files (PNG, JPG, JPEG)
- **Secure Filenames**: Uses `secure_filename()` for uploads
- **Input Validation**: Validates all API inputs
- **Error Handling**: Comprehensive error handling without information leakage

## 📊 Error Handling

The application includes comprehensive error handling:

- **400 Bad Request**: Invalid input or file format
- **404 Not Found**: Resource not found
- **500 Internal Server Error**: Server-side processing errors
- **Custom Error Messages**: User-friendly error descriptions

## 🧪 Testing

To test the API endpoints:

```bash
# Test file upload
curl -X POST -F "file=@test_image.png" http://localhost:9000/api/bar_analyzer

# Test value update
curl -X POST -H "Content-Type: application/json" \
  -d '{"origin_value": 0, "ymax_value": 25}' \
  http://localhost:9000/api/update_values
```

## 🔧 Troubleshooting

### Common Issues

1. **Model Loading Failed**
   - Check if `models/best.pt` exists
   - Verify tesseract installation
   - Check console for initialization errors

2. **File Upload Errors**
   - Verify file format (PNG, JPG, JPEG)
   - Check upload directory permissions
   - Ensure sufficient disk space

3. **API Errors**
   - Check server logs for detailed errors
   - Verify request format and content
   - Check if model is properly initialized

## 📈 Future Enhancements

- **Authentication**: Add user authentication and authorization
- **Rate Limiting**: Implement API rate limiting
- **Caching**: Add response caching for better performance
- **Logging**: Structured logging with different levels
- **Monitoring**: Health checks and metrics collection
- **Testing**: Unit and integration test suite

## 🤝 Contributing

1. Follow the modular structure
2. Add comprehensive docstrings
3. Include error handling
4. Update documentation
5. Test thoroughly before submitting

## 📄 License

This project is part of AutoExtract. See the main repository for license information. 