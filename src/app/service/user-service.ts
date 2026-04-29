import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class UserService {

  url="https://moska-backend-1.onrender.com/api/"

  constructor(private http:HttpClient){}

    verifyOtp(data: any) {
    return this.http.post(this.url + 'verify-otp', data);
  }

  register(data:any){
    return this.http.post(this.url+"register",data)
  }

  login(data:any){
    return this.http.post(this.url+"login",data)
  }

  get(){
    return this.http.get(this.url+"alluser")
  }

  getUser(uid:any){
    return this.http.get(this.url + "user/" + uid);
  }

  sendOtp(data: any) {
    return this.http.post(this.url + 'send-otp', data);
  }

  forgotPasswordOtp(data: any) {
    return this.http.post(this.url + 'forgot-password-otp', data);
  }

  resetPassword(data: any) {
    return this.http.post(this.url + 'reset-password', data);
  }

}