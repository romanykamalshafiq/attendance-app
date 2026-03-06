import React, { useState } from 'react';
import { STAGES, Stage } from './types';
import { AttendanceManager } from './components/AttendanceManager';
import { AttendanceSummary } from './components/AttendanceSummary';
import { StudentMonthlySummary } from './components/StudentMonthlySummary';
import { DataManagement } from './components/DataManagement';
import { Church, Users, ChevronLeft, LayoutDashboard, BarChart3, Settings, Baby, GraduationCap, School } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Toaster } from 'react-hot-toast';

const STAGE_GROUPS = [
  {
    id: 'nursery',
    label: 'حضانة',
    icon: <Baby size={24} />,
    stages: [
      { id: 'nursery-junior', label: 'صغرى' },
      { id: 'nursery-senior', label: 'كبرى' },
    ]
  },
  {
    id: 'grade1',
    label: 'أولى ابتدائي',
    icon: <GraduationCap size={24} />,
    stages: [
      { id: 'grade1-boys', label: 'أولاد' },
      { id: 'grade1-girls', label: 'بنات' },
    ]
  },
  {
    id: 'grade2',
    label: 'تانية ابتدائي',
    icon: <School size={24} />,
    stages: [
      { id: 'grade2-boys', label: 'أولاد' },
      { id: 'grade2-girls', label: 'بنات' },
    ]
  },
  {
    id: 'grade3',
    label: 'تالتة ابتدائي',
    icon: <School size={24} />,
    stages: [
      { id: 'grade3-boys', label: 'أولاد' },
      { id: 'grade3-girls', label: 'بنات' },
    ]
  },
  {
    id: 'grade4',
    label: 'رابعة ابتدائي',
    icon: <School size={24} />,
    stages: [
      { id: 'grade4-boys', label: 'أولاد' },
      { id: 'grade4-girls', label: 'بنات' },
    ]
  },
  {
    id: 'grade5',
    label: 'خامسة ابتدائي',
    icon: <School size={24} />,
    stages: [
      { id: 'grade5-boys', label: 'أولاد' },
      { id: 'grade5-girls', label: 'بنات' },
    ]
  },
  {
    id: 'grade6',
    label: 'سادسة ابتدائي',
    icon: <School size={24} />,
    stages: [
      { id: 'grade6-boys', label: 'أولاد' },
      { id: 'grade6-girls', label: 'بنات' },
    ]
  },
];

