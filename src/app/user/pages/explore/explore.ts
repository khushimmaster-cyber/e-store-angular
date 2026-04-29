import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ProductService } from '../../../service/product-service';
import { CategoryService } from '../../../service/category-service';
import { CartService } from '../../../service/cart-service';
import { MSwal as Swal } from '../../../service/swal-service';
import { ProductCardComponent } from '../../components/product-card/product-card';

@Component({
  selector: 'app-explore',
  standalone: true,
  imports: [CommonModule, FormsModule, ProductCardComponent],
  templateUrl: './explore.html',
  styleUrls: ['./explore.css'],
})
export class Explore implements OnInit {
  allProducts: any[] = [];
  categories: any[] = [];
  selectedColors: Record<string, string> = {};

  // Filters
  searchQuery   = '';
  selectedCat   = '';
  sortBy        = 'default';
  minPrice      = 0;
  maxPrice      = 10000;
  priceMax      = 10000;
  viewMode: 'grid' | 'list' = 'grid';
  loading       = true;

  userId = sessionStorage.getItem('id');

  constructor(
    private pService: ProductService,
    private catService: CategoryService,
    private cartService: CartService,
    private cdr: ChangeDetectorRef,
    public router: Router,
    private route: ActivatedRoute,
  ) {}

  ngOnInit() {
    // read category from queryParam (e.g. from footer click)
    this.route.queryParams.subscribe(params => {
      if (params['cat']) this.selectedCat = params['cat'];
    });

    this.catService.get().subscribe({
      next: (res: any) => { this.categories = res?.data ?? res; this.cdr.detectChanges(); },
      error: () => {}
    });

    this.pService.getAllProducts().subscribe({
      next: (res: any) => {
        this.allProducts = res?.data ?? res ?? [];
        const prices = this.allProducts.map((p: any) => +p.price).filter(Boolean);
        if (prices.length) {
          this.priceMax = Math.ceil(Math.max(...prices) / 100) * 100;
          this.maxPrice = this.priceMax;
        }
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.loading = false; }
    });
  }
  get filtered(): any[] {
    let list = [...this.allProducts];

    if (this.selectedCat) {
      list = list.filter(p => p.category?._id === this.selectedCat || p.category?.cat_name === this.selectedCat);
    }

    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      list = list.filter(p =>
        p.pname?.toLowerCase().includes(q) ||
        p.category?.cat_name?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q)
      );
    }

    // only apply price filter if user has changed the slider
    if (this.maxPrice < this.priceMax || this.minPrice > 0) {
      list = list.filter(p => +p.price >= this.minPrice && +p.price <= this.maxPrice);
    }

    switch (this.sortBy) {
      case 'price-asc':  list.sort((a, b) => +a.price - +b.price); break;
      case 'price-desc': list.sort((a, b) => +b.price - +a.price); break;
      case 'name-asc':   list.sort((a, b) => a.pname?.localeCompare(b.pname)); break;
      case 'name-desc':  list.sort((a, b) => b.pname?.localeCompare(a.pname)); break;
    }

    return list;
  }

  get totalResults() { return this.filtered.length; }

  get selectedCatName(): string {
    return this.categories.find(c => c._id === this.selectedCat)?.cat_name || 'Category';
  }

  clearFilters() {
    this.searchQuery = '';
    this.selectedCat = '';
    this.sortBy = 'default';
    this.minPrice = 0;
    this.maxPrice = this.priceMax;
  }

  isWishlisted(id: string) { return false; } // kept for template compat — card handles it

  toggleWishlist(e: Event, id: string) {
    e.preventDefault(); e.stopPropagation();
  }

  addToCart(e: Event, p: any) {
    e.preventDefault(); e.stopPropagation();

    const userId = sessionStorage.getItem('id');
    if (!userId) { this.router.navigate(['/login']); return; }

    this.cartService.addToCart({ userId, productId: p._id, quantity: 1 }).subscribe({
      next: () => {
        Swal.fire({
          icon: 'success', title: 'Added to Cart!', text: `${p.pname} added.`,
          timer: 1500, showConfirmButton: false, toast: true, position: 'top-end'
        });
      },
      error: () => {
        Swal.fire({ icon: 'error', title: 'Failed', text: 'Could not add to cart.', confirmButtonColor: '#9B7B5E' });
      }
    });
  }

  imgUrl(pic: string): string {
    if (!pic || pic === 'no-image.jpg') return '';
    if (pic.startsWith('http')) return pic;
    return `https://moska-backend-1.onrender.com/uploads/${pic}`;
  }

  selectColor(e: Event, productId: string, colorObj: any) {
    e.preventDefault(); e.stopPropagation();
    this.selectedColors[productId] = colorObj.color ?? colorObj;
    this.cdr.detectChanges();
  }

  getCardImage(p: any): string {
    const sel = this.selectedColors[p._id];
    if (sel && p.colors?.length) {
      const match = p.colors.find((c: any) => (c.color ?? c) === sel);
      if (match?.image && match.image !== 'no-image.jpg') return match.image;
    }
    return p.pic1;
  }

  navigateToDetails(e: Event, p: any) {
    e.preventDefault(); e.stopPropagation();
    const color = this.selectedColors[p._id] || '';
    this.router.navigate(['/productdetails', p._id], color ? { queryParams: { color } } : {});
  }

  countByCat(catId: string): number {
    return this.allProducts.filter(p => p.category?._id === catId).length;
  }
}
