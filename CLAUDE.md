# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a YARA rule generator web application built with Python Flask. It provides a modern graphical interface for security researchers and malware analysts to quickly create YARA rules for malware detection and file identification.

## Key Features

- 🎨 **Modern UI/UX** - Responsive design with dark/light theme support
- ✍️ **Manual Rule Creation** - Full-featured manual rule creation with text, hex, and regex string support
- 📁 **File Analysis** - Automatic file analysis with string suggestions
- 📋 **Rule Templates** - Predefined templates for common malware types
- 📚 **Rule History** - Save and manage previously created rules
- 🧪 **Rule Validation** - Real-time YARA rule syntax validation
- 📥 **Export Options** - Copy, download, and save rules
- 🏷️ **Tag Support** - Custom tags for rule organization
- 📊 **Progress Indicators** - Visual feedback during file analysis
- 📋 **Condition Presets** - Common condition expression templates

## Project Structure

```
yara规则生成器/
├── app.py              # Flask application main file
├── requirements.txt    # Dependencies list
├── README.md           # Documentation
├── CLAUDE.md           # This file
├── data/               # Data directory for history storage
├── templates/
│   └── index.html      # Main page template
└── static/
    ├── style.css       # Stylesheet with modern design
    └── script.js       # Client-side JavaScript with enhanced functionality
```

## Development Commands

### Install Dependencies
```bash
pip install -r requirements.txt
```

### Run Application
```bash
python app.py
```
Then access `http://127.0.0.1:5000` in your browser.

## Code Architecture

### Backend (app.py)
- Flask web application with REST API endpoints
- `/generate_rule` - Generates YARA rules from form data
- `/analyze_file` - Analyzes uploaded files and suggests strings
- `/download_rule` - Handles rule download requests
- `/validate_rule` - Validates YARA rule syntax
- `/get_template/<type>` - Returns predefined rule templates
- `/save_rule` - Saves rules to history
- `/get_history` - Retrieves rule history
- `/clear_history` - Clears rule history
- `/search_history` - Searches rule history
- File analysis functions for different file types (text, binary, executables)
- YARA rule construction and validation logic

### Frontend (templates/index.html, static/)
- Tab-based interface (Manual Creation / File Analysis / Templates / History)
- Modern CSS design with responsive layout and theme support
- Enhanced JavaScript functionality with:
  - Form validation and real-time feedback
  - Drag-and-drop file upload with progress indicators
  - Template usage and history management
  - Rule validation and saving
  - Dynamic form handling and string management
  - Condition presets and bulk operations

## API Endpoints

- `POST /generate_rule` - Generate YARA rule from form data
- `POST /analyze_file` - Analyze uploaded file and suggest strings
- `POST /download_rule` - Download generated YARA rule
- `POST /validate_rule` - Validate YARA rule syntax
- `GET /get_template/<type>` - Get predefined rule template
- `POST /save_rule` - Save rule to history
- `GET /get_history` - Get rule history
- `POST /clear_history` - Clear rule history
- `POST /search_history` - Search rule history

## Common Development Tasks

1. **Adding new file type detection** - Extend the `detect_file_type()` function in app.py
2. **Improving string extraction** - Modify functions like `extract_string_constants()`, `extract_ascii_strings()` in app.py
3. **Adding new UI features** - Update HTML templates and corresponding JavaScript in static/
4. **Modifying YARA rule generation** - Update the `build_yara_rule()` function in app.py
5. **Adding new rule templates** - Extend the templates dictionary in the `get_template()` function in app.py
6. **Enhancing file analysis** - Add new analysis functions for specific file types
7. **Improving UI/UX** - Update CSS styles and JavaScript interactions in static/