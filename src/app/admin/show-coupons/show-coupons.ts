import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CouponService } from '../../service/coupon-service';
import { MSwal as Swal } from '../../service/swal-service';

@Component({
  selector: 'app-show-coupons',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './show-coupons.html',
  styleUrls: ['./show-coupons.css']
})
export class ShowCoupons implements OnInit {

  coupons: any[] = [];
  searchTerm: string = '';

  constructor(
    private couponService: CouponService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadCoupons();
  }

  loadCoupons() {

    this.couponService.getCoupons().subscribe({

      next: (res:any) => {

        this.coupons = res.data || [];

        this.cdr.detectChanges();

      },

      error: (err) => {}

    });

  }

  filteredCoupons(){

    if(!this.searchTerm){
      return this.coupons;
    }

    const term = this.searchTerm.toLowerCase();

    return this.coupons.filter(c =>
      c.code?.toLowerCase().includes(term) ||
      c.title?.toLowerCase().includes(term)
    );

  }

  editCoupon(id:string){

    this.router.navigate(['/admin/edit-coupon', id]);

  }

  deleteCoupon(id: string) {
    Swal.fire({
      title: 'Delete this coupon?', icon: 'warning',
      showCancelButton: true, confirmButtonColor: '#c85a54', cancelButtonColor: '#9B7B5E',
      confirmButtonText: 'Yes, delete'
    }).then(result => {
      if (result.isConfirmed) {
        this.couponService.deleteCoupon(id).subscribe(() => {
          this.coupons = this.coupons.filter(c => c._id !== id);
          this.cdr.detectChanges();
          Swal.fire({ icon: 'success', title: 'Deleted!', timer: 1200, showConfirmButton: false });
        });
      }
    });
  }

  getActiveCoupons(){

    return this.coupons.filter(c => c.isActive).length;

  }

  getPopularCoupons() {
    return this.coupons.filter(c => c.popular).length;
  }

  togglePopular(c: any) {
    this.couponService.updateCoupon(c._id, { popular: !c.popular }).subscribe({
      next: () => {
        c.popular = !c.popular;
        this.cdr.detectChanges();
        Swal.fire({
          icon: 'success',
          title: c.popular ? '⭐ Marked as Popular!' : 'Removed from Popular',
          timer: 1200, showConfirmButton: false, toast: true, position: 'top-end'
        });
      }
    });
  }

}