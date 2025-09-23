import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { ProductService } from '../../../services/product.service';
import { Product } from '../../../models/product.model';
import { HeaderComponent, FooterComponent } from '../../../core';
import { NzBreadCrumbModule } from 'ng-zorro-antd/breadcrumb';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzTagModule } from 'ng-zorro-antd/tag';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    HeaderComponent,
    FooterComponent,
    NzBreadCrumbModule,
    NzGridModule,
    NzCardModule,
    NzTagModule
  ],
  templateUrl: './search.component.html'
})
export class SearchComponent implements OnInit {
  q = '';
  results: Product[] = [];
  isLoading = false;

  constructor(private route: ActivatedRoute, private productService: ProductService, private router: Router) {}

  ngOnInit(): void {
    this.route.queryParamMap.subscribe(params => {
      this.q = (params.get('q') || '').trim();
      this.search();
    });
  }

  search(): void {
    if (!this.q) { this.results = []; return; }
    this.isLoading = true;
    this.productService.getProducts().subscribe({
      next: list => {
        const text = this.q.toLowerCase();
        this.results = list.filter(p => (p.name || '').toLowerCase().includes(text) || (p.description || '').toLowerCase().includes(text));
        this.isLoading = false;
      },
      error: _ => { this.results = []; this.isLoading = false; }
    });
  }
} 