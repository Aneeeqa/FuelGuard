/**
 * Automated JavaScript Security Validator
 * Author: Senior Application Security Engineer
 * Version: 1.0.0
 * Description: Scans source code for security vulnerabilities
 *
 * Usage: node scripts/security-validator.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
};

// Security patterns to detect
const SECURITY_PATTERNS = [
  {
    id: 'INNERHTML_USAGE',
    name: 'innerHTML Assignment',
    severity: 'HIGH',
    category: 'XSS',
    pattern: /\.innerHTML\s*=/,
    description: 'Unsafe innerHTML assignment detected',
    recommendation: 'Use React JSX or DOMPurify for HTML rendering',
    cwe: 'CWE-79',
  },
  {
    id: 'EVAL_USAGE',
    name: 'eval() Function',
    severity: 'CRITICAL',
    category: 'Code Injection',
    pattern: /eval\s*\(/,
    description: 'Unsafe eval() detected - allows arbitrary code execution',
    recommendation: 'Avoid eval() or use alternatives with proper escaping',
    cwe: 'CWE-94',
  },
  {
    id: 'FUNCTION_CONSTRUCTOR',
    name: 'Function() Constructor',
    severity: 'HIGH',
    category: 'Code Injection',
    pattern: /new Function\s*\(/,
    description: 'Unsafe Function() constructor detected',
    recommendation: 'Use regular functions instead of dynamic code execution',
    cwe: 'CWE-94',
  },
  {
    id: 'DANGEROUSLY_SET_INNER_HTML',
    name: 'React dangerouslySetInnerHTML',
    severity: 'HIGH',
    category: 'XSS',
    pattern: /dangerouslySetInnerHTML\s*=/,
    description: 'React dangerouslySetInnerHTML detected - XSS risk',
    recommendation: 'Use DOMPurify or proper React JSX with sanitization',
    cwe: 'CWE-79',
  },
  {
    id: 'SETTIMEOUT_STRING',
    name: 'setTimeout with String',
    severity: 'MEDIUM',
    category: 'Code Injection',
    pattern: /setTimeout\s*\(\s*["']/,
    description: 'setTimeout with string argument - potential code injection',
    recommendation: 'Use function argument instead of string',
    cwe: 'CWE-94',
  },
  {
    id: 'SETINTERVAL_STRING',
    name: 'setInterval with String',
    severity: 'MEDIUM',
    category: 'Code Injection',
    pattern: /setInterval\s*\(\s*["']/,
    description: 'setInterval with string argument - potential code injection',
    recommendation: 'Use function argument instead of string',
    cwe: 'CWE-94',
  },
  {
    id: 'HARDCODED_API_KEY',
    name: 'Hardcoded API Key (Google Maps)',
    severity: 'HIGH',
    category: 'Secrets Management',
    pattern: /['"`](AIza[A-Za-z0-9_-]{35})['"`]/,
    description: 'Potential Google Maps API key detected in source code',
    recommendation: 'Move API keys to environment variables or secrets manager',
    cwe: 'CWE-798',
  },
  {
    id: 'HARDCODED_STRIPE_KEY',
    name: 'Hardcoded Stripe API Key',
    severity: 'CRITICAL',
    category: 'Secrets Management',
    pattern: /['"`](sk_live_\w+|pk_live_\w+|sk_test_\w+|pk_test_\w+)['"`]/,
    description: 'Hardcoded Stripe API key detected',
    recommendation: 'Move API keys to environment variables and rotate immediately',
    cwe: 'CWE-798',
  },
  {
    id: 'HARDCODED_SECRET',
    name: 'Hardcoded Secret/Password',
    severity: 'HIGH',
    category: 'Secrets Management',
    pattern: /(password|secret|api_key|private_key)\s*[:=]\s*["'](?!example|dummy|test|placeholder)/i,
    description: 'Potential hardcoded secret detected',
    recommendation: 'Move secrets to environment variables or secrets manager',
    cwe: 'CWE-798',
  },
  {
    id: 'DOCUMENT_WRITE',
    name: 'document.write()',
    severity: 'HIGH',
    category: 'XSS',
    pattern: /document\.write\s*\(/,
    description: 'document.write() detected - XSS risk',
    recommendation: 'Use DOM methods or React JSX',
    cwe: 'CWE-79',
  },
  {
    id: 'LOCALSTORAGE_USAGE',
    name: 'localStorage Usage',
    severity: 'MEDIUM',
    category: 'Data Security',
    pattern: /localStorage\.(getItem|setItem|removeItem|clear)\s*\(/,
    description: 'localStorage usage detected - requires validation',
    recommendation: 'Validate all localStorage operations and consider encryption',
    cwe: 'CWE-20',
  },
  {
    id: 'JSON_PARSE',
    name: 'JSON.parse() Usage',
    severity: 'MEDIUM',
    category: 'Injection',
    pattern: /JSON\.parse\s*\(/,
    description: 'JSON.parse detected - requires validation',
    recommendation: 'Implement safe JSON parsing with validation and prototype pollution protection',
    cwe: 'CWE-502',
  },
  {
    id: 'LOCALSTORAGE_SENITIVE',
    name: 'Sensitive Data in localStorage',
    severity: 'HIGH',
    category: 'Data Security',
    pattern: /localStorage\.(setItem)\s*\([^)]*password|token|secret|key)/i,
    description: 'Storing sensitive data in localStorage',
    recommendation: 'Use secure storage mechanisms like encrypted IndexedDB or server-side storage',
    cwe: 'CWE-922',
  },
  {
    id: 'CORS_PROXY',
    name: 'CORS Proxy Usage',
    severity: 'HIGH',
    category: 'Third-Party Risk',
    pattern: /corsproxy\.io|allorigins\.win/,
    description: 'Using third-party CORS proxy - MITM risk',
    recommendation: 'Implement server-side proxy or use proper CORS configuration',
    cwe: 'CWE-918',
  },
];

// Patterns that indicate secure implementations (false positives to exclude)
const SAFE_IMPLEMENTATIONS = [
  /\/\/.*innerHTML/,              // Commented code
  /\/\*.*innerHTML.*\*\//,        // Block comment
  /\.\.innerHTML\s*=\s*<Safe>/,    // Marked as safe
  /safeJsonParse/,                   // Safe implementation
  /validateJson/,                    // Validation function
  /sanitizeJson/,                    // Sanitization function
];

/**
 * Check if a finding is a false positive
 * @param {Object} finding - Finding to check
 * @param {string} code - Code snippet
 * @returns {boolean} Is false positive
 */
