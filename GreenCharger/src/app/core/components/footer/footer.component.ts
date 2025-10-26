import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { VisitorTrackingApiService } from '../../../services/visitor-tracking-api.service';
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
  visitorStats$: Observable<{
    totalVisitors: number;
    totalUsers: number;
    weeklyVisitors: number;
  }>;

  constructor(
    private visitorTrackingApiService: VisitorTrackingApiService,
    private userService: UserService
  ) {
    // Combine visitor stats and user count
    this.visitorStats$ = combineLatest([
      this.visitorTrackingApiService.getVisitorStats(),
      this.userService.getUsers()
    ]    ).pipe(
      map(([visitorStats, users]) => ({
        totalVisitors: visitorStats.totalVisitors,
        totalUsers: users.length,
        weeklyVisitors: visitorStats.weeklyVisitors
      }))
    );
  }

  ngOnInit(): void {
    // Data is automatically loaded through the observable
  }
}
