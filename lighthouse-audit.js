#!/usr/bin/env node
const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');
const fs = require('fs');
const path = require('path');

async function runLighthouse(url, options = {}) {
  let chrome;
  try {
    chrome = await chromeLauncher.launch({
      chromeFlags: ['--headless', '--no-sandbox', '--disable-gpu']
    });

    const lighthouseOptions = {
      logLevel: 'info',
      port: chrome.port,
      ...options
    };

    const runnerResult = await lighthouse(url, lighthouseOptions);

    // Log summary
    const { lhr } = runnerResult;
    console.log(`\n📊 Lighthouse Report for: ${url}`);
    console.log(`Report generated at: ${new Date(lhr.fetchTime).toISOString()}`);
    console.log('\n📈 Core Web Vitals & Scores:');
    console.log(`  Performance Score: ${lhr.categories.performance.score * 100}/100`);
    console.log(`  Accessibility Score: ${lhr.categories.accessibility.score * 100}/100`);
    console.log(`  Best Practices Score: ${lhr.categories['best-practices'].score * 100}/100`);
    console.log(`  SEO Score: ${lhr.categories.seo.score * 100}/100`);

    // Metrics
    const metrics = lhr.audits['metrics']?.details?.items?.[0];
    if (metrics) {
      console.log('\n⏱️ Page Load Metrics:');
      console.log(`  First Contentful Paint (FCP): ${Math.round(metrics.firstContentfulPaint)}ms`);
      console.log(`  Largest Contentful Paint (LCP): ${Math.round(metrics.largestContentfulPaint)}ms`);
      console.log(`  Cumulative Layout Shift (CLS): ${metrics.cumulativeLayoutShift?.toFixed(3)}`);
      console.log(`  Time to Interactive (TTI): ${Math.round(metrics.timeToInteractive)}ms`);
      console.log(`  Speed Index: ${Math.round(metrics.speedIndex)}ms`);
      console.log(`  Total Blocking Time (TBT): ${Math.round(metrics.totalBlockingTime)}ms`);
    }

    // Diagnostics
    console.log('\n🔍 Diagnostics:');
    const networkRequests = lhr.audits['network-requests']?.details?.items;
    const totalTransfer = networkRequests?.reduce((sum, r) => sum + (r.transferSize || 0), 0);
    console.log(`  Total Requests: ${networkRequests?.length || 0}`);
    console.log(`  Total Transfer Size: ${(totalTransfer / 1024 / 1024).toFixed(2)}MB`);

    // Opportunities
    const opportunities = lhr.categories.performance.auditRefs
      .filter(ref => lhr.audits[ref.id].score < 1)
      .slice(0, 5);

    if (opportunities.length > 0) {
      console.log('\n⚠️ Top Performance Opportunities:');
      opportunities.forEach((opp, i) => {
        const audit = lhr.audits[opp.id];
        const savings = audit.details?.overallSavingsMs || audit.details?.overallSavingsBytes || 0;
        const savingsLabel = audit.details?.overallSavingsMs ? `${Math.round(savings)}ms` : `${(savings / 1024).toFixed(1)}KB`;
        console.log(`  ${i + 1}. ${audit.title} (potential savings: ${savingsLabel})`);
      });
    }

    // Save JSON report
    const reportPath = path.join(__dirname, `lighthouse-report-${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(lhr, null, 2));
    console.log(`\n💾 Full report saved to: ${reportPath}`);

    return lhr;
  } finally {
    if (chrome) {
      await chrome.kill();
    }
  }
}

// Run audits
(async () => {
  try {
    console.log('🚀 Starting Lighthouse audits...\n');
    
    // Home page
    await runLighthouse('http://localhost:3000', {
      onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo']
    });

    // Shop page
    await runLighthouse('http://localhost:3000/shop', {
      onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo']
    });

    console.log('\n✅ Lighthouse audits complete!');
  } catch (error) {
    console.error('❌ Error running Lighthouse:', error);
    process.exit(1);
  }
})();
