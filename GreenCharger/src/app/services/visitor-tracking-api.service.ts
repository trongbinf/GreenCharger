import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface VisitorStats {
  totalVisitors: number;
  totalProductClicks: number;
  weeklyVisitors: number;
  weekNumber: number;
  year: number;
  lastUpdated: string;
}

export interface WeeklyVisitorHistory {
  weekNumber: number;
  year: number;
  visitorCount: number;
  weekStartDate: string;
  weekEndDate: string;
}

export interface ProductClick {
  productId: number;
  productName: string;
  clickCount: number;
  lastClicked: string;
}

@Injectable({
  providedIn: 'root'
})
export class VisitorTrackingApiService {
  private readonly apiUrl = `${environment.apiUrl}/VisitorTracking`;
  private readonly SESSION_KEY = 'green_charger_session_id';
  
  private visitorStatsSubject = new BehaviorSubject<VisitorStats>({
    totalVisitors: 0,
    totalProductClicks: 0,
    weeklyVisitors: 0,
    weekNumber: 0,
    year: 0,
    lastUpdated: new Date().toISOString()
  });
  
  private productClickCountsSubject = new BehaviorSubject<{ [productId: number]: number }>({});

  constructor(private http: HttpClient) {
    this.initializeVisitor();
  }

  private initializeVisitor(): void {
    const sessionId = this.getOrCreateSessionId();
    const ipAddress = this.getClientIp();
    const userAgent = navigator.userAgent;

    // Always track visitor (for F5 counting)
    this.trackVisitor(sessionId, ipAddress, userAgent).subscribe({
      next: () => {
        this.loadVisitorStats();
        this.loadProductClicks();
      },
      error: (error) => {
        console.error('Error initializing visitor tracking:', error);
        // Fallback to loading from localStorage if API fails
        this.loadFromLocalStorage();
      }
    });
  }

  private getOrCreateSessionId(): string {
    let sessionId = localStorage.getItem(this.SESSION_KEY);
    if (!sessionId) {
      sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem(this.SESSION_KEY, sessionId);
    }
    return sessionId;
  }

  private getClientIp(): string {
    // In a real application, you might get this from a service
    // For now, we'll use a placeholder
    return '127.0.0.1';
  }

  private trackVisitor(sessionId: string, ipAddress: string, userAgent: string): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    return this.http.post(`${this.apiUrl}/track-visitor`, {
      sessionId,
      ipAddress,
      userAgent
    }, { headers }).pipe(
      catchError(error => {
        console.error('Error tracking visitor:', error);
        return of(null);
      })
    );
  }

  public trackProductClick(productId: number, productName: string): void {
    const sessionId = this.getOrCreateSessionId();
    
    this.http.post(`${this.apiUrl}/track-product-click`, {
      productId,
      productName,
      sessionId
    }).subscribe({
      next: () => {
        // Update local state
        this.loadProductClicks();
        this.loadVisitorStats();
      },
      error: (error) => {
        console.error('Error tracking product click:', error);
        // Fallback to localStorage
        this.trackProductClickLocal(productId, productName);
      }
    });
  }

  private trackProductClickLocal(productId: number, productName: string): void {
    const currentCounts = this.productClickCountsSubject.value;
    currentCounts[productId] = (currentCounts[productId] || 0) + 1;
    this.productClickCountsSubject.next(currentCounts);
    
    // Also update localStorage as backup
    localStorage.setItem(`product_click_${productId}`, currentCounts[productId].toString());
  }

  public getVisitorStats(): Observable<VisitorStats> {
    return this.visitorStatsSubject.asObservable();
  }

  public getProductClickCount(productId: number): number {
    const counts = this.productClickCountsSubject.value;
    return counts[productId] || 0;
  }

  public getProductClickCountObservable(): Observable<{ [productId: number]: number }> {
    return this.productClickCountsSubject.asObservable();
  }

  private loadVisitorStats(): void {
    this.http.get<VisitorStats>(`${this.apiUrl}/stats`).subscribe({
      next: (stats) => {
        this.visitorStatsSubject.next(stats);
      },
      error: (error) => {
        console.error('Error loading visitor stats:', error);
        this.loadFromLocalStorage();
      }
    });
  }

  private loadProductClicks(): void {
    this.http.get<ProductClick[]>(`${this.apiUrl}/product-clicks`).subscribe({
      next: (productClicks) => {
        const counts: { [productId: number]: number } = {};
        productClicks.forEach(pc => {
          counts[pc.productId] = pc.clickCount;
        });
        this.productClickCountsSubject.next(counts);
      },
      error: (error) => {
        console.error('Error loading product clicks:', error);
        this.loadProductClicksFromLocalStorage();
      }
    });
  }

  private loadFromLocalStorage(): void {
    // Fallback to localStorage if API is not available
    const storedStats = localStorage.getItem('green_charger_stats');
    if (storedStats) {
      const stats = JSON.parse(storedStats);
      this.visitorStatsSubject.next({
        totalVisitors: stats.totalVisitors || 0,
        totalProductClicks: stats.productClicks || 0,
        weeklyVisitors: stats.weeklyVisitors || 0,
        weekNumber: stats.weekNumber || 0,
        year: stats.year || 0,
        lastUpdated: new Date().toISOString()
      });
    }
  }

  private loadProductClicksFromLocalStorage(): void {
    const counts: { [productId: number]: number } = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('product_click_')) {
        const productId = parseInt(key.replace('product_click_', ''));
        const count = parseInt(localStorage.getItem(key) || '0');
        counts[productId] = count;
      }
    }
    this.productClickCountsSubject.next(counts);
  }

  public getWeeklyHistory(): Observable<WeeklyVisitorHistory[]> {
    return this.http.get<WeeklyVisitorHistory[]>(`${this.apiUrl}/weekly-history`).pipe(
      catchError(error => {
        console.error('Error loading weekly history:', error);
        return of([]);
      })
    );
  }

  public resetStats(): Observable<any> {
    return this.http.post(`${this.apiUrl}/reset-stats`, {}).pipe(
      tap(() => {
        // Clear local state
        this.visitorStatsSubject.next({
          totalVisitors: 0,
          totalProductClicks: 0,
          weeklyVisitors: 0,
          weekNumber: 0,
          year: 0,
          lastUpdated: new Date().toISOString()
        });
        this.productClickCountsSubject.next({});
        
        // Clear localStorage
        localStorage.removeItem(this.SESSION_KEY);
        localStorage.removeItem('tracked_sessions');
        for (let i = localStorage.length - 1; i >= 0; i--) {
          const key = localStorage.key(i);
          if (key && (key.startsWith('product_click_') || key.startsWith('green_charger_'))) {
            localStorage.removeItem(key);
          }
        }
      }),
      catchError(error => {
        console.error('Error resetting stats:', error);
        return of(null);
      })
    );
  }
}
