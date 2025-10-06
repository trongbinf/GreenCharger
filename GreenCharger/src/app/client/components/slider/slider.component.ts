import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent, FooterComponent } from '../../../core';
import { Router, RouterModule } from '@angular/router';
import { SliderService } from '../../../services/slider.service';
import { Slider } from '../../../models/slider.model';

@Component({
  selector: 'app-slider-page',
  standalone: true,
  imports: [CommonModule, RouterModule, HeaderComponent, FooterComponent],
  templateUrl: './slider.component.html',
  styleUrls: ['./slider.component.css']
})
export class SliderComponent implements OnInit {
  sliders: Slider[] = [];
  isLoading = false;
  error = '';

  constructor(private sliderService: SliderService, private router: Router) {}

  ngOnInit(): void {
    this.loadSliders();
  }

  loadSliders(): void {
    this.isLoading = true;
    this.error = '';
    this.sliderService.getActiveSliders().subscribe({
      next: (data) => {
        this.sliders = [...data].sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load sliders', err);
        this.error = 'Không thể tải slider';
        this.isLoading = false;
      }
    });
  }

  onCardClick(slide: Slider): void {
    if (!slide || !slide.linkUrl) {
      return;
    }
    const url = slide.linkUrl.trim();
    if (!url) return;
    if (/^https?:\/\//i.test(url)) {
      window.location.href = url;
    } else {
      this.router.navigateByUrl(url);
    }
  }
}


