export interface YaraRule {
  name: string;
  description: string;
  author: string;
  date: string;
  strings: YaraString[];
  conditions: YaraCondition[];
  tags: string[];
}

export interface YaraString {
  id: string;
  type: 'text' | 'hex' | 'regex';
  value: string;
  modifier?: string;
}

export interface YaraCondition {
  id: string;
  type: 'and' | 'or' | 'not' | 'contains' | 'matches' | 'of';
  value?: string;
}

export interface FileAnalysis {
  entropy: number;
  strings: string[];
  fileType: string;
  size: number;
  md5: string;
  sha1: string;
  sha256: string;
  hexDump: string[];
}

export class YaraGenerator {
  generateRule(rule: YaraRule): string {
    let yaraRule = `rule ${this.sanitizeIdentifier(rule.name)}\n`;
    yaraRule += '{\n';
    
    yaraRule += '    meta:\n';
    if (rule.description) {
      yaraRule += `        description = "${rule.description}"\n`;
    }
    if (rule.author) {
      yaraRule += `        author = "${rule.author}"\n`;
    }
    if (rule.date) {
      yaraRule += `        date = "${rule.date}"\n`;
    }
    if (rule.tags.length > 0) {
      yaraRule += `        tags = "${rule.tags.join(', ')}"\n`;
    }
    
    if (rule.strings.length > 0) {
      yaraRule += '    strings:\n';
      rule.strings.forEach(str => {
        yaraRule += `        $${str.id} = ${this.formatString(str)}\n`;
      });
    }
    
    yaraRule += '    condition:\n';
    yaraRule += `        ${this.generateCondition(rule.conditions)}\n`;
    
    yaraRule += '}\n';
    
    return yaraRule;
  }
  
  private sanitizeIdentifier(name: string): string {
    return name.replace(/[^a-zA-Z0-9_]/g, '_');
  }
  
  private formatString(str: YaraString): string {
    let formattedValue = str.value;
    
    if (str.type === 'text') {
      formattedValue = `"${str.value}"`;
      if (str.modifier) {
        formattedValue += ` ${str.modifier}`;
      }
    } else if (str.type === 'hex') {
      formattedValue = `{${str.value}}`;
      if (str.modifier) {
        formattedValue += ` ${str.modifier}`;
      }
    } else if (str.type === 'regex') {
      formattedValue = `/${str.value}/`;
      if (str.modifier) {
        formattedValue += str.modifier;
      }
    }
    
    return formattedValue;
  }
  
  private generateCondition(conditions: YaraCondition[]): string {
    if (conditions.length === 0) {
      return 'any of them';
    }
    
    if (conditions.length === 1) {
      const cond = conditions[0];
      if (cond.type === 'contains') {
        return `$string1 contains "${cond.value}"`;
      } else if (cond.type === 'matches') {
        return `$string1 matches /${cond.value}/`;
      }
      return 'any of them';
    }
    
    if (conditions.length === 2) {
      return '($string1 and $string2)';
    }
    
    return 'any of them';
  }
  
  async analyzeFile(file: File): Promise<FileAnalysis> {
    const buffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(buffer);
    
    return {
      entropy: this.calculateEntropy(uint8Array),
      strings: this.extractStrings(uint8Array),
      fileType: this.detectFileType(uint8Array),
      size: uint8Array.length,
      md5: await this.calculateHash(uint8Array, 'MD5'),
      sha1: await this.calculateHash(uint8Array, 'SHA-1'),
      sha256: await this.calculateHash(uint8Array, 'SHA-256'),
      hexDump: this.createHexDump(uint8Array)
    };
  }
  
  generateRuleFromAnalysis(analysis: FileAnalysis, ruleName: string): string {
    const date = new Date().toISOString().split('T')[0];
    let rule = `rule ${this.sanitizeIdentifier(ruleName)}\n`;
    rule += '{\n';
    rule += '    meta:\n';
    rule += `        description = "Auto-generated rule for ${analysis.fileType} file"\n`;
    rule += `        author = "YARA Generator"\n`;
    rule += `        date = "${date}"\n`;
    rule += `        hash = "${analysis.sha256}"\n`;
    rule += `        file_type = "${analysis.fileType}"\n`;
    rule += '    \n';
    rule += '    strings:\n';
    
    const significantStrings = analysis.strings.slice(0, 5);
    significantStrings.forEach((str, index) => {
      const safeStr = str.replace(/"/g, '\\"');
      rule += `        $s${index + 1} = "${safeStr}"\n`;
    });
    
    rule += '    \n';
    rule += '    condition:\n';
    
    if (significantStrings.length > 0) {
      rule += '        any of them\n';
    } else {
      rule += '        filesize > 0\n';
    }
    
    rule += '}\n';
    
    return rule;
  }
  
  private calculateEntropy(uint8Array: Uint8Array): number {
    const frequency = new Map<number, number>();
    for (const byte of uint8Array) {
      frequency.set(byte, (frequency.get(byte) || 0) + 1);
    }
    
    let entropy = 0;
    const length = uint8Array.length;
    
    for (const count of frequency.values()) {
      const probability = count / length;
      entropy -= probability * Math.log2(probability);
    }
    
    return Math.round(entropy * 100) / 100;
  }
  
  private extractStrings(uint8Array: Uint8Array): string[] {
    const strings: string[] = [];
    let currentString = '';
    
    for (const byte of uint8Array) {
      if (byte >= 32 && byte <= 126) {
        currentString += String.fromCharCode(byte);
        if (currentString.length >= 4) {
          strings.push(currentString);
        }
      } else {
        if (currentString.length >= 4) {
          strings.push(currentString);
        }
        currentString = '';
      }
    }
    
    return [...new Set(strings)].slice(0, 50);
  }
  
  private detectFileType(uint8Array: Uint8Array): string {
    const signatures: Record<string, number[]> = {
      'PE': [77, 90],
      'ELF': [127, 69, 76, 70],
      'PDF': [37, 80, 68, 70],
      'ZIP': [80, 75, 3, 4],
      'PNG': [137, 80, 78, 71],
      'JPEG': [255, 216, 255],
      'GIF': [71, 73, 70, 56],
      'HTML': [60, 104, 116, 109, 108],
    };
    
    for (const [fileType, signature] of Object.entries(signatures)) {
      if (signature.every((byte, index) => uint8Array[index] === byte)) {
        return fileType;
      }
    }
    
    return 'Unknown';
  }
  
  private createHexDump(uint8Array: Uint8Array): string[] {
    const lines: string[] = [];
    const bytesPerLine = 16;
    
    for (let i = 0; i < Math.min(uint8Array.length, 512); i += bytesPerLine) {
      const chunk = uint8Array.slice(i, i + bytesPerLine);
      const offset = i.toString(16).padStart(8, '0');
      const hex = Array.from(chunk)
        .map(b => b.toString(16).padStart(2, '0'))
        .join(' ');
      const ascii = Array.from(chunk)
        .map(b => (b >= 32 && b <= 126) ? String.fromCharCode(b) : '.')
        .join('');
      
      lines.push(`${offset}  ${hex.padEnd(48, ' ')}  |${ascii}|`);
    }
    
    return lines;
  }
  
  private async calculateHash(uint8Array: Uint8Array, algorithm: string): Promise<string> {
    try {
      const hashBuffer = await crypto.subtle.digest(algorithm, uint8Array.buffer as ArrayBuffer);
      return Array.from(new Uint8Array(hashBuffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    } catch {
      return 'N/A';
    }
  }
}
