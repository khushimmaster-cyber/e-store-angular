import { Component, OnInit } from '@angular/core';
import { ProductService } from '../../../service/product-service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-show-product',
  templateUrl: './show-product.html',
  styleUrls: ['./show-product.css']
})
export class ShowProduct implements OnInit {

  products: any[] = [];
  searchTerm: string = '';

  constructor(
    private pservice: ProductService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadProducts();
  }

  loadProducts() {
    this.pservice.getAllProducts().subscribe({
      next: (res: any) => {
        this.products = res.data || [];
      },
      error: () => {}
    });
  }

  editProduct(id: string) {
    this.router.navigate(['/admin/editproduct', id]);
  }

  deleteProduct(id: string) {
    if(confirm('Are you sure to delete this product?')) {
      this.pservice.deleteProduct(id).subscribe({
        next: () => {
          alert('Product deleted');
          this.loadProducts();
        },
        error: () => {}
      });
    }
  }

  // optional search filter
  filteredProducts() {
    if(!this.searchTerm) return this.products;
    return this.products.filter(p => 
      p.pname.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }
}