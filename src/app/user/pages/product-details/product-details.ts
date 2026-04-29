import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ProductService } from '../../../service/product-service';
import { RatingService } from '../../../service/rating-service';
import { NgFor, NgIf, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CartService } from '../../../service/cart-service';
import { WishlistService } from '../../../service/wishlist-service';
import { ThemeService } from '../../../service/theme-service';
import { MSwal as Swal } from '../../../service/swal-service';

@Component({
  selector: 'app-product-details',
  imports: [NgFor, NgIf, FormsModule, DatePipe],  templateUrl: './product-details.html',
  styleUrl: './product-details.css',
})
export class ProductDetails implements OnInit, OnDestroy {

  id: string | null = '';
  product: any;
  selectedColor: string = '';
  selectedSize: string = '';
  displayImage: string = '';

  // reviews state
  reviews: any[] = [];
  avgRating: number = 0;
  totalReviews: number = 0;
  starCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

  // write review form
  newReview = { userName: '', rating: 0, title: '', comment: '' };
  hoverRating: number = 0;
  submitSuccess = false;
  submitting = false;

  stars = [1, 2, 3, 4, 5];

  constructor(
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    private productService: ProductService,
    private ratingService: RatingService,
    private cartService: CartService,
    private router: Router,
    public wishlistService: WishlistService,
    private themeService: ThemeService
  ) {}

  isWishlisted = false;
  private wishlistSub!: Subscription;

  ngOnInit() {
    this.id = this.route.snapshot.params['id'];
    this.loadProduct();
    this.loadReviews();
    this.wishlistSub = this.wishlistService.wishlistIds$.subscribe(ids => {
      this.isWishlisted = ids.includes(this.id!);
      this.cdr.detectChanges();
    });
  }

  ngOnDestroy() {
    this.wishlistSub?.unsubscribe();
  }

  // Resolve image: Cloudinary URLs used as-is; legacy filenames get the uploads prefix
  resolveImage(pic: string): string {
    if (!pic || pic === 'no-image.jpg') return '';
    if (pic.startsWith('http')) return pic;
    return `https://moska-backend-1.onrender.com/uploads/${pic}`;
  }

  loadProduct() {
    this.productService.getById(this.id).subscribe({
      next: (res: any) => {
        this.product = res.data;
        this.displayImage = this.resolveImage(this.product.pic1);

        const paramColor = this.route.snapshot.queryParamMap.get('color');

        if (paramColor && this.product.colors?.length > 0) {
          const match = this.product.colors.find((c: any) => (c.color ?? c) === paramColor);
          if (match) {
            this.selectedColor = match.color ?? match;
            this.displayImage = (match.image && match.image !== 'no-image.jpg')
              ? this.resolveImage(match.image) : this.resolveImage(this.product.pic1);
          } else {
            this.selectedColor = paramColor;
          }
        } else if (this.product.colors?.length > 0) {
          const first = this.product.colors[0];
          this.selectedColor = first.color ?? first;
          if (first.image && first.image !== 'no-image.jpg') {
            this.displayImage = this.resolveImage(first.image);
          }
        }

        this.cdr.detectChanges();
      }
    });
  }

  loadReviews() {
    this.ratingService.getReviews(this.id!).subscribe({
      next: (res: any) => {
        this.reviews = res.data;
        this.avgRating = res.avgRating || 0;
        this.totalReviews = res.total || 0;
        this.starCounts = res.starCounts || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        this.cdr.detectChanges();
      }
    });
  }

  selectColor(colorObj: any) {
    this.selectedColor = colorObj.color ?? colorObj;
    this.displayImage = (colorObj.image && colorObj.image !== 'no-image.jpg')
      ? this.resolveImage(colorObj.image)
      : this.resolveImage(this.product.pic1);
    this.cdr.detectChanges();
  }

  setRating(star: number) {
    this.newReview.rating = star;
  }

