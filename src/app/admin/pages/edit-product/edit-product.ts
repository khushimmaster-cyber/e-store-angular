import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { NgIf, NgFor, CommonModule } from '@angular/common';
import { CloudinaryUploadService } from '../../../service/cloudinary-upload.service';
import { MSwal as Swal } from '../../../service/swal-service';
import { forkJoin, of } from 'rxjs';

@Component({
  selector: 'app-edit-product',
  standalone: true,
  imports: [ReactiveFormsModule, NgIf, NgFor, CommonModule, RouterLink],
  templateUrl: './edit-product.html',
  styleUrls: ['./edit-product.css']
})
export class EditProduct implements OnInit {

  productForm!: FormGroup;
  productId!: string;
  categories: any[] = [];
  uploading = false;

  mainFile:      File | null = null;
  hoverFile:     File | null = null;
  mainFileName:  string = '';
  hoverFileName: string = '';

  currentMainImage:  string = '';
  currentHoverImage: string = '';

  colorList: { color: string; file: File | null; preview: string; existingImage: string }[] = [
    { color: '#000000', file: null, preview: '', existingImage: '' }
  ];

  readonly baseUrl = 'https://moska-backend-1.onrender.com';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private http: HttpClient,
    private cloudinary: CloudinaryUploadService
  ) {
    this.productForm = this.fb.group({
      pname:       ['', Validators.required],
      category:    ['', Validators.required],
      price:       ['', [Validators.required, Validators.min(1)]],
      oldPrice:    [''],
      stock:       [0, [Validators.min(0)]],
      description: ['', Validators.required]
    });
  }

  ngOnInit() {
    this.productId = this.route.snapshot.paramMap.get('id')!;
    this.loadCategories();
    this.loadProduct();
  }

  loadCategories() {
    this.http.get<any>(`${this.baseUrl}/api/categories/all`).subscribe({
      next: (res: any) => { this.categories = res?.data ?? res; },
      error: () => { this.categories = []; }
    });
  }

  // Cloudinary URLs pass through; legacy filenames get the /uploads/ prefix
  resolveImage(pic: string): string {
    if (!pic || pic === 'no-image.jpg') return '';
    if (pic.startsWith('http')) return pic;
    return `${this.baseUrl}/uploads/${pic}`;
  }

  loadProduct() {
    this.http.get<any>(`${this.baseUrl}/api/products/get/${this.productId}`).subscribe({
      next: (res: any) => {
        const p = res.data;
        this.productForm.patchValue({
          pname:       p.pname,
          category:    p.category?._id || p.category,
          price:       p.price,
          oldPrice:    p.oldPrice || '',
          stock:       p.stock || 0,
          description: p.description
        });

        this.currentMainImage  = this.resolveImage(p.pic1);
        this.currentHoverImage = this.resolveImage(p.picHover);

        this.colorList = (p.colors && p.colors.length > 0)
          ? p.colors.map((c: any) => ({
              color:         c.color ?? c,
              file:          null,
              preview:       '',
              existingImage: this.resolveImage(c.image)
            }))
          : [{ color: '#000000', file: null, preview: '', existingImage: '' }];
      },
      error: () => {
        Swal.fire({ icon: 'error', title: 'Load Failed', text: 'Failed to load product', confirmButtonColor: '#9B7B5E' });
      }
    });
  }

  onMainFileChange(event: any) {
    if (event.target.files.length > 0) {
      this.mainFile = event.target.files[0];
      this.mainFileName = this.mainFile!.name;
      const reader = new FileReader();
      reader.onload = () => { this.currentMainImage = reader.result as string; };
      reader.readAsDataURL(this.mainFile!);
    }
  }

  onHoverFileChange(event: any) {
    if (event.target.files.length > 0) {
      this.hoverFile = event.target.files[0];
      this.hoverFileName = this.hoverFile!.name;
      const reader = new FileReader();
      reader.onload = () => { this.currentHoverImage = reader.result as string; };
      reader.readAsDataURL(this.hoverFile!);
    }
  }

  addColor() {
    this.colorList.push({ color: '#000000', file: null, preview: '', existingImage: '' });
  }

  removeColor(index: number) {
    if (this.colorList.length > 1) this.colorList.splice(index, 1);
  }

  updateColor(index: number, value: string) {
    this.colorList[index].color = value;
  }

  onColorImageChange(index: number, event: any) {
    const file = event.target.files[0];
    if (file) {
      this.colorList[index].file = file;
      const reader = new FileReader();
      reader.onload = () => { this.colorList[index].preview = reader.result as string; };
      reader.readAsDataURL(file);
    }
  }

  onSubmit() {
    if (!this.productForm.valid) {
      Swal.fire({ icon: 'warning', title: 'Incomplete', text: 'Please fill all required fields', confirmButtonColor: '#9B7B5E' });
      return;
    }

    this.uploading = true;

    // Upload only new images to Cloudinary in parallel
    const mainUpload$  = this.mainFile  ? this.cloudinary.upload(this.mainFile)  : of(null);
    const hoverUpload$ = this.hoverFile ? this.cloudinary.upload(this.hoverFile) : of(null);
    const colorUploads$ = this.colorList.map(c =>
      c.file ? this.cloudinary.upload(c.file) : of(null)
    );

    forkJoin([mainUpload$, hoverUpload$, ...colorUploads$]).subscribe({
      next: (results: any[]) => {
        const [mainRes, hoverRes, ...colorResults] = results;

        const body: any = {
          pname:       this.productForm.value.pname,
          category:    this.productForm.value.category,
          price:       this.productForm.value.price,
          description: this.productForm.value.description,
          stock:       this.productForm.value.stock || 0,
        };

        if (this.productForm.value.oldPrice) body.oldPrice = this.productForm.value.oldPrice;
        if (mainRes)  body.pic      = mainRes.secure_url;
        if (hoverRes) body.picHover = hoverRes.secure_url;

        // Colors — send hex + resolved URLs (new upload or keep existing)
        body['colors[]'] = this.colorList.map(c => c.color);
        body['colorImages[]'] = colorResults.map((r, i) =>
          r?.secure_url || this.colorList[i].existingImage || ''
        );

        this.http.put(`${this.baseUrl}/api/products/update/${this.productId}`, body).subscribe({
          next: () => {
            this.uploading = false;
            Swal.fire({ icon: 'success', title: 'Product Updated!', timer: 1500, showConfirmButton: false })
              .then(() => this.router.navigate(['/admin/showproduct']));
          },
          error: () => {
            this.uploading = false;
            Swal.fire({ icon: 'error', title: 'Update Failed', text: 'Failed to update product', confirmButtonColor: '#9B7B5E' });
          }
        });
      },
      error: (err) => {
        this.uploading = false;
        console.error('Cloudinary upload error:', err);
        Swal.fire({ icon: 'error', title: 'Upload Failed', text: 'Image upload to Cloudinary failed. Check your upload preset.', confirmButtonColor: '#9B7B5E' });
      }
    });
  }
}
