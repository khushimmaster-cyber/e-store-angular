import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class WishlistService {
  private apiUrl = 'https://moska-backend-1.onrender.com/api/wishlist/';

  private wishlistIds = new BehaviorSubject<string[]>([]);
  wishlistIds$ = this.wishlistIds.asObservable();

  constructor(private http: HttpClient) {}

  /** Call once on app init (AppComponent.ngOnInit) */
  loadWishlist() {
    const userId = sessionStorage.getItem('id');
    if (!userId) return;
    this.http.get<any>(this.apiUrl + userId).subscribe({
      next: (res) => {
        const ids = (res.data || []).map((p: any) => (p._id || p).toString());
        this.wishlistIds.next(ids);
      },
      error: () => {}
    });
  }

  /** Optimistic toggle — flips state immediately, then syncs backend */
  toggle(productId: string) {
    const userId = sessionStorage.getItem('id');
    if (!userId) return;

    const current = this.wishlistIds.value;
    const updated = current.includes(productId)
      ? current.filter(id => id !== productId)
      : [...current, productId];

    // Optimistic update
    this.wishlistIds.next(updated);

    // Backend sync
    this.http.post<any>(this.apiUrl + 'toggle', { userId, productId }).subscribe({
      next: (res) => {
        const ids = (res.data || []).map((p: any) => (p._id || p).toString());
        this.wishlistIds.next(ids);
      },
      error: () => {
        // Revert on failure
        this.wishlistIds.next(current);
      }
    });
  }

  getIds(): string[] {
    return this.wishlistIds.value;
  }
}
