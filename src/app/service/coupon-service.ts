import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class CouponService {
  private apiUrl = 'https://moska-backend-1.onrender.com/api/coupons';

  constructor(private http: HttpClient) {}

  // CREATE
  createCoupon(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/create`, data);
  }

  // GET ALL (ADMIN)
  getCoupons(): Observable<any> {
    return this.http.get(`${this.apiUrl}`);
  }

  // UPDATE
  updateCoupon(id: string, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, data);
  }

  // DELETE
  deleteCoupon(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  // POPULAR (HOME PAGE)
  getPopularCoupons(): Observable<any> {
    return this.http.get(`${this.apiUrl}/popular`);
  }

  // ACTIVE (CART PAGE — popular + non-popular)
  getActiveCoupons(): Observable<any> {
    return this.http.get(`${this.apiUrl}/active`);
  }

  // APPLY (CART PAGE)
  applyCoupon(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/apply`, data);
  }
}
