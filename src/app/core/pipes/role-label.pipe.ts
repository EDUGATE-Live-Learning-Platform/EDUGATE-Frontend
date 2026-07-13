import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'roleLabel',
  standalone: true
})
export class RoleLabelPipe implements PipeTransform {
  transform(value: string | number | null | undefined): string {
    if (value === null || value === undefined) {
      return '';
    }
    
    const roleStr = value.toString().trim();
    switch (roleStr) {
      case '0':
      case 'Admin':
        return 'Admin';
      case '1':
      case 'Instructor':
        return 'Instructor';
      case '2':
      case 'Student':
        return 'Student';
      default:
        return roleStr;
    }
  }
}
