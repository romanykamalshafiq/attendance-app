export type Stage = 
  | 'nursery-junior' | 'nursery-senior' 
  | 'grade1-boys' | 'grade1-girls' 
  | 'grade2-boys' | 'grade2-girls'
  | 'grade3-boys' | 'grade3-girls'
  | 'grade4-boys' | 'grade4-girls'
  | 'grade5-boys' | 'grade5-girls'
  | 'grade6-boys' | 'grade6-girls';

export interface Student {
  id: number;
  name: string;
  stage: Stage;
  className?: string;
}

export interface AttendanceRecord {
  studentId: number;
  date: string;
  status: 'present' | 'absent';
}

export const STAGES: { id: Stage; label: string }[] = [
  { id: 'nursery-junior', label: 'حضانة صغرى' },
  { id: 'nursery-senior', label: 'حضانة كبرى' },
  { id: 'grade1-boys', label: 'أولى أولاد' },
  { id: 'grade1-girls', label: 'أولى بنات' },
  { id: 'grade2-boys', label: 'تانية أولاد' },
  { id: 'grade2-girls', label: 'تانية بنات' },
  { id: 'grade3-boys', label: 'تالتة أولاد' },
  { id: 'grade3-girls', label: 'تالتة بنات' },
  { id: 'grade4-boys', label: 'رابعة أولاد' },
  { id: 'grade4-girls', label: 'رابعة بنات' },
  { id: 'grade5-boys', label: 'خامسة أولاد' },
  { id: 'grade5-girls', label: 'خامسة بنات' },
  { id: 'grade6-boys', label: 'سادسة أولاد' },
  { id: 'grade6-girls', label: 'سادسة بنات' },
];
