import React, { useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import { Upload, FileSpreadsheet, Check, AlertCircle, Trash2, Layers, Download } from 'lucide-react';
import { Stage, STAGES } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import toast from 'react-hot-toast';

const getStageId = (label: string): Stage | undefined => {
  const normalized = label.trim().toLowerCase();
  
  // Nursery
  if (normalized.includes('حضانة')) {
    if (normalized.includes('صغرى') || normalized.includes('جونيور')) return 'nursery-junior';
    if (normalized.includes('كبرى') || normalized.includes('سينيور')) return 'nursery-senior';
  }
  
  // Grade 1
  if (normalized.includes('أولى') || normalized.includes('اولى') || normalized.includes('الصف الاول') || normalized.includes('الصف الأول')) {
    if (normalized.includes('بنات')) return 'grade1-girls';
    if (normalized.includes('أولاد') || normalized.includes('اولاد') || normalized.includes('بنين')) return 'grade1-boys';
  }
  
  // Grade 2
  if (normalized.includes('تانية') || normalized.includes('تانيه') || normalized.includes('ثانية') || normalized.includes('الصف الثاني')) {
    if (normalized.includes('بنات')) return 'grade2-girls';
    if (normalized.includes('أولاد') || normalized.includes('اولاد') || normalized.includes('بنين')) return 'grade2-boys';
  }
  
  // Grade 3
  if (normalized.includes('تالتة') || normalized.includes('تالته') || normalized.includes('ثالثة') || normalized.includes('الصف الثالث')) {
    if (normalized.includes('بنات')) return 'grade3-girls';
    if (normalized.includes('أولاد') || normalized.includes('اولاد') || normalized.includes('بنين')) return 'grade3-boys';
  }
  
  // Grade 4
  if (normalized.includes('رابعة') || normalized.includes('رابعه') || normalized.includes('رابع') || normalized.includes('الصف الرابع')) {
    if (normalized.includes('بنات')) return 'grade4-girls';
    if (normalized.includes('أولاد') || normalized.includes('اولاد') || normalized.includes('بنين')) return 'grade4-boys';
  }
  
  // Grade 5
  if (normalized.includes('خامسة') || normalized.includes('خامسه') || normalized.includes('خامس') || normalized.includes('الصف الخامس')) {
    if (normalized.includes('بنات')) return 'grade5-girls';
    if (normalized.includes('أولاد') || normalized.includes('اولاد') || normalized.includes('بنين')) return 'grade5-boys';
  }
  
  // Grade 6
  if (normalized.includes('سادسة') || normalized.includes('سادسه') || normalized.includes('سادس') || normalized.includes('الصف السادس')) {
    if (normalized.includes('بنات')) return 'grade6-girls';
    if (normalized.includes('أولاد') || normalized.includes('اولاد') || normalized.includes('بنين')) return 'grade6-boys';
  }

  // Fallback to exact mapping if any
  const exactMapping: Record<string, Stage> = {
    'حضانة صغرى': 'nursery-junior',
    'حضانة كبرى': 'nursery-senior',
    'أولى أولاد': 'grade1-boys',
    'أولى بنات': 'grade1-girls',
    'تانية أولاد': 'grade2-boys',
    'تانية بنات': 'grade2-girls',
    'تالتة أولاد': 'grade3-boys',
    'تالتة بنات': 'grade3-girls',
    'رابعة أولاد': 'grade4-boys',
    'رابعة بنات': 'grade4-girls',
    'خامسة أولاد': 'grade5-boys',
    'خامسة بنات': 'grade5-girls',
    'سادسة أولاد': 'grade6-boys',
    'سادسة بنات': 'grade6-girls',
  };
  
  return exactMapping[label.trim()] || STAGES.find(s => s.label === label.trim() || s.id === label.trim())?.id;
};

export const BulkExcelUploader: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const downloadTemplate = () => {
    const headers = [['الاسم', 'المرحلة', 'الفصل']];
    const exampleData = [
      ['مثال: جرجس سمير', 'أولى أولاد', 'فصل القديس اباهور'],
      ['مثال: مريم هاني', 'حضانة صغرى', 'فصل الملاك ميخائيل']
    ];
    
    const ws = XLSX.utils.aoa_to_sheet([...headers, ...exampleData]);
    
    // Add a second sheet with valid stage names for reference
    const stagesWs = XLSX.utils.aoa_to_sheet([
      ['أسماء المراحل المعتمدة (يجب كتابتها كما هي بالضبط)'],
      ...STAGES.map(s => [s.label])
    ]);

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'قائمة المخدومين');
    XLSX.utils.book_append_sheet(wb, stagesWs, 'أسماء المراحل المعتمدة');
    
    XLSX.writeFile(wb, 'نموذج_رفع_المخدومين.xlsx');
  };

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const jsonData = XLSX.utils.sheet_to_json(ws) as any[];

        if (jsonData.length === 0) {
          setError('الملف فارغ أو لا يحتوي على بيانات');
          return;
        }

        const students = jsonData.map((row, index) => {
          const keys = Object.keys(row);
          const nameKey = keys.find(k => k.includes('الاسم') || k.includes('اسم') || k.toLowerCase().includes('name')) || keys[0];
          const classKey = keys.find(k => k.includes('الفصل') || k.includes('فصل') || k.toLowerCase().includes('class'));
          const stageKey = keys.find(k => k.includes('المرحلة') || k.includes('مرحلة') || k.toLowerCase().includes('stage'));
          
          const stageLabel = stageKey ? row[stageKey]?.toString().trim() : '';
          // Flexible matching for stages
          const stageId = getStageId(stageLabel);

          if (!stageId && stageLabel) {
            console.warn(`Could not map stage: "${stageLabel}" at row ${index + 2}`);
          }

          return {
            name: row[nameKey]?.toString().trim(),
            className: classKey ? row[classKey]?.toString().trim() : '',
            stage: stageId,
            stageLabel: stageLabel
          };
        }).filter(s => s.name && s.name.length > 0 && s.stage);

        if (students.length === 0) {
          const foundKeys = Object.keys(jsonData[0]).join(', ');
          setError(`لم يتم العثور على بيانات صالحة. الأعمدة المكتشفة: (${foundKeys}). تأكد من وجود عمود "الاسم" و "المرحلة"`);
          setPreviewData([]);
        } else {
          setPreviewData(students);
          setError(null);
        }
      } catch (err) {
        setError('خطأ في قراءة ملف الإكسيل. تأكد أنه ملف .xlsx أو .xls صحيح');
        console.error(err);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
      processFile(file);
    } else {
      setError('يرجى سحب ملف إكسيل صحيح (.xlsx أو .xls)');
    }
  };

  const handleUpload = async () => {
    if (previewData.length === 0) return;
    
    setIsUploading(true);
    try {
      const response = await fetch('/api/students/bulk-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ students: previewData }),
      });
      
      if (response.ok) {
        toast.success(`تم رفع ${previewData.length} مخدوم بنجاح`);
        setPreviewData([]);
      } else {
        toast.error('حدث خطأ أثناء رفع البيانات');
        setError('حدث خطأ أثناء رفع البيانات للسيرفر');
      }
    } catch (error) {
      toast.error('خطأ في الاتصال بالسيرفر');
      setError('خطأ في الاتصال بالسيرفر');
      console.error('Upload error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const clearPreview = () => {
    setPreviewData([]);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-4">
      <AnimatePresence mode="wait">
        {previewData.length === 0 ? (
          <motion.div
            key="upload-zone"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`flex flex-col items-center p-8 border-2 border-dashed rounded-3xl transition-all group cursor-pointer ${
              isDragging 
                ? 'border-indigo-500 bg-indigo-50 scale-[1.02] shadow-xl shadow-indigo-500/10' 
                : 'border-slate-200 bg-slate-50/50 hover:border-indigo-300 hover:bg-indigo-50/30'
            }`}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 shadow-sm transition-all ${
              isDragging ? 'bg-indigo-600 text-white scale-110' : 'bg-white text-indigo-500 group-hover:scale-110'
            }`}>
              <Layers size={28} />
            </div>
            <h3 className="text-base font-bold text-slate-800 mb-1">
              {isDragging ? 'اترك الملف هنا للرفع' : 'رفع جميع المراحل دفعة واحدة'}
            </h3>
            <p className="text-slate-400 text-[10px] text-center max-w-xs mb-6">
              {isDragging ? 'سيتم قراءة البيانات فوراً' : 'اسحب ملف الإكسيل هنا أو اضغط للاختيار'}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                className="flex items-center justify-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors shadow-md"
              >
                <Upload size={18} />
                اختر ملف الإكسيل
              </button>

              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  downloadTemplate();
                }}
                className="flex items-center justify-center gap-2 px-6 py-2.5 bg-white text-indigo-600 border border-indigo-200 rounded-xl text-sm font-bold hover:bg-indigo-50 transition-colors shadow-sm"
              >
                <Download size={18} />
                تحميل النموذج الجاهز
              </button>
            </div>

            {error && (
              <div className="mt-4 flex items-center gap-2 text-rose-500 text-[10px] bg-rose-50 px-3 py-1.5 rounded-lg">
                <AlertCircle size={14} />
                {error}
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="preview-zone"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden"
          >
            <div className="p-4 border-b border-slate-50 flex justify-between items-center bg-indigo-50/30">
              <div>
                <h3 className="font-bold text-slate-800 text-sm">معاينة الرفع الجماعي</h3>
                <p className="text-[10px] text-indigo-600 font-medium">تم العثور على {previewData.length} مخدوم</p>
              </div>
              <button 
                onClick={clearPreview}
                className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-all"
              >
                <Trash2 size={18} />
              </button>
            </div>
            
            <div className="max-h-[250px] overflow-auto">
              <table className="w-full text-right text-[11px] min-w-[300px]">
                <thead className="bg-slate-50 sticky top-0">
                  <tr>
                    <th className="p-2 font-bold text-slate-400">الاسم</th>
                    <th className="p-2 font-bold text-slate-400">المرحلة</th>
                    <th className="p-2 font-bold text-slate-400">الفصل</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {previewData.slice(0, 30).map((student, i) => (
                    <tr key={i} className="hover:bg-slate-50/50">
                      <td className="p-2 font-medium text-slate-700">{student.name}</td>
                      <td className="p-2">
                        <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-600 rounded text-[9px] font-bold whitespace-nowrap">
                          {student.stageLabel}
                        </span>
                      </td>
                      <td className="p-2 text-slate-500">{student.className || '-'}</td>
                    </tr>
                  ))}
                  {previewData.length > 30 && (
                    <tr>
                      <td colSpan={3} className="p-3 text-center text-slate-400 italic text-[10px]">
                        ... و {previewData.length - 30} مخدومين آخرين
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row gap-2">
              <button
                onClick={handleUpload}
                disabled={isUploading}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-md disabled:opacity-50"
              >
                {isUploading ? 'جاري الرفع...' : (
                  <>
                    <Check size={18} />
                    حفظ جميع المراحل
                  </>
                )}
              </button>
              <button
                onClick={clearPreview}
                disabled={isUploading}
                className="py-3 px-6 bg-white text-slate-600 border border-slate-200 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all"
              >
                إلغاء
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept=".xlsx, .xls"
        className="hidden"
      />
    </div>
  );
};
