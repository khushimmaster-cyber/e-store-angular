import { Component, OnInit, OnDestroy, HostListener, Output, EventEmitter } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { NgIf, NgFor, DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { MSwal as Swal } from '../../../service/swal-service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [NgIf, NgFor, RouterLink, DatePipe],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header implements OnInit, OnDestroy {
  adminName  = sessionStorage.getItem('adminName')  || 'Admin';
  adminEmail = sessionStorage.getItem('adminEmail') || '';

  dropdownOpen      = false;
  notifOpen         = false;
  notifications: any[] = [];
  unreadCount       = 0;

  @Output() menuToggle = new EventEmitter<void>();

  private pollInterval: any;

  constructor(private router: Router, private http: HttpClient) {}

  ngOnInit() {
    this.loadNotifications();
    // Poll every 30 seconds
    this.pollInterval = setInterval(() => this.loadNotifications(), 30000);
  }

  ngOnDestroy() {
    clearInterval(this.pollInterval);
  }

  loadNotifications() {
    this.http.get<any>('https://moska-backend-1.onrender.com/api/admin/notifications').subscribe({
      next: (res) => {
        if (res.success) {
          this.notifications = res.data;
          this.unreadCount   = res.total;
        }
      },
      error: () => {}
    });
  }

  toggleSidebar() {
    this.menuToggle.emit();
  }

  toggleDropdown() {
    this.dropdownOpen = !this.dropdownOpen;
    if (this.dropdownOpen) this.notifOpen = false;
  }

  toggleNotif() {
    this.notifOpen = !this.notifOpen;
    if (this.notifOpen) this.dropdownOpen = false;
  }

  @HostListener('document:click', ['$event'])
  onDocClick(e: MouseEvent) {
    const t = e.target as HTMLElement;
    if (!t.closest('.user-profile'))  this.dropdownOpen = false;
    if (!t.closest('.notif-wrapper')) this.notifOpen    = false;
  }

  logout() {
    Swal.fire({
      title: 'Are you sure?',
      text: 'You will be logged out of the admin panel.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#9B7B5E',
      cancelButtonColor: '#aaa',
      confirmButtonText: 'Yes, Logout',
      cancelButtonText: 'Cancel',
    }).then((result) => {
      if (result.isConfirmed) {
        sessionStorage.removeItem('adminId');
        sessionStorage.removeItem('adminName');
        sessionStorage.removeItem('adminEmail');
        this.router.navigate(['/admin/login']);
      }
    });
  }

  deleteNotif(index: number, e: MouseEvent) {
    e.stopPropagation();
    this.notifications.splice(index, 1);
    this.unreadCount = this.notifications.length;
  }

  clearAll(e: MouseEvent) {
    e.stopPropagation();
    this.notifications = [];
    this.unreadCount   = 0;
  }

  getNotifBg(type: string): string {
    const map: any = { order: '#e6fffa', user: '#ebf4ff', message: '#fffaf0' };
    return map[type] || '#f9f9f9';
  }
}
