import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class CategoryService {

  private api = 'https://moska-backend-1.onrender.com/api/categories';

  constructor(private http: HttpClient) {}

  get(): Observable<any> {
    return this.http.get<any>(this.api + '/all');
  }

   getSingleCategory(id: string) {
    return this.http.get(`${this.api}/get/${id}`);
  }
  
  add(data: FormData) {
    return this.http.post(this.api + '/add', data);
  }

  // New method for Cloudinary (base64 image)
  addWithCloudinary(data: any) {
    return this.http.post(this.api + '/add', data);
  }

  delete(id: string) {
    return this.http.delete(this.api + '/delete/' + id);
  }

   updateCategory(id: string, data: FormData) {
    return this.http.put(`${this.api}/update/${id}`, data);
  }

  // New method for Cloudinary update (base64 image)
  updateWithCloudinary(id: string, data: any) {
    return this.http.put(`${this.api}/update/${id}`, data);
  }
}