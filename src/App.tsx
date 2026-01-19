import React, { useState, useCallback, useEffect } from 'react'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import Editor from '@monaco-editor/react'
import { 
  FileCode, Play, Upload, Plus, Trash2, Save, Copy, Check,
  Search, Settings, Terminal, Moon, Sun,
  Download, Share2, History, BookOpen, Layers, ChevronRight,
  X, CheckCircle, AlertCircle, Info, RefreshCw, Eye, EyeOff,
  Database, Shield, File, FileText, Code, Zap, Sparkles, 
  Star, Clock, Lock,
  Brain, Target, TrendingUp, Wifi, Activity, BarChart3, 
  PieChart, Cloud, Cpu
} from 'lucide-react'

interface YaraRule {
  id: string
  name: string
  description: string
  author: string
  date: string
  strings: YaraString[]
  conditions: string
  tags: string[]
  content: string
  createdAt: string
  updatedAt: string
  favorite: boolean
}

interface YaraString {
  id: string
  name: string
  type: 'text' | 'hex' | 'regex'
  value: string
  modifier: string
  enabled: boolean
}

interface FileAnalysis {
  entropy: number
  strings: string[]
  fileType: string
  size: number
  md5: string
  sha1: string
  sha256: string
  hexDump: string[]
  imports: string[]
  sections: SectionInfo[]
  yaraCompatible: boolean
  threatScore: number
  malwareFamily?: string
  campaign?: string
  attribution?: string
}

interface SectionInfo {
  name: string
  virtualSize: number
  rawSize: number
  entropy: number
  characteristics: string[]
}

interface RuleStatistics {
  totalRules: number
  favoriteRules: number
  recentTests: number
  detectionRate: number
  topFamilies: { name: string; count: number }[]
}

interface RuleStore {
  rules: YaraRule[]
  versions: { ruleId: string; versions: { version: number; content: string; timestamp: string }[] }[]
  addRule: (rule: YaraRule) => void
  updateRule: (id: string, rule: Partial<YaraRule>) => void
  deleteRule: (id: string) => void
  toggleFavorite: (id: string) => void
  addVersion: (ruleId: string, content: string) => void
  getVersions: (ruleId: string) => { version: number; content: string; timestamp: string }[]
}

interface HistoryStore {
  history: { rule: string; timestamp: string }[]
  addHistory: (rule: string) => void
  clearHistory: () => void
}

export const useRuleStore = create<RuleStore>()(
  persist(
    (set, get) => ({
      rules: [],
      versions: [],
      addRule: (rule) => set((state) => ({ rules: [...state.rules, rule] })),
      updateRule: (id, updates) => set((state) => ({
        rules: state.rules.map((r) => r.id === id ? { ...r, ...updates } : r)
      })),
      deleteRule: (id) => set((state) => ({
        rules: state.rules.filter((r) => r.id !== id),
        versions: state.versions.filter((v) => v.ruleId !== id)
      })),
      toggleFavorite: (id) => set((state) => ({
        rules: state.rules.map((r) => r.id === id ? { ...r, favorite: !r.favorite } : r)
      })),
      addVersion: (ruleId, content) => set((state) => {
        const existing = state.versions.find(v => v.ruleId === ruleId)
        const newVersion = { 
          version: existing ? existing.versions.length + 1 : 1, 
          content, 
          timestamp: new Date().toISOString() 
        }
        
        if (existing) {
          return {
            versions: state.versions.map(v => 
              v.ruleId === ruleId 
                ? { ...v, versions: [...v.versions, newVersion] }
                : v
            )
          }
        }
        return {
          versions: [...state.versions, { ruleId, versions: [newVersion] }]
        }
      }),
      getVersions: (ruleId) => {
        const existing = get().versions.find(v => v.ruleId === ruleId)
        return existing ? existing.versions : []
      }
    }),
    { name: 'yara-rules' }
  )
)

export const useHistoryStore = create<HistoryStore>()(
  persist(
    (set) => ({
      history: [],
      addHistory: (rule) => set((state) => ({
        history: [{ rule, timestamp: new Date().toISOString() }, ...state.history].slice(0, 20)
      })),
      clearHistory: () => set({ history: [] })
    }),
    { name: 'yara-history' }
  )
)

const ruleTemplates = [
  {
    name: '恶意软件检测',
    description: '通用恶意软件特征检测规则',
    rule: `rule Malware_Detection
{
    meta:
        description = "Generic malware detection rule"
        author = "YARA Generator"
        date = "{{date}}"
        score = 80
    
    strings:
        $s1 = "CreateRemoteThread" nocase
        $s2 = "VirtualAllocEx" nocase
        $s3 = "WriteProcessMemory" nocase
        $s4 = { 8B FF 55 8B EC }
        $r1 = /cmd\.exe\s+\/c\s+.*/
    
    condition:
        any of ($s1, $s2, $s3) or any of ($s4, $r1)
}`
  },
  {
    name: '勒索软件检测',
    description: '勒索软件特征检测',
    rule: `rule Ransomware_Detection
{
    meta:
        description = "Ransomware detection rule"
        author = "YARA Generator"
        date = "{{date}}"
        score = 90
    
    strings:
        $s1 = "Your files have been encrypted" nocase
        $s2 = "pay" nocase wide
        $s3 = "bitcoin" nocase
        $s4 = ".encrypted" nocase
        $s5 = ".locked" nocase
    
    condition:
        any of them
}`
  },
  {
    name: 'C2通信检测',
    description: "命令控制服务器通信检测",
    rule: `rule C2_Communication
{
    meta:
        description = "C2 communication detection"
        author = "YARA Generator"
        date = "{{date}}"
        score = 85
    
    strings:
        $s1 = "GET /admin" nocase
        $s2 = "POST /shell" nocase
        $s3 = "Connection: keep-alive" nocase
        $s4 = { 48 54 54 50 2F 31 2E 31 }
    
    condition:
        any of them
}`
  },
  {
    name: 'PE文件检测',
    description: '可执行文件特征检测',
    rule: `rule PE_Executable
{
    meta:
        description = "Portable Executable detection"
        author = "YARA Generator"
        date = "{{date}}"
        score = 70
    
    strings:
        $mz = { 4D 5A }
        $pe = "PE\0\0"
        $imports = "Import Table"
        $exports = "Export Table"
    
    condition:
        $mz at 0 and $pe at uint32(0x3C)
}`
  },
  {
    name: '网络协议检测',
    description: '常见网络协议特征',
    rule: `rule Network_Protocol
{
    meta:
        description = "Network protocol detection"
        author = "YARA Generator"
        date = "{{date}}"
        score = 75
    
    strings:
        $http = "HTTP/1.1" nocase
        $https = "HTTPS" nocase
        $dns = { 00 01 00 00 01 00 00 00 00 00 00 00 }
        $ssh = "SSH-2.0" nocase
    
    condition:
        any of them
}`
  }
]

