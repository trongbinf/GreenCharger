import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { Category } from '../../../../models/category.model';

@Component({
  selector: 'app-category-detail',
  standalone: true,
  imports: [
    CommonModule,
    NzDescriptionsModule,
    NzTagModule,
    NzIconModule,
    NzButtonModule,
    NzStatisticModule,
    NzEmptyModule,
    NzToolTipModule
  ],
  templateUrl: './category-detail.component.html',
  styleUrls: ['./category-detail.component.css']
})
export class CategoryDetailComponent {
  @Input() category: Category | null = null;
  @Input() isVisible = false;
  @Output() close = new EventEmitter<void>();
}
