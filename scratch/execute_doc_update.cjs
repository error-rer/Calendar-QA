const fs = require('fs');
const path = require('path');

const enFile = path.join(__dirname, '../docs/app-architecture-and-features.html');
const thFile = path.join(__dirname, '../docs/app-architecture-and-features-th.html');

let en = fs.readFileSync(enFile, 'utf8');
let th = fs.readFileSync(thFile, 'utf8');

// --- 1. CSS UPDATES ---
const oldCssPills = `    /* Pills and Badges */
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
    }`;

const newCssPills = `    /* Pills and Badges */
    .pill {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 3px 9px;
      border-radius: 9999px;
      font-size: 11.5px;
      font-weight: 600;
      white-space: nowrap;
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
    .pill-purple {
      background: #f3e8ff;
      color: #6b21a8;
      border: 1px solid #d8b4fe;
    }
    .pill-orange {
      background: #ffedd5;
      color: #c2410c;
      border: 1px solid #fdba74;
    }
    .pill-muted {
      background: #f1f5f9;
      color: #475569;
      border: 1px solid #cbd5e1;
    }`;

if (!en.includes('.pill-purple') && en.includes(oldCssPills)) en = en.replace(oldCssPills, newCssPills);
if (!th.includes('.pill-purple') && th.includes(oldCssPills)) th = th.replace(oldCssPills, newCssPills);

// --- 2. SIDEBAR UPDATES ---
// EN Sidebar
const oldEnSidebar = `<div class="nav-group-title">Specifications</div>
      <ul class="nav-links">
        <li><a href="#api-spec" class="nav-link">REST API Endpoints</a></li>
        <li><a href="#site-normalization" class="nav-link">Multi-Site Normalization</a></li>
      </ul>`;

const newEnSidebar = `<div class="nav-group-title">Specifications &amp; Audit</div>
      <ul class="nav-links">
        <li><a href="#api-spec" class="nav-link">16. REST API Endpoints</a></li>
        <li><a href="#site-normalization" class="nav-link">17. Multi-Site Normalization</a></li>
        <li><a href="#feature-status-matrix" class="nav-link">18. Feature UI Status Matrix <span class="badge" style="background:#fef3c7;color:#b45309;">Audit</span></a></li>
      </ul>`;

if (!en.includes('18. Feature UI Status Matrix') && en.includes(oldEnSidebar)) {
  en = en.replace(oldEnSidebar, newEnSidebar);
}

// Add Compliance Lifecycle link to EN sidebar if missing
if (!en.includes('href="#compliance-lifecycle"')) {
  en = en.replace(
    '<li><a href="#master-order-architecture" class="nav-link">Universal Master-Order Engine</a></li>',
    `<li><a href="#master-order-architecture" class="nav-link">6. Universal Master-Order Engine</a></li>
        <li><a href="#compliance-lifecycle" class="nav-link">7. Compliance State Machine</a></li>`
  );
  en = en.replace('<li><a href="#system-architecture" class="nav-link">System Topology Diagram</a></li>', '<li><a href="#system-architecture" class="nav-link">3. System Topology Diagram</a></li>');
  en = en.replace('<li><a href="#data-lifecycle" class="nav-link">Data Flow & Persistence</a></li>', '<li><a href="#data-lifecycle" class="nav-link">4. Data Lifecycle & Persistence</a></li>');
  en = en.replace('<li><a href="#database-schema" class="nav-link">D1 SQLite Relational Schema</a></li>', '<li><a href="#database-schema" class="nav-link">5. D1 SQLite Relational Schema</a></li>');
  
  // Renumber Core Features in EN sidebar
  en = en.replace('<li><a href="#feature-schedule" class="nav-link">1. Timeline Calendar & Views</a></li>', '<li><a href="#feature-schedule" class="nav-link">8. Timeline Calendar & Views</a></li>');
  en = en.replace('<li><a href="#feature-validation" class="nav-link">2. Appointment Modal & Rules</a></li>', '<li><a href="#feature-validation" class="nav-link">9. Appointment Modal & Rules</a></li>');
  en = en.replace('<li><a href="#feature-results" class="nav-link">3. Audit Findings Recording</a></li>', '<li><a href="#feature-results" class="nav-link">10. Audit Findings Recording</a></li>');
  en = en.replace('<li><a href="#feature-table" class="nav-link">4. Dynamic Table View</a></li>', '<li><a href="#feature-table" class="nav-link">11. Dynamic Table View</a></li>');
  en = en.replace('<li><a href="#feature-summary" class="nav-link">5. KPI Executive Dashboard</a></li>', '<li><a href="#feature-summary" class="nav-link">12. KPI Executive Dashboard</a></li>');
  en = en.replace('<li><a href="#feature-engineers" class="nav-link">6. Manage Engineers & Options</a></li>', '<li><a href="#feature-engineers" class="nav-link">13. Manage Engineers & Options</a></li>');
  en = en.replace('<li><a href="#feature-activity" class="nav-link">7. Audit Trail & History Log</a></li>', '<li><a href="#feature-activity" class="nav-link">14. Audit Trail & History Log</a></li>');
  en = en.replace('<li><a href="#feature-sheets" class="nav-link">8. Google Sheets Cloud Sync</a></li>', '<li><a href="#feature-sheets" class="nav-link">15. Google Sheets Cloud Sync</a></li>');
}

// TH Sidebar
const oldThSidebar = `<div class="nav-group-title">ข้อกำหนดทางเทคนิค</div>
      <ul class="nav-links">
        <li><a href="#api-spec" class="nav-link">16. รายการ REST API Endpoints</a></li>
        <li><a href="#site-normalization" class="nav-link">17. การแปลงรหัสโรงงาน (Site Normalization)</a></li>
      </ul>`;

const newThSidebar = `<div class="nav-group-title">ข้อกำหนดทางเทคนิคและการตรวจสอบ</div>
      <ul class="nav-links">
        <li><a href="#api-spec" class="nav-link">16. รายการ REST API Endpoints</a></li>
        <li><a href="#site-normalization" class="nav-link">17. การแปลงรหัสโรงงาน (Site Normalization)</a></li>
        <li><a href="#feature-status-matrix" class="nav-link">18. ตารางสถานะฟังก์ชันบน UI <span class="badge" style="background:#fef3c7;color:#b45309;">Audit</span></a></li>
      </ul>`;

if (!th.includes('18. ตารางสถานะฟังก์ชันบน UI') && th.includes(oldThSidebar)) {
  th = th.replace(oldThSidebar, newThSidebar);
}


// --- 3. SECTIONS RENUMBERING IN EN CONTENT ---
// Extract compliance lifecycle SVG in EN and make it section 7
if (!en.includes('<section id="compliance-lifecycle">') && en.includes('<div class="diagram-title">Appointment Compliance Lifecycle State Machine</div>')) {
  const complianceSvgMatch = en.match(/(<div class="diagram-title">Appointment Compliance Lifecycle State Machine<\/div>[\s\S]*?<\/svg>\s*<\/div>)/);
  if (complianceSvgMatch) {
    const svgBlock = complianceSvgMatch[1];
    en = en.replace(svgBlock, '');
    
    const section7Html = `
      <!-- 7. Compliance Lifecycle Diagram -->
      <section id="compliance-lifecycle">
        <h2>7. Compliance Lifecycle State Machine</h2>
        <p>Architectural state machine diagram illustrating the complete appointment compliance lifecycle from draft creation through validation flagging, elapsed status, and defect resolution:</p>
        <div class="diagram-wrapper">
          ${svgBlock}
      </section>
`;
    en = en.replace('<section id="feature-schedule">', section7Html + '\n      <!-- FEATURE 1: Schedule Calendar -->\n      <section id="feature-schedule">');
  }
}

// Renumber H2 tags in EN content
en = en.replace('<h2>7. Feature Deep-Dive: Timeline Calendar &amp; Multi-Views</h2>', '<h2>8. Feature Deep-Dive: Timeline Calendar &amp; Multi-Views</h2>');
en = en.replace('<h2>8. Feature Deep-Dive: Appointment Modal &amp; Strict Validation</h2>', '<h2>9. Feature Deep-Dive: Appointment Modal &amp; Strict Validation</h2>');
en = en.replace('<h2>9. Feature Deep-Dive: Audit Findings Recording</h2>', '<h2>10. Feature Deep-Dive: Audit Findings Recording</h2>');
en = en.replace('<h2>10. Feature Deep-Dive: Dynamic Table View</h2>', '<h2>11. Feature Deep-Dive: Dynamic Table View</h2>');
en = en.replace('<h2>11. Feature Deep-Dive: Annual Summary Dashboard</h2>', '<h2>12. Feature Deep-Dive: Annual Summary Dashboard</h2>');
en = en.replace('<h2>12. Feature Deep-Dive: Engineer Roster &amp; Options Management</h2>', '<h2>13. Feature Deep-Dive: Engineer Roster &amp; Options Management</h2>');
en = en.replace('<h2>13. Feature Deep-Dive: Audit Trail &amp; Historical Log</h2>', '<h2>14. Feature Deep-Dive: Audit Trail &amp; Historical Log</h2>');
en = en.replace('<h2>14. Feature Deep-Dive: Real-Time Google Sheets Cloud Sync</h2>', '<h2>15. Feature Deep-Dive: Real-Time Google Sheets Cloud Sync</h2>');
en = en.replace('<h2>15. REST API Endpoint Specification</h2>', '<h2>16. REST API Endpoint Specification</h2>');
en = en.replace('<h2>16. Multi-Site Normalization &amp; Formatting</h2>', '<h2>17. Multi-Site Normalization &amp; Formatting</h2>');


// --- 4. SECTION 5 (DATABASE SCHEMA) UPDATES ---
// Replace EN Table
const oldEnD1Table = `<table class="spec-table">
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
          </table>`;

