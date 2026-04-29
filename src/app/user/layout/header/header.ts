import { Component, OnInit, HostListener } from '@angular/core';
import { NgIf } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { ThemeService } from '../../../service/theme-service';

@Component({
  selector: 'app-header',
  imports: [NgIf, RouterLink, RouterLinkActive],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header implements OnInit {

  dropdownOpen = false;
  mobileMenuOpen = false;
  userId: string | null = null;
  isScrolled = false;

  constructor(public themeService: ThemeService, public router: Router) {}

  ngOnInit(): void {
    this.userId = sessionStorage.getItem('id');
  }

  @HostListener('window:scroll')
  onWindowScroll() {
    this.isScrolled = window.scrollY > 30;
  }

  @HostListener('document:click')
  onDocumentClick() {
    this.dropdownOpen = false;
    this.mobileMenuOpen = false;
  }

  toggleDropdown(e: Event) {
    e.stopPropagation();
    this.dropdownOpen = !this.dropdownOpen;
  }

  toggleMobileMenu(e: Event) {
    e.stopPropagation();
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  closeMobileMenu() {
    this.mobileMenuOpen = false;
  }

  closeDropdown() {
    this.dropdownOpen = false;
  }

  logout() {
    sessionStorage.clear();
    this.userId = null;
    this.dropdownOpen = false;
    this.mobileMenuOpen = false;
    this.router.navigate(['/login']);
  }
}
