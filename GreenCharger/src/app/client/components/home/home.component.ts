import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HeaderComponent, FooterComponent } from '../../../core';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, HeaderComponent, FooterComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  featuredProducts = [
    {
      id: 1,
      name: 'Sạc iPhone 15 Pro Max',
      price: 299000,
      originalPrice: 399000,
      image: 'https://via.placeholder.com/300x300/1e3c72/ffffff?text=iPhone+15+Pro+Max',
      rating: 4.8,
      reviews: 156,
      badge: 'Bán chạy'
    },
    {
      id: 2,
      name: 'Sạc Samsung Galaxy S24',
      price: 249000,
      originalPrice: 349000,
      image: 'https://via.placeholder.com/300x300/2a5298/ffffff?text=Galaxy+S24',
      rating: 4.7,
      reviews: 89,
      badge: 'Mới'
    },
    {
      id: 3,
      name: 'Sạc USB-C Universal',
      price: 199000,
      originalPrice: 299000,
      image: 'https://via.placeholder.com/300x300/1e3c72/ffffff?text=USB-C+Universal',
      rating: 4.6,
      reviews: 234,
      badge: 'Tiết kiệm'
    },
    {
      id: 4,
      name: 'Sạc Wireless Fast',
      price: 399000,
      originalPrice: 499000,
      image: 'https://via.placeholder.com/300x300/2a5298/ffffff?text=Wireless+Fast',
      rating: 4.9,
      reviews: 67,
      badge: 'Cao cấp'
    }
  ];

  categories = [
    {
      id: 1,
      name: 'Sạc iPhone',
      image: 'https://via.placeholder.com/200x200/1e3c72/ffffff?text=iPhone',
      count: 25
    },
    {
      id: 2,
      name: 'Sạc Samsung',
      image: 'https://via.placeholder.com/200x200/2a5298/ffffff?text=Samsung',
      count: 18
    },
    {
      id: 3,
      name: 'Sạc USB-C',
      image: 'https://via.placeholder.com/200x200/1e3c72/ffffff?text=USB-C',
      count: 32
    },
    {
      id: 4,
      name: 'Sạc Wireless',
      image: 'https://via.placeholder.com/200x200/2a5298/ffffff?text=Wireless',
      count: 15
    }
  ];

  testimonials = [
    {
      id: 1,
      name: 'Nguyễn Văn A',
      avatar: 'https://via.placeholder.com/60x60/1e3c72/ffffff?text=NV',
      rating: 5,
      comment: 'Sạc rất nhanh và chất lượng tốt. Tôi rất hài lòng với sản phẩm này!'
    },
    {
      id: 2,
      name: 'Trần Thị B',
      avatar: 'https://via.placeholder.com/60x60/2a5298/ffffff?text=TT',
      rating: 5,
      comment: 'Giao hàng nhanh, sản phẩm đúng như mô tả. Sẽ mua tiếp!'
    },
    {
      id: 3,
      name: 'Lê Văn C',
      avatar: 'https://via.placeholder.com/60x60/1e3c72/ffffff?text=LV',
      rating: 4,
      comment: 'Giá cả hợp lý, chất lượng ổn. Khuyến nghị cho mọi người.'
    }
  ];

  currentSlide = 0;
  slides = [
    {
      id: 1,
      title: 'Sạc Điện Tử Chất Lượng Cao',
      subtitle: 'Khám phá bộ sưu tập sạc điện tử hiện đại và tiết kiệm năng lượng',
      image: 'https://cdnv2.tgdd.vn/mwg-static/tgdd/Banner/6c/d8/6cd83d1829cce54ea299e8095213b69c.png',
      buttonText: 'Mua ngay',
      buttonLink: '/products'
    },
    {
      id: 2,
      title: 'Công Nghệ Sạc Nhanh',
      subtitle: 'Trải nghiệm tốc độ sạc nhanh gấp 3 lần với công nghệ mới nhất',
      image: 'https://via.placeholder.com/1200x400/2a5298/ffffff?text=Slide+2',
      buttonText: 'Tìm hiểu thêm',
      buttonLink: '/about'
    },
    {
      id: 3,
      title: 'Bảo Hành 2 Năm',
      subtitle: 'Cam kết chất lượng với chế độ bảo hành toàn diện',
      image: 'https://via.placeholder.com/1200x400/1e3c72/ffffff?text=Slide+3',
      buttonText: 'Xem sản phẩm',
      buttonLink: '/products'
    }
  ];

  ngOnInit(): void {
    this.startSlider();
  }

  startSlider(): void {
    setInterval(() => {
      this.currentSlide = (this.currentSlide + 1) % this.slides.length;
    }, 5000);
  }

  goToSlide(index: number): void {
    this.currentSlide = index;
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  }

  getStars(rating: number): number[] {
    return Array(5).fill(0).map((_, i) => i < Math.floor(rating) ? 1 : 0);
  }
}
