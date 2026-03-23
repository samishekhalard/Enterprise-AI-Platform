import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const require = createRequire(path.join(repoRoot, 'frontend', 'package.json'));
const { chromium } = require('playwright');

const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const outDir = path.join(repoRoot, 'artifacts', 'playwright-compare', timestamp);

const targets = {
  frontend: {
    baseUrl: process.env.FRONTEND_URL ?? 'http://127.0.0.1:4200',
    accessTokenKey: 'tp_access_token',
    accessTokenValue:
      'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiI2OGNkMmE1Ni05OGM5LTRlZDQtODUzNC1jMjk5NTY2ZDViMjciLCJyb2xlcyI6WyJTVVBFUl9BRE1JTiJdfQ.signature',
  },
  frontendold: {
    baseUrl: process.env.FRONTENDOLD_URL ?? 'http://127.0.0.1:4201',
  },
};

const screens = [
  {
    key: 'login',
    title: 'Login Screen',
    frontendPath: '/auth/login',
    frontendoldPath: '/login',
  },
  {
    key: 'admin-tenant-manager',
    title: 'Administration - Tenant Manager',
    frontendPath: '/administration?section=tenant-manager',
    frontendoldPath: '/administration?section=tenant-manager',
  },
  {
    key: 'admin-license-manager',
    title: 'Administration - License Manager',
    frontendPath: '/administration?section=license-manager',
    frontendoldPath: '/administration?section=license-manager',
  },
];

const viewports = [
  { key: 'desktop', width: 1440, height: 900 },
  { key: 'mobile', width: 390, height: 844 },
];

function normalizeText(text) {
  return (text ?? '').replace(/\s+/g, ' ').trim();
}

function uniq(list) {
  return [...new Set(list.filter(Boolean))];
}

function clip(items, max = 20) {
  return items.slice(0, max);
}

function diffSets(base, compare) {
  const baseSet = new Set(base);
  const compareSet = new Set(compare);
  return {
    onlyInBase: base.filter((item) => !compareSet.has(item)),
    onlyInCompare: compare.filter((item) => !baseSet.has(item)),
    shared: base.filter((item) => compareSet.has(item)),
  };
}

async function captureScreen(page, url, screenshotPath) {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(1200);

  const snapshot = await page.evaluate(() => {
    const text = (value) => (value ?? '').replace(/\s+/g, ' ').trim();

    const headings = [...document.querySelectorAll('h1, h2, h3, h4')]
      .map((el) => text(el.textContent))
      .filter(Boolean);

    const navLabels = [...document.querySelectorAll('nav a, nav button, aside a, aside button')]
      .map((el) => text(el.textContent))
      .filter(Boolean);

    const tabLabels = [...document.querySelectorAll('[role="tab"], .p-tab, .p-tabs [data-pc-name="tab"]')]
      .map((el) => text(el.textContent))
      .filter(Boolean);

    const ctaLabels = [...document.querySelectorAll('button, a[href]')]
      .map((el) => text(el.textContent))
      .filter(Boolean)
      .filter((label) => label.length >= 3 && label.length <= 42)
      .slice(0, 60);

    return {
      title: document.title,
      url: location.href,
      headings,
      navLabels,
      tabLabels,
      ctaLabels,
      cardCount: document.querySelectorAll('.p-card, .card').length,
      sectionCount: document.querySelectorAll('section').length,
    };
  });

  await page.screenshot({ path: screenshotPath, fullPage: true });
  return {
    title: normalizeText(snapshot.title),
    url: snapshot.url,
    headings: clip(uniq(snapshot.headings.map(normalizeText))),
    navLabels: clip(uniq(snapshot.navLabels.map(normalizeText))),
    tabLabels: clip(uniq(snapshot.tabLabels.map(normalizeText))),
    ctaLabels: clip(uniq(snapshot.ctaLabels.map(normalizeText))),
    cardCount: snapshot.cardCount,
    sectionCount: snapshot.sectionCount,
  };
}

