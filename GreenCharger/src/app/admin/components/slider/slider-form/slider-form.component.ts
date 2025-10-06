import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Slider } from '../../../../models/slider.model';
import { SliderService } from '../../../../services/slider.service';

@Component({
  selector: 'app-slider-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './slider-form.component.html',
  styleUrls: ['./slider-form.component.css']
})
export class SliderFormComponent implements OnChanges {
  @Input() isVisible: boolean = false;
  @Input() slider: Slider | null = null;
  @Input() mode: 'create' | 'edit' = 'create';

  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<Partial<Slider>>();

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
  error: string = '';
  uploading = false;
  uploadProgress = 0;

  constructor(private sliderService: SliderService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['slider']) {
      this.form = this.slider ? { ...this.slider } : {
        title: '', description: '', imageUrl: '', linkUrl: '', isActive: true, displayOrder: 0,
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      };
    }
  }

  onClose(): void {
    this.close.emit();
  }

  onSubmit(): void {
    this.error = '';
    if (!this.form.title || !this.form.imageUrl) {
      this.error = 'Vui lòng nhập tiêu đề và tải ảnh';
      return;
    }
    this.save.emit(this.form);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    this.uploading = true;
    this.uploadProgress = 0;
    this.sliderService.uploadImageWithProgress(file).subscribe({
      next: (event: any) => {
        if (event.type === 1 && event.total) {
          this.uploadProgress = Math.round(100 * event.loaded / event.total);
        } else if (event.body) {
          this.form.imageUrl = event.body.url || event.body.imageUrl || '';
          this.uploading = false;
        }
      },
      error: (err) => {
        console.error('Upload failed', err);
        this.error = 'Tải ảnh thất bại';
        this.uploading = false;
      }
    });
  }
}