export default function App() {
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [selectedStage, setSelectedStage] = useState<Stage | null>(null);
  const [view, setView] = useState<'attendance' | 'summary' | 'monthly' | 'settings'>('attendance');

  const currentStageLabel = STAGES.find(s => s.id === selectedStage)?.label || '';
  const currentGroup = STAGE_GROUPS.find(g => g.id === selectedGroup);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-24" dir="rtl">
      <Toaster 
        position="top-center"
        toastOptions={{
          style: {
            borderRadius: '16px',
            background: '#fff',
            color: '#1e293b',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            fontFamily: 'inherit',
            fontSize: '14px',
            fontWeight: '600',
          },
        }}
      />
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center overflow-hidden shadow-md border border-slate-100">
              <img 
                src="https://storage.googleapis.com/generativeai-downloads/images/input_file_0.png" 
                alt="Logo" 
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight">التربية الكنسية</h1>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">دير القديس اباهور البهجورى</p>
            </div>
          </div>
          
          {(selectedStage || selectedGroup || view === 'summary' || view === 'settings') && (
            <button 
              onClick={() => {
                if (selectedStage) {
                  setSelectedStage(null);
                  setView('attendance');
                } else if (selectedGroup) {
                  setSelectedGroup(null);
                } else {
                  setView('attendance');
                }
              }}
              className="p-2 hover:bg-slate-100 rounded-full transition-colors"
            >
              <ChevronLeft className="rotate-180" />
            </button>
          )}
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        <AnimatePresence mode="wait">
          {!selectedStage && view !== 'summary' && view !== 'settings' ? (
            <motion.div
              key={selectedGroup ? `sub-stages-${selectedGroup}` : 'group-selection'}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              <div className="flex justify-between items-end mb-8">
                <div>
                  <h2 className="text-2xl font-black text-slate-800 mb-2">
                    {selectedGroup ? currentGroup?.label : 'اختر المرحلة'}
                  </h2>
                  <p className="text-slate-500">
                    {selectedGroup ? 'اختر القسم الفرعي لتسجيل الحضور' : 'سجل حضور وغياب المخدومين اليوم'}
                  </p>
                </div>
                {!selectedGroup && (
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setView('summary')}
                      className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-bold hover:bg-indigo-100 transition-colors"
                    >
                      <LayoutDashboard size={16} />
                      الملخص
                    </button>
                    <button 
                      onClick={() => setView('settings')}
                      className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-200 transition-colors"
                    >
                      <Settings size={16} />
                      الإعدادات
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {!selectedGroup ? (
                  STAGE_GROUPS.map((group, index) => (
                    <motion.button
                      key={group.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => setSelectedGroup(group.id)}
                      className="group relative overflow-hidden p-6 bg-white rounded-3xl shadow-sm border border-slate-100 text-right hover:shadow-xl hover:shadow-indigo-500/10 hover:border-indigo-200 transition-all active:scale-[0.98] flex flex-row-reverse sm:flex-col items-center sm:items-start justify-between sm:justify-start gap-4"
                    >
                      <div className="w-12 h-12 bg-indigo-50 text-indigo-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
                        {group.icon}
                      </div>
                      <div className="relative z-10">
                        <h3 className="text-base font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                          {group.label}
                        </h3>
                        <p className="text-[10px] text-slate-400 mt-1">{group.stages.length} أقسام</p>
                      </div>
                    </motion.button>
                  ))
                ) : (
                  currentGroup?.stages.map((stage, index) => (
                    <motion.button
                      key={stage.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => setSelectedStage(stage.id as Stage)}
                      className="group relative overflow-hidden p-5 bg-white rounded-2xl shadow-sm border border-slate-100 text-right hover:shadow-lg hover:shadow-indigo-500/10 hover:border-indigo-200 transition-all active:scale-[0.98]"
                    >
                      <div className="relative z-10">
                        <h3 className="text-base font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                          {stage.label}
                        </h3>
                        <p className="text-[10px] text-slate-400 mt-1">تسجيل الحضور</p>
                      </div>
                    </motion.button>
                  ))
                )}
              </div>
            </motion.div>
          ) : view === 'summary' ? (
            <motion.div
              key="summary-view"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <AttendanceSummary />
            </motion.div>
          ) : view === 'settings' ? (
            <motion.div
              key="settings-view"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <DataManagement />
            </motion.div>
          ) : (
            <motion.div
              key="stage-detail"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {/* View Toggle */}
              <div className="flex p-1 bg-slate-200 rounded-2xl">
                <button
                  onClick={() => setView('attendance')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-[10px] font-bold transition-all ${
                    view === 'attendance' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'
                  }`}
                >
                  <Users size={14} />
                  تسجيل الحضور
                </button>
                <button
                  onClick={() => setView('monthly')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-[10px] font-bold transition-all ${
                    view === 'monthly' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'
                  }`}
                >
                  <BarChart3 size={14} />
                  تقرير الشهر
                </button>
              </div>

              {view === 'attendance' ? (
                <AttendanceManager 
                  stage={selectedStage!} 
                  stageLabel={currentStageLabel} 
                />
              ) : (
                <StudentMonthlySummary 
                  stage={selectedStage!} 
                  stageLabel={currentStageLabel} 
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer Branding */}
      {!selectedStage && view !== 'summary' && (
        <footer className="mt-12 text-center text-slate-300 pb-10">
          <p className="text-[10px] uppercase tracking-[0.3em]">St. Abahor Al-Bahgouri Church</p>
        </footer>
      )}
    </div>
  );
}
