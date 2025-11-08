from flask import Flask, render_template, request, jsonify, send_file, Response
import re
import os
import hashlib
import json
from io import BytesIO
from datetime import datetime

app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 限制上传文件大小为16MB

# 确保数据目录存在
DATA_DIR = os.path.join(os.path.dirname(__file__), 'data')
if not os.path.exists(DATA_DIR):
    os.makedirs(DATA_DIR)

# 首页路由
@app.route('/')
def index():
    return render_template('index.html')

# 生成YARA规则的API端点
@app.route('/generate_rule', methods=['POST'])
def generate_rule():
    try:
        data = request.get_json()

        # 获取表单数据
        rule_name = data.get('rule_name', '').strip()
        rule_description = data.get('rule_description', '').strip()
        rule_author = data.get('rule_author', '').strip()
        strings_section = data.get('strings', [])
        conditions = data.get('conditions', '').strip()
        tags = data.get('tags', [])

        # 验证必填字段
        if not rule_name:
            return jsonify({'error': '规则名称不能为空'}), 400

        # 验证规则名称格式
        if not re.match(r'^[a-zA-Z_][a-zA-Z0-9_]*$', rule_name):
            return jsonify({'error': '规则名称格式不正确，只能包含字母、数字和下划线，且不能以数字开头'}), 400

        # 构建YARA规则
        yara_rule = build_yara_rule(rule_name, rule_description, rule_author, strings_section, conditions, tags)

        return jsonify({'rule': yara_rule})
    except Exception as e:
        return jsonify({'error': f'生成规则时出错: {str(e)}'}), 500

# 文件上传处理端点
@app.route('/analyze_file', methods=['POST'])
def analyze_file():
    try:
        if 'file' not in request.files:
            return jsonify({'error': '没有找到上传的文件'}), 400

        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': '请选择一个文件'}), 400

        if file:
            # 读取文件内容
            content = file.read()

            # 获取文件基本信息
            file_info = {
                'filename': file.filename,
                'size': len(content),
                'md5': hashlib.md5(content).hexdigest(),
                'sha1': hashlib.sha1(content).hexdigest(),
                'sha256': hashlib.sha256(content).hexdigest()
            }

            # 检测文件类型
            file_type = detect_file_type(content)
            file_info['type'] = file_type

            # 分析文件内容并生成建议字符串
            suggested_strings = analyze_file_content(content, file_type)

            return jsonify({
                'file_info': file_info,
                'suggested_strings': suggested_strings
            })

    except Exception as e:
        return jsonify({'error': f'分析文件时出错: {str(e)}'}), 500

def detect_file_type(content):
    """检测文件类型"""
    # 检查文件头
    if len(content) >= 4:
        header = content[:4]
        if header.startswith(b'MZ'):
            return 'PE executable (Windows)'
        elif header.startswith(b'\x7fELF'):
            return 'ELF executable (Linux/Unix)'
        elif header == b'\xca\xfe\xba\xbe' or header == b'\xbe\xba\xfe\xca':
            return 'Mach-O executable (macOS)'
        elif header.startswith(b'%PDF'):
            return 'PDF document'
        elif header.startswith(b'\xff\xd8\xff'):
            return 'JPEG image'
        elif header.startswith(b'\x89PNG'):
            return 'PNG image'
        elif header.startswith(b'RIFF') and len(content) >= 8 and content[8:12] == b'WEBP':
            return 'WebP image'
        elif header.startswith(b'PK\x03\x04'):
            return 'ZIP archive'

    # 检查是否为文本文件
    try:
        text_content = content.decode('utf-8')
        lines = text_content.split('\n')
        if any('python' in line.lower() for line in lines[:10]):
            return 'Python script'
        elif any('import' in line.lower() or 'public' in line.lower() or 'class' in line.lower() for line in lines[:10]):
            return 'Source code'
        else:
            return 'Text file'
    except UnicodeDecodeError:
        pass

    # 默认返回二进制文件
    return 'Binary file'

