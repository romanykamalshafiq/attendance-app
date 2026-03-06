import React, { useState, useEffect } from 'react';
import { Stage } from '../types';
import { Calendar, Users, CheckCircle2, XCircle, Search, Download } from 'lucide-react';
import { motion } from 'motion/react';

interface StudentMonthlySummaryProps {
  stage: Stage;
  stageLabel: string;
}

export const StudentMonthlySummary: React.FC<StudentMonthlySummaryProps> = ({ stage, stageLabel }) => {
  const [summary, setSummary] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchMonthlySummary();
  }, [stage, selectedMonth]);

  const fetchMonthlySummary = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/attendance/monthly-summary?month=${selectedMonth}&stage=${stage}`);
      const data = await response.json();
      setSummary(data);
    } catch (error) {
      console.error('Error fetching monthly summary:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (summary.length === 0) return;

    const headers = ['الاسم', 'الفصل', 'عدد الحضور', 'عدد الغياب'];
    const rows = summary.map(item => [
      item.name,
      item.className || '',
      item.present_count,
      item.absent_count
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // Add BOM for Excel UTF-8 support
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `تقرير_غياب_${stageLabel}_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredSummary = summary.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (item.className && item.className.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-800">تقرير الشهر</h2>
              <p className="text-xs text-slate-400">{stageLabel}</p>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <button
                onClick={exportToCSV}
                disabled={loading || summary.length === 0}
                className="flex-1 sm:flex-none flex items-center justify-center p-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-colors disabled:opacity-50"
                title="تصدير CSV"
              >
                <Download size={20} />
                <span className="sm:hidden mr-2 text-xs font-bold">تصدير</span>
              </button>
              <input 
                type="month" 
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="flex-1 sm:flex-none text-sm text-indigo-600 font-bold bg-indigo-50 px-3 py-2 rounded-xl border-none focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>

          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="بحث باسم المخدوم..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-10 pl-4 py-3 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="p-10 text-center text-slate-400">جاري تحميل التقرير...</div>
        ) : filteredSummary.length > 0 ? (
          filteredSummary.map((item, index) => (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              key={item.id}
              className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between"
            >
              <div className="flex-1">
                <h3 className="font-bold text-slate-800 text-sm">{item.name}</h3>
                {item.className && <p className="text-[10px] text-slate-400 mt-0.5">{item.className}</p>}
              </div>
              
              <div className="flex gap-3">
                <div className="flex flex-col items-center px-3 py-1 bg-emerald-50 rounded-xl min-w-[50px]">
                  <span className="text-sm font-black text-emerald-600 leading-none">{item.present_count}</span>
                  <span className="text-[8px] text-emerald-400 font-bold uppercase">حضور</span>
                </div>
                <div className="flex flex-col items-center px-3 py-1 bg-rose-50 rounded-xl min-w-[50px]">
                  <span className="text-sm font-black text-rose-600 leading-none">{item.absent_count}</span>
                  <span className="text-[8px] text-rose-400 font-bold uppercase">غياب</span>
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="p-10 text-center text-slate-400 bg-white rounded-3xl border border-dashed border-slate-200">
            {searchTerm ? 'لا توجد نتائج للبحث' : 'لا توجد بيانات لهذا الشهر'}
          </div>
        )}
      </div>
    </div>
  );
};