const newEnD1Table = `<table class="spec-table">
            <thead>
              <tr>
                <th style="width: 15%;">Table Name</th>
                <th style="width: 18%;">UI Exposure Status</th>
                <th style="width: 15%;">Primary Key</th>
                <th style="width: 18%;">Foreign Keys</th>
                <th style="width: 34%;">Key Columns &amp; Description</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><code>assignments</code></td>
                <td><span class="pill pill-green">Active in UI</span></td>
                <td><code>id</code> (UUID / Code)</td>
                <td><code>eng &rarr; engineers(id)</code><br><code>order_id &rarr; orders(id)</code></td>
                <td>
                  Denormalized schedule slot: <code>week</code>, <code>day</code>, <code>site1</code>, <code>site2</code>, <code>customer</code>, <code>end_customer</code>, <code>auditor1</code>, <code>auditor2</code>, <code>department</code>, <code>purpose</code>, <code>target_package</code>, <code>audit_category</code>, <code>results</code> (JSON stringified per-site findings), <code>created_at</code>, <code>updated_at</code>.
                </td>
              </tr>
              <tr>
                <td><code>orders</code></td>
                <td><span class="pill pill-blue">Backend-Only / Auto-Generated</span></td>
                <td><code>id</code></td>
                <td>None</td>
                <td>Parent appointment entity: <code>customer</code>, <code>product</code>, <code>plant</code>, <code>purpose</code>. Auto-created in background on appointment save; no standalone UI screen.</td>
              </tr>
              <tr>
                <td><code>engineers</code></td>
                <td><span class="pill pill-green">Active in UI</span></td>
                <td><code>id</code></td>
                <td>None</td>
                <td>Auditor roster: <code>name</code>, <code>role</code>, <code>department</code> (QA / Non-QA), <code>site</code> (default UTL1), <code>sub_departments</code> (JSON array: QMS, EHS, ESD). Managed in QMS Host tab.</td>
              </tr>
              <tr>
                <td><code>plants</code></td>
                <td><span class="pill pill-blue">Backend-Only / Legacy</span></td>
                <td><code>id</code></td>
                <td>None</td>
                <td>Plant / Sub-department divisions: <code>name</code>, <code>loc</code>, <code>code</code>, <code>color</code>. Retained in Worker DB; UI uses dynamic tag options.</td>
              </tr>
              <tr>
                <td><code>active_plants</code></td>
                <td><span class="pill pill-blue">Backend-Only / Legacy</span></td>
                <td><code>plant_id</code></td>
                <td><code>plant_id &rarr; plants(id)</code></td>
                <td>Visibility toggle flag (<code>active: 0|1</code>) for legacy calendar plant rows.</td>
              </tr>
              <tr>
                <td><code>options</code></td>
                <td><span class="pill pill-green">Active in UI</span></td>
                <td><code>category</code> + <code>value</code></td>
                <td>None</td>
                <td>
                  Dynamic tag registry for <code>site_code</code>, <code>customer_name</code>, <code>end_customer</code>, <code>department</code>, <code>purpose</code>, <code>target_package</code>, <code>audit_category</code>, plus custom ordering arrays stored under <code>_order_&lt;category&gt;</code>. Managed via Options tab.
                </td>
              </tr>
              <tr>
                <td><code>comments</code></td>
                <td><span class="pill pill-orange">Dormant / Unrendered in UI</span></td>
                <td><code>id</code></td>
                <td><code>assignment_id &rarr; assignments(id)</code></td>
                <td>Collaborative audit notes with author attribution and timestamp. Backend and table active, but UI drawer component (<code>DetailPanel.tsx</code>) is currently unmounted.</td>
              </tr>
              <tr>
                <td><code>activity</code></td>
                <td><span class="pill pill-green">Active in UI</span></td>
                <td><code>id</code></td>
                <td>None</td>
                <td>Immutable audit trail logging appointment creations, modifications, and deletions. Rendered in History tab.</td>
              </tr>
            </tbody>
          </table>

          <div class="callout warning">
            <strong>UI Exposure Audit Note:</strong>
            While the SQLite schema and Worker API fully support <code>comments</code> (notes thread) and <code>orders</code> (parent order entity), their user interface representations operate differently in the current release:
            <ul style="margin: 8px 0 0 18px;">
              <li><strong>Comments (Dormant in UI):</strong> The notes drawer component (<code>DetailPanel.tsx</code>) is currently unmounted from the main view hierarchy, making comments dormant in the UI.</li>
              <li><strong>Orders (Backend-Only):</strong> The <code>orders</code> records are created automatically in the background as containers for multi-day appointments without a dedicated frontend management view.</li>
            </ul>
          </div>`;

if (!en.includes('<th>UI Exposure Status</th>') && en.includes(oldEnD1Table)) {
  en = en.replace(oldEnD1Table, newEnD1Table);
}

// Replace TH Table
const oldThD1Table = `<table class="spec-table">
            <thead>
              <tr>
                <th>ชื่อตาราง (Table)</th>
                <th>คีย์หลัก (PK)</th>
                <th>คีย์นอก (FK)</th>
                <th>คำอธิบายโครงสร้างและคอลัมน์สำคัญ</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><code>assignments</code></td>
                <td><code>id</code></td>
                <td><code>eng &rarr; engineers(id)</code><br><code>order_id &rarr; orders(id)</code></td>
                <td>
                  ช่องตารางนัดหมายรายวัน: <code>week</code>, <code>day</code>, <code>site1</code>, <code>site2</code>, <code>customer</code>, <code>end_customer</code>, <code>auditor1</code>, <code>auditor2</code>, <code>department</code>, <code>purpose</code>, <code>target_package</code>, <code>audit_category</code>, <code>results</code> (บันทึกผลการตรวจแยกตามโรงงานในรูปแบบ JSON), <code>created_at</code>, <code>updated_at</code>
                </td>
              </tr>
              <tr>
                <td><code>orders</code></td>
                <td><code>id</code></td>
                <td>ไม่มี</td>
                <td>หัวข้องานตรวจประเมิน: <code>customer</code>, <code>product</code>, <code>plant</code>, <code>purpose</code></td>
              </tr>
              <tr>
                <td><code>engineers</code></td>
                <td><code>id</code></td>
                <td>ไม่มี</td>
                <td>ทะเบียนวิศวกรผู้ตรวจ: <code>name</code>, <code>role</code>, <code>department</code> (QA / Non-QA), <code>site</code> (โรงงานหลักเริ่มต้น UTL1), <code>sub_departments</code> (กลุ่มแผนก QMS, EHS, ESD)</td>
              </tr>
              <tr>
                <td><code>plants</code></td>
                <td><code>id</code></td>
                <td>ไม่มี</td>
                <td>กลุ่มสายงานตรวจ: <code>name</code>, <code>loc</code>, <code>code</code>, <code>color</code> (QMS=#2f6df0, EHS=#0f9d8c, ESD=#c2620c)</td>
              </tr>
              <tr>
                <td><code>active_plants</code></td>
                <td><code>plant_id</code></td>
                <td><code>plant_id &rarr; plants(id)</code></td>
                <td>สวิตช์เปิด/ปิดการแสดงแถวในปฏิทิน (<code>active: 0|1</code>)</td>
              </tr>
              <tr>
                <td><code>options</code></td>
                <td><code>category</code> + <code>value</code></td>
                <td>ไม่มี</td>
                <td>
                  ทะเบียนตัวเลือกส่วนกลาง: <code>site_code</code>, <code>customer_name</code>, <code>end_customer</code>, <code>department</code>, <code>purpose</code>, <code>target_package</code>, และบันทึกการจัดเรียงลำดับใน <code>_order_&lt;category&gt;</code>
                </td>
              </tr>
              <tr>
                <td><code>comments</code></td>
                <td><code>id</code></td>
                <td><code>assignment_id &rarr; assignments(id)</code></td>
                <td>ข้อความโน้ตและบันทึกการประสานงานภายในงานตรวจ</td>
              </tr>
              <tr>
                <td><code>activity</code></td>
                <td><code>id</code></td>
                <td>ไม่มี</td>
                <td>ประวัติการดำเนินงาน (Audit Trail) บันทึกทุกการสร้าง แก้ไข หรือลบข้อมูล พร้อมผู้ทำรายการและเวลา</td>
              </tr>
            </tbody>
          </table>`;

const newThD1Table = `<table class="spec-table">
            <thead>
              <tr>
                <th style="width: 15%;">ชื่อตาราง (Table)</th>
                <th style="width: 18%;">สถานะบน UI</th>
                <th style="width: 15%;">คีย์หลัก (PK)</th>
                <th style="width: 18%;">คีย์นอก (FK)</th>
                <th style="width: 34%;">คำอธิบายโครงสร้างและคอลัมน์สำคัญ</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><code>assignments</code></td>
                <td><span class="pill pill-green">Active in UI</span></td>
                <td><code>id</code></td>
                <td><code>eng &rarr; engineers(id)</code><br><code>order_id &rarr; orders(id)</code></td>
                <td>
                  ช่องตารางนัดหมายรายวัน: <code>week</code>, <code>day</code>, <code>site1</code>, <code>site2</code>, <code>customer</code>, <code>end_customer</code>, <code>auditor1</code>, <code>auditor2</code>, <code>department</code>, <code>purpose</code>, <code>target_package</code>, <code>audit_category</code>, <code>results</code> (บันทึกผลการตรวจแยกตามโรงงานในรูปแบบ JSON), <code>created_at</code>, <code>updated_at</code>
                </td>
              </tr>
              <tr>
                <td><code>orders</code></td>
                <td><span class="pill pill-blue">เฉพาะระบบหลังบ้าน (Backend-Only)</span></td>
                <td><code>id</code></td>
                <td>ไม่มี</td>
                <td>หัวข้องานตรวจประเมิน: <code>customer</code>, <code>product</code>, <code>plant</code>, <code>purpose</code> สร้างอัตโนมัติในพื้นหลัง ไม่มีหน้าจอแยกใน UI</td>
              </tr>
              <tr>
                <td><code>engineers</code></td>
                <td><span class="pill pill-green">Active in UI</span></td>
                <td><code>id</code></td>
                <td>ไม่มี</td>
                <td>ทะเบียนวิศวกรผู้ตรวจ: <code>name</code>, <code>role</code>, <code>department</code> (QA / Non-QA), <code>site</code> (โรงงานหลักเริ่มต้น UTL1), <code>sub_departments</code> (กลุ่มแผนก QMS, EHS, ESD) จัดการในแท็บ QMS Host</td>
              </tr>
              <tr>
                <td><code>plants</code></td>
                <td><span class="pill pill-blue">เฉพาะหลังบ้าน / เดิม (Legacy)</span></td>
                <td><code>id</code></td>
                <td>ไม่มี</td>
                <td>กลุ่มสายงานตรวจ: <code>name</code>, <code>loc</code>, <code>code</code>, <code>color</code> เก็บไว้ใน D1 แต่ UI ปัจจุบันจัดการผ่านแท็กตัวเลือกใน Options</td>
              </tr>
              <tr>
                <td><code>active_plants</code></td>
                <td><span class="pill pill-blue">เฉพาะหลังบ้าน / เดิม (Legacy)</span></td>
                <td><code>plant_id</code></td>
                <td><code>plant_id &rarr; plants(id)</code></td>
                <td>สวิตช์เปิด/ปิดการแสดงแถวในปฏิทินระบบเดิม (<code>active: 0|1</code>)</td>
              </tr>
              <tr>
                <td><code>options</code></td>
                <td><span class="pill pill-green">Active in UI</span></td>
                <td><code>category</code> + <code>value</code></td>
                <td>ไม่มี</td>
                <td>
                  ทะเบียนตัวเลือกส่วนกลาง: <code>site_code</code>, <code>customer_name</code>, <code>end_customer</code>, <code>department</code>, <code>purpose</code>, <code>target_package</code>, และบันทึกการจัดเรียงลำดับใน <code>_order_&lt;category&gt;</code> จัดการผ่านแท็บ Options
                </td>
              </tr>
              <tr>
                <td><code>comments</code></td>
                <td><span class="pill pill-orange">ไม่ได้แสดงผลใน UI (Dormant)</span></td>
                <td><code>id</code></td>
                <td><code>assignment_id &rarr; assignments(id)</code></td>
                <td>ข้อความโน้ตและบันทึกการประสานงานภายในงานตรวจ มีตารางและ API แต่คอมโพเนนต์ลิ้นชัก (<code>DetailPanel.tsx</code>) ยังไม่ได้ถูก Mount ใน UI</td>
              </tr>
              <tr>
                <td><code>activity</code></td>
                <td><span class="pill pill-green">Active in UI</span></td>
                <td><code>id</code></td>
                <td>ไม่มี</td>
                <td>ประวัติการดำเนินงาน (Audit Trail) บันทึกทุกการสร้าง แก้ไข หรือลบข้อมูล แสดงผลในแท็บประวัติการทำงาน (History)</td>
              </tr>
            </tbody>
          </table>

          <div class="callout warning">
            <strong>หมายเหตุการแสดงผลบนหน้าจอ (UI Exposure Audit):</strong>
            แม้ว่าโครงสร้าง D1 และ API จะรองรับตาราง <code>comments</code> และ <code>orders</code> อย่างสมบูรณ์ แต่การทำงานในหน้าจอ UI ปัจจุบันมีความแตกต่างดังนี้:
            <ul style="margin: 8px 0 0 18px;">
              <li><strong>ระบบโน้ต (Comments - Dormant in UI):</strong> คอมโพเนนต์ลิ้นชักบันทึกโน้ต (<code>DetailPanel.tsx</code>) ยังไม่ได้ถูกเชื่อมต่อแสดงผลในหน้าจอหลัก ทำให้ผู้ใช้ยังไม่เห็นช่องบันทึกความคิดเห็นในเวอร์ชันนี้</li>
              <li><strong>คำสั่งงาน (Orders - Backend-Only):</strong> ข้อมูลในตาราง <code>orders</code> ถูกสร้างขึ้นอัตโนมัติในพื้นหลังเพื่อเป็นตู้คอนเทนเนอร์เก็บการนัดหมาย โดยไม่มีหน้าจอสำหรับเปิดดูหรือจัดการ Orders แยกเดี่ยวใน UI</li>
            </ul>
          </div>`;

