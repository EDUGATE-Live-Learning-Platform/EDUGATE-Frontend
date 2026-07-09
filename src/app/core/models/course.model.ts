export interface Course {
  id: string;
  titleEn: string;
  titleAr: string;
  descriptionEn: string;
  descriptionAr: string;
  instructor: string;
  progress: number; // percentage (0 - 100)
  category: string;
  lessonsCount: number;
  duration: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced' | 'مبتدئ' | 'متوسط' | 'متقدم';
  image: string;
  xpReward: number;
}
