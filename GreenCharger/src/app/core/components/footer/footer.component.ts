import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { VisitorTrackingService } from '../../../services/visitor-tracking.service';
import { UserService } from '../../../services/user.service';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.css']
})
export class FooterComponent implements OnInit {
  currentYear = new Date().getFullYear();
  visitorStats = { totalVisitors: 0, totalUsers: 0 };

  constructor(
    private visitorTracking: VisitorTrackingService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    const visitorData = this.visitorTracking.getStats();
    this.visitorStats.totalVisitors = visitorData.totalVisitors;
    
    // Fetch actual user count from API
    this.userService.getUsers().subscribe({
      next: users => {
        this.visitorStats.totalUsers = users.length;
      },
      error: () => {
        this.visitorStats.totalUsers = 0;
      }
    });
  }
}
