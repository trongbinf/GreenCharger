import { Injectable } from '@angular/core';

export interface VisitorStats {
  totalVisitors: number;
  productClicks: number;
  productClickCounts: { [productId: number]: number };
  lastVisit: Date;
}

@Injectable({
  providedIn: 'root'
})
export class VisitorTrackingService {
  private readonly VISITOR_KEY = 'green_charger_visitor_id';
  private readonly STATS_KEY = 'green_charger_stats';
  private readonly VISIT_DATE_KEY = 'green_charger_last_visit';

  constructor() {
    this.initializeVisitor();
  }

  private initializeVisitor(): void {
    const visitorId = this.getVisitorId();
    
    // Always increment total visitors
    this.incrementTotalVisitors();
  }

  private getVisitorId(): string {
    let visitorId = localStorage.getItem(this.VISITOR_KEY);
    if (!visitorId) {
      visitorId = this.generateVisitorId();
      localStorage.setItem(this.VISITOR_KEY, visitorId);
    }
    return visitorId;
  }

  private generateVisitorId(): string {
    return 'visitor_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  private incrementTotalVisitors(): void {
    const stats = this.getStats();
    stats.totalVisitors++;
    stats.lastVisit = new Date();
    this.saveStats(stats);
  }


  public trackProductClick(productId: number, productName: string): void {
    const stats = this.getStats();
    stats.productClicks++;
    
    // Track individual product clicks
    if (!stats.productClickCounts) {
      stats.productClickCounts = {};
    }
    stats.productClickCounts[productId] = (stats.productClickCounts[productId] || 0) + 1;
    
    this.saveStats(stats);

    // Log product click for analytics
    console.log(`Product clicked: ${productName} (ID: ${productId})`);
  }

  public getStats(): VisitorStats {
    const stored = localStorage.getItem(this.STATS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        totalVisitors: parsed.totalVisitors || 0,
        productClicks: parsed.productClicks || 0,
        productClickCounts: parsed.productClickCounts || {},
        lastVisit: parsed.lastVisit ? new Date(parsed.lastVisit) : new Date()
      };
    }

    return {
      totalVisitors: 0,
      productClicks: 0,
      productClickCounts: {},
      lastVisit: new Date()
    };
  }

  private saveStats(stats: VisitorStats): void {
    localStorage.setItem(this.STATS_KEY, JSON.stringify(stats));
  }

  public resetStats(): void {
    localStorage.removeItem(this.STATS_KEY);
    localStorage.removeItem(this.VISITOR_KEY);
    localStorage.removeItem(this.VISIT_DATE_KEY);
  }

  public getFormattedStats(): string {
    const stats = this.getStats();
    return `Tổng lượt truy cập: ${stats.totalVisitors} | Lượt xem sản phẩm: ${stats.productClicks}`;
  }

  public getProductClickCount(productId: number): number {
    const stats = this.getStats();
    return stats.productClickCounts[productId] || 0;
  }
}
