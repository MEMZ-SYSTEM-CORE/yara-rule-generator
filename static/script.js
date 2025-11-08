document.addEventListener('DOMContentLoaded', function() {
    // Initialize theme
    initTheme();

    // 添加字符串按钮
    document.getElementById('add-string').addEventListener('click', function() {
        addStringField();
    });

    // 表单提交
    document.getElementById('rule-form').addEventListener('submit', function(e) {
        e.preventDefault();
        generateRule();
    });

    // 重置表单
    document.getElementById('reset-form').addEventListener('click', function() {
        resetForm();
    });

    // 复制规则
    document.getElementById('copy-rule').addEventListener('click', function() {
        copyRule();
    });

    // 下载规则
    document.getElementById('download-rule').addEventListener('click', function() {
        downloadRule();
    });

    // 删除字符串
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('remove-string')) {
            removeString(e.target);
        }
    });

    // 标签切换
    const tabButtons = document.querySelectorAll('.tab-button');
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const tabName = this.getAttribute('data-tab');

            // 更新激活的标签按钮
            tabButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');

            // 显示对应的内容区域
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            const tabId = `${tabName}-tab`;
            document.getElementById(tabId).classList.add('active');
        });
    });

    // 文件上传相关事件
    const uploadArea = document.getElementById('upload-area');
    const fileInput = document.getElementById('file-input');
    const selectFileButton = document.getElementById('select-file');

    // 点击上传区域或按钮选择文件
    uploadArea.addEventListener('click', function(e) {
        if (e.target !== selectFileButton) {
            fileInput.click();
        }
    });

    selectFileButton.addEventListener('click', function() {
        fileInput.click();
    });

    // 文件选择后处理
    fileInput.addEventListener('change', function() {
        if (this.files.length > 0) {
            // 显示进度条
            document.getElementById('file-progress').classList.remove('hidden');
            analyzeFile(this.files[0]);
        }
    });

    // 拖拽上传功能
    uploadArea.addEventListener('dragover', function(e) {
        e.preventDefault();
        this.classList.add('dragover');
    });

    uploadArea.addEventListener('dragleave', function(e) {
        e.preventDefault();
        this.classList.remove('dragover');
    });

    uploadArea.addEventListener('drop', function(e) {
        e.preventDefault();
        this.classList.remove('dragover');

        if (e.dataTransfer.files.length > 0) {
            fileInput.files = e.dataTransfer.files;
            // 显示进度条
            document.getElementById('file-progress').classList.remove('hidden');
            analyzeFile(e.dataTransfer.files[0]);
        }
    });

    // 使用建议字符串
    document.getElementById('use-suggested').addEventListener('click', function() {
        useSuggestedStrings();
    });

    // 分析更多文件
    document.getElementById('analyze-more').addEventListener('click', function() {
        fileInput.click();
    });

    // 文件规则表单提交
    document.getElementById('file-rule-form').addEventListener('submit', function(e) {
        e.preventDefault();
        generateFileRule();
    });

    // 重置文件表单
    document.getElementById('reset-file-form').addEventListener('click', function() {
        resetFileForm();
    });

    // 添加建议字符串到规则
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('add-suggested-string')) {
            addSuggestedStringToRule(e.target);
        } else if (e.target.classList.contains('ignore-suggested-string')) {
            ignoreSuggestedString(e.target);
        }
    });

    // 条件预设按钮
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('preset-btn')) {
            const condition = e.target.getAttribute('data-condition');
            const isFileTab = document.getElementById('file-tab').classList.contains('active');
            const textarea = isFileTab ? document.getElementById('file_conditions') : document.getElementById('conditions');
            textarea.value = condition;
        }
    });

    // 全选/清空建议字符串
    document.getElementById('select-all-suggested').addEventListener('click', function() {
        selectAllSuggestedStrings();
    });

    document.getElementById('clear-all-suggested').addEventListener('click', function() {
        clearAllSuggestedStrings();
    });

    // 主题切换
    document.getElementById('theme-toggle').addEventListener('click', function() {
        toggleTheme();
    });

    // 规则验证
    document.getElementById('validate-rule').addEventListener('click', function() {
        validateRule();
    });

    document.getElementById('validate-file-rule').addEventListener('click', function() {
        validateFileRule();
    });

    // 模板使用
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('btn-template-use')) {
            const template = e.target.closest('.template-card').getAttribute('data-template');
            useTemplate(template);
        }
    });

    // 历史记录功能
    document.getElementById('clear-history').addEventListener('click', function() {
        clearHistory();
    });

    // 搜索历史记录
    document.getElementById('history-search').addEventListener('input', function() {
        searchHistory(this.value);
    });

    // 测试规则
    document.getElementById('test-rule').addEventListener('click', function() {
        testRule();
    });

    // 保存规则
    document.getElementById('save-rule').addEventListener('click', function() {
        saveRule();
    });

    // 规则编辑器功能
    initEditor();

    // 在线查杀功能
    initScanner();
});

// Theme functions
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
}

function updateThemeIcon(theme) {
    const icon = document.querySelector('#theme-toggle i');
    icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
}

function addStringField() {
    const container = document.getElementById('strings-container');
    const stringItems = container.querySelectorAll('.string-item');
    const nextIndex = stringItems.length;
    const nextLetter = String.fromCharCode(97 + nextIndex); // a, b, c...

    const stringItem = document.createElement('div');
    stringItem.className = 'string-item';
    stringItem.innerHTML = `
        <div class="form-row">
            <div class="form-group">
                <label>字符串名称</label>
                <div class="input-with-icon">
                    <i class="fas fa-font"></i>
                    <input type="text" name="string_name[]" placeholder="$${nextLetter}" value="$$${nextLetter}">
                </div>
            </div>
            <div class="form-group">
                <label>字符串值</label>
                <div class="input-with-icon">
                    <i class="fas fa-quote-right"></i>
                    <input type="text" name="string_value[]" placeholder="示例文本">
                </div>
            </div>
            <div class="form-group">
                <label>类型</label>
                <div class="select-with-icon">
                    <i class="fas fa-code"></i>
                    <select name="string_type[]">
                        <option value="text">文本</option>
                        <option value="hex">十六进制</option>
                        <option value="regex">正则表达式</option>
                    </select>
                </div>
            </div>
            <div class="form-group">
                <label>操作</label>
                <button type="button" class="remove-string btn-danger" title="删除字符串">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `;

    container.appendChild(stringItem);
}

