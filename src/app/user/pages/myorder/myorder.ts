import { ChangeDetectorRef, Component } from '@angular/core';
import { NgFor, NgIf, DatePipe, SlicePipe, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { OrderService } from '../../../service/order-service';
import { CartService } from '../../../service/cart-service';
import { InvoiceService } from '../../../service/invoice-service';
import { MSwal as Swal } from '../../../service/swal-service';

@Component({
  selector: 'app-myorder',
  templateUrl: './myorder.html',
  styleUrls: ['./myorder.css'],
  imports: [NgFor, NgIf, DatePipe, SlicePipe, RouterLink, NgClass, FormsModule]
})
export class Myorder {

  orders: any[] = [];
  userId = sessionStorage.getItem('id');
  private readonly baseUrl = 'https://moska-backend-1.onrender.com/uploads/';

  // Search & Filter
  searchQuery   = '';
  selectedStatus = 'All';
  showFilterModal = false;
  tempStatus    = 'All';   // temp selection inside modal

  filterStatuses = ['All', 'Pending', 'Preparing', 'Shipped', 'Delivered', 'Cancelled'];

  get filteredOrders(): any[] {
    let list = [...this.orders];

    // Search — product name ya order id thi
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      list = list.filter(o =>
        o._id?.toLowerCase().includes(q) ||
        o.items?.some((i: any) => i.productId?.pname?.toLowerCase().includes(q))
      );
    }

    // Status filter
    if (this.selectedStatus !== 'All') {
      list = list.filter(o => o.status === this.selectedStatus);
    }

    return list;
  }

  openFilter()  { this.tempStatus = this.selectedStatus; this.showFilterModal = true; }
  closeFilter() { this.showFilterModal = false; }
  applyFilter() { this.selectedStatus = this.tempStatus; this.showFilterModal = false; }
  clearFilter() { this.tempStatus = 'All'; }

  resolveImage(pic: string): string {
    if (!pic || pic === 'no-image.jpg') return 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=100';
    if (pic.startsWith('http')) return pic;          // Cloudinary URL — use as-is
    return this.baseUrl + pic;                        // legacy filename — add prefix
  }

  trackingSteps = [
    { label: 'Ordered',   icon: 'fas fa-check',         key: 'pending'    },
    { label: 'Preparing', icon: 'fas fa-box-open',       key: 'preparing'  },
    { label: 'Shipped',   icon: 'fas fa-shipping-fast',  key: 'shipped'    },
    { label: 'Delivered', icon: 'fas fa-home',           key: 'delivered'  },
  ];

  constructor(
    private orderService: OrderService,
    private cartService: CartService,
    private invoiceService: InvoiceService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() { this.getOrders(); }

  getOrders() {
    if (!this.userId) return;
    this.orderService.getUserOrders(this.userId).subscribe({
      next: (res: any) => { this.orders = res.data || []; this.cdr.detectChanges(); },
      error: () => {}
    });
  }

  getStepIndex(status: string): number {
    const map: any = { pending: 0, preparing: 1, shipped: 2, delivered: 3 };
    return map[status?.toLowerCase()] ?? 0;
  }

  canCancel(status: string): boolean {
    return ['Pending', 'Preparing'].includes(status);
  }

  cancelOrder(orderId: string) {
    Swal.fire({
      title: 'Cancel this order?',
      text: 'This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#c85a54',
      cancelButtonColor: '#9B7B5E',
      confirmButtonText: 'Yes, cancel it',
      cancelButtonText: 'Keep order'
    }).then(result => {
      if (result.isConfirmed) {
        this.orderService.cancelOrder(orderId).subscribe({
          next: () => {
            Swal.fire({ icon: 'success', title: 'Order Cancelled', timer: 1500, showConfirmButton: false });
            this.getOrders();
          },
          error: () => Swal.fire({ icon: 'error', title: 'Failed to cancel order' })
        });
      }
    });
  }

  downloadInvoice(order: any, index: number) {
    this.invoiceService.openInvoice(order, index);
  }

  buyAgain(order: any) {
    const userId = sessionStorage.getItem('id');
    if (!userId) { this.router.navigate(['/login']); return; }

    // Drek item cart ma add karo
    const validItems = order.items.filter((i: any) => i.productId?._id);
    if (!validItems.length) {
      Swal.fire({ icon: 'error', title: 'Products unavailable', confirmButtonColor: '#9B7B5E' });
      return;
    }

    let added = 0;
    validItems.forEach((item: any) => {
      this.cartService.addToCart({
        userId,
        productId: item.productId._id,
        quantity: item.quantity || 1
      }).subscribe({
        next: () => {
          added++;
          if (added === validItems.length) {
            Swal.fire({
              icon: 'success',
              title: 'Added to Cart!',
              text: `${added} item${added > 1 ? 's' : ''} added to your cart.`,
              showCancelButton: true,
              confirmButtonText: 'Go to Cart',
              cancelButtonText: 'Stay Here',
              confirmButtonColor: '#9B7B5E',
              cancelButtonColor: '#C5A059',
            }).then(result => {
              if (result.isConfirmed) this.router.navigate(['/cart']);
            });
          }
        },
        error: () => {}
      });
    });
  }
}
