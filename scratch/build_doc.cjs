const fs = require('fs');
const path = require('path');

const docContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>UTAC QA Calendar — System Architecture & Feature Reference Guide</title>
  <style>
    :root {
      --primary: #0f9d8c;
      --primary-dark: #0b7a6d;
      --primary-light: #e6f7f5;
      --accent: #2f6df0;
      --accent-dark: #1e4eb8;
      --accent-light: #edf2fe;
      --warning: #d97706;
      --warning-light: #fef3c7;
      --danger: #dc2626;
      --danger-light: #fee2e2;
      --success: #16a34a;
      --success-light: #dcfce7;
      --text-main: #1e293b;
      --text-muted: #64748b;
      --text-light: #94a3b8;
      --bg-body: #f8fafc;
      --bg-card: #ffffff;
      --border: #e2e8f0;
      --border-dark: #cbd5e1;
      --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
      --shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);
      --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1);
      --radius-sm: 6px;
      --radius-md: 10px;
      --radius-lg: 16px;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: var(--text-main);
      background-color: var(--bg-body);
      line-height: 1.6;
      font-size: 15px;
      overflow-x: hidden;
    }

    /* Layout Structure */
    .app-header {
      position: sticky;
      top: 0;
      z-index: 50;
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(12px);
      border-bottom: 1px solid var(--border);
      padding: 12px 28px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .brand-section {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .brand-logo {
      height: 38px;
      width: auto;
      border-radius: var(--radius-sm);
      object-fit: contain;
    }

    .brand-title {
      font-size: 18px;
      font-weight: 700;
      color: #0f172a;
      letter-spacing: -0.01em;
    }

    .brand-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 11px;
      font-weight: 600;
      padding: 2px 10px;
      background: var(--primary-light);
      color: var(--primary-dark);
      border-radius: 9999px;
      border: 1px solid rgba(15, 157, 140, 0.2);
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .btn-header {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 14px;
      font-size: 13px;
      font-weight: 500;
      border-radius: var(--radius-sm);
      text-decoration: none;
      transition: all 0.2s;
    }

    .btn-outline {
      background: #fff;
      color: var(--text-main);
      border: 1px solid var(--border);
    }
    .btn-outline:hover {
      background: #f1f5f9;
      border-color: var(--border-dark);
    }

    .btn-primary {
      background: var(--primary);
      color: #fff;
      border: 1px solid transparent;
    }
    .btn-primary:hover {
      background: var(--primary-dark);
    }

    /* Container Grid */
    .docs-container {
      display: grid;
      grid-template-columns: 290px minmax(0, 1fr);
      min-height: calc(100vh - 63px);
    }

    /* Sidebar Navigation */
    .docs-sidebar {
      position: sticky;
      top: 63px;
      height: calc(100vh - 63px);
      overflow-y: auto;
      padding: 24px 18px;
      background: #ffffff;
      border-right: 1px solid var(--border);
    }

    .search-box {
      margin-bottom: 20px;
      position: relative;
    }

    .search-input {
      width: 100%;
      padding: 8px 12px 8px 32px;
      font-size: 13px;
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      outline: none;
      background: #f8fafc;
      transition: all 0.2s;
    }
    .search-input:focus {
      background: #fff;
      border-color: var(--primary);
      box-shadow: 0 0 0 3px rgba(15, 157, 140, 0.15);
    }

    .search-icon {
      position: absolute;
      left: 10px;
      top: 50%;
      transform: translateY(-50%);
      color: var(--text-muted);
      font-size: 14px;
    }

    .nav-group-title {
      font-size: 11px;
      text-transform: uppercase;
      font-weight: 700;
      color: var(--text-muted);
      letter-spacing: 0.08em;
      margin: 18px 0 8px 8px;
    }

    .nav-links {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .nav-link {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 7px 12px;
      font-size: 13.5px;
      color: #334155;
      text-decoration: none;
      border-radius: var(--radius-sm);
      transition: all 0.15s;
    }

    .nav-link:hover {
      background: #f1f5f9;
      color: var(--primary-dark);
    }

    .nav-link.active {
      background: var(--primary-light);
      color: var(--primary-dark);
      font-weight: 600;
    }

    .nav-link .badge {
      margin-left: auto;
      font-size: 10px;
      padding: 1px 6px;
      border-radius: 9999px;
      background: #e2e8f0;
      color: #475569;
    }

    /* Main Content */
    .docs-content {
      padding: 40px 60px 100px 60px;
      max-width: 1200px;
      margin: 0 auto;
      width: 100%;
    }

    .hero-banner {
      background: linear-gradient(135deg, #09473f 0%, #0f9d8c 50%, #2f6df0 100%);
      color: #fff;
      padding: 44px;
      border-radius: var(--radius-lg);
      margin-bottom: 40px;
      box-shadow: var(--shadow-lg);
      position: relative;
      overflow: hidden;
    }

    .hero-banner::after {
      content: "";
      position: absolute;
      top: -30px;
      right: -30px;
      width: 260px;
      height: 260px;
      background: radial-gradient(circle, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 70%);
      border-radius: 50%;
      pointer-events: none;
    }

    .hero-title {
      font-size: 34px;
      font-weight: 800;
      line-height: 1.2;
      margin-bottom: 12px;
      letter-spacing: -0.02em;
    }

    .hero-subtitle {
      font-size: 17px;
      opacity: 0.92;
      max-width: 850px;
      margin-bottom: 24px;
      font-weight: 400;
    }

    .hero-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
    }

    .hero-tag {
      background: rgba(255, 255, 255, 0.18);
      backdrop-filter: blur(4px);
      padding: 4px 12px;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 500;
      border: 1px solid rgba(255, 255, 255, 0.25);
    }

    /* Content Typography */
    h2 {
      font-size: 24px;
      font-weight: 700;
      color: #0f172a;
      margin: 50px 0 20px 0;
      padding-bottom: 12px;
      border-bottom: 2px solid var(--border);
      letter-spacing: -0.01em;
      display: flex;
      align-items: center;
      gap: 12px;
    }

    h3 {
      font-size: 18px;
      font-weight: 600;
      color: #1e293b;
      margin: 32px 0 14px 0;
      letter-spacing: -0.01em;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    p {
      margin-bottom: 16px;
      color: #334155;
    }

    ul, ol {
      margin-bottom: 20px;
      padding-left: 24px;
      color: #334155;
    }

    li {
      margin-bottom: 8px;
    }

    strong {
      color: #0f172a;
    }

    code {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 13px;
      background: #f1f5f9;
      color: #0f766e;
      padding: 2px 6px;
      border-radius: 4px;
      border: 1px solid #e2e8f0;
    }

    pre {
      background: #0f172a;
      color: #e2e8f0;
      padding: 18px;
      border-radius: var(--radius-md);
      overflow-x: auto;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 13px;
      line-height: 1.5;
      margin-bottom: 24px;
      border: 1px solid #1e293b;
      box-shadow: var(--shadow);
    }

    /* Card Components */
    .feature-card {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      padding: 26px;
      margin-bottom: 28px;
      box-shadow: var(--shadow-sm);
      transition: all 0.2s ease;
    }
    .feature-card:hover {
      box-shadow: var(--shadow);
      border-color: #cbd5e1;
    }

    .card-header-flex {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;
    }

    .card-title {
      font-size: 19px;
      font-weight: 700;
      color: #0f172a;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    /* Screenshot Showcases */
    .screenshot-container {
      background: #f8fafc;
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      padding: 16px;
      margin: 20px 0;
      box-shadow: var(--shadow);
      text-align: center;
    }

    .screenshot-img {
      max-width: 100%;
      height: auto;
      border-radius: var(--radius-sm);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
      cursor: zoom-in;
      transition: transform 0.2s ease;
      border: 1px solid #e2e8f0;
    }
    .screenshot-img:hover {
      transform: scale(1.008);
    }

    .screenshot-caption {
      font-size: 13px;
      color: var(--text-muted);
      margin-top: 10px;
      font-style: italic;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
    }

    /* Diagram Styling */
    .diagram-wrapper {
      background: #ffffff;
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      padding: 28px;
      margin: 28px 0;
      box-shadow: var(--shadow);
      overflow-x: auto;
    }

    .diagram-title {
      font-size: 15px;
      font-weight: 700;
      color: #1e293b;
      margin-bottom: 18px;
      text-align: center;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    /* Key-Value Tables */
    .spec-table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0 28px 0;
      font-size: 14px;
      background: #fff;
      border-radius: var(--radius-sm);
      overflow: hidden;
      box-shadow: var(--shadow-sm);
      border: 1px solid var(--border);
    }

    .spec-table th {
      background: #f8fafc;
      text-align: left;
      padding: 12px 16px;
      font-weight: 600;
      color: #334155;
      border-bottom: 2px solid var(--border);
      font-size: 13px;
    }

    .spec-table td {
      padding: 12px 16px;
      border-bottom: 1px solid var(--border);
      color: #334155;
      vertical-align: top;
    }

    .spec-table tr:last-child td {
      border-bottom: none;
    }

    .spec-table tr:hover td {
      background: #f8fafc;
    }

    /* Alerts and Callouts */
    .callout {
      border-left: 4px solid var(--primary);
      background: var(--primary-light);
      padding: 16px 20px;
      border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
      margin: 20px 0;
      font-size: 14.5px;
    }

    .callout.danger {
      border-left-color: var(--danger);
      background: var(--danger-light);
      color: #991b1b;
    }

    .callout.warning {
      border-left-color: var(--warning);
      background: var(--warning-light);
      color: #92400e;
    }

    .callout.info {
      border-left-color: var(--accent);
      background: var(--accent-light);
      color: #1e40af;
    }

    /* Grid Displays */
    .grid-2 {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(420px, 1fr));
      gap: 20px;
      margin: 24px 0;
    }

    .grid-3 {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 16px;
      margin: 24px 0;
    }

    .stat-box {
      background: #fff;
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      padding: 20px;
      box-shadow: var(--shadow-sm);
      display: flex;
      flex-direction: column;
    }

    .stat-label {
      font-size: 12px;
      font-weight: 600;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .stat-value {
      font-size: 26px;
      font-weight: 800;
      color: #0f172a;
      margin: 6px 0 4px 0;
    }

    .stat-desc {
      font-size: 12.5px;
      color: var(--text-muted);
    }

    /* Pills and Badges */
    .pill {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 3px 9px;
      border-radius: 9999px;
      font-size: 11.5px;
      font-weight: 600;
    }
    .pill-red {
      background: #fee2e2;
      color: #b91c1c;
      border: 1px solid #fca5a5;
    }
    .pill-yellow {
      background: #fef3c7;
      color: #b45309;
      border: 1px solid #fde68a;
    }
    .pill-green {
      background: #dcfce7;
      color: #15803d;
      border: 1px solid #86efac;
    }
    .pill-blue {
      background: #dbeafe;
      color: #1d4ed8;
      border: 1px solid #93c5fd;
    }
    .pill-teal {
      background: #ccfbf1;
      color: #0f766e;
      border: 1px solid #5eead4;
    }

    /* Modal / Lightbox */
    .lightbox-modal {
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(15, 23, 42, 0.85);
      backdrop-filter: blur(8px);
      z-index: 9999;
      align-items: center;
      justify-content: center;
      padding: 30px;
    }
    .lightbox-modal.active {
      display: flex;
    }
    .lightbox-content {
      max-width: 95vw;
      max-height: 90vh;
      object-fit: contain;
      border-radius: var(--radius-md);
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    }
    .lightbox-close {
      position: absolute;
      top: 24px;
      right: 32px;
      font-size: 32px;
      color: #fff;
      cursor: pointer;
      user-select: none;
    }

    @media (max-width: 1024px) {
      .docs-container {
        grid-template-columns: 1fr;
      }
      .docs-sidebar {
        display: none;
      }
      .docs-content {
        padding: 24px 20px;
      }
    }
  </style>
</head>
<body>

  <!-- Sticky Top Header -->
  <header class="app-header">
    <div class="brand-section">
      <img src="images/utac-logo.jpg" alt="UTAC Logo" class="brand-logo" onerror="if(!this.dataset.retried){this.dataset.retried=true;this.src='docs/images/utac-logo.jpg';}">
      <div>
        <div class="brand-title">UTAC QA Calendar & Audit Management</div>
      </div>
      <span class="brand-badge">v2.4 Production • Cloudflare Edge</span>
    </div>
    <div class="header-actions">
      <a href="#system-architecture" class="btn-header btn-outline">Architecture</a>
      <a href="#feature-schedule" class="btn-header btn-outline">Features</a>
      <a href="#api-spec" class="btn-header btn-outline">REST API</a>
      <a href="javascript:window.print()" class="btn-header btn-primary">Print / Export PDF</a>
    </div>
  </header>

  <!-- Docs Grid Container -->
  <div class="docs-container">

    <!-- Sidebar Navigation -->
    <aside class="docs-sidebar">
      <div class="search-box">
        <span class="search-icon">🔍</span>
        <input type="text" id="docSearch" class="search-input" placeholder="Search features & guides...">
      </div>

      <div class="nav-group-title">Overview</div>
      <ul class="nav-links">
        <li><a href="#executive-summary" class="nav-link">Executive Summary <span class="badge">Goal</span></a></li>
        <li><a href="#technology-stack" class="nav-link">Technology Stack</a></li>
      </ul>

      <div class="nav-group-title">Architecture</div>
      <ul class="nav-links">
        <li><a href="#system-architecture" class="nav-link">System Topology Diagram</a></li>
        <li><a href="#data-lifecycle" class="nav-link">Data Flow & Persistence</a></li>
        <li><a href="#database-schema" class="nav-link">D1 SQLite Relational Schema</a></li>
        <li><a href="#master-order-architecture" class="nav-link">Universal Master-Order Engine</a></li>
      </ul>

      <div class="nav-group-title">Core Features</div>
      <ul class="nav-links">
        <li><a href="#feature-schedule" class="nav-link">1. Timeline Calendar & Views</a></li>
        <li><a href="#feature-validation" class="nav-link">2. Appointment Modal & Rules</a></li>
        <li><a href="#feature-results" class="nav-link">3. Audit Findings Recording</a></li>
        <li><a href="#feature-table" class="nav-link">4. Dynamic Table View</a></li>
        <li><a href="#feature-summary" class="nav-link">5. KPI Executive Dashboard</a></li>
        <li><a href="#feature-engineers" class="nav-link">6. Manage Engineers & Options</a></li>
        <li><a href="#feature-activity" class="nav-link">7. Audit Trail & History Log</a></li>
        <li><a href="#feature-sheets" class="nav-link">8. Google Sheets Cloud Sync</a></li>
      </ul>

      <div class="nav-group-title">Specifications</div>
      <ul class="nav-links">
        <li><a href="#api-spec" class="nav-link">REST API Endpoints</a></li>
        <li><a href="#site-normalization" class="nav-link">Multi-Site Normalization</a></li>
      </ul>
    </aside>

    <!-- Main Content Area -->
    <main class="docs-content">

      <!-- Hero Banner -->
      <section class="hero-banner">
        <div class="hero-title">UTAC QA Calendar Architecture & System Guide</div>
        <div class="hero-subtitle">
          An enterprise-grade, real-time quality assurance scheduling, multi-facility audit execution, findings tracking, and compliance management platform built for UTAC semiconductor assembly and test sites worldwide.
        </div>
        <div class="hero-tags">
          <span class="hero-tag">React 19 SPA</span>
          <span class="hero-tag">Cloudflare Workers Serverless</span>
          <span class="hero-tag">Cloudflare D1 Distributed SQLite</span>
          <span class="hero-tag">Dual-Layer Local & Remote Persistence</span>
          <span class="hero-tag">Dynamic Master-Order Engine</span>
          <span class="hero-tag">Google Sheets Two-Way Webhook Sync</span>
        </div>
      </section>

      <!-- Executive Summary -->
      <section id="executive-summary">
        <h2>1. Executive Summary & Purpose</h2>
        <div class="feature-card">
          <p>
            The <strong>UTAC QA Calendar</strong> replaces legacy fragmented spreadsheets with a mission-critical, centralized platform for planning, executing, and analyzing quality assurance audits across UTAC's manufacturing sites:
            <code>UTL1</code>, <code>UTL2</code>, <code>UTL2A</code>, <code>UTL2B</code>, <code>UTL3</code>, <code>UTL3A</code>, and <code>UTL3T</code>.
          </p>
          <p>
            The application harmonizes both <strong>Customer Audits</strong> (external client audits, customer-specific requirements, target packages, and customer-facing QMS hosts) and <strong>Internal Audits</strong> (ISO 9001, IATF 16949, ISO 14001, ISO 45001, ESD, EHS, VDA 6.3, internal systems) with strict quality enforcement, multi-site finding rollups, and automatic cloud replication.
          </p>

          <div class="grid-3">
            <div class="stat-box">
              <div class="stat-label">Multi-Facility Scope</div>
              <div class="stat-value">7 Sites</div>
              <div class="stat-desc">Unified scheduling across UTL1, UTL2, UTL2A, UTL2B, UTL3, UTL3A, UTL3T</div>
            </div>
            <div class="stat-box">
              <div class="stat-label">Edge Response Latency</div>
              <div class="stat-value">&lt; 40 ms</div>
              <div class="stat-desc">Powered by Cloudflare global serverless edge network and D1 database</div>
            </div>
            <div class="stat-box">
              <div class="stat-label">Compliance Validation</div>
              <div class="stat-value">100% Strict</div>
              <div class="stat-desc">Zero-tolerance for missing required audit fields with real-time visual alerts</div>
            </div>
          </div>
        </div>
      </section>

      <!-- Tech Stack -->
      <section id="technology-stack">
        <h2>2. Technology Stack & Design Architecture</h2>
        <div class="feature-card">
          <table class="spec-table">
            <thead>
              <tr>
                <th>Tier / Layer</th>
                <th>Technology</th>
                <th>Architectural Purpose & Implementation</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Frontend Core</strong></td>
                <td>React 19, TypeScript, Vite</td>
                <td>Concurrent rendering, type safety, modular micro-components, sub-second HMR development.</td>
              </tr>
              <tr>
                <td><strong>State Architecture</strong></td>
                <td>Custom ViewModel Hook (<code>useScheduler.ts</code>)</td>
                <td>Centralized Single Source of Truth managing scheduling matrices, optimistic mutations, active filters, statistics derivations, and cross-tab reactive events.</td>
              </tr>
              <tr>
                <td><strong>Local Cache Layer</strong></td>
                <td>Dual-Layer LocalStorage Snapshot</td>
                <td>Immediate UI hydration from <code>localStorage['calendar_qa_snapshot']</code> on first paint, providing instant offline resilience and zero layout shift while edge network sync completes.</td>
              </tr>
              <tr>
                <td><strong>Edge API Gateway</strong></td>
                <td>Cloudflare Workers (<code>worker/index.ts</code>)</td>
                <td>Serverless REST edge functions executing in V8 isolates across 300+ edge data centers. Automatic CORS, dynamic schema checking, and sub-50ms execution.</td>
              </tr>
              <tr>
                <td><strong>Distributed Database</strong></td>
                <td>Cloudflare D1 (Serverless SQLite)</td>
                <td>Distributed relational SQL database with ACID transactions, Foreign Key enforcement, JSON audit finding storage, and declarative migrations.</td>
              </tr>
              <tr>
                <td><strong>Office & Export Sync</strong></td>
                <td><code>xlsx-js-style</code> & Google Sheets Webhooks</td>
                <td>Corporate Excel workbook generation with branded cell styling and automated two-way cloud spreadsheet replication via Apps Script Webhook.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- System Architecture Diagram -->
      <section id="system-architecture">
        <h2>3. System Architecture Topology</h2>
        <p>The diagram below illustrates the end-to-end communication topology between the client browser, Cloudflare Edge API, Cloudflare D1 distributed database, and external Google Workspace integrations.</p>

        <div class="diagram-wrapper">
          <div class="diagram-title">System Architecture & Boundary Flow</div>
          <svg viewBox="0 0 960 480" width="100%" height="480" style="display:block; margin:0 auto; font-family:-apple-system, sans-serif;">
            <defs>
              <linearGradient id="clientGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#0f9d8c"/>
                <stop offset="100%" stop-color="#0b7a6d"/>
              </linearGradient>
              <linearGradient id="edgeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#2f6df0"/>
                <stop offset="100%" stop-color="#1e4eb8"/>
              </linearGradient>
              <linearGradient id="dbGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#f59e0b"/>
                <stop offset="100%" stop-color="#d97706"/>
              </linearGradient>
              <linearGradient id="extGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#10b981"/>
                <stop offset="100%" stop-color="#059669"/>
              </linearGradient>
              <filter id="shadow" x="-5%" y="-5%" width="110%" height="115%">
                <feDropShadow dx="0" dy="4" stdDeviation="6" flood-opacity="0.1"/>
              </filter>
              <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#64748b"/>
              </marker>
              <marker id="arrowTeal" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#0f9d8c"/>
              </marker>
              <marker id="arrowBlue" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#2f6df0"/>
              </marker>
            </defs>

            <!-- Background boundary cards -->
            <rect x="20" y="20" width="280" height="440" rx="14" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.5" stroke-dasharray="6,4" />
            <text x="35" y="45" font-size="12" font-weight="700" fill="#64748b" letter-spacing="1">CLIENT BROWSER RUNTIME</text>

            <rect x="340" y="20" width="280" height="440" rx="14" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.5" stroke-dasharray="6,4" />
            <text x="355" y="45" font-size="12" font-weight="700" fill="#64748b" letter-spacing="1">CLOUDFLARE EDGE NETWORK</text>

            <rect x="660" y="20" width="280" height="440" rx="14" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.5" stroke-dasharray="6,4" />
            <text x="675" y="45" font-size="12" font-weight="700" fill="#64748b" letter-spacing="1">PERSISTENCE &amp; INTEGRATIONS</text>

            <!-- CLIENT BOXES -->
            <g filter="url(#shadow)">
              <rect x="40" y="70" width="240" height="100" rx="10" fill="url(#clientGrad)" />
              <text x="55" y="100" font-size="15" font-weight="700" fill="#ffffff">React 19 SPA (Client UI)</text>
              <text x="55" y="122" font-size="12" fill="#e6f7f5">• Schedule, Table &amp; Summary Views</text>
              <text x="55" y="139" font-size="12" fill="#e6f7f5">• Strict Full-Form Validation</text>
              <text x="55" y="156" font-size="12" fill="#e6f7f5">• Dynamic Master-Order Sorting</text>
            </g>

            <g filter="url(#shadow)">
              <rect x="40" y="200" width="240" height="110" rx="10" fill="#ffffff" stroke="#0f9d8c" stroke-width="2" />
              <text x="55" y="228" font-size="14" font-weight="700" fill="#0f766e">useScheduler ViewModel</text>
              <text x="55" y="248" font-size="11.5" fill="#475569">• In-Memory Reactive State Tree</text>
              <text x="55" y="266" font-size="11.5" fill="#475569">• Optimistic Mutation Pipeline</text>
              <text x="55" y="284" font-size="11.5" fill="#475569">• Multi-Facility Filter Engines</text>
              <text x="55" y="302" font-size="11.5" fill="#475569">• Statistics &amp; Rollup Reducers</text>
            </g>

            <g filter="url(#shadow)">
              <rect x="40" y="340" width="240" height="90" rx="10" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5" />
              <text x="55" y="368" font-size="14" font-weight="700" fill="#334155">LocalStorage Snapshot</text>
              <text x="55" y="390" font-size="11.5" fill="#64748b">Key: calendar_qa_snapshot</text>
              <text x="55" y="408" font-size="11.5" fill="#64748b">Instant hydration on initial boot</text>
            </g>

            <!-- CLOUDFLARE WORKER BOXES -->
            <g filter="url(#shadow)">
              <rect x="360" y="70" width="240" height="130" rx="10" fill="url(#edgeGrad)" />
              <text x="375" y="100" font-size="15" font-weight="700" fill="#ffffff">Cloudflare Workers API</text>
              <text x="375" y="122" font-size="12" fill="#dbeafe">• Edge V8 Isolate Serverless</text>
              <text x="375" y="139" font-size="12" fill="#dbeafe">• Static SPA Asset Hosting</text>
              <text x="375" y="156" font-size="12" fill="#dbeafe">• REST Endpoints (/api/*)</text>
              <text x="375" y="173" font-size="12" fill="#dbeafe">• Dynamic D1 Schema Verifier</text>
              <text x="375" y="190" font-size="12" fill="#dbeafe">• Sub-50ms Global Routing</text>
            </g>

            <g filter="url(#shadow)">
              <rect x="360" y="230" width="240" height="200" rx="10" fill="#ffffff" stroke="#2f6df0" stroke-width="2" />
              <text x="375" y="258" font-size="14" font-weight="700" fill="#1e40af">Edge REST Router</text>
              <text x="375" y="280" font-size="11.5" fill="#475569">GET  /api/state (Full state)</text>
              <text x="375" y="300" font-size="11.5" fill="#475569">POST /api/assignments (Create)</text>
              <text x="375" y="320" font-size="11.5" fill="#475569">PUT  /api/assignments/:id (Edit)</text>
              <text x="375" y="340" font-size="11.5" fill="#475569">DEL  /api/assignments/:id (Cascade)</text>
              <text x="375" y="360" font-size="11.5" fill="#475569">PUT  /api/options/reorder (Order)</text>
              <text x="375" y="380" font-size="11.5" fill="#475569">POST /api/google-sheets/sync</text>
              <text x="375" y="405" font-size="11" font-weight="600" fill="#0f9d8c">Zero-Cold-Start Execution</text>
            </g>

            <!-- DATABASE & EXTERNAL BOXES -->
            <g filter="url(#shadow)">
              <rect x="680" y="70" width="240" height="190" rx="10" fill="url(#dbGrad)" />
              <text x="695" y="100" font-size="15" font-weight="700" fill="#ffffff">Cloudflare D1 (SQLite)</text>
              <text x="695" y="122" font-size="12" fill="#fef3c7">• assignments (Schedule &amp; Results)</text>
              <text x="695" y="139" font-size="12" fill="#fef3c7">• orders (Audit metadata)</text>
              <text x="695" y="156" font-size="12" fill="#fef3c7">• engineers (Roster &amp; Dept)</text>
              <text x="695" y="173" font-size="12" fill="#fef3c7">• plants &amp; active_plants</text>
              <text x="695" y="190" font-size="12" fill="#fef3c7">• options (_order_ sequence)</text>
              <text x="695" y="207" font-size="12" fill="#fef3c7">• comments (Threaded notes)</text>
              <text x="695" y="224" font-size="12" fill="#fef3c7">• activity (Immutable audit log)</text>
              <text x="695" y="246" font-size="11" font-weight="600" fill="#ffffff">ACID Storage &amp; Foreign Keys</text>
            </g>

            <g filter="url(#shadow)">
              <rect x="680" y="290" width="240" height="140" rx="10" fill="url(#extGrad)" />
              <text x="695" y="320" font-size="15" font-weight="700" fill="#ffffff">Google Sheets Integration</text>
              <text x="695" y="342" font-size="12" fill="#ecfdf5">• Apps Script Webhook API</text>
              <text x="695" y="359" font-size="12" fill="#ecfdf5">• Event-driven sync on mutation</text>
              <text x="695" y="376" font-size="12" fill="#ecfdf5">• sync_all bulk cloud sync</text>
              <text x="695" y="393" font-size="12" fill="#ecfdf5">• Corporate master spreadsheets</text>
              <text x="695" y="415" font-size="11" font-weight="600" fill="#ffffff">Two-Way Enterprise Bridge</text>
            </g>

            <!-- CONNECTOR ARROWS -->
            <path d="M 160 170 L 160 200" stroke="#0f9d8c" stroke-width="2" marker-end="url(#arrowTeal)" />
            <path d="M 160 310 L 160 340" stroke="#64748b" stroke-width="1.5" stroke-dasharray="4,3" marker-end="url(#arrow)" />
            <path d="M 280 255 L 360 255" stroke="#2f6df0" stroke-width="2" marker-end="url(#arrowBlue)" />
            <path d="M 360 275 L 280 275" stroke="#2f6df0" stroke-width="2" stroke-dasharray="4,3" marker-end="url(#arrowBlue)" />
            <path d="M 600 160 L 680 160" stroke="#d97706" stroke-width="2" marker-end="url(#arrow)" />
            <path d="M 680 180 L 600 180" stroke="#d97706" stroke-width="2" stroke-dasharray="4,3" marker-end="url(#arrow)" />
            <path d="M 600 360 L 680 360" stroke="#10b981" stroke-width="2" marker-end="url(#arrow)" />
          </svg>
        </div>
      </section>

      <!-- Data Lifecycle -->
      <section id="data-lifecycle">
        <h2>4. Data Lifecycle &amp; Dual-Persistence Mechanism</h2>
        <div class="feature-card">
          <p>
            To guarantee <strong>zero perceivable latency</strong> and uninterrupted offline accessibility during factory floor inspections, the application utilizes a sophisticated <strong>Dual-Layer Persistence Pattern</strong>:
          </p>

          <ol>
            <li>
              <strong>Instant Hydration (Layer 1 - Local Snapshot):</strong>
              When the browser initializes, <code>useScheduler</code> immediately parses <code>localStorage['calendar_qa_snapshot']</code>. If present, the full calendar, engineer roster, plant states, and custom options orders render within milliseconds without waiting for server roundtrips.
            </li>
            <li>
              <strong>Background Reconciliation (Layer 2 - Edge Remote Sync):</strong>
              Concurrently, an asynchronous <code>GET /api/state</code> request dispatches to the Cloudflare Worker. The remote D1 state reconciles with the local state, seamlessly updating any mutations made by other QA team members.
            </li>
            <li>
              <strong>Optimistic Mutation Pipeline:</strong>
              When an engineer creates, edits, or deletes an appointment, the UI updates <em>optimistically</em> in memory, instantly writes to the local snapshot, and asynchronously commits to the Cloudflare Worker and D1 database.
            </li>
            <li>
              <strong>Event-Driven Google Sheets Broadcast:</strong>
              Upon successful persistence, the backend checks for Google Sheets synchronization rules and pushes formatted rows to the configured webhook endpoint.
            </li>
          </ol>
        </div>
      </section>

      <!-- Database Schema & ERD -->
      <section id="database-schema">
        <h2>5. D1 SQLite Database Relational Schema</h2>
        <div class="feature-card">
          <p>
            The backend leverages <strong>Cloudflare D1</strong>, a distributed relational SQLite database. Denormalized design is intentionally employed on <code>assignments</code> to accelerate complex calendar multi-plant queries while preserving referential integrity with foreign keys.
          </p>

          <table class="spec-table">
            <thead>
              <tr>
                <th>Table Name</th>
                <th>Primary Key</th>
                <th>Foreign Keys</th>
                <th>Key Columns &amp; Description</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><code>assignments</code></td>
                <td><code>id</code> (UUID / Code)</td>
                <td><code>eng &rarr; engineers(id)</code><br><code>order_id &rarr; orders(id)</code></td>
                <td>
                  Denormalized schedule slot: <code>week</code>, <code>day</code>, <code>site1</code>, <code>site2</code>, <code>customer</code>, <code>end_customer</code>, <code>auditor1</code>, <code>auditor2</code>, <code>department</code>, <code>purpose</code>, <code>target_package</code>, <code>audit_category</code>, <code>results</code> (JSON stringified per-site findings), <code>created_at</code>, <code>updated_at</code>.
                </td>
              </tr>
              <tr>
                <td><code>orders</code></td>
                <td><code>id</code></td>
                <td>None</td>
                <td>Parent appointment entity: <code>customer</code>, <code>product</code>, <code>plant</code>, <code>purpose</code>.</td>
              </tr>
              <tr>
                <td><code>engineers</code></td>
                <td><code>id</code></td>
                <td>None</td>
                <td>Auditor roster: <code>name</code>, <code>role</code>, <code>department</code> (QA / Non-QA), <code>site</code> (default UTL1), <code>sub_departments</code> (JSON array: QMS, EHS, ESD).</td>
              </tr>
              <tr>
                <td><code>plants</code></td>
                <td><code>id</code></td>
                <td>None</td>
                <td>Plant / Sub-department divisions: <code>name</code>, <code>loc</code>, <code>code</code>, <code>color</code> (e.g. QMS=#2f6df0, EHS=#0f9d8c, ESD=#c2620c).</td>
              </tr>
              <tr>
                <td><code>active_plants</code></td>
                <td><code>plant_id</code></td>
                <td><code>plant_id &rarr; plants(id)</code></td>
                <td>Visibility toggle flag (<code>active: 0|1</code>) for calendar rows.</td>
              </tr>
              <tr>
                <td><code>options</code></td>
                <td><code>category</code> + <code>value</code></td>
                <td>None</td>
                <td>
                  Dynamic tag registry for <code>site_code</code>, <code>customer_name</code>, <code>end_customer</code>, <code>department</code>, <code>purpose</code>, <code>target_package</code>, <code>audit_category</code>, plus custom ordering arrays stored under <code>_order_&lt;category&gt;</code>.
                </td>
              </tr>
              <tr>
                <td><code>comments</code></td>
                <td><code>id</code></td>
                <td><code>assignment_id &rarr; assignments(id)</code></td>
                <td>Collaborative audit notes with author attribution and timestamp.</td>
              </tr>
              <tr>
                <td><code>activity</code></td>
                <td><code>id</code></td>
                <td>None</td>
                <td>Immutable audit trail logging appointment creations, modifications, and deletions.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- Universal Master-Order Architecture -->
      <section id="master-order-architecture">
        <h2>6. Universal Master-Order Sorting Architecture</h2>
        <div class="feature-card">
          <p>
            Previously, sorting across different views relied on hardcoded lists. In the current architecture, <strong>the custom order defined in the "Options" tab serves as the single source of truth</strong> across the entire system:
          </p>

          <div class="callout info">
            <strong>Single Source of Truth Principle:</strong>
            When an administrator reorders sites, customers, or standards in the Options tab (or via drag-and-drop), that exact sequence is saved to Cloudflare D1 under <code>_order_&lt;category&gt;</code>. It immediately and reactively drives:
            <ul>
              <li>Dropdown &amp; Combobox selectors in creation/edit forms.</li>
              <li>Filter menus in the Table View and Calendar.</li>
              <li>Multi-site normalization and slash concatenations (e.g., <code>UTL1/UTL2/UTL3</code>).</li>
              <li>Column headers and row groupings in the Summary Dashboard matrix.</li>
              <li>Table View column sorting when clicking header columns.</li>
            </ul>
          </div>
        </div>

        <div class="diagram-wrapper">
          <div class="diagram-title">Universal Master-Order Dynamic Propagation Pipeline</div>
          <svg viewBox="0 0 920 320" width="100%" height="320" style="display:block; margin:0 auto; font-family:-apple-system, sans-serif;">
            <defs>
              <marker id="pipeArrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#0f9d8c"/>
              </marker>
              <linearGradient id="pipeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#0f9d8c"/>
                <stop offset="100%" stop-color="#2f6df0"/>
              </linearGradient>
            </defs>

            <!-- Source Stage 1 -->
            <g>
              <rect x="30" y="110" width="180" height="100" rx="10" fill="#ffffff" stroke="#0f9d8c" stroke-width="2"/>
              <text x="45" y="140" font-size="13" font-weight="700" fill="#0f766e">1. Options Tab (UI)</text>
              <text x="45" y="160" font-size="11" fill="#475569">• User drags &amp; drops</text>
              <text x="45" y="178" font-size="11" fill="#475569">• Reorders sites / tags</text>
              <text x="45" y="196" font-size="11" font-weight="600" fill="#0f9d8c">Single Source of Truth</text>
            </g>

            <!-- Stage 2: API & D1 -->
            <g>
              <rect x="260" y="110" width="190" height="100" rx="10" fill="#ffffff" stroke="#2f6df0" stroke-width="2"/>
              <text x="275" y="138" font-size="13" font-weight="700" fill="#1e40af">2. Cloudflare D1 Store</text>
              <text x="275" y="158" font-size="11" fill="#475569">• PUT /api/options/reorder</text>
              <text x="275" y="176" font-size="11" fill="#475569">• options._order_&lt;cat&gt;</text>
              <text x="275" y="194" font-size="11" fill="#475569">• JSON stringified array</text>
            </g>

            <!-- Stage 3: Reactive State -->
            <g>
              <rect x="500" y="110" width="170" height="100" rx="10" fill="url(#pipeGrad)"/>
              <text x="515" y="138" font-size="13" font-weight="700" fill="#ffffff">3. Reactive State</text>
              <text x="515" y="158" font-size="11" fill="#e6f7f5">• useScheduler Hook</text>
              <text x="515" y="176" font-size="11" fill="#e6f7f5">• Local snapshot write</text>
              <text x="515" y="194" font-size="11" fill="#e6f7f5">• Instant propagation</text>
            </g>

            <!-- Downstream Consumers (Stage 4) -->
            <!-- Consumer A -->
            <g>
              <rect x="720" y="20" width="180" height="55" rx="8" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.5"/>
              <text x="732" y="42" font-size="11.5" font-weight="700" fill="#1e293b">Dropdown &amp; Combobox</text>
              <text x="732" y="58" font-size="10" fill="#64748b">Modal selectors sorted</text>
            </g>

            <!-- Consumer B -->
            <g>
              <rect x="720" y="90" width="180" height="55" rx="8" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.5"/>
              <text x="732" y="112" font-size="11.5" font-weight="700" fill="#1e293b">Multi-Facet Filters</text>
              <text x="732" y="128" font-size="10" fill="#64748b">Table &amp; Calendar filters</text>
            </g>

            <!-- Consumer C -->
            <g>
              <rect x="720" y="160" width="180" height="55" rx="8" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.5"/>
              <text x="732" y="182" font-size="11.5" font-weight="700" fill="#1e293b">Table Column Sort</text>
              <text x="732" y="198" font-size="10" fill="#64748b">Site / Customer order</text>
            </g>

            <!-- Consumer D -->
            <g>
              <rect x="720" y="230" width="180" height="55" rx="8" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.5"/>
              <text x="732" y="252" font-size="11.5" font-weight="700" fill="#1e293b">Summary Dashboard</text>
              <text x="732" y="268" font-size="10" fill="#64748b">Annual Site matrix rows</text>
            </g>

            <!-- Flow Arrows -->
            <path d="M 210 160 L 260 160" stroke="#0f9d8c" stroke-width="2" marker-end="url(#pipeArrow)"/>
            <path d="M 450 160 L 500 160" stroke="#0f9d8c" stroke-width="2" marker-end="url(#pipeArrow)"/>

            <!-- Branches from 3 to Consumers -->
            <path d="M 670 140 L 695 140 L 695 48 L 720 48" stroke="#0f9d8c" stroke-width="1.5" marker-end="url(#pipeArrow)"/>
            <path d="M 670 150 L 695 150 L 695 118 L 720 118" stroke="#0f9d8c" stroke-width="1.5" marker-end="url(#pipeArrow)"/>
            <path d="M 670 165 L 695 165 L 695 188 L 720 188" stroke="#0f9d8c" stroke-width="1.5" marker-end="url(#pipeArrow)"/>
            <path d="M 670 175 L 695 175 L 695 258 L 720 258" stroke="#0f9d8c" stroke-width="1.5" marker-end="url(#pipeArrow)"/>
          </svg>
        </div>
      </section>

      <!-- Appointment Compliance Lifecycle Diagram -->
      <div class="diagram-wrapper">
        <div class="diagram-title">Appointment Compliance Lifecycle State Machine</div>
        <svg viewBox="0 0 920 300" width="100%" height="300" style="display:block; margin:0 auto; font-family:-apple-system, sans-serif;">
          <defs>
            <marker id="smArrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#64748b"/>
            </marker>
            <marker id="smArrowRed" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#dc2626"/>
            </marker>
            <marker id="smArrowGreen" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#16a34a"/>
            </marker>
            <marker id="smArrowYellow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#d97706"/>
            </marker>
          </defs>

          <!-- State 1: Incomplete -->
          <g>
            <rect x="30" y="30" width="190" height="100" rx="10" fill="#fee2e2" stroke="#dc2626" stroke-width="2"/>
            <text x="45" y="58" font-size="14" font-weight="700" fill="#991b1b">1. Incomplete Draft</text>
            <text x="45" y="78" font-size="11" fill="#b91c1c">• Missing required fields</text>
            <text x="45" y="94" font-size="11" fill="#b91c1c">• Solid Red Banner</text>
            <text x="45" y="110" font-size="11" font-weight="700" fill="#dc2626">bg-red-600 Flagged</text>
          </g>

          <!-- State 2: Scheduled -->
          <g>
            <rect x="290" y="30" width="190" height="100" rx="10" fill="#e0f2fe" stroke="#0284c7" stroke-width="2"/>
            <text x="305" y="58" font-size="14" font-weight="700" fill="#0369a1">2. Scheduled Audit</text>
            <text x="305" y="78" font-size="11" fill="#0284c7">• All 8 fields validated</text>
            <text x="305" y="94" font-size="11" fill="#0284c7">• Normal card styling</text>
            <text x="305" y="110" font-size="11" fill="#0369a1">• Future calendar date</text>
          </g>

          <!-- State 3: Missing Results -->
          <g>
            <rect x="550" y="30" width="190" height="100" rx="10" fill="#fef3c7" stroke="#d97706" stroke-width="2"/>
            <text x="565" y="58" font-size="14" font-weight="700" fill="#92400e">3. Audit Elapsed</text>
            <text x="565" y="78" font-size="11" fill="#b45309">• Date passed into past</text>
            <text x="565" y="94" font-size="11" fill="#b45309">• Results NOT recorded</text>
            <text x="565" y="110" font-size="11" font-weight="700" fill="#d97706">Yellow Warning Badge</text>
          </g>

          <!-- State 4: Completed -->
          <g>
            <rect x="420" y="175" width="210" height="100" rx="10" fill="#dcfce7" stroke="#16a34a" stroke-width="2"/>
            <text x="435" y="203" font-size="14" font-weight="700" fill="#15803d">4. Fully Completed</text>
            <text x="435" y="223" font-size="11" fill="#16a34a">• Findings entered (Maj/Min/OFI)</text>
            <text x="435" y="239" font-size="11" fill="#16a34a">• Marked Completed in modal</text>
            <text x="435" y="255" font-size="11" font-weight="700" fill="#15803d">Clean Green State</text>
          </g>

          <!-- Arrows -->
          <path d="M 220 80 L 290 80" stroke="#0284c7" stroke-width="2" marker-end="url(#smArrow)"/>
          <text x="228" y="72" font-size="10" fill="#64748b">All fields filled</text>

          <path d="M 480 80 L 550 80" stroke="#d97706" stroke-width="2" marker-end="url(#smArrowYellow)"/>
          <text x="488" y="72" font-size="10" fill="#64748b">Date passed</text>

          <path d="M 645 130 L 645 225 L 630 225" stroke="#16a34a" stroke-width="2" marker-end="url(#smArrowGreen)"/>
          <text x="655" y="180" font-size="10" fill="#15803d">Submit findings</text>

          <path d="M 385 130 L 385 225 L 420 225" stroke="#16a34a" stroke-width="2" marker-end="url(#smArrowGreen)"/>
          <text x="295" y="180" font-size="10" fill="#15803d">Findings logged early</text>

          <path d="M 385 30 C 385 10, 125 10, 125 30" stroke="#dc2626" stroke-width="1.5" stroke-dasharray="4,3" marker-end="url(#smArrowRed)"/>
          <text x="205" y="16" font-size="10" fill="#dc2626">Field cleared upon edit</text>
        </svg>
      </div>

      <!-- FEATURE 1: Schedule Calendar -->
      <section id="feature-schedule">
        <h2>7. Feature Deep-Dive: Timeline Calendar &amp; Multi-Views</h2>
        <div class="feature-card">
          <div class="card-header-flex">
            <div class="card-title">📅 Interactive Calendar Grid (<code>Schedule.tsx</code>)</div>
            <span class="pill pill-teal">Core Module</span>
          </div>

          <p>
            The Calendar view provides an interactive, dense Gantt-style planning board designed for high operational clarity across single-day and multi-day audits.
          </p>

          <h3>A. Multi-Dimensional Row Grouping</h3>
          <p>Users can instantly toggle between three distinct organizational perspectives:</p>
          <ul>
            <li><strong>Group by Person:</strong> Rows represent individual QA Engineers or Lead Auditors, displaying their assignments, workload distribution, and scheduled inspections.</li>
            <li><strong>Group by Plant / Sub-department:</strong> Rows organize by functional division (<code>QMS</code>, <code>EHS</code>, <code>ESD</code>), highlighting cross-functional coverage.</li>
            <li><strong>Group by Site:</strong> Rows organize by semiconductor manufacturing facility (<code>UTL1</code>, <code>UTL2</code>, <code>UTL2A</code>, <code>UTL2B</code>, <code>UTL3</code>, <code>UTL3A</code>, <code>UTL3T</code>).</li>
          </ul>

          <h3>B. Multi-Day Span Logic &amp; Day-Split Assignments</h3>
          <p>
            Audits lasting multiple days are dynamically rendered as continuous spanning pill bars. When multi-day audits cross weekend boundaries or involve different engineers per day, the system maintains group consistency while visually connecting the active dates.
          </p>

          <h3>C. Strict Compliance Color System &amp; Alert Banners</h3>
          <p>To enforce zero-defect quality standards, cards dynamically reflect real-time validation states:</p>

          <div class="grid-3">
            <div class="stat-box" style="border-top: 4px solid var(--danger);">
              <div class="stat-label" style="color:var(--danger)">Solid Red Warning Banner</div>
              <div class="stat-value" style="font-size:18px; color:var(--danger)">Incomplete Audit</div>
              <div class="stat-desc">Triggered if ANY required form field is blank or missing. Renders in solid red (<code>#dc2626</code>) with a warning exclamation badge.</div>
            </div>

            <div class="stat-box" style="border-top: 4px solid var(--warning);">
              <div class="stat-label" style="color:var(--warning)">Yellow Warning Badge</div>
              <div class="stat-value" style="font-size:18px; color:var(--warning)">Missing Findings</div>
              <div class="stat-desc">Triggered when an audit date has elapsed into the past, but the QA findings (Major, Minor, OFI, Obs) have not yet been recorded.</div>
            </div>

            <div class="stat-box" style="border-top: 4px solid var(--primary);">
              <div class="stat-label" style="color:var(--primary)">Teal / Standard Card</div>
              <div class="stat-value" style="font-size:18px; color:var(--primary)">Fully Compliant</div>
              <div class="stat-desc">All required fields are fully completed, and findings have been successfully submitted or are scheduled for upcoming dates.</div>
            </div>
          </div>

          <div class="screenshot-container">
            <img src="images/media_1787198022238.png" alt="UTAC QA Schedule Calendar Grid" class="screenshot-img" onclick="openLightbox(this.src)" onerror="if(!this.dataset.retried){this.dataset.retried=true;this.src='docs/images/media_1787198022238.png';}">
            <div class="screenshot-caption">Figure 1: Full Schedule Calendar Grid showing multi-day audit spans, engineer rows, date headers, and status cards.</div>
          </div>

          <div class="screenshot-container">
            <img src="images/media_1791272351200.png" alt="Appointment Card and Warning Banners" class="screenshot-img" onclick="openLightbox(this.src)" onerror="if(!this.dataset.retried){this.dataset.retried=true;this.src='docs/images/media_1791272351200.png';}">
            <div class="screenshot-caption">Figure 2: Appointment Card warning state with high-contrast indicator and floating tooltip inspection.</div>
          </div>

          <h3>D. Floating Anchored Hover Tooltip</h3>
          <p>
            Hovering over any appointment card instantly displays a non-modal floating tooltip directly anchored to the card, detailing the full customer name, site, standard, audit scope, assigned host engineers, and current findings without needing to open the edit drawer.
          </p>
        </div>
      </section>

      <!-- FEATURE 2: Appointment Modal & Strict Rules -->
      <section id="feature-validation">
        <h2>8. Feature Deep-Dive: Appointment Modal &amp; Strict Validation</h2>
        <div class="feature-card">
          <div class="card-header-flex">
            <div class="card-title">📝 Appointment Form &amp; Strict Quality Engine</div>
            <span class="pill pill-blue">Validation Core</span>
          </div>

          <p>
            The appointment creation and editing system (<code>AppointmentFormFields.tsx</code>, <code>CreateModal.tsx</code>, <code>EditModal.tsx</code>) provides dedicated workflows for Customer and Internal audits.
          </p>

          <div class="grid-2">
            <div>
              <h3>Customer Audit Form Fields (Strict 8 Requirements)</h3>
              <ol>
                <li><strong>Standard:</strong> Quality standard (e.g. ISO 9001, IATF 16949, Customer Specific).</li>
                <li><strong>Site:</strong> Multi-select manufacturing sites, automatically normalized in master order.</li>
                <li><strong>Customer:</strong> Searchable combobox auto-suggesting approved customers.</li>
                <li><strong>End Customer:</strong> Dedicated independent field for end-client specification.</li>
                <li><strong>Purpose:</strong> Reason for audit (Certification, Re-certification, Surveillance, Special).</li>
                <li><strong>Target Package:</strong> Specific semiconductor package line (e.g., QFN, BGA, WLCSP).</li>
                <li><strong>Scope:</strong> Detailed focus areas, process lines, or audit objectives.</li>
                <li><strong>QMS Host:</strong> Assigned QA engineers hosting the external auditor.</li>
              </ol>
            </div>
            <div>
              <h3>Internal Audit Form Fields</h3>
              <ol>
                <li><strong>Standard:</strong> Internal standard or specification.</li>
                <li><strong>Site:</strong> Target plant / location being audited.</li>
                <li><strong>Purpose:</strong> Internal compliance or gap analysis objective.</li>
                <li><strong>Lead Auditor:</strong> Lead qualified internal auditor in charge.</li>
                <li><strong>Internal Auditor / Host:</strong> Co-auditors or host engineers.</li>
                <li><strong>Scope:</strong> Operational process area under evaluation.</li>
                <li><strong>Date Range:</strong> Calendar start and completion dates.</li>
              </ol>
            </div>
          </div>

          <div class="callout warning">
            <strong>Guided Keyboard Navigation Hint:</strong>
            To accelerate rapid administrative entry, the modal features a subtle, prominent keyboard navigation hint:
            <br>
            <code>Tab ⇥ Tip: Press Tab to navigate to the next field</code> (or Thai: <code>กด Tab เพื่อเลื่อนไปกรอกช่องถัดไป</code>), enabling auditors to cycle through all 8 fields in seconds without lifting their hands from the keyboard.
          </div>

          <div class="screenshot-container">
            <img src="images/media_1787183247656.png" alt="Appointment Modal Form Drawer" class="screenshot-img" style="max-height:450px;" onclick="openLightbox(this.src)" onerror="if(!this.dataset.retried){this.dataset.retried=true;this.src='docs/images/media_1787183247656.png';}">
            <div class="screenshot-caption">Figure 3: Appointment Creation Modal showing tab switcher, field inputs, and guided keyboard hints.</div>
          </div>

          <div class="screenshot-container">
            <img src="images/media_1791357143561.png" alt="Searchable Customer Combobox" class="screenshot-img" onclick="openLightbox(this.src)" onerror="if(!this.dataset.retried){this.dataset.retried=true;this.src='docs/images/media_1791357143561.png';}">
            <div class="screenshot-caption">Figure 4: Searchable Customer Combobox with instant typing filter and master option suggestions.</div>
          </div>
        </div>
      </section>

      <!-- FEATURE 3: Audit Results Recording -->
      <section id="feature-results">
        <h2>9. Feature Deep-Dive: Audit Findings Recording</h2>
        <div class="feature-card">
          <div class="card-header-flex">
            <div class="card-title">📊 Multi-Site Findings Tracker (<code>AuditResultsModal.tsx</code>)</div>
            <span class="pill pill-green">Audit Closure</span>
          </div>

          <p>
            When an audit concludes, engineers use the Audit Results modal to record quantitative findings. For multi-site audits (e.g. <code>UTL1/UTL2/UTL3</code>), findings are recorded per site:
          </p>

          <table class="spec-table">
            <thead>
              <tr>
                <th>Finding Classification</th>
                <th>Standard Definition</th>
                <th>Impact on Audit Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong style="color:var(--danger)">Major Non-Conformance (Major NC)</strong></td>
                <td>Significant breakdown of quality system or regulatory breach. Requires corrective action plan within 30 days.</td>
                <td>Audit flagged with critical major finding tag.</td>
              </tr>
              <tr>
                <td><strong style="color:var(--warning)">Minor Non-Conformance (Minor NC)</strong></td>
                <td>Isolated procedural departure or documentation lapse not compromising product integrity.</td>
                <td>Audit marked complete once containment plan is submitted.</td>
              </tr>
              <tr>
                <td><strong style="color:var(--accent)">Opportunity for Improvement (OFI)</strong></td>
                <td>Constructive recommendation to optimize process efficiency or maturity.</td>
                <td>Logged for continuous improvement tracking.</td>
              </tr>
              <tr>
                <td><strong style="color:#059669">Observations (Obs)</strong></td>
                <td>Factual notes made by the auditor during manufacturing walkthroughs.</td>
                <td>Recorded for subsequent surveillance cycles.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- FEATURE 4: Dynamic Table View -->
      <section id="feature-table">
        <h2>10. Feature Deep-Dive: Dynamic Table View</h2>
        <div class="feature-card">
          <div class="card-header-flex">
            <div class="card-title">📋 High-Density Operational Table (<code>TableView.tsx</code>)</div>
            <span class="pill pill-teal">Analytics Grid</span>
          </div>

          <p>
            The Table View provides a tabular layout for searching, multi-facet filtering, batch reviewing, and exporting audit schedules.
          </p>

          <h3>Key Architectural Highlights:</h3>
          <ul>
            <li><strong>Real-Time Search Bar:</strong> Instantly matches any string across Customer, End Customer, Site, Standard, Auditor, Purpose, Scope, or Order ID.</li>
            <li><strong>Active Customer Filter Pruning:</strong> To prevent "ghost" customers from cluttering filter dropdowns (such as customer "IFX" persisting after appointment deletion), customer filter lists are dynamically derived strictly from active, non-deleted appointments.</li>
            <li><strong>Master-Order Dynamic Column Sorting:</strong> Clicking the Site column header sorts rows according to the custom order in the Options tab (<code>UTL1 &rarr; UTL2 &rarr; UTL2A &rarr; UTL2B &rarr; UTL3 &rarr; UTL3A &rarr; UTL3T</code>) rather than simple ASCII alphabetical sorting.</li>
            <li><strong>Cascade Deletion with Safety Confirmation:</strong> Deleting an appointment automatically cascades to delete all day slots sharing the same <code>order_id</code> / <code>groupId</code>, and prunes unused customer options from Cloudflare D1.</li>
            <li><strong>Excel &amp; CSV Export:</strong> Exports filtered datasets with all audit fields and finding tallies.</li>
          </ul>
        </div>
      </section>

      <!-- FEATURE 5: Executive Summary Dashboard -->
      <section id="feature-summary">
        <h2>11. Feature Deep-Dive: Annual Summary Dashboard</h2>
        <div class="feature-card">
          <div class="card-header-flex">
            <div class="card-title">📈 Annual QA Matrix &amp; KPI Dashboard (<code>SummaryDashboard.tsx</code>)</div>
            <span class="pill pill-blue">Executive Management</span>
          </div>

          <p>
            The Summary Dashboard aggregates operational appointments into annual executive matrices broken down across all 12 calendar months:
          </p>

          <div class="grid-2">
            <div>
              <h3>Annual Site Breakdown Matrix</h3>
              <p>
                Renders a 12-month cross-tabulation for every manufacturing site (<code>UTL1</code>, <code>UTL2</code>, <code>UTL2A</code>, <code>UTL2B</code>, <code>UTL3</code>, <code>UTL3A</code>, <code>UTL3T</code>). Displays monthly audit frequencies, completed percentages, and finding distributions.
              </p>
            </div>
            <div>
              <h3>Standard &amp; Audit Type Distribution</h3>
              <p>
                Visualizes annual audit distributions between Customer Audits and Internal Audits, further segmented by ISO 9001, IATF 16949, ESD, EHS, and VDA 6.3.
              </p>
            </div>
          </div>

          <h3>Styled Corporate Excel Export via <code>xlsx-js-style</code></h3>
          <p>
            Clicking "Export Excel" generates a styled workbook with corporate UTAC color themes, bold column headers, bordered cells, and auto-calculated formula sums.
          </p>

          <div class="screenshot-container">
            <img src="images/media_1787296549043.png" alt="Annual Summary Dashboard Matrix" class="screenshot-img" onclick="openLightbox(this.src)" onerror="if(!this.dataset.retried){this.dataset.retried=true;this.src='docs/images/media_1787296549043.png';}">
            <div class="screenshot-caption">Figure 5: Annual Summary Matrix showing monthly site distribution and executive KPI summary totals.</div>
          </div>
        </div>
      </section>

      <!-- FEATURE 6: Manage Engineers & Options -->
      <section id="feature-engineers">
        <h2>12. Feature Deep-Dive: Engineer Roster &amp; Options Management</h2>
        <div class="feature-card">
          <div class="card-header-flex">
            <div class="card-title">⚙️ Admin Configuration (<code>Admin.tsx</code>, <code>EngineerModal.tsx</code>)</div>
            <span class="pill pill-teal">Administration</span>
          </div>

          <div class="grid-2">
            <div>
              <h3>Auditor &amp; Engineer Directory</h3>
              <ul>
                <li><strong>Engineer Profiles:</strong> Name, role, primary site assignment.</li>
                <li><strong>Host Department:</strong> Explicit selector for <code>QA</code> vs <code>Non-QA</code>.</li>
                <li><strong>Plant Tagging:</strong> Assign engineers to functional groups: <code>QMS</code>, <code>EHS</code>, <code>ESD</code>, <code>ESD Audit</code>, <code>QS Audit</code>.</li>
                <li><strong>Lead Auditor Status:</strong> Flag qualification for leading formal audits.</li>
                <li><strong>Active Toggle:</strong> Soft toggle to show/hide engineers without losing historical records.</li>
              </ul>
            </div>
            <div>
              <h3>Options Tab (Universal Dynamic Ordering)</h3>
              <ul>
                <li><strong>Categories Managed:</strong> Sites, Customers, End Customers, Standards, Purposes, Target Packages, Departments.</li>
                <li><strong>Drag-and-Drop Reordering:</strong> Administrators can drag items to define custom presentation sequences.</li>
                <li><strong>Global Propagation:</strong> Automatically calls <code>PUT /api/options/reorder</code>, updates Cloudflare D1, and synchronizes the local snapshot instantly.</li>
              </ul>
            </div>
          </div>

          <div class="screenshot-container">
            <img src="images/media_1791339415396.png" alt="Manage Auditors &amp; Engineers Dashboard" class="screenshot-img" onclick="openLightbox(this.src)" onerror="if(!this.dataset.retried){this.dataset.retried=true;this.src='docs/images/media_1791339415396.png';}">
            <div class="screenshot-caption">Figure 6: Manage Page showing the auditor roster, plant badges, and department configuration.</div>
          </div>

          <div class="screenshot-container">
            <img src="images/media_1793860638249_8e0cf800.png" alt="QA and Non-QA Department Toggle" class="screenshot-img" onclick="openLightbox(this.src)" onerror="if(!this.dataset.retried){this.dataset.retried=true;this.src='docs/images/media_1793860638249_8e0cf800.png';}">
            <div class="screenshot-caption">Figure 7: QA / Non-QA Department selector badge interface for auditor assignments.</div>
          </div>
        </div>
      </section>

      <!-- FEATURE 7: Audit Trail & Activity Logging -->
      <section id="feature-activity">
        <h2>13. Feature Deep-Dive: Audit Trail &amp; Historical Log</h2>
        <div class="feature-card">
          <div class="card-header-flex">
            <div class="card-title">📜 Immutable Activity Trail (<code>HistoryView.tsx</code>)</div>
            <span class="pill pill-blue">Compliance</span>
          </div>

          <p>
            To maintain strict accountability for semiconductor quality certifications, every mutation in the application is recorded to the <code>activity</code> table in Cloudflare D1. The History view displays:
          </p>

          <ul>
            <li><strong>Event Action:</strong> Created Appointment, Edited Appointment, Recorded Audit Results, Deleted Appointment, Updated Engineer Roster, Reordered Options.</li>
            <li><strong>User Attribution:</strong> Displays author name or authenticated user ID.</li>
            <li><strong>Timestamp:</strong> Shows relative time (e.g. "2 hours ago") and ISO 8601 exact timestamp.</li>
            <li><strong>Entity Details:</strong> Customer name, affected manufacturing site, and appointment identifiers.</li>
          </ul>
        </div>
      </section>

      <!-- FEATURE 8: Google Sheets Cloud Sync -->
      <section id="feature-sheets">
        <h2>14. Feature Deep-Dive: Real-Time Google Sheets Cloud Sync</h2>
        <div class="feature-card">
          <div class="card-header-flex">
            <div class="card-title">🔄 Google Workspace Cloud Bridge (<code>worker/index.ts</code>)</div>
            <span class="pill pill-green">Integration</span>
          </div>

          <p>
            The system includes a serverless cloud-to-cloud bridge connecting the Cloudflare Worker directly to Google Apps Script Webhooks:
          </p>

          <ol>
            <li><strong>Automatic Event-Driven Sync:</strong> Whenever an appointment is created, updated, or deleted, a structured JSON payload is posted to the Google Apps Script webhook to update corporate spreadsheets.</li>
            <li><strong>Full Manual Sync (<code>sync_all</code>):</strong> A dedicated "Sync All to Google Sheets" action reconciles the entire database with the spreadsheet in a single operation.</li>
          </ol>

          <div class="screenshot-container">
            <img src="images/media_1792603542297_a651cef6.png" alt="Google Sheets Sync Status Bar" class="screenshot-img" onclick="openLightbox(this.src)" onerror="if(!this.dataset.retried){this.dataset.retried=true;this.src='docs/images/media_1792603542297_a651cef6.png';}">
            <div class="screenshot-caption">Figure 8: Google Sheets sync status toolbar indicating live cloud connection and sync timestamps.</div>
          </div>
        </div>
      </section>

      <!-- REST API Reference -->
      <section id="api-spec">
        <h2>15. REST API Endpoint Specification</h2>
        <div class="feature-card">
          <p>All endpoints are served by Cloudflare Workers at <code>/api/*</code> and return JSON responses with CORS headers.</p>

          <table class="spec-table">
            <thead>
              <tr>
                <th>Method &amp; Route</th>
                <th>Payload / Query</th>
                <th>Description &amp; Effect</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><code>GET /api/state</code></td>
                <td>None</td>
                <td>Returns complete application state: engineers, plants, active plants, orders, assignments, comments, activity log, and sorted options.</td>
              </tr>
              <tr>
                <td><code>POST /api/assignments</code></td>
                <td>Assignment JSON</td>
                <td>Creates an appointment slot in <code>assignments</code> table and records an audit log entry in <code>activity</code>.</td>
              </tr>
              <tr>
                <td><code>PUT /api/assignments/:id</code></td>
                <td>Updated Fields JSON</td>
                <td>Updates appointment fields, results, or notes, tracking modifications with timestamps.</td>
              </tr>
              <tr>
                <td><code>DELETE /api/assignments/:id</code></td>
                <td>None</td>
                <td>Cascades deletion of associated day slots, related orders, comments, and prunes unused customer options.</td>
              </tr>
              <tr>
                <td><code>PUT /api/options/reorder</code></td>
                <td><code>{ category, order: string[] }</code></td>
                <td>Saves custom sequence under <code>_order_&lt;category&gt;</code> in D1, dynamically reordering all UI elements.</td>
              </tr>
              <tr>
                <td><code>POST /api/google-sheets/sync</code></td>
                <td><code>{ action: 'sync_all' | 'sync_one', ... }</code></td>
                <td>Dispatches structured rows to the Google Apps Script webhook endpoint.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- Multi-Site Normalization -->
      <section id="site-normalization">
        <h2>16. Multi-Site Normalization &amp; Formatting</h2>
        <div class="feature-card">
          <p>
            To eliminate legacy inconsistencies across the system, all site codes are normalized to standard <code>UTL</code> prefixes using the following rule set:
          </p>

          <table class="spec-table">
            <thead>
              <tr>
                <th>Input Site String</th>
                <th>Normalized Site Code</th>
                <th>Canonical Sort Priority</th>
              </tr>
            </thead>
            <tbody>
              <tr><td><code>U1</code> or <code>UTL1</code></td><td><code>UTL1</code></td><td>1</td></tr>
              <tr><td><code>U2</code> or <code>UTL2</code></td><td><code>UTL2</code></td><td>2</td></tr>
              <tr><td><code>U2A</code> or <code>UTL2A</code></td><td><code>UTL2A</code></td><td>3</td></tr>
              <tr><td><code>U2B</code> or <code>UTL2B</code></td><td><code>UTL2B</code></td><td>4</td></tr>
              <tr><td><code>U3</code> or <code>UTL3</code></td><td><code>UTL3</code></td><td>5</td></tr>
              <tr><td><code>U3A</code> or <code>UTL3A</code></td><td><code>UTL3A</code></td><td>6</td></tr>
              <tr><td><code>U3B</code> or <code>UTL3B</code></td><td><code>UTL3B</code></td><td>7</td></tr>
              <tr><td><code>U3T</code> or <code>UTL3T</code></td><td><code>UTL3T</code></td><td>8</td></tr>
            </tbody>
          </table>

          <p>
            Multi-site strings separated by slashes or commas (e.g., <code>UTL3/UTL1</code>) are parsed, de-duplicated, and sorted in canonical order: <code>UTL1/UTL3</code>.
          </p>
        </div>
      </section>

    </main>
  </div>

  <!-- Lightbox Modal for Screenshots -->
  <div id="lightboxModal" class="lightbox-modal" onclick="closeLightbox()">
    <span class="lightbox-close">&times;</span>
    <img id="lightboxImg" class="lightbox-content" src="" alt="Enlarged Screenshot">
  </div>

  <script>
    // Lightbox modal logic
    function openLightbox(src) {
      const modal = document.getElementById('lightboxModal');
      const img = document.getElementById('lightboxImg');
      img.src = src;
      modal.classList.add('active');
    }

    function closeLightbox() {
      document.getElementById('lightboxModal').classList.remove('active');
    }

    // Escape key closes modal
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeLightbox();
    });

    // Real-time documentation search filter
    const searchInput = document.getElementById('docSearch');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        const links = document.querySelectorAll('.nav-links .nav-link');
        links.forEach(link => {
          const text = link.textContent.toLowerCase();
          const li = link.parentElement;
          if (!query || text.includes(query)) {
            li.style.display = '';
          } else {
            li.style.display = 'none';
          }
        });
      });
    }

    // Active sidebar link spy on scroll
    window.addEventListener('scroll', () => {
      const sections = document.querySelectorAll('main section');
      const scrollPos = window.scrollY + 120;

      sections.forEach(sec => {
        const id = sec.getAttribute('id');
        if (!id) return;
        const link = document.querySelector('.nav-links a[href="#' + id + '"]');
        if (link) {
          if (sec.offsetTop <= scrollPos && (sec.offsetTop + sec.offsetHeight) > scrollPos) {
            document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active'));
            link.classList.add('active');
          }
        }
      });
    });
  </script>
</body>
</html>
`;

// Write to docs/app-architecture-and-features.html and docs/index.html
fs.writeFileSync(path.join(__dirname, '../docs/app-architecture-and-features.html'), docContent, 'utf8');
fs.writeFileSync(path.join(__dirname, '../docs/index.html'), docContent, 'utf8');

// Also write a copy at the project root app-architecture-and-features.html
fs.writeFileSync(path.join(__dirname, '../app-architecture-and-features.html'), docContent, 'utf8');

console.log('HTML documentation files successfully generated with all SVG diagrams!');
