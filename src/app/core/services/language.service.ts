import { Injectable, signal, computed, effect } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LanguageService {
  currentLang = signal<'en' | 'ar'>('en');
  currentTheme = signal<'dark' | 'light'>('dark');
  currentDir = computed<'ltr' | 'rtl'>(() => this.currentLang() === 'ar' ? 'rtl' : 'ltr');

  constructor() {
    effect(() => {
      const dir = this.currentDir();
      const lang = this.currentLang();
      const theme = this.currentTheme();
      
      // Update HTML node properties
      document.documentElement.dir = dir;
      document.documentElement.lang = lang;
      
      // Apply theme class
      if (theme === 'light') {
        document.documentElement.classList.add('light-mode');
      } else {
        document.documentElement.classList.remove('light-mode');
      }

      // Update body classes
      if (dir === 'rtl') {
        document.body.dir = 'rtl';
        document.body.classList.add('rtl-mode');
      } else {
        document.body.dir = 'ltr';
        document.body.classList.remove('rtl-mode');
      }
    });
  }

  toggleLanguage(): void {
    this.currentLang.update(lang => lang === 'en' ? 'ar' : 'en');
  }

  toggleTheme(): void {
    this.currentTheme.update(theme => theme === 'dark' ? 'light' : 'dark');
  }
}