def analyze_file_content(content, file_type):
    """分析文件内容并生成建议字符串"""
    suggested_strings = []

    # 根据文件类型进行不同的分析
    if 'text' in file_type.lower() or 'script' in file_type.lower() or 'source' in file_type.lower():
        # 文本文件分析
        try:
            text_content = content.decode('utf-8')
            lines = text_content.split('\n')

            # 提取有意义的行
            meaningful_lines = [line.strip() for line in lines if line.strip() and not line.strip().startswith('#')][:20]

            # 提取可能的字符串常量
            string_constants = extract_string_constants(text_content)
            suggested_strings.extend(string_constants)

            # 提取函数名或类名
            identifiers = extract_identifiers(text_content)
            suggested_strings.extend(identifiers)

            # 提取文件路径或URL
            paths_urls = extract_paths_urls(text_content)
            suggested_strings.extend(paths_urls)

        except UnicodeDecodeError:
            # 如果解码失败，作为二进制文件处理
            file_type = 'Binary file'

    if 'binary' in file_type.lower() or 'executable' in file_type.lower():
        # 二进制文件分析
        # 提取文件头
        if len(content) >= 16:
            hex_header = content[:16].hex(' ').upper()
            suggested_strings.append({
                'name': '$header',
                'value': hex_header,
                'type': 'hex'
            })

        # 提取ASCII字符串（长度大于4的可打印字符序列）
        ascii_strings = extract_ascii_strings(content)
        suggested_strings.extend(ascii_strings)

        # 提取常见文件签名
        file_signatures = extract_file_signatures(content)
        suggested_strings.extend(file_signatures)

    # 如果没有提取到任何字符串，则使用基本方法
    if not suggested_strings:
        try:
            text_content = content.decode('utf-8')
            lines = text_content.split('\n')[:10]  # 取前10行

            for i, line in enumerate(lines):
                if line.strip():  # 忽略空行
                    # 清理行内容
                    clean_line = line.strip()[:50]  # 限制长度
                    if clean_line:
                        suggested_strings.append({
                            'name': f'$str{i+1}',
                            'value': clean_line,
                            'type': 'text'
                        })
        except UnicodeDecodeError:
            # 如果不是文本文件，则基于文件头建议十六进制字符串
            if len(content) >= 16:
                hex_header = content[:16].hex(' ').upper()
                suggested_strings.append({
                    'name': '$header',
                    'value': hex_header,
                    'type': 'hex'
                })

    # 确保字符串名称唯一
    unique_strings = []
    used_names = set()

    for string_item in suggested_strings:
        name = string_item['name']
        counter = 1
        original_name = name

        # 确保名称唯一
        while name in used_names:
            name = f"{original_name}_{counter}"
            counter += 1

        string_item['name'] = name
        used_names.add(name)
        unique_strings.append(string_item)

    return unique_strings[:20]  # 限制最多20个建议字符串

def extract_string_constants(text_content):
    """提取字符串常量"""
    import re
    strings = []

    # 匹配双引号字符串
    double_quoted = re.findall(r'"([^"\\]*(?:\\.[^"\\]*)*)"', text_content)
    for s in double_quoted[:5]:  # 限制数量
        if len(s) >= 3 and len(s) <= 100:  # 过滤过短或过长的字符串
            # 清理字符串
            clean_s = s.replace('\\n', '\n').replace('\\t', '\t').replace('\\\\', '\\')
            strings.append({
                'name': f'$str_const_{len(strings)+1}',
                'value': clean_s,
                'type': 'text'
            })

    # 匹配单引号字符串
    single_quoted = re.findall(r"'([^'\\]*(?:\\.[^'\\]*)*)'", text_content)
    for s in single_quoted[:3]:  # 限制数量
        if len(s) >= 3 and len(s) <= 100:
            clean_s = s.replace('\\n', '\n').replace('\\t', '\t').replace('\\\\', '\\')
            strings.append({
                'name': f'$str_const_{len(strings)+1}',
                'value': clean_s,
                'type': 'text'
            })

    return strings

def extract_identifiers(text_content):
    """提取标识符（函数名、类名等）"""
    import re
    identifiers = []

    # 匹配函数定义（Python风格）
    functions = re.findall(r'def\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(', text_content)
    for func in functions[:3]:
        identifiers.append({
            'name': f'$func_{func}',
            'value': func,
            'type': 'text'
        })

    # 匹配类定义
    classes = re.findall(r'class\s+([a-zA-Z_][a-zA-Z0-9_]*)', text_content)
    for cls in classes[:3]:
        identifiers.append({
            'name': f'$class_{cls}',
            'value': cls,
            'type': 'text'
        })

    # 匹配常见的API函数名（Windows API示例）
    api_functions = re.findall(r'(CreateFile|OpenProcess|WriteFile|ReadFile|RegSetValue|GetProcAddress)', text_content)
    for api in api_functions[:3]:
        identifiers.append({
            'name': f'$api_{api}',
            'value': api,
            'type': 'text'
        })

    return identifiers

