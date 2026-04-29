import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ProductService } from '../../../service/product-service';
import { CategoryService } from '../../../service/category-service';
import { CloudinaryUploadService } from '../../../service/cloudinary-upload.service';
import { Router, RouterLink } from '@angular/router';
import { NgIf, NgFor } from '@angular/common';
import { MSwal as Swal } from '../../../service/swal-service';
import { forkJoin, of } from 'rxjs';

@Component({
  selector: 'app-add-product',
  templateUrl: './add-product.html',
  styleUrls: ['./add-product.css'],
  imports: [ReactiveFormsModule, NgIf, NgFor, RouterLink]
})
export class AddProduct implements OnInit {

  productForm!: FormGroup;
  categories: any[] = [];
  uploading = false;

  mainFile:      File | null = null;
  hoverFile:     File | null = null;
  mainFileName:  string = '';
  hoverFileName: string = '';

  colorList: { color: string; file: File | null; preview: string }[] = [
    { color: '#000000', file: null, preview: '' }
  ];

  availableSizes = ['S', 'M', 'L', 'XL', 'XXL'];
  selectedSizes: string[] = [];

  get isClothesCategory(): boolean {
    const catId = this.productForm.get('category')?.value;
    const cat = this.categories.find(c => c._id === catId);
    return cat?.cat_name?.toLowerCase() === 'clothes';
  }

  toggleSize(size: string) {
    const idx = this.selectedSizes.indexOf(size);
    if (idx > -1) this.selectedSizes.splice(idx, 1);
    else this.selectedSizes.push(size);
  }

  isSizeSelected(size: string): boolean {
    return this.selectedSizes.includes(size);
  }

  constructor(
    private fb: FormBuilder,
    private pservice: ProductService,
    private categoryService: CategoryService,
    private cloudinary: CloudinaryUploadService,
    private router: Router
  ) {
    this.productForm = this.fb.group({
      pname:       ['', Validators.required],
      category:    ['', Validators.required],
      price:       ['', [Validators.required, Validators.min(1)]],
      oldPrice:    [''],
      stock:       [0, [Validators.min(0)]],
      description: ['', Validators.required],
      popular:     [false],
    });
  }

  ngOnInit() {
    this.categoryService.get().subscribe({
      next: (res: any) => { this.categories = res?.data ?? res; },
      error: () => { this.categories = []; }
    });
  }

  onMainFileChange(event: any) {
    if (event.target.files.length > 0) {
      this.mainFile = event.target.files[0];
      this.mainFileName = this.mainFile!.name;
    }
  }

  onHoverFileChange(event: any) {
    if (event.target.files.length > 0) {
      this.hoverFile = event.target.files[0];
      this.hoverFileName = this.hoverFile!.name;
    }
  }

  addColor() {
    this.colorList.push({ color: '#000000', file: null, preview: '' });
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

    // Upload all images to Cloudinary in parallel
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
          popular:     this.productForm.value.popular ? 'true' : 'false',
        };

        if (this.productForm.value.oldPrice) body.oldPrice = this.productForm.value.oldPrice;
        if (mainRes)  body.pic      = mainRes.secure_url;
        if (hoverRes) body.picHover = hoverRes.secure_url;

        // Colors — send hex values and resolved Cloudinary URLs
        body['colors[]']      = this.colorList.map(c => c.color);
        body['colorImages[]'] = colorResults.map(r => r?.secure_url || '');

        if (this.isClothesCategory && this.selectedSizes.length > 0) {
          body['sizes[]'] = this.selectedSizes;
        }

        this.pservice.addProduct(body).subscribe({
          next: (res: any) => {
            this.uploading = false;
            Swal.fire({ icon: 'success', title: 'Product Added!', text: res.message || 'Product added successfully', timer: 1800, showConfirmButton: false });
            this.productForm.reset();
            this.mainFile = null; this.hoverFile = null;
            this.mainFileName = ''; this.hoverFileName = '';
            this.colorList = [{ color: '#000000', file: null, preview: '' }];
            this.selectedSizes = [];
            setTimeout(() => this.router.navigate(['/admin/showproduct']), 1800);
          },
          error: (err) => {
            this.uploading = false;
            Swal.fire({ icon: 'error', title: 'Failed', text: 'Failed to add product: ' + (err.error?.message || err.message), confirmButtonColor: '#9B7B5E' });
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
