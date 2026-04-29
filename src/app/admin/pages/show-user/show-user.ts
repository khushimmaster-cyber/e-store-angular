import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { NgFor, NgIf, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MSwal as Swal } from '../../../service/swal-service';

@Component({
  selector: 'app-show-user',
  standalone: true,
  imports: [NgFor, NgIf, DatePipe, FormsModule],
  templateUrl: './show-user.html',
  styleUrl: './show-user.css',
})
export class ShowUser implements OnInit {
  users: any[] = [];
  searchQuery = '';
  loading = true;

  constructor(private http: HttpClient) {}

  ngOnInit() { this.loadUsers(); }

  loadUsers() {
    this.loading = true;
    this.http.get<any>('https://moska-backend-1.onrender.com/api/alluser').subscribe({
      next: (res) => { this.users = res?.data ?? res; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  get filtered() {
    const q = this.searchQuery.toLowerCase();
    if (!q) return this.users;
    return this.users.filter(u =>
      u.username?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.mobileno?.includes(q)
    );
  }

  get thisMonthCount() {
    const now = new Date();
    return this.users.filter(u => {
      const d = new Date(u.createdAt);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;
  }

  deleteUser(id: string, name: string) {
    Swal.fire({
      title: `Delete ${name}?`,
      text: 'This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#c0392b',
      cancelButtonColor: '#9B7B5E',
      confirmButtonText: 'Yes, delete',
    }).then(result => {
      if (result.isConfirmed) {
        this.http.delete(`https://moska-backend-1.onrender.com/api/deleteuser/${id}`).subscribe({
          next: () => {
            this.users = this.users.filter(u => u._id !== id);
            Swal.fire({ icon: 'success', title: 'Deleted!', timer: 1500, showConfirmButton: false });
          },
          error: () => Swal.fire({ icon: 'error', title: 'Failed to delete user' })
        });
      }
    });
  }
}