def extract_paths_urls(text_content):
    """提取路径和URL"""
    import re
    paths_urls = []

    # 匹配文件路径
    paths = re.findall(r'([a-zA-Z]:[\\\/][\w\\\/\.\-_]+)', text_content)
    for path in paths[:2]:
        if len(path) >= 5:
            paths_urls.append({
                'name': f'$path_{len(paths_urls)+1}',
                'value': path,
                'type': 'text'
            })

    # 匹配URL
    urls = re.findall(r'(https?://[^\s\'"<>]+)', text_content)
    for url in urls[:2]:
        if len(url) >= 10:
            paths_urls.append({
                'name': f'$url_{len(paths_urls)+1}',
                'value': url,
                'type': 'text'
            })

    return paths_urls

def extract_ascii_strings(content):
    """从二进制内容中提取ASCII字符串"""
    strings = []
    current_string = b''

    for byte in content:
        if 32 <= byte <= 126:  # 可打印ASCII字符
            current_string += bytes([byte])
        else:
            if len(current_string) >= 5:  # 至少5个字符才认为是有效字符串
                try:
                    str_value = current_string.decode('ascii')
                    strings.append({
                        'name': f'$ascii_{len(strings)+1}',
                        'value': str_value,
                        'type': 'text'
                    })
                except UnicodeDecodeError:
                    pass
                if len(strings) >= 10:  # 限制数量
                    break
            current_string = b''

    # 处理最后一个字符串
    if len(current_string) >= 5 and len(strings) < 10:
        try:
            str_value = current_string.decode('ascii')
            strings.append({
                'name': f'$ascii_{len(strings)+1}',
                'value': str_value,
                'type': 'text'
            })
        except UnicodeDecodeError:
            pass

    return strings

def extract_file_signatures(content):
    """提取常见文件签名"""
    signatures = []

    # 常见文件签名（魔数）
    magic_numbers = {
        b'MZ': '$pe_signature',
        b'\x7fELF': '$elf_signature',
        b'%PDF': '$pdf_signature',
        b'\xff\xd8\xff': '$jpeg_signature',
        b'\x89PNG': '$png_signature',
        b'PK\x03\x04': '$zip_signature'
    }

    for magic, name in magic_numbers.items():
        if content.startswith(magic):
            signatures.append({
                'name': name,
                'value': magic.hex(' ').upper(),
                'type': 'hex'
            })
            break

    return signatures

# 下载YARA规则的端点
@app.route('/download_rule', methods=['POST'])
def download_rule():
    try:
        data = request.get_json()
        rule_content = data.get('rule', '')
        rule_name = data.get('rule_name', 'yara_rule')

        if not rule_content:
            return jsonify({'error': '规则内容为空'}), 400

        # 清理规则名称用于文件名
        clean_name = re.sub(r'[^\w\-_\. ]', '_', rule_name)
        if not clean_name:
            clean_name = 'yara_rule'

        filename = f"{clean_name}.yar"

        # 创建响应
        return Response(
            rule_content,
            mimetype='text/plain',
            headers={'Content-Disposition': f'attachment; filename={filename}'}
        )
    except Exception as e:
        return jsonify({'error': f'下载规则时出错: {str(e)}'}), 500

# 规则验证端点
@app.route('/validate_rule', methods=['POST'])
def validate_rule():
    try:
        data = request.get_json()
        rule_name = data.get('rule_name', '').strip()
        strings_section = data.get('strings', [])
        conditions = data.get('conditions', '').strip()

        # 基本验证
        errors = []

        # 验证规则名称
        if not rule_name:
            errors.append('规则名称不能为空')
        elif not re.match(r'^[a-zA-Z_][a-zA-Z0-9_]*$', rule_name):
            errors.append('规则名称格式不正确，只能包含字母、数字和下划线，且不能以数字开头')

        # 验证字符串
        if not strings_section:
            errors.append('至少需要定义一个字符串')

        # 验证条件
        if not conditions:
            errors.append('条件表达式不能为空')

        # 如果有错误，返回错误信息
        if errors:
            return jsonify({'valid': False, 'errors': errors})

        # 如果没有错误，返回验证通过
        return jsonify({'valid': True, 'message': '规则验证通过'})

    except Exception as e:
        return jsonify({'valid': False, 'errors': [f'验证时出错: {str(e)}']}), 500

