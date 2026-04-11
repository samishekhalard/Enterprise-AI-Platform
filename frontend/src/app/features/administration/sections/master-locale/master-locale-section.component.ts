import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TabsModule } from 'primeng/tabs';
import { LocaleAdminTab } from '../../models/administration.models';

@Component({
  selector: 'app-master-locale-section',
  standalone: true,
  imports: [CommonModule, FormsModule, CardModule, InputTextModule, SelectModule, TabsModule],
  templateUrl: './master-locale-section.component.html',
  styleUrl: './master-locale-section.component.scss',
})
export class MasterLocaleSectionComponent {
  protected readonly tab = signal<LocaleAdminTab>('languages');

  protected defaultLanguage = 'en';
  protected defaultRegion = 'AE';
  protected dateFormat = 'dd/MM/yyyy';
  protected timezone = 'Asia/Dubai';

  protected readonly languageOptions: { label: string; value: string }[] = [
    { label: 'English', value: 'en' },
    { label: 'Arabic', value: 'ar' },
  ];

  protected readonly regionOptions: { label: string; value: string }[] = [
    { label: 'United Arab Emirates', value: 'AE' },
    { label: 'United States', value: 'US' },
    { label: 'United Kingdom', value: 'GB' },
  ];

  protected onTabChange(value: unknown): void {
    const nextTab =
      value === 'languages' ||
      value === 'regions' ||
      value === 'formats' ||
      value === 'translations'
        ? value
        : 'languages';

    this.tab.set(nextTab);
  }
}
