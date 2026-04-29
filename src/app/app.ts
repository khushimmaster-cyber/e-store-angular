import { Component, signal, AfterViewInit, OnDestroy, OnInit } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { ThemeService } from './service/theme-service';
import { WishlistService } from './service/wishlist-service';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { MSwal as Swal } from './service/swal-service';

// ── Global MOSKA SweetAlert2 defaults ──
const MoskaSwal = Swal.mixin({
  background: '#FFFDF9',
  color: '#2C2420',
  confirmButtonColor: '#9B7B5E',
  cancelButtonColor: '#EDE6DC',
  customClass: {
    popup:          'moska-swal-popup',
    title:          'moska-swal-title',
    htmlContainer:  'moska-swal-text',
    confirmButton:  'moska-swal-confirm',
    cancelButton:   'moska-swal-cancel',
    icon:           'moska-swal-icon',
  },
  showClass: {
    popup: 'moska-swal-show',
  },
  hideClass: {
    popup: 'moska-swal-hide',
  },
  buttonsStyling: false,
});

// Override global Swal with the mixin so every Swal.fire() call gets the style
(window as any).__moskaSwal = MoskaSwal;
Object.assign(Swal, MoskaSwal);

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements AfterViewInit, OnDestroy, OnInit {
  protected readonly title = signal('major-app');
  private observer!: IntersectionObserver;
  private routerSub!: Subscription;

  constructor(
    private themeService: ThemeService,
    private router: Router,
    private wishlistService: WishlistService,
  ) {}

  ngOnInit() {
    this.wishlistService.loadWishlist();
  }

  ngAfterViewInit(): void {
    this.initScrollReveal();

    // Re-run scroll reveal after every route navigation
    this.routerSub = this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe(() => {
        // Small delay to let the new page render
        setTimeout(() => this.initScrollReveal(), 120);
      });
  }

  private initScrollReveal(): void {
    if (this.observer) this.observer.disconnect();

    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            this.observer.unobserve(entry.target); // animate once
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );

    document.querySelectorAll('.reveal, .reveal-left, .reveal-right')
      .forEach(el => this.observer.observe(el));
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
    this.routerSub?.unsubscribe();
  }
}
