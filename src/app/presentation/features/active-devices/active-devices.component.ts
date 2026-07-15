import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SecureMediaService, ActiveSessionDto } from '../../../infrastructure/services/security/secure-media.service';
import { AppLayoutComponent } from '../../layouts/app-layout/app-layout.component';
import { TranslationService } from '../../../core/services/translation.service';

@Component({
  selector: 'app-active-devices',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './active-devices.component.html',
  styleUrls: ['./active-devices.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ActiveDevicesComponent implements OnInit {
  private secureMediaService = inject(SecureMediaService);
  private layout = inject(AppLayoutComponent);
  private translationService = inject(TranslationService);

  lang = this.layout.currentLang;
  t = this.translationService.translations;

  sessions = signal<ActiveSessionDto[]>([]);
  isLoading = signal<boolean>(true);
  errorMessage = signal<string>('');

  ngOnInit(): void {
    this.loadSessions();
  }

  loadSessions(): void {
    this.isLoading.set(true);
    this.secureMediaService.getActiveSessions().subscribe({
      next: (data) => {
        this.sessions.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.errorMessage.set(err.error?.message || 'Failed to load active sessions.');
        this.isLoading.set(false);
      }
    });
  }

  terminateSession(id: string): void {
    if (!confirm('Are you sure you want to log out this device?')) return;
    this.secureMediaService.terminateSession(id).subscribe({
      next: () => this.loadSessions(),
      error: (err) => this.errorMessage.set(err.error?.message || 'Failed to terminate session.')
    });
  }

  terminateOthers(): void {
    if (!confirm('Are you sure you want to log out all other devices?')) return;
    this.secureMediaService.terminateOtherSessions().subscribe({
      next: () => this.loadSessions(),
      error: (err) => this.errorMessage.set(err.error?.message || 'Failed to terminate other sessions.')
    });
  }
}
