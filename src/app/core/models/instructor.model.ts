export interface InstructorProfile {
  instructorId: number;
  fullName: string;
  totalEarnings: number;
  activeCoursesCount: number;
  specialization?: string;
  bio?: string;
  imageUrl?: string;
  rating?: number;
  studentCount?: number;
}

export interface InstructorListItem {
  instructorId: number;
  instructorName: string;
  coursesCount: number;
  averageRating: number;
  totalStudents: number;
  imageUrl?: string;
  specialization?: string;
}

export interface StudentDashboardSummary {
  activeCoursesCount: number;
  completedCoursesCount: number;
  totalLearningTimeSeconds: number;
  walletBalance: number;
  resumeLearning?: ResumeLearningInfo;
}

export interface ResumeLearningInfo {
  courseId: string;
  courseTitle: string;
  lessonId: string;
  lessonTitle: string;
  videoUrl?: string;
  durationInSeconds: number;
  lastAccessedSecond: number;
}