if (!th.includes('<th>สถานะบน UI</th>') && th.includes(oldThD1Table)) {
  th = th.replace(oldThD1Table, newThD1Table);
}


// --- 5. SECTION 9 (APPOINTMENT MODAL & VALIDATION) ---
const enValidationCallout = `          <div class="callout warning">
            <strong>Guided Keyboard Navigation Hint:</strong>
            To accelerate rapid administrative entry, the modal features a subtle, prominent keyboard navigation hint:
            <br>
            <code>Tab ⇥ Tip: Press Tab to navigate to the next field</code> (or Thai: <code>กด Tab เพื่อเลื่อนไปกรอกช่องถัดไป</code>), enabling auditors to cycle through all 8 fields in seconds without lifting their hands from the keyboard.
          </div>`;

const newEnValidationCallout = `          <div class="callout warning">
            <strong>Guided Keyboard Navigation Hint:</strong>
            To accelerate rapid administrative entry, the modal features a subtle, prominent keyboard navigation hint:
            <br>
            <code>Tab ⇥ Tip: Press Tab to navigate to the next field</code> (or Thai: <code>กด Tab เพื่อเลื่อนไปกรอกช่องถัดไป</code>), enabling auditors to cycle through all 8 fields in seconds without lifting their hands from the keyboard.
          </div>

          <!-- UI Visibility & Omission Audit -->
          <div class="grid-2" style="margin: 20px 0;">
            <div class="stat-box" style="border-left: 4px solid #d97706;">
              <div style="display:flex; align-items:center; gap:8px; margin-bottom:8px;">
                <span class="pill pill-yellow">Disabled in UI / Conditional</span>
                <strong style="font-size:13.5px;">Date Range Picker in Single-Day Edit Mode</strong>
              </div>
              <p style="font-size:12.5px; color:#64748b; margin:0;">
                When an appointment is split into single-day scope (<code>editScope === 'day'</code> &rarr; <code>isDateLocked = true</code>), the <code>dateFrom</code> and <code>dateTo</code> input fields are locked with <code>disabled={true}</code>, and the interactive <code>AvailabilityDatePicker</code> component is hidden behind a lock banner instructing users: <em>"Date range is locked for single-day editing. Choose 'Edit entire appointment' to adjust."</em>
              </p>
            </div>
            <div class="stat-box" style="border-left: 4px solid #6b21a8;">
              <div style="display:flex; align-items:center; gap:8px; margin-bottom:8px;">
                <span class="pill pill-purple">Omitted from UI Form</span>
                <strong style="font-size:13.5px;">Standalone Lead Auditor Field</strong>
              </div>
              <p style="font-size:12.5px; color:#64748b; margin:0;">
                The data schema (<code>Assignment.leadAuditor</code>) and completeness validator support a dedicated Lead Auditor property. However, in the modal form, this separate input is omitted; all audit hosts and lead auditors are managed via the consolidated <code>MultiAuditorSelect</code> selector (QMS Host / auditor1 / auditor2).
              </p>
            </div>
          </div>`;

if (!en.includes('Date Range Picker in Single-Day Edit Mode') && en.includes(enValidationCallout)) {
  en = en.replace(enValidationCallout, newEnValidationCallout);
}

const thValidationCallout = `          <div class="callout warning">
            <strong>คำใบ้คีย์บอร์ดนำทาง (Keyboard Shortcut Hint):</strong>
            เพื่อเพิ่มความรวดเร็วในการบันทึกข้อมูลหน้างาน ระบบมีป้ายแนะนำคีย์ลัด:
            <br>
            <code>Tab ⇥ Tip: กด Tab เพื่อเลื่อนไปกรอกช่องถัดไป (Press Tab to jump to the next field)</code> ช่วยให้ผู้ใช้งานสามารถเลื่อนกรอกได้ครบทั้ง 8 ช่องอย่างรวดเร็วโดยไม่ต้องยกมือออกจากแป้นพิมพ์
          </div>`;

const newThValidationCallout = `          <div class="callout warning">
            <strong>คำใบ้คีย์บอร์ดนำทาง (Keyboard Shortcut Hint):</strong>
            เพื่อเพิ่มความรวดเร็วในการบันทึกข้อมูลหน้างาน ระบบมีป้ายแนะนำคีย์ลัด:
            <br>
            <code>Tab ⇥ Tip: กด Tab เพื่อเลื่อนไปกรอกช่องถัดไป (Press Tab to jump to the next field)</code> ช่วยให้ผู้ใช้งานสามารถเลื่อนกรอกได้ครบทั้ง 8 ช่องอย่างรวดเร็วโดยไม่ต้องยกมือออกจากแป้นพิมพ์
          </div>

          <!-- UI Visibility & Omission Audit -->
          <div class="grid-2" style="margin: 20px 0;">
            <div class="stat-box" style="border-left: 4px solid #d97706;">
              <div style="display:flex; align-items:center; gap:8px; margin-bottom:8px;">
                <span class="pill pill-yellow">ปิดตามเงื่อนไข (Disabled in UI / Conditional)</span>
                <strong style="font-size:13.5px;">การล็อกช่องเลือกวันที่เมื่อแก้ไขแบบวันเดียว</strong>
              </div>
              <p style="font-size:12.5px; color:#64748b; margin:0;">
                เมื่อผู้ใช้เลือกแก้ไขเฉพาะวันใดวันหนึ่งของนัดหมายแบบหลายวัน (<code>isDateLocked = true</code>) ช่องกรอก <code>dateFrom</code> และ <code>dateTo</code> จะถูกล็อก (<code>disabled={true}</code>) และปฏิทิน <code>AvailabilityDatePicker</code> จะถูกซ่อน พร้อมแสดงแถบล็อกระบุ: <em>"Date range is locked for single-day editing. Choose 'Edit entire appointment' to adjust"</em>
              </p>
            </div>
            <div class="stat-box" style="border-left: 4px solid #6b21a8;">
              <div style="display:flex; align-items:center; gap:8px; margin-bottom:8px;">
                <span class="pill pill-purple">ไม่แสดงในฟอร์ม UI (Omitted from UI Form)</span>
                <strong style="font-size:13.5px;">ช่องกรอก Lead Auditor แยกเดี่ยว</strong>
              </div>
              <p style="font-size:12.5px; color:#64748b; margin:0;">
                สคีมาข้อมูล (<code>Assignment.leadAuditor</code>) รองรับหัวหน้าผู้ตรวจ แต่ในหน้าต่างแบบฟอร์มไม่ได้แยกช่องกรอก Lead Auditor ออกมาต่างหาก โดยถูกรวมไว้ในคอมโพเนนต์ <code>MultiAuditorSelect</code> (เลือก QMS Host และผู้ตรวจร่วม) แทน
              </p>
            </div>
          </div>`;

if (!th.includes('การล็อกช่องเลือกวันที่เมื่อแก้ไขแบบวันเดียว') && th.includes(thValidationCallout)) {
  th = th.replace(thValidationCallout, newThValidationCallout);
}


// --- 6. SECTION 13 (ENGINEERS & OPTIONS) ---
const enEngBlock = `              <h3>Options Tab (Universal Dynamic Ordering)</h3>
              <ul>
                <li><strong>Categories Managed:</strong> Sites, Customers, End Customers, Standards, Purposes, Target Packages, Departments.</li>
                <li><strong>Drag-and-Drop Reordering:</strong> Administrators can drag items to define custom presentation sequences.</li>
                <li><strong>Global Propagation:</strong> Automatically calls <code>PUT /api/options/reorder</code>, updates Cloudflare D1, and synchronizes the local snapshot instantly.</li>
              </ul>
            </div>
          </div>`;

const newEnEngBlock = `              <h3>Options Tab (Universal Dynamic Ordering)</h3>
              <ul>
                <li><strong>Categories Managed:</strong> Sites, Customers, End Customers, Standards, Purposes, Target Packages, Departments.</li>
                <li><strong>Drag-and-Drop Reordering:</strong> Administrators can drag items to define custom presentation sequences.</li>
                <li><strong>Global Propagation:</strong> Automatically calls <code>PUT /api/options/reorder</code>, updates Cloudflare D1, and synchronizes the local snapshot instantly.</li>
              </ul>
            </div>
          </div>

          <!-- UI Visibility & Omission Audit for Engineers & Plants -->
          <div class="grid-2" style="margin: 20px 0;">
            <div class="stat-box" style="border-left: 4px solid #6b21a8;">
              <div style="display:flex; align-items:center; gap:8px; margin-bottom:8px;">
                <span class="pill pill-purple">Omitted from UI Form</span>
                <strong style="font-size:13.5px;">Auditor <code>isMaster</code> Qualification Flag</strong>
              </div>
              <p style="font-size:12.5px; color:#64748b; margin:0;">
                The TypeScript data model (<code>Engineer.isMaster</code>) and scheduler filtering (<code>e.isMaster !== false</code>) support flagging master auditors. However, <code>EngineerModal.tsx</code> provides no UI checkbox or toggle for administrators; all auditors default to master eligibility in the frontend.
              </p>
            </div>
            <div class="stat-box" style="border-left: 4px solid #1d4ed8;">
              <div style="display:flex; align-items:center; gap:8px; margin-bottom:8px;">
                <span class="pill pill-blue">Backend-Only / Legacy</span>
                <strong style="font-size:13.5px;">Direct Plant Management &amp; Toggle API</strong>
              </div>
              <p style="font-size:12.5px; color:#64748b; margin:0;">
                The Cloudflare Worker exposes <code>/api/plants</code> and <code>/api/plants/:id/toggle</code>. However, the modern Admin UI manages manufacturing sites, departments, and audit scopes dynamically via custom tags in the Options tab (<code>options.sites</code>), bypassing the legacy plant toggle routes.
              </p>
            </div>
          </div>`;