const isFalsePositive = (finding, code) => {
  // Check if code is commented
  const line = code.trim();
  if (line.startsWith('//') || line.startsWith('*') || line.startsWith('/*')) {
    return true;
  }

  // Check for safe implementation markers
  for (const safePattern of SAFE_IMPLEMENTATIONS) {
    if (safePattern.test(code)) {
      return true;
    }
  }

  return false;
};

/**
 * Scan a single file for security issues
 * @param {string} filePath - Path to file
 * @returns {Array} Security findings
 */
const scanFile = (filePath) => {
  const findings = [];
  let content;

  try {
    content = fs.readFileSync(filePath, 'utf-8');
  } catch (error) {
    console.error(`Failed to read ${filePath}:`, error.message);
    return findings;
  }

  const lines = content.split('\n');

  SECURITY_PATTERNS.forEach((pattern) => {
    lines.forEach((line, index) => {
      if (pattern.pattern.test(line)) {
        const finding = {
          id: generateFindingId(),
          ruleId: pattern.id,
          file: filePath,
          line: index + 1,
          severity: pattern.severity,
          category: pattern.category,
          name: pattern.name,
          description: pattern.description,
          recommendation: pattern.recommendation,
          cwe: pattern.cwe,
          code: line.trim(),
          codeSnippet: getCodeSnippet(lines, index),
        };

        // Check for false positives
        if (!isFalsePositive(finding, line)) {
          findings.push(finding);
        }
      }
    });
  });

  return findings;
};

/**
 * Get code snippet around finding
 * @param {Array} lines - All lines in file
 * @param {number} lineIndex - Index of finding line
 * @returns {string} Code snippet
 */
const getCodeSnippet = (lines, lineIndex) => {
  const start = Math.max(0, lineIndex - 2);
  const end = Math.min(lines.length, lineIndex + 3);

  return lines
    .slice(start, end)
    .map((line, i) => `${start + i + 1}: ${line}`)
    .join('\n');
};

/**
 * Generate unique finding ID
 * @returns {string} Finding ID
 */
