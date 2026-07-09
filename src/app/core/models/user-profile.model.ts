export interface UserProfile {
  Id: number;
  Email: string;
  FullName: string;
  MobileNumber: string;
  Role: 'Student' | 'Instructor' | 'Admin';
  Status: string;
  ProfileImageUrl: string | null;
  CreatedAt: string;
  ParentPhoneNumber?: string | null;
  Governorate?: string | null;
  SchoolName?: string | null;
  AcademicGrade?: 'FirstGrade' | 'SecondGrade' | 'ThirdGrade' | null;
  AcademicDivision?: 'General' | 'Scientific' | 'Literary' | null;
  StudentIdImageUrl?: string | null;
}
