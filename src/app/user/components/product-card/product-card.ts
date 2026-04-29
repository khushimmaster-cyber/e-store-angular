import { Component, Input, Output, EventEmitter, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, AsyncPipe } from '@angular/common';
import { Router } from '@angular/router';
import { WishlistService } from '../../../service/wishlist-service';
import { MSwal as Swal } from '../../../service/swal-service';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule, AsyncPipe],
  templateUrl: './product-card.html',
  styleUrls: ['./product-card.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductCardComponent implements OnInit {
  @Input() product: any;
  @Input() selectedColor: string = '';

  @Output() addToCart     = new EventEmitter<Event>();
  @Output() colorSelected = new EventEmitter<{ event: Event; color: any }>();
  @Output() cardClicked   = new EventEmitter<Event>();

  readonly baseUrl = 'https://moska-backend-1.onrender.com/uploads/';

  isWishlisted$!: Observable<boolean>;

  constructor(
    private wishlistService: WishlistService,
    private router: Router,
  ) {}

  ngOnInit() {
    this.isWishlisted$ = this.wishlistService.wishlistIds$.pipe(
      map(ids => ids.includes(this.product?._id))
    );
  }

  // Resolve image: Cloudinary URLs are used as-is; legacy filenames get the uploads prefix
  private resolveImage(pic: string): string {
    if (!pic || pic === 'no-image.jpg') return 'assets/images/no-image.jpg';
    if (pic.startsWith('http')) return pic;
    return this.baseUrl + pic;
  }

  get cardImage(): string {
    if (this.selectedColor && this.product?.colors?.length) {
      const match = this.product.colors.find(
        (c: any) => (c.color ?? c) === this.selectedColor
      );
      if (match?.image && match.image !== 'no-image.jpg') {
        return this.resolveImage(match.image);
      }
    }
    return this.resolveImage(this.product?.pic1);
  }

  get hoverImage(): string {
    return this.resolveImage(this.product?.picHover);
  }

  onCardClick(e: Event)  { this.cardClicked.emit(e); }
  onAddToCart(e: Event)  { e.preventDefault(); e.stopPropagation(); this.addToCart.emit(e); }
  onColorSelect(e: Event, color: any) {
    e.preventDefault(); e.stopPropagation();
    this.colorSelected.emit({ event: e, color });
  }

  onToggleWishlist(e: Event) {
    e.preventDefault();
    e.stopPropagation();

    const userId = sessionStorage.getItem('id');
    if (!userId) { this.router.navigate(['/login']); return; }

    this.wishlistService.toggle(this.product?._id);
  }
}
