import React, { useState } from 'react';
import { Trash2, AlertTriangle, RefreshCcw, Calendar, Users, Layers, FileUp } from 'lucide-react';
import { STAGES } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { BulkExcelUploader } from './BulkExcelUploader';
import toast from 'react-hot-toast';

export const DataManagement: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [confirmStage, setConfirmStage] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [confirmDateStage, setConfirmDateStage] = useState<string | null>(null);
  const [showBulkUpload, setShowBulkUpload] = useState(false);

  const deleteStageData = async (stageId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/students/stage?stage=${stageId}`, { method: 'DELETE' });
      if (response.ok) {
        toast.success('تم حذف جميع بيانات المرحلة بنجاح');
        setConfirmStage(null);
      } else {
        toast.error('حدث خطأ أثناء حذف البيانات');
      }
    } catch (error) {
      console.error('Error deleting stage data:', error);
      toast.error('خطأ في الاتصال بالسيرفر');
    } finally {
      setLoading(false);
    }
  };

  const deleteDayAttendance = async (stageId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/attendance/day?date=${selectedDate}&stage=${stageId}`, { method: 'DELETE' });
      if (response.ok) {
        toast.success(`تم حذف غياب يوم ${selectedDate} بنجاح`);
        setConfirmDateStage(null);
      } else {
        toast.error('حدث خطأ أثناء حذف الغياب');
      }
    } catch (error) {
      console.error('Error deleting day attendance:', error);
      toast.error('خطأ في الاتصال بالسيرفر');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
            <AlertTriangle size={20} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">إدارة البيانات</h2>
            <p className="text-xs text-slate-400">حذف وإعادة ضبط البيانات المسجلة</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Bulk Upload Section */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-700 font-bold text-sm">
                <Layers size={16} className="text-indigo-500" />
                <h3>رفع جميع المراحل دفعة واحدة</h3>
              </div>
              <button 
                onClick={() => setShowBulkUpload(!showBulkUpload)}
                className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg hover:bg-indigo-100 transition-colors"
              >
                {showBulkUpload ? 'إخفاء' : 'إظهار'}
              </button>
            </div>
            
            <AnimatePresence>
              {showBulkUpload && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <BulkExcelUploader />
                </motion.div>
              )}
            </AnimatePresence>
          </section>

          <hr className="border-slate-100" />

          {/* Delete Day Attendance */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-slate-700 font-bold text-sm">
              <Calendar size={16} className="text-indigo-500" />
              <h3>حذف غياب يوم محدد</h3>
            </div>
            
            <div className="bg-slate-50 p-4 rounded-2xl space-y-4">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase">اختر التاريخ</label>
                <input 
                  type="date" 
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full p-3 bg-white rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                {STAGES.map(stage => (
                  <button
                    key={stage.id}
                    onClick={() => setConfirmDateStage(stage.id)}
                    className="p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:border-rose-200 hover:text-rose-600 transition-all"
                  >
                    {stage.label}
                  </button>
                ))}
              </div>
            </div>
          </section>

          <hr className="border-slate-100" />

          {/* Delete All Stage Data */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-slate-700 font-bold text-sm">
              <Users size={16} className="text-indigo-500" />
              <h3>حذف المرحلة بالكامل (الطلاب والغياب)</h3>
            </div>
            
            <div className="grid grid-cols-1 gap-2">
              {STAGES.map(stage => (
                <button
                  key={stage.id}
                  onClick={() => setConfirmStage(stage.id)}
                  className="flex items-center justify-between p-4 bg-rose-50/50 border border-rose-100 rounded-2xl text-right group hover:bg-rose-50 transition-all"
                >
                  <div>
                    <p className="text-sm font-bold text-rose-700">{stage.label}</p>
                    <p className="text-[10px] text-rose-400">حذف جميع المخدومين وسجلاتهم</p>
                  </div>
                  <Trash2 size={18} className="text-rose-300 group-hover:text-rose-500 transition-colors" />
                </button>
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* Confirmation Modals */}
      <AnimatePresence>
        {confirmStage && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setConfirmStage(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-xs bg-white rounded-3xl shadow-2xl p-6 text-center"
            >
              <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={32} />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">تأكيد الحذف النهائي</h3>
              <p className="text-slate-500 text-sm mb-6">
                هل أنت متأكد من حذف جميع بيانات <span className="font-bold text-rose-600">{STAGES.find(s => s.id === confirmStage)?.label}</span>؟
                <br />
                <span className="text-[10px] text-rose-400 mt-2 block">سيتم حذف جميع الطلاب وسجلات غيابهم نهائياً.</span>
              </p>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => deleteStageData(confirmStage)}
                  disabled={loading}
                  className="w-full py-3 bg-rose-600 text-white rounded-2xl font-bold hover:bg-rose-700 transition-all active:scale-95 disabled:opacity-50"
                >
                  {loading ? 'جاري الحذف...' : 'نعم، احذف كل شيء'}
                </button>
                <button
                  onClick={() => setConfirmStage(null)}
                  className="w-full py-3 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all"
                >
                  إلغاء
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {confirmDateStage && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setConfirmDateStage(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-xs bg-white rounded-3xl shadow-2xl p-6 text-center"
            >
              <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar size={32} />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">حذف غياب اليوم</h3>
              <p className="text-slate-500 text-sm mb-6">
                هل تريد حذف سجلات غياب يوم <span className="font-bold text-slate-800">{selectedDate}</span> لمرحلة <span className="font-bold text-indigo-600">{STAGES.find(s => s.id === confirmDateStage)?.label}</span>؟
              </p>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => deleteDayAttendance(confirmDateStage)}
                  disabled={loading}
                  className="w-full py-3 bg-amber-600 text-white rounded-2xl font-bold hover:bg-amber-700 transition-all active:scale-95 disabled:opacity-50"
                >
                  {loading ? 'جاري الحذف...' : 'تأكيد الحذف'}
                </button>
                <button
                  onClick={() => setConfirmDateStage(null)}
                  className="w-full py-3 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all"
                >
                  إلغاء
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
