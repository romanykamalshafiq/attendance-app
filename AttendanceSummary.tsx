import React, { useState, useEffect } from 'react';
import { STAGES, Stage } from '../types';
import { LayoutDashboard, Calendar, Users, CheckCircle2, XCircle, X, Share2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const AttendanceSummary: React.FC = () => {
  const [summary, setSummary] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedStageForAbsents, setSelectedStageForAbsents] = useState<{ id: string, label: string } | null>(null);
  const [absentStudents, setAbsentStudents] = useState<any[]>([]);
  const [loadingAbsents, setLoadingAbsents] = useState(false);

  useEffect(() => {
    fetchSummary();
  }, [selectedDate]);

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/attendance/summary?date=${selectedDate}`);
      const data = await response.json();
      setSummary(data);
    } catch (error) {
      console.error('Error fetching summary:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAbsentStudents = async (stageId: string, stageLabel: string) => {
    setLoadingAbsents(true);
    setSelectedStageForAbsents({ id: stageId, label: stageLabel });
    try {
      const response = await fetch(`/api/attendance/absent-students?date=${selectedDate}&stage=${stageId}`);
      const data = await response.json();
      setAbsentStudents(data);
    } catch (error) {
      console.error('Error fetching absent students:', error);
    } finally {
      setLoadingAbsents(false);
    }
  };

  const shareViaWhatsApp = () => {
    if (!selectedStageForAbsents || absentStudents.length === 0) return;

    const sortedAbsents = [...absentStudents].sort((a, b) => a.name.localeCompare(b.name, 'ar'));
    
    let message = `*قائمة الغائبين*\n`;
    message += `*المرحلة:* ${selectedStageForAbsents.label}\n`;
    message += `*التاريخ:* ${selectedDate}\n`;
    message += `*العدد:* ${absentStudents.length}\n\n`;
    
    sortedAbsents.forEach((student, index) => {
      message += `${index + 1}. ${student.name}${student.className ? ` (${student.className})` : ''}\n`;
    });

    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
  };

  const getStageLabel = (stageId: string) => {
    return STAGES.find(s => s.id === stageId)?.label || stageId;
  };

  const totalPresent = summary.reduce((acc, curr) => acc + curr.present_count, 0);
  const totalAbsent = summary.reduce((acc, curr) => acc + curr.absent_count, 0);
  const totalStudents = summary.reduce((acc, curr) => acc + curr.total_students, 0);

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <LayoutDashboard size={20} />
            </div>
            <h2 className="text-xl font-bold text-slate-800">ملخص الحضور العام</h2>
          </div>
          <input 
            type="date" 
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="text-sm text-indigo-600 font-bold bg-indigo-50 px-3 py-2 rounded-xl border-none focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-50 p-4 rounded-2xl text-center flex sm:flex-col items-center justify-between sm:justify-center px-6 sm:px-4">
            <p className="text-2xl font-black text-slate-800 order-2 sm:order-1">{totalStudents}</p>
            <p className="text-[10px] text-slate-400 uppercase font-bold order-1 sm:order-2">الإجمالي</p>
          </div>
          <div className="bg-emerald-50 p-4 rounded-2xl text-center flex sm:flex-col items-center justify-between sm:justify-center px-6 sm:px-4">
            <p className="text-2xl font-black text-emerald-600 order-2 sm:order-1">{totalPresent}</p>
            <p className="text-[10px] text-emerald-400 uppercase font-bold order-1 sm:order-2">حضور</p>
          </div>
          <div className="bg-rose-50 p-4 rounded-2xl text-center flex sm:flex-col items-center justify-between sm:justify-center px-6 sm:px-4">
            <p className="text-2xl font-black text-rose-600 order-2 sm:order-1">{totalAbsent}</p>
            <p className="text-[10px] text-rose-400 uppercase font-bold order-1 sm:order-2">غياب</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="p-10 text-center text-slate-400">جاري تحميل الملخص...</div>
        ) : summary.length > 0 ? (
          summary.map((item, index) => (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              key={item.stage}
              className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-slate-800">{getStageLabel(item.stage)}</h3>
                <span className="text-xs font-mono text-slate-400 bg-slate-100 px-2 py-1 rounded-full">
                  {item.total_students} مخدوم
                </span>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 flex items-center gap-3 bg-emerald-50/50 p-3 rounded-2xl">
                  <CheckCircle2 className="text-emerald-500" size={18} />
                  <div>
                    <p className="text-lg font-black text-emerald-600 leading-none">{item.present_count}</p>
                    <p className="text-[10px] text-emerald-400 font-bold">حاضر</p>
                  </div>
                </div>
                <button 
                  onClick={() => item.absent_count > 0 && fetchAbsentStudents(item.stage, getStageLabel(item.stage))}
                  className={`flex-1 flex items-center gap-3 p-3 rounded-2xl transition-all active:scale-95 ${
                    item.absent_count > 0 
                      ? 'bg-rose-50/50 hover:bg-rose-100/50 cursor-pointer' 
                      : 'bg-slate-50/50 opacity-50 cursor-default'
                  }`}
                >
                  <XCircle className="text-rose-500" size={18} />
                  <div className="text-right">
                    <p className="text-lg font-black text-rose-600 leading-none">{item.absent_count}</p>
                    <p className="text-[10px] text-rose-400 font-bold">غائب (اضغط للتفاصيل)</p>
                  </div>
                </button>
              </div>

              {/* Progress Bar */}
              <div className="mt-4 h-2 bg-slate-100 rounded-full overflow-hidden flex">
                <div 
                  className="h-full bg-emerald-500 transition-all duration-500" 
                  style={{ width: `${(item.present_count / item.total_students) * 100}%` }}
                />
                <div 
                  className="h-full bg-rose-500 transition-all duration-500" 
                  style={{ width: `${(item.absent_count / item.total_students) * 100}%` }}
                />
              </div>
            </motion.div>
          ))
        ) : (
          <div className="p-10 text-center text-slate-400 bg-white rounded-3xl border border-dashed border-slate-200">
            لا توجد بيانات لهذا التاريخ
          </div>
        )}
      </div>

      {/* Absent Students Modal */}
      <AnimatePresence>
        {selectedStageForAbsents && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedStageForAbsents(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-rose-50/30">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">قائمة الغائبين</h3>
                  <p className="text-xs text-rose-600 font-medium">{selectedStageForAbsents.label} - {selectedDate}</p>
                </div>
                <button 
                  onClick={() => setSelectedStageForAbsents(null)}
                  className="p-2 hover:bg-white rounded-full transition-colors text-slate-400"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="max-h-[60vh] overflow-y-auto p-4">
                {loadingAbsents ? (
                  <div className="py-10 text-center text-slate-400">جاري التحميل...</div>
                ) : absentStudents.length > 0 ? (
                  <div className="space-y-2">
                    {[...absentStudents].sort((a, b) => a.name.localeCompare(b.name, 'ar')).map((student, i) => (
                      <div key={i} className="p-3 bg-slate-50 rounded-xl flex justify-between items-center">
                        <span className="font-medium text-slate-700">{student.name}</span>
                        {student.className && (
                          <span className="text-[10px] bg-white px-2 py-1 rounded-md text-slate-400 border border-slate-100">
                            {student.className}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-10 text-center text-slate-400 italic">لا يوجد غائبين مسجلين</div>
                )}
              </div>
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-4">
                <p className="text-xs text-slate-400 font-bold">إجمالي الغياب: {absentStudents.length}</p>
                {absentStudents.length > 0 && (
                  <button
                    onClick={shareViaWhatsApp}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-all shadow-md shadow-emerald-100 active:scale-95"
                  >
                    <Share2 size={14} />
                    مشاركة عبر واتساب
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
