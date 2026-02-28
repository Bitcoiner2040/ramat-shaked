import Database from 'better-sqlite3';

const db = new Database('carwash.db');
db.pragma('journal_mode = WAL');

// Initialize database schema
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role TEXT DEFAULT 'customer', -- 'customer' or 'admin'
    loyalty_stamps INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS appointments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    service_type TEXT NOT NULL, -- 'external', 'internal', 'full'
    date TEXT NOT NULL, -- YYYY-MM-DD
    time TEXT NOT NULL, -- HH:mm
    status TEXT DEFAULT 'pending', -- 'pending', 'completed', 'cancelled'
    price INTEGER NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS blocked_slots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    time TEXT
  );
`);

// Seed admin user if not exists
const adminCheck = db.prepare("SELECT * FROM users WHERE role = 'admin'").get();
if (!adminCheck) {
  db.prepare("INSERT INTO users (phone, name, role) VALUES (?, ?, ?)").run('0500000000', 'Admin', 'admin');
}

export default db;
