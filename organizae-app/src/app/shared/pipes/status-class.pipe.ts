import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'statusClass', standalone: true })
export class StatusClassPipe implements PipeTransform {
  transform(name: string | null | undefined): string {
    switch (name) {
      case 'Ativo': return 'status-active';
      case 'Inativo': return 'status-inactive';
      case 'Pendente': return 'status-pending';
      case 'Concluído': return 'status-completed';
      case 'Cancelado': return 'status-cancelled';
      default: return '';
    }
  }
}
