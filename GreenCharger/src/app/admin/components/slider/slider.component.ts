import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-slider',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './slider.component.html',
  styleUrls: ['./slider.component.css']
})
export class SliderComponent implements OnInit {
  sliders = [
    { id: 1, title: 'Slider 1', image: 'assets/slider1.jpg', isActive: true },
    { id: 2, title: 'Slider 2', image: 'assets/slider2.jpg', isActive: false }
  ];

  constructor() { }

  ngOnInit(): void {
  }
}
