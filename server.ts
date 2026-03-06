import express from "express";
import { createServer as createViteServer } from "vite";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// --- 1. إعدادات MongoDB Atlas ---
// هذا الرابط يحتوي على اسم المستخدم وكلمة المرور الصحيحة التي استخرجناها من لقطات الشاشة الخاصة بك
const MONGO_URI = "mongodb+srv://robbenmarkos_db_user:jMPp6gJbRSJ7HZp@cluster0.gdopuh3.mongodb.net/ChurchAttendance?retryWrites=true&w=majority&appName=Cluster0";

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
  date: { type: String, required: true }, // صيغة التاريخ: YYYY-MM-DD
  status: { type: String, enum: ['present', 'absent'], required: true }
});

const Student = mongoose.model('Student', studentSchema);
const Attendance = mongoose.model('Attendance', attendanceSchema);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(cors());
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

  // الرفع الجماعي للطلاب (Excel)
  app.post("/api/students/bulk-upload", async (req, res) => {
    const { students } = req.body;
    try {
      const stagesInFile = [...new Set(students.map((s: any) => s.stage))];
      
      const oldStudents = await Student.find({ stage: { $in: stagesInFile } }, '_id');
      const oldStudentIds = oldStudents.map(s => s._id);
      
      await Attendance.deleteMany({ student_id: { $in: oldStudentIds } });
      await Student.deleteMany({ stage: { $in: stagesInFile } });

      const docs = students.map((s: any) => ({
        name: s.name,
        stage: s.stage,
        class_name: s.className || ''
      }));
      await Student.insertMany(docs);

      res.json({ success: true, message: `تم رفع ${students.length} طالب بنجاح` });
    } catch (error) {
      res.status