const generateFindingId = () => {
  return `FIND-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Find all JavaScript/JSX files recursively
 * @param {string} dir - Directory to scan
 * @returns {Array} File paths
 */
const findJsFiles = (dir) => {
  const files = [];

  const scanDirectory = (currentDir) => {
    let entries;

    try {
      entries = fs.readdirSync(currentDir, { withFileTypes: true });
    } catch (error) {
      // Skip directories we can't read
      return;
    }

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);

      if (entry.isDirectory()) {
        // Skip common exclude directories
        if (
          !['node_modules', 'dist', '.git', 'build', '.next', '.vite'].includes(entry.name)
        ) {
          scanDirectory(fullPath);
        }
      } else if (entry.isFile()) {
        // Scan .js and .jsx files
        if (entry.name.endsWith('.js') || entry.name.endsWith('.jsx')) {
          files.push(fullPath);
        }
      }
    }
  };

  scanDirectory(dir);
  return files;
};

/**
 * Print header with styling
 * @param {string} text - Header text
 */
const printHeader = (text) => {
  console.log(`${colors.bright}${colors.blue}${'='.repeat(42)}${colors.reset}`);
  console.log(`${colors.bright}${colors.blue}  ${text}${colors.reset}`);
  console.log(`${colors.bright}${colors.blue}${'='.repeat(42)}${colors.reset}`);
  console.log('');
};

/**
 * Print finding with color-coded severity
 * @param {Object} finding - Finding to print
 */
const printFinding = (finding) => {
  const severityColors = {
    CRITICAL: colors.red,
    HIGH: colors.yellow,
    MEDIUM: colors.cyan,
    LOW: colors.white,
  };

  const severityEmojis = {
    CRITICAL: '🚨',
    HIGH: '⚠️',
    MEDIUM: '⚡',
    LOW: 'ℹ️',
  };

  const color = severityColors[finding.severity] || colors.white;
  const emoji = severityEmojis[finding.severity] || 'ℹ️';

  // Print header
  console.log(`${color}${emoji} [${finding.severity}] ${finding.name}${colors.reset}`);
  console.log(`   ${colors.dim}─${colors.reset}${color}─────────────────────────────${colors.reset}`);
  console.log(`   📄 ${colors.cyan}File:${colors.reset}       ${finding.file}`);
  console.log(`   📍 ${colors.cyan}Line:${colors.reset}       ${finding.line}`);
  console.log(`   🔍 ${colors.cyan}Category:${colors.reset}   ${finding.category}`);
  console.log(`   🔖 ${colors.cyan}CWE:${colors.reset}         ${finding.cwe}`);
  console.log('');
  console.log(`   📝 ${colors.yellow}Description:${colors.reset}`);
  console.log(`   ${colors.dim}   ${finding.description}${colors.reset}`);
  console.log('');
  console.log(`   💡 ${colors.green}Recommendation:${colors.reset}`);
  console.log(`   ${colors.dim}   ${finding.recommendation}${colors.reset}`);
  console.log('');
  console.log(`   💻 ${colors.yellow}Code:${colors.reset}`);
  console.log(`   ${colors.dim}${finding.code}${colors.reset}`);
  console.log('');
};

/**
 * Print summary statistics
 * @param {Object} summary - Summary data
 */
const printSummary = (summary) => {
  printHeader('Summary Statistics');

  console.log(`  ${colors.cyan}Total Findings:${colors.reset}    ${summary.total}`);
  console.log(`  ${colors.green}Passed:${colors.reset}          ${summary.passed}`);
  console.log(`  ${colors.red}Failed:${colors.reset}          ${summary.failed}`);

  console.log('');

  // Print severity breakdown
  console.log(`${colors.bright}Severity Breakdown:${colors.reset}`);

  const severityOrder = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
  for (const severity of severityOrder) {
    const count = summary.bySeverity[severity] || 0;
    const color = {
      CRITICAL: colors.red,
      HIGH: colors.yellow,
      MEDIUM: colors.cyan,
      LOW: colors.white,
    }[severity];

    if (count > 0) {
      console.log(`  ${color}${severity}:${colors.reset} ${count}`);
    }
  }

  console.log('');

  // Print category breakdown
  console.log(`${colors.bright}Category Breakdown:${colors.reset}`);
  const categories = [...new Set(summary.findings.map(f => f.category))];
  for (const category of categories) {
    const count = summary.findings.filter(f => f.category === category).length;
    console.log(`  ${category}: ${count}`);
  }

  console.log('');

  // Calculate and print security score
  const score = calculateSecurityScore(summary);
  const scoreColor = score >= 80 ? colors.green : score >= 60 ? colors.yellow : colors.red;
  const rating = score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : score >= 40 ? 'Fair' : 'Poor';

  console.log(`${colors.bright}Security Score:${colors.reset}  ${scoreColor}${score}%${colors.reset} (${rating})`);
  console.log('');
};

/**
 * Calculate security score based on findings
 * @param {Object} summary - Summary data
 * @returns {number} Security score (0-100)
 */
const calculateSecurityScore = (summary) => {
  const weights = {
    CRITICAL: 25,
    HIGH: 15,
    MEDIUM: 5,
    LOW: 2,
  };

  const maxDeductions = summary.findings.reduce((total, finding) => {
    return total + (weights[finding.severity] || 0);
  }, 0);

  // Calculate score (start at 100, deduct based on findings)
  const score = Math.max(0, 100 - maxDeductions);

  return Math.round(score);
};

/**
 * Generate HTML report
 * @param {Object} summary - Summary data
 * @param {string} outputPath - Output file path
 */
const generateHtmlReport = (summary, outputPath) => {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Security Audit Report - Fuel Guard</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
             background: #f5f5f5; color: #333; line-height: 1.6; }
    .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
    .header { background: #3b82f6; color: white; padding: 30px;
              border-radius: 8px 8px 0 0; margin-bottom: 30px; }
    .header h1 { margin: 0; font-size: 28px; }
    .header p { margin: 10px 0 0 0; opacity: 0.9; }
    .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 20px; margin-bottom: 30px; }
    .summary-card { background: white; padding: 20px; border-radius: 8px;
                   box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .summary-card h3 { margin: 0 0 10px 0; font-size: 14px;
                         text-transform: uppercase; color: #666; }
    .summary-card .value { font-size: 32px; font-weight: bold; }
    .findings { background: white; padding: 30px; border-radius: 8px;
                 box-shadow: 0 2px 8px rgba(0,0,0,0.1); margin-bottom: 30px; }
    .findings-list { list-style: none; padding: 0; }
    .finding { border: 1px solid #e5e7eb; border-radius: 8px;
                padding: 20px; margin-bottom: 20px;
                border-left: 4px solid; }
    .finding.critical { border-left-color: #dc2626; background: #fef2f2; }
    .finding.high { border-left-color: #f59e0b; background: #fffbeb; }
    .finding.medium { border-left-color: #3b82f6; background: #dbeafe; }
    .finding.low { border-left-color: #6b7280; background: #f3f4f6; }
    .finding-header { display: flex; align-items: center; gap: 10px; margin-bottom: 15px; }
    .finding-header .severity { padding: 4px 12px; border-radius: 4px;
                                  font-size: 12px; font-weight: bold; }
    .finding-header .severity.critical { background: #dc2626; color: white; }
    .finding-header .severity.high { background: #f59e0b; color: white; }
    .finding-header .severity.medium { background: #3b82f6; color: white; }
    .finding-header .severity.low { background: #6b7280; color: white; }
    .finding h4 { margin: 0; font-size: 18px; }
    .finding-meta { color: #666; font-size: 13px; margin-bottom: 10px; }
    .finding-description { margin: 15px 0; line-height: 1.7; }
    .finding-recommendation { background: #f0fdf4; padding: 15px;
                          border-radius: 6px; margin: 15px 0; }
    .finding-recommendation strong { color: #166534; }
    .code { background: #1e293b; color: #e5e7eb; padding: 15px;
            border-radius: 6px; overflow-x: auto; font-family: monospace;
            font-size: 13px; margin-top: 15px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔒 Security Audit Report</h1>
      <p>Fuel Guard Application - Generated on ${new Date().toLocaleString()}</p>
    </div>

    <div class="summary">
      <div class="summary-card">
        <h3>Total Files</h3>
        <div class="value">${summary.filesScanned}</div>
      </div>
      <div class="summary-card">
        <h3>Findings</h3>
        <div class="value">${summary.total}</div>
      </div>
      <div class="summary-card">
        <h3>Security Score</h3>
        <div class="value">${calculateSecurityScore(summary)}%</div>
      </div>
    </div>

    <div class="findings">
      <h2>Security Findings</h2>
      <ul class="findings-list">
        ${summary.findings.map(finding => `
          <li class="finding ${finding.severity.toLowerCase()}">
            <div class="finding-header">
              <span class="severity ${finding.severity.toLowerCase()}">${finding.severity}</span>
              <h4>${finding.name}</h4>
            </div>
            <div class="finding-meta">
              📄 ${finding.file} | 📍 Line ${finding.line} | 🔍 ${finding.category} | 🔖 ${finding.cwe}
            </div>
            <div class="finding-description">
              <strong>Description:</strong> ${finding.description}
            </div>
            <div class="finding-recommendation">
              <strong>Recommendation:</strong> ${finding.recommendation}
            </div>
            <div class="code">
              <pre>${finding.code}</pre>
            </div>
          </li>
        `).join('')}
      </ul>
    </div>
  </div>
</body>
</html>
  `.trim();

  fs.writeFileSync(outputPath, html);
};

