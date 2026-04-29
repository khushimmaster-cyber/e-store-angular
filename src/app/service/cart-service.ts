

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CartService {

  apiUrl = "https://moska-backend-1.onrender.com/api/cart/";

  constructor(private http: HttpClient) {}

  // Add to Cart
  addToCart(data:any): Observable<any>{
    return this.http.post(this.apiUrl + "add", data);
  }

  // Get User Cart
  getCart(userId:any): Observable<any>{
    return this.http.get(this.apiUrl + userId);
  }

  // Increase Quantity
  increaseQty(userId:any, productId:any): Observable<any>{
    return this.http.put(this.apiUrl + "increase", {
      userId,
      productId
    });
  }

  // Decrease Quantity
  decreaseQty(userId:any, productId:any): Observable<any>{
    return this.http.put(this.apiUrl + "decrease", {
      userId,
      productId
    });
  }

  // Remove Item
  removeItem(userId:any, productId:any): Observable<any>{
    return this.http.delete(this.apiUrl + "remove", {
      body: { userId, productId }
    });
  }

  // Clear Cart
  clearCart(userId:any): Observable<any>{
    return this.http.delete(this.apiUrl + "clear", {
      body: { userId }
    });
  }

}