if (!en.includes('Auditor <code>isMaster</code> Qualification Flag') && en.includes(enEngBlock)) {
  en = en.replace(enEngBlock, newEnEngBlock);
}

const thEngBlock = `              <h3>แท็บ Options (การจัดเรียงลำดับสากล)</h3>
              <ul>
                <li><strong>หมวดหมู่ที่จัดการ:</strong> Sites, Customers, End Customers, Standards, Purposes, Target Packages, Departments</li>
                <li><strong>ลากจัดลำดับได้อิสระ:</strong> ลากสลับตำแหน่งเพื่อกำหนดลำดับการแสดงผลในแอปพลิเคชัน</li>
                <li><strong>ส่งผลทั่วทั้งระบบทันที:</strong> ยิง API <code>PUT /api/options/reorder</code> บันทึกลง D1 และอัปเดต Local Snapshot ทันทีโดยไม่ต้องโหลดหน้าเว็บใหม่</li>
              </ul>
            </div>
          </div>`;

const newThEngBlock = `              <h3>แท็บ Options (การจัดเรียงลำดับสากล)</h3>
              <ul>
                <li><strong>หมวดหมู่ที่จัดการ:</strong> Sites, Customers, End Customers, Standards, Purposes, Target Packages, Departments</li>
                <li><strong>ลากจัดลำดับได้อิสระ:</strong> ลากสลับตำแหน่งเพื่อกำหนดลำดับการแสดงผลในแอปพลิเคชัน</li>
                <li><strong>ส่งผลทั่วทั้งระบบทันที:</strong> ยิง API <code>PUT /api/options/reorder</code> บันทึกลง D1 และอัปเดต Local Snapshot ทันทีโดยไม่ต้องโหลดหน้าเว็บใหม่</li>
              </ul>
            </div>
          </div>

          <!-- UI Visibility & Omission Audit for Engineers & Plants -->
          <div class="grid-2" style="margin: 20px 0;">
            <div class="stat-box" style="border-left: 4px solid #6b21a8;">
              <div style="display:flex; align-items:center; gap:8px; margin-bottom:8px;">
                <span class="pill pill-purple">ไม่แสดงในฟอร์ม UI (Omitted from UI Form)</span>
                <strong style="font-size:13.5px;">แฟล็กสิทธิ์ <code>isMaster</code> ของวิศวกรผู้ตรวจ</strong>
              </div>
              <p style="font-size:12.5px; color:#64748b; margin:0;">
                โครงสร้างข้อมูล (<code>Engineer.isMaster</code>) และตัวกรองระบบ (<code>e.isMaster !== false</code>) รองรับการระบุ Master Auditor แต่หน้าต่าง <code>EngineerModal.tsx</code> ไม่มีช่อง Checkbox ให้ผู้ดูแลระบบกดเลือก โดยระบบจะตั้งค่าเริ่มต้นเป็น Master ให้กับทุกคน
              </p>
            </div>
            <div class="stat-box" style="border-left: 4px solid #1d4ed8;">
              <div style="display:flex; align-items:center; gap:8px; margin-bottom:8px;">
                <span class="pill pill-blue">เฉพาะหลังบ้าน (Backend-Only / Legacy)</span>
                <strong style="font-size:13.5px;">API เปิดปิดสถานะโรงงานเดิม (Plants Toggle)</strong>
              </div>
              <p style="font-size:12.5px; color:#64748b; margin:0;">
                Cloudflare Worker มี Endpoint <code>/api/plants</code> และ <code>/api/plants/:id/toggle</code> แต่ใน UI ปัจจุบัน การจัดการโรงงาน แผนก และขอบเขตงานทั้งหมดถูกควบคุมผ่านแท็กไดนามิกในแถบ Options โดยตรง ไม่ได้เรียกใช้ Endpoint เดิมนี้
              </p>
            </div>
          </div>`;

if (!th.includes('แฟล็กสิทธิ์ <code>isMaster</code>') && th.includes(thEngBlock)) {
  th = th.replace(thEngBlock, newThEngBlock);
}


// --- 7. SECTION 15 (GOOGLE SHEETS SYNC) ---
const oldEnSheetsHeader = `<div class="card-header-flex">
            <div class="card-title">🔄 Google Workspace Cloud Bridge (<code>worker/index.ts</code>)</div>
            <span class="pill pill-green">Integration</span>
          </div>`;

const newEnSheetsHeader = `<div class="card-header-flex">
            <div class="card-title">🔄 Google Workspace Cloud Bridge (<code>worker/index.ts</code>)</div>
            <span class="pill pill-blue">Backend-Only / Webhook Service</span>
          </div>

          <div class="callout info">
            <strong>Headless Cloud Integration:</strong>
            The Google Sheets synchronization engine executes directly on Cloudflare Workers and triggers via Google Apps Script webhooks (configured via environment variable <code>GOOGLE_SHEETS_WEBHOOK_URL</code>). It operates as a serverless background bridge without requiring an in-app configuration screen or manual sync button in the standard user views.
          </div>`;

if (!en.includes('Headless Cloud Integration:') && en.includes(oldEnSheetsHeader)) {
  en = en.replace(oldEnSheetsHeader, newEnSheetsHeader);
}

const oldThSheetsHeader = `<div class="card-header-flex">
            <div class="card-title">🔄 การเชื่อมต่อคลาวด์กับ Google Workspace (<code>worker/index.ts</code>)</div>
            <span class="pill pill-green">Integration</span>
          </div>`;

const newThSheetsHeader = `<div class="card-header-flex">
            <div class="card-title">🔄 การเชื่อมต่อคลาวด์กับ Google Workspace (<code>worker/index.ts</code>)</div>
            <span class="pill pill-blue">เฉพาะระบบหลังบ้าน (Backend-Only)</span>
          </div>

          <div class="callout info">
            <strong>การทำงานแบบ Cloud-to-Cloud Service:</strong>
            ระบบซิงค์ Google Sheets ทำงานโดยตรงบน Cloudflare Worker และส่งข้อมูลผ่าน Google Apps Script Webhooks (กำหนดค่าผ่านตัวแปรสภาพแวดล้อม <code>GOOGLE_SHEETS_WEBHOOK_URL</code>) ทำหน้าที่เป็นสะพานเชื่อมต่อหลังบ้านโดยไม่ต้องมีหน้าจอตั้งค่าคอนฟิกหรือปุ่มซิงค์บนหน้าเว็บหลัก
          </div>`;

if (!th.includes('การทำงานแบบ Cloud-to-Cloud Service:') && th.includes(oldThSheetsHeader)) {
  th = th.replace(oldThSheetsHeader, newThSheetsHeader);
}


// --- 8. SECTION 16 (REST API SPEC) ---
const oldEnApiTable = `<table class="spec-table">
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
          </table>`;

const newEnApiTable = `<table class="spec-table">
            <thead>
              <tr>
                <th style="width: 24%;">Method &amp; Route</th>
                <th style="width: 18%;">UI Exposure Status</th>
                <th style="width: 20%;">Payload / Query</th>
                <th style="width: 38%;">Description &amp; Effect</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><code>GET /api/state</code></td>
                <td><span class="pill pill-green">Active in UI</span></td>
                <td>None</td>
                <td>Returns complete application state: engineers, plants, orders, assignments, comments, activity log, and sorted options.</td>
              </tr>
              <tr>
                <td><code>POST /api/assignments</code></td>
                <td><span class="pill pill-green">Active in UI</span></td>
                <td>Assignment JSON</td>
                <td>Creates appointment slot in <code>assignments</code> table and records an audit log entry in <code>activity</code>.</td>
              </tr>
              <tr>
                <td><code>PUT /api/assignments/:id</code></td>
                <td><span class="pill pill-green">Active in UI</span></td>
                <td>Updated Fields JSON</td>
                <td>Updates appointment fields, results, or notes, tracking modifications with timestamps.</td>
              </tr>
              <tr>
                <td><code>DELETE /api/assignments/:id</code></td>
                <td><span class="pill pill-green">Active in UI</span></td>
                <td>None</td>
                <td>Cascades deletion of associated day slots, related orders, and prunes unused customer options.</td>
              </tr>
              <tr>
                <td><code>GET, POST, PUT, DEL<br>/api/engineers</code></td>
                <td><span class="pill pill-green">Active in UI</span></td>
                <td>Engineer Profile JSON</td>
                <td>CRUD management of audit personnel and qualification tags via the QMS Host tab.</td>
              </tr>
              <tr>
                <td><code>POST, DELETE<br>/api/options</code></td>
                <td><span class="pill pill-green">Active in UI</span></td>
                <td><code>{ category, value, meta }</code></td>
                <td>Adds or removes dynamic tags for sites, customers, standards, and departments in the Options tab.</td>
              </tr>
              <tr>
                <td><code>PUT /api/options/reorder</code></td>
                <td><span class="pill pill-green">Active in UI</span></td>
                <td><code>{ category, order: string[] }</code></td>
                <td>Saves custom sequence under <code>_order_&lt;category&gt;</code> in D1, dynamically reordering all UI elements.</td>
              </tr>
              <tr>
                <td><code>POST /api/activity</code></td>
                <td><span class="pill pill-green">Active in UI</span></td>
                <td>Activity Event JSON</td>
                <td>Appends audit trail records displayed in the History tab.</td>
              </tr>
              <tr>
                <td><code>GET, POST, DEL<br>/api/orders</code></td>
                <td><span class="pill pill-blue">Backend-Only / API Only</span></td>
                <td>Order JSON</td>
                <td>Background appointment grouping container. Created implicitly during appointment creation; no separate UI.</td>
              </tr>
              <tr>
                <td><code>GET, POST, DEL<br>/api/plants</code></td>
                <td><span class="pill pill-blue">Backend-Only / Legacy</span></td>
                <td>Plant JSON</td>
                <td>Legacy plant CRUD routes. Modern frontend manages plants dynamically via Options tags.</td>
              </tr>
              <tr>
                <td><code>POST /api/plants/:id/toggle</code></td>
                <td><span class="pill pill-blue">Backend-Only / Legacy</span></td>
                <td>None</td>
                <td>Toggles plant visibility in legacy schemas. Unused by the modern Options management UI.</td>
              </tr>
              <tr>
                <td><code>POST, DELETE<br>/api/comments</code></td>
                <td><span class="pill pill-orange">Dormant / Unrendered in UI</span></td>
                <td><code>{ assignmentId, text, author }</code></td>
                <td>Creates or removes collaborative notes. Endpoints operational, but frontend drawer (<code>DetailPanel.tsx</code>) is unmounted.</td>
              </tr>
              <tr>
                <td><code>GET, POST<br>/api/google-sheets/config</code></td>
                <td><span class="pill pill-blue">Backend-Only / API Only</span></td>
                <td><code>{ webhookUrl }</code></td>
                <td>Retrieves or sets webhook URL in D1 options. In production, driven via Cloudflare Worker environment variables.</td>
              </tr>
              <tr>
                <td><code>POST /api/google-sheets/sync</code></td>
                <td><span class="pill pill-blue">Backend-Only / Webhook</span></td>
                <td><code>{ action: 'sync_all' | 'sync_one' }</code></td>
                <td>Dispatches structured rows to the Google Apps Script webhook endpoint without requiring frontend UI interaction.</td>
              </tr>
            </tbody>
          </table>`;

