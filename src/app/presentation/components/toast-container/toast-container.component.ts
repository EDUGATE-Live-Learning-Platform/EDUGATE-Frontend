import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, Toast } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="toast-container" aria-live="polite" aria-atomic="true">
      @for (toast of toastService.toasts(); track toast.id) {
        <div 
          class="toast-item" 
          [class.toast-success]="toast.type === 'success'"
          [class.toast-error]="toast.type === 'error'"
          [class.toast-warning]="toast.type === 'warning'"
          [class.toast-info]="toast.type === 'info'"
          [class.toast-leaving]="toast.leaving"
          role="alert"
        >
          <!-- Icon -->
          <div class="toast-icon">
            @switch (toast.type) {
              @case ('success') {
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                  <path d="M22 4L12 14.01l-3-3"/>
                </svg>
              }
              @case ('error') {
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="15" y1="9" x2="9" y2="15"/>
                  <line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
              }
              @case ('warning') {
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              }
              @case ('info') {
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="16" x2="12" y2="12"/>
                  <line x1="12" y1="8" x2="12.01" y2="8"/>
                </svg>
              }
            }
          </div>

          <!-- Content -->
          <div class="toast-content">
            <p class="toast-title">{{ toast.title }}</p>
            @if (toast.message) {
              <p class="toast-message">{{ toast.message }}</p>
            }
          </div>

          <!-- Dismiss button -->
          <button class="toast-dismiss" (click)="toastService.dismiss(toast.id)" aria-label="Dismiss">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>

          <!-- Progress bar -->
          <div class="toast-progress" [style.animation-duration.ms]="toast.duration"></div>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      top: 1.25rem;
      right: 1.25rem;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 0.625rem;
      max-width: 420px;
      width: 100%;
      pointer-events: none;
    }

    [dir="rtl"] .toast-container {
      right: auto;
      left: 1.25rem;
    }

    .toast-item {
      pointer-events: all;
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      padding: 0.875rem 1rem;
      border-radius: 1rem;
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.08);
      box-shadow: 
        0 8px 32px rgba(0, 0, 0, 0.35),
        0 0 0 1px rgba(255, 255, 255, 0.04) inset;
      position: relative;
      overflow: hidden;
      animation: toast-enter 0.35s cubic-bezier(0.21, 1.02, 0.73, 1) forwards;
    }

    .toast-leaving {
      animation: toast-leave 0.3s cubic-bezier(0.06, 0.71, 0.55, 1) forwards !important;
    }

    /* ===== TYPE VARIANTS ===== */
    .toast-success {
      background: linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(6, 78, 59, 0.25) 100%);
      border-color: rgba(16, 185, 129, 0.25);
    }
    .toast-success .toast-icon { color: #34d399; }
    .toast-success .toast-progress { background: linear-gradient(90deg, #10b981, #34d399); }

    .toast-error {
      background: linear-gradient(135deg, rgba(239, 68, 68, 0.12) 0%, rgba(127, 29, 29, 0.25) 100%);
      border-color: rgba(239, 68, 68, 0.25);
    }
    .toast-error .toast-icon { color: #f87171; }
    .toast-error .toast-progress { background: linear-gradient(90deg, #ef4444, #f87171); }

    .toast-warning {
      background: linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(120, 53, 15, 0.25) 100%);
      border-color: rgba(245, 158, 11, 0.25);
    }
    .toast-warning .toast-icon { color: #fbbf24; }
    .toast-warning .toast-progress { background: linear-gradient(90deg, #f59e0b, #fbbf24); }

    .toast-info {
      background: linear-gradient(135deg, rgba(180, 197, 255, 0.12) 0%, rgba(37, 99, 235, 0.25) 100%);
      border-color: rgba(180, 197, 255, 0.25);
    }
    .toast-info .toast-icon { color: #b4c5ff; }
    .toast-info .toast-progress { background: linear-gradient(90deg, #2563eb, #b4c5ff); }

    /* ===== ELEMENTS ===== */
    .toast-icon {
      flex-shrink: 0;
      width: 1.25rem;
      height: 1.25rem;
      margin-top: 1px;
    }
    .toast-icon svg {
      width: 100%;
      height: 100%;
    }

    .toast-content {
      flex: 1;
      min-width: 0;
    }

    .toast-title {
      font-size: 0.8125rem;
      font-weight: 700;
      color: var(--text-color, #dae2fd);
      margin: 0;
      line-height: 1.3;
    }

    .toast-message {
      font-size: 0.6875rem;
      color: var(--on-surface-variant, #c3c6d7);
      margin: 0.25rem 0 0;
      line-height: 1.5;
      opacity: 0.85;
    }

    .toast-dismiss {
      flex-shrink: 0;
      width: 1.125rem;
      height: 1.125rem;
      color: var(--on-surface-variant, #c3c6d7);
      opacity: 0.4;
      cursor: pointer;
      background: none;
      border: none;
      padding: 0;
      transition: opacity 0.2s, transform 0.2s;
      margin-top: 1px;
    }
    .toast-dismiss:hover {
      opacity: 1;
      transform: scale(1.15);
    }
    .toast-dismiss svg {
      width: 100%;
      height: 100%;
    }

    /* ===== PROGRESS BAR ===== */
    .toast-progress {
      position: absolute;
      bottom: 0;
      left: 0;
      height: 2px;
      width: 100%;
      opacity: 0.6;
      animation: toast-progress-shrink linear forwards;
      transform-origin: left;
    }

    [dir="rtl"] .toast-progress {
      transform-origin: right;
    }

    /* ===== ANIMATIONS ===== */
    @keyframes toast-enter {
      from {
        opacity: 0;
        transform: translateX(100%) scale(0.95);
      }
      to {
        opacity: 1;
        transform: translateX(0) scale(1);
      }
    }

    [dir="rtl"] .toast-item {
      animation-name: toast-enter-rtl;
    }

    @keyframes toast-enter-rtl {
      from {
        opacity: 0;
        transform: translateX(-100%) scale(0.95);
      }
      to {
        opacity: 1;
        transform: translateX(0) scale(1);
      }
    }

    @keyframes toast-leave {
      from {
        opacity: 1;
        transform: translateX(0) scale(1);
      }
      to {
        opacity: 0;
        transform: translateX(100%) scale(0.92);
      }
    }

    [dir="rtl"] .toast-leaving {
      animation-name: toast-leave-rtl !important;
    }

    @keyframes toast-leave-rtl {
      from {
        opacity: 1;
        transform: translateX(0) scale(1);
      }
      to {
        opacity: 0;
        transform: translateX(-100%) scale(0.92);
      }
    }

    @keyframes toast-progress-shrink {
      from { transform: scaleX(1); }
      to { transform: scaleX(0); }
    }

    /* ===== RESPONSIVE ===== */
    @media (max-width: 480px) {
      .toast-container {
        right: 0.5rem;
        left: 0.5rem;
        max-width: none;
      }
    }
  `]
})
export class ToastContainerComponent {
  toastService = inject(ToastService);
}
