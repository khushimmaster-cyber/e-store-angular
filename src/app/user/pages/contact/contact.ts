import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MSwal as Swal } from '../../../service/swal-service';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './contact.html',
  styleUrl: './contact.css',
})
export class Contact {
  form = { name: '', email: '', subject: '', message: '' };
  loading = false;

  constructor(private http: HttpClient) {}

  send() {
    if (!this.form.name || !this.form.email || !this.form.message) {
      Swal.fire({
        icon: 'warning',
        title: 'Incomplete Form',
        text: 'Please fill in Name, Email and Message.',
        confirmButtonColor: '#9B7B5E',
      });
      return;
    }

    this.loading = true;

    this.http.post('https://moska-backend-1.onrender.com/api/contact', this.form).subscribe({
      next: () => {
        this.loading = false;
        Swal.fire({
          icon: 'success',
          title: 'Message Sent!',
          text: "Thank you for reaching out. We'll get back to you within 24–48 hours.",
          confirmButtonColor: '#9B7B5E',
          timer: 4000,
          timerProgressBar: true,
        }).then(() => {
          this.form = { name: '', email: '', subject: '', message: '' };
        });
      },
      error: (err) => {
        this.loading = false;
        Swal.fire({
          icon: 'error',
          title: 'Oops!',
          text: err?.error?.message || 'Something went wrong. Please try again.',
          confirmButtonColor: '#9B7B5E',
        });
      }
    });
  }
}