/**
 * Generate JSON report
 * @param {Object} summary - Summary data
 * @param {string} outputPath - Output file path
 */
const generateJsonReport = (summary, outputPath) => {
  const report = {
    scanDate: new Date().toISOString(),
    scanVersion: '1.0.0',
    target: 'Fuel Guard Application',
    summary: {
      filesScanned: summary.filesScanned,
      totalFindings: summary.total,
      bySeverity: summary.bySeverity,
      securityScore: calculateSecurityScore(summary),
    },
    findings: summary.findings.map(finding => ({
      id: finding.id,
      ruleId: finding.ruleId,
      file: finding.file,
      line: finding.line,
      severity: finding.severity,
      category: finding.category,
      name: finding.name,
      description: finding.description,
      recommendation: finding.recommendation,
      cwe: finding.cwe,
      code: finding.code,
    })),
  };

  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
};

/**
 * Main execution function
 */
const main = () => {
  // Check arguments
  const args = process.argv.slice(2);
  const targetDir = args[0] || path.join(__dirname, '..', 'src');
  const outputFormat = args[1] || 'all';

  printHeader('🔒 Security Validator');

  console.log(`Scanning directory: ${targetDir}`);
  console.log(`Output format: ${outputFormat}`);
  console.log('');

  // Find all JS/JSX files
  const files = findJsFiles(targetDir);

  if (files.length === 0) {
    console.log(`${colors.red}No JavaScript/JSX files found${colors.reset}`);
    process.exit(1);
  }

  console.log(`Found ${files.length} files to scan`);
  console.log('');
  console.log(`${colors.dim}Scanning...${colors.reset}`);
  console.log('');

  // Scan all files
  const allFindings = [];
  const startTime = Date.now();

  for (const file of files) {
    const findings = scanFile(file);
    allFindings.push(...findings);
  }

  const scanTime = ((Date.now() - startTime) / 1000).toFixed(2);

  // Group findings by severity
  const bySeverity = {
    CRITICAL: allFindings.filter(f => f.severity === 'CRITICAL').length,
    HIGH: allFindings.filter(f => f.severity === 'HIGH').length,
    MEDIUM: allFindings.filter(f => f.severity === 'MEDIUM').length,
    LOW: allFindings.filter(f => f.severity === 'LOW').length,
  };

  // Calculate passed/failed (file with no critical/high = pass)
  const passed = files.length - allFindings.filter(f =>
    f.severity === 'CRITICAL' || f.severity === 'HIGH'
  ).length;
  const failed = files.length - passed;

  const summary = {
    filesScanned: files.length,
    total: allFindings.length,
    passed,
    failed,
    bySeverity,
    findings: allFindings,
    scanTime,
  };

  // Print findings to console
  if (allFindings.length > 0) {
    printHeader('Security Findings');
    for (const finding of allFindings) {
      printFinding(finding);
    }
  } else {
    console.log(`${colors.green}${colors.bright}✅ No security issues found!${colors.reset}`);
    console.log('');
  }

  // Print summary
  printSummary(summary);

  // Generate reports
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportsDir = path.join(__dirname, '..', 'security-reports');

  // Create reports directory if it doesn't exist
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  if (outputFormat === 'all' || outputFormat === 'html') {
    const htmlPath = path.join(reportsDir, `security-report-${timestamp}.html`);
    generateHtmlReport(summary, htmlPath);
    console.log(`${colors.cyan}📄 HTML report:${colors.reset} ${htmlPath}`);
  }

  if (outputFormat === 'all' || outputFormat === 'json') {
    const jsonPath = path.join(reportsDir, `security-report-${timestamp}.json`);
    generateJsonReport(summary, jsonPath);
    console.log(`${colors.cyan}📄 JSON report:${colors.reset} ${jsonPath}`);
  }

  console.log('');
  console.log(`${colors.dim}Scan completed in ${scanTime}s${colors.reset}`);
  console.log('');

  // Exit with appropriate code
  process.exit(bySeverity.CRITICAL > 0 || bySeverity.HIGH > 0 ? 1 : 0);
};

// Run if called directly
if (import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}`) {
  main();
}

export {
  scanFile,
  findJsFiles,
  SECURITY_PATTERNS,
};
