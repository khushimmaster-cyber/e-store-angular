import { ChangeDetectorRef, Component } from '@angular/core';
import { CartService } from '../../../service/cart-service';
import { NgFor, NgIf } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CouponService } from '../../../service/coupon-service';
import { MSwal as Swal } from '../../../service/swal-service';

@Component({
  selector: 'app-cart',
  standalone: true,
  templateUrl: './cart.html',
  styleUrls: ['./cart.css'],
  imports: [NgFor, NgIf, FormsModule, RouterLink, RouterLinkActive],
})
export class Cart {
  showCouponModal = false;
  coupons: any[] = [];
  bestCouponCode: string = '';
  cartItems: any[] = [];
  total: number = 0;
  userId = sessionStorage.getItem('id');
  private readonly baseUrl = 'https://moska-backend-1.onrender.com/uploads/';

  resolveImage(pic: string): string {
    if (!pic || pic === 'no-image.jpg') return 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=100';
    if (pic.startsWith('http')) return pic;
    return this.baseUrl + pic;
  }
  couponCode: string = '';
  discount: number = 0;
  finalTotal: number = 0;
  couponError: string = '';
  dropdownOpen = false;

  constructor(
    private cartService: CartService,
    private cdr: ChangeDetectorRef,
    public router: Router,
    private couponService: CouponService,
  ) {}

  toggleDropdown(e: Event) {
    e.stopPropagation();
    this.dropdownOpen = !this.dropdownOpen;
  }
  closeDropdown() {
    this.dropdownOpen = false;
  }
  themeToggle() {
    /* optional: hook to ThemeService */
  }
  logoutUser() {
    sessionStorage.clear();
    this.dropdownOpen = false;
    this.router.navigate(['/login']);
  }

  // toggleCouponList() {
  //   this.showCoupons = !this.showCoupons;
  // }

  ngOnInit() {
    this.loadCart();

    this.couponService.getActiveCoupons().subscribe((res: any) => {
      this.coupons = res;
      // apply best coupon only after both cart and coupons are loaded
      if (this.total > 0) {
        this.applyBestCoupon();
      }
    });
  }

  loadCart() {
    this.cartService.getCart(this.userId).subscribe((res: any) => {
      if (res.data && res.data.items) {
        this.cartItems = res.data.items.filter((item: any) => item.productId != null);
      } else {
        this.cartItems = [];
      }
      this.calculateTotal();
      // only apply if coupons already loaded
      if (this.coupons.length > 0) {
        this.applyBestCoupon();
      }
      this.cdr.detectChanges();
    });
  }
  loadCoupons() {
    this.couponService.getActiveCoupons().subscribe({
      next: (res: any) => {
        this.coupons = res;
        this.applyBestCoupon();
      },
      error: () => {
        this.coupons = [];
      },
    });
  }

  applyBestCoupon() {
    if (!this.coupons.length || this.total <= 0) return;

    let bestDiscount = 0;
    let bestCode = '';

    this.coupons.forEach((coupon: any) => {
      if (!coupon.isActive) return;
      if (this.total < coupon.minOrderAmount) return;

      let discount = 0;
      if (coupon.discountType === 'percentage') {
        discount = (this.total * coupon.discountValue) / 100;
        if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
      } else {
        discount = coupon.discountValue;
      }

      if (discount > bestDiscount) {
        bestDiscount = discount;
        bestCode = coupon.code;
      }
    });

    // only call API if a valid code was found
    if (bestCode) {
      this.bestCouponCode = bestCode;
      this.couponCode = bestCode;
      this.applyCoupon(bestCode);
    }
  }

  openCouponModal() {
    this.showCouponModal = true;
  }

  closeCouponModal() {
    this.showCouponModal = false;
  }

  chooseCoupon(code: string) {
    this.couponCode = code;
    this.showCouponModal = false;
    this.applyCoupon(code);
  }

  increase(productId: any) {
    this.cartService.increaseQty(this.userId, productId).subscribe(() => {
      this.loadCart();
    });
  }

  decrease(productId: any) {
    this.cartService.decreaseQty(this.userId, productId).subscribe(() => {
      this.loadCart();
    });
  }

  remove(productId: any) {
    this.cartService.removeItem(this.userId, productId).subscribe(() => {
      this.loadCart();
    });
  }

  calculateTotal() {
    this.total = 0;
    this.cartItems.forEach((item: any) => {
      if (item.productId && item.productId.price) {
        this.total += item.productId.price * item.quantity;
      }
    });
  }

  applyCoupon(code: string) {
    const coupon = code.trim();

    if (!coupon) {
      this.couponError = 'Please enter coupon code';
      return;
    }

    this.discount = 0;
    this.couponError = '';

    this.couponService
      .applyCoupon({
        code: coupon,
        cartTotal: this.total,
      })
      .subscribe({
        next: (res: any) => {
          this.discount = res.discount;
          this.finalTotal = this.total + 40 - this.discount;
          this.cdr.detectChanges();
        },

        error: (err: any) => {
          this.discount = 0;
          this.finalTotal = this.total + 40;
          this.couponError = err.error.message;
        },
      });
  }
  resetCoupon() {
    this.discount = 0;
    this.finalTotal = this.total + 40;
    this.couponError = '';
  }

  selectCoupon(code: string) {
    this.couponCode = code;
    this.showCouponModal = false;
    this.applyCoupon(code);
  }

  goToCheckout() {
    if (this.cartItems.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Cart is Empty',
        text: 'Please add items before proceeding.',
        timer: 1800,
        showConfirmButton: false,
      });
      return;
    }
    this.router.navigate(['/checkout'], {
      state: {
        cartItems: this.cartItems,
        total: this.total,
        discount: this.discount,
        couponCode: this.couponCode,
        finalTotal: this.total + 40 - this.discount,
      },
    });
  }
}
