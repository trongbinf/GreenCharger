import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Category } from '../../../../models/category.model';

@Component({
  selector: 'app-category-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './category-detail.component.html',
  styleUrls: ['./category-detail.component.css']
})
export class CategoryDetailComponent {
  @Input() category: Category | null = null;
  @Input() isVisible = false;
  @Output() close = new EventEmitter<void>();
}
