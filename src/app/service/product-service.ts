import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})

export class ProductService {
  url = "https://moska-backend-1.onrender.com/api/products"; // backend base URL

  constructor(private http: HttpClient) { }

  // GET all products
  getAllProducts() {
    return this.http.get(this.url + '/getall'); // backend API
  }

  // GET single product by id
  getById(id: any) {
    return this.http.get(this.url + "/get/" + id);
  }

   getcatById(id: any) {
    return this.http.get(this.url + "/getcat/" + id);
  }

  // UPDATE product
  updateProduct(id: any, data: any) {
    return this.http.put(this.url + "/update/" + id, data);
  }

  // DELETE product
  deleteProduct(id: any) {
    return this.http.delete(this.url + "/delete/" + id);
  }

  // ADD product
  addProduct(data: any) {
    return this.http.post(this.url + "/add", data);
  }

  getAll() {
    return this.http.get(this.url + "/all");
  }

  getRandomPopular() {
    // cache-bust so every call hits the server fresh and returns new random 5
    return this.http.get(`${this.url}/popular/random?t=${Date.now()}`);
  }
}