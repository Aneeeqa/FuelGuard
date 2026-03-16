/**
 * Convert EPA vehicles.csv to vehicles-epa.json
 *
 * Reads the vehicles.csv file and produces a compact indexed JSON
 * at public/data/vehicles-epa.json for local EPA data lookups.
 *
 * Run with: node scripts/convertCSVtoJSON.js
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const ROOT = resolve(__dirname, '..');
const CSV_PATH = resolve(ROOT, 'vehicles.csv');
const OUT_PATH = resolve(ROOT, 'public', 'data', 'vehicles-epa.json');

if (!existsSync(CSV_PATH)) {
  console.error(`CSV not found at: ${CSV_PATH}`);
  process.exit(1);
}

console.log('Reading vehicles.csv...');
const rawContent = readFileSync(CSV_PATH, 'utf-8');

/**
 * Parse a CSV line respecting quoted fields.
 * EPA CSV values do not typically have quoted commas, but we handle it safely.
 */
function parseCsvLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

const lines = rawContent.split('\n');
const headerLine = lines[0].replace(/\r/g, '');
const headers = parseCsvLine(headerLine);

// Build a column index map
const col = {};
headers.forEach((h, i) => { col[h.trim()] = i; });

// Verify required columns exist
const required = ['id', 'year', 'make', 'model', 'baseModel', 'city08', 'highway08', 'comb08',
  'fuelType1', 'cylinders', 'displ', 'drive', 'trany', 'VClass', 'co2TailpipeGpm'];
for (const r of required) {
  if (col[r] === undefined) {
    console.error(`Required column "${r}" not found in CSV. Columns: ${headers.join(', ')}`);
    process.exit(1);
  }
}

console.log(`Columns found. Processing ${lines.length - 1} records...`);

const yearsSet = new Set();
const makesByYear = {};         // year -> Set of makes
const modelsByYearMake = {};    // "year|make" -> Set of baseModels
const variantsByYearMakeModel = {}; // "year|make|baseModel" -> [{text, value}]
const vehicleDetails = {};      // vehicleId -> compact details

let processed = 0;
let skipped = 0;

for (let i = 1; i < lines.length; i++) {
  const line = lines[i].replace(/\r/g, '').trim();
  if (!line) continue;

  const fields = parseCsvLine(line);
  if (fields.length < headers.length) {
    skipped++;
    continue;
  }

  const get = (name) => (fields[col[name]] || '').trim();

  const id = parseInt(get('id'), 10);
  const year = parseInt(get('year'), 10);
  // Normalize make to title case to avoid duplicates like "MINI" vs "Mini"
  const rawMake = get('make');
  const make = rawMake
    ? rawMake.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
        // Preserve well-known all-caps acronyms/brands
        .replace(/\bBmw\b/g, 'BMW').replace(/\bGmc\b/g, 'GMC').replace(/\bSuv\b/g, 'SUV')
    : '';
  const fullModel = get('model');
  const baseModel = get('baseModel') || fullModel;   // Fall back to full model
  const city08 = parseInt(get('city08'), 10) || 0;
  const highway08 = parseInt(get('highway08'), 10) || 0;
  const comb08 = parseInt(get('comb08'), 10) || 0;
  const fuelType1 = get('fuelType1');
  const cylinders = parseInt(get('cylinders'), 10) || 0;
  const displ = parseFloat(get('displ')) || 0;
  const drive = get('drive');
  const trany = get('trany');
  const vClass = get('VClass');
  const co2 = Math.round(parseFloat(get('co2TailpipeGpm')) * 10) / 10 || 0;

  // Skip invalid rows
  if (!id || !year || !make || !baseModel) {
    skipped++;
    continue;
  }

  yearsSet.add(year);

  if (!makesByYear[year]) makesByYear[year] = new Set();
  makesByYear[year].add(make);

  const ymKey = `${year}|${make}`;
  if (!modelsByYearMake[ymKey]) modelsByYearMake[ymKey] = new Set();
  modelsByYearMake[ymKey].add(baseModel);

  const ymmKey = `${year}|${make}|${baseModel}`;
  if (!variantsByYearMakeModel[ymmKey]) variantsByYearMakeModel[ymmKey] = [];

  // Build a human-readable variant label
  const parts = [];
  if (fullModel && fullModel !== baseModel) parts.push(fullModel.replace(baseModel, '').trim() || fullModel);
  if (displ) parts.push(`${displ}L`);
  if (cylinders) parts.push(`${cylinders}cyl`);
  if (trany) parts.push(trany);
  if (drive) parts.push(drive.replace('-Wheel Drive', 'WD').replace('Wheel Drive', 'WD'));

  const variantText = parts.length > 0 ? parts.join(' · ') : `${fullModel} (${trany})`;

  variantsByYearMakeModel[ymmKey].push({ text: variantText, value: id });

  // Store compact vehicle details (short key names, NO strings that can be omitted if empty)
  vehicleDetails[id] = {
    c: city08,
    h: highway08,
    m: comb08,
    ...(fuelType1 ? { f: fuelType1 } : {}),
    ...(cylinders ? { y: cylinders } : {}),
    ...(displ ? { d: displ } : {}),
    ...(drive ? { dr: drive } : {}),
    ...(trany ? { t: trany } : {}),
    ...(vClass ? { vc: vClass } : {}),
    ...(co2 > 0 ? { co2 } : {}),
  };

  processed++;
  if (processed % 10000 === 0) {
    console.log(`  Processed ${processed} records...`);
  }
}

console.log(`Done. Processed: ${processed}, Skipped: ${skipped}`);

// Convert Sets to sorted arrays
const sortedYears = Array.from(yearsSet).sort((a, b) => b - a);

const makesByYearArr = {};
for (const [year, makesSet] of Object.entries(makesByYear)) {
  makesByYearArr[year] = Array.from(makesSet).sort();
}

const modelsByYearMakeArr = {};
for (const [key, modelsSet] of Object.entries(modelsByYearMake)) {
  modelsByYearMakeArr[key] = Array.from(modelsSet).sort();
}

const output = {
  meta: {
    source: 'EPA FuelEconomy.gov',
    lastUpdated: new Date().toISOString().split('T')[0],
    totalVehicles: processed,
  },
  years: sortedYears,
  makesByYear: makesByYearArr,
  modelsByYearMake: modelsByYearMakeArr,
  variantsByYearMakeModel,
  vehicleDetails,
};

console.log('Writing output JSON...');
writeFileSync(OUT_PATH, JSON.stringify(output));

const stats = readFileSync(OUT_PATH);
const sizeMB = (stats.length / 1024 / 1024).toFixed(2);
console.log(`\nOutput written to: ${OUT_PATH}`);
console.log(`File size: ${sizeMB} MB`);
console.log(`Years: ${sortedYears.length}`);
console.log(`Total vehicles: ${processed}`);