if (!en.includes('<th>UI Exposure Status</th>') && en.includes(oldEnApiTable)) {
  en = en.replace(oldEnApiTable, newEnApiTable);
}

const oldThApiTable = `<table class="spec-table">
            <thead>
              <tr>
                <th>Method &amp; Route</th>
                <th>ข้อมูลที่ส่ง (Payload)</th>
                <th>หน้าที่และผลลัพธ์การทำงาน</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><code>GET /api/state</code></td>
                <td>ไม่มี</td>
                <td>ส่งคืนสถานะระบบทั้งหมด: วิศวกร, โรงงาน, คำขอนัดหมาย, ผลตรวจ, โน้ต, ประวัติกิจกรรม และตัวเลือกที่จัดเรียงแล้ว</td>
              </tr>
              <tr>
                <td><code>POST /api/assignments</code></td>
                <td>JSON ของนัดหมาย</td>
                <td>สร้างรายการในตาราง <code>assignments</code> และบันทึกประวัติลง <code>activity</code></td>
              </tr>
              <tr>
                <td><code>PUT /api/assignments/:id</code></td>
                <td>JSON ข้อมูลที่แก้ไข</td>
                <td>อัปเดตข้อมูลนัดหมายหรือผลการตรวจ พร้อมบันทึกเวลาอัปเดต</td>
              </tr>
              <tr>
                <td><code>DELETE /api/assignments/:id</code></td>
                <td>ไม่มี</td>
                <td>ลบนัดหมายและวันตรวจที่เกี่ยวข้องแบบ Cascade พร้อมทำความสะอาดตัวเลือกลูกค้าที่ไม่ได้ใช้งาน</td>
              </tr>
              <tr>
                <td><code>PUT /api/options/reorder</code></td>
                <td><code>{ category, order: string[] }</code></td>
                <td>บันทึกลำดับใหม่ลงใน <code>_order_&lt;category&gt;</code> ของ D1 และอัปเดตการแสดงผลทันที</td>
              </tr>
              <tr>
                <td><code>POST /api/google-sheets/sync</code></td>
                <td><code>{ action: 'sync_all' | 'sync_one', ... }</code></td>
                <td>ส่งข้อมูลแถวตารางไปยัง Google Apps Script Webhook เพื่ออัปเดต Google Sheet</td>
              </tr>
            </tbody>
          </table>`;

const newThApiTable = `<table class="spec-table">
            <thead>
              <tr>
                <th style="width: 24%;">Method &amp; Route</th>
                <th style="width: 18%;">สถานะบน UI</th>
                <th style="width: 20%;">ข้อมูลที่ส่ง (Payload)</th>
                <th style="width: 38%;">หน้าที่และผลลัพธ์การทำงาน</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><code>GET /api/state</code></td>
                <td><span class="pill pill-green">Active in UI</span></td>
                <td>ไม่มี</td>
                <td>ส่งคืนสถานะระบบทั้งหมด: วิศวกร, โรงงาน, คำขอนัดหมาย, ผลตรวจ, โน้ต, ประวัติกิจกรรม และตัวเลือกที่จัดเรียงแล้ว</td>
              </tr>
              <tr>
                <td><code>POST /api/assignments</code></td>
                <td><span class="pill pill-green">Active in UI</span></td>
                <td>JSON ของนัดหมาย</td>
                <td>สร้างรายการในตาราง <code>assignments</code> และบันทึกประวัติลง <code>activity</code></td>
              </tr>
              <tr>
                <td><code>PUT /api/assignments/:id</code></td>
                <td><span class="pill pill-green">Active in UI</span></td>
                <td>JSON ข้อมูลที่แก้ไข</td>
                <td>อัปเดตข้อมูลนัดหมายหรือผลการตรวจ พร้อมบันทึกเวลาอัปเดต</td>
              </tr>
              <tr>
                <td><code>DELETE /api/assignments/:id</code></td>
                <td><span class="pill pill-green">Active in UI</span></td>
                <td>ไม่มี</td>
                <td>ลบนัดหมายและวันตรวจที่เกี่ยวข้องแบบ Cascade พร้อมทำความสะอาดตัวเลือกลูกค้าที่ไม่ได้ใช้งาน</td>
              </tr>
              <tr>
                <td><code>GET, POST, PUT, DEL<br>/api/engineers</code></td>
                <td><span class="pill pill-green">Active in UI</span></td>
                <td>JSON ทะเบียนวิศวกร</td>
                <td>จัดการข้อมูลผู้ตรวจประเมิน สังกัดแผนก และคุณสมบัติ ผ่านหน้าจัดการ QMS Host</td>
              </tr>
              <tr>
                <td><code>POST, DELETE<br>/api/options</code></td>
                <td><span class="pill pill-green">Active in UI</span></td>
                <td><code>{ category, value, meta }</code></td>
                <td>เพิ่มหรือลบแท็กตัวเลือก Sites, Customers, Standards และ Departments ในแท็บ Options</td>
              </tr>
              <tr>
                <td><code>PUT /api/options/reorder</code></td>
                <td><span class="pill pill-green">Active in UI</span></td>
                <td><code>{ category, order: string[] }</code></td>
                <td>บันทึกลำดับใหม่ลงใน <code>_order_&lt;category&gt;</code> ของ D1 และอัปเดตการแสดงผลทันที</td>
              </tr>
              <tr>
                <td><code>POST /api/activity</code></td>
                <td><span class="pill pill-green">Active in UI</span></td>
                <td>JSON บันทึกกิจกรรม</td>
                <td>บันทึกประวัติการทำงานเพื่อนำไปแสดงผลในแท็บประวัติการทำงาน (History)</td>
              </tr>
              <tr>
                <td><code>GET, POST, DEL<br>/api/orders</code></td>
                <td><span class="pill pill-blue">เฉพาะระบบหลังบ้าน</span></td>
                <td>JSON ของ Order</td>
                <td>ตู้เก็บรหัสงานนัดหมาย สร้างขึ้นอัตโนมัติในพื้นหลังขณะบันทึกนัดหมาย ไม่มีหน้าจอใน UI</td>
              </tr>
              <tr>
                <td><code>GET, POST, DEL<br>/api/plants</code></td>
                <td><span class="pill pill-blue">เฉพาะหลังบ้าน / เดิม</span></td>
                <td>JSON ของ Plant</td>
                <td>API จัดการสายงานเดิม ระบบปัจจุบันจัดการผ่านแท็กไดนามิกใน Options แทน</td>
              </tr>
              <tr>
                <td><code>POST /api/plants/:id/toggle</code></td>
                <td><span class="pill pill-blue">เฉพาะหลังบ้าน / เดิม</span></td>
                <td>ไม่มี</td>
                <td>สลับสถานะแถวปฏิทินระบบเดิม ปัจจุบัน UI ไม่ได้เรียกใช้งาน</td>
              </tr>
              <tr>
                <td><code>POST, DELETE<br>/api/comments</code></td>
                <td><span class="pill pill-orange">ไม่ได้แสดงผลใน UI</span></td>
                <td><code>{ assignmentId, text, author }</code></td>
                <td>สร้างหรือลบข้อความโน้ต API ใช้งานได้สมบูรณ์ แต่คอมโพเนนต์ลิ้นชัก (<code>DetailPanel.tsx</code>) ยังไม่ได้ถูก Mount</td>
              </tr>
              <tr>
                <td><code>GET, POST<br>/api/google-sheets/config</code></td>
                <td><span class="pill pill-blue">เฉพาะระบบหลังบ้าน</span></td>
                <td><code>{ webhookUrl }</code></td>
                <td>ดึงหรือตั้งค่า Webhook URL ใน D1 ในระบบจริงควบคุมผ่าน Environment Variable ของ Cloudflare Worker</td>
              </tr>
              <tr>
                <td><code>POST /api/google-sheets/sync</code></td>
                <td><span class="pill pill-blue">เฉพาะระบบหลังบ้าน / Webhook</span></td>
                <td><code>{ action: 'sync_all' | 'sync_one' }</code></td>
                <td>ส่งข้อมูลแถวตารางไปยัง Google Apps Script Webhook เพื่ออัปเดต Google Sheet โดยตรง</td>
              </tr>
            </tbody>
          </table>`;

if (!th.includes('<th>สถานะบน UI</th>') && th.includes(oldThApiTable)) {
  th = th.replace(oldThApiTable, newThApiTable);
}


// --- 9. SECTION 17 (MULTI-SITE NORMALIZATION) ---
const oldEnNormTable = `<table class="spec-table">
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
          </table>`;

const newEnNormTable = `<table class="spec-table">
            <thead>
              <tr>
                <th style="width: 25%;">Input Site String</th>
                <th style="width: 25%;">Normalized Site Code</th>
                <th style="width: 25%;">UI Selection Availability</th>
                <th style="width: 25%;">Canonical Sort Priority</th>
              </tr>
            </thead>
            <tbody>
              <tr><td><code>U1</code></td><td><code>UTL1</code></td><td><span class="pill pill-red">Legacy / Filtered from UI</span></td><td>1</td></tr>
              <tr><td><code>UTL1</code></td><td><code>UTL1</code></td><td><span class="pill pill-green">Active in UI</span></td><td>1</td></tr>
              <tr><td><code>U2</code></td><td><code>UTL2</code></td><td><span class="pill pill-red">Legacy / Filtered from UI</span></td><td>2</td></tr>
              <tr><td><code>UTL2</code></td><td><code>UTL2</code></td><td><span class="pill pill-green">Active in UI</span></td><td>2</td></tr>
              <tr><td><code>U2A</code></td><td><code>UTL2A</code></td><td><span class="pill pill-red">Legacy / Filtered from UI</span></td><td>3</td></tr>
              <tr><td><code>UTL2A</code></td><td><code>UTL2A</code></td><td><span class="pill pill-green">Active in UI</span></td><td>3</td></tr>
              <tr><td><code>U2B</code></td><td><code>UTL2B</code></td><td><span class="pill pill-red">Legacy / Filtered from UI</span></td><td>4</td></tr>
              <tr><td><code>UTL2B</code></td><td><code>UTL2B</code></td><td><span class="pill pill-green">Active in UI</span></td><td>4</td></tr>
              <tr><td><code>U3</code></td><td><code>UTL3</code></td><td><span class="pill pill-red">Legacy / Filtered from UI</span></td><td>5</td></tr>
              <tr><td><code>UTL3</code></td><td><code>UTL3</code></td><td><span class="pill pill-green">Active in UI</span></td><td>5</td></tr>
              <tr><td><code>U3A</code></td><td><code>UTL3A</code></td><td><span class="pill pill-red">Legacy / Filtered from UI</span></td><td>6</td></tr>
              <tr><td><code>UTL3A</code></td><td><code>UTL3A</code></td><td><span class="pill pill-green">Active in UI</span></td><td>6</td></tr>
              <tr><td><code>U3B</code></td><td><code>UTL3B</code></td><td><span class="pill pill-red">Legacy / Filtered from UI</span></td><td>7</td></tr>
              <tr><td><code>UTL3B</code></td><td><code>UTL3B</code></td><td><span class="pill pill-green">Active in UI</span></td><td>7</td></tr>
              <tr><td><code>U3T</code></td><td><code>UTL3T</code></td><td><span class="pill pill-red">Legacy / Filtered from UI</span></td><td>8</td></tr>
              <tr><td><code>UTL3T</code></td><td><code>UTL3T</code></td><td><span class="pill pill-green">Active in UI</span></td><td>8</td></tr>
            </tbody>
          </table>

          <div class="callout warning">
            <strong>Dropdown Selection Rule:</strong>
            The modern UI dropdown selectors and Options tag manager exclusively present canonical <code>UTL*</code> options (<code>UTL1</code>, <code>UTL2</code>, <code>UTL3</code>, <code>UTL4</code>). Legacy codes without the <code>TL</code> prefix (e.g. <code>U1</code>, <code>U2</code>, <code>U3</code>) are only recognized by the normalization engine during external CSV imports or backward-compatibility reads; they are filtered out from user-facing dropdown menus.
          </div>`;

