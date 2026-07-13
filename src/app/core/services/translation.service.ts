import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { LanguageService } from './language.service';
import { firstValueFrom } from 'rxjs';

export interface TranslationSchema {
  nav: {
    home: string;
    courses: string;
    dashboard: string;
    sandbox: string;
    profile: string;
    login: string;
    register: string;
    logout: string;
    mobileRegister: string;
  };
  dashboard: {
    title: string;
    subtitle: string;
    activeCourses: string;
    showingCourses: string;
  };
  courseCard: {
    xp: string;
    progress: string;
    studyLesson: string;
    completed: string;
    resetProgressTitle: string;
  };
  sandbox: {
    running: string;
    runCode: string;
    clearConsole: string;
    consoleLogs: string;
    logReady: string;
    logOnline: string;
    logCompiling: string;
    logChecking: string;
    logSuccess: string;
    logResult: string;
    logPracticeSuccess: string;
    logCleared: string;
  };
  learn: {
    title: string;
    subtitle: string;
    liveConsole: string;
    lazyLoaded: string;
    loadingConsole: string;
    frameworkHighlights: string;
    fineGrainedSignals: string;
    signalsDesc: string;
    modernDefer: string;
    deferDesc: string;
  };
  login: {
    welcomeBack: string;
    subtitle: string;
    emailLabel: string;
    emailPlh: string;
    passwordLabel: string;
    passwordPlh: string;
    togglePasswordTitle: string;
    rememberMe: string;
    forgotPassword: string;
    authenticating: string;
    signIn: string;
    noAccountText: string;
    registerLink: string;
    sidebarTag: string;
    sidebarTitle: string;
    sidebarDesc: string;
    chip1Title: string;
    chip1Desc: string;
    chip2Title: string;
    chip2Desc: string;
    footerText: string;
    unauthorizedError: string;
    serverError: string;
  };
  register: {
    title: string;
    stepText: string;
    personalInfo: string;
    academicDetails: string;
    successTitle: string;
    fullNameLabel: string;
    fullNamePlh: string;
    emailLabel: string;
    emailPlh: string;
    phoneLabel: string;
    parentPhoneLabel: string;
    passwordLabel: string;
    passwordPlh: string;
    confirmPasswordLabel: string;
    confirmPasswordPlh: string;
    nextStep: string;
    governorateLabel: string;
    governoratePlh: string;
    schoolLabel: string;
    schoolPlh: string;
    gradeLabel: string;
    gradePlh: string;
    firstGrade: string;
    secondGrade: string;
    thirdGrade: string;
    divisionLabel: string;
    divisionPlh: string;
    general: string;
    scientific: string;
    literary: string;
    idLabel: string;
    chooseImage: string;
    noFile: string;
    termsText: string;
    backBtn: string;
    submitting: string;
    submitBtn: string;
    hasAccountText: string;
    signIn: string;
    sidebarTag: string;
    sidebarTitle: string;
    step1Title: string;
    step1Desc: string;
    step2Title: string;
    step2Desc: string;
    step3Title: string;
    step3Desc: string;
    fileTypeError: string;
    fileSizeError: string;
    fillAllError: string;
    passwordsMismatchError: string;
    fileRequiredError: string;
    serverError: string;
  };
  forgotPassword: {
    backToLogin: string;
    recoveryTag: string;
    step1Title: string;
    step1Desc: string;
    emailLabel: string;
    emailPlh: string;
    sendingCode: string;
    sendBtn: string;
    step2Title: string;
    step2Desc: string;
    otpLabel: string;
    otpPlh: string;
    noCodeText: string;
    resendBtn: string;
    verifying: string;
    confirmOtp: string;
    step3Title: string;
    step3Desc: string;
    newPasswordLabel: string;
    newPasswordPlh: string;
    confirmPasswordLabel: string;
    confirmPasswordPlh: string;
    resetting: string;
    resetBtn: string;
    rememberQuestion: string;
    loginNow: string;
    sidebarTag: string;
    sidebarTitle: string;
    sidebarDesc: string;
    bullet1Title: string;
    bullet1Desc: string;
    bullet2Title: string;
    bullet2Desc: string;
    initiateError: string;
    resendSuccess: string;
    resendError: string;
    verifySuccess: string;
    verifyError: string;
    resetSuccess: string;
    resetError: string;
  };
  profile: {
    changePhoto: string;
    verifiedAccount: string;
    personalInfo: string;
    fullName: string;
    phoneNumber: string;
    email: string;
    readOnly: string;
    governorate: string;
    academicInfo: string;
    verifiedRegistration: string;
    schoolName: string;
    parentPhone: string;
    academicGrade: string;
    academicGrade1: string;
    academicGrade2: string;
    academicGrade3: string;
    academicDivision: string;
    divisionGeneral: string;
    divisionScientific: string;
    divisionLiterary: string;
    lockedNote: string;
    cancel: string;
    saving: string;
    saveChanges: string;
    editProfile: string;
    fileTypeError: string;
    fileSizeError: string;
    uploadSuccess: string;
    uploadError: string;
    updateSuccess: string;
    updateError: string;
  };
  catalog: {
    title: string;
    subtitle: string;
    filtersTitle: string;
    clearFilters: string;
    searchLabel: string;
    searchPlh: string;
    categoryLabel: string;
    maxPrice: string;
    minRating: string;
    anyRating: string;
    up: string;
    allCategories: string;
    catCS: string;
    catAI: string;
    catMath: string;
    reviewsCount: string;
    viewDetails: string;
    noCoursesTitle: string;
    noCoursesDesc: string;
    prev: string;
    next: string;
    page: string;
  };
  instructors: {
    title: string;
    subtitle: string;
    viewProfile: string;
    coursesCount: string;
    noInstructors: string;
    back: string;
    coursesBy: string;
    noCourses: string;
    notFound: string;
  };
  wallet: {
    title: string;
    subtitle: string;
    currentBalance: string;
    status: string;
    quickStats: string;
    totalDeposits: string;
    totalPayments: string;
    transactions: string;
    overview: string;
    deposit: string;
    accountDetails: string;
    walletId: string;
    created: string;
    noTransactions: string;
    depositFunds: string;
    amount: string;
    submitBill: string;
    billDescription: string;
    billReference: string;
    billImage: string;
    billSuccess: string;
    depositBtn: string;
    submitBillBtn: string;
    lastTransaction: string;
  };
  studentCourse: {
    backToCourse: string;
    notAvailable: string;
    markComplete: string;
    completed: string;
    notes: string;
    addNote: string;
    save: string;
    lessons: string;
    progress: string;
  };
  detail: {
    backToCatalog: string;
    courseNotFoundTitle: string;
    courseNotFoundDesc: string;
    instructor: string;
    ratings: string;
    aboutTitle: string;
    requirementsTitle: string;
    outcomesTitle: string;
    curriculumTitle: string;
    lessonsCount: string;
    minutes: string;
    previewTag: string;
    watchPreview: string;
    studyNow: string;
    locked: string;
    pricingTag: string;
    discountActive: string;
    resumeStudy: string;
    enrollNow: string;
    processing: string;
    bullet1: string;
    bullet2: string;
    lessonPreviewTitle: string;
    authModalTitle: string;
    authModalSubtitle: string;
    confirmPurchaseTitle: string;
    confirmPurchaseDesc: string;
    courseLabel: string;
    priceLabel: string;
    walletBalance: string;
    confirmPurchaseBtn: string;
    completingPurchase: string;
    insufficientFundsTitle: string;
    insufficientFundsDesc: string;
    coursePrice: string;
    currentBalance: string;
    amountNeeded: string;
    depositAmount: string;
    depositBtn: string;
    depositing: string;
    studentOnlyAlert: string;
    enrolled: string;
    previewBtn: string;
  };
  admin: {
    title: string;
    subtitle: string;
    stats: string;
    students: string;
    instructors: string;
    wallet: string;
    calendar: string;
    audit: string;
    approve: string;
    reject: string;
    feedback: string;
    globalEvent: string;
    users: string;
    wallets: string;
    ban: string;
    unban: string;
  };
  
