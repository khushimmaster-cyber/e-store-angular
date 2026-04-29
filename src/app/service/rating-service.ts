import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class RatingService {
  private url = 'https://moska-backend-1.onrender.com/api/ratings';

  constructor(private http: HttpClient) {}

  getReviews(productId: string) {
    return this.http.get(`${this.url}/${productId}`);
  }

  addReview(productId: string, data: { userName: string; rating: number; title: string; comment: string }) {
    return this.http.post(`${this.url}/${productId}`, data);
  }
}