if (!en.includes('<th>UI Selection Availability</th>') && en.includes(oldEnNormTable)) {
  en = en.replace(oldEnNormTable, newEnNormTable);
}

const oldThNormTable = `<table class="spec-table">
            <thead>
              <tr>
                <th>ข้อความโรงงานขาเข้า</th>
                <th>รหัสมาตรฐานที่แปลงได้</th>
                <th>ลำดับความสำคัญในการเรียง</th>
              </tr>
            </thead>
            <tbody>
              <tr><td><code>U1</code> หรือ <code>UTL1</code></td><td><code>UTL1</code></td><td>1</td></tr>
              <tr><td><code>U2</code> หรือ <code>UTL2</code></td><td><code>UTL2</code></td><td>2</td></tr>
              <tr><td><code>U2A</code> หรือ <code>UTL2A</code></td><td><code>UTL2A</code></td><td>3</td></tr>
              <tr><td><code>U2B</code> หรือ <code>UTL2B</code></td><td><code>UTL2B</code></td><td>4</td></tr>
              <tr><td><code>U3</code> หรือ <code>UTL3</code></td><td><code>UTL3</code></td><td>5</td></tr>
              <tr><td><code>U3A</code> หรือ <code>UTL3A</code></td><td><code>UTL3A</code></td><td>6</td></tr>
              <tr><td><code>U3B</code> หรือ <code>UTL3B</code></td><td><code>UTL3B</code></td><td>7</td></tr>
              <tr><td><code>U3T</code> หรือ <code>UTL3T</code></td><td><code>UTL3T</code></td><td>8</td></tr>
            </tbody>
          </table>`;

const newThNormTable = `<table class="spec-table">
            <thead>
              <tr>
                <th style="width: 25%;">ข้อความโรงงานขาเข้า</th>
                <th style="width: 25%;">รหัสมาตรฐานที่แปลงได้</th>
                <th style="width: 25%;">การแสดงผลในเมนูดรอปดาวน์ UI</th>
                <th style="width: 25%;">ลำดับความสำคัญในการเรียง</th>
              </tr>
            </thead>
            <tbody>
              <tr><td><code>U1</code></td><td><code>UTL1</code></td><td><span class="pill pill-red">ระบบเดิม / ซ่อนจาก UI</span></td><td>1</td></tr>
              <tr><td><code>UTL1</code></td><td><code>UTL1</code></td><td><span class="pill pill-green">Active in UI</span></td><td>1</td></tr>
              <tr><td><code>U2</code></td><td><code>UTL2</code></td><td><span class="pill pill-red">ระบบเดิม / ซ่อนจาก UI</span></td><td>2</td></tr>
              <tr><td><code>UTL2</code></td><td><code>UTL2</code></td><td><span class="pill pill-green">Active in UI</span></td><td>2</td></tr>
              <tr><td><code>U2A</code></td><td><code>UTL2A</code></td><td><span class="pill pill-red">ระบบเดิม / ซ่อนจาก UI</span></td><td>3</td></tr>
              <tr><td><code>UTL2A</code></td><td><code>UTL2A</code></td><td><span class="pill pill-green">Active in UI</span></td><td>3</td></tr>
              <tr><td><code>U2B</code></td><td><code>UTL2B</code></td><td><span class="pill pill-red">ระบบเดิม / ซ่อนจาก UI</span></td><td>4</td></tr>
              <tr><td><code>UTL2B</code></td><td><code>UTL2B</code></td><td><span class="pill pill-green">Active in UI</span></td><td>4</td></tr>
              <tr><td><code>U3</code></td><td><code>UTL3</code></td><td><span class="pill pill-red">ระบบเดิม / ซ่อนจาก UI</span></td><td>5</td></tr>
              <tr><td><code>UTL3</code></td><td><code>UTL3</code></td><td><span class="pill pill-green">Active in UI</span></td><td>5</td></tr>
              <tr><td><code>U3A</code></td><td><code>UTL3A</code></td><td><span class="pill pill-red">ระบบเดิม / ซ่อนจาก UI</span></td><td>6</td></tr>
              <tr><td><code>UTL3A</code></td><td><code>UTL3A</code></td><td><span class="pill pill-green">Active in UI</span></td><td>6</td></tr>
              <tr><td><code>U3B</code></td><td><code>UTL3B</code></td><td><span class="pill pill-red">ระบบเดิม / ซ่อนจาก UI</span></td><td>7</td></tr>
              <tr><td><code>UTL3B</code></td><td><code>UTL3B</code></td><td><span class="pill pill-green">Active in UI</span></td><td>7</td></tr>
              <tr><td><code>U3T</code></td><td><code>UTL3T</code></td><td><span class="pill pill-red">ระบบเดิม / ซ่อนจาก UI</span></td><td>8</td></tr>
              <tr><td><code>UTL3T</code></td><td><code>UTL3T</code></td><td><span class="pill pill-green">Active in UI</span></td><td>8</td></tr>
            </tbody>
          </table>

          <div class="callout warning">
            <strong>กฎการแสดงผลในดรอปดาวน์:</strong>
            เมนูเลือกโรงงานและแท็บจัดการ Options ใน UI ปัจจุบัน จะแสดงเฉพาะรหัสมาตรฐานที่ขึ้นต้นด้วย <code>UTL*</code> (เช่น <code>UTL1</code>, <code>UTL2</code>, <code>UTL3</code>, <code>UTL4</code>) เท่านั้น ส่วนรหัสแบบเก่าที่ไม่มีตัวอักษร <code>TL</code> (เช่น <code>U1</code>, <code>U2</code>, <code>U3</code>) จะถูกใช้เฉพาะขั้นตอนการแปลงข้อมูลย้อนหลังหรือนำเข้าไฟล์ CSV ในหลังบ้าน และถูกซ่อนไม่ให้ปรากฏในเมนูดรอปดาวน์ของผู้ใช้ทั่วไป
          </div>`;

if (!th.includes('<th>การแสดงผลในเมนูดรอปดาวน์ UI</th>') && th.includes(oldThNormTable)) {
  th = th.replace(oldThNormTable, newThNormTable);
}