function removeString(button) {
    const stringItem = button.closest('.string-item');
    if (document.querySelectorAll('.string-item').length > 1) {
        stringItem.remove();
    } else {
        alert('至少需要保留一个字符串定义');
    }
}

function generateRule() {
    // 收集表单数据
    const formData = {
        rule_name: document.getElementById('rule_name').value,
        rule_description: document.getElementById('rule_description').value,
        rule_author: document.getElementById('rule_author').value,
        tags: document.getElementById('tags').value ? document.getElementById('tags').value.split(',').map(tag => tag.trim()).filter(tag => tag) : [],
        strings: [],
        conditions: document.getElementById('conditions').value
    };

    // 收集字符串数据
    const stringNames = document.querySelectorAll('input[name="string_name[]"]');
    const stringValues = document.querySelectorAll('input[name="string_value[]"]');
    const stringTypes = document.querySelectorAll('select[name="string_type[]"]');

    for (let i = 0; i < stringNames.length; i++) {
        if (stringNames[i].value && stringValues[i].value) {
            formData.strings.push({
                name: stringNames[i].value,
                value: stringValues[i].value,
                type: stringTypes[i].value
            });
        }
    }

    // 发送请求到后端
    fetch('/generate_rule', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            alert('错误: ' + data.error);
        } else {
            document.getElementById('generated-rule').textContent = data.rule;
            document.getElementById('result-section').classList.remove('hidden');
            // 滚动到结果区域
            document.getElementById('result-section').scrollIntoView({ behavior: 'smooth' });
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('生成规则时出错，请查看控制台了解详情');
    });
}

function resetForm() {
    if (confirm('确定要重置表单吗？所有已输入的内容将被清除。')) {
        document.getElementById('rule-form').reset();
        // 保留一个默认的字符串字段
        const container = document.getElementById('strings-container');
        container.innerHTML = `
            <div class="string-item">
                <div class="form-row">
                    <div class="form-group">
                        <label>字符串名称</label>
                        <div class="input-with-icon">
                            <i class="fas fa-font"></i>
                            <input type="text" name="string_name[]" placeholder="$a" value="$a">
                        </div>
                    </div>
                    <div class="form-group">
                        <label>字符串值</label>
                        <div class="input-with-icon">
                            <i class="fas fa-quote-right"></i>
                            <input type="text" name="string_value[]" placeholder="示例文本">
                        </div>
                    </div>
                    <div class="form-group">
                        <label>类型</label>
                        <div class="select-with-icon">
                            <i class="fas fa-code"></i>
                            <select name="string_type[]">
                                <option value="text">文本</option>
                                <option value="hex">十六进制</option>
                                <option value="regex">正则表达式</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>操作</label>
                        <button type="button" class="remove-string btn-danger" title="删除字符串">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
        // 隐藏结果区域
        document.getElementById('result-section').classList.add('hidden');
    }
}

function copyRule() {
    const ruleText = document.getElementById('generated-rule').textContent;
    navigator.clipboard.writeText(ruleText).then(() => {
        const button = document.getElementById('copy-rule');
        const originalText = button.innerHTML;
        button.innerHTML = '<i class="fas fa-check"></i> 已复制!';
        setTimeout(() => {
            button.innerHTML = originalText;
        }, 2000);
    }).catch(err => {
        console.error('复制失败: ', err);
        alert('复制失败，请手动复制');
    });
}

function downloadRule() {
    const ruleText = document.getElementById('generated-rule').textContent;
    const ruleName = document.getElementById('rule_name').value || document.getElementById('file_rule_name').value || 'yara_rule';

    // 发送请求到后端下载端点
    fetch('/download_rule', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            rule: ruleText,
            rule_name: ruleName
        })
    })
    .then(response => response.blob())
    .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${ruleName}.yar`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    })
    .catch(error => {
        console.error('下载失败: ', error);
        alert('下载失败，请查看控制台了解详情');
    });
}

// 文件分析功能
function analyzeFile(file) {
    const formData = new FormData();
    formData.append('file', file);

    // 更新进度条
    const progressBar = document.querySelector('.progress-fill');
    const progressText = document.querySelector('.progress-text');
    progressBar.style.width = '30%';
    progressText.textContent = '正在上传文件...';

    fetch('/analyze_file', {
        method: 'POST',
        body: formData
    })
    .then(response => {
        progressBar.style.width = '70%';
        progressText.textContent = '正在分析文件...';
        return response.json();
    })
    .then(data => {
        progressBar.style.width = '100%';
        progressText.textContent = '分析完成!';
        setTimeout(() => {
            document.getElementById('file-progress').classList.add('hidden');
            progressBar.style.width = '0%';
        }, 1000);

        if (data.error) {
            alert('错误: ' + data.error);
        } else {
            displayFileInfo(data.file_info, data.suggested_strings);
        }
    })
    .catch(error => {
        document.getElementById('file-progress').classList.add('hidden');
        console.error('Error:', error);
        alert('分析文件时出错，请查看控制台了解详情');
    });
}

