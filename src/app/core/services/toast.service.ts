import { Injectable, signal, computed } from '@angular/core';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: number;
  type: ToastType;
  title: string;
  message: string;
  duration: number;
  leaving: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private counter = 0;
  private toastsSignal = signal<Toast[]>([]);

  toasts = computed(() => this.toastsSignal());

  show(type: ToastType, title: string, message: string, duration = 4000): void {
    const id = ++this.counter;
    const toast: Toast = { id, type, title, message, duration, leaving: false };

    this.toastsSignal.update(list => [...list, toast]);

    // Auto-dismiss after duration
    setTimeout(() => this.dismiss(id), duration);
  }

  success(title: string, message = ''): void {
    this.show('success', title, message, 4000);
  }

  error(title: string, message = ''): void {
    this.show('error', title, message, 6000);
  }

  warning(title: string, message = ''): void {
    this.show('warning', title, message, 5000);
  }

  info(title: string, message = ''): void {
    this.show('info', title, message, 4000);
  }

  dismiss(id: number): void {
    // Trigger leave animation first
    this.toastsSignal.update(list =>
      list.map(t => t.id === id ? { ...t, leaving: true } : t)
    );
    // Remove from DOM after animation
    setTimeout(() => {
      this.toastsSignal.update(list => list.filter(t => t.id !== id));
    }, 320);
  }
}
