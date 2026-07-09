import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SandboxEditorComponent } from '../../components/sandbox-editor/sandbox-editor.component';
import { AppLayoutComponent } from '../../layouts/app-layout/app-layout.component';
import { TranslationService } from '../../../core/services/translation.service';

@Component({
  selector: 'app-learn-page',
  standalone: true,
  imports: [CommonModule, SandboxEditorComponent],
  templateUrl: './learn-page.component.html',
  styleUrls: ['./learn-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LearnPageComponent {
  // Inject parent layout for RTL / language detection
  layout = inject(AppLayoutComponent);
  translationService = inject(TranslationService);

  lang = this.layout.currentLang;
  t = this.translationService.translations;
}