function displayFileInfo(fileInfo, suggestedStrings) {
    const fileInfoDiv = document.getElementById('file-info');
    const fileDetailsDiv = document.getElementById('file-details');

    // 显示文件信息
    fileDetailsDiv.innerHTML = `
        <div class="file-details-grid">
            <div class="file-detail-item">
                <div class="file-detail-label">文件名</div>
                <div class="file-detail-value">${fileInfo.filename}</div>
            </div>
            <div class="file-detail-item">
                <div class="file-detail-label">文件大小</div>
                <div class="file-detail-value">${formatFileSize(fileInfo.size)}</div>
            </div>
            <div class="file-detail-item">
                <div class="file-detail-label">文件类型</div>
                <div class="file-detail-value">${fileInfo.type || 'Unknown'}</div>
            </div>
            <div class="file-detail-item">
                <div class="file-detail-label">MD5</div>
                <div class="file-detail-value">${fileInfo.md5}</div>
            </div>
            <div class="file-detail-item">
                <div class="file-detail-label">SHA1</div>
                <div class="file-detail-value">${fileInfo.sha1}</div>
            </div>
            <div class="file-detail-item">
                <div class="file-detail-label">SHA256</div>
                <div class="file-detail-value">${fileInfo.sha256}</div>
            </div>
        </div>
    `;

    // 显示建议的字符串
    displaySuggestedStrings(suggestedStrings);

    // 显示文件信息区域
    fileInfoDiv.classList.remove('hidden');

    // 滚动到文件信息区域
    fileInfoDiv.scrollIntoView({ behavior: 'smooth' });
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function displaySuggestedStrings(suggestedStrings) {
    const container = document.getElementById('suggested-strings-container');
    const countElement = document.getElementById('suggested-count');
    container.innerHTML = '';
    countElement.textContent = suggestedStrings.length;

    if (suggestedStrings.length === 0) {
        container.innerHTML = '<p class="empty-suggested">未找到建议的字符串</p>';
        return;
    }

    suggestedStrings.forEach((str, index) => {
        const stringItem = document.createElement('div');
        stringItem.className = 'suggested-string-item';
        stringItem.innerHTML = `
            <div class="suggested-string-info">
                <div class="suggested-string-name">
                    <i class="fas fa-tag"></i> ${str.name}
                </div>
                <div class="suggested-string-value">${str.value}</div>
                <div class="suggested-string-type">${getStringTypeLabel(str.type)}</div>
            </div>
            <div class="suggested-string-actions">
                <button type="button" class="add-suggested-string btn-small btn-success" data-index="${index}">
                    <i class="fas fa-plus"></i> 添加
                </button>
                <button type="button" class="ignore-suggested-string btn-small btn-secondary" data-index="${index}">
                    <i class="fas fa-times"></i> 忽略
                </button>
            </div>
        `;
        container.appendChild(stringItem);
    });
}

function getStringTypeLabel(type) {
    switch(type) {
        case 'text': return '文本';
        case 'hex': return '十六进制';
        case 'regex': return '正则表达式';
        default: return type;
    }
}

function useSuggestedStrings() {
    // 获取所有建议的字符串并添加到规则中
    const suggestedItems = document.querySelectorAll('.suggested-string-item');
    suggestedItems.forEach(item => {
        const nameElement = item.querySelector('.suggested-string-name');
        const valueElement = item.querySelector('.suggested-string-value');
        const typeElement = item.querySelector('.suggested-string-type');

        const name = nameElement.textContent.replace(/^[^$]*\$/, '$'); // 提取名称中的$部分
        const value = valueElement.textContent;
        const type = getTypeFromLabel(typeElement.textContent);

        addStringToRule(name, value, type);
    });

    // 滚动到手动创建标签
    document.querySelector('.tab-button[data-tab="manual"]').click();
    document.getElementById('strings-container').scrollIntoView({ behavior: 'smooth' });
}

function addSuggestedStringToRule(button) {
    const stringItem = button.closest('.suggested-string-item');
    const nameElement = stringItem.querySelector('.suggested-string-name');
    const valueElement = stringItem.querySelector('.suggested-string-value');
    const typeElement = stringItem.querySelector('.suggested-string-type');

    const name = nameElement.textContent.replace(/^[^$]*\$/, '$'); // 提取名称中的$部分
    const value = valueElement.textContent;
    const type = getTypeFromLabel(typeElement.textContent);

    addStringToRule(name, value, type);

    // 移除已添加的建议项
    stringItem.remove();

    // 更新计数
    const countElement = document.getElementById('suggested-count');
    countElement.textContent = document.querySelectorAll('.suggested-string-item').length;
}

function addStringToRule(name, value, type) {
    const container = document.getElementById('strings-container');
    const stringItems = container.querySelectorAll('.string-item');
    const nextIndex = stringItems.length;

    const stringItem = document.createElement('div');
    stringItem.className = 'string-item';
    stringItem.innerHTML = `
        <div class="form-row">
            <div class="form-group">
                <label>字符串名称</label>
                <div class="input-with-icon">
                    <i class="fas fa-font"></i>
                    <input type="text" name="string_name[]" value="${name}">
                </div>
            </div>
            <div class="form-group">
                <label>字符串值</label>
                <div class="input-with-icon">
                    <i class="fas fa-quote-right"></i>
                    <input type="text" name="string_value[]" value="${value.replace(/"/g, '&quot;')}">
                </div>
            </div>
            <div class="form-group">
                <label>类型</label>
                <div class="select-with-icon">
                    <i class="fas fa-code"></i>
                    <select name="string_type[]">
                        <option value="text" ${type === 'text' ? 'selected' : ''}>文本</option>
                        <option value="hex" ${type === 'hex' ? 'selected' : ''}>十六进制</option>
                        <option value="regex" ${type === 'regex' ? 'selected' : ''}>正则表达式</option>
                    </select>
                </div>
            </div>
            <div class="form-group">
                <label>操作</label>
                <button type="button" class="remove-string btn-danger" title="删除字符串">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `;

    container.appendChild(stringItem);
}

function getTypeFromLabel(label) {
    switch(label) {
        case '文本': return 'text';
        case '十六进制': return 'hex';
        case '正则表达式': return 'regex';
        default: return 'text';
    }
}

function ignoreSuggestedString(button) {
    const stringItem = button.closest('.suggested-string-item');
    stringItem.remove();

    // 更新计数
    const countElement = document.getElementById('suggested-count');
    countElement.textContent = document.querySelectorAll('.suggested-string-item').length;
}

function generateFileRule() {
    // 收集文件规则表单数据
    const formData = {
        rule_name: document.getElementById('file_rule_name').value,
        rule_description: document.getElementById('file_rule_description').value,
        rule_author: document.getElementById('file_rule_author').value,
        tags: document.getElementById('file_tags').value ? document.getElementById('file_tags').value.split(',').map(tag => tag.trim()).filter(tag => tag) : [],
        strings: [], // 这里需要从建议的字符串中收集
        conditions: document.getElementById('file_conditions').value
    };

    // 发送请求到后端
    fetch('/generate_rule', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            alert('错误: ' + data.error);
        } else {
            document.getElementById('generated-rule').textContent = data.rule;
            document.getElementById('result-section').classList.remove('hidden');
            // 滚动到结果区域
            document.getElementById('result-section').scrollIntoView({ behavior: 'smooth' });
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('生成规则时出错，请查看控制台了解详情');
    });
}

