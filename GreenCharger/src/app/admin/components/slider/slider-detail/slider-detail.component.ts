import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { SliderService } from '../../../../services/slider.service';
import { Slider } from '../../../../models/slider.model';

@Component({
  selector: 'app-slider-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './slider-detail.component.html',
  styleUrls: ['./slider-detail.component.css']
})
export class SliderDetailComponent implements OnInit {
  slider: Slider | null = null;
  isLoading = false;
  error = '';

  constructor(private route: ActivatedRoute, private sliderService: SliderService) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) {
      this.fetch(id);
    }
  }

  fetch(id: number): void {
    this.isLoading = true;
    this.sliderService.getAllSliders().subscribe({
      next: (list) => {
        this.slider = list.find(s => s.id === id) || null;
        this.isLoading = false;
        if (!this.slider) this.error = 'Không tìm thấy slider';
      },
      error: () => {
        this.error = 'Không thể tải slider';
        this.isLoading = false;
      }
    });
  }
}


