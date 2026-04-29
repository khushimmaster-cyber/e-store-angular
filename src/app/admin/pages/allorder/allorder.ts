import { NgFor, NgIf } from '@angular/common';
import { ChangeDetectorRef, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { OrderService } from '../../../service/order-service';
import { MSwal as Swal } from '../../../service/swal-service';

@Component({
  selector: 'app-allorder',
  imports: [NgFor, NgIf, FormsModule],
  templateUrl: './allorder.html',
  styleUrl: './allorder.css',
})
export class Allorder {
  orders: any[] = [];
  private readonly baseUrl = 'https://moska-backend-1.onrender.com/uploads/';
  searchText: string = '';

  resolveImage(pic: string): string {
    if (!pic || pic === 'no-image.jpg') return 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=80';
    if (pic.startsWith('http')) return pic;
    return this.baseUrl + pic;
  }

  constructor(private orderService: OrderService, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.getOrders();
  }

  get filteredOrders() {
    if (!this.searchText.trim()) return this.orders;
    const q = this.searchText.toLowerCase();
    return this.orders.filter(o =>
      o.userId?.name?.toLowerCase().includes(q) ||
      o.userId?.email?.toLowerCase().includes(q) ||
      o._id?.toLowerCase().includes(q)
    );
  }

  getOrders() {
    this.orderService.getAllOrders().subscribe({
      next: (res: any) => {
        this.orders = res.data || [];
        this.cdr.detectChanges();
      },
      error: () => {}
    });
  }

  updateStatus(orderId: any, status: any) {
    this.orderService.updateStatus(orderId, status).subscribe({
      next: () => {
        Swal.fire({ icon: 'success', title: 'Status Updated', timer: 1200, showConfirmButton: false });
        this.getOrders();
      },
      error: () => {}
    });
  }
}