function resetFileForm() {
    if (confirm('确定要重置表单吗？所有已输入的内容将被清除。')) {
        document.getElementById('file-rule-form').reset();
        // 清空建议字符串容器
        document.getElementById('suggested-strings-container').innerHTML = '';
        document.getElementById('suggested-count').textContent = '0';
        // 隐藏文件信息区域
        document.getElementById('file-info').classList.add('hidden');
        // 隐藏结果区域
        document.getElementById('result-section').classList.add('hidden');
    }
}

// 新增功能函数
function selectAllSuggestedStrings() {
    const suggestedItems = document.querySelectorAll('.suggested-string-item');
    suggestedItems.forEach(item => {
        const nameElement = item.querySelector('.suggested-string-name');
        const valueElement = item.querySelector('.suggested-string-value');
        const typeElement = item.querySelector('.suggested-string-type');

        const name = nameElement.textContent.replace(/^[^$]*\$/, '$');
        const value = valueElement.textContent;
        const type = getTypeFromLabel(typeElement.textContent);

        addStringToRule(name, value, type);
    });

    // 清空建议列表
    document.getElementById('suggested-strings-container').innerHTML = '';
    document.getElementById('suggested-count').textContent = '0';
}

function clearAllSuggestedStrings() {
    if (confirm('确定要清空所有建议的字符串吗？')) {
        document.getElementById('suggested-strings-container').innerHTML = '';
        document.getElementById('suggested-count').textContent = '0';
    }
}

function validateRule() {
    // 收集表单数据
    const formData = {
        rule_name: document.getElementById('rule_name').value,
        rule_description: document.getElementById('rule_description').value,
        rule_author: document.getElementById('rule_author').value,
        tags: document.getElementById('tags').value ? document.getElementById('tags').value.split(',').map(tag => tag.trim()).filter(tag => tag) : [],
        strings: [],
        conditions: document.getElementById('conditions').value
    };

    // 收集字符串数据
    const stringNames = document.querySelectorAll('input[name="string_name[]"]');
    const stringValues = document.querySelectorAll('input[name="string_value[]"]');
    const stringTypes = document.querySelectorAll('select[name="string_type[]"]');

    for (let i = 0; i < stringNames.length; i++) {
        if (stringNames[i].value && stringValues[i].value) {
            formData.strings.push({
                name: stringNames[i].value,
                value: stringValues[i].value,
                type: stringTypes[i].value
            });
        }
    }

    // 发送验证请求到后端
    fetch('/validate_rule', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
    })
    .then(response => response.json())
    .then(data => {
        const validationResult = document.getElementById('rule-validation-result');
        validationResult.classList.remove('hidden');

        if (data.valid) {
            validationResult.className = 'validation-result validation-success';
            validationResult.innerHTML = `<i class="fas fa-check-circle"></i> ${data.message}`;
        } else {
            validationResult.className = 'validation-result validation-error';
            const errorList = data.errors.map(error => `<li>${error}</li>`).join('');
            validationResult.innerHTML = `
                <i class="fas fa-exclamation-circle"></i> 规则验证失败：
                <ul>${errorList}</ul>
            `;
        }

        // 5秒后隐藏验证结果
        setTimeout(() => {
            validationResult.classList.add('hidden');
        }, 5000);
    })
    .catch(error => {
        console.error('验证失败:', error);
        const validationResult = document.getElementById('rule-validation-result');
        validationResult.classList.remove('hidden');
        validationResult.className = 'validation-result validation-error';
        validationResult.innerHTML = '<i class="fas fa-exclamation-circle"></i> 验证时出错，请查看控制台了解详情。';

        setTimeout(() => {
            validationResult.classList.add('hidden');
        }, 5000);
    });
}

