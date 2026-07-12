import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./presentation/layouts/auth-layout/auth-layout.component').then(m => m.AuthLayoutComponent),
    children: [
      {
        path: '',
        loadComponent: () => import('./presentation/features/login/login.component').then(m => m.LoginComponent)
      }
    ]
  },
  {
    path: 'register',
    loadComponent: () => import('./presentation/layouts/auth-layout/auth-layout.component').then(m => m.AuthLayoutComponent),
    children: [
      {
        path: '',
        loadComponent: () => import('./presentation/features/register/register.component').then(m => m.RegisterComponent)
      }
    ]
  },
  {
    path: 'forgot-password',
    loadComponent: () => import('./presentation/layouts/auth-layout/auth-layout.component').then(m => m.AuthLayoutComponent),
    children: [
      {
        path: '',
        loadComponent: () => import('./presentation/features/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent)
      }
    ]
  },
  {
    path: '',
    loadComponent: () => import('./presentation/layouts/app-layout/app-layout.component').then(m => m.AppLayoutComponent),
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'home'
      },
      {
        path: 'home',
        loadComponent: () => import('./presentation/features/home/home.component').then(m => m.HomeComponent)
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./presentation/features/dashboard-page/dashboard-page.component').then(m => m.DashboardPageComponent)
      },
      {
        path: 'courses',
        loadComponent: () => import('./presentation/features/courses/course-list/course-list.component').then(m => m.CourseListComponent)
      },
      {
        path: 'courses/:id',
        loadComponent: () => import('./presentation/features/courses/course-detail/course-detail.component').then(m => m.CourseDetailComponent)
      },
      {
        path: 'profile',
        loadComponent: () => import('./presentation/features/profile/profile.component').then(m => m.ProfileComponent)
      },
      {
        path: 'instructors',
        loadComponent: () => import('./presentation/features/instructors/instructor-list/instructor-list.component').then(m => m.InstructorListComponent)
      },
      {
        path: 'instructors/:id',
        loadComponent: () => import('./presentation/features/instructors/instructor-detail/instructor-detail.component').then(m => m.InstructorDetailComponent)
      },
      {
        path: 'wallet',
        loadComponent: () => import('./presentation/features/wallet/wallet.component').then(m => m.WalletComponent)
      },
      {
        path: 'learn/:courseId',
        loadComponent: () => import('./presentation/features/student-course-content/student-course-content.component').then(m => m.StudentCourseContentComponent)
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'home'
  }
];
