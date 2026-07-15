export interface CreateCourseDto {
  title: string;
  subtitle: string;
  description: string;
  price: number;
  category: string;
}

export interface UpdateCourseDto {
  title: string;
  subtitle: string;
  description: string;
  price: number;
  discountPrice: number;
  discountStartDateUtc?: string;
  discountEndDateUtc?: string;
  requirements: string[];
  outcomes: string[];
  category: string;
}

export interface InstructorDashboardSummary {
  totalEarnings: number;
  activeStudentCount: number;
  averageRating: number;
  activeCoursesCount: number;
  draftCoursesCount: number;
}

export interface InstructorCourseReportItem {
  courseId: string;
  title: string;
  enrollmentsCount: number;
  averageRating: number;
  revenueGenerated: number;
  progressAverage: number;
  isPublished: boolean;
  price: number;
  thumbnailUrl?: string;
}

export interface InstructorReviewFeedItem {
  reviewId: string;
  courseId: string;
  courseTitle: string;
  studentName: string;
  rating: number;
  comment?: string;
  createdAt: string;
}

export interface InstructorProfileView {
  instructorId: string;
  fullName: string;
  totalEarnings: number;
  activeCoursesCount: number;
}

export interface CreateSectionDto {
  title: string;
  order: number;
}
