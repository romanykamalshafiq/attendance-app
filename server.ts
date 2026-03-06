import express from "express";
import { createServer as createViteServer } from "vite";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// --- 1. إعدادات MongoDB ---
// استبدل الرابط التالي برابط MongoDB Atlas الخاص بك
const MONGO_URI = "mongodb+srv://robbenmarkos_db_user:jMPp6g6JbRSJ7HZp@cluster0.gdopuh3.mongodb.net/?appName=Cluster0";

mongoose.connect(MONGO_URI)
  .then(() => console.log("✅ متصل بـ MongoDB Atlas بنجاح"))
  .catch(err => console.error("❌ فشل الاتصال بـ MongoDB:", err));

// --- 2. تعريف الموديلات (Schemas) ---
const studentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  stage: { type: String, required: true },
  class_name: String
});

const attendanceSchema = new mongoose.Schema({
  student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  date: { type: String, required: true }, // Format: YYYY-MM-DD
  status: { type: String, enum: ['present', 'absent'], required: true }
});

const Student = mongoose.model('Student', studentSchema);
const Attendance = mongoose.model('Attendance', attendanceSchema);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(express.json({ limit: '50mb' }));

  // --- 3. الـ API Routes ---

  // جلب الطلاب حسب المرحلة
  app.get("/api/students", async (req, res) => {
    const { stage } = req.query;
    try {
      const query = stage ? { stage } : {};
      const students = await Student.find(query);
      res.json(students);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // حذف حضور يوم معين لمرحلة معينة
  app.delete("/api/attendance/day", async (req, res) => {
    const { date, stage } = req.query;
    try {
      const studentsInStage = await Student.find({ stage }, '_id');
      const studentIds = studentsInStage.map(s => s._id);
      await Attendance.deleteMany({ date, student_id: { $in: studentIds } });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // رفع جماعي للطلاب (يمسح المرحلة القديمة ويضيف الجديد)
  app.post("/api/students/bulk-upload", async (req, res) => {
    const { students } = req.body;
    try {
      const stagesInFile = [...new Set(students.map((s: any) => s.stage))];
      
      // حذف الطلاب القدامى وحضورهم للمراحل الموجودة في الملف
      const oldStudents = await Student.find({ stage: { $in: stagesInFile } }, '_id');
      const oldStudentIds = oldStudents.map(s => s._id);
      
      await Attendance.deleteMany({ student_id: { $in: oldStudentIds } });
      await Student.deleteMany({ stage: { $in: stagesInFile } });

      // إضافة الطلاب الجدد
      const docs = students.map((s: any) => ({
        name: s.name,
        stage: s.stage,
        class_name: s.className || ''
      }));
      await Student.insertMany(docs);

      res.json({ success: true, message: `تم رفع ${students.length} طالب بنجاح` });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // تسجيل الحضور
  app.post("/api/attendance", async (req, res) => {
    const { records, date, stage } = req.body;
    try {
      // حذف السجلات القديمة لنفس اليوم والمرحلة
      const studentsInStage = await Student.find({ stage }, '_id');
      const studentIds = studentsInStage.map(s => s._id);
      await Attendance.deleteMany({ date, student_id: { $in: studentIds } });

      // إضافة السجلات الجديدة
      const docs = records.map((r: any) => ({
        student_id: r.studentId,
        date,
        status: r.status
      }));
      await Attendance.insertMany(docs);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // ملخص الغياب والحضور لمرحلة (شهري)
  app.get("/api/attendance/monthly-summary", async (req, res) => {
    const { month, stage } = req.query;
    try {
      const students = await Student.find({ stage }).sort({ name: 1 });
      const summary = await Promise.all(students.map(async (student) => {
        const attendance = await Attendance.find({
          student_id: student._id,
          date: { $regex: `^${month}` }
        });
        return {
          id: student._id,
          name: student.name,
          className: student.class_name,
          present_count: attendance.filter(a => a.status === 'present').length,
          absent_count: attendance.filter(a => a.status === 'absent').length
        };
      }));
      res.json(summary);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // --- 4. تشغيل Vite أو ملفات الإنتاج ---
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
    console.log(`🚀 السيرفر يعمل على منفذ: ${PORT}`);
  });
}

startServer();
