import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [
    CommonModule
  ],
  templateUrl: './categories.component.html',
  styleUrls: ['./categories.component.css']
})
export class CategoriesComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

}
