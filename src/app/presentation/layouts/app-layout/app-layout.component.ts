import { Component, ChangeDetectionStrategy, signal, computed, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../infrastructure/auth/auth.service';
import { LanguageService } from '../../../core/services/language.service';
import { TranslationService } from '../../../core/services/translation.service';
import { WalletService } from '../../../infrastructure/services/wallet/wallet.service';

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
  walletService = inject(WalletService);
  
  t = this.translationService.translations;
  currentLang = this.languageService.currentLang;
  currentTheme = this.languageService.currentTheme;
  currentDir = this.languageService.currentDir;

  showDropdown = signal<boolean>(false);

  constructor() {
    effect(() => {
      const user = this.authService.currentUser();
      if (user) {
        this.walletService.getBalance().subscribe({
          error: (err) => console.error('Failed to load wallet balance', err)
        });
      }
    });
  }

  toggleLanguage(): void {
    this.languageService.toggleLanguage();
  }

  toggleTheme(): void {
    this.languageService.toggleTheme();
  }

  toggleDropdown(): void {
    this.showDropdown.update(v => !v);
  }

  closeDropdown(): void {
    this.showDropdown.set(false);
  }

  logout(): void {
    this.authService.logout();
    this.closeDropdown();
  }
}
