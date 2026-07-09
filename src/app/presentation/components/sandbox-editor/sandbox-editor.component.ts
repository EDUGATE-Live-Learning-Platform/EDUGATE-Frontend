import { Component, ChangeDetectionStrategy, signal, input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslationService } from '../../../core/services/translation.service';

@Component({
  selector: 'app-sandbox-editor',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sandbox-editor.component.html',
  styleUrls: ['./sandbox-editor.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SandboxEditorComponent {
  translationService = inject(TranslationService);
  t = this.translationService.translations;

  lang = input<'en' | 'ar'>('en');

  codeSnippet = signal<string>(
`// Modern Angular 21 Signal Counter
import { Component, signal, computed } from '@angular/core';

@Component({
  selector: 'app-counter',
  template: \`
    <button (click)="increment()">Count: {{ count() }}</button>
    <p>Double: {{ doubleCount() }}</p>
  \`
})
export class CounterComponent {
  count = signal(0);
  doubleCount = computed(() => this.count() * 2);

  increment() {
    this.count.update(c => c + 1);
  }
}`
  );

  consoleLogs = signal<string[]>([
    'sandbox.logReady',
    'sandbox.logOnline'
  ]);

  isRunning = signal<boolean>(false);

  runCode(): void {
    if (this.isRunning()) return;

    this.isRunning.set(true);
    this.consoleLogs.update(logs => [...logs, 'sandbox.logCompiling']);

    // Simulate compilation
    setTimeout(() => {
      this.consoleLogs.update(logs => [
        ...logs,
        'sandbox.logChecking',
        'sandbox.logSuccess',
        'sandbox.logResult',
        'sandbox.logPracticeSuccess'
      ]);
      
      this.isRunning.set(false);
    }, 1500);
  }

  clearLogs(): void {
    this.consoleLogs.set(['sandbox.logCleared']);
  }
}
