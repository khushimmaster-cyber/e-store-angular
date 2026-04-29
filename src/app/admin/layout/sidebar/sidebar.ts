import { Component, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { NgIf, DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, NgIf, DecimalPipe],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class Sidebar implements OnInit {
  adminName = sessionStorage.getItem('adminName') || 'Admin';
  stats = {
    totalStock: 0,
    totalProducts: 0,
    totalCategories: 0,
    pendingOrders: 0,
    totalOrders: 0,
    totalUsers: 0,
  };
  loading = true;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    // show cached values instantly on refresh
    const cached = sessionStorage.getItem('adminStats');
    if (cached) {
      this.stats = JSON.parse(cached);
      this.loading = false;
    }

    this.http.get<any>('https://moska-backend-1.onrender.com/api/admin/stats').subscribe({
      next: (res) => {
        if (res.success) {
          this.stats = res.data;
          sessionStorage.setItem('adminStats', JSON.stringify(res.data));
        }
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  get stockPercent(): number {
    return Math.min((this.stats.totalStock / 5000) * 100, 100);
  }
}