function formatList(items, max = 6) {
  if (!items.length) return 'none';
  return items.slice(0, max).join(' | ');
}

async function run() {
  await fs.mkdir(outDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const results = [];

  try {
    for (const viewport of viewports) {
      const frontendCtx = await browser.newContext({ viewport });
      await frontendCtx.addInitScript(
        ({ key, value }) => {
          window.localStorage.setItem(key, value);
        },
        {
          key: targets.frontend.accessTokenKey,
          value: targets.frontend.accessTokenValue,
        },
      );

      const oldCtx = await browser.newContext({ viewport });

      for (const screen of screens) {
        const frontendPage = await frontendCtx.newPage();
        const oldPage = await oldCtx.newPage();

        const frontendUrl = `${targets.frontend.baseUrl}${screen.frontendPath}`;
        const oldUrl = `${targets.frontendold.baseUrl}${screen.frontendoldPath}`;

        const frontendShot = path.join(outDir, `${screen.key}-frontend-${viewport.key}.png`);
        const oldShot = path.join(outDir, `${screen.key}-frontendold-${viewport.key}.png`);

        const [frontendData, oldData] = await Promise.all([
          captureScreen(frontendPage, frontendUrl, frontendShot),
          captureScreen(oldPage, oldUrl, oldShot),
        ]);

        await frontendPage.close();
        await oldPage.close();

        results.push({
          viewport: viewport.key,
          screen: screen.key,
          screenTitle: screen.title,
          frontend: frontendData,
          frontendold: oldData,
          diffs: {
            headings: diffSets(frontendData.headings, oldData.headings),
            navLabels: diffSets(frontendData.navLabels, oldData.navLabels),
            tabLabels: diffSets(frontendData.tabLabels, oldData.tabLabels),
          },
        });
      }

      await frontendCtx.close();
      await oldCtx.close();
    }

    const jsonPath = path.join(outDir, 'comparison.json');
    await fs.writeFile(jsonPath, JSON.stringify(results, null, 2), 'utf8');

    const lines = [];
    lines.push('# Frontend vs Frontendold Screen Organization Comparison');
    lines.push('');
    lines.push(`Generated: ${new Date().toISOString()}`);
    lines.push('');

    for (const row of results) {
      lines.push(`## ${row.screenTitle} (${row.viewport})`);
      lines.push('');
      lines.push(`- Frontend URL: ${row.frontend.url}`);
      lines.push(`- Frontendold URL: ${row.frontendold.url}`);
      lines.push(`- Frontend cards/sections: ${row.frontend.cardCount}/${row.frontend.sectionCount}`);
      lines.push(`- Frontendold cards/sections: ${row.frontendold.cardCount}/${row.frontendold.sectionCount}`);
      lines.push(`- Frontend headings: ${formatList(row.frontend.headings)}`);
      lines.push(`- Frontendold headings: ${formatList(row.frontendold.headings)}`);
      lines.push(`- Frontend tabs: ${formatList(row.frontend.tabLabels)}`);
      lines.push(`- Frontendold tabs: ${formatList(row.frontendold.tabLabels)}`);
      lines.push(`- Frontend nav labels: ${formatList(row.frontend.navLabels)}`);
      lines.push(`- Frontendold nav labels: ${formatList(row.frontendold.navLabels)}`);
      lines.push(`- Heading-only-in-frontend: ${formatList(row.diffs.headings.onlyInBase)}`);
      lines.push(`- Heading-only-in-frontendold: ${formatList(row.diffs.headings.onlyInCompare)}`);
      lines.push(`- Tab-only-in-frontend: ${formatList(row.diffs.tabLabels.onlyInBase)}`);
      lines.push(`- Tab-only-in-frontendold: ${formatList(row.diffs.tabLabels.onlyInCompare)}`);
      lines.push('');
    }

    const mdPath = path.join(outDir, 'comparison-report.md');
    await fs.writeFile(mdPath, lines.join('\n'), 'utf8');

    console.log(JSON.stringify({ outDir, jsonPath, mdPath }, null, 2));
  } finally {
    await browser.close();
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
