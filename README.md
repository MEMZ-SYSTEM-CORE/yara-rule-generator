# 🛡️ YARA Rule Generator 2026

<div align="center">

![YARA Generator](https://img.shields.io/badge/YARA-Rule%20Generator%202026-cyan?style=for-the-badge&logo=shield)
![React](https://img.shields.io/badge/React-2026-blue?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

**AI驱动的恶意软件检测规则生成平台**

</div>

---

## 📋 目录

- [✨ 功能特性](#-功能特性)
- [🚀 快速开始](#-快速开始)
- [🎯 使用指南](#-使用指南)
- [🛠️ 技术栈](#️-技术栈)
- [📄 许可证](#-许可证)

---

## ✨ 功能特性

### 🤖 AI智能规则生成
- 基于机器学习的行为分析
- 自动检测C2通信、持久化机制、加密行为
- 零样本学习和迁移学习支持
- AI生成的规则可直接编辑和使用

### 📝 规则生成器
- 可视化规则配置界面
- 支持文本、十六进制、正则表达式
- 自定义匹配条件
- 规则模板库（恶意软件、勒索软件、C2检测等）

### 🔍 文件分析
- 熵值计算（检测加壳文件）
- 多种文件类型识别（PE、ELF、PDF、ZIP等）
- 哈希值计算（MD5/SHA1/SHA256）
- 字符串提取
- 十六进制查看

### 📊 批量分析
- 支持拖拽多个文件
- 实时进度显示
- 详细分析结果表格
- 威胁检测统计

### 📈 统计仪表板
- 规则数量统计
- 恶意软件家族分布
- 检测性能趋势图
- 云端同步状态

### 💾 规则管理
- 保存/收藏规则
- 版本历史管理
- 导入/导出（YARA、Sigma、Snort、IOC格式）
- 规则分享功能

### 🎨 现代化界面
- 深色/浅色主题切换
- 响应式设计
- 毛玻璃效果
- 流畅动画过渡
- Toast通知系统

---

## 🚀 快速开始

### 环境要求

- Node.js 18.0+
- npm 或 yarn

### 安装

```bash
# 克隆仓库
git clone https://github.com/MEMZ-SYSTEM-CORE/yara-rule-generator.git
cd yara-generator

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

### 构建生产版本

```bash
# 构建
npm run build

# 预览生产版本
npm run preview
```

---

## 🎯 使用指南

### 创建YARA规则

1. 打开应用，进入 **生成** 标签
2. 填写规则基本信息（名称、描述、作者）
3. 添加字符串特征（文本、十六进制、正则）
4. 设置匹配条件
5. 点击 **生成YARA规则**
6. 保存或导出规则

### 测试规则

1. 进入 **测试** 标签
2. 粘贴或编写YARA规则
3. 上传测试文件
4. 点击 **执行测试**
5. 查看匹配结果

### 文件分析

1. 进入 **分析** 标签
2. 拖拽或上传文件
3. 查看分析结果
4. 点击 **一键生成YARA规则**

### 批量分析

1. 进入 **批量** 标签
2. 拖拽多个文件到上传区域
3. 等待分析完成
4. 查看检测结果统计

### 使用AI生成

1. 进入 **AI** 标签
2. 描述恶意软件特征
3. 点击 **AI生成规则**
4. 查看并编辑生成的规则

---

## 🛠️ 技术栈

| 技术 | 用途 |
|------|------|
| React 18 | 前端框架 |
| TypeScript | 类型安全 |
| Vite | 构建工具 |
| Tailwind CSS | 样式框架 |
| Monaco Editor | 代码编辑器 |
| Zustand | 状态管理 |
| Lucide React | 图标库 |

---

## 📄 许可证

本项目采用 MIT 许可证 - 详情请查看 [LICENSE](LICENSE) 文件。

---

## 📊 项目统计

<div align="center">

![GitHub stars](https://img.shields.io/github/stars/MEMZ-SYSTEM-CORE/yara-rule-generator?style=for-the-badge)
![GitHub forks](https://img.shields.io/github/forks/MEMZ-SYSTEM-CORE/yara-rule-generator?style=for-the-badge)

</div>

---

<div align="center">

**用 ❤️ 制作 by MEMZ-SYSTEM-CORE**

*让恶意软件检测变得更简单*

</div>
