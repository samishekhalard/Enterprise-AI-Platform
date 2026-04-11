import { Component, ChangeDetectionStrategy } from '@angular/core';
import { AvatarModule } from 'primeng/avatar';
import { AvatarGroupModule } from 'primeng/avatargroup';

@Component({
  selector: 'app-avatar-preview',
  standalone: true,
  imports: [AvatarModule, AvatarGroupModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="preview-grid" data-testid="avatar-preview">
      <h4>Letter Avatars</h4>
      <div class="row">
        <p-avatar label="JD" />
        <p-avatar label="AB" shape="circle" />
        <p-avatar label="MK" size="large" shape="circle" />
        <p-avatar label="XL" size="xlarge" shape="circle" />
      </div>

      <h4>Icon Avatars</h4>
      <div class="row">
        <p-avatar label="U" />
        <p-avatar label="S" shape="circle" />
        <p-avatar label="N" size="large" shape="circle" />
      </div>

      <h4>Avatar Group</h4>
      <p-avatargroup>
        <p-avatar label="A" shape="circle" />
        <p-avatar label="B" shape="circle" />
        <p-avatar label="C" shape="circle" />
        <p-avatar label="+3" shape="circle" />
      </p-avatargroup>
    </div>
  `,
  styles: [
    `
      .preview-grid {
        display: grid;
        gap: 1rem;
      }
      .row {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        align-items: center;
      }
      h4 {
        margin: 0;
        font-size: 0.82rem;
        color: var(--nm-muted);
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }
    `,
  ],
})
export class AvatarPreviewComponent {}