# 获取规则模板端点
@app.route('/get_template/<template_type>', methods=['GET'])
def get_template(template_type):
    templates = {
        'pe': {
            'rule_name': 'pe_file_detection',
            'rule_description': '检测Windows可执行文件',
            'rule_author': 'YARA Generator',
            'tags': ['pe', 'executable', 'windows'],
            'strings': [
                {'name': '$mz', 'value': 'MZ', 'type': 'text'},
                {'name': '$pe', 'value': 'PE\\0\\0', 'type': 'text'}
            ],
            'conditions': '$mz at 0 and $pe at 0x3c'
        },
        'elf': {
            'rule_name': 'elf_file_detection',
            'rule_description': '检测Linux可执行文件',
            'rule_author': 'YARA Generator',
            'tags': ['elf', 'executable', 'linux'],
            'strings': [
                {'name': '$elf', 'value': '7f454c46', 'type': 'hex'}
            ],
            'conditions': '$elf at 0'
        },
        'pdf': {
            'rule_name': 'pdf_malware_detection',
            'rule_description': '检测恶意PDF文件',
            'rule_author': 'YARA Generator',
            'tags': ['pdf', 'malware'],
            'strings': [
                {'name': '$pdf', 'value': '%PDF-', 'type': 'text'},
                {'name': '$js', 'value': '/JavaScript', 'type': 'text'},
                {'name': '$open', 'value': '/OpenAction', 'type': 'text'}
            ],
            'conditions': '$pdf at 0 and ($js or $open)'
        },
        'office': {
            'rule_name': 'office_malware_detection',
            'rule_description': '检测恶意Office文档',
            'rule_author': 'YARA Generator',
            'tags': ['office', 'malware', 'document'],
            'strings': [
                {'name': '$ole', 'value': 'D0CF11E0A1B11AE1', 'type': 'hex'},
                {'name': '$macro1', 'value': 'Macros', 'type': 'text'},
                {'name': '$macro2', 'value': 'VBProject', 'type': 'text'}
            ],
            'conditions': '$ole at 0 and ($macro1 or $macro2)'
        }
    }

    if template_type in templates:
        return jsonify(templates[template_type])
    else:
        return jsonify({'error': '未知的模板类型'}), 404

# 保存规则到历史记录
@app.route('/save_rule', methods=['POST'])
def save_rule():
    try:
        data = request.get_json()
        rule_content = data.get('rule', '')
        rule_name = data.get('rule_name', 'yara_rule')
        rule_description = data.get('rule_description', '')
        rule_author = data.get('rule_author', '')

        if not rule_content:
            return jsonify({'error': '规则内容为空'}), 400

        # 创建历史记录条目
        history_entry = {
            'id': hashlib.md5(f"{rule_name}{datetime.now().isoformat()}".encode()).hexdigest(),
            'name': rule_name,
            'description': rule_description,
            'author': rule_author,
            'content': rule_content,
            'created_at': datetime.now().isoformat(),
            'tags': data.get('tags', [])
        }

        # 保存到历史记录文件
        history_file = os.path.join(DATA_DIR, 'rules_history.json')
        history = []

        # 读取现有历史记录
        if os.path.exists(history_file):
            with open(history_file, 'r', encoding='utf-8') as f:
                try:
                    history = json.load(f)
                except json.JSONDecodeError:
                    history = []

        # 添加新记录
        history.append(history_entry)

        # 限制历史记录数量为100条
        if len(history) > 100:
            history = history[-100:]

        # 保存历史记录
        with open(history_file, 'w', encoding='utf-8') as f:
            json.dump(history, f, ensure_ascii=False, indent=2)

        return jsonify({'success': True, 'message': '规则已保存到历史记录'})

    except Exception as e:
        return jsonify({'error': f'保存规则时出错: {str(e)}'}), 500

# 获取规则历史记录
@app.route('/get_history', methods=['GET'])
def get_history():
    try:
        history_file = os.path.join(DATA_DIR, 'rules_history.json')

        if not os.path.exists(history_file):
            return jsonify([])

        with open(history_file, 'r', encoding='utf-8') as f:
            try:
                history = json.load(f)
                return jsonify(history)
            except json.JSONDecodeError:
                return jsonify([])

    except Exception as e:
        return jsonify({'error': f'获取历史记录时出错: {str(e)}'}), 500

