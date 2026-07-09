import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AppLayoutComponent } from '../../layouts/app-layout/app-layout.component';
import { TranslationService } from '../../../core/services/translation.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomeComponent {
  layout = inject(AppLayoutComponent);
  translationService = inject(TranslationService);

  lang = this.layout.currentLang;
  t = this.translationService.translations;
}