function validateFileRule() {
    // 收集文件规则表单数据
    const formData = {
        rule_name: document.getElementById('file_rule_name').value,
        rule_description: document.getElementById('file_rule_description').value,
        rule_author: document.getElementById('file_rule_author').value,
        tags: document.getElementById('file_tags').value ? document.getElementById('file_tags').value.split(',').map(tag => tag.trim()).filter(tag => tag) : [],
        strings: [],
        conditions: document.getElementById('file_conditions').value
    };

    // 发送验证请求到后端
    fetch('/validate_rule', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
    })
    .then(response => response.json())
    .then(data => {
        const validationResult = document.getElementById('rule-validation-result');
        validationResult.classList.remove('hidden');

        if (data.valid) {
            validationResult.className = 'validation-result validation-success';
            validationResult.innerHTML = `<i class="fas fa-check-circle"></i> ${data.message}`;
        } else {
            validationResult.className = 'validation-result validation-error';
            const errorList = data.errors.map(error => `<li>${error}</li>`).join('');
            validationResult.innerHTML = `
                <i class="fas fa-exclamation-circle"></i> 规则验证失败：
                <ul>${errorList}</ul>
            `;
        }

        // 5秒后隐藏验证结果
        setTimeout(() => {
            validationResult.classList.add('hidden');
        }, 5000);
    })
    .catch(error => {
        console.error('验证失败:', error);
        const validationResult = document.getElementById('rule-validation-result');
        validationResult.classList.remove('hidden');
        validationResult.className = 'validation-result validation-error';
        validationResult.innerHTML = '<i class="fas fa-exclamation-circle"></i> 验证时出错，请查看控制台了解详情。';

        setTimeout(() => {
            validationResult.classList.add('hidden');
        }, 5000);
    });
}

