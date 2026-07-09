import { Component, ChangeDetectionStrategy, signal, computed, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../infrastructure/auth/auth.service';
import { LanguageService } from '../../../core/services/language.service';
import { TranslationService } from '../../../core/services/translation.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './app-layout.component.html',
  styleUrls: ['./app-layout.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppLayoutComponent {
  authService = inject(AuthService);
  languageService = inject(LanguageService);
  translationService = inject(TranslationService);
  
  t = this.translationService.translations;
  currentLang = this.languageService.currentLang;
  currentTheme = this.languageService.currentTheme;
  currentDir = this.languageService.currentDir;

  toggleLanguage(): void {
    this.languageService.toggleLanguage();
  }

  toggleTheme(): void {
    this.languageService.toggleTheme();
  }

  logout(): void {
    this.authService.logout();
  }
}
