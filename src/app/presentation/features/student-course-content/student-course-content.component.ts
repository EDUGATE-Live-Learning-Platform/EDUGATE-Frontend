import { Component, ChangeDetectionStrategy, inject, signal, computed, OnInit, OnDestroy, HostListener, effect, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CourseService } from '../../../infrastructure/services/course/course.service';
import { SecureMediaService } from '../../../infrastructure/services/security/secure-media.service';
import { AuthService } from '../../../infrastructure/auth/auth.service';
import { getCookie } from '../../../infrastructure/auth/cookie.utils';
import { AppLayoutComponent } from '../../layouts/app-layout/app-layout.component';
import { TranslationService } from '../../../core/services/translation.service';
import { ToastService } from '../../../core/services/toast.service';
import { CourseDetails, SectionResponse, LessonResponse, LessonAttachmentResponse } from '../../../core/models/course-catalog.model';
import Hls from 'hls.js';
import * as pdfjsLib from 'pdfjs-dist';

@Component({
  selector: 'app-student-course-content',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './student-course-content.component.html',
  styleUrls: ['./student-course-content.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StudentCourseContentComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private courseService = inject(CourseService);
  private secureMediaService = inject(SecureMediaService);
  private authService = inject(AuthService);
  private layout = inject(AppLayoutComponent);
  private translationService = inject(TranslationService);
  private toastService = inject(ToastService);

  private destroy$ = new Subject<void>();
  private hls: Hls | null = null;
  private watermarkInterval: any;
  private clockInterval: any;
  private devtoolsInterval: any;
  private mutationObserver: MutationObserver | null = null;
  private pdfDocument: any = null;

  lang = this.layout.currentLang;
  t = this.translationService.translations;
  currentUser = this.authService.currentUser;

  course = signal<CourseDetails | null>(null);
  isLoading = signal<boolean>(false);

  activeLesson = signal<LessonResponse | null>(null);
  activeSectionId = signal<string | null>(null);
  collapsedSections = signal<Record<string, boolean>>({});

  noteText = signal<string>('');
  notes = signal<any[]>([]);
  showNotes = signal<boolean>(false);
  isSavingNote = signal<boolean>(false);

  // Security Signals
  watermarkTop = signal<string>('20%');
  watermarkLeft = signal<string>('20%');
  currentDateTime = signal<string>('');
  isDevToolsOpen = signal<boolean>(false);
  sessionId = signal<string>('unknown');

  // PDF.js signals
  pdfLoading = signal<boolean>(false);
  pdfCurrentPage = signal<number>(1);
  pdfTotalPages = signal<number>(1);
  activePdfName = signal<string>('');

  watermarkText = computed(() => {
    const user = this.currentUser();
    if (!user) return 'EDUGATE PROTECTION';
    const cleanId = String(user.Id || 'student');
    return `${user.FullName} (${user.Email}) | ID: ${cleanId.substring(0, 8)} | Session: ${this.sessionId().substring(0, 8)} | ${this.currentDateTime()}`;
  });

  constructor() {
    // Watch activeLesson changes to dynamically re-bind the video player
    effect(() => {
      const lesson = this.activeLesson();
      if (lesson) {
        untracked(() => {
          this.initSecurePlayer(lesson);
          this.closePdfViewer();
        });
      }
    });
  }

  ngOnInit(): void {
    // Decode SessionID from cookie token
    this.extractSessionId();

    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const id = params.get('courseId');
      if (id) {
        this.loadCourseContent(id);
      }
    });

    // Start UI Hardening intervals
    this.startSecurityTimers();
    this.initMutationProtection();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.stopSecurityTimers();

    if (this.hls) {
      this.hls.destroy();
    }
    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
    }
  }

  // ----------------- Security Locks & Watermarks -----------------
  private extractSessionId(): void {
    const token = getCookie('AccessToken');
    if (!token) return;
    try {
      const parts = token.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1]));
        const sid = payload.sid || payload.Sid || 'unknown';
        this.sessionId.set(sid);
      }
    } catch {
      this.sessionId.set('unknown');
    }
  }

  private startSecurityTimers(): void {
    // 1. Watermark position shifter (every 10s)
    this.watermarkInterval = setInterval(() => {
      const randomTop = Math.floor(Math.random() * 60) + 15; // 15% to 75%
      const randomLeft = Math.floor(Math.random() * 50) + 10; // 10% to 60%
      this.watermarkTop.set(`${randomTop}%`);
      this.watermarkLeft.set(`${randomLeft}%`);
    }, 10000);

    // 2. Real-time Clock
    this.clockInterval = setInterval(() => {
      const now = new Date();
      this.currentDateTime.set(now.toLocaleString());
    }, 1000);

    // 3. DevTools Detector (every 1.5s)
    this.devtoolsInterval = setInterval(() => {
      this.detectDevTools();
    }, 1500);
  }

  private stopSecurityTimers(): void {
    if (this.watermarkInterval) clearInterval(this.watermarkInterval);
    if (this.clockInterval) clearInterval(this.clockInterval);
    if (this.devtoolsInterval) clearInterval(this.devtoolsInterval);
  }

  private detectDevTools(): void {
    const threshold = 160;
    const widthDev = window.outerWidth - window.innerWidth > threshold;
    const heightDev = window.outerHeight - window.innerHeight > threshold;

    let devtoolsOpen = false;
    const element = new Image();
    Object.defineProperty(element, 'id', {
      get: () => {
        devtoolsOpen = true;
        return 'detector';
      }
    });
    console.log('%c', element);

    if (widthDev || heightDev || devtoolsOpen) {
      if (!this.isDevToolsOpen()) {
        this.isDevToolsOpen.set(true);
      }
    } else {
      if (this.isDevToolsOpen()) {
        this.isDevToolsOpen.set(false);
      }
    }
  }

  private initMutationProtection(): void {
    // Monitor DOM mutations to prevent tampering or deleting the watermark nodes
    this.mutationObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        // Look for removed or hidden watermark nodes
        const nodes = Array.from(mutation.removedNodes);
        const hasWatermarkRemoved = nodes.some(node => 
          node instanceof HTMLElement && 
          (node.id === 'secure-watermark' || node.classList.contains('secure-watermark-class'))
        );

        if (hasWatermarkRemoved) {
          this.toastService.error('Security Alert', 'Security modification detected. Access suspended.');
          this.router.navigate(['/home']);
        }
      });
    });

    this.mutationObserver.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  // Keystrokes Lockout
  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    const ctrlOrMeta = event.ctrlKey || event.metaKey;
    if (
      (ctrlOrMeta && event.key === 'c') || // Copy
      (ctrlOrMeta && event.key === 's') || // Save
      (ctrlOrMeta && event.key === 'p') || // Print
      (ctrlOrMeta && event.key === 'u') || // View source
      event.key === 'F12' || // DevTools F12
      (ctrlOrMeta && event.shiftKey && event.key === 'i') || // Inspect element
      (ctrlOrMeta && event.shiftKey && event.key === 'I')
    ) {
      event.preventDefault();
    }
  }

  @HostListener('window:contextmenu', ['$event'])
  onContextMenu(event: MouseEvent): void {
    event.preventDefault(); // Disable Right-click
  }

  @HostListener('window:dragstart', ['$event'])
  onDragStart(event: DragEvent): void {
    event.preventDefault(); // Disable drag
  }

  // ----------------- Video Player Initialization -----------------
  private initSecurePlayer(lesson: LessonResponse): void {
    if (!lesson.videoUrl) return;

    if (this.hls) {
      this.hls.destroy();
      this.hls = null;
    }

    // Call service to acquire dynamic signed URL
    this.secureMediaService.getSignedUrl(lesson.id).subscribe({
      next: (signedUrl) => {
        setTimeout(() => {
          const videoElement = document.getElementById('secure-video-player') as HTMLVideoElement;
          if (!videoElement) return;

          // Block context menu specifically on video tag
          videoElement.addEventListener('contextmenu', e => e.preventDefault());

          const isHls = signedUrl.includes('.m3u8');
          if (isHls && Hls.isSupported()) {
            this.hls = new Hls({
              maxBufferSize: 4 * 1024 * 1024, // 4MB buffer limit
              enableWorker: true
            });
            this.hls.loadSource(signedUrl);
            this.hls.attachMedia(videoElement);
          } else {
            // Standard progressive MP4 streaming or native Safari HLS
            videoElement.src = signedUrl;
          }
        }, 100);
      },
      error: (err) => console.error('Security service rejected stream authorization', err)
    });
  }

  // ----------------- Secure PDF canvas rendering -----------------
  loadPdfAttachment(attachment: LessonAttachmentResponse): void {
    const lesson = this.activeLesson();
    if (!lesson) return;

    this.pdfLoading.set(true);
    this.pdfCurrentPage.set(1);
    this.pdfTotalPages.set(1);
    this.activePdfName.set(attachment.fileName);

    // Fetch PDF securely as a binary Blob instead of url string (completely hiding the physical file path)
    this.courseService.getSignedAttachmentBlob(lesson.id, attachment.id).subscribe({
      next: (blob) => {
        const fileReader = new FileReader();
        fileReader.onload = () => {
          const typedarray = new Uint8Array(fileReader.result as ArrayBuffer);
          this.renderPdfDocument(typedarray);
        };
        fileReader.readAsArrayBuffer(blob);
      },
      error: (err) => {
        console.error('Unauthorized file access rejected by security layer.', err);
        this.pdfLoading.set(false);
      }
    });
  }

  private renderPdfDocument(typedarray: Uint8Array): void {
    // Set pdfjs worker cdn link
    (pdfjsLib as any).GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.worker.min.js';

    pdfjsLib.getDocument({ data: typedarray }).promise.then((pdf) => {
      this.pdfDocument = pdf;
      this.pdfTotalPages.set(pdf.numPages);
      this.renderCurrentPage();
    }).catch(err => {
      console.error('PDF rendering failed', err);
      this.pdfLoading.set(false);
    });
  }

  renderCurrentPage(): void {
    if (!this.pdfDocument) return;

    this.pdfDocument.getPage(this.pdfCurrentPage()).then((page: any) => {
      const canvas = document.getElementById('pdf-canvas') as HTMLCanvasElement;
      if (!canvas) return;

      const context = canvas.getContext('2d');
      if (!context) return;

      const viewport = page.getViewport({ scale: 1.5 });
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      const renderContext = {
        canvasContext: context,
        viewport: viewport
      };

      page.render(renderContext).promise.then(() => {
        this.pdfLoading.set(false);
        // Burn watermark directly into canvas pixels (impossible to remove via HTML DOM inspector!)
        this.drawCanvasWatermark(canvas, context);
      });
    });
  }

  private drawCanvasWatermark(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.font = 'bold 13px sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(-Math.PI / 6);
    ctx.textAlign = 'center';
    
    const text = this.watermarkText();
    ctx.fillText(text, 0, -150);
    ctx.fillText(text, 0, -50);
    ctx.fillText(text, 0, 50);
    ctx.fillText(text, 0, 150);
    
    ctx.restore();
  }

  pdfNextPage(): void {
    if (this.pdfCurrentPage() < this.pdfTotalPages()) {
      this.pdfCurrentPage.update(p => p + 1);
      this.renderCurrentPage();
    }
  }

  pdfPrevPage(): void {
    if (this.pdfCurrentPage() > 1) {
      this.pdfCurrentPage.update(p => p - 1);
      this.renderCurrentPage();
    }
  }

  closePdfViewer(): void {
    this.activePdfName.set('');
    this.pdfDocument = null;
  }

  // ----------------- Standard Business Logic -----------------
  loadCourseContent(courseId: string): void {
    this.isLoading.set(true);
    this.courseService.getStudentCourseContent(courseId).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        this.course.set(res);

        const collapseMap: Record<string, boolean> = {};
        res.sections.forEach((s, idx) => {
          collapseMap[s.id] = idx > 0;
        });
        this.collapsedSections.set(collapseMap);

        const firstLesson = res.sections[0]?.lessons[0];
        if (firstLesson) {
          this.activeLesson.set(firstLesson);
          this.activeSectionId.set(res.sections[0].id);
        }

        this.loadNotes(courseId);
      },
      error: () => {
        this.isLoading.set(false);
        this.course.set(null);
      }
    });
  }

  loadNotes(courseId: string): void {
    this.courseService.getCourseNotes(courseId).subscribe({
      next: (res) => this.notes.set(res),
      error: () => this.notes.set([])
    });
  }

  toggleSection(sectionId: string): void {
    this.collapsedSections.update(s => ({ ...s, [sectionId]: !s[sectionId] }));
  }

  selectLesson(lesson: LessonResponse, sectionId: string): void {
    this.activeLesson.set(lesson);
    this.activeSectionId.set(sectionId);
  }

  markAsComplete(lessonId: string): void {
    this.courseService.markLessonComplete(lessonId).subscribe({
      next: () => {
        const course = this.course();
        if (!course) return;
        const updated = {
          ...course,
          sections: course.sections.map(s => ({
            ...s,
            lessons: s.lessons.map(l =>
              l.id === lessonId ? { ...l, isCompleted: true } : l
            )
          }))
        };
        this.course.set(updated);
      }
    });
  }

  saveNote(): void {
    const lesson = this.activeLesson();
    const course = this.course();
    if (!lesson || !course || !this.noteText().trim()) return;

    this.isSavingNote.set(true);
    this.courseService.saveNote(course.id, lesson.id, this.noteText(), 0).subscribe({
      next: () => {
        this.isSavingNote.set(false);
        this.noteText.set('');
        this.loadNotes(course.id);
      },
      error: () => this.isSavingNote.set(false)
    });
  }

  formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  goBack(): void {
    const course = this.course();
    if (course) {
      this.router.navigate(['/courses', course.id]);
    } else {
      this.router.navigate(['/courses']);
    }
  }

  getCompletedCount(): number {
    const course = this.course();
    if (!course) return 0;
    return course.sections.reduce((acc, s) =>
      acc + s.lessons.filter(l => l.isCompleted).length, 0);
  }

  getTotalLessons(): number {
    const course = this.course();
    if (!course) return 0;
    return course.sections.reduce((acc, s) => acc + s.lessons.length, 0);
  }
}