  // Explicitly declared Landing page (Home) keys
  heroTitlePart1: string;
  heroTitlePart2: string;
  heroTitlePart3: string;
  heroDesc: string;
  heroStartBtn: string;
  heroExploreBtn: string;
  statStudents: string;
  statInstructors: string;
  statSuccess: string;
  journeyTitle: string;
  journeySubtitle: string;
  step1: string;
  step2: string;
  step3: string;
  step4: string;
  step5: string;
  step6: string;
  step7: string;
  step8: string;
  gradesTitle: string;
  gradesSubtitle: string;
  grade1: string;
  grade2: string;
  grade3: string;
  mostRequested: string;
  techSubjects: string;
  generalSubjects: string;
  viewCurriculum: string;
  grade1Tech1: string;
  grade1Tech2: string;
  grade1Gen1: string;
  grade1Gen2: string;
  grade2Tech1: string;
  grade2Tech2: string;
  grade2Gen1: string;
  grade2Gen2: string;
  grade3Tech1: string;
  grade3Tech2: string;
  grade3Gen1: string;
  grade3Gen2: string;
  pathsTitle: string;
  pathsSubtitle: string;
  viewAllPaths: string;
  path1Title: string;
  path2Title: string;
  path3Title: string;
  path4Title: string;
  hours: string;
  registerNow: string;
  revisionsTitle: string;
  revisionsDesc: string;
  monthlyPackTitle: string;
  monthlyPackDesc: string;
  finalSessionTitle: string;
  finalSessionDesc: string;
  viewSchedule: string;
  instructorsTitle: string;
  instructorsSubtitle: string;
  inst1Name: string;
  inst1Role: string;
  inst1Desc: string;
  inst2Name: string;
  inst2Role: string;
  inst2Desc: string;
  inst3Name: string;
  inst3Role: string;
  inst3Desc: string;
  studentsCount: string;
  certified: string;
  fameTitle: string;
  fameSubtitle: string;
  topStudentTag: string;
  topStudentName: string;
  topStudentDesc: string;
  topProjTag: string;
  topProjName: string;
  topProjDesc: string;
  feat1Title: string;
  feat1Desc: string;
  feat2Title: string;
  feat2Desc: string;
  feat3Title: string;
  feat3Desc: string;
  feat4Title: string;
  feat4Desc: string;
  testTitle: string;
  testSubtitle: string;
  test1Name: string;
  test1Role: string;
  test1Text: string;
  test2Name: string;
  test2Role: string;
  test2Text: string;
  test3Name: string;
  test3Role: string;
  test3Text: string;
  faqTitle: string;
  faqQ1: string;
  faqA1: string;
  faqQ2: string;
  faqA2: string;
  faqQ3: string;
  faqA3: string;
  contactTitle: string;
  contactSubtitle: string;
  whatsappTitle: string;
  whatsappDesc: string;
  hqTitle: string;
  hqDesc: string;
  fullNameLabel: string;
  fullNamePlh: string;
  emailLabel: string;
  emailPlh: string;
  messageLabel: string;
  messagePlh: string;
  submitBtn: string;
}

