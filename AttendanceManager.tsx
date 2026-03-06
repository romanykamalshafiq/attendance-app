import React, { useState, useEffect, useRef } from 'react';
import { Check, X, Save, Share2, Download, Search } from 'lucide-react';
import { Student, Stage, AttendanceRecord } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { toPng } from 'html-to-image';
import toast from 'react-hot-toast';

interface AttendanceManagerProps {
  stage: Stage;
  stageLabel: string;
}

export const AttendanceManager: React.FC<AttendanceManagerProps> = ({ stage, stageLabel }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<Record<number, 'present' | 'absent'>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [filter, setFilter] = useState<'all' | 'present' | 'absent'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showSaveConfirmation, setShowSaveConfirmation] = useState(false);
  const summaryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchData();
  }, [stage, selectedDate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [studentsRes, historyRes] = await Promise.all([
        fetch(`/api/students?stage=${stage}`),
        fetch(`/api/attendance/history?date=${selectedDate}&stage=${stage}`)
      ]);
      
      const studentsData = await studentsRes.json();
      const historyData = await historyRes.json();
      
      setStudents(studentsData);
      
      const attendanceMap: Record<number, 'present' | 'absent'> = {};
      historyData.forEach((record: any) => {
        attendanceMap[record.student_id] = record.status;
      });
      setAttendance(attendanceMap);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleAttendance = (studentId: number, status: 'present' | 'absent') => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: prev[studentId] === status ? undefined : status as any
    }));
  };

  const handleSaveClick = () => {
    const absentCount = Object.values(attendance).filter(s => s === 'absent').length;
    if (absentCount > 0) {
      setShowSaveConfirmation(true);
    } else {
      saveAttendance();
    }
  };

  const saveAttendance = async () => {
    setShowSaveConfirmation(false);
    setSaving(true);
    const records = Object.entries(attendance)
      .filter(([_, status]) => status !== undefined)
      .map(([studentId, status]) => ({
        studentId: parseInt(studentId),
        status
      }));

    try {
      const response = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ records, date: selectedDate, stage }),
      });
      
      if (response.ok) {
        toast.success('تم حفظ الحضور بنجاح');
      } else {
        toast.error('حدث خطأ أثناء حفظ الحضور');
      }
    } catch (error) {
      console.error('Error saving attendance:', error);
      toast.error('خطأ في الاتصال بالسيرفر');
    } finally {
      setSaving(false);
    }
  };

  const shareToWhatsApp = async () => {
    const toastId = toast.loading('جاري تحضير التقرير...');
    
    const presentCount = Object.values(attendance).filter(s => s === 'present').length;
    const totalCount = students.length;
    const absentCount = totalCount - presentCount;
    const absentStudents = students.filter(s => attendance[s.id] === 'absent' || attendance[s.id] === undefined);

    const absentListText = absentStudents.length > 0 
      ? `\n\nقائمة الغائبين:\n${absentStudents.map((s, i) => `${i+1}. ${s.name}`).join('\n')}`
      : '\n\nلا يوجد غياب اليوم!';

    const text = `تقرير حضور كنيسة القديس اباهور\nالمرحلة: ${stageLabel}\nالتاريخ: ${selectedDate}\n\nعدد الحضور: ${presentCount}\nعدد الغياب: ${absentCount}\nالإجمالي: ${totalCount}${absentListText}`;

    let dataUrl = '';
    try {
      if (summaryRef.current) {
        dataUrl = await toPng(summaryRef.current, { 
          backgroundColor: '#fff', 
          quality: 0.8,
          cacheBust: true,
          pixelRatio: 2,
        });
      }
    } catch (err) {
      console.error('Image generation failed:', err);
      // We continue even if image fails, we'll just share text
    }

    try {
      // Try native share first (better for mobile)
      if (navigator.share) {
        const shareData: any = {
          title: 'تقرير الحضور',
          text: text,
        };

        if (dataUrl) {
          try {
            const res = await fetch(dataUrl);
            const blob = await res.blob();
            const file = new File([blob], `attendance-${selectedDate}.png`, { type: 'image/png' });
            if (navigator.canShare && navigator.canShare({ files: [file] })) {
              shareData.files = [file];
            }
          } catch (fileErr) {
            console.error('File preparation failed:', fileErr);
          }
        }

        await navigator.share(shareData);
        toast.success('تمت المشاركة بنجاح', { id: toastId });
        return;
      }

      // Fallback: WhatsApp URL
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
      const opened = window.open(whatsappUrl, '_blank');
      
      if (!opened) {
        // Final fallback: Copy to clipboard
        await navigator.clipboard.writeText(text);
        toast.success('تم نسخ التقرير! يمكنك لصقه في واتساب الآن.', { id: toastId, duration: 5000 });
      } else {
        toast.success('تم فتح واتساب بنجاح', { id: toastId });
      }

      // If we have an image, download it as a backup
      if (dataUrl) {
        const link = document.createElement('a');
        link.download = `حضور_${stageLabel}_${selectedDate}.png`;
        link.href = dataUrl;
        link.click();
      }
    } catch (err) {
      console.error('Share failed:', err);
      // Final attempt: Copy to clipboard
      try {
        await navigator.clipboard.writeText(text);
        toast.success('تم نسخ التقرير! يمكنك لصقه في واتساب الآن.', { id: toastId, duration: 5000 });
      } catch (clipErr) {
        toast.error('فشلت المشاركة. يرجى المحاولة مرة أخرى.', { id: toastId });
      }
    }
  };

  const exportDailyToCSV = () => {
    if (students.length === 0) return;

    const headers = ['الاسم', 'الفصل', 'الحالة'];
    const rows = students.map(student => {
      const status = attendance[student.id];
      const statusLabel = status === 'present' ? 'حضور' : status === 'absent' ? 'غياب' : 'غير مسجل';
      return [
        student.name,
        student.className || '',
        statusLabel
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // Add BOM for Excel UTF-8 support
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `حضور_${stageLabel}_${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) return <div className="p-10 text-center">جاري التحميل...</div>;

  if (students.length === 0) return null;

  const presentCount = Object.values(attendance).filter(s => s === 'present').length;
  const absentCount = Object.values(attendance).filter(s => s === 'absent').length;
  const unrecordedCount = students.length - (presentCount + absentCount);

  const filteredStudents = students.filter(student => {
    const matchesFilter = 
      filter === 'all' || 
      (filter === 'present' && attendance[student.id] === 'present') ||
      (filter === 'absent' && attendance[student.id] === 'absent');
    
    const matchesSearch = 
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (student.className && student.className.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-bold text-slate-800">{stageLabel}</h2>
          <input 
            type="date" 
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="text-xs text-indigo-600 font-bold bg-indigo-50 px-2 py-1 rounded-lg border-none focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>
        <div className="text-right">
          <p className="text-2xl font-black text-indigo-600">{presentCount} / {students.length}</p>
          <p className="text-xs text-slate-400 uppercase tracking-wider">حضور / إجمالي</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input
          type="text"
          placeholder="بحث باسم المخدوم..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pr-10 pl-4 py-3 bg-white border border-slate-100 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm"
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex p-1 bg-slate-100 rounded-xl">
        <button
          onClick={() => setFilter('all')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
            filter === 'all' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'
          }`}
        >
          الكل ({students.length})
        </button>
        <button
          onClick={() => setFilter('present')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
            filter === 'present' ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-500'
          }`}
        >
          حضور ({presentCount})
        </button>
        <button
          onClick={() => setFilter('absent')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
            filter === 'absent' ? 'bg-rose-500 text-white shadow-sm' : 'text-slate-500'
          }`}
        >
          غياب ({absentCount})
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-32">
        {filteredStudents.length > 0 ? (
          filteredStudents.map((student, index) => (
            <motion.div
              layout
              key={student.id}
              className={`flex items-center justify-between p-4 rounded-2xl shadow-sm border border-slate-100 hover:border-indigo-200 transition-colors ${
                index % 2 === 0 ? 'bg-white' : 'bg-slate-50'
              }`}
            >
              <div>
                <p className="font-medium text-slate-800">{student.name}</p>
                {student.className && <p className="text-xs text-slate-400">{student.className}</p>}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => toggleAttendance(student.id, 'present')}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                    attendance[student.id] === 'present'
                      ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200 scale-110'
                      : 'bg-slate-100 text-slate-400 hover:bg-emerald-50'
                  }`}
                >
                  <Check size={20} />
                </button>
                <button
                  onClick={() => toggleAttendance(student.id, 'absent')}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                    attendance[student.id] === 'absent'
                      ? 'bg-rose-500 text-white shadow-lg shadow-rose-200 scale-110'
                      : 'bg-slate-100 text-slate-400 hover:bg-rose-50'
                  }`}
                >
                  <X size={20} />
                </button>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="p-10 text-center text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">
            لا يوجد مخدومين في هذا التصنيف
          </div>
        )}
      </div>

      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex flex-wrap justify-center gap-3 bg-white/80 backdrop-blur-md p-3 rounded-3xl sm:rounded-full shadow-2xl border border-white/20 z-50 w-[90%] sm:w-auto">
        <button
          onClick={handleSaveClick}
          disabled={saving}
          className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl sm:rounded-full hover:bg-indigo-700 transition-all shadow-lg active:scale-95 disabled:opacity-50 text-sm"
        >
          <Save size={20} />
          {saving ? 'جاري الحفظ...' : 'حفظ الغياب'}
        </button>
        <button
          onClick={exportDailyToCSV}
          className="flex items-center justify-center w-12 h-12 bg-slate-100 text-slate-600 rounded-2xl sm:rounded-full hover:bg-slate-200 transition-all shadow-lg active:scale-95"
          title="تصدير CSV"
        >
          <Download size={20} />
        </button>
        <button
          onClick={shareToWhatsApp}
          className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-2xl sm:rounded-full hover:bg-emerald-700 transition-all shadow-lg active:scale-95 text-sm"
        >
          <Share2 size={20} />
          مشاركة
        </button>
      </div>

      {/* Hidden summary for image generation */}
      <div className="fixed -left-[9999px] top-0">
        <div 
          ref={summaryRef} 
          className="w-[400px] p-8 bg-white text-slate-900 font-sans"
          dir="rtl"
        >
          <div className="text-center mb-8 border-b pb-6 flex flex-col items-center">
            <img 
              src="https://storage.googleapis.com/generativeai-downloads/images/input_file_0.png" 
              alt="Logo" 
              className="w-20 h-20 object-contain mb-4"
              referrerPolicy="no-referrer"
              crossOrigin="anonymous"
            />
            <h1 className="text-2xl font-bold mb-2">التربية الكنسية دير القديس اباهور</h1>
            <p className="text-slate-500">تقرير الحضور والغياب اليومي</p>
          </div>
          
          <div className="space-y-4 mb-8">
            <div className="flex justify-between border-b py-2">
              <span className="text-slate-500">المرحلة:</span>
              <span className="font-bold">{stageLabel}</span>
            </div>
            <div className="flex justify-between border-b py-2">
              <span className="text-slate-500">التاريخ:</span>
              <span className="font-bold">{selectedDate}</span>
            </div>
            <div className="flex justify-between border-b py-2">
              <span className="text-slate-500">عدد الحضور:</span>
              <span className="font-bold text-emerald-600">{presentCount}</span>
            </div>
            <div className="flex justify-between border-b py-2">
              <span className="text-slate-500">عدد الغياب:</span>
              <span className="font-bold text-rose-600">{students.length - presentCount}</span>
            </div>
            <div className="flex justify-between border-b py-2 bg-slate-50 px-2">
              <span className="text-slate-500">الإجمالي:</span>
              <span className="font-bold">{students.length}</span>
            </div>
          </div>

          <div className="text-center text-xs text-slate-400 mt-10">
            تم الاستخراج بواسطة نظام حضور كنيسة القديس اباهور
          </div>
        </div>
      </div>

      {/* Save Confirmation Modal */}
      <AnimatePresence>
        {showSaveConfirmation && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSaveConfirmation(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 text-center border-b border-slate-50">
                <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <X size={32} />
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-1">تأكيد الغياب الجماعي</h3>
                <p className="text-slate-500 text-sm">
                  أنت على وشك تسجيل <span className="font-bold text-rose-600">{absentCount} مخدومين</span> كغائبين اليوم.
                </p>
              </div>
              
              <div className="max-h-[30vh] overflow-y-auto p-4 bg-slate-50/50">
                <p className="text-[10px] text-slate-400 font-bold uppercase mb-2 px-2">قائمة الغائبين:</p>
                <div className="space-y-1">
                  {students
                    .filter(s => attendance[s.id] === 'absent')
                    .map(s => (
                      <div key={s.id} className="px-3 py-2 bg-white rounded-xl text-xs text-slate-700 border border-slate-100">
                        {s.name}
                      </div>
                    ))}
                </div>
              </div>

              <div className="p-6 flex gap-3">
                <button
                  onClick={saveAttendance}
                  className="flex-1 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all active:scale-95"
                >
                  حفظ الكل
                </button>
                <button
                  onClick={() => setShowSaveConfirmation(false)}
                  className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all active:scale-95"
                >
                  تعديل
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
