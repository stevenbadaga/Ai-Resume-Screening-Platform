/**
 * High-Concurrency Stress Test & Load Benchmarking Suite.
 *
 * Simulates concurrent traffic against server endpoints to measure throughput
 * (requests per second), latency percentiles (p50, p95, p99), error rates,
 * and connection pool stability.
 *
 * Usage:
 *   npx tsx scripts/stressTest.ts
 *   npx tsx scripts/stressTest.ts --url https://ai-resume-screening.onrender.com --vus 25 --requests 250
 */

interface BenchmarkConfig {
  baseUrl: string;
  concurrency: number;
  totalRequests: number;
}

interface RequestResult {
  status: number;
  durationMs: number;
  error?: string;
}

interface BenchmarkSummary {
  name: string;
  totalRequests: number;
  successful: number;
  clientErrors: number;
  serverErrors: number;
  rateLimited: number;
  totalTimeMs: number;
  reqPerSec: number;
  p50: number;
  p90: number;
  p95: number;
  p99: number;
  min: number;
  max: number;
}

function parseArgs(): BenchmarkConfig {
  const args = process.argv.slice(2);
  let baseUrl = process.env.APP_URL || 'http://127.0.0.1:3000';
  let concurrency = 20;
  let totalRequests = 100;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--url' && args[i + 1]) {
      baseUrl = args[++i];
    } else if (args[i] === '--vus' && args[i + 1]) {
      concurrency = parseInt(args[++i], 10);
    } else if (args[i] === '--requests' && args[i + 1]) {
      totalRequests = parseInt(args[++i], 10);
    }
  }

  return { baseUrl: baseUrl.replace(/\/$/, ''), concurrency, totalRequests };
}

function percentile(sortedNumbers: number[], p: number): number {
  if (sortedNumbers.length === 0) return 0;
  const index = Math.ceil((p / 100) * sortedNumbers.length) - 1;
  return sortedNumbers[Math.max(0, Math.min(index, sortedNumbers.length - 1))];
}

async function runBenchmark(
  name: string,
  url: string,
  config: BenchmarkConfig
): Promise<BenchmarkSummary> {
  const results: RequestResult[] = [];
  let remainingRequests = config.totalRequests;

  const startTime = Date.now();

  const worker = async () => {
    while (remainingRequests > 0) {
      remainingRequests--;
      const reqStart = Date.now();
      try {
        const res = await fetch(url, {
          method: 'GET',
          headers: {
            'User-Agent': 'RecruitAI-LoadTester/1.0',
            Accept: 'text/html,application/json,*/*',
          },
        });
        const durationMs = Date.now() - reqStart;
        results.push({ status: res.status, durationMs });
      } catch (err: any) {
        const durationMs = Date.now() - reqStart;
        results.push({
          status: 0,
          durationMs,
          error: err?.message || 'Network error',
        });
      }
    }
  };

  const pool: Promise<void>[] = [];
  for (let i = 0; i < config.concurrency; i++) {
    pool.push(worker());
  }

  await Promise.all(pool);
  const totalTimeMs = Math.max(1, Date.now() - startTime);

  const durations = results.map((r) => r.durationMs).sort((a, b) => a - b);
  const successful = results.filter((r) => r.status >= 200 && r.status < 300).length;
  const clientErrors = results.filter((r) => r.status >= 400 && r.status < 500 && r.status !== 429).length;
  const rateLimited = results.filter((r) => r.status === 429).length;
  const serverErrors = results.filter((r) => r.status >= 500 || r.status === 0).length;

  return {
    name,
    totalRequests: results.length,
    successful,
    clientErrors,
    serverErrors,
    rateLimited,
    totalTimeMs,
    reqPerSec: Math.round((results.length / (totalTimeMs / 1000)) * 10) / 10,
    p50: percentile(durations, 50),
    p90: percentile(durations, 90),
    p95: percentile(durations, 95),
    p99: percentile(durations, 99),
    min: durations[0] || 0,
    max: durations[durations.length - 1] || 0,
  };
}

function printSummaryTable(summaries: BenchmarkSummary[]) {
  console.log('\n========================================================================================');
  console.log('                          STRESS TEST & PERFORMANCE REPORT');
  console.log('========================================================================================');
  console.log(
    'Target Endpoint'.padEnd(26) +
    'Reqs'.padStart(6) +
    '2xx'.padStart(6) +
    '429'.padStart(6) +
    '5xx/Err'.padStart(9) +
    'RPS'.padStart(9) +
    'p50(ms)'.padStart(9) +
    'p95(ms)'.padStart(9) +
    'p99(ms)'.padStart(9)
  );
  console.log('----------------------------------------------------------------------------------------');

  for (const s of summaries) {
    console.log(
      s.name.padEnd(26) +
      String(s.totalRequests).padStart(6) +
      String(s.successful).padStart(6) +
      String(s.rateLimited).padStart(6) +
      String(s.serverErrors).padStart(9) +
      String(s.reqPerSec).padStart(9) +
      String(s.p50).padStart(9) +
      String(s.p95).padStart(9) +
      String(s.p99).padStart(9)
    );
  }
  console.log('========================================================================================\n');
}

async function main() {
  const config = parseArgs();
  console.log('\nStarting RecruitAI Stress Test Suite');
  console.log(`Target:      ${config.baseUrl}`);
  console.log(`Concurrency: ${config.concurrency} virtual users`);
  console.log(`Requests:    ${config.totalRequests} requests per endpoint\n`);

  const endpoints = [
    { name: 'Health Check (/api/health)', path: '/api/health' },
    { name: 'Job Board (/jobs)', path: '/jobs' },
    { name: 'Sign-in Page (/auth/signin)', path: '/auth/signin' },
  ];

  const summaries: BenchmarkSummary[] = [];

  for (const ep of endpoints) {
    process.stdout.write(`Testing ${ep.name}... `);
    const summary = await runBenchmark(ep.name, `${config.baseUrl}${ep.path}`, config);
    summaries.push(summary);
    console.log(`done (${summary.reqPerSec} req/sec, p95: ${summary.p95}ms)`);
  }

  printSummaryTable(summaries);
}

main().catch((err) => {
  console.error('Stress test suite failed:', err);
  process.exit(1);
});