const emptySchema: TranslationSchema = {
  nav: { home: '', courses: '', dashboard: '', sandbox: '', profile: '', login: '', register: '', logout: '', mobileRegister: '' },
  dashboard: { title: '', subtitle: '', activeCourses: '', showingCourses: '' },
  courseCard: { xp: '', progress: '', studyLesson: '', completed: '', resetProgressTitle: '' },
  sandbox: { running: '', runCode: '', clearConsole: '', consoleLogs: '', logReady: '', logOnline: '', logCompiling: '', logChecking: '', logSuccess: '', logResult: '', logPracticeSuccess: '', logCleared: '' },
  learn: { title: '', subtitle: '', liveConsole: '', lazyLoaded: '', loadingConsole: '', frameworkHighlights: '', fineGrainedSignals: '', signalsDesc: '', modernDefer: '', deferDesc: '' },
  login: { welcomeBack: '', subtitle: '', emailLabel: '', emailPlh: '', passwordLabel: '', passwordPlh: '', togglePasswordTitle: '', rememberMe: '', forgotPassword: '', authenticating: '', signIn: '', noAccountText: '', registerLink: '', sidebarTag: '', sidebarTitle: '', sidebarDesc: '', chip1Title: '', chip1Desc: '', chip2Title: '', chip2Desc: '', footerText: '', unauthorizedError: '', serverError: '' },
  register: { title: '', stepText: '', personalInfo: '', academicDetails: '', successTitle: '', fullNameLabel: '', fullNamePlh: '', emailLabel: '', emailPlh: '', phoneLabel: '', parentPhoneLabel: '', passwordLabel: '', passwordPlh: '', confirmPasswordLabel: '', confirmPasswordPlh: '', nextStep: '', governorateLabel: '', governoratePlh: '', schoolLabel: '', schoolPlh: '', gradeLabel: '', gradePlh: '', firstGrade: '', secondGrade: '', thirdGrade: '', divisionLabel: '', divisionPlh: '', general: '', scientific: '', literary: '', idLabel: '', chooseImage: '', noFile: '', termsText: '', backBtn: '', submitting: '', submitBtn: '', hasAccountText: '', signIn: '', sidebarTag: '', sidebarTitle: '', step1Title: '', step1Desc: '', step2Title: '', step2Desc: '', step3Title: '', step3Desc: '', fileTypeError: '', fileSizeError: '', fillAllError: '', passwordsMismatchError: '', fileRequiredError: '', serverError: '' },
  forgotPassword: { backToLogin: '', recoveryTag: '', step1Title: '', step1Desc: '', emailLabel: '', emailPlh: '', sendingCode: '', sendBtn: '', step2Title: '', step2Desc: '', otpLabel: '', otpPlh: '', noCodeText: '', resendBtn: '', verifying: '', confirmOtp: '', step3Title: '', step3Desc: '', newPasswordLabel: '', newPasswordPlh: '', confirmPasswordLabel: '', confirmPasswordPlh: '', resetting: '', resetBtn: '', rememberQuestion: '', loginNow: '', sidebarTag: '', sidebarTitle: '', sidebarDesc: '', bullet1Title: '', bullet1Desc: '', bullet2Title: '', bullet2Desc: '', initiateError: '', resendSuccess: '', resendError: '', verifySuccess: '', verifyError: '', resetSuccess: '', resetError: '' },
  profile: { changePhoto: '', verifiedAccount: '', personalInfo: '', fullName: '', phoneNumber: '', email: '', readOnly: '', governorate: '', academicInfo: '', verifiedRegistration: '', schoolName: '', parentPhone: '', academicGrade: '', academicGrade1: '', academicGrade2: '', academicGrade3: '', academicDivision: '', divisionGeneral: '', divisionScientific: '', divisionLiterary: '', lockedNote: '', cancel: '', saving: '', saveChanges: '', editProfile: '', fileTypeError: '', fileSizeError: '', uploadSuccess: '', uploadError: '', updateSuccess: '', updateError: '' },
  catalog: {
    title: '', subtitle: '', filtersTitle: '', clearFilters: '', searchLabel: '', searchPlh: '', categoryLabel: '',
    maxPrice: '', minRating: '', anyRating: '', up: '', allCategories: '', catCS: '', catAI: '', catMath: '',
    reviewsCount: '', viewDetails: '', noCoursesTitle: '', noCoursesDesc: '', prev: '', next: '', page: ''
  },
  instructors: {
    title: '', subtitle: '', viewProfile: '', coursesCount: '', noInstructors: '', back: '', coursesBy: '', noCourses: '', notFound: ''
  },
  wallet: {
    title: '', subtitle: '', currentBalance: '', status: '', quickStats: '', totalDeposits: '', totalPayments: '',
    transactions: '', overview: '', deposit: '', accountDetails: '', walletId: '', created: '', noTransactions: '',
    depositFunds: '', amount: '', submitBill: '', billDescription: '', billReference: '', billImage: '', billSuccess: '',
    depositBtn: '', submitBillBtn: '', lastTransaction: ''
  },
  studentCourse: {
    backToCourse: '', notAvailable: '', markComplete: '', completed: '', notes: '', addNote: '', save: '', lessons: '', progress: ''
  },
  detail: {
    backToCatalog: '', courseNotFoundTitle: '', courseNotFoundDesc: '', instructor: '', ratings: '', aboutTitle: '',
    requirementsTitle: '', outcomesTitle: '', curriculumTitle: '', lessonsCount: '', minutes: '', previewTag: '',
    watchPreview: '', studyNow: '', locked: '', pricingTag: '', discountActive: '', resumeStudy: '', enrollNow: '',
    processing: '', bullet1: '', bullet2: '', lessonPreviewTitle: '', authModalTitle: '', authModalSubtitle: '',
    confirmPurchaseTitle: '', confirmPurchaseDesc: '', courseLabel: '', priceLabel: '', walletBalance: '',
    confirmPurchaseBtn: '', completingPurchase: '', insufficientFundsTitle: '', insufficientFundsDesc: '',
    coursePrice: '', currentBalance: '', amountNeeded: '', depositAmount: '', depositBtn: '', depositing: '', studentOnlyAlert: '',
    enrolled: '', previewBtn: ''
  },
  admin: {
    title: '', subtitle: '', stats: '', students: '', instructors: '', wallet: '', calendar: '', audit: '',
    approve: '', reject: '', feedback: '', globalEvent: '',
    users: '', wallets: '', ban: '', unban: ''
  },
  
  // Empty values for explicitly declared Landing page (Home) keys
  heroTitlePart1: '',
  heroTitlePart2: '',
  heroTitlePart3: '',
  heroDesc: '',
  heroStartBtn: '',
  heroExploreBtn: '',
  statStudents: '',
  statInstructors: '',
  statSuccess: '',
  journeyTitle: '',
  journeySubtitle: '',
  step1: '',
  step2: '',
  step3: '',
  step4: '',
  step5: '',
  step6: '',
  step7: '',
  step8: '',
  gradesTitle: '',
  gradesSubtitle: '',
  grade1: '',
  grade2: '',
  grade3: '',
  mostRequested: '',
  techSubjects: '',
  generalSubjects: '',
  viewCurriculum: '',
  grade1Tech1: '',
  grade1Tech2: '',
  grade1Gen1: '',
  grade1Gen2: '',
  grade2Tech1: '',
  grade2Tech2: '',
  grade2Gen1: '',
  grade2Gen2: '',
  grade3Tech1: '',
  grade3Tech2: '',
  grade3Gen1: '',
  grade3Gen2: '',
  pathsTitle: '',
  pathsSubtitle: '',
  viewAllPaths: '',
  path1Title: '',
  path2Title: '',
  path3Title: '',
  path4Title: '',
  hours: '',
  registerNow: '',
  revisionsTitle: '',
  revisionsDesc: '',
  monthlyPackTitle: '',
  monthlyPackDesc: '',
  finalSessionTitle: '',
  finalSessionDesc: '',
  viewSchedule: '',
  instructorsTitle: '',
  instructorsSubtitle: '',
  inst1Name: '',
  inst1Role: '',
  inst1Desc: '',
  inst2Name: '',
  inst2Role: '',
  inst2Desc: '',
  inst3Name: '',
  inst3Role: '',
  inst3Desc: '',
  studentsCount: '',
  certified: '',
  fameTitle: '',
  fameSubtitle: '',
  topStudentTag: '',
  topStudentName: '',
  topStudentDesc: '',
  topProjTag: '',
  topProjName: '',
  topProjDesc: '',
  feat1Title: '',
  feat1Desc: '',
  feat2Title: '',
  feat2Desc: '',
  feat3Title: '',
  feat3Desc: '',
  feat4Title: '',
  feat4Desc: '',
  testTitle: '',
  testSubtitle: '',
  test1Name: '',
  test1Role: '',
  test1Text: '',
  test2Name: '',
  test2Role: '',
  test2Text: '',
  test3Name: '',
  test3Role: '',
  test3Text: '',
  faqTitle: '',
  faqQ1: '',
  faqA1: '',
  faqQ2: '',
  faqA2: '',
  faqQ3: '',
  faqA3: '',
  contactTitle: '',
  contactSubtitle: '',
  whatsappTitle: '',
  whatsappDesc: '',
  hqTitle: '',
  hqDesc: '',
  fullNameLabel: '',
  fullNamePlh: '',
  emailLabel: '',
  emailPlh: '',
  messageLabel: '',
  messagePlh: '',
  submitBtn: ''
};