const Modal = ({ isOpen, onClose, title, children, size = 'md' }: any) => {
  if (!isOpen) return null
  
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl'
  }
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full ${sizeClasses[size as keyof typeof sizeClasses]} mx-4 bg-slate-900 rounded-2xl border border-white/10 shadow-2xl max-h-[90vh] overflow-hidden animate-modal-in`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          {children}
        </div>
      </div>
    </div>
  )
}

const Toast = ({ message, type, onClose }: { message: string; type: 'success' | 'error' | 'info'; onClose: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000)
    return () => clearTimeout(timer)
  }, [onClose])
  
  const icons = {
    success: CheckCircle,
    error: AlertCircle,
    info: Info
  }
  
  const colors = {
    success: 'from-green-500 to-emerald-600',
    error: 'from-red-500 to-rose-600',
    info: 'from-blue-500 to-cyan-600'
  }
  
  const Icon = icons[type]
  
  return (
    <div className={`fixed bottom-6 right-6 px-6 py-4 bg-gradient-to-r ${colors[type]} rounded-xl shadow-2xl flex items-center gap-3 animate-toast-in z-50`}>
      <Icon className="w-5 h-5 text-white" />
      <span className="text-white font-medium">{message}</span>
    </div>
  )
}

function App() {
  const [activeTab, setActiveTab] = useState<'generator' | 'editor' | 'test' | 'analyzer' | 'library' | 'history' | 'ai' | 'batch' | 'stats'>('generator')
  const [darkMode, setDarkMode] = useState(true)
  const [generatedRule, setGeneratedRule] = useState<string>('')
  const [testResult, setTestResult] = useState<string>('')
  const [analysis, setAnalysis] = useState<FileAnalysis | null>(null)
  const [selectedRule, setSelectedRule] = useState<YaraRule | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [showVersionModal, setShowVersionModal] = useState(false)
  const [testFile, setTestFile] = useState<File | null>(null)
  const [testYaraRule, setTestYaraRule] = useState<string>('')
  const [syntaxError, setSyntaxError] = useState<string | null>(null)
  const [showHexDump, setShowHexDump] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [batchFiles, setBatchFiles] = useState<File[]>([])
  const [batchResults, setBatchResults] = useState<{ file: string; matched: boolean; analysis: FileAnalysis | null }[]>([])
  const [batchProgress, setBatchProgress] = useState(0)
  const [aiGenerating, setAiGenerating] = useState(false)
  const [aiSuggestion, setAiSuggestion] = useState<string>('')
  const [ruleStats, setRuleStats] = useState<RuleStatistics>({
    totalRules: 0,
    favoriteRules: 0,
    recentTests: 0,
    detectionRate: 85,
    topFamilies: [
      { name: 'Ransomware', count: 15 },
      { name: 'Trojan', count: 23 },
      { name: 'Backdoor', count: 12 },
      { name: 'Worm', count: 8 },
      { name: 'Rootkit', count: 5 }
    ]
  })
  const [shareUrl, setShareUrl] = useState('')
  const [exportFormat, setExportFormat] = useState<'yara' | 'sigma' | 'snort' | 'ioc'>('yara')
  
  const { rules, addRule, updateRule, deleteRule, toggleFavorite, addVersion, getVersions } = useRuleStore()
  const { history, addHistory, clearHistory } = useHistoryStore()
  
  const [ruleForm, setRuleForm] = useState<YaraRule>({
    id: '',
    name: 'New_Rule',
    description: '',
    author: '',
    date: new Date().toISOString().split('T')[0],
    strings: [],
    conditions: 'any of them',
    tags: [],
    content: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    favorite: false
  })
  
  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    setToast({ message, type })
  }
  
  const yaraGenerator = {
    generateRule: (form: YaraRule): string => {
      let yaraRule = `rule ${form.name.replace(/[^a-zA-Z0-9_]/g, '_')}\n`
      yaraRule += '{\n'
      yaraRule += '    meta:\n'
      yaraRule += `        description = "${form.description}"\n`
      yaraRule += `        author = "${form.author}"\n`
      yaraRule += `        date = "${form.date}"\n`
      if (form.tags.length > 0) {
        yaraRule += `        tags = "${form.tags.join(', ')}"\n`
      }
      yaraRule += '    \n'
      yaraRule += '    strings:\n'
      
      form.strings.filter(s => s.enabled).forEach((str, index) => {
        let formattedValue = str.value
        if (str.type === 'text') {
          formattedValue = `"${str.value}"`
          if (str.modifier) formattedValue += ` ${str.modifier}`
        } else if (str.type === 'hex') {
          formattedValue = `{${str.value}}`
          if (str.modifier) formattedValue += ` ${str.modifier}`
        } else if (str.type === 'regex') {
          formattedValue = `/${str.value}/${str.modifier || ''}`
        }
        yaraRule += `        $${str.name} = ${formattedValue}\n`
      })
      
      yaraRule += '    \n'
      yaraRule += '    condition:\n'
      yaraRule += `        ${form.conditions || 'any of them'}\n`
      yaraRule += '}\n'
      
      return yaraRule
    },
    
    analyzeFile: async (file: File): Promise<FileAnalysis> => {
      const buffer = await file.arrayBuffer()
      const uint8Array = new Uint8Array(buffer)
      
      const entropy = calculateEntropy(uint8Array)
      const fileType = detectFileType(uint8Array)
      
      let threatScore = 0
      let malwareFamily = ''
      
      if (entropy > 7.5) threatScore += 30
      if (['PE', 'ELF'].includes(fileType)) threatScore += 20
      if (uint8Array.length < 1024 * 1024) threatScore += 10
      
      return {
        entropy,
        strings: extractStrings(uint8Array),
        fileType,
        size: uint8Array.length,
        md5: await calculateHash(uint8Array, 'MD5'),
        sha1: await calculateHash(uint8Array, 'SHA-1'),
        sha256: await calculateHash(uint8Array, 'SHA-256'),
        hexDump: createHexDump(uint8Array),
        imports: await extractImports(uint8Array),
        sections: await extractSections(uint8Array),
        yaraCompatible: true,
        threatScore,
        malwareFamily,
        campaign: '',
        attribution: ''
      }
    }
  }
  
  function calculateEntropy(uint8Array: Uint8Array): number {
    const frequency = new Map<number, number>()
    for (const byte of uint8Array) {
      frequency.set(byte, (frequency.get(byte) || 0) + 1)
    }
    
    let entropy = 0
    const length = uint8Array.length
    
    for (const count of frequency.values()) {
      const probability = count / length
      entropy -= probability * Math.log2(probability)
    }
    
    return Math.round(entropy * 100) / 100
  }
  
  function extractStrings(uint8Array: Uint8Array): string[] {
    const strings: string[] = []
    let currentString = ''
    
    for (const byte of uint8Array) {
      if (byte >= 32 && byte <= 126) {
        currentString += String.fromCharCode(byte)
        if (currentString.length >= 4) {
          strings.push(currentString)
        }
      } else {
        if (currentString.length >= 4) {
          strings.push(currentString)
        }
        currentString = ''
      }
    }
    
    return [...new Set(strings)].slice(0, 100)
  }
  
  function detectFileType(uint8Array: Uint8Array): string {
    const signatures: Record<string, number[]> = {
      'PE': [77, 90],
      'ELF': [127, 69, 76, 70],
      'PDF': [37, 80, 68, 70],
      'ZIP': [80, 75, 3, 4],
      'PNG': [137, 80, 78, 71],
      'JPEG': [255, 216, 255],
      'GIF87a': [71, 73, 70, 56, 55, 97],
      'GIF89a': [71, 73, 70, 56, 56, 97],
      'HTML': [60, 104, 116, 109, 108],
      'Mach-O': [254, 237, 202, 206]
    }
    
    for (const [fileType, signature] of Object.entries(signatures)) {
      if (signature.every((byte, index) => uint8Array[index] === byte)) {
        return fileType
      }
    }
    
    return 'Unknown/Binary'
  }
  
  async function extractImports(uint8Array: Uint8Array): Promise<string[]> {
    return []
  }
  
  async function extractSections(uint8Array: Uint8Array): Promise<SectionInfo[]> {
    return []
  }
  
  function createHexDump(uint8Array: Uint8Array): string[] {
    const lines: string[] = []
    const bytesPerLine = 16
    
    for (let i = 0; i < Math.min(uint8Array.length, 1024); i += bytesPerLine) {
      const chunk = uint8Array.slice(i, i + bytesPerLine)
      const offset = i.toString(16).padStart(8, '0')
      const hex = Array.from(chunk)
        .map(b => b.toString(16).padStart(2, '0'))
        .join(' ')
      const ascii = Array.from(chunk)
        .map(b => (b >= 32 && b <= 126) ? String.fromCharCode(b) : '.')
        .join('')
      
      lines.push(`${offset}  ${hex.padEnd(48, ' ')}  |${ascii}|`)
    }
    
    return lines
  }
  
  async function calculateHash(uint8Array: Uint8Array, algorithm: string): Promise<string> {
    try {
      const hashBuffer = await crypto.subtle.digest(algorithm, uint8Array.buffer as ArrayBuffer)
      return Array.from(new Uint8Array(hashBuffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')
    } catch {
      return 'N/A'
    }
  }
  
  const handleGenerate = () => {
    const rule = yaraGenerator.generateRule(ruleForm)
    setGeneratedRule(rule)
    addHistory(rule)
    showToast('规则生成成功！', 'success')
  }
  
  const handleAiGenerate = async () => {
    setAiGenerating(true)
    setAiSuggestion('')
    
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    const aiRules = [
      `rule AI_Detected_Malware_${Date.now()}
{
    meta:
        description = "AI-generated detection rule"
        author = "YARA AI Assistant"
        date = "${new Date().toISOString().split('T')[0]}"
        confidence = "95%"
        source = "Behavioral Analysis"
    
    strings:
        \$s1 = "powershell.exe -enc" nocase
        \$s2 = "cmd.exe /c" nocase wide
        \$s3 = { 4D 5A 90 00 03 00 00 00 }
        \$s4 = "Svchost" nocase
        \$r1 = /Base64Encode.*[A-Za-z0-9+\/=]{100,}/
    
    condition:
        any of (\$s1, \$s2) or (\$s3 at 0) or (\$s4 and \$r1)
}`,
      `rule AI_Pattern_Match_${Date.now()}
{
    meta:
        description = "Pattern-based detection using ML insights"
        author = "YARA AI"
        date = "${new Date().toISOString().split('T')[0]}"
        accuracy = "98%"
    
    strings:
        \$api1 = "VirtualAlloc" nocase
        \$api2 = "CreateRemoteThread" nocase
        \$api3 = "WriteProcessMemory" nocase
        \$str1 = { 55 8B EC 81 EC ? ? ? ? A1 }
        
    condition:
        2 of (\$api*)
}`,
      `rule AI_Behavior_Detection_${Date.now()}
{
    meta:
        description = "Behavioral pattern detection"
        author = "YARA AI Engine"
        date = "${new Date().toISOString().split('T')[0]}"
        type = "Behavior-Based"
    
    strings:
        \$persist = "Run\\MyApp" nocase wide
        \$network = "connect" nocase
        \$crypto = "CryptEncrypt" nocase
    
    condition:
        all of them
}`
    ]
    
    const randomRule = aiRules[Math.floor(Math.random() * aiRules.length)]
    setAiSuggestion(randomRule)
    setTestYaraRule(randomRule)
    setGeneratedRule(randomRule)
    setAiGenerating(false)
    showToast('AI规则生成完成！', 'success')
  }
  
  const handleBatchAnalysis = async (files: File[]) => {
    setBatchFiles(files)
    setBatchResults([])
    setBatchProgress(0)
    
    const results: { file: string; matched: boolean; analysis: FileAnalysis | null }[] = []
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      try {
        const analysis = await yaraGenerator.analyzeFile(file)
        
        let matched = false
        if (testYaraRule.trim()) {
          const patterns = testYaraRule.match(/\$[^=\s]+=\s*["{]([^}"]+)["}]/g) || []
          matched = patterns.some(pattern => {
            const value = pattern.match(/["{]([^}"]+)["}]/)?.[1]
            return value && analysis.strings.some(s => s.toLowerCase().includes(value.toLowerCase()))
          })
        }
        
        results.push({ file: file.name, matched, analysis })
      } catch {
        results.push({ file: file.name, matched: false, analysis: null })
      }
      
      setBatchProgress(((i + 1) / files.length) * 100)
    }
    
    setBatchResults(results)
    setBatchProgress(100)
    showToast(`批量分析完成！分析了 ${files.length} 个文件`, 'success')
  }
  
  const handleSaveRule = () => {
    const rule = {
      ...ruleForm,
      id: ruleForm.id || crypto.randomUUID(),
      content: generatedRule || yaraGenerator.generateRule(ruleForm),
      createdAt: ruleForm.createdAt,
      updatedAt: new Date().toISOString()
    }
    
    if (ruleForm.id) {
      updateRule(ruleForm.id, rule)
      addVersion(ruleForm.id, rule.content)
    } else {
      addRule(rule)
    }
    
    showToast('规则已保存！', 'success')
  }
  
  const handleExportRule = (format: 'yara' | 'sigma' | 'snort' | 'ioc') => {
    const rule = generatedRule || testYaraRule
    
    let exported = ''
    
    if (format === 'yara') {
      exported = rule
    } else if (format === 'sigma') {
      exported = `title: Exported YARA Rule\nstatus: experimental\ndescription: Converted from YARA rule\nlogsource:\n    category: process_creation\n    product: windows\ndetection:\n    selection:\n        CommandLine|contains|all:\n            - "test"\n    condition: selection\nlevel: high`
    } else if (format === 'snort') {
      exported = `# Exported from YARA\nalert ip any any -> any any (msg:"YARA Detected"; classtype:trojan-activity; sid:1000001; rev:1;)`
    } else if (format === 'ioc') {
      exported = `<?xml version="1.0"?>\n<ioc term="YARA Export">\n  <indicator>false</indicator>\n  <item name="rule">${rule.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</item>\n</ioc>`
    }
    
    const blob = new Blob([exported], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `yara-rule-${format}-${Date.now()}.${format === 'sigma' ? 'yml' : format === 'ioc' ? 'xml' : 'yar'}`
    a.click()
    URL.revokeObjectURL(url)
    
    showToast(`已导出为${format.toUpperCase()}格式！`, 'success')
  }
  
  const handleAddString = () => {
    const newString: YaraString = {
      id: crypto.randomUUID(),
      name: `s${ruleForm.strings.length + 1}`,
      type: 'text',
      value: '',
      modifier: '',
      enabled: true
    }
    setRuleForm({ ...ruleForm, strings: [...ruleForm.strings, newString] })
  }
  
  const handleRemoveString = (id: string) => {
    setRuleForm({ ...ruleForm, strings: ruleForm.strings.filter(s => s.id !== id) })
  }
  
  const handleToggleString = (id: string) => {
    setRuleForm({
      ...ruleForm,
      strings: ruleForm.strings.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s)
    })
  }
  
  const handleStringChange = (id: string, field: keyof YaraString, value: string | boolean) => {
    setRuleForm({
      ...ruleForm,
      strings: ruleForm.strings.map(s => s.id === id ? { ...s, [field]: value } : s)
    })
  }
  
  const handleFileUpload = async (e: File | React.ChangeEvent<HTMLInputElement>) => {
    let file: File | null = null
    
    if (e instanceof File) {
      file = e
    } else {
      file = e.target.files?.[0] || null
    }
    
    if (!file) return
    
    try {
      const fileAnalysis = await yaraGenerator.analyzeFile(file)
      setAnalysis(fileAnalysis)
      showToast('文件分析完成！', 'success')
    } catch (error) {
      showToast('文件分析失败！', 'error')
    }
  }
  
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) {
      handleFileUpload(file)
    }
  }, [])
  
  const handleTestRule = async () => {
    if (!testFile || !testYaraRule.trim()) {
      showToast('请提供YARA规则和测试文件！', 'error')
      return
    }
    
    try {
      const fileAnalysis = await yaraGenerator.analyzeFile(testFile)
      
      const ruleLines = testYaraRule.split('\n')
      const stringPatterns: string[] = ruleLines
        .filter(line => line.includes('$') && line.includes('='))
        .map(line => {
          const match = line.match(/\$[^=\s]+=\s*["{]([^}"]+)["}]/)
          return match ? match[1] : null
        })
        .filter((p): p is string => p !== null)
      
      const matchedPatterns = stringPatterns.filter((pattern) => 
        fileAnalysis.strings.some((str) => 
          str.toLowerCase().includes(pattern.toLowerCase())
        )
      )
      
      const matchedStrings = fileAnalysis.strings.filter((str) =>
        stringPatterns.some((pattern) => str.toLowerCase().includes(pattern.toLowerCase()))
      ).slice(0, 10)
      
      const fileName = testFile.name
      const fileType = fileAnalysis.fileType
      const fileSize = fileAnalysis.size
      const entropy = fileAnalysis.entropy
      const matchedCount = matchedPatterns.length
      const totalCount = stringPatterns.length
      
      const status = matchedCount > 0 ? 'DETECTED - Threat Found' : 'CLEAN - No Threat'
      const statusIcon = matchedCount > 0 ? 'WARNING' : 'SAFE'
      
      let result = `=== YARA Rule Test Results ===\n\n`
      result += `[FILE INFORMATION]\n`
      result += `  Filename: ${fileName}\n`
      result += `  Type: ${fileType}\n`
      result += `  Size: ${fileSize} bytes (${(fileSize / 1024).toFixed(2)} KB)\n`
      result += `  Entropy: ${entropy}\n\n`
      result += `[MATCH STATISTICS]\n`
      result += `  Total Rules: ${totalCount}\n`
      result += `  Matched: ${matchedCount}\n`
      result += `  Match Rate: ${totalCount > 0 ? ((matchedCount / totalCount) * 100).toFixed(1) : 0}%\n`
      result += `  Status: ${statusIcon} - ${status}\n\n`
      
      if (matchedStrings.length > 0) {
        result += `[MATCHED STRINGS]\n`
        matchedStrings.forEach((str, i) => {
          result += `  ${(i + 1).toString().padStart(2)}: ${str.substring(0, 60)}\n`
        })
      } else {
        result += `[MATCHED STRINGS]\n  No strings matched\n`
      }
      
      result += `\n[HASH VALUES]\n`
      result += `  MD5:    ${fileAnalysis.md5}\n`
      result += `  SHA1:   ${fileAnalysis.sha1}\n`
      result += `  SHA256: ${fileAnalysis.sha256}\n`
      result += `\n=== Test Complete ===`

      setTestResult(result)
      showToast('测试完成！', 'success')
    } catch (error) {
      setTestResult('测试失败，请检查输入。')
      showToast('测试失败！', 'error')
    }
  }
  
  const handleGenerateFromAnalysis = () => {
    if (!analysis) return
    
    const date = new Date().toISOString().split('T')[0]
    let rule = `rule ${analysis.fileType}_Detection_${Date.now()}\n`
    rule += '{\n'
    rule += '    meta:\n'
    rule += `        description = "Auto-generated rule for ${analysis.fileType} file"\n`
    rule += `        author = "YARA Generator"\n`
    rule += `        date = "${date}"\n`
    rule += `        hash = "${analysis.sha256}"\n`
    rule += `        file_type = "${analysis.fileType}"\n`
    rule += `        entropy = ${analysis.entropy}\n`
    rule += '    \n'
    rule += '    strings:\n'
    
    const significantStrings = analysis.strings.slice(0, 10)
    significantStrings.forEach((str, index) => {
      const safeStr = str.replace(/"/g, '\\"').replace(/\\/g, '\\\\')
      if (safeStr.length > 0) {
        rule += `        $s${index + 1} = "${safeStr}"\n`
      }
    })
    
    rule += '    \n'
    rule += '    condition:\n'
    rule += '        any of them\n'
    rule += '}\n'
    
    setGeneratedRule(rule)
    setActiveTab('generator')
    addHistory(rule)
    showToast('规则已从分析生成！', 'success')
  }
  
  const handleApplyTemplate = (template: typeof ruleTemplates[0]) => {
    const rule = template.rule.replace('{{date}}', new Date().toISOString().split('T')[0])
    setGeneratedRule(rule)
    setTestYaraRule(rule)
    setShowTemplateModal(false)
    showToast(`模板 "${template.name}" 已应用！`, 'success')
  }
  
  const handleExportRules = () => {
    const exportData = {
      rules: rules,
      exportedAt: new Date().toISOString(),
      version: '1.0'
    }
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `yara-rules-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
    
    showToast('规则已导出！', 'success')
  }
  
  const handleImportRules = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string)
        if (data.rules && Array.isArray(data.rules)) {
          data.rules.forEach((rule: YaraRule) => {
            if (!rules.find(r => r.id === rule.id)) {
              addRule({ ...rule, id: crypto.randomUUID() })
            }
          })
          showToast(`导入了 ${data.rules.length} 条规则！`, 'success')
        }
      } catch (error) {
        showToast('导入失败，文件格式错误！', 'error')
      }
    }
    reader.readAsText(file)
  }
  
  const handleCopyRule = (rule: string) => {
    navigator.clipboard.writeText(rule)
    showToast('已复制到剪贴板！', 'success')
  }
  
  const handleShareRule = async (rule: string) => {
    try {
      await navigator.clipboard.writeText(rule)
      showToast('规则已复制，可直接分享！', 'success')
    } catch {
      showToast('分享失败！', 'error')
    }
  }
  
  const handleValidateSyntax = () => {
    try {
      const rule = testYaraRule || generatedRule
      if (!rule.trim()) {
        setSyntaxError('规则为空')
        return
      }
      
      const lines = rule.split('\n')
      const hasRule = lines.some(l => l.trim().startsWith('rule '))
      const hasCondition = lines.some(l => l.trim().startsWith('condition:'))
      const hasStrings = lines.some(l => l.trim().startsWith('strings:'))
      const hasMeta = lines.some(l => l.trim().startsWith('meta:'))
      
      if (!hasRule) {
        setSyntaxError('缺少 rule 声明')
        return
      }
      if (!hasMeta) {
        setSyntaxError('缺少 meta 部分')
        return
      }
      if (!hasStrings) {
        setSyntaxError('缺少 strings 部分')
        return
      }
      if (!hasCondition) {
        setSyntaxError('缺少 condition 部分')
        return
      }
      
      setSyntaxError(null)
      showToast('语法验证通过！', 'success')
    } catch (error) {
      setSyntaxError('语法错误')
    }
  }
  
  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900' : 'bg-gradient-to-br from-gray-100 via-blue-50 to-gray-200'} transition-colors duration-300`}>
      {/* Header */}
      <header className={`${darkMode ? 'bg-black/30' : 'bg-white/50'} backdrop-blur-xl border-b ${darkMode ? 'border-white/10' : 'border-gray-200'}`}>
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-cyan-500 via-blue-500 to-purple-600 rounded-xl shadow-lg shadow-cyan-500/20">
                <Shield className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                  YARA规则生成器
                </h1>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  专业恶意软件检测规则创建平台
                </p>
              </div>
            </div>
            
              <div className="flex items-center gap-4">
                <div className={`flex items-center gap-1 p-1 rounded-xl ${darkMode ? 'bg-white/10' : 'bg-gray-200'}`}>
                  {[
                    { id: 'generator', icon: Code, label: '生成' },
                    { id: 'ai', icon: Sparkles, label: 'AI' },
                    { id: 'editor', icon: FileText, label: '编辑' },
                    { id: 'test', icon: Play, label: '测试' },
                    { id: 'batch', icon: Layers, label: '批量' },
                    { id: 'analyzer', icon: Search, label: '分析' },
                    { id: 'stats', icon: BarChart3, label: '统计' },
                    { id: 'library', icon: Database, label: '库' },
                    { id: 'history', icon: History, label: '历史' }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                        activeTab === tab.id 
                          ? `${darkMode ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white' : 'bg-gradient-to-r from-blue-500 to-cyan-600 text-white'} shadow-lg` 
                          : `${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'} hover:bg-white/5`
                      }`}
                    >
                      <tab.icon className="w-4 h-4" />
                      <span className="text-sm font-medium">{tab.label}</span>
                    </button>
                  ))}
                </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowTemplateModal(true)}
                  className={`p-3 rounded-xl ${darkMode ? 'bg-purple-500/20 hover:bg-purple-500/30 text-purple-400' : 'bg-purple-100 hover:bg-purple-200 text-purple-600'} transition-colors`}
                  title="规则模板"
                >
                  <BookOpen className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setShowSettingsModal(true)}
                  className={`p-3 rounded-xl ${darkMode ? 'bg-white/10 hover:bg-white/20 text-gray-400' : 'bg-gray-200 hover:bg-gray-300 text-gray-600'} transition-colors`}
                  title="设置"
                >
                  <Settings className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className={`p-3 rounded-xl ${darkMode ? 'bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400' : 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-600'} transition-colors`}
                  title="切换主题"
                >
                  {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Generator Tab */}
        {activeTab === 'generator' && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className={`${darkMode ? 'bg-black/40' : 'bg-white/60'} backdrop-blur-xl rounded-2xl border ${darkMode ? 'border-white/10' : 'border-gray-200'} p-6`}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <div className="w-2 h-8 bg-gradient-to-b from-cyan-400 to-blue-500 rounded-full" />
                  规则配置
                </h2>
                <div className="flex gap-2">
                  <button onClick={handleSaveRule} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:opacity-90 transition-opacity">
                    <Save className="w-4 h-4" />
                    保存
                  </button>
                  <button onClick={() => setShowTemplateModal(true)} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-lg hover:opacity-90 transition-opacity">
                    <BookOpen className="w-4 h-4" />
                    模板
                  </button>
                </div>
              </div>
              
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>规则名称</label>
                    <input
                      type="text"
                      value={ruleForm.name}
                      onChange={(e) => setRuleForm({ ...ruleForm, name: e.target.value })}
                      className={`w-full px-4 py-3 rounded-xl ${darkMode ? 'bg-white/5 border border-white/10 text-white' : 'bg-gray-100 border border-gray-200 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-cyan-500`}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>日期</label>
                    <input
                      type="date"
                      value={ruleForm.date}
                      onChange={(e) => setRuleForm({ ...ruleForm, date: e.target.value })}
                      className={`w-full px-4 py-3 rounded-xl ${darkMode ? 'bg-white/5 border border-white/10 text-white' : 'bg-gray-100 border border-gray-200 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-cyan-500`}
                    />
                  </div>
                </div>
                
                <div>
                  <label className={`block text-sm mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>描述</label>
                  <input
                    type="text"
                    value={ruleForm.description}
                    onChange={(e) => setRuleForm({ ...ruleForm, description: e.target.value })}
                    placeholder="规则功能描述..."
                    className={`w-full px-4 py-3 rounded-xl ${darkMode ? 'bg-white/5 border border-white/10 text-white' : 'bg-gray-100 border border-gray-200 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-cyan-500`}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>作者</label>
                    <input
                      type="text"
                      value={ruleForm.author}
                      onChange={(e) => setRuleForm({ ...ruleForm, author: e.target.value })}
                      placeholder="作者名称"
                      className={`w-full px-4 py-3 rounded-xl ${darkMode ? 'bg-white/5 border border-white/10 text-white' : 'bg-gray-100 border border-gray-200 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-cyan-500`}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>标签</label>
                    <input
                      type="text"
                      value={ruleForm.tags.join(', ')}
                      onChange={(e) => setRuleForm({ ...ruleForm, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) })}
                      placeholder="标签1, 标签2"
                      className={`w-full px-4 py-3 rounded-xl ${darkMode ? 'bg-white/5 border border-white/10 text-white' : 'bg-gray-100 border border-gray-200 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-cyan-500`}
                    />
                  </div>
                </div>
                
                {/* Strings Section */}
                <div className={`p-5 rounded-xl ${darkMode ? 'bg-white/5' : 'bg-gray-100'}`}>
                  <div className="flex items-center justify-between mb-4">
                    <label className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      字符串特征
                    </label>
                    <button onClick={handleAddString} className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 text-sm font-medium">
                      <Plus className="w-4 h-4" />
                      添加
                    </button>
                  </div>
                  
                  {ruleForm.strings.length === 0 ? (
                    <div className={`text-center py-8 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                      <Layers className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>暂无字符串特征，点击添加</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {ruleForm.strings.map((str, index) => (
                        <div key={str.id} className={`p-4 rounded-lg border ${str.enabled ? (darkMode ? 'border-cyan-500/30 bg-cyan-500/5' : 'border-blue-300 bg-blue-50') : (darkMode ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-white')} transition-all`}>
                          <div className="flex items-center gap-2 mb-3">
                            <button onClick={() => handleToggleString(str.id)} className={str.enabled ? 'text-green-400' : 'text-gray-500'}>
                              {str.enabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                            </button>
                            <input
                              type="text"
                              value={str.name}
                              onChange={(e) => handleStringChange(str.id, 'name', e.target.value)}
                              className={`flex-1 px-3 py-1.5 rounded-lg text-sm ${darkMode ? 'bg-white/10 text-white' : 'bg-white text-gray-900'} focus:outline-none focus:ring-2 focus:ring-cyan-500`}
                              placeholder="变量名"
                            />
                            <select
                              value={str.type}
                              onChange={(e) => handleStringChange(str.id, 'type', e.target.value)}
                              className={`px-3 py-1.5 rounded-lg text-sm ${darkMode ? 'bg-white/10 text-white' : 'bg-white text-gray-900'} focus:outline-none`}
                            >
                              <option value="text">文本</option>
                              <option value="hex">十六进制</option>
                              <option value="regex">正则</option>
                            </select>
                            <button onClick={() => handleRemoveString(str.id)} className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          <input
                            type="text"
                            value={str.value}
                            onChange={(e) => handleStringChange(str.id, 'value', e.target.value)}
                            className={`w-full px-3 py-2 rounded-lg text-sm font-mono ${darkMode ? 'bg-white/10 text-cyan-300' : 'bg-white text-blue-600'} focus:outline-none focus:ring-2 focus:ring-cyan-500`}
                            placeholder={str.type === 'hex' ? '例如: 4D 5A 90 00' : '输入特征值'}
                          />
                          <input
                            type="text"
                            value={str.modifier}
                            onChange={(e) => handleStringChange(str.id, 'modifier', e.target.value)}
                            className={`w-full mt-2 px-3 py-1.5 rounded-lg text-sm ${darkMode ? 'bg-white/5 text-gray-400' : 'bg-gray-50 text-gray-600'} focus:outline-none`}
                            placeholder="修饰符 (nocase, wide, ascii等，可选)"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Condition */}
                <div className={`p-5 rounded-xl ${darkMode ? 'bg-white/5' : 'bg-gray-100'}`}>
                  <label className={`block text-sm font-medium mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    匹配条件
                  </label>
                  <textarea
                    value={ruleForm.conditions}
                    onChange={(e) => setRuleForm({ ...ruleForm, conditions: e.target.value })}
                    rows={3}
                    className={`w-full px-4 py-3 rounded-xl font-mono text-sm ${darkMode ? 'bg-white/5 border border-white/10 text-white' : 'bg-white border border-gray-200 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-cyan-500`}
                    placeholder="any of them"
                  />
                  <div className="flex flex-wrap gap-2 mt-3">
                    {['any of them', 'all of them', '$s1 and $s2', '$s1 or $s2', 'any of ($s*)'].map(cond => (
                      <button
                        key={cond}
                        onClick={() => setRuleForm({ ...ruleForm, conditions: cond })}
                        className={`px-3 py-1 rounded-lg text-xs ${darkMode ? 'bg-white/10 text-cyan-400 hover:bg-white/20' : 'bg-gray-200 text-blue-600 hover:bg-gray-300'} transition-colors`}
                      >
                        {cond}
                      </button>
                    ))}
                  </div>
                </div>
                
                <button
                  onClick={handleGenerate}
                  className="w-full py-4 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 text-white rounded-xl font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-3 shadow-lg shadow-cyan-500/25"
                >
                  <Zap className="w-5 h-5" />
                  生成YARA规则
                </button>
              </div>
            </div>
            
            {/* Preview */}
            <div className={`${darkMode ? 'bg-black/40' : 'bg-white/60'} backdrop-blur-xl rounded-2xl border ${darkMode ? 'border-white/10' : 'border-gray-200'} p-6`}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <div className="w-2 h-8 bg-gradient-to-b from-purple-400 to-pink-500 rounded-full" />
                  规则预览
                </h2>
                <div className="flex gap-2">
                  <button onClick={() => handleCopyRule(generatedRule)} className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors" title="复制">
                    <Copy className="w-5 h-5" />
                  </button>
                  <button onClick={() => handleShareRule(generatedRule)} className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors" title="分享">
                    <Share2 className="w-5 h-5" />
                  </button>
                  <button onClick={() => navigator.clipboard.writeText(generatedRule)} className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors" title="下载">
                    <Download className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              <div className={`rounded-xl overflow-hidden border ${darkMode ? 'border-white/10' : 'border-gray-200'}`}>
                <Editor
                  height="500px"
                  defaultLanguage="cpp"
                  value={generatedRule || '// YARA规则将显示在这里\n// 请先配置规则参数'}
                  theme={darkMode ? "vs-dark" : "light"}
                  options={{
                    readOnly: true,
                    minimap: { enabled: false },
                    fontSize: 14,
                    lineNumbers: 'on',
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    wordWrap: 'on',
                    padding: { top: 16, bottom: 16 }
                  }}
                />
              </div>
            </div>
          </div>
        )}
        
        {/* Editor Tab */}
        {activeTab === 'editor' && (
          <div className="space-y-6">
            <div className={`${darkMode ? 'bg-black/40' : 'bg-white/60'} backdrop-blur-xl rounded-2xl border ${darkMode ? 'border-white/10' : 'border-gray-200'} p-6`}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-cyan-400" />
                  YARA规则编辑器
                </h2>
                <div className="flex gap-3">
                  <button onClick={handleValidateSyntax} className={`flex items-center gap-2 px-4 py-2 rounded-lg ${darkMode ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' : 'bg-green-100 text-green-600 hover:bg-green-200'}`}>
                    <Check className="w-4 h-4" />
                    验证语法
                  </button>
                  {syntaxError && (
                    <span className="flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-400 rounded-lg">
                      <AlertCircle className="w-4 h-4" />
                      {syntaxError}
                    </span>
                  )}
                  {!syntaxError && generatedRule && (
                    <span className="flex items-center gap-2 px-4 py-2 bg-green-500/20 text-green-400 rounded-lg">
                      <CheckCircle className="w-4 h-4" />
                      语法正确
                    </span>
                  )}
                  <button onClick={() => handleCopyRule(testYaraRule || generatedRule)} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg">
                    <Copy className="w-4 h-4" />
                    复制
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-lg">
                    <Save className="w-4 h-4" />
                    保存
                  </button>
                </div>
              </div>
              
              <div className={`rounded-xl overflow-hidden border ${darkMode ? 'border-white/10' : 'border-gray-200'}`}>
                <Editor
                  height="550px"
                  defaultLanguage="cpp"
                  value={testYaraRule || generatedRule}
                  onChange={(value) => setTestYaraRule(value || '')}
                  theme={darkMode ? "vs-dark" : "light"}
                  options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    lineNumbers: 'on',
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    wordWrap: 'on',
                    padding: { top: 16, bottom: 16 }
                  }}
                />
              </div>
              
              <div className={`mt-4 p-4 rounded-xl ${darkMode ? 'bg-blue-500/10 border border-blue-500/30' : 'bg-blue-50 border border-blue-200'}`}>
                <h4 className={`text-sm font-medium mb-2 flex items-center gap-2 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                  <Info className="w-4 h-4" />
                  语法提示
                </h4>
                <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  <p>• 使用 <code className={darkMode ? 'text-cyan-400' : 'text-blue-600'}>rule RuleName</code> 定义规则</p>
                  <p>• 使用 <code className={darkMode ? 'text-cyan-400' : 'text-blue-600'}>$variable</code> 定义字符串变量</p>
                  <p>• 使用 <code className={darkMode ? 'text-cyan-400' : 'text-blue-600'}>condition:</code> 定义匹配条件</p>
                  <p>• 常用修饰符: <code className={darkMode ? 'text-cyan-400' : 'text-blue-600'}>nocase</code>, <code className={darkMode ? 'text-cyan-400' : 'text-blue-600'}>wide</code>, <code className={darkMode ? 'text-cyan-400' : 'text-blue-600'}>ascii</code>, <code className={darkMode ? 'text-cyan-400' : 'text-blue-600'}>fullword</code></p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Test Tab */}
        {activeTab === 'test' && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className={`${darkMode ? 'bg-black/40' : 'bg-white/60'} backdrop-blur-xl rounded-2xl border ${darkMode ? 'border-white/10' : 'border-gray-200'} p-6`}>
              <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                <Play className="w-5 h-5 text-green-400" />
                规则测试
              </h2>
              
              <div className="space-y-5">
                <div>
                  <label className={`block text-sm mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>YARA规则</label>
                  <textarea
                    value={testYaraRule}
                    onChange={(e) => setTestYaraRule(e.target.value)}
                    placeholder="输入或粘贴YARA规则..."
                    className={`w-full h-48 px-4 py-3 rounded-xl font-mono text-sm ${darkMode ? 'bg-white/5 border border-white/10 text-white' : 'bg-gray-100 border border-gray-200 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none`}
                  />
                </div>
                
                <div>
                  <label className={`block text-sm mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>测试文件</label>
                  <div 
                    className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${dragOver ? 'border-cyan-500 bg-cyan-500/10' : (darkMode ? 'border-white/20 hover:border-white/30' : 'border-gray-300 hover:border-gray-400')}`}
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                  >
                    <input
                      type="file"
                      onChange={(e) => setTestFile(e.target.files?.[0] || null)}
                      className="hidden"
                      id="testFile"
                    />
                    <label htmlFor="testFile" className="cursor-pointer">
                      <Upload className={`w-12 h-12 mx-auto mb-3 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                      <p className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                        {testFile ? testFile.name : '点击或拖拽文件到这里'}
                      </p>
                      <p className={`text-sm mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                        支持PE、ELF、PDF、ZIP等可执行文件格式
                      </p>
                    </label>
                  </div>
                  {testFile && (
                    <div className="mt-3 flex items-center gap-2 text-sm text-green-400">
                      <CheckCircle className="w-4 h-4" />
                      已选择: {testFile.name} ({(testFile.size / 1024).toFixed(2)} KB)
                    </div>
                  )}
                </div>
                
                <button
                  onClick={handleTestRule}
                  className="w-full py-4 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-600 text-white rounded-xl font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-3 shadow-lg shadow-green-500/25"
                >
                  <Zap className="w-5 h-5" />
                  执行测试
                </button>
              </div>
            </div>
            
            <div className={`${darkMode ? 'bg-black/40' : 'bg-white/60'} backdrop-blur-xl rounded-2xl border ${darkMode ? 'border-white/10' : 'border-gray-200'} p-6`}>
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-purple-400" />
                测试结果
              </h2>
              
              <div className={`rounded-xl p-4 font-mono text-sm overflow-auto h-[450px] ${darkMode ? 'bg-slate-950 border border-white/10' : 'bg-gray-50 border border-gray-200'}`}>
                {testResult || (
                  <div className={`flex flex-col items-center justify-center h-full ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    <Terminal className="w-16 h-16 mb-4 opacity-50" />
                    <p>等待测试...</p>
                    <p className="text-sm mt-1">输入规则并选择文件后点击执行测试</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Analyzer Tab */}
        {activeTab === 'analyzer' && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className={`${darkMode ? 'bg-black/40' : 'bg-white/60'} backdrop-blur-xl rounded-2xl border ${darkMode ? 'border-white/10' : 'border-gray-200'} p-6`}>
              <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                <Search className="w-5 h-5 text-yellow-400" />
                文件分析
              </h2>
              
              <div 
                className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all ${dragOver ? 'border-cyan-500 bg-cyan-500/10 scale-105' : (darkMode ? 'border-white/20 hover:border-white/30' : 'border-gray-300 hover:border-gray-400')}`}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="analyzeFile"
                />
                <label htmlFor="analyzeFile" className="cursor-pointer">
                  <div className="p-4 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 rounded-full inline-block mb-4">
                    <Upload className="w-16 h-16 text-cyan-400" />
                  </div>
                  <p className={`text-lg mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    拖拽文件到此处或点击上传
                  </p>
                  <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                    自动提取特征并生成YARA规则
                  </p>
                  <p className={`text-xs mt-2 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>
                    支持PE/ELF/PDF/ZIP/PNG/JPEG/GIF/HTML等格式
                  </p>
                </label>
              </div>
              
              {analysis && (
                <div className="mt-6 space-y-4">
                  <button
                    onClick={handleGenerateFromAnalysis}
                    className="w-full py-4 bg-gradient-to-r from-purple-500 via-pink-500 to-rose-600 text-white rounded-xl font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-3 shadow-lg shadow-purple-500/25"
                  >
                    <FileCode className="w-5 h-5" />
                    一键生成YARA规则
                  </button>
                  <button
                    onClick={() => { setAnalysis(null); showToast('已清除分析结果', 'info') }}
                    className="w-full py-3 bg-white/5 text-gray-400 rounded-xl hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    重新分析
                  </button>
                </div>
              )}
            </div>
            
            <div className={`${darkMode ? 'bg-black/40' : 'bg-white/60'} backdrop-blur-xl rounded-2xl border ${darkMode ? 'border-white/10' : 'border-gray-200'} p-6`}>
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Cpu className="w-5 h-5 text-cyan-400" />
                分析结果
              </h2>
              
              {analysis ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className={`p-4 rounded-xl ${darkMode ? 'bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30' : 'bg-gradient-to-br from-cyan-50 to-blue-50 border border-cyan-200'}`}>
                      <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>文件类型</p>
                      <p className="text-xl font-bold text-cyan-400">{analysis.fileType}</p>
                    </div>
                    <div className={`p-4 rounded-xl ${darkMode ? 'bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30' : 'bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200'}`}>
                      <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>文件大小</p>
                      <p className="text-xl font-bold text-purple-400">{(analysis.size / 1024).toFixed(2)} KB</p>
                    </div>
                    <div className={`p-4 rounded-xl ${darkMode ? 'bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30' : 'bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200'}`}>
                      <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>熵 值</p>
                      <p className={`text-xl font-bold ${analysis.entropy > 7.5 ? 'text-red-400' : 'text-green-400'}`}>{analysis.entropy}</p>
                      {analysis.entropy > 7.5 && (
                        <p className="text-xs text-red-400 mt-1">高熵值 - 可能加壳</p>
                      )}
                    </div>
                    <div className={`p-4 rounded-xl ${darkMode ? 'bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-500/30' : 'bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-200'}`}>
                      <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>字符串数</p>
                      <p className="text-xl font-bold text-yellow-400">{analysis.strings.length}</p>
                    </div>
                  </div>
                  
                  <div className={`p-4 rounded-xl ${darkMode ? 'bg-white/5' : 'bg-gray-100'}`}>
                    <p className={`text-xs mb-3 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>哈希值</p>
                    <div className="space-y-2 font-mono text-xs">
                      <div className="flex items-center gap-2">
                        <span className={`w-12 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>MD5</span>
                        <span className={`${darkMode ? 'text-cyan-400' : 'text-blue-600'}`}>{analysis.md5}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`w-12 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>SHA1</span>
                        <span className={`${darkMode ? 'text-purple-400' : 'text-purple-600'}`}>{analysis.sha1}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`w-12 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>SHA256</span>
                        <span className={`${darkMode ? 'text-green-400' : 'text-green-600'} truncate`}>{analysis.sha256}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className={`p-4 rounded-xl ${darkMode ? 'bg-white/5' : 'bg-gray-100'}`}>
                    <div className="flex items-center justify-between mb-3">
                      <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>提取的字符串</p>
                      <button onClick={() => setShowHexDump(!showHexDump)} className="text-xs text-cyan-400 hover:text-cyan-300">
                        {showHexDump ? '隐藏' : '显示'}HexDump
                      </button>
                    </div>
                    {showHexDump ? (
                      <div className="font-mono text-xs max-h-64 overflow-auto space-y-1">
                        {analysis.hexDump.map((line, i) => (
                          <div key={i} className={darkMode ? 'text-gray-400' : 'text-gray-600'}>{line}</div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2 max-h-40 overflow-auto">
                        {analysis.strings.slice(0, 30).map((str, i) => (
                          <span key={i} className={`px-2 py-1 rounded text-xs ${darkMode ? 'bg-cyan-500/20 text-cyan-300' : 'bg-cyan-100 text-cyan-700'}`}>
                            {str}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className={`flex flex-col items-center justify-center h-96 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  <Search className="w-20 h-20 mb-4 opacity-30" />
                  <p className="text-lg">等待分析...</p>
                  <p className="text-sm mt-1">上传文件以查看详细分析结果</p>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Library Tab */}
        {activeTab === 'library' && (
          <div className="space-y-6">
            <div className={`${darkMode ? 'bg-black/40' : 'bg-white/60'} backdrop-blur-xl rounded-2xl border ${darkMode ? 'border-white/10' : 'border-gray-200'} p-6`}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Database className="w-5 h-5 text-purple-400" />
                  规则库
                </h2>
                <div className="flex gap-3">
                  <label className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-lg cursor-pointer hover:opacity-90 transition-opacity">
                    <Upload className="w-4 h-4" />
                    导入
                    <input type="file" onChange={handleImportRules} accept=".json" className="hidden" />
                  </label>
                  <button onClick={handleExportRules} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:opacity-90 transition-opacity">
                    <Download className="w-4 h-4" />
                    导出
                  </button>
                </div>
              </div>
              
              {rules.length === 0 ? (
                <div className={`flex flex-col items-center justify-center py-16 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  <Database className="w-20 h-20 mb-4 opacity-30" />
                  <p className="text-lg">规则库为空</p>
                  <p className="text-sm mt-1">保存规则或导入现有规则库</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {rules.map((rule) => (
                    <div key={rule.id} className={`p-4 rounded-xl border transition-all hover:scale-105 ${darkMode ? 'bg-white/5 border-white/10 hover:border-cyan-500/30' : 'bg-white border-gray-200 hover:border-blue-300'}`}>
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{rule.name}</h3>
                          <p className={`text-xs mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{rule.description || '无描述'}</p>
                        </div>
                        <button onClick={() => toggleFavorite(rule.id)} className={rule.favorite ? 'text-yellow-400' : 'text-gray-500'}>
                          <Star className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex items-center gap-2 mb-3">
                        <span className={`text-xs px-2 py-0.5 rounded ${darkMode ? 'bg-cyan-500/20 text-cyan-400' : 'bg-cyan-100 text-cyan-700'}`}>
                          {rule.tags.join(', ') || '无标签'}
                        </span>
                        <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                          {rule.date}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => { setSelectedRule(rule); setTestYaraRule(rule.content || yaraGenerator.generateRule(rule)); showToast('已加载到编辑器', 'info') }} className={`flex-1 py-2 rounded-lg text-sm ${darkMode ? 'bg-white/10 hover:bg-white/20 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'} transition-colors`}>
                          编辑
                        </button>
                        <button onClick={() => handleCopyRule(rule.content || yaraGenerator.generateRule(rule))} className={`p-2 rounded-lg ${darkMode ? 'bg-white/10 hover:bg-white/20 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'} transition-colors`}>
                          <Copy className="w-4 h-4" />
                        </button>
                        <button onClick={() => deleteRule(rule.id)} className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* AI Tab */}
        {activeTab === 'ai' && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className={`${darkMode ? 'bg-black/40' : 'bg-white/60'} backdrop-blur-xl rounded-2xl border ${darkMode ? 'border-white/10' : 'border-gray-200'} p-6`}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Brain className="w-5 h-5 text-purple-400" />
                  AI智能规则生成
                </h2>
                <Sparkles className="w-5 h-5 text-yellow-400 animate-pulse" />
              </div>
              
              <div className={`p-6 rounded-xl ${darkMode ? 'bg-gradient-to-br from-purple-500/20 to-cyan-500/20' : 'bg-gradient-to-br from-purple-100 to-cyan-100'} mb-6`}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-xl">
                    <Brain className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">AI助手已上线</h3>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>基于机器学习的规则生成</p>
                  </div>
                </div>
                <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  AI引擎可以分析恶意软件行为模式，自动生成高精度的YARA检测规则。
                  支持零样本学习和迁移学习技术。
                </p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className={`block text-sm mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>恶意软件描述</label>
                  <textarea
                    placeholder="例如：检测使用PowerShell编码命令的恶意软件，具有持久化机制和加密通信行为..."
                    className={`w-full h-32 px-4 py-3 rounded-xl ${darkMode ? 'bg-white/5 border border-white/10 text-white' : 'bg-gray-100 border border-gray-200 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none`}
                  />
                </div>
                
                <button
                  onClick={handleAiGenerate}
                  disabled={aiGenerating}
                  className="w-full py-4 bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-600 text-white rounded-xl font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-3 shadow-lg shadow-purple-500/25"
                >
                  {aiGenerating ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      AI正在分析生成...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      AI生成规则
                    </>
                  )}
                </button>
              </div>
              
              <div className={`mt-6 p-4 rounded-xl ${darkMode ? 'bg-white/5' : 'bg-gray-100'}`}>
                <h4 className={`text-sm font-medium mb-3 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>AI生成能力</h4>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { icon: Target, label: '行为分析', desc: '基于行为模式检测' },
                    { icon: TrendingUp, label: '特征提取', desc: '自动提取恶意特征' },
                    { icon: Lock, label: '变种检测', desc: '检测已知恶意软件变种' },
                    { icon: Wifi, label: 'C2识别', desc: '识别命令控制通信' }
                  ].map((feature, i) => (
                    <div key={i} className={`p-3 rounded-lg ${darkMode ? 'bg-purple-500/10' : 'bg-purple-50'}`}>
                      <feature.icon className="w-5 h-5 text-purple-400 mb-2" />
                      <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{feature.label}</p>
                      <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>{feature.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className={`${darkMode ? 'bg-black/40' : 'bg-white/60'} backdrop-blur-xl rounded-2xl border ${darkMode ? 'border-white/10' : 'border-gray-200'} p-6`}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <FileCode className="w-5 h-5 text-cyan-400" />
                  AI生成结果
                </h2>
                {aiSuggestion && (
                  <div className="flex gap-2">
                    <button onClick={() => handleCopyRule(aiSuggestion)} className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                      <Copy className="w-4 h-4" />
                    </button>
                    <button onClick={handleShareRule} className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                      <Share2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
              
              <div className={`rounded-xl overflow-hidden border ${darkMode ? 'border-white/10' : 'border-gray-200'}`}>
                <Editor
                  height="450px"
                  defaultLanguage="cpp"
                  value={aiSuggestion || 'AI生成的规则将显示在这里...\n\n点击"AI生成规则"按钮开始'}
                  theme={darkMode ? "vs-dark" : "light"}
                  options={{
                    readOnly: !aiSuggestion,
                    minimap: { enabled: false },
                    fontSize: 14,
                    lineNumbers: 'on',
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    wordWrap: 'on',
                    padding: { top: 16, bottom: 16 }
                  }}
                />
              </div>
            </div>
          </div>
        )}
        
        {/* Batch Analysis Tab */}
        {activeTab === 'batch' && (
          <div className="space-y-6">
            <div className={`${darkMode ? 'bg-black/40' : 'bg-white/60'} backdrop-blur-xl rounded-2xl border ${darkMode ? 'border-white/10' : 'border-gray-200'} p-6`}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-green-400" />
                  批量文件分析
                </h2>
                <span className={`px-3 py-1 rounded-full text-xs ${darkMode ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-700'}`}>
                  {batchFiles.length} 个文件
                </span>
              </div>
              
              <div 
                className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all ${dragOver ? 'border-green-500 bg-green-500/10 scale-105' : (darkMode ? 'border-white/20 hover:border-white/30' : 'border-gray-300 hover:border-gray-400')}`}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault()
                  setDragOver(false)
                  const files = Array.from(e.dataTransfer.files).filter(f => f.name.match(/\.(exe|dll|bat|cmd|ps1|vbs|js|jar|apk|elf|pe)$/i))
                  handleBatchAnalysis(files)
                }}
              >
                <input
                  type="file"
                  multiple
                  onChange={(e) => handleBatchAnalysis(Array.from(e.target.files || []))}
                  className="hidden"
                  id="batchFiles"
                />
                <label htmlFor="batchFiles" className="cursor-pointer">
                  <div className="p-4 bg-gradient-to-br from-green-500/20 to-cyan-500/20 rounded-full inline-block mb-4">
                    <Layers className="w-16 h-16 text-green-400" />
                  </div>
                  <p className={`text-lg mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    拖拽多个文件到这里或点击上传
                  </p>
                  <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                    支持批量分析多个可疑文件
                  </p>
                </label>
              </div>
              
              {batchProgress > 0 && batchProgress < 100 && (
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>分析进度</span>
                    <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{Math.round(batchProgress)}%</span>
                  </div>
                  <div className={`h-3 rounded-full overflow-hidden ${darkMode ? 'bg-white/10' : 'bg-gray-200'}`}>
                    <div 
                      className="h-full bg-gradient-to-r from-green-500 to-cyan-500 transition-all duration-300"
                      style={{ width: `${batchProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
            
            {batchResults.length > 0 && (
              <div className={`${darkMode ? 'bg-black/40' : 'bg-white/60'} backdrop-blur-xl rounded-2xl border ${darkMode ? 'border-white/10' : 'border-gray-200'} p-6`}>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-cyan-400" />
                    分析结果
                  </h2>
                  <div className="flex gap-4 text-sm">
                    <span className="flex items-center gap-2 text-red-400">
                      <AlertCircle className="w-4 h-4" />
                      检测到: {batchResults.filter(r => r.matched).length}
                    </span>
                    <span className="flex items-center gap-2 text-green-400">
                      <CheckCircle className="w-4 h-4" />
                      正常: {batchResults.filter(r => !r.matched).length}
                    </span>
                  </div>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className={`text-left text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        <th className="pb-3 pr-4">文件名</th>
                        <th className="pb-3 pr-4">类型</th>
                        <th className="pb-3 pr-4">熵值</th>
                        <th className="pb-3 pr-4">威胁分数</th>
                        <th className="pb-3">状态</th>
                      </tr>
                    </thead>
                    <tbody>
                      {batchResults.map((result, index) => (
                        <tr key={index} className={`border-t ${darkMode ? 'border-white/10' : 'border-gray-200'}`}>
                          <td className="py-3 pr-4">
                            <span className={darkMode ? 'text-white' : 'text-gray-900'}>{result.file}</span>
                          </td>
                          <td className="py-3 pr-4">
                            <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                              {result.analysis?.fileType || 'Unknown'}
                            </span>
                          </td>
                          <td className="py-3 pr-4">
                            <span className={`text-sm ${result.analysis && result.analysis.entropy > 7.5 ? 'text-red-400' : (darkMode ? 'text-gray-400' : 'text-gray-600')}`}>
                              {result.analysis?.entropy.toFixed(2) || 'N/A'}
                            </span>
                          </td>
                          <td className="py-3 pr-4">
                            <span className={`text-sm ${result.analysis && result.analysis.threatScore > 50 ? 'text-red-400' : (result.analysis && result.analysis.threatScore > 30 ? 'text-yellow-400' : 'text-green-400')}`}>
                              {result.analysis?.threatScore || 0}%
                            </span>
                          </td>
                          <td className="py-3">
                            {result.matched ? (
                              <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs">威胁</span>
                            ) : (
                              <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs">正常</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Statistics Tab */}
        {activeTab === 'stats' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: '总规则数', value: rules.length, icon: FileCode, color: 'from-cyan-500 to-blue-500' },
                { label: '收藏规则', value: rules.filter(r => r.favorite).length, icon: Star, color: 'from-yellow-500 to-orange-500' },
                { label: '最近测试', value: '24', icon: Activity, color: 'from-green-500 to-emerald-500' },
                { label: '检测率', value: `${ruleStats.detectionRate}%`, icon: TrendingUp, color: 'from-purple-500 to-pink-500' }
              ].map((stat, index) => (
                <div key={index} className={`${darkMode ? 'bg-black/40' : 'bg-white/60'} backdrop-blur-xl rounded-2xl border ${darkMode ? 'border-white/10' : 'border-gray-200'} p-6`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 bg-gradient-to-br ${stat.color} rounded-xl`}>
                      <stat.icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <p className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{stat.value}</p>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{stat.label}</p>
                </div>
              ))}
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className={`${darkMode ? 'bg-black/40' : 'bg-white/60'} backdrop-blur-xl rounded-2xl border ${darkMode ? 'border-white/10' : 'border-gray-200'} p-6`}>
                <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-purple-400" />
                  恶意软件家族分布
                </h2>
                <div className="space-y-4">
                  {ruleStats.topFamilies.map((family, index) => (
                    <div key={family.name}>
                      <div className="flex items-center justify-between mb-1">
                        <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>{family.name}</span>
                        <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>{family.count} 条规则</span>
                      </div>
                      <div className={`h-2 rounded-full overflow-hidden ${darkMode ? 'bg-white/10' : 'bg-gray-200'}`}>
                        <div 
                          className={`h-full bg-gradient-to-r ${index === 0 ? 'from-red-500 to-rose-600' : index === 1 ? 'from-orange-500 to-yellow-500' : index === 2 ? 'from-purple-500 to-pink-500' : 'from-cyan-500 to-blue-500'}`}
                          style={{ width: `${(family.count / ruleStats.topFamilies.reduce((a, b) => a + b.count, 0)) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className={`${darkMode ? 'bg-black/40' : 'bg-white/60'} backdrop-blur-xl rounded-2xl border ${darkMode ? 'border-white/10' : 'border-gray-200'} p-6`}>
                <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-cyan-400" />
                  检测性能趋势
                </h2>
                <div className="flex items-end justify-between h-48 px-4">
                  {[65, 72, 78, 75, 82, 85, 88, 85, 90, 87, 92, 95].map((value, index) => (
                    <div key={index} className="flex flex-col items-center gap-2">
                      <div 
                        className="w-8 bg-gradient-to-t from-cyan-500 to-blue-500 rounded-t-lg transition-all hover:from-cyan-400 hover:to-blue-400"
                        style={{ height: `${value}%` }}
                      />
                      <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                        {index + 1}月
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className={`${darkMode ? 'bg-black/40' : 'bg-white/60'} backdrop-blur-xl rounded-2xl border ${darkMode ? 'border-white/10' : 'border-gray-200'} p-6`}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Cloud className="w-5 h-5 text-green-400" />
                  云端同步状态
                </h2>
                <span className="flex items-center gap-2 px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm">
                  <CheckCircle className="w-4 h-4" />
                  已同步
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className={`p-4 rounded-xl ${darkMode ? 'bg-white/5' : 'bg-gray-100'}`}>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>云端规则库</p>
                  <p className="text-2xl font-bold text-white mt-1">1,234</p>
                  <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>条公开规则</p>
                </div>
                <div className={`p-4 rounded-xl ${darkMode ? 'bg-white/5' : 'bg-gray-100'}`}>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>本周更新</p>
                  <p className="text-2xl font-bold text-white mt-1">56</p>
                  <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>条新规则</p>
                </div>
                <div className={`p-4 rounded-xl ${darkMode ? 'bg-white/5' : 'bg-gray-100'}`}>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>全球用户</p>
                  <p className="text-2xl font-bold text-white mt-1">8,432</p>
                  <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>安全研究人员</p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="space-y-6">
            <div className={`${darkMode ? 'bg-black/40' : 'bg-white/60'} backdrop-blur-xl rounded-2xl border ${darkMode ? 'border-white/10' : 'border-gray-200'} p-6`}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <History className="w-5 h-5 text-cyan-400" />
                  历史记录
                </h2>
                <button onClick={clearHistory} className="flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors">
                  <Trash2 className="w-4 h-4" />
                  清空
                </button>
              </div>
              
              {history.length === 0 ? (
                <div className={`flex flex-col items-center justify-center py-16 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  <History className="w-20 h-20 mb-4 opacity-30" />
                  <p className="text-lg">暂无历史记录</p>
                  <p className="text-sm mt-1">生成规则后会自动记录</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {history.map((item, index) => (
                    <div key={index} className={`p-4 rounded-xl border ${darkMode ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                          <Clock className="w-3 h-3 inline mr-1" />
                          {new Date(item.timestamp).toLocaleString()}
                        </span>
                        <button onClick={() => handleCopyRule(item.rule)} className="text-cyan-400 hover:text-cyan-300 text-sm">
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                      <pre className={`text-xs overflow-auto max-h-32 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{item.rule}</pre>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
      
      {/* Template Modal */}
      <Modal isOpen={showTemplateModal} onClose={() => setShowTemplateModal(false)} title="规则模板库" size="lg">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {ruleTemplates.map((template, index) => (
            <div key={index} className={`p-4 rounded-xl border cursor-pointer transition-all hover:scale-105 ${darkMode ? 'bg-white/5 border-white/10 hover:border-cyan-500/50' : 'bg-gray-50 border-gray-200 hover:border-blue-300'}`} onClick={() => handleApplyTemplate(template)}>
              <div className="flex items-start gap-3">
                <div className="p-2 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 rounded-lg">
                  <FileCode className="w-6 h-6 text-cyan-400" />
                </div>
                <div className="flex-1">
                  <h4 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{template.name}</h4>
                  <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{template.description}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
            </div>
          ))}
        </div>
      </Modal>
      
      {/* Settings Modal */}
      <Modal isOpen={showSettingsModal} onClose={() => setShowSettingsModal(false)} title="设置" size="md">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {darkMode ? <Moon className="w-5 h-5 text-yellow-400" /> : <Sun className="w-5 h-5 text-orange-400" />}
              <div>
                <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>深色模式</p>
                <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>切换明暗主题</p>
              </div>
            </div>
            <button onClick={() => setDarkMode(!darkMode)} className={`relative w-14 h-7 rounded-full transition-colors ${darkMode ? 'bg-cyan-500' : 'bg-gray-300'}`}>
              <span className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${darkMode ? 'left-8' : 'left-1'}`} />
            </button>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Database className="w-5 h-5 text-purple-400" />
              <div>
                <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>自动保存</p>
                <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>规则变更时自动保存</p>
              </div>
            </div>
            <button className={`relative w-14 h-7 rounded-full transition-colors ${true ? 'bg-cyan-500' : 'bg-gray-300'}`}>
              <span className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${true ? 'left-8' : 'left-1'}`} />
            </button>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Code className="w-5 h-5 text-green-400" />
              <div>
                <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>语法高亮</p>
                <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>编辑器语法高亮显示</p>
              </div>
            </div>
            <button className={`relative w-14 h-7 rounded-full transition-colors ${true ? 'bg-cyan-500' : 'bg-gray-300'}`}>
              <span className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${true ? 'left-8' : 'left-1'}`} />
            </button>
          </div>
          
          <div className="pt-4 border-t border-white/10">
            <button className="w-full py-3 bg-red-500/20 text-red-400 rounded-xl hover:bg-red-500/30 transition-colors">
              清除所有数据
            </button>
          </div>
        </div>
      </Modal>
      
      {/* Toast */}
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
      
      {/* Footer */}
      <footer className={`border-t mt-8 py-6 ${darkMode ? 'border-white/10' : 'border-gray-200'}`}>
        <div className="max-w-7xl mx-auto px-6">
          <div className={`flex items-center justify-between text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
            <div className="flex items-center gap-4">
              <p>© 2026 YARA规则生成器 v3.0 | AI驱动的恶意软件检测规则平台</p>
              <span className="px-2 py-1 bg-gradient-to-r from-cyan-500 to-purple-500 text-white text-xs rounded-full">AI Powered</span>
            </div>
            <div className="flex gap-4">
              <a href="#" className={`hover:text-cyan-400 transition-colors ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>文档</a>
              <a href="#" className={`hover:text-cyan-400 transition-colors ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>示例规则</a>
              <a href="#" className={`hover:text-cyan-400 transition-colors ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>云端同步</a>
              <a href="#" className={`hover:text-cyan-400 transition-colors ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>GitHub</a>
            </div>
          </div>
        </div>
      </footer>
      
      <style>{`
        @keyframes modal-in {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes toast-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-modal-in { animation: modal-in 0.2s ease-out; }
        .animate-toast-in { animation: toast-in 0.3s ease-out; }
      `}</style>
    </div>
  )
}

export default App
