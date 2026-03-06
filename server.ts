import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new Database("attendance.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    stage TEXT NOT NULL,
    class_name TEXT
  );

  CREATE TABLE IF NOT EXISTS attendance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    date TEXT NOT NULL,
    status TEXT NOT NULL,
    FOREIGN KEY (student_id) REFERENCES students (id)
  );

  -- Migration for Grade 1 unification
  UPDATE students SET stage = 'grade1-boys' WHERE stage IN ('grade1-boys-primary', 'grade1-boys-secondary', 'grade1-boys-a', 'grade1-boys-b', 'grade1-boys-1', 'grade1-boys-2');
  UPDATE students SET stage = 'grade1-girls' WHERE stage IN ('grade1-girls-primary', 'grade1-girls-secondary', 'grade1-girls-a', 'grade1-girls-b', 'grade1-girls-1', 'grade1-girls-2');
`);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  // API Routes
  app.get("/api/students", (req, res) => {
    const { stage } = req.query;
    let students;
    if (stage) {
      students = db.prepare("SELECT * FROM students WHERE stage = ?").all(stage);
    } else {
      students = db.prepare("SELECT * FROM students").all();
    }
    res.json(students);
  });

  app.delete("/api/attendance/day", (req, res) => {
    const { date, stage } = req.query;
    try {
      db.prepare(`
        DELETE FROM attendance 
        WHERE date = ? AND student_id IN (SELECT id FROM students WHERE stage = ?)
      `).run(date, stage);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.delete("/api/students/stage", (req, res) => {
    const { stage } = req.query;
    try {
      const transaction = db.transaction(() => {
        db.prepare("DELETE FROM attendance WHERE student_id IN (SELECT id FROM students WHERE stage = ?)").run(stage);
        db.prepare("DELETE FROM students WHERE stage = ?").run(stage);
      });
      transaction();
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post("/api/students/bulk-upload", (req, res) => {
    const { students } = req.body;
    
    const stagesInFile = [...new Set(students.map((s: any) => s.stage))];
    
    const deleteStageStudents = db.prepare("DELETE FROM students WHERE stage = ?");
    const deleteStageAttendance = db.prepare("DELETE FROM attendance WHERE student_id IN (SELECT id FROM students WHERE stage = ?)");
    const insert = db.prepare("INSERT INTO students (name, stage, class_name) VALUES (?, ?, ?)");
    
    const transaction = db.transaction((data) => {
      for (const stage of stagesInFile) {
        deleteStageAttendance.run(stage);
        deleteStageStudents.run(stage);
      }
      for (const student of data) {
        insert.run(student.name, student.stage, student.className || '');
      }
    });

    try {
      transaction(students);
      res.json({ success: true, message: `Uploaded ${students.length} students for ${stagesInFile.length} stages` });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post("/api/students/upload", (req, res) => {
    const { students, stage } = req.body;
    
    const deleteOld = db.prepare("DELETE FROM students WHERE stage = ?");
    const insert = db.prepare("INSERT INTO students (name, stage, class_name) VALUES (?, ?, ?)");
    
    const transaction = db.transaction((data) => {
      deleteOld.run(stage);
      for (const student of data) {
        insert.run(student.name, stage, student.className || '');
      }
    });

    try {
      transaction(students);
      res.json({ success: true, message: `Uploaded ${students.length} students` });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post("/api/attendance", (req, res) => {
    const { records, date } = req.body;
    
    const deleteOld = db.prepare("DELETE FROM attendance WHERE date = ? AND student_id IN (SELECT id FROM students WHERE stage = ?)");
    const insert = db.prepare("INSERT INTO attendance (student_id, date, status) VALUES (?, ?, ?)");
    
    // We need the stage to delete correctly if we are updating a specific stage's attendance
    const stage = req.body.stage;

    const transaction = db.transaction((data) => {
      deleteOld.run(date, stage);
      for (const record of data) {
        insert.run(record.studentId, date, record.status);
      }
    });

    try {
      transaction(records);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.get("/api/attendance/history", (req, res) => {
    const { date, stage } = req.query;
    const records = db.prepare(`
      SELECT a.* FROM attendance a
      JOIN students s ON a.student_id = s.id
      WHERE a.date = ? AND s.stage = ?
    `).all(date, stage);
    res.json(records);
  });

  app.get("/api/attendance/summary", (req, res) => {
    const { date } = req.query;
    const summary = db.prepare(`
      SELECT 
        s.stage,
        COUNT(CASE WHEN a.status = 'present' THEN 1 END) as present_count,
        COUNT(CASE WHEN a.status = 'absent' THEN 1 END) as absent_count,
        (SELECT COUNT(*) FROM students s2 WHERE s2.stage = s.stage) as total_students
      FROM students s
      LEFT JOIN attendance a ON s.id = a.student_id AND a.date = ?
      GROUP BY s.stage
    `).all(date);
    res.json(summary);
  });

  app.get("/api/attendance/monthly-summary", (req, res) => {
    const { month, stage } = req.query; // month format: YYYY-MM
    const summary = db.prepare(`
      SELECT 
        s.id,
        s.name,
        s.class_name as className,
        COUNT(CASE WHEN a.status = 'present' THEN 1 END) as present_count,
        COUNT(CASE WHEN a.status = 'absent' THEN 1 END) as absent_count
      FROM students s
      LEFT JOIN attendance a ON s.id = a.student_id AND a.date LIKE ?
      WHERE s.stage = ?
      GROUP BY s.id
      ORDER BY s.name ASC
    `).all(`${month}%`, stage);
    res.json(summary);
  });

  app.get("/api/attendance/absent-students", (req, res) => {
    const { date, stage } = req.query;
    const students = db.prepare(`
      SELECT s.name, s.class_name as className
      FROM students s
      JOIN attendance a ON s.id = a.student_id
      WHERE a.date = ? AND s.stage = ? AND a.status = 'absent'
      ORDER BY s.name ASC
    `).all(date, stage);
    res.json(students);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
