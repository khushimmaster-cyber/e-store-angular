import { Component, OnInit } from '@angular/core';
import { CommonModule, AsyncPipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { WishlistService } from '../../../service/wishlist-service';
import { ProductService } from '../../../service/product-service';
import { CartService } from '../../../service/cart-service';
import { MSwal as Swal } from '../../../service/swal-service';
import { combineLatest, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-wishlist',
  templateUrl: './wishlist.html',
  styleUrl: './wishlist.css',
  standalone: true,
  imports: [CommonModule, AsyncPipe, RouterLink]
})
export class Wishlist implements OnInit {

  private readonly baseUrl = 'https://moska-backend-1.onrender.com/uploads/';
  products$!: Observable<any[]>;

  constructor(
    private wishlistService: WishlistService,
    private productService: ProductService,
    private cartService: CartService,
    private router: Router,
  ) {}

  ngOnInit() {
    const userId = sessionStorage.getItem('id');
    if (!userId) { this.router.navigate(['/login']); return; }

    this.products$ = combineLatest([
      this.wishlistService.wishlistIds$,
      this.productService.getAllProducts()
    ]).pipe(
      map(([ids, res]: [string[], any]) => {
        const all: any[] = res?.data ?? res ?? [];
        return all.filter(p => ids.includes(p._id));
      })
    );
  }

  // Resolve image — Cloudinary URL as-is, legacy filename gets uploads prefix
  resolveImage(pic: string): string {
    if (!pic || pic === 'no-image.jpg') return 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=300';
    if (pic.startsWith('http')) return pic;
    return this.baseUrl + pic;
  }

  // Navigate to product details page
  goToDetails(productId: string) {
    this.router.navigate(['/productdetails', productId]);
  }

  // Remove from wishlist
  remove(productId: string) {
    this.wishlistService.toggle(productId);
  }

  // Add to cart
  addToCart(product: any) {
    const userId = sessionStorage.getItem('id');
    if (!userId) { this.router.navigate(['/login']); return; }

    this.cartService.addToCart({ userId, productId: product._id, quantity: 1 }).subscribe({
      next: () => {
        Swal.fire({
          icon: 'success',
          title: 'Added to Cart!',
          text: `${product.pname} added to your cart.`,
          timer: 1500,
          showConfirmButton: false,
          toast: true,
          position: 'bottom-end'
        });
      },
      error: () => {
        Swal.fire({ icon: 'error', title: 'Failed', text: 'Could not add to cart.', confirmButtonColor: '#9B7B5E' });
      }
    });
  }
}
