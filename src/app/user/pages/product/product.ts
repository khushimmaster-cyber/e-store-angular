import { Component, OnInit } from '@angular/core';
import { ProductService } from '../../../service/product-service';
import { CartService } from '../../../service/cart-service';
import { NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MSwal as Swal } from '../../../service/swal-service';
import { ProductCardComponent } from '../../components/product-card/product-card';

@Component({
  selector: 'app-product',
  standalone: true,
  imports: [NgFor, NgIf, FormsModule, RouterLink, ProductCardComponent],
  templateUrl: './product.html',
  styleUrl: './product.css',
})
export class Product implements OnInit {
  products: any[] = [];
  baseUrl = 'https://moska-backend-1.onrender.com/uploads/';
  id: string = '';
  searchQuery: string = '';
  sortBy: string = 'default';
  loading = true;
  selectedColors: Record<string, string> = {};

  get filteredProducts(): any[] {
    let list = [...this.products];
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      list = list.filter(p =>
        p.pname?.toLowerCase().includes(q) ||
        p.category?.cat_name?.toLowerCase().includes(q)
      );
    }
    switch (this.sortBy) {
      case 'price-asc':  list.sort((a, b) => +a.price - +b.price); break;
      case 'price-desc': list.sort((a, b) => +b.price - +a.price); break;
      case 'name-asc':   list.sort((a, b) => a.pname?.localeCompare(b.pname)); break;
      case 'name-desc':  list.sort((a, b) => b.pname?.localeCompare(a.pname)); break;
    }
    return list;
  }

  constructor(
    private productService: ProductService,
    private cartService: CartService,
    public router: Router,
    private route: ActivatedRoute,
  ) {}

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      this.id = params.get('id') || '';
      this.loadProducts();
    });
  }

  loadProducts() {
    this.loading = true;
    this.productService.getcatById(this.id).subscribe({
      next: (res: any) => {
        this.products = res?.data ?? res ?? [];
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  selectColor(e: Event, productId: string, colorObj: any) {
    e.preventDefault(); e.stopPropagation();
    this.selectedColors[productId] = colorObj.color ?? colorObj;
  }

  navigateToDetails(e: Event, p: any) {
    e.preventDefault(); e.stopPropagation();
    const color = this.selectedColors[p._id] || '';
    this.router.navigate(['/productdetails', p._id], color ? { queryParams: { color } } : {});
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
}
