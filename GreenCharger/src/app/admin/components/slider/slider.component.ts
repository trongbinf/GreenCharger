import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SliderService } from '../../../services/slider.service';
import { MessageService } from '../../../services/message.service';
import { Slider } from '../../../models/slider.model';
import { SliderFormComponent } from './slider-form/slider-form.component';

@Component({
  selector: 'app-slider',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, SliderFormComponent],
  templateUrl: './slider.component.html',
  styleUrls: ['./slider.component.css']
})
export class SliderComponent implements OnInit {
  sliders: Slider[] = [];
  filteredSliders: Slider[] = [];
  isLoading = false;
  error = '';
  showCreate = false;
  searchTerm = '';
  form: Partial<Slider> = { 
    title: '', 
    description: '', 
    imageUrl: '', 
    linkUrl: '', 
    isActive: true, 
    displayOrder: 0,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  };
  selected: Slider | null = null;
  viewing: Slider | null = null;
  showView = false;

  constructor(private sliderService: SliderService, private msg: MessageService) { }

  ngOnInit(): void {
    this.loadSliders();
  }

  loadSliders(): void {
    this.isLoading = true;
    this.error = '';
    this.sliderService.getAdminSliders().subscribe({
      next: (sliders) => {
        this.sliders = [...sliders].sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
        this.filteredSliders = [...this.sliders];
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load sliders', err);
        this.error = 'Không thể tải slider';
        this.isLoading = false;
      }
    });
  }

  onSearch(): void {
    const term = (this.searchTerm || '').toLowerCase().trim();
    if (!term) {
      this.filteredSliders = [...this.sliders];
      return;
    }
    this.filteredSliders = this.sliders.filter(s =>
      (s.title || '').toLowerCase().includes(term) ||
      (s.description || '').toLowerCase().includes(term)
    );
  }

  toggleCreate(): void {
    this.showCreate = !this.showCreate;
    this.selected = null;
  }

  submitCreate = (payload?: Partial<Slider>): void => {
    const data = payload || this.form;
    if (!data.title || !data.imageUrl) {
      this.error = 'Vui lòng nhập tiêu đề và URL hình ảnh';
      return;
    }
    this.isLoading = true;
    this.sliderService.createSlider(data).subscribe({
      next: () => {
        this.showCreate = false;
        this.msg.success('Thành công', 'Tạo slider thành công');
        this.form = { 
          title: '', 
          description: '', 
          imageUrl: '', 
          linkUrl: '', 
          isActive: true, 
          displayOrder: 0,
          startDate: new Date().toISOString().split('T')[0],
          endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        };
        this.loadSliders();
      },
      error: (err) => {
        console.error('Failed to create slider', err);
        this.error = 'Không thể tạo slider';
        this.msg.error('Lỗi', 'Không thể tạo slider');
        this.isLoading = false;
      }
    });
  }

  onEdit(slider: Slider): void {
    this.selected = slider;
    this.showCreate = true;
  }

  onView(slider: Slider): void {
    this.viewing = slider;
    this.showView = true;
  }

  onUpdate = (payload: Partial<Slider>): void => {
    if (!this.selected) return;
    const id = this.selected.id as number;
    this.isLoading = true;
    this.sliderService.updateSlider(id, { ...this.selected, ...payload }).subscribe({
      next: () => {
        this.showCreate = false;
        this.selected = null;
        this.msg.success('Thành công', 'Cập nhật slider thành công');
        this.loadSliders();
      },
      error: (err) => {
        console.error('Failed to update slider', err);
        this.error = 'Không thể cập nhật slider';
        this.msg.error('Lỗi', 'Không thể cập nhật slider');
        this.isLoading = false;
      }
    });
  }

  onDelete(slider: Slider): void {
    this.msg.confirm('Xóa slider?', `Bạn có chắc chắn muốn xóa "${slider.title}"?`).then(result => {
      if (!result.isConfirmed) return;
      this.isLoading = true;
      this.sliderService.deleteSlider(slider.id).subscribe({
      next: () => {
        this.msg.success('Đã xóa', 'Slider đã được xóa');
        this.loadSliders();
      },
      error: (err) => {
        console.error('Failed to delete slider', err);
        this.msg.error('Lỗi', 'Không thể xóa slider');
        this.isLoading = false;
      }
    });
    });
  }

  closeView(): void {
    this.showView = false;
    this.viewing = null;
  }
}