// --- 10. SECTION 18 (COMPREHENSIVE FEATURE INVENTORY & UI STATUS MATRIX) ---
const enSection18Html = `
      <!-- 18. Comprehensive Feature Inventory & UI Status -->
      <section id="feature-status-matrix">
        <h2>18. Comprehensive Feature Inventory &amp; UI Status Matrix</h2>
        <p>
          This section provides an exhaustive technical audit of all features, capabilities, endpoints, and data fields in the UTAC QA Calendar codebase, explicitly classifying their operational availability in the frontend User Interface (UI):
        </p>

        <!-- Status Legend -->
        <div class="grid-3" style="margin-bottom: 24px;">
          <div class="stat-box" style="border-left: 4px solid #16a34a;">
            <div style="display:flex; align-items:center; gap:8px; margin-bottom:8px;">
              <span class="pill pill-green">Active in UI</span>
            </div>
            <div class="stat-desc">Fully accessible, interactive, and actively rendered in the main web UI navigation and views.</div>
          </div>
          <div class="stat-box" style="border-left: 4px solid #d97706;">
            <div style="display:flex; align-items:center; gap:8px; margin-bottom:8px;">
              <span class="pill pill-yellow">Disabled in UI / Conditional</span>
            </div>
            <div class="stat-desc">Rendered in the UI component tree but locked, disabled, or hidden under specific workflows (e.g. single-day edit mode).</div>
          </div>
          <div class="stat-box" style="border-left: 4px solid #c2410c;">
            <div style="display:flex; align-items:center; gap:8px; margin-bottom:8px;">
              <span class="pill pill-orange">Dormant / Unrendered in UI</span>
            </div>
            <div class="stat-desc">Code, data model, and API fully written and functional, but the component is not currently mounted or exposed in the UI.</div>
          </div>
          <div class="stat-box" style="border-left: 4px solid #1d4ed8;">
            <div style="display:flex; align-items:center; gap:8px; margin-bottom:8px;">
              <span class="pill pill-blue">Backend-Only / API Service</span>
            </div>
            <div class="stat-desc">Cloudflare Worker API or database logic executed via webhook/API/background without a dedicated frontend screen.</div>
          </div>
          <div class="stat-box" style="border-left: 4px solid #6b21a8;">
            <div style="display:flex; align-items:center; gap:8px; margin-bottom:8px;">
              <span class="pill pill-purple">Omitted from UI Form</span>
            </div>
            <div class="stat-desc">Property exists in database schema and validator logic, but omitted from user-facing modal dialogs or forms.</div>
          </div>
          <div class="stat-box" style="border-left: 4px solid #dc2626;">
            <div style="display:flex; align-items:center; gap:8px; margin-bottom:8px;">
              <span class="pill pill-red">Legacy / Filtered from UI</span>
            </div>
            <div class="stat-desc">Maintained strictly for backward compatibility with older database records; hidden from UI dropdown options.</div>
          </div>
        </div>

        <table class="spec-table">
          <thead>
            <tr>
              <th style="width: 22%;">Feature / Capability</th>
              <th style="width: 20%;">Code Location &amp; Artifact</th>
              <th style="width: 18%;">UI Status</th>
              <th style="width: 40%;">Description &amp; Operational Rationale</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Interactive Timeline Calendar</strong></td>
              <td><code>src/components/Schedule.tsx</code></td>
              <td><span class="pill pill-green">Active in UI</span></td>
              <td>Full 365-day horizontal timeline grid with 6-way grouping, zoom controls, and floating anchored tooltips.</td>
            </tr>
            <tr>
              <td><strong>Customer Audit Modal Form</strong></td>
              <td><code>src/components/AppointmentFormFields.tsx</code></td>
              <td><span class="pill pill-green">Active in UI</span></td>
              <td>Interactive creation/editing strictly validating all 8 mandatory fields with red incompleteness banners.</td>
            </tr>
            <tr>
              <td><strong>Internal Audit Modal Form</strong></td>
              <td><code>src/components/AppointmentFormFields.tsx</code></td>
              <td><span class="pill pill-green">Active in UI</span></td>
              <td>Internal Audit workflow enforcing all 6 fields: Standard, Site, Audit Category, Area, QMS Host, and Date Range.</td>
            </tr>
            <tr>
              <td><strong>Date Range Picker in Single-Day Edit</strong></td>
              <td><code>AppointmentFormFields.tsx</code> (<code>isDateLocked</code>)</td>
              <td><span class="pill pill-yellow">Disabled in UI / Conditional</span></td>
              <td>When an appointment is split into single-day scope, the Date inputs are disabled (<code>disabled={true}</code>) and <code>AvailabilityDatePicker</code> is hidden behind a lock banner instructing users to choose "Edit entire appointment" to reschedule.</td>
            </tr>
            <tr>
              <td><strong>Notes &amp; Discussion Comments</strong></td>
              <td><code>src/components/DetailPanel.tsx</code><br><code>worker/index.ts</code> (<code>/api/comments</code>)<br>D1 table <code>comments</code></td>
              <td><span class="pill pill-orange">Dormant / Unrendered in UI</span></td>
              <td>Full D1 schema, Worker API endpoints (<code>POST</code>, <code>DELETE /api/comments</code>), and drawer component (<code>DetailPanel.tsx</code>) exist in codebase. However, <code>DetailPanel</code> is unmounted in the current UI layout, so comment posting is dormant in the frontend.</td>
            </tr>
            <tr>
              <td><strong>Appointment Duplication Action</strong></td>
              <td><code>src/useScheduler.ts</code> (<code>duplicate(aid)</code>)</td>
              <td><span class="pill pill-orange">Dormant / Unrendered in UI</span></td>
              <td>Logic to duplicate an appointment into the next calendar day exists in scheduler state and activity logger, but is not attached to any action button in the current modal or table interface.</td>
            </tr>
            <tr>
              <td><strong>Oldest/Newest Search Sort Toggle</strong></td>
              <td><code>src/useScheduler.ts</code> (<code>searchSort</code>)</td>
              <td><span class="pill pill-orange">Dormant / Unrendered in UI</span></td>
              <td>State and filtering functions support sorting search results by oldest or newest, but the top search bar UI renders only a text query input without a sort toggle switch.</td>
            </tr>
            <tr>
              <td><strong>Standalone Orders Management Screen</strong></td>
              <td><code>worker/index.ts</code> (<code>/api/orders</code>)<br>D1 table <code>orders</code></td>
              <td><span class="pill pill-blue">Backend-Only / API Service</span></td>
              <td>Audit orders (e.g. <code>NEW-001</code>) are auto-generated as background relational containers when appointments are created. There is no standalone "Orders" management page or manual order CRUD UI.</td>
            </tr>
            <tr>
              <td><strong>Direct Plant Management &amp; Toggle</strong></td>
              <td><code>worker/index.ts</code> (<code>/api/plants/:id/toggle</code>)<br>D1 table <code>plants</code></td>
              <td><span class="pill pill-blue">Backend-Only / Legacy</span></td>
              <td>Cloudflare Worker routes exist to seed and toggle plant visibility, but the modern frontend manages all sites and departments through dynamic tags in the Options tab (<code>options.sites</code>).</td>
            </tr>
            <tr>
              <td><strong>Real-Time Google Sheets Cloud Sync</strong></td>
              <td><code>worker/index.ts</code> (<code>/api/google-sheets/*</code>)<br>D1 table <code>options</code></td>
              <td><span class="pill pill-blue">Backend-Only / Webhook Service</span></td>
              <td>Sync engine is executed via Cloudflare Worker and environment variable <code>GOOGLE_SHEETS_WEBHOOK_URL</code> to push database snapshots on demand, without an in-app configuration UI.</td>
            </tr>
            <tr>
              <td><strong>Engineer <code>isMaster</code> Role Flag</strong></td>
              <td><code>src/types.ts</code> (<code>Engineer.isMaster</code>)<br><code>src/components/EngineerModal.tsx</code></td>
              <td><span class="pill pill-purple">Omitted from UI Form</span></td>
              <td>Present in TypeScript data model and filtered in scheduler logic (<code>e.isMaster !== false</code>), but <code>EngineerModal.tsx</code> does not expose a checkbox or switch for administrators to edit it.</td>
            </tr>
            <tr>
              <td><strong>Separate Lead Auditor Field</strong></td>
              <td><code>src/types.ts</code> (<code>Assignment.leadAuditor</code>)</td>
              <td><span class="pill pill-purple">Omitted from UI Form</span></td>
              <td>Supported in the data schema and completeness validator, but omitted from the appointment form in favor of the consolidated <code>MultiAuditorSelect</code> (auditor1 / auditor2 / hostAuditors).</td>
            </tr>
            <tr>
              <td><strong>Legacy Site Codes (<code>U1..U3T</code>)</strong></td>
              <td><code>src/types.ts</code> (<code>normalizeSite()</code>)<br><code>worker/index.ts</code></td>
              <td><span class="pill pill-red">Legacy / Filtered from UI</span></td>
              <td>Legacy facility codes are automatically translated to canonical <code>UTL1..UTL4</code> for backward compatibility, but are strictly excluded from all user-facing dropdowns and Options tags.</td>
            </tr>
            <tr>
              <td><strong>Audit Findings &amp; Defect Recording</strong></td>
              <td><code>src/components/AuditResultsModal.tsx</code></td>
              <td><span class="pill pill-green">Active in UI</span></td>
              <td>Interactive modal to record Major, Minor, OFI, Remarks, and completion status.</td>
            </tr>
            <tr>
              <td><strong>Dynamic Table View &amp; Multi-Filtering</strong></td>
              <td><code>src/components/TableView.tsx</code></td>
              <td><span class="pill pill-green">Active in UI</span></td>
              <td>High-performance tabular view with multi-column filtering, pagination, and status indicators.</td>
            </tr>
            <tr>
              <td><strong>Executive KPI Dashboard &amp; Excel Export</strong></td>
              <td><code>src/components/SummaryDashboard.tsx</code></td>
              <td><span class="pill pill-green">Active in UI</span></td>
              <td>Annual breakdown matrix with styled corporate Excel spreadsheet export via <code>xlsx-js-style</code>.</td>
            </tr>
            <tr>
              <td><strong>Universal Drag-and-Drop Options Ordering</strong></td>
              <td><code>src/components/Admin.tsx</code></td>
              <td><span class="pill pill-green">Active in UI</span></td>
              <td>Live drag-and-drop ordering for Sites, Standards, Customers, and Departments reflecting globally across all dropdowns.</td>
            </tr>
            <tr>
              <td><strong>Comprehensive Audit Trail Log</strong></td>
              <td><code>src/components/HistoryView.tsx</code></td>
              <td><span class="pill pill-green">Active in UI</span></td>
              <td>Chronological event stream tracking creations, updates, deletions, and findings.</td>
            </tr>
          </tbody>
        </table>
      </section>
`;

