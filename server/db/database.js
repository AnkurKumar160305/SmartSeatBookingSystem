const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const IS_VERCEL = process.env.VERCEL === '1' || !!process.env.VERCEL;
const BUNDLED_DB_PATH = path.join(__dirname, '..', 'smartseat.db');
const RUNTIME_DB_PATH = IS_VERCEL ? path.join('/tmp', 'smartseat.db') : BUNDLED_DB_PATH;

// Vercel Self-Healing: Copy bundled DB to /tmp if it doesn't exist
if (IS_VERCEL && !fs.existsSync(RUNTIME_DB_PATH)) {
  try {
    console.log('🔄 Vercel detected: Migrating bundled DB to /tmp...');
    if (fs.existsSync(BUNDLED_DB_PATH)) {
      fs.copyFileSync(BUNDLED_DB_PATH, RUNTIME_DB_PATH);
      console.log('✅ Bundled DB copied to runtime path.');
    } else {
      console.log('⚠️ Bundled DB not found. A new one will be initialized.');
    }
  } catch (err) {
    console.error('❌ Failed to copy database to /tmp:', err);
  }
}

const db = new Database(RUNTIME_DB_PATH);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initializeDatabase() {
  // Create Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT,
      batch TEXT CHECK(batch IN ('Batch1', 'Batch2')) NOT NULL,
      employee_id TEXT,
      role TEXT CHECK(role IN ('user', 'admin')) DEFAULT 'user',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create Seats table
  db.exec(`
    CREATE TABLE IF NOT EXISTS seats (
      id TEXT PRIMARY KEY,
      spot_number INTEGER NOT NULL,
      seat_number INTEGER NOT NULL,
      batch_assigned TEXT CHECK(batch_assigned IN ('Batch1', 'Batch2')) NOT NULL,
      UNIQUE(spot_number, seat_number)
    )
  `);

  // Create Bookings table
  db.exec(`
    CREATE TABLE IF NOT EXISTS bookings (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      seat_id TEXT NOT NULL,
      booking_date DATE NOT NULL,
      payment_status TEXT CHECK(payment_status IN ('paid', 'failed', 'pending')) DEFAULT 'pending',
      status TEXT CHECK(status IN ('active', 'cancelled')) DEFAULT 'active',
      is_cross_batch INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (seat_id) REFERENCES seats(id)
    )
  `);

  // Create BufferSeats table
  db.exec(`
    CREATE TABLE IF NOT EXISTS buffer_seats (
      batch TEXT PRIMARY KEY CHECK(batch IN ('Batch1', 'Batch2')),
      total_buffer INTEGER NOT NULL DEFAULT 10
    )
  `);

  // Create Holidays table
  db.exec(`
    CREATE TABLE IF NOT EXISTS holidays (
      id TEXT PRIMARY KEY,
      date DATE UNIQUE NOT NULL,
      reason TEXT NOT NULL
    )
  `);

  // Seed data
  seedData();
}

function seedData() {
  // Check if seats already exist
  const seatCount = db.prepare('SELECT COUNT(*) as count FROM seats').get();
  if (seatCount.count > 0) return;

  console.log('🌱 Seeding database...');

  // Seed 80 seats: 10 spots × 8 seats each
  // Spots 1-5 → Batch1, Spots 6-10 → Batch2
  const insertSeat = db.prepare('INSERT INTO seats (id, spot_number, seat_number, batch_assigned) VALUES (?, ?, ?, ?)');
  const insertMany = db.transaction(() => {
    for (let spot = 1; spot <= 10; spot++) {
      const batch = spot <= 5 ? 'Batch1' : 'Batch2';
      for (let seat = 1; seat <= 8; seat++) {
        insertSeat.run(uuidv4(), spot, seat, batch);
      }
    }
  });
  insertMany();

  // Seed buffer seats
  const insertBuffer = db.prepare('INSERT OR IGNORE INTO buffer_seats (batch, total_buffer) VALUES (?, ?)');
  insertBuffer.run('Batch1', 10);
  insertBuffer.run('Batch2', 10);

  // Seed admin user
  const adminExists = db.prepare('SELECT COUNT(*) as count FROM users WHERE role = ?').get('admin');
  if (adminExists.count === 0) {
    const hashedPassword = bcrypt.hashSync('admin123', 10);
    db.prepare('INSERT INTO users (id, name, email, password_hash, batch, employee_id, role) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(uuidv4(), 'Admin User', 'admin@smartseat.com', hashedPassword, 'Batch1', 'EMP001', 'admin');
  }

  // Seed demo users
  const demoExists = db.prepare('SELECT COUNT(*) as count FROM users WHERE email = ?').get('demo1@smartseat.com');
  if (demoExists.count === 0) {
    const hashedPassword = bcrypt.hashSync('demo123', 10);
    db.prepare('INSERT INTO users (id, name, email, password_hash, batch, employee_id, role) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(uuidv4(), 'John Doe', 'demo1@smartseat.com', hashedPassword, 'Batch1', 'EMP002', 'user');
    db.prepare('INSERT INTO users (id, name, email, password_hash, batch, employee_id, role) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(uuidv4(), 'Jane Smith', 'demo2@smartseat.com', hashedPassword, 'Batch2', 'EMP003', 'user');
  }

  // Seed some holidays
  const holidayExists = db.prepare('SELECT COUNT(*) as count FROM holidays').get();
  if (holidayExists.count === 0) {
    const insertHoliday = db.prepare('INSERT INTO holidays (id, date, reason) VALUES (?, ?, ?)');
    insertHoliday.run(uuidv4(), '2026-01-26', 'Republic Day');
    insertHoliday.run(uuidv4(), '2026-03-14', 'Holi');
    insertHoliday.run(uuidv4(), '2026-08-15', 'Independence Day');
    insertHoliday.run(uuidv4(), '2026-10-02', 'Gandhi Jayanti');
    insertHoliday.run(uuidv4(), '2026-11-04', 'Diwali');
    insertHoliday.run(uuidv4(), '2026-12-25', 'Christmas');
  }

  console.log('✅ Database seeded successfully!');
  console.log('   📊 80 seats (10 spots × 8 seats)');
  console.log('   👤 Admin: admin@smartseat.com / admin123');
  console.log('   👤 Demo Batch1: demo1@smartseat.com / demo123');
  console.log('   👤 Demo Batch2: demo2@smartseat.com / demo123');
}

module.exports = { db, initializeDatabase, RUNTIME_DB_PATH };
