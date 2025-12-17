#!/usr/bin/env tsx
/**
 * Comprehensive QA Crawler for Settler.dev
 * 
 * Crawls the site (local or live) and discovers:
 * - All routes and their HTTP status codes
 * - Broken internal links
 * - Console errors and warnings
 * - Network failures (4xx/5xx)
 * - Takes screenshots (desktop + mobile)
 * - Generates comprehensive reports
 */

import { chromium, type Browser, type Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface PageResult {
  url: string;
  status: number;
  title: string;
  links: string[];
  consoleErrors: string[];
  consoleWarnings: string[];
  networkErrors: NetworkError[];
  screenshotDesktop?: string;
  screenshotMobile?: string;
  loadTime: number;
  hasContent: boolean;
  errorMessage?: string;
}

interface NetworkError {
  url: string;
  status: number;
  method: string;
  resourceType: string;
}

interface CrawlReport {
  baseUrl: string;
  crawlDate: string;
  totalPages: number;
  pages: PageResult[];
  summary: {
    pagesWith500: number;
    pagesWith400: number;
    brokenLinks: number;
    totalConsoleErrors: number;
    totalNetworkErrors: number;
    pagesWithNoContent: number;
  };
  linkGraph: Record<string, string[]>;
  brokenLinks: Array<{ from: string; to: string; reason: string }>;
}

class QACrawler {
  private browser: Browser | null = null;
  private baseUrl: string;
  private visitedUrls = new Set<string>();
  private pagesToVisit = new Set<string>();
  private results: PageResult[] = [];
  private linkGraph: Record<string, string[]> = {};
  private brokenLinks: Array<{ from: string; to: string; reason: string }> = [];
  private outputDir: string;

  constructor(baseUrl: string, outputDir: string = 'qa-artifacts') {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.outputDir = path.resolve(__dirname, '..', outputDir);
    
    // Ensure output directory exists
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
    if (!fs.existsSync(path.join(this.outputDir, 'screenshots'))) {
      fs.mkdirSync(path.join(this.outputDir, 'screenshots'), { recursive: true });
    }
  }

  async crawl(): Promise<CrawlReport> {
    console.log(`🚀 Starting QA crawl of ${this.baseUrl}`);
    
    this.browser = await chromium.launch({ headless: true });
    
    // Start with homepage
    this.pagesToVisit.add('/');
    
    // Crawl all discovered pages
    while (this.pagesToVisit.size > 0) {
      const url = Array.from(this.pagesToVisit)[0];
      this.pagesToVisit.delete(url);
      
      if (this.visitedUrls.has(url)) {
        continue;
      }
      
      await this.crawlPage(url);
    }
    
    await this.browser.close();
    
    // Generate report
    const report = this.generateReport();
    await this.saveReport(report);
    
    return report;
  }

  private async crawlPage(relativeUrl: string): Promise<void> {
    const fullUrl = `${this.baseUrl}${relativeUrl}`;
    
    if (this.visitedUrls.has(relativeUrl)) {
      return;
    }
    
    this.visitedUrls.add(relativeUrl);
    console.log(`📄 Crawling: ${fullUrl}`);
    
    const page = await this.browser!.newPage();
    const result: PageResult = {
      url: fullUrl,
      status: 0,
      title: '',
      links: [],
      consoleErrors: [],
      consoleWarnings: [],
      networkErrors: [],
      loadTime: 0,
      hasContent: false,
    };
    
    const startTime = Date.now();
    
    // Collect console messages
    page.on('console', (msg) => {
      const text = msg.text();
      if (msg.type() === 'error') {
        // Filter out common non-critical errors
        if (!this.isIgnorableError(text)) {
          result.consoleErrors.push(text);
        }
      } else if (msg.type() === 'warning') {
        result.consoleWarnings.push(text);
      }
    });
    
    // Collect network errors
    page.on('response', (response) => {
      const status = response.status();
      if (status >= 400) {
        result.networkErrors.push({
          url: response.url(),
          status,
          method: response.request().method(),
          resourceType: response.request().resourceType(),
        });
      }
    });
    
    try {
      // Try to load page with shorter timeout, fallback to domcontentloaded
      let response;
      try {
        response = await page.goto(fullUrl, {
          waitUntil: 'networkidle',
          timeout: 20000,
        });
      } catch (timeoutError) {
        // If networkidle times out, try domcontentloaded
        try {
          response = await page.goto(fullUrl, {
            waitUntil: 'domcontentloaded',
            timeout: 15000,
          });
          // Wait a bit for content to render
          await page.waitForTimeout(2000);
        } catch (domError) {
          // Page might still be partially loaded, continue anyway
          console.warn(`Page load timeout for ${fullUrl}, continuing with partial content`);
        }
      }
      
      result.status = response?.status() || 0;
      result.loadTime = Date.now() - startTime;
      
      // Check if page has content (even if load failed)
      const bodyText = await page.textContent('body').catch(() => '');
      result.hasContent = (bodyText?.trim().length || 0) > 100;
      
      // Get page title
      result.title = await page.title().catch(() => '');
      
      // Extract links even if page had errors (might still have valid links)
      try {
        const links = await this.extractLinks(page, relativeUrl);
        result.links = links;
        this.linkGraph[relativeUrl] = links;
        
        // Add new links to queue
        for (const link of links) {
          if (!this.visitedUrls.has(link) && this.isInternalLink(link)) {
            this.pagesToVisit.add(link);
          }
        }
      } catch (linkError) {
        console.warn(`Failed to extract links from ${fullUrl}:`, linkError);
      }
      
      // Only process successful pages for screenshots
      if (result.status >= 200 && result.status < 400 && result.hasContent) {
        // Take screenshots
        try {
          const safeFilename = relativeUrl.replace(/[^a-z0-9]/gi, '_').replace(/_+/g, '_') || 'index';
          result.screenshotDesktop = await this.takeScreenshot(
            page,
            safeFilename,
            'desktop',
            { width: 1280, height: 720 }
          );
          result.screenshotMobile = await this.takeScreenshot(
            page,
            safeFilename,
            'mobile',
            { width: 375, height: 667 }
          );
        } catch (error) {
          console.warn(`Failed to take screenshots for ${fullUrl}:`, error);
        }
      } else if (result.status !== 0) {
        result.errorMessage = `HTTP ${result.status}`;
      }
    } catch (error: any) {
      result.status = 0;
      result.errorMessage = error.message || 'Unknown error';
      result.consoleErrors.push(`Page load failed: ${error.message}`);
      
      // Try to extract links even on error
      try {
        const links = await this.extractLinks(page, relativeUrl).catch(() => []);
        result.links = links;
        this.linkGraph[relativeUrl] = links;
      } catch (linkError) {
        // Ignore link extraction errors on failed pages
      }
    }
    
    await page.close();
    this.results.push(result);
  }

  private async extractLinks(page: Page, currentPath: string): Promise<string[]> {
    // Wait a bit for client-side hydration to complete
    await page.waitForTimeout(1000);
    
    // Try multiple methods to extract links
    let links: string[] = [];
    
    try {
      // Method 1: Extract from all anchor tags (including Next.js Link components)
      links = await page.evaluate(() => {
        const anchors = Array.from(document.querySelectorAll('a'));
        const hrefs: string[] = [];
        
        anchors.forEach(a => {
          // Try href attribute first
          const href = a.getAttribute('href');
          if (href) {
            hrefs.push(href);
          }
          
          // Next.js Link components might have href in data attributes
          const dataHref = a.getAttribute('data-href');
          if (dataHref) {
            hrefs.push(dataHref);
          }
          
          // Check if it's a Next.js Link wrapper - the actual link might be a child
          const childLink = a.querySelector('a[href]');
          if (childLink) {
            const childHref = childLink.getAttribute('href');
            if (childHref) {
              hrefs.push(childHref);
            }
          }
        });
        
        return hrefs.filter(Boolean);
      });
    } catch (e) {
      console.warn(`Failed to extract links via evaluate:`, e);
    }
    
    // Also extract from button elements that might navigate
    try {
      const buttonLinks = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button[data-href], [role="button"][data-href]'));
        return buttons.map(btn => btn.getAttribute('data-href') || '').filter(Boolean);
      });
      links = [...links, ...buttonLinks];
    } catch (e) {
      // Ignore errors
    }
    
    const internalLinks: string[] = [];
    const baseUrlObj = new URL(this.baseUrl);
    
    for (const link of links) {
      try {
        // Handle relative URLs
        let url: URL;
        if (link.startsWith('http://') || link.startsWith('https://')) {
          url = new URL(link);
        } else if (link.startsWith('/')) {
          url = new URL(link, this.baseUrl);
        } else if (link.startsWith('#')) {
          // Skip anchor links
          continue;
        } else {
          // Relative path - resolve against current path
          const currentUrl = new URL(currentPath, this.baseUrl);
          url = new URL(link, currentUrl);
        }
        
        // Same origin
        if (url.origin === baseUrlObj.origin) {
          const pathname = url.pathname;
          // Normalize pathname
          const normalized = pathname === '/' ? '/' : pathname.replace(/\/$/, '');
          
          // Skip anchors, mailto, tel, javascript:, data:, etc.
          if (
            !normalized.startsWith('#') &&
            !normalized.startsWith('mailto:') &&
            !normalized.startsWith('tel:') &&
            !normalized.startsWith('javascript:') &&
            !normalized.startsWith('data:')
          ) {
            // Extract just the pathname part (before query string and hash)
            const pathOnly = normalized.split('?')[0].split('#')[0];
            if (pathOnly) {
              internalLinks.push(pathOnly);
            }
          }
        }
      } catch (e) {
        // Invalid URL, skip
      }
    }
    
    // Deduplicate and filter out invalid paths
    const validLinks = Array.from(new Set(internalLinks)).filter(link => {
      // Skip API routes, static assets, etc.
      return link &&
             !link.startsWith('/api/') &&
             !link.startsWith('/_next/') &&
             !link.startsWith('/static/') &&
             !link.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|json)$/i) &&
             link.length > 0;
    });
    
    return validLinks;
  }

  private isInternalLink(link: string): boolean {
    // Skip external links, anchors, API routes, static assets
    if (
      link.startsWith('http') ||
      link.startsWith('#') ||
      link.startsWith('/api/') ||
      link.startsWith('/_next/') ||
      link.startsWith('/static/') ||
      link.includes('.') && !link.match(/\/[^/]+\.[^/]+$/) // Skip file extensions except at end of path
    ) {
      return false;
    }
    
    return true;
  }

  private isIgnorableError(text: string): boolean {
    const ignorablePatterns = [
      /favicon/i,
      /analytics/i,
      /cookie/i,
      /gtag/i,
      /google.*analytics/i,
      /vercel.*analytics/i,
      /sentry/i,
      /chunk.*failed/i,
      /loading.*chunk/i,
    ];
    
    return ignorablePatterns.some(pattern => pattern.test(text));
  }

  private async takeScreenshot(
    page: Page,
    filename: string,
    viewport: string,
    size: { width: number; height: number }
  ): Promise<string> {
    await page.setViewportSize(size);
    await page.waitForTimeout(500); // Wait for layout to settle
    
    const safeFilename = `${filename}_${viewport}.png`;
    const screenshotPath = path.join(this.outputDir, 'screenshots', safeFilename);
    
    await page.screenshot({
      path: screenshotPath,
      fullPage: false, // Viewport only for consistency
    });
    
    return safeFilename;
  }

  private generateReport(): CrawlReport {
    const pagesWith500 = this.results.filter(r => r.status >= 500).length;
    const pagesWith400 = this.results.filter(r => r.status >= 400 && r.status < 500).length;
    const totalConsoleErrors = this.results.reduce((sum, r) => sum + r.consoleErrors.length, 0);
    const totalNetworkErrors = this.results.reduce((sum, r) => sum + r.networkErrors.length, 0);
    const pagesWithNoContent = this.results.filter(r => !r.hasContent && r.status < 400).length;
    
    // Find broken links
    const allInternalLinks = new Set<string>();
    this.results.forEach(r => {
      r.links.forEach(link => allInternalLinks.add(link));
    });
    
    const existingPaths = new Set(this.results.map(r => {
      try {
        const url = new URL(r.url);
        return url.pathname === '/' ? '/' : url.pathname.replace(/\/$/, '');
      } catch {
        return '';
      }
    }));
    
    this.results.forEach(r => {
      r.links.forEach(link => {
        if (!existingPaths.has(link) && this.isInternalLink(link)) {
          this.brokenLinks.push({
            from: r.url,
            to: link,
            reason: 'Route not found',
          });
        }
      });
    });
    
    return {
      baseUrl: this.baseUrl,
      crawlDate: new Date().toISOString(),
      totalPages: this.results.length,
      pages: this.results,
      summary: {
        pagesWith500,
        pagesWith400,
        brokenLinks: this.brokenLinks.length,
        totalConsoleErrors,
        totalNetworkErrors,
        pagesWithNoContent,
      },
      linkGraph: this.linkGraph,
      brokenLinks: this.brokenLinks,
    };
  }

  private async saveReport(report: CrawlReport): Promise<void> {
    // Save JSON report
    const jsonPath = path.join(this.outputDir, 'report.json');
    fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));
    console.log(`✅ Report saved to ${jsonPath}`);
    
    // Generate human-readable summary
    const summaryPath = path.join(this.outputDir, 'summary.md');
    const summary = this.generateSummary(report);
    fs.writeFileSync(summaryPath, summary);
    console.log(`✅ Summary saved to ${summaryPath}`);
  }

  private generateSummary(report: CrawlReport): string {
    const { summary, pages } = report;
    
    let md = `# QA Crawl Report\n\n`;
    md += `**Base URL:** ${report.baseUrl}\n`;
    md += `**Crawl Date:** ${report.crawlDate}\n`;
    md += `**Total Pages Crawled:** ${report.totalPages}\n\n`;
    
    md += `## Summary\n\n`;
    md += `- ❌ Pages with 500 errors: **${summary.pagesWith500}**\n`;
    md += `- ⚠️  Pages with 400 errors: **${summary.pagesWith400}**\n`;
    md += `- 🔗 Broken internal links: **${summary.brokenLinks}**\n`;
    md += `- 🐛 Total console errors: **${summary.totalConsoleErrors}**\n`;
    md += `- 🌐 Total network errors: **${summary.totalNetworkErrors}**\n`;
    md += `- 📄 Pages with no content: **${summary.pagesWithNoContent}**\n\n`;
    
    // List pages with 500 errors
    if (summary.pagesWith500 > 0) {
      md += `## 🚨 Pages with 500 Errors\n\n`;
      pages
        .filter(p => p.status >= 500)
        .forEach(p => {
          md += `- **${p.url}** (${p.status})\n`;
          if (p.errorMessage) {
            md += `  - Error: ${p.errorMessage}\n`;
          }
          if (p.consoleErrors.length > 0) {
            md += `  - Console errors: ${p.consoleErrors.length}\n`;
          }
        });
      md += `\n`;
    }
    
    // List pages with 400 errors
    if (summary.pagesWith400 > 0) {
      md += `## ⚠️ Pages with 400 Errors\n\n`;
      pages
        .filter(p => p.status >= 400 && p.status < 500)
        .forEach(p => {
          md += `- **${p.url}** (${p.status})\n`;
        });
      md += `\n`;
    }
    
    // List broken links
    if (summary.brokenLinks > 0) {
      md += `## 🔗 Broken Links\n\n`;
      report.brokenLinks.forEach(link => {
        md += `- From: **${link.from}** → To: **${link.to}** (${link.reason})\n`;
      });
      md += `\n`;
    }
    
    // List pages with console errors
    const pagesWithErrors = pages.filter(p => p.consoleErrors.length > 0);
    if (pagesWithErrors.length > 0) {
      md += `## 🐛 Pages with Console Errors\n\n`;
      pagesWithErrors.forEach(p => {
        md += `### ${p.url}\n\n`;
        p.consoleErrors.forEach(err => {
          md += `- ${err}\n`;
        });
        md += `\n`;
      });
    }
    
    // List pages with no content
    const emptyPages = pages.filter(p => !p.hasContent && p.status < 400);
    if (emptyPages.length > 0) {
      md += `## 📄 Pages with No Content\n\n`;
      emptyPages.forEach(p => {
        md += `- **${p.url}** (Status: ${p.status})\n`;
      });
      md += `\n`;
    }
    
    // All pages status
    md += `## 📊 All Pages Status\n\n`;
    md += `| URL | Status | Title | Errors | Warnings | Load Time (ms) |\n`;
    md += `|-----|--------|-------|--------|----------|----------------|\n`;
    pages.forEach(p => {
      const statusEmoji = p.status >= 500 ? '❌' : p.status >= 400 ? '⚠️' : '✅';
      md += `| ${p.url} | ${statusEmoji} ${p.status} | ${p.title.substring(0, 50)} | ${p.consoleErrors.length} | ${p.consoleWarnings.length} | ${p.loadTime} |\n`;
    });
    
    return md;
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const baseUrl = args[0] || 'http://localhost:3000';
  const outputDir = args[1] || 'qa-artifacts';
  
  console.log(`Starting QA crawler...`);
  console.log(`Base URL: ${baseUrl}`);
  console.log(`Output directory: ${outputDir}`);
  
  const crawler = new QACrawler(baseUrl, outputDir);
  const report = await crawler.crawl();
  
  console.log(`\n✅ Crawl complete!`);
  console.log(`\nSummary:`);
  console.log(`- Total pages: ${report.totalPages}`);
  console.log(`- Pages with 500 errors: ${report.summary.pagesWith500}`);
  console.log(`- Pages with 400 errors: ${report.summary.pagesWith400}`);
  console.log(`- Broken links: ${report.summary.brokenLinks}`);
  console.log(`- Console errors: ${report.summary.totalConsoleErrors}`);
  
  process.exit(report.summary.pagesWith500 > 0 ? 1 : 0);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { QACrawler, type CrawlReport, type PageResult };
