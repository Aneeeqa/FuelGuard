#!/usr/bin/env node

/**
 * Variable Usage & Hardcode Checker
 * Scans codebase for hardcoded values and unused variables
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FILES_TO_CHECK = [
  'src/utils/fuelDrainCalculator.js',
  'src/pages/Settings.jsx',
  'src/pages/Dashboard.jsx',
  'src/utils/fuelLevelAlerts.js',
  'src/utils/carbonCalculations.js',
  'src/utils/tankToTankCalculations.js',
];

const ISSUES = [];

function checkFile(filePath) {
  const fullPath = path.join(__dirname, filePath);
  const content = fs.readFileSync(fullPath, 'utf-8');
  const lines = content.split('\n');

  console.log(`\n🔍 Checking: ${filePath}`);
  console.log('='.repeat(60));

  // Check 1: Hardcoded currency symbols
  const currencyMatches = content.match(/\$\s*(?![a-zA-Z])/g);
  if (currencyMatches) {
    currencyMatches.forEach((match, i) => {
      const lineNum = content.substring(0, content.indexOf(match)).split('\n').length;
      ISSUES.push({
        file: filePath,
        line: lineNum,
        type: 'HARDCODED_CURRENCY',
        message: `Found hardcoded '$' currency symbol`
      });
    });
  }

  // Check 2: Hardcoded "km" or "mi" in return strings
  const kmMatches = content.match(/['"`](\d+\.?\d*\s*km)['"`]/gi);
  if (kmMatches) {
    kmMatches.forEach((match) => {
      const lineNum = content.substring(0, content.indexOf(match)).split('\n').length;
      ISSUES.push({
        file: filePath,
        line: lineNum,
        type: 'HARDCODED_UNIT',
        message: `Found hardcoded unit in string: ${match}`
      });
    });
  }

  // Check 3: Hardcoded tank capacity in functions
  const tankCapacityHardcoded = content.match(/const tankCapacity\s*=\s*\d+/g);
  if (tankCapacityHardcoded) {
    tankCapacityHardcoded.forEach((match) => {
      const lineNum = content.substring(0, content.indexOf(match)).split('\n').length;
      // Check if function receives tankCapacity parameter
      const functionStart = content.lastIndexOf('function', content.indexOf(match));
      const hasParam = content.substring(functionStart, content.indexOf(match)).includes('tankCapacity');

      if (!hasParam) {
        ISSUES.push({
          file: filePath,
          line: lineNum,
          type: 'HARDCODED_TANK_CAPACITY',
          message: `Found hardcoded tank capacity (should use parameter)`
        });
      }
    });
  }

  // Check 4: Function parameters that aren't used
  // This is simplified - a real linter would be more accurate
  const functionParams = content.match(/export const \w+\s*=\s*\(([^)]+)\)\s*=>/g);
  if (functionParams) {
    functionParams.forEach((match) => {
      const params = match.match(/\(([^)]+)\)/)[1].split(',').map(p => p.trim());
      const funcName = match.match(/export const (\w+)/)[1];

      // Find function body
      const funcStart = content.indexOf(match);
      const funcBody = content.substring(funcStart + match.length);

      params.forEach(param => {
        if (!funcBody.includes(param)) {
          ISSUES.push({
            file: filePath,
            line: content.substring(0, funcStart).split('\n').length,
            type: 'UNUSED_PARAMETER',
            message: `Parameter '${param}' in function '${funcName}' appears unused`
          });
        }
      });
    });
  }

  // Check 5: Magic numbers (thresholds, etc.)
  const magicNumbers = content.match(/\b(0\.\d+|\d{2,3})\b/g);
  if (magicNumbers) {
    magicNumbers.forEach((num) => {
      const lineNum = content.substring(0, content.indexOf(num)).split('\n').length;
      const line = lines[lineNum - 1];

      // Only flag certain patterns
      if (line.includes(num) && !line.includes('//') && !line.includes('*')) {
        if (['15', '25', '50', '75', '200', '0.75', '0.25'].includes(num)) {
          // These might be intentional defaults, just log them
          console.log(`  ℹ️  Line ${lineNum}: Possible default value: ${num}`);
        }
      }
    });
  }

  if (!currencyMatches?.length && !kmMatches?.length && !tankCapacityHardcoded?.length) {
    console.log('  ✅ No critical issues found');
  }
}

// Run checks
FILES_TO_CHECK.forEach(checkFile);

// Print summary
console.log('\n');
console.log('='.repeat(60));
console.log('📊 SUMMARY');
console.log('='.repeat(60));

if (ISSUES.length === 0) {
  console.log('✅ No issues found!');
} else {
  console.log(`\n❌ Found ${ISSUES.length} issues:\n`);

  const grouped = {};
  ISSUES.forEach(issue => {
    if (!grouped[issue.type]) {
      grouped[issue.type] = [];
    }
    grouped[issue.type].push(issue);
  });

  Object.keys(grouped).forEach(type => {
    console.log(`\n🚨 ${type}:`);
    grouped[type].forEach(issue => {
      console.log(`   - ${issue.file}:${issue.line} - ${issue.message}`);
    });
  });

  console.log('\n');
  console.log('='.repeat(60));
  console.log('📝 See COMPREHENSIVE_FIXES.md for detailed fix instructions');
  console.log('='.repeat(60));
}