const thSection18Html = `
      <!-- 18. ตารางตรวจสอบสถานะฟังก์ชันทั้งหมดในระบบ -->
      <section id="feature-status-matrix">
        <h2>18. ตารางตรวจสอบสถานะฟังก์ชันทั้งหมดในระบบ (Comprehensive Feature Inventory &amp; UI Status Matrix)</h2>
        <p>
          ส่วนนี้รวบรวมการตรวจสอบเชิงเทคนิคของทุกฟังก์ชัน, ข้อมูล, API Endpoints และหน้าต่างการทำงานในโค้ดเบสของ UTAC QA Calendar โดยจำแนกสถานะการแสดงผลและการใช้งานจริงบนหน้าเว็บ (UI Availability) ไว้อย่างชัดเจน:
        </p>

        <!-- Status Legend -->
        <div class="grid-3" style="margin-bottom: 24px;">
          <div class="stat-box" style="border-left: 4px solid #16a34a;">
            <div style="display:flex; align-items:center; gap:8px; margin-bottom:8px;">
              <span class="pill pill-green">เปิดใช้งานใน UI (Active in UI)</span>
            </div>
            <div class="stat-desc">ใช้งานได้สมบูรณ์ มีปุ่มและหน้าจอแสดงผลในเมนูหลักของระบบ สามารถคลิกใช้งานได้ตามปกติ</div>
          </div>
          <div class="stat-box" style="border-left: 4px solid #d97706;">
            <div style="display:flex; align-items:center; gap:8px; margin-bottom:8px;">
              <span class="pill pill-yellow">ปิดตามเงื่อนไข (Disabled in UI / Conditional)</span>
            </div>
            <div class="stat-desc">มีโค้ดในหน้าจอ UI แต่ถูกล็อก (Disabled) หรือซ่อนตามเงื่อนไขเฉพาะ (เช่น เมื่อแก้ไขนัดหมายแบบแยกวันเดียว)</div>
          </div>
          <div class="stat-box" style="border-left: 4px solid #c2410c;">
            <div style="display:flex; align-items:center; gap:8px; margin-bottom:8px;">
              <span class="pill pill-orange">ไม่ได้แสดงผลใน UI (Dormant / Unrendered in UI)</span>
            </div>
            <div class="stat-desc">เขียนโค้ดและสร้าง API ไว้พร้อมใช้งาน แต่ยังไม่ได้นำ Component มาวางแสดงผลในหน้าจอของเวอร์ชันนี้</div>
          </div>
          <div class="stat-box" style="border-left: 4px solid #1d4ed8;">
            <div style="display:flex; align-items:center; gap:8px; margin-bottom:8px;">
              <span class="pill pill-blue">เฉพาะหลังบ้าน (Backend-Only / API Service)</span>
            </div>
            <div class="stat-desc">ฟังก์ชันทำงานบน Cloudflare Worker หรือสร้างอัตโนมัติในฐานข้อมูล ไม่มีหน้าจอจัดการแยกต่างหาก</div>
          </div>
          <div class="stat-box" style="border-left: 4px solid #6b21a8;">
            <div style="display:flex; align-items:center; gap:8px; margin-bottom:8px;">
              <span class="pill pill-purple">ไม่แสดงในฟอร์ม UI (Omitted from UI Form)</span>
            </div>
            <div class="stat-desc">มีฟิลด์ข้อมูลในฐานข้อมูลและฟังก์ชันตรวจสอบ แต่ไม่ได้ใส่ช่องกรอกในหน้าต่างโมดอลเพื่อให้ผู้ใช้แก้ไข</div>
          </div>
          <div class="stat-box" style="border-left: 4px solid #dc2626;">
            <div style="display:flex; align-items:center; gap:8px; margin-bottom:8px;">
              <span class="pill pill-red">ระบบเดิม / ซ่อนจาก UI (Legacy / Filtered from UI)</span>
            </div>
            <div class="stat-desc">รองรับในโค้ดเพื่อแปลงข้อมูลประวัติศาสตร์ในอดีต แต่ถูกซ่อนไม่ให้ปรากฏในเมนูดรอปดาวน์ของ UI ปัจจุบัน</div>
          </div>
        </div>

        <table class="spec-table">
          <thead>
            <tr>
              <th style="width: 22%;">ฟังก์ชัน / ระบบงาน</th>
              <th style="width: 20%;">ไฟล์โค้ดและส่วนประกอบ</th>
              <th style="width: 18%;">สถานะบน UI</th>
              <th style="width: 40%;">คำอธิบายและเหตุผลในการทำงาน</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>ปฏิทินไทม์ไลน์แบบโต้ตอบ</strong></td>
              <td><code>src/components/Schedule.tsx</code></td>
              <td><span class="pill pill-green">Active in UI</span></td>
              <td>ตารางปฏิทิน 365 วัน พร้อมระบบจัดกลุ่ม 6 มิติ, การซูมปรับสเกล และ Tooltip ลอยอัจฉริยะ</td>
            </tr>
            <tr>
              <td><strong>ฟอร์มนัดหมาย Customer Audit</strong></td>
              <td><code>src/components/AppointmentFormFields.tsx</code></td>
              <td><span class="pill pill-green">Active in UI</span></td>
              <td>ฟอร์มบันทึกนัดหมายลูกค้า ตรวจสอบความถูกต้องครบทั้ง 8 ช่อง พร้อมแบนเนอร์สีแดงแจ้งเตือนทันที</td>
            </tr>
            <tr>
              <td><strong>ฟอร์มนัดหมาย Internal Audit</strong></td>
              <td><code>src/components/AppointmentFormFields.tsx</code></td>
              <td><span class="pill pill-green">Active in UI</span></td>
              <td>ฟอร์มตรวจประเมินภายใน ตรวจสอบครบทั้ง 6 ช่อง: Standard, Site, Audit Category, Area, QMS Host, และ Date Range</td>
            </tr>
            <tr>
              <td><strong>ช่องเลือกวันที่เมื่อแก้ไขแบบวันเดียว</strong></td>
              <td><code>AppointmentFormFields.tsx</code> (<code>isDateLocked</code>)</td>
              <td><span class="pill pill-yellow">Disabled in UI / Conditional</span></td>
              <td>เมื่อผู้ใช้เลือกแก้ไขเฉพาะวันใดวันหนึ่ง ช่องเลือกวันที่จะถูกล็อก (<code>disabled={true}</code>) และปฏิทิน <code>AvailabilityDatePicker</code> จะถูกซ่อน พร้อมแสดงแถบล็อกแนะนำให้เลือก "แก้ไขทั้งนัดหมาย" หากต้องการเปลี่ยนวัน</td>
            </tr>
            <tr>
              <td><strong>ระบบโน้ตและแสดงความคิดเห็น</strong></td>
              <td><code>src/components/DetailPanel.tsx</code><br><code>worker/index.ts</code> (<code>/api/comments</code>)<br>D1 table <code>comments</code></td>
              <td><span class="pill pill-orange">Dormant / Unrendered in UI</span></td>
              <td>มีตารางในฐานข้อมูล D1, API หลังบ้าน (<code>POST</code>, <code>DELETE /api/comments</code>) และหน้าต่าง <code>DetailPanel.tsx</code> สมบูรณ์ แต่ไม่ได้ถูก Mount ในหน้าจอหลักของ UI ปัจจุบัน ทำให้ผู้ใช้ยังไม่เห็นช่องพิมพ์คอมเมนต์บนหน้าจอ</td>
            </tr>
            <tr>
              <td><strong>ฟังก์ชันคัดลอกนัดหมาย (Duplicate)</strong></td>
              <td><code>src/useScheduler.ts</code> (<code>duplicate(aid)</code>)</td>
              <td><span class="pill pill-orange">Dormant / Unrendered in UI</span></td>
              <td>มีโค้ดโคลนนิ่งนัดหมายไปยังวันถัดไปพร้อมบันทึก Audit Trail ใน State แต่ไม่มีปุ่มคลิกเรียกใช้งานในหน้าโมดอลหรือตาราง</td>
            </tr>
            <tr>
              <td><strong>ปุ่มสลับเรียงลำดับการค้นหา เก่าสุด/ใหม่สุด</strong></td>
              <td><code>src/useScheduler.ts</code> (<code>searchSort</code>)</td>
              <td><span class="pill pill-orange">Dormant / Unrendered in UI</span></td>
              <td>State และฟังก์ชันกรองข้อมูลรองรับการเรียงตาม <code>oldest</code> หรือ <code>newest</code> แต่ในแถบค้นหาบนหน้า UI มีเพียงช่องพิมพ์ข้อความ ไม่มีปุ่มคลิกสลับ</td>
            </tr>
            <tr>
              <td><strong>หน้าจอจัดการ Orders แยกต่างหาก</strong></td>
              <td><code>worker/index.ts</code> (<code>/api/orders</code>)<br>D1 table <code>orders</code></td>
              <td><span class="pill pill-blue">Backend-Only / API Service</span></td>
              <td>รหัส Order (เช่น <code>NEW-001</code>) ถูกสร้างขึ้นอัตโนมัติในพื้นหลังเพื่อเป็นตู้เก็บนัดหมาย ไม่มีเมนูหน้าจอหรือแบบฟอร์ม CRUD ของ Orders ใน UI</td>
            </tr>
            <tr>
              <td><strong>API จัดการและเปิดปิดสถานะโรงงานเดิม</strong></td>
              <td><code>worker/index.ts</code> (<code>/api/plants/:id/toggle</code>)<br>D1 table <code>plants</code></td>
              <td><span class="pill pill-blue">Backend-Only / Legacy</span></td>
              <td>มี Route และตารางรองรับการ Toggle สถานะ Plants แต่ใน UI ปัจจุบัน การจัดการโรงงานและแผนกทั้งหมดถูกย้ายไปควบคุมผ่านแท็กตัวเลือกไดนามิกในแถบ Options</td>
            </tr>
            <tr>
              <td><strong>บริการซิงค์ข้อมูล Google Sheets แบบ Real-Time</strong></td>
              <td><code>worker/index.ts</code> (<code>/api/google-sheets/*</code>)<br>D1 table <code>options</code></td>
              <td><span class="pill pill-blue">Backend-Only / Webhook Service</span></td>
              <td>ระบบซิงค์ทำงานผ่าน Cloudflare Worker และคอนฟิกผ่านตัวแปร <code>GOOGLE_SHEETS_WEBHOOK_URL</code> โดยไม่มีปุ่มหรือหน้าต่างคอนฟิกใน UI หน้าบ้าน</td>
            </tr>
            <tr>
              <td><strong>แฟล็กสิทธิ์ <code>isMaster</code> ของผู้ตรวจประเมิน</strong></td>
              <td><code>src/types.ts</code> (<code>Engineer.isMaster</code>)<br><code>src/components/EngineerModal.tsx</code></td>
              <td><span class="pill pill-purple">Omitted from UI Form</span></td>
              <td>มีอยู่ใน Data Model และตัวกรองระบบ (<code>e.isMaster !== false</code>) แต่หน้าต่าง <code>EngineerModal.tsx</code> ไม่มีช่อง Checkbox ให้ผู้ดูแลระบบกดติ๊ก โดยจะถือว่าเป็น Master โดยปริยาย</td>
            </tr>
            <tr>
              <td><strong>ช่องกรอก Lead Auditor แยกเดี่ยว</strong></td>
              <td><code>src/types.ts</code> (<code>Assignment.leadAuditor</code>)</td>
              <td><span class="pill pill-purple">Omitted from UI Form</span></td>
              <td>มีในสคีมาข้อมูลและตัวตรวจสอบ แต่ในหน้าแบบฟอร์มนัดหมายถูกรวมเข้ากับ <code>MultiAuditorSelect</code> (เลือก QMS Host หลายคน) จึงไม่มีช่องข้อความ Lead Auditor แยก</td>
            </tr>
            <tr>
              <td><strong>รหัสโรงงานแบบเดิม (<code>U1..U3T</code>)</strong></td>
              <td><code>src/types.ts</code> (<code>normalizeSite()</code>)<br><code>worker/index.ts</code></td>
              <td><span class="pill pill-red">Legacy / Filtered from UI</span></td>
              <td>ฟังก์ชันแปลงรหัสอัตโนมัติเป็น <code>UTL1..UTL4</code> ทำงานเพื่อรองรับข้อมูลย้อนหลัง แต่ถูกคัดกรองออกจากดรอปดาวน์และแท็กตัวเลือกทั้งหมดใน UI</td>
            </tr>
            <tr>
              <td><strong>บันทึกผลการตรวจและข้อบกพร่อง</strong></td>
              <td><code>src/components/AuditResultsModal.tsx</code></td>
              <td><span class="pill pill-green">Active in UI</span></td>
              <td>โมดอลบันทึกผลการตรวจ Major, Minor, OFI, ข้อสังเกต และการเปลี่ยนสถานะเป็นตรวจเสร็จสิ้น</td>
            </tr>
            <tr>
              <td><strong>ตารางข้อมูลความเร็วสูงและการกรองหลายคอลัมน์</strong></td>
              <td><code>src/components/TableView.tsx</code></td>
              <td><span class="pill pill-green">Active in UI</span></td>
              <td>ตารางข้อมูลประสิทธิภาพสูง พร้อมการกรองละเอียด, การแบ่งหน้า (Pagination) และป้ายสถานะความสมบูรณ์</td>
            </tr>
            <tr>
              <td><strong>แดชบอร์ด KPI ผู้บริหารและส่งออก Excel</strong></td>
              <td><code>src/components/SummaryDashboard.tsx</code></td>
              <td><span class="pill pill-green">Active in UI</span></td>
              <td>เมทริกซ์สรุปผลแยกตามโรงงานและประเภทตรวจ พร้อมปุ่มดาวน์โหลดไฟล์ Excel (.xlsx) ที่จัดรูปแบบสวยงาม</td>
            </tr>
            <tr>
              <td><strong>การจัดเรียงตัวเลือกระบบแบบลากวาง (Drag-and-Drop)</strong></td>
              <td><code>src/components/Admin.tsx</code></td>
              <td><span class="pill pill-green">Active in UI</span></td>
              <td>จัดเรียงลำดับ Sites, Standards, Customers, Departments แบบลากวาง พร้อมบันทึกและแสดงผลตามลำดับทันทีทั้งระบบ</td>
            </tr>
            <tr>
              <td><strong>บันทึกประวัติการทำงาน (Audit Trail)</strong></td>
              <td><code>src/components/HistoryView.tsx</code></td>
              <td><span class="pill pill-green">Active in UI</span></td>
              <td>ระบบบันทึกเหตุการณ์ตามลำดับเวลา บันทึกการสร้าง, อัปเดต, ลบ และการลงผลตรวจ</td>
            </tr>
          </tbody>
        </table>
      </section>
`;

if (!en.includes('id="feature-status-matrix"')) {
  en = en.replace('</main>', enSection18Html + '\n    </main>');
}

if (!th.includes('id="feature-status-matrix"')) {
  th = th.replace('</main>', thSection18Html + '\n    </main>');
}

// Write all target files
fs.writeFileSync(enFile, en, 'utf8');
fs.writeFileSync(thFile, th, 'utf8');

fs.writeFileSync(path.join(__dirname, '../docs/index.html'), en, 'utf8');
fs.writeFileSync(path.join(__dirname, '../app-architecture-and-features.html'), en, 'utf8');
fs.writeFileSync(path.join(__dirname, '../app-architecture-and-features-th.html'), th, 'utf8');

console.log('Successfully updated and mirrored all 5 documentation files!');
console.log('Final EN length:', en.length);
console.log('Final TH length:', th.length);
