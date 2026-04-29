import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CategoryService } from '../../../service/category-service';
import { MSwal as Swal } from '../../../service/swal-service';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './footer.html',
  styleUrl: './footer.css',
})
export class Footer implements OnInit {
  categories: any[] = [];
  newsletterEmail = '';

  constructor(
    private catService: CategoryService,
    private router: Router
  ) {}

  ngOnInit() {
    this.catService.get().subscribe({
      next: (res: any) => { this.categories = res?.data ?? res; },
      error: () => {}
    });
  }

  // ── Newsletter ──
  subscribe() {
    const email = this.newsletterEmail.trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      Swal.fire({ icon: 'warning', title: 'Invalid Email', text: 'Please enter a valid email address.', confirmButtonColor: '#C5A059' });
      return;
    }
    this.newsletterEmail = '';
    Swal.fire({ icon: 'success', title: 'Subscribed!', text: 'Welcome to MOSKA. You are now part of our inner circle.', confirmButtonColor: '#C5A059' });
  }

  // ── Shop ──
  goToCategory(catId: string) { this.router.navigate(['/products', catId]); }

  // ── Support ──
  contactUs()  { window.location.href = 'tel:9510636002'; }
  goToOrders() { this.router.navigate(['/myorder']); }
  careGuide()  {
    const to      = 'dhyanimevawala2006@gmail.com';
    const subject = encodeURIComponent('Care Guide Inquiry – MOSKA');
    const body    = encodeURIComponent('Hello MOSKA Team,\n\nI would like to know more about how to care for my products.\n\nPlease share the care guide at your earliest convenience.\n\nThank you!');
    window.open(`https://mail.google.com/mail/?view=cm&to=${to}&su=${subject}&body=${body}`, '_blank');
  }
  openFaq() { window.open('https://www.shopify.com/blog/faq-page', '_blank'); }

  // ── Social ──
  openInstagram() { window.open('https://www.instagram.com', '_blank'); }
  openPinterest()  { window.open('https://www.pinterest.com', '_blank'); }
  openFacebook()   { window.open('https://www.facebook.com', '_blank'); }
}