  getStarPercent(star: number): number {
    if (!this.totalReviews) return 0;
    return Math.round(((this.starCounts[star] || 0) / this.totalReviews) * 100);
  }

  getInitials(name: string): string {
    if (!name) return '?';
    return name.trim().split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  submitReview() {
    if (!this.newReview.userName.trim() || !this.newReview.rating || !this.newReview.comment.trim()) {
      Swal.fire({ icon: 'warning', title: 'Incomplete', text: 'Please enter your name, select a rating and write a comment.', confirmButtonColor: '#9B7B5E' });
      return;
    }
    this.submitting = true;
    this.ratingService.addReview(this.id!, this.newReview).subscribe({
      next: () => {
        this.submitting = false;
        this.newReview = { userName: '', rating: 0, title: '', comment: '' };
        this.hoverRating = 0;
        this.loadReviews();
        Swal.fire({ icon: 'success', title: 'Review Submitted!', timer: 1800, showConfirmButton: false, toast: true, position: 'top-end' });
      },
      error: () => {
        this.submitting = false;
        Swal.fire({ icon: 'error', title: 'Failed', text: 'Failed to submit review. Please try again.', confirmButtonColor: '#9B7B5E' });
      }
    });
  }


  quantity: number = 1;

  increaseQty() { this.quantity++; }
  decreaseQty() { if (this.quantity > 1) this.quantity--; }

  user_id: string | null = sessionStorage.getItem('id');

  toggleWishlist() {
    if (!this.user_id) { this.router.navigate(['/login']); return; }
    const wasWishlisted = this.isWishlisted;
    this.wishlistService.toggle(this.id!);

    const dark = this.themeService.dark;
    const swalDark = dark ? { background: '#1e1e1e', color: '#f0ebe4' } : {};

    if (!wasWishlisted) {
      Swal.fire({
        icon: 'success', title: 'Added to Wishlist!',
        text: 'This product has been saved to your wishlist.',
        timer: 2000, showConfirmButton: false, toast: true, position: 'top-end', ...swalDark
      });
    } else {
      Swal.fire({
        icon: 'info', title: 'Removed from Wishlist',
        timer: 1500, showConfirmButton: false, toast: true, position: 'top-end', ...swalDark
      });
    }
  }

  addToCart(pid: any) {
    if (!this.user_id) {
      this.router.navigate(['/login']);
      return;
    }

    // Validate size selection for clothes
    if (this.product.sizes?.length > 0 && !this.selectedSize) {
      Swal.fire({ icon: 'warning', title: 'Select a Size', text: 'Please select a size before adding to cart.', confirmButtonColor: '#9B7B5E' });
      return;
    }

    const addCart = {
      userId: this.user_id,
      productId: pid,
      quantity: this.quantity,
      size: this.selectedSize || undefined,
    };

    this.cartService.addToCart(addCart).subscribe({
      next: () => {
        Swal.fire({
          icon: 'success',
          title: 'Added to Cart 🛒',
          timer: 1500,
          showConfirmButton: false,
          toast: true,
          position: 'top-end',
        });
      },
      error: () => {}
    });
  }

  buyNow() {
    if (!this.user_id) {
      this.router.navigate(['/login']);
      return;
    }

    // Validate size selection for clothes
    if (this.product.sizes?.length > 0 && !this.selectedSize) {
      Swal.fire({ icon: 'warning', title: 'Select a Size', text: 'Please select a size before proceeding.', confirmButtonColor: '#9B7B5E' });
      return;
    }

    const cartItems = [{
      productId: this.product,
      quantity: this.quantity,
      color: this.selectedColor || '',
      size: this.selectedSize || '',
      displayImage: this.displayImage || this.product.pic1,
    }];

    const total = this.product.price * this.quantity;

    this.router.navigate(['/checkout'], {
      state: {
        cartItems,
        total,
        discount: 0,
        couponCode: '',
        finalTotal: total + 40,
      },
    });
  }
}
