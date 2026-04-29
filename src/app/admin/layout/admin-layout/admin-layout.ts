import { Component, OnInit, OnDestroy } from '@angular/core';
import { Footer } from '../footer/footer';
import { RouterOutlet } from '@angular/router';
import { Header } from '../header/header';
import { Sidebar } from '../sidebar/sidebar';
import { ThemeService } from '../../../service/theme-service';

@Component({
  selector: 'app-admin-layout',
  imports: [Header, Footer, RouterOutlet, Sidebar],
  templateUrl: './admin-layout.html',
  styleUrl: './admin-layout.css',
})
export class AdminLayout implements OnInit, OnDestroy {
  sidebarOpen = false;

  constructor(private themeService: ThemeService) {}

  ngOnInit() {
    this.themeService.forceLightMode();
  }

  ngOnDestroy() {
    this.themeService.restoreUserTheme();
  }

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }

  closeSidebar() {
    this.sidebarOpen = false;
  }
}
