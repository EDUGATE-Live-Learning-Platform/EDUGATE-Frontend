export interface StudentRegisterRequest {
  FullName?: string | null;
  Email?: string | null;
  MobileNumber?: string | null;
  ParentPhoneNumber?: string | null;
  Governorate?: string | null;
  SchoolName?: string | null;
  AcademicGrade?: 'FirstGrade' | 'SecondGrade' | 'ThirdGrade' | null;
  AcademicDivision?: 'General' | 'Scientific' | 'Literary' | null;
  Password?: string | null;
  ConfirmPassword?: string | null;
  TermsAccepted?: boolean | null;
}
