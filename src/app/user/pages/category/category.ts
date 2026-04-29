import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CategoryService } from '../../../service/category-service';

@Component({
  selector: 'app-category',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './category.html',
  styleUrl: './category.css',
})
export class Category implements OnInit {
  categories: any[] = [];
  filteredCategories: any[] = [];
  searchTerm: string = '';

  constructor(
    private categoryService: CategoryService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadCategories();
  }

  loadCategories() {
    this.categoryService.get().subscribe({
      next: (res: any) => {
        const data = res?.data ?? res;
        this.categories = data;
        this.filteredCategories = [...data];
        this.cdr.detectChanges();
      },
      error: () => {}
    });
  }

  filterCategories() {
    if (!this.searchTerm || this.searchTerm.trim() === '') {
      this.filteredCategories = [...this.categories];
    } else {
      const term = this.searchTerm.toLowerCase().trim();
      this.filteredCategories = this.categories.filter(cat =>
        cat.cat_name?.toLowerCase().includes(term)
      );
    }
  }
}

