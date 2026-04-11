import { Pipe, PipeTransform, inject } from '@angular/core';
import { IconService } from './icon.service';

/**
 * Pipe that resolves legacy PrimeIcon names to Phosphor Thin equivalents.
 * Useful during incremental migration in templates.
 *
 * Usage: {{ 'box' | iconName }}  => 'phosphorCubeThin'
 */
@Pipe({ name: 'iconName', standalone: true })
export class IconNamePipe implements PipeTransform {
  private readonly iconService = inject(IconService);

  transform(legacyName: string): string {
    return this.iconService.resolve(legacyName);
  }
}
