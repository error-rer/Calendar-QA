-- Migration 0001: Initial schema + seed data

CREATE TABLE IF NOT EXISTS plants (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  loc TEXT NOT NULL DEFAULT '',
  code TEXT NOT NULL DEFAULT '',
  color TEXT NOT NULL DEFAULT '#2f6df0'
);

CREATE TABLE IF NOT EXISTS active_plants (
  plant_id TEXT PRIMARY KEY,
  active INTEGER NOT NULL DEFAULT 1,
  FOREIGN KEY (plant_id) REFERENCES plants(id)
);

CREATE TABLE IF NOT EXISTS engineers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT '',
  department TEXT NOT NULL DEFAULT 'U1',
  sub_departments TEXT NOT NULL DEFAULT '[]'
);

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL DEFAULT '',
  customer TEXT NOT NULL DEFAULT '',
  product TEXT NOT NULL DEFAULT '',
  plant TEXT NOT NULL DEFAULT '',
  purpose TEXT NOT NULL DEFAULT ''
);

-- Each row is one weekday of an appointment; a multi-day appointment is
-- several rows sharing the same (eng, order_id) pair on consecutive days.
-- site1/customer/.../department2 are denormalized directly onto the
-- assignment (matching src/types.ts Assignment) rather than looked up
-- through `orders`, since the Customer/Internal Audit form captures them
-- per-appointment.
CREATE TABLE IF NOT EXISTS assignments (
  id TEXT PRIMARY KEY,
  eng TEXT NOT NULL,
  order_id TEXT NOT NULL,
  day INTEGER NOT NULL DEFAULT 0,
  week INTEGER NOT NULL DEFAULT 0,
  site1 TEXT NOT NULL DEFAULT '',
  customer TEXT NOT NULL DEFAULT '',
  end_customer TEXT NOT NULL DEFAULT '',
  auditor1 TEXT NOT NULL DEFAULT '',
  site2 TEXT NOT NULL DEFAULT '',
  area TEXT NOT NULL DEFAULT '',
  auditor2 TEXT NOT NULL DEFAULT '',
  department1 TEXT NOT NULL DEFAULT '',
  department2 TEXT NOT NULL DEFAULT '',
  major INTEGER NOT NULL DEFAULT 0,
  minor INTEGER NOT NULL DEFAULT 0,
  ofi INTEGER NOT NULL DEFAULT 0,
  request INTEGER NOT NULL DEFAULT 0,
  utl1 INTEGER NOT NULL DEFAULT 0,
  utl2 INTEGER NOT NULL DEFAULT 0,
  utl3 INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (eng) REFERENCES engineers(id),
  FOREIGN KEY (order_id) REFERENCES orders(id)
);

CREATE TABLE IF NOT EXISTS comments (
  id TEXT PRIMARY KEY,
  assignment_id TEXT NOT NULL,
  who TEXT NOT NULL DEFAULT '',
  initials TEXT NOT NULL DEFAULT '',
  text TEXT NOT NULL DEFAULT '',
  ago TEXT NOT NULL DEFAULT '',
  color TEXT NOT NULL DEFAULT '#0f9d8c',
  FOREIGN KEY (assignment_id) REFERENCES assignments(id)
);

CREATE TABLE IF NOT EXISTS activity (
  id TEXT PRIMARY KEY,
  who TEXT NOT NULL DEFAULT '',
  text TEXT NOT NULL DEFAULT '',
  ago TEXT NOT NULL DEFAULT '',
  color TEXT NOT NULL DEFAULT '#0f9d8c'
);

-- Seed: matches src/data.ts's current initialState() — only the base
-- plants exist out of the box, everything else starts empty.
INSERT OR IGNORE INTO plants (id, name, loc, code, color) VALUES
  ('QMS', 'QMS', '', 'QMS', '#2f6df0'),
  ('EHS', 'EHS', '', 'EHS', '#0f9d8c'),
  ('ESD', 'ESD', '', 'ESD', '#c2620c');

INSERT OR IGNORE INTO active_plants (plant_id, active) VALUES
  ('QMS', 1), ('EHS', 1), ('ESD', 1);
