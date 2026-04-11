export interface Lesson {
  id: string;
  title: { be: string; ru: string };
  desc: { be: string; ru: string };
  icon: string;
  difficulty: 'easy' | 'medium' | 'hard';
  time: string;
  category: { be: string; ru: string };
  content: { be: string; ru: string };
}

export interface Option {
  text: string | { be: string; ru: string };
  points: number;
  feedback?: string | { be: string; ru: string };
}

export interface Scenario {
  id: number;
  sphere: string;
  type: string;
  title: string | { be: string; ru: string };
  points: number;
  difficulty: string;
  tags: string[];
  ui_type: string;
  content: any;
  options: Option[];
}
