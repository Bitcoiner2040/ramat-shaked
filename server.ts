import express from 'express';
import { createServer as createViteServer } from 'vite';
import db from './src/db';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // --- API Routes ---

  // Auth
  app.post('/api/login', (req, res) => {
    const { phone } = req.body;
    const user = db.prepare('SELECT * FROM users WHERE phone = ?').get(phone);
    if (user) {
      res.json(user);
    } else {
      res.status(401).json({ error: 'User not found' });
    }
  });

  app.post('/api/register', (req, res) => {
    const { phone, name } = req.body;
    try {
      const info = db.prepare('INSERT INTO users (phone, name) VALUES (?, ?)').run(phone, name);
      const user = db.prepare('SELECT * FROM users WHERE id = ?').get(info.lastInsertRowid);
      res.json(user);
    } catch (err: any) {
      if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        res.status(400).json({ error: 'Phone number already registered' });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  });

  // User details (Loyalty)
  app.get('/api/users/:id', (req, res) => {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
    if (user) res.json(user);
    else res.status(404).json({ error: 'User not found' });
  });

  // Appointments
  app.get('/api/appointments', (req, res) => {
    const { date, user_id } = req.query;
    let query = 'SELECT appointments.*, users.name as user_name, users.phone as user_phone FROM appointments JOIN users ON appointments.user_id = users.id';
    const params = [];

    if (user_id) {
      query += ' WHERE user_id = ?';
      params.push(user_id);
    } else if (date) {
      query += ' WHERE date = ?';
      params.push(date);
    }
    
    query += ' ORDER BY date ASC, time ASC';

    const appointments = db.prepare(query).all(...params);
    res.json(appointments);
  });

  app.post('/api/appointments', (req, res) => {
    const { user_id, service_type, date, time, price } = req.body;
    
    // Simple validation (in a real app, check for overlaps here)
    // For this MVP, we'll assume the frontend checks availability or we just allow double booking if not strict.
    // But let's add a basic check for exact duplicate slots to be safe.
    
    const existing = db.prepare("SELECT * FROM appointments WHERE date = ? AND time = ? AND status != 'cancelled'").get(date, time);
    if (existing) {
       return res.status(400).json({ error: 'Slot already taken' });
    }

    const info = db.prepare('INSERT INTO appointments (user_id, service_type, date, time, price) VALUES (?, ?, ?, ?, ?)').run(user_id, service_type, date, time, price);
    res.json({ id: info.lastInsertRowid });
  });

  app.patch('/api/appointments/:id/status', (req, res) => {
    const { status } = req.body;
    const { id } = req.params;
    
    const appointment = db.prepare('SELECT * FROM appointments WHERE id = ?').get(id);
    if (!appointment) return res.status(404).json({ error: 'Appointment not found' });

    db.prepare('UPDATE appointments SET status = ? WHERE id = ?').run(status, id);

    // If completed and it was a full combo, update loyalty
    if (status === 'completed' && appointment.status !== 'completed') {
       if (appointment.service_type === 'full') {
         db.prepare('UPDATE users SET loyalty_stamps = loyalty_stamps + 1 WHERE id = ?').run(appointment.user_id);
       }
       // Check if they have 5 stamps, maybe reset? 
       // The prompt says "Every 5... earns 1 free". Usually this means you redeem 5 for a free one.
       // For now, we just accumulate. Logic to redeem can be on frontend or another endpoint.
    }

    res.json({ success: true });
  });
  
  // Blocked slots
  app.get('/api/blocked', (req, res) => {
      const slots = db.prepare('SELECT * FROM blocked_slots').all();
      res.json(slots);
  });

  app.post('/api/blocked', (req, res) => {
      const { date, time } = req.body;
      db.prepare('INSERT INTO blocked_slots (date, time) VALUES (?, ?)').run(date, time);
      res.json({ success: true });
  });
  
  app.delete('/api/blocked/:id', (req, res) => {
      db.prepare('DELETE FROM blocked_slots WHERE id = ?').run(req.params.id);
      res.json({ success: true });
  });


  // --- Vite Middleware ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