# 清空规则历史记录
@app.route('/clear_history', methods=['POST'])
def clear_history():
    try:
        history_file = os.path.join(DATA_DIR, 'rules_history.json')

        if os.path.exists(history_file):
            os.remove(history_file)

        return jsonify({'success': True, 'message': '历史记录已清空'})

    except Exception as e:
        return jsonify({'error': f'清空历史记录时出错: {str(e)}'}), 500

# 搜索规则历史记录
@app.route('/search_history', methods=['POST'])
def search_history():
    try:
        data = request.get_json()
        query = data.get('query', '').lower()

        history_file = os.path.join(DATA_DIR, 'rules_history.json')

        if not os.path.exists(history_file):
            return jsonify([])

        with open(history_file, 'r', encoding='utf-8') as f:
            try:
                history = json.load(f)

                # 搜索匹配的记录
                if query:
                    filtered_history = [
                        entry for entry in history
                        if query in entry.get('name', '').lower() or
                           query in entry.get('description', '').lower() or
                           any(query in tag.lower() for tag in entry.get('tags', []))
                    ]
                    return jsonify(filtered_history)
                else:
                    return jsonify(history)

            except json.JSONDecodeError:
                return jsonify([])

    except Exception as e:
        return jsonify({'error': f'搜索历史记录时出错: {str(e)}'}), 500

def build_yara_rule(rule_name, description, author, strings, conditions, tags):
    """构建YARA规则"""
    rule_lines = []

    # 规则头部
    tag_str = ' '.join(tags) if tags else ''
    if tag_str:
        tag_str = f": {tag_str}"

    rule_lines.append(f"rule {rule_name}{tag_str}")
    rule_lines.append("{")

    # 添加meta部分
    meta_lines = []
    if author:
        meta_lines.append(f'    author = "{author}"')
    if description:
        meta_lines.append(f'    description = "{description}"')

    if meta_lines:
        rule_lines.append("    meta:")
        rule_lines.extend(meta_lines)

    # 添加strings部分
    if strings:
        rule_lines.append("    strings:")
        for string_item in strings:
            string_name = string_item.get('name', '')
            string_value = string_item.get('value', '')
            string_type = string_item.get('type', 'text')

            if string_name and string_value:
                if string_type == 'text':
                    rule_lines.append(f'        {string_name} = "{string_value}"')
                elif string_type == 'hex':
                    rule_lines.append(f'        {string_name} = {{ {string_value} }}')
                elif string_type == 'regex':
                    rule_lines.append(f'        {string_name} = /{string_value}/')

    # 添加condition部分
    if conditions:
        rule_lines.append("    condition:")
        # 简单处理条件，每行添加适当的缩进
        condition_lines = conditions.split('\n')
        for line in condition_lines:
            if line.strip():
                rule_lines.append(f"        {line}")
    else:
        # 默认条件
        if strings:
            first_string = strings[0].get('name', '$a')
            rule_lines.append(f"    condition:")
            rule_lines.append(f"        {first_string}")
        else:
            rule_lines.append("    condition:")
            rule_lines.append("        true")

    rule_lines.append("}")

    return '\n'.join(rule_lines)

# 扫描文件端点 - 简化版本
@app.route('/scan_file', methods=['POST'])
def scan_file():
    try:
        if 'file' not in request.files:
            return jsonify({'error': '没有找到上传的文件'}), 400

        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': '请选择一个文件'}), 400

        # 读取文件内容
        file_content = file.read()

        # 获取文件基本信息
        file_info = {
            'filename': file.filename,
            'size': len(file_content),
            'md5': hashlib.md5(file_content).hexdigest(),
            'sha1': hashlib.sha1(file_content).hexdigest(),
            'sha256': hashlib.sha256(file_content).hexdigest()
        }

        # 模拟扫描结果（实际应用中需要集成YARA引擎）
        import random
        is_matched = random.random() > 0.7

        scan_result = {
            'matched': is_matched,
            'rule_name': 'scan_rule',
            'rule_description': '扫描规则',
            'matched_strings': ['$a', '$b', '$header'] if is_matched else [],
            'file_info': file_info,
            'scan_time': datetime.now().isoformat()
        }

        return jsonify({
            'success': True,
            'result': scan_result,
            'message': '扫描完成'
        })

    except Exception as e:
        return jsonify({'error': f'扫描文件时出错: {str(e)}'}), 500

if __name__ == '__main__':
    app.run(debug=True)