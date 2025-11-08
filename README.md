# YARA Rule Generator - Modern Web Application

A comprehensive YARA rule generator web application that provides security researchers and malware analysts with a modern graphical interface for quickly creating and testing YARA rules.

## 🌟 Features

### Core Functions
- **🎨 Modern UI/UX** - Responsive design with dark/light theme support
- **✍️ Manual Rule Creation** - Complete form interface supporting text, hex, and regex strings
- **📁 File Analysis** - Automatic file analysis with intelligent string extraction
- **🔍 Online File Scanning** - Real-time file scanning using YARA rules
- **📝 Rule Editor** - Free-form YARA rule writing with syntax validation and formatting
- **📋 Rule Templates** - Predefined templates (PE, ELF, PDF, Office documents)
- **📚 Rule History** - Save and manage created rule history
- **🧪 Rule Validation** - Real-time syntax checking and error prompts
- **📥 Export Functions** - Support for copying, downloading, and saving rules

### Technical Features
- Pure frontend implementation, no complex configuration required
- Drag-and-drop file upload support
- Real-time progress display
- Mobile-friendly responsive design
- Local file storage, no database needed

## 🚀 Quick Start

### Requirements
- Python 3.6+
- Flask

### Installation Steps

1. **Clone Repository**
```bash
git clone https://github.com/MEMZ-SYSTEM-CORE/yara-rule-generator.git
cd yara-rule-generator
```

2. **Install Dependencies**
```bash
pip install -r requirements.txt
```

3. **Run Application**
```bash
python app.py
```

4. **Access Application**
Open browser and visit `http://127.0.0.1:5000`

## 📖 Usage Guide

### 1. Manual Rule Creation
- Click "Manual Creation" tab
- Fill in rule basic information (name, description, author, etc.)
- Add string definitions (support text, hex, regex)
- Set condition expressions
- Click "Generate Rule" button

### 2. File Analysis
- Click "File Analysis" tab
- Drag or select file to analyze
- View system-extracted string suggestions
- Select needed strings to generate rules

### 3. Rule Editor
- Click "Rule Editor" tab
- Write YARA rules directly in text box
- Use toolbar for formatting, validation, etc.
- Save rules to history

### 4. Online Scanning
- Click "File Scanner" tab
- Select file to scan
- Choose YARA rule to use
- Click "Start Scan" to view results

### 5. Using Templates
- Click "Rule Templates" tab
- Choose appropriate template type
- Modify generated rule as needed

## 🛠️ Project Structure

```
yara-rule-generator/
├── app.py              # Flask application main file
├── requirements.txt    # Dependencies list
├── README.md          # Documentation
├── CLAUDE.md          # Claude development guide
├── data/              # Data directory
│   └── rules_history.json  # Rules history storage
├── templates/         # HTML templates
│   └── index.html     # Main page template
└── static/           # Static resources
    ├── style.css     # Stylesheet
    └── script.js     # JavaScript functionality
```

## 🔧 Tech Stack

### Backend
- **Python Flask** - Web framework
- **JSON** - Data storage
- **Hashlib** - File hash calculation

### Frontend
- **HTML5/CSS3** - Page structure and styling
- **JavaScript (ES6+)** - Interactive functionality
- **Font Awesome** - Icon library
- **Google Fonts** - Typography optimization

### Design Features
- **Responsive Design** - Adapts to various screen sizes
- **CSS Variables** - Theme switching support
- **Modern UI** - Card-based layout, gradient backgrounds
- **User-Friendly** - Intuitive operation flow

## 🎯 Use Cases

- **Malware Analysis** - Create detection rules
- **Threat Hunting** - Build scanning rules
- **Security Research** - Analyze file characteristics
- **Education** - Learn YARA syntax
- **Enterprise Security** - Internal threat detection

## 🔍 YARA Rule Examples

### PE File Detection
```yara
rule pe_detection {
    meta:
        description = "Detect PE executable files"
        author = "Security Analyst"

    strings:
        $mz = "MZ"
        $pe = "PE\0\0"

    condition:
        $mz at 0 and $pe at 0x3c
}
```

### Malicious PDF Detection
```yara
rule malicious_pdf {
    meta:
        description = "Detect potentially malicious PDF files"
        author = "Security Team"

    strings:
        $pdf = "%PDF-"
        $js = "/JavaScript"
        $open = "/OpenAction"

    condition:
        $pdf at 0 and ($js or $open)
}
```

## 🚀 Future Plans

- [ ] Integrate real YARA engine
- [ ] Support more file types
- [ ] Rule performance optimization suggestions
- [ ] Batch file scanning
- [ ] Rule sharing functionality
- [ ] Advanced syntax highlighting
- [ ] Code auto-completion
- [ ] Multi-language support

## 🤝 Contributing

Welcome to submit Issues and Pull Requests to improve this project!

### Development Setup
```bash
# Clone project
git clone https://github.com/MEMZ-SYSTEM-CORE/yara-rule-generator.git

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Linux/Mac
# venv\Scripts\activate  # Windows

# Install dependencies
pip install -r requirements.txt

# Run development server
python app.py
```

## 📄 License

This project uses MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [YARA](https://virustotal.github.io/yara/) - Excellent pattern matching engine
- [Flask](https://flask.palletsprojects.com/) - Lightweight web framework
- [Font Awesome](https://fontawesome.com/) - Beautiful icon library

## 📞 Contact

For questions or suggestions, please contact via:
- Submit GitHub Issue
- Send email to [your-email]

---

**⭐ If this project helps you, please give it a star!**