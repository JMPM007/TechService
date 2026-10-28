import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendRoot = path.resolve(__dirname, '..');
const coverageDir = path.join(backendRoot, 'coverage');
const threshold = Number(process.env.COVERAGE_THRESHOLD ?? 70);
const reportFile = path.join(coverageDir, 'coverage-summary.json');
const txtReportFile = path.join(coverageDir, 'coverage-report.txt');

function ensureCoverageDir() {
  fs.mkdirSync(coverageDir, { recursive: true });
}

function runTests() {
  ensureCoverageDir();
  const result = spawnSync(process.execPath, ['--test'], {
    cwd: backendRoot,
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_V8_COVERAGE: coverageDir,
    },
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function isTargetFile(filePath) {
  const normalized = path.normalize(filePath).replace(/\\/g, '/');
  return normalized.includes('/src/') || normalized.includes('\\src\\');
}

function summarizeFile(filePath, functions) {
  const functionCoverage = new Map();

  for (const fn of functions || []) {
    const fnName = fn.functionName || '<anonymous>';

    for (const range of fn.ranges || []) {
      const length = Math.max(0, range.endOffset - range.startOffset);
      if (length === 0) continue;

      const rangeKey = `${fnName}:${range.startOffset}-${range.endOffset}`;
      const fnCurrent = functionCoverage.get(fnName) ?? { total: 0, covered: 0 };
      const existing = fnCurrent._ranges ?? new Map();
      const existingCount = existing.get(rangeKey)?.count ?? -1;
      if (range.count > existingCount) {
        existing.set(rangeKey, { length, count: range.count });
      }
      fnCurrent._ranges = existing;
      functionCoverage.set(fnName, fnCurrent);
    }
  }

  for (const stats of functionCoverage.values()) {
    let total = 0;
    let covered = 0;
    for (const range of stats._ranges.values()) {
      total += range.length;
      if (range.count > 0) covered += range.length;
    }
    stats.total = total;
    stats.covered = covered;
    delete stats._ranges;
  }

  let total = 0;
  let covered = 0;
  const uncoveredFunctions = [];

  for (const [fnName, stats] of functionCoverage.entries()) {
    total += stats.total;
    covered += stats.covered;
    if (stats.total > 0 && stats.covered < stats.total) {
      uncoveredFunctions.push(fnName);
    }
  }

  const percentage = total === 0 ? 100 : (covered / total) * 100;

  return {
    file: filePath,
    percentage: Number(percentage.toFixed(2)),
    totalLinesOrBlocks: total,
    coveredLinesOrBlocks: covered,
    uncoveredFunctions,
  };
}

function buildCoverageReport() {
  const files = fs.readdirSync(coverageDir)
    .filter((file) => file.endsWith('.json'))
    .map((file) => path.join(coverageDir, file));

  const report = new Map();

  for (const file of files) {
    const raw = JSON.parse(fs.readFileSync(file, 'utf8'));

    for (const script of raw.result || []) {
      const url = script.url;
      if (!url || !url.startsWith('file://')) continue;

      const resolved = fileURLToPath(new URL(url));
      if (!isTargetFile(resolved)) continue;

      const relativePath = path.relative(backendRoot, resolved).replace(/\\/g, '/');
      const entry = report.get(relativePath) ?? {
        file: relativePath,
        functions: [],
      };

      entry.functions.push(...(script.functions || []));
      report.set(relativePath, entry);
    }
  }

  const fileSummaries = Array.from(report.values())
    .map(({ file, functions }) => summarizeFile(file, functions))
    .sort((a, b) => a.file.localeCompare(b.file));

  let totalBlocks = 0;
  let coveredBlocks = 0;

  for (const summary of fileSummaries) {
    totalBlocks += summary.totalLinesOrBlocks;
    coveredBlocks += summary.coveredLinesOrBlocks;
  }

  const overallCoverage = totalBlocks === 0 ? 100 : (coveredBlocks / totalBlocks) * 100;
  const passed = overallCoverage >= threshold;

  const summary = {
    generatedAt: new Date().toISOString(),
    threshold,
    overallCoverage: Number(overallCoverage.toFixed(2)),
    status: passed ? 'PASS' : 'FAIL',
    files: fileSummaries,
  };

  fs.writeFileSync(reportFile, JSON.stringify(summary, null, 2));

  const lines = [
    'TechService QA Coverage Report',
    `Generated at: ${summary.generatedAt}`,
    `Overall coverage: ${summary.overallCoverage.toFixed(2)}%`,
    `Threshold: ${summary.threshold.toFixed(2)}%`,
    `Status: ${summary.status}`,
    '',
  ];

  for (const fileSummary of fileSummaries) {
    lines.push(`${fileSummary.file}: ${fileSummary.percentage.toFixed(2)}%`);
    if (fileSummary.uncoveredFunctions.length > 0) {
      lines.push(`  Functions without execution: ${fileSummary.uncoveredFunctions.join(', ')}`);
    }
  }

  fs.writeFileSync(txtReportFile, `${lines.join('\n')}\n`);

  console.log(`\nCobertura QA general: ${summary.overallCoverage.toFixed(2)}%`);
  console.log(`Umbral mínimo: ${threshold.toFixed(2)}%`);
  console.log(`Estado: ${summary.status}`);

  for (const fileSummary of fileSummaries) {
    console.log(`- ${fileSummary.file}: ${fileSummary.percentage.toFixed(2)}%`);
  }

  if (!passed) {
    console.error('\nLa cobertura no alcanza el umbral mínimo requerido.');
    process.exit(1);
  }
}

function main() {
  runTests();
  buildCoverageReport();
}

main();