function useTemplate(templateType) {
    // 从后端获取模板数据
    fetch(`/get_template/${templateType}`)
    .then(response => response.json())
    .then(templateData => {
        if (templateData.error) {
            alert('错误: ' + templateData.error);
            return;
        }

        // 填充模板数据到手动创建表单
        document.getElementById('rule_name').value = templateData.rule_name;
        document.getElementById('rule_description').value = templateData.rule_description;
        document.getElementById('rule_author').value = templateData.rule_author;
        document.getElementById('tags').value = templateData.tags.join(', ');

        // 清空现有字符串并添加模板字符串
        const container = document.getElementById('strings-container');
        container.innerHTML = '';

        templateData.strings.forEach((str, index) => {
            const stringItem = document.createElement('div');
            stringItem.className = 'string-item';
            stringItem.innerHTML = `
                <div class="form-row">
                    <div class="form-group">
                        <label>字符串名称</label>
                        <div class="input-with-icon">
                            <i class="fas fa-font"></i>
                            <input type="text" name="string_name[]" value="${str.name}">
                        </div>
                    </div>
                    <div class="form-group">
                        <label>字符串值</label>
                        <div class="input-with-icon">
                            <i class="fas fa-quote-right"></i>
                            <input type="text" name="string_value[]" value="${str.value}">
                        </div>
                    </div>
                    <div class="form-group">
                        <label>类型</label>
                        <div class="select-with-icon">
                            <i class="fas fa-code"></i>
                            <select name="string_type[]">
                                <option value="text" ${str.type === 'text' ? 'selected' : ''}>文本</option>
                                <option value="hex" ${str.type === 'hex' ? 'selected' : ''}>十六进制</option>
                                <option value="regex" ${str.type === 'regex' ? 'selected' : ''}>正则表达式</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>操作</label>
                        <button type="button" class="remove-string btn-danger" title="删除字符串">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
            container.appendChild(stringItem);
        });

        // 设置条件
        document.getElementById('conditions').value = templateData.conditions;

        // 切换到手动创建标签
        document.querySelector('.tab-button[data-tab="manual"]').click();
        document.getElementById('rule-form').scrollIntoView({ behavior: 'smooth' });
    })
    .catch(error => {
        console.error('获取模板失败:', error);
        alert('获取模板时出错，请查看控制台了解详情');
    });
}

function clearHistory() {
    if (confirm('确定要清空所有历史记录吗？此操作不可撤销。')) {
        // 调用后端API清空历史记录
        fetch('/clear_history', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                alert('清空失败: ' + data.error);
            } else {
                // 清空历史记录容器
                document.getElementById('rules-history-container').innerHTML = `
                    <div class="empty-history">
                        <i class="fas fa-inbox"></i>
                        <p>暂无历史记录</p>
                        <p>创建规则后会自动保存到这里</p>
                    </div>
                `;
                alert(data.message);
            }
        })
        .catch(error => {
            console.error('清空失败:', error);
            alert('清空历史记录时出错，请查看控制台了解详情');
        });
    }
}

function searchHistory(query) {
    // 调用后端API搜索历史记录
    fetch('/search_history', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query: query })
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            console.error('搜索失败:', data.error);
            return;
        }

        // 更新历史记录显示
        const container = document.getElementById('rules-history-container');
        if (data.length === 0) {
            container.innerHTML = `
                <div class="empty-history">
                    <i class="fas fa-search"></i>
                    <p>未找到匹配的记录</p>
                    <p>尝试使用不同的关键词搜索</p>
                </div>
            `;
        } else {
            // 这里应该渲染搜索结果
            console.log('搜索结果:', data);
            // 实际应用中应该渲染搜索结果到页面
        }
    })
    .catch(error => {
        console.error('搜索失败:', error);
    });
}

function testRule() {
    alert('规则测试功能需要后端支持，这里仅作演示。');
    // 这里应该实现规则测试功能，允许用户上传样本文件来测试规则
}

function saveRule() {
    const ruleText = document.getElementById('generated-rule').textContent;
    const ruleName = document.getElementById('rule_name').value || document.getElementById('file_rule_name').value || 'yara_rule';
    const ruleDescription = document.getElementById('rule_description').value || document.getElementById('file_rule_description').value || '';
    const ruleAuthor = document.getElementById('rule_author').value || document.getElementById('file_rule_author').value || '';

    // 获取标签
    const tagsInput = document.getElementById('tags') || document.getElementById('file_tags');
    const tags = tagsInput && tagsInput.value ? tagsInput.value.split(',').map(tag => tag.trim()).filter(tag => tag) : [];

    // 发送到后端保存
    fetch('/save_rule', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            rule: ruleText,
            rule_name: ruleName,
            rule_description: ruleDescription,
            rule_author: ruleAuthor,
            tags: tags
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            alert('保存失败: ' + data.error);
        } else {
            alert(data.message);
        }
    })
    .catch(error => {
        console.error('保存失败:', error);
        alert('保存规则时出错，请查看控制台了解详情');
    });
}

// 规则编辑器功能
function initEditor() {
    const editor = document.getElementById('yara-editor');
    const statusElement = document.getElementById('editor-status');

    if (!editor) return;

    // 简单的光标位置更新
    editor.addEventListener('input', updateCursorPosition);
    editor.addEventListener('click', updateCursorPosition);
    editor.addEventListener('keyup', updateCursorPosition);

    function updateCursorPosition() {
        const lines = editor.value.substr(0, editor.selectionStart).split('\n');
        const line = lines.length;
        const col = lines[lines.length - 1].length + 1;
        document.getElementById('cursor-position').textContent = `行 ${line}, 列 ${col}`;
    }

    // 绑定按钮事件 - 添加错误保护
    try {
        const formatBtn = document.getElementById('format-rule');
        const clearBtn = document.getElementById('clear-editor');
        const loadBtn = document.getElementById('load-template-editor');
        const validateBtn = document.getElementById('validate-editor');
        const saveBtn = document.getElementById('save-editor');

        if (formatBtn) formatBtn.addEventListener('click', formatYaraRule);
        if (clearBtn) clearBtn.addEventListener('click', clearEditor);
        if (loadBtn) loadBtn.addEventListener('click', loadTemplateToEditor);
        if (validateBtn) validateBtn.addEventListener('click', validateEditorRule);
        if (saveBtn) saveBtn.addEventListener('click', saveEditorRule);
    } catch (error) {
        console.log('编辑器按钮绑定错误:', error);
    }
}

function clearEditor() {
    if (confirm('确定要清空编辑器内容吗？')) {
        document.getElementById('yara-editor').value = '';
        document.getElementById('editor-status').textContent = '内容已清空';
        setTimeout(() => document.getElementById('editor-status').textContent = '就绪', 2000);
    }
}

function formatYaraRule() {
    const editor = document.getElementById('yara-editor');
    if (!editor.value.trim()) return;

    // 简单的格式化
    let rule = editor.value;
    rule = rule.replace(/\s*{\s*/g, ' {\n    ');
    rule = rule.replace(/;\s*/g, ';\n    ');
    rule = rule.replace(/\s*}\s*/g, '\n}\n');

    editor.value = rule;
    document.getElementById('editor-status').textContent = '格式化完成';
    setTimeout(() => document.getElementById('editor-status').textContent = '就绪', 2000);
}

function loadTemplateToEditor() {
    const templateType = prompt('选择模板类型 (pe/elf/pdf/office):', 'pe');
    if (!templateType) return;

    fetch(`/get_template/${templateType}`)
        .then(response => response.json())
        .then(templateData => {
            if (templateData.error) {
                alert('错误: ' + templateData.error);
                return;
            }

            // 构建YARA规则文本
            const rule = buildYaraRuleText(templateData);
            document.getElementById('yara-editor').value = rule;

            const statusElement = document.getElementById('editor-status');
            statusElement.textContent = '模板已加载';
            setTimeout(() => statusElement.textContent = '就绪', 2000);
        })
        .catch(error => {
            console.error('加载模板失败:', error);
            alert('加载模板时出错');
        });
}

function buildYaraRuleText(templateData) {
    const lines = [];

    // 标签
    const tagStr = templateData.tags && templateData.tags.length > 0 ? ` : ${templateData.tags.join(' ')}` : '';
    lines.push(`rule ${templateData.rule_name}${tagStr}`);
    lines.push('{');

    // Meta部分
    const metaLines = [];
    if (templateData.rule_author) {
        metaLines.push(`    author = "${templateData.rule_author}"`);
    }
    if (templateData.rule_description) {
        metaLines.push(`    description = "${templateData.rule_description}"`);
    }

    if (metaLines.length > 0) {
        lines.push('    meta:');
        metaLines.forEach(line => lines.push(line));
    }

    // Strings部分
    if (templateData.strings && templateData.strings.length > 0) {
        lines.push('    strings:');
        templateData.strings.forEach(str => {
            if (str.type === 'hex') {
                lines.push(`        ${str.name} = { ${str.value} }`);
            } else if (str.type === 'regex') {
                lines.push(`        ${str.name} = /${str.value}/`);
            } else {
                lines.push(`        ${str.name} = "${str.value}"`);
            }
        });
    }

    // Condition部分
    if (templateData.conditions) {
        lines.push('    condition:');
        const conditions = templateData.conditions.split('\n');
        conditions.forEach(condition => {
            if (condition.trim()) {
                lines.push(`        ${condition.trim()}`);
            }
        });
    }

    lines.push('}');
    return lines.join('\n');
}

function validateEditorRule() {
    const ruleText = document.getElementById('yara-editor').value;

    if (!ruleText.trim()) {
        document.getElementById('editor-status').textContent = '规则内容为空';
        setTimeout(() => document.getElementById('editor-status').textContent = '就绪', 2000);
        return;
    }

    // 简单验证
    const errors = [];
    if (!ruleText.includes('rule')) errors.push('缺少rule关键字');
    if (!ruleText.includes('{') || !ruleText.includes('}')) errors.push('缺少大括号');
    if (!ruleText.includes('condition:')) errors.push('缺少condition部分');

    const resultDiv = document.getElementById('editor-validation-result');
    resultDiv.classList.remove('hidden');

    if (errors.length === 0) {
        resultDiv.className = 'validation-result validation-success';
        resultDiv.innerHTML = '<i class="fas fa-check-circle"></i> 规则格式正确';
    } else {
        resultDiv.className = 'validation-result validation-error';
        resultDiv.innerHTML = '<i class="fas fa-exclamation-circle"></i> ' + errors.join(', ');
    }

    setTimeout(() => {
        document.getElementById('editor-status').textContent = '就绪';
        resultDiv.classList.add('hidden');
    }, 3000);
}

function saveEditorRule() {
    const ruleText = document.getElementById('yara-editor').value;

    if (!ruleText.trim()) {
        document.getElementById('editor-status').textContent = '规则内容为空';
        setTimeout(() => document.getElementById('editor-status').textContent = '就绪', 2000);
        return;
    }

    const ruleNameMatch = ruleText.match(/rule\s+(\w+)/);
    const ruleName = ruleNameMatch ? ruleNameMatch[1] : 'editor_rule';

    fetch('/save_rule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            rule: ruleText,
            rule_name: ruleName,
            rule_description: '编辑器规则',
            rule_author: '用户',
            tags: ['editor']
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            alert('保存失败: ' + data.error);
        } else {
            alert(data.message);
        }
    })
    .catch(error => {
        console.error('保存失败:', error);
        alert('保存规则时出错');
    });
}

// 在线查杀功能
function initScanner() {
    // 扫描文件上传功能
    const scanUploadArea = document.getElementById('scan-upload-area');
    const scanFileInput = document.getElementById('scan-file-input');
    const selectScanFileButton = document.getElementById('select-scan-file');

    if (!scanUploadArea) return;

    // 点击上传区域或按钮选择文件
    scanUploadArea.addEventListener('click', function(e) {
        if (e.target !== selectScanFileButton) {
            scanFileInput.click();
        }
    });

    selectScanFileButton?.addEventListener('click', function() {
        scanFileInput.click();
    });

    // 文件选择后处理
    scanFileInput.addEventListener('change', function() {
        if (this.files.length > 0) {
            displayScanFileInfo(this.files[0]);
        }
    });

    // 拖拽上传功能
    scanUploadArea.addEventListener('dragover', function(e) {
        e.preventDefault();
        this.classList.add('dragover');
    });

    scanUploadArea.addEventListener('dragleave', function(e) {
        e.preventDefault();
        this.classList.remove('dragover');
    });

    scanUploadArea.addEventListener('drop', function(e) {
        e.preventDefault();
        this.classList.remove('dragover');

        if (e.dataTransfer.files.length > 0) {
            scanFileInput.files = e.dataTransfer.files;
            displayScanFileInfo(e.dataTransfer.files[0]);
        }
    });

    // 规则源选择
    document.querySelectorAll('input[name="rule-source"]').forEach(radio => {
        radio.addEventListener('change', function() {
            const customRuleInput = document.getElementById('custom-rule-input');
            if (this.value === 'custom') {
                customRuleInput.classList.remove('hidden');
            } else {
                customRuleInput.classList.add('hidden');
            }
        });
    });

    // 开始扫描按钮 - 添加错误保护
    try {
        const startScanBtn = document.getElementById('start-scan');
        const clearScanBtn = document.getElementById('clear-scan');

        if (startScanBtn) startScanBtn.addEventListener('click', startScan);
        if (clearScanBtn) clearScanBtn.addEventListener('click', resetScan);
    } catch (error) {
        console.log('扫描按钮绑定错误:', error);
    }
}

function displayScanFileInfo(file) {
    const fileInfoDiv = document.getElementById('scan-file-info');
    const fileDetailsDiv = document.getElementById('scan-file-details');

    // 计算文件哈希（简单的模拟）
    const reader = new FileReader();
    reader.onload = function(e) {
        const arrayBuffer = e.target.result;
        const bytes = new Uint8Array(arrayBuffer);

        // 简单的文件信息
        const fileInfo = {
            filename: file.name,
            size: file.size,
            type: file.type || 'application/octet-stream',
            lastModified: new Date(file.lastModified).toLocaleString()
        };

        fileDetailsDiv.innerHTML = `
            <div class="file-details-grid">
                <div class="file-detail-item">
                    <div class="file-detail-label">文件名</div>
                    <div class="file-detail-value">${fileInfo.filename}</div>
                </div>
                <div class="file-detail-item">
                    <div class="file-detail-label">文件大小</div>
                    <div class="file-detail-value">${formatFileSize(fileInfo.size)}</div>
                </div>
                <div class="file-detail-item">
                    <div class="file-detail-label">文件类型</div>
                    <div class="file-detail-value">${fileInfo.type}</div>
                </div>
                <div class="file-detail-item">
                    <div class="file-detail-label">修改时间</div>
                    <div class="file-detail-value">${fileInfo.lastModified}</div>
                </div>
            </div>
        `;

        fileInfoDiv.classList.remove('hidden');
    };

    reader.readAsArrayBuffer(file.slice(0, Math.min(file.size, 1024 * 1024))); // 只读取前1MB
}

function startScan() {
    const scanFileInput = document.getElementById('scan-file-input');
    const progressBar = document.getElementById('scan-progress');
    const resultsDiv = document.getElementById('scan-results');

    if (!scanFileInput.files.length) {
        alert('请先选择要扫描的文件');
        return;
    }

    const ruleSource = document.querySelector('input[name="rule-source"]:checked').value;
    let yaraRule = '';

    // 获取YARA规则
    if (ruleSource === 'editor') {
        yaraRule = document.getElementById('yara-editor').value;
    } else if (ruleSource === 'custom') {
        yaraRule = document.getElementById('scanner-custom-rule').value;
    }

    if (!yaraRule.trim() &amp;&amp; ruleSource !== 'manual' &amp;&amp; ruleSource !== 'file') {
        alert('YARA规则不能为空');
        return;
    }

    // 显示进度条
    progressBar.classList.remove('hidden');

    // 简单的进度动画
    let progress = 0;
    const progressInterval = setInterval(() => {
        progress += 10;
        if (progress > 90) progress = 90;
        progressBar.querySelector('.progress-fill').style.width = progress + '%';
        progressBar.querySelector('.progress-text').textContent = `扫描中... ${progress}%`;
    }, 200);

    // 使用后端API进行扫描
    const formData = new FormData();
    formData.append('file', scanFileInput.files[0]);
    formData.append('rule_source', ruleSource);
    if (ruleSource === 'editor') {
        formData.append('editor_rule', yaraRule);
    } else if (ruleSource === 'custom') {
        formData.append('custom_rule', yaraRule);
    }

    fetch('/scan_file', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        clearInterval(progressInterval);
        progressBar.querySelector('.progress-fill').style.width = '100%';
        progressBar.querySelector('.progress-text').textContent = '扫描完成!';

        setTimeout(() => {
            progressBar.classList.add('hidden');
            progressBar.querySelector('.progress-fill').style.width = '0%';

            if (data.error) {
                alert('扫描失败: ' + data.error);
            } else {
                displayRealScanResults(data.result);
                resultsDiv.classList.remove('hidden');
                resultsDiv.scrollIntoView({ behavior: 'smooth' });
            }
        }, 1000);
    })
    .catch(error => {
        clearInterval(progressInterval);
        progressBar.classList.add('hidden');
        console.error('扫描失败:', error);
        alert('扫描文件时出错');
    });
}

function collectManualFormData() {
    const ruleName = document.getElementById('rule_name').value;
    if (!ruleName) return null;

    return {
        rule_name: ruleName,
        rule_description: document.getElementById('rule_description').value,
        rule_author: document.getElementById('rule_author').value,
        tags: document.getElementById('tags').value ? document.getElementById('tags').value.split(',').map(tag => tag.trim()).filter(tag => tag) : [],
        strings: [],
        conditions: document.getElementById('conditions').value
    };
}

function collectFileFormData() {
    const ruleName = document.getElementById('file_rule_name').value;
    if (!ruleName) return null;

    return {
        rule_name: ruleName,
        rule_description: document.getElementById('file_rule_description').value,
        rule_author: document.getElementById('file_rule_author').value,
        tags: document.getElementById('file_tags').value ? document.getElementById('file_tags').value.split(',').map(tag => tag.trim()).filter(tag => tag) : [],
        strings: [],
        conditions: document.getElementById('file_conditions').value
    };
}

function displayScanResults(file, yaraRule) {
    const resultsContent = document.getElementById('scan-results-content');

    // 模拟扫描结果
    const isMatched = Math.random() > 0.7; // 30%概率匹配
    const ruleNameMatch = yaraRule.match(/rule\s+(\w+)/);
    const ruleName = ruleNameMatch ? ruleNameMatch[1] : 'unknown_rule';

    let resultHTML = '';

    if (isMatched) {
        resultHTML = `
            <div class="scan-result-item matched">
                <div class="result-rule-name">
                    <i class="fas fa-exclamation-triangle"></i> 检测到匹配: ${ruleName}
                </div>
                <div class="result-rule-description">
                    文件 "${file.name}" 匹配了YARA规则 ${ruleName}
                </div>
                <div class="result-matched-strings">
                    匹配的字符串: $a, $b, $header
                </div>
                <div class="result-file-info">
                    文件大小: ${formatFileSize(file.size)} |
                    扫描时间: ${new Date().toLocaleString()}
                </div>
            </div>
        `;
    } else {
        resultHTML = `
            <div class="scan-result-item not-matched">
                <div class="result-rule-name">
                    <i class="fas fa-check-circle"></i> 未检测到威胁
                </div>
                <div class="result-rule-description">
                    文件 "${file.name}" 未匹配任何已知的恶意模式
                </div>
                <div class="result-file-info">
                    文件大小: ${formatFileSize(file.size)} |
                    扫描时间: ${new Date().toLocaleString()}
                </div>
            </div>
        `;
    }

    resultsContent.innerHTML = resultHTML;
}

function displayRealScanResults(scanResult) {
    const resultsContent = document.getElementById('scan-results-content');

    let resultHTML = '';

    if (scanResult.matched) {
        resultHTML = `
            <div class="scan-result-item matched">
                <div class="result-rule-name">
                    <i class="fas fa-exclamation-triangle"></i> 检测到匹配: ${scanResult.rule_name}
                </div>
                <div class="result-rule-description">
                    文件 "${scanResult.file_info.filename}" 匹配了YARA规则
                </div>
                ${scanResult.matched_strings.length > 0 ? `<div class="result-matched-strings">匹配: ${scanResult.matched_strings.join(', ')}</div>` : ''}
            </div>
        `;
    } else {
        resultHTML = `
            <div class="scan-result-item not-matched">
                <div class="result-rule-name">
                    <i class="fas fa-check-circle"></i> 未检测到威胁
                </div>
                <div class="result-rule-description">
                    文件 "${scanResult.file_info.filename}" 未匹配规则
                </div>
            </div>
        `;
    }

    resultsContent.innerHTML = resultHTML;
}

function resetScan() {
    if (confirm('确定要重置扫描吗？')) {
        document.getElementById('scan-file-input').value = '';
        document.getElementById('scan-file-info').classList.add('hidden');
        document.getElementById('scan-results').classList.add('hidden');
        document.getElementById('scanner-custom-rule').value = '';
        document.querySelector('input[name="rule-source"][value="editor"]').checked = true;
        document.getElementById('custom-rule-input').classList.add('hidden');
    }
}