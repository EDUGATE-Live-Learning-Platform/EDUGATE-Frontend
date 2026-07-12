export interface CourseCatalogItem {
  id: string;
  instructorId: string;
  instructorName: string;
  title: string;
  subtitle?: string;
  category?: string;
  thumbnailUrl?: string;
  price: number;
  discountPrice?: number;
  isDiscountActive: boolean;
  averageRating: number;
  totalRatings: number;
}

export interface CourseDetails {
  id: string;
  instructorId: string;
  instructorName: string;
  title: string;
  subtitle?: string;
  description: string;
  category?: string;
  thumbnailUrl?: string;
  previewVideoUrl?: string;
  price: number;
  discountPrice?: number;
  discountStartDateUtc?: string;
  discountEndDateUtc?: string;
  isPublished: boolean;
  averageRating: number;
  totalRatings: number;
  createdAt: string;
  requirements: string[];
  outcomes: string[];
  sections: SectionResponse[];
}

export interface SectionResponse {
  id: string;
  title: string;
  order: number;
  lessons: LessonResponse[];
}

export interface LessonResponse {
  id: string;
  sectionId: string;
  title: string;
  description?: string;
  videoUrl?: string;
  durationInSeconds: number;
  order: number;
  isPreview: boolean;
  attachments: LessonAttachmentResponse[];
  isCompleted: boolean;
}

export interface LessonAttachmentResponse {
  id: string;
  fileName: string;
  fileUrl: string;
}

export interface StudentDashboardResponse {
  enrollmentId: string;
  courseId: string;
  courseTitle: string;
  thumbnailUrl?: string;
  instructorName: string;
  enrolledAtUtc: string;
  isCompleted: boolean;
  completedAtUtc?: string;
  progressPercentage: number;
}

export interface ResumeLearningResponse {
  courseId: string;
  courseTitle: string;
  lessonId: string;
  lessonTitle: string;
  videoUrl?: string;
  durationInSeconds: number;
  lastAccessedSecond: number;
}

export interface StudentDashboardSummary {
  activeCoursesCount: number;
  completedCoursesCount: number;
  totalLearningTimeSeconds: number;
  walletBalance: number;
  resumeLearning?: ResumeLearningResponse | null;
}