@Injectable({
  providedIn: 'root'
})
export class TranslationService {
  private http = inject(HttpClient);
  private languageService = inject(LanguageService);

  private enTranslations = signal<TranslationSchema>(emptySchema);
  private arTranslations = signal<TranslationSchema>(emptySchema);
  
  isLoaded = signal<boolean>(false);

  translations = computed<TranslationSchema>(() => {
    const lang = this.languageService.currentLang();
    return lang === 'ar' ? this.arTranslations() : this.enTranslations();
  });

  async loadTranslations(): Promise<void> {
    try {
      const en = await firstValueFrom(this.http.get<TranslationSchema>('/i18n/en.json'));
      const ar = await firstValueFrom(this.http.get<TranslationSchema>('/i18n/ar.json'));
      this.enTranslations.set(en);
      this.arTranslations.set(ar);
      this.isLoaded.set(true);
    } catch (error) {
      console.error('Failed to load translation files', error);
    }
  }

  translate(key: string, params?: Record<string, string>): string {
    const dict = this.translations() as any;
    const value = this.resolveKey(dict, key);
    if (!value) return key;
    if (!params) return value;

    let translated = value;
    for (const [paramKey, paramVal] of Object.entries(params)) {
      translated = translated.replace(new RegExp(`{{${paramKey}}}`, 'g'), paramVal);
    }
    return translated;
  }

  private resolveKey(obj: Record<string, any>, path: string): string | null {
    if (!obj || !path) return null;
    const parts = path.split('.');
    let current = obj;
    for (const part of parts) {
      if (current[part] === undefined) return null;
      current = current[part];
    }
    return typeof current === 'string' ? current : null;
  }
}
