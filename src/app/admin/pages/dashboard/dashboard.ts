import { Component, OnInit, ElementRef, ViewChild, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { NgFor, NgIf, DatePipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [NgFor, NgIf, DatePipe, DecimalPipe, RouterLink, FormsModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit, OnDestroy {
  @ViewChild('revenueChart') revenueChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('statusChart')  statusChartRef!: ElementRef<HTMLCanvasElement>;

  stats = { totalRevenue: 0, totalOrders: 0, totalUsers: 0, totalProducts: 0, pendingOrders: 0, totalCategories: 0 };
  recentOrders: any[] = [];
  topProducts: any[] = [];
  revenueChartData: { label: string; revenue: number; orders: number }[] = [];
  loading = true;
  errorMsg = '';
  orderSearch = '';
  productSearch = '';

  private revenueChart?: Chart;
  private statusChart?: Chart;

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.http.get<any>('https://moska-backend-1.onrender.com/api/admin/stats/dashboard').subscribe({
      next: (res) => {
        if (res.success) {
          this.stats        = res.data.stats;
          this.recentOrders = res.data.recentOrders;
          this.topProducts  = res.data.topProducts;
          this.revenueChartData = res.data.revenueChart || [];
        }
        this.loading = false;
        this.cdr.detectChanges();
        queueMicrotask(() => this.buildCharts());
      },
      error: (err) => {
        this.errorMsg = err?.message || 'Could not connect to server';
        this.loading = false;
      }
    });
  }

  private buildCharts() {
    this.buildRevenueChart();
    this.buildStatusChart();
  }

  private buildRevenueChart() {
    if (!this.revenueChartRef) return;

    const labels = this.revenueChartData.map(d => d.label);
    const data   = this.revenueChartData.map(d => d.revenue);

    const ctx = this.revenueChartRef.nativeElement.getContext('2d')!;

    // Teal-green gradient — complements brown nicely
    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, 'rgba(56, 178, 172, 0.4)');
    gradient.addColorStop(1, 'rgba(56, 178, 172, 0.02)');

    this.revenueChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Revenue (₹)',
          data,
          borderColor: '#38b2ac',
          backgroundColor: gradient,
          borderWidth: 3,
          pointBackgroundColor: '#2c7a7b',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 6,
          pointHoverRadius: 9,
          fill: true,
          tension: 0.45,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#1a202c',
            titleColor: '#e2e8f0',
            bodyColor: '#cbd5e0',
            padding: 14,
            cornerRadius: 12,
            callbacks: {
              title: items => items[0].label,
              label: ctx => ` Revenue: ₹${(ctx.parsed.y ?? 0).toLocaleString('en-IN')}`,
              afterLabel: (ctx) => {
                const d = this.revenueChartData[ctx.dataIndex];
                return d ? ` Orders: ${d.orders}` : '';
              }
            }
          }
        },
        scales: {
          x: {
            grid: { color: 'rgba(0,0,0,0.05)' },
            ticks: { color: '#718096', font: { size: 12, weight: 'bold' } }
          },
          y: {
            grid: { color: 'rgba(0,0,0,0.05)' },
            ticks: {
              color: '#718096',
              font: { size: 12 },
              callback: v => '₹' + Number(v).toLocaleString('en-IN')
            },
            beginAtZero: true
          }
        }
      }
    });
  }

  private buildStatusChart() {
    if (!this.statusChartRef) return;

    const statusMap: Record<string, number> = {};
    this.recentOrders.forEach(o => {
      const s = o.status || 'Unknown';
      statusMap[s] = (statusMap[s] || 0) + 1;
    });

    const labels = Object.keys(statusMap).length ? Object.keys(statusMap) : ['No Orders'];
    const data   = Object.values(statusMap).length ? Object.values(statusMap) : [1];

    const statusColorMap: Record<string, string> = {
      'Pending':          '#f6ad55',   // orange
      'Preparing':        '#38b2ac',   // teal
      'Shipped':          '#667eea',   // indigo
      'Out for Delivery': '#48bb78',   // green
      'Delivered':        '#2c7a7b',   // dark teal
      'Cancelled':        '#fc8181',   // red
    };

    const colors = labels.map(l => statusColorMap[l] || '#b8956a');

    this.statusChart = new Chart(this.statusChartRef.nativeElement, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: colors.slice(0, labels.length),
          borderColor: '#fff',
          borderWidth: 3,
          hoverOffset: 10,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '68%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: '#654321',
              font: { size: 13, weight: 'bold' },
              padding: 16,
              usePointStyle: true,
              pointStyleWidth: 10,
            }
          },
          tooltip: {
            backgroundColor: '#2C2420',
            titleColor: '#f5f0e8',
            bodyColor: '#e8dfd0',
            padding: 12,
            cornerRadius: 10,
          }
        }
      }
    });
  }

  ngOnDestroy() {
    this.revenueChart?.destroy();
    this.statusChart?.destroy();
  }

  get filteredOrders() {
    const q = this.orderSearch.toLowerCase().trim();
    if (!q) return this.recentOrders;
    return this.recentOrders.filter(o =>
      o.userId?.username?.toLowerCase().includes(q) ||
      o._id?.toLowerCase().includes(q) ||
      o.status?.toLowerCase().includes(q)
    );
  }

  get filteredProducts() {
    const q = this.productSearch.toLowerCase().trim();
    if (!q) return this.topProducts;
    return this.topProducts.filter(p =>
      p.pname?.toLowerCase().includes(q) ||
      p.category?.cat_name?.toLowerCase().includes(q)
    );
  }

  getStatusClass(status: string): string {
    const map: any = { delivered: 'success', pending: 'warning', processing: 'info', cancelled: 'danger', shipped: 'info' };
    return map[status?.toLowerCase()] || 'warning';
  }

  getStockClass(stock: number): string {
    if (stock === 0) return 'low';
    if (stock < 10) return 'medium';
    return 'high';
  }

  getStockLabel(stock: number): string {
    if (stock === 0) return 'Out of Stock';
    if (stock < 10) return 'Low Stock';
    return 'In Stock';
  }

  readonly fallbackImg = 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=100';

  getProductImg(p: any): string {
    const pic = p.pic1;
    if (!pic || pic === 'no-image.jpg') return this.fallbackImg;
    if (pic.startsWith('http')) return pic;                                          // Cloudinary URL
    return 'https://moska-backend-1.onrender.com/uploads/' + pic;                   // legacy filename
  }

  onImageError(event: Event) {
    (event.target as HTMLImageElement).src = this.fallbackImg;
  }
}
