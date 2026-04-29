import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CategoryService } from '../../../service/category-service';
import { CloudinaryUploadService } from '../../../service/cloudinary-upload.service';
import { CommonModule } from '@angular/common';
import { ValidationMessage } from '../../../validation-message/validation-message';
import { MSwal as Swal } from '../../../service/swal-service';

@Component({
  selector: 'app-addcategory',
  standalone: true,
  imports: [ReactiveFormsModule, ValidationMessage, CommonModule],
  templateUrl: './addcategory.html',
  styleUrls: ['./addcategory.css'],
})
export class Addcategory {

  frmGrp!: FormGroup;
  selectedFile: File | null = null;
  uploading = false;

  constructor(
    private fb: FormBuilder,
    private catser: CategoryService,
    private cloudinary: CloudinaryUploadService,
    private router: Router
  ) {
    this.frmGrp = this.fb.group({
      cat_name: ['', Validators.required],
      cat_pic:  ['', Validators.required]   // holds the file object for validation
    });
  }

  onFileChange(event: any): void {
    if (event.target.files.length > 0) {
      this.selectedFile = event.target.files[0];
      this.frmGrp.patchValue({ cat_pic: this.selectedFile });
    }
  }

  onsubmit(): void {
    this.frmGrp.markAllAsTouched();
    if (this.frmGrp.invalid || !this.selectedFile) return;

    this.uploading = true;

    // Step 1: upload directly to Cloudinary
    this.cloudinary.upload(this.selectedFile).subscribe({
      next: (cloudRes: any) => {
        const imageUrl = cloudRes.secure_url;
        console.log('✅ Cloudinary URL:', imageUrl);

        // Step 2: send only the URL to the backend
        this.catser.addWithCloudinary({
          cat_name: this.frmGrp.get('cat_name')?.value,
          image: imageUrl
        }).subscribe({
          next: () => {
            this.uploading = false;
            Swal.fire({ icon: 'success', title: 'Category Added!', timer: 1500, showConfirmButton: false })
              .then(() => this.router.navigate(['/admin/category']));
          },
          error: (err) => {
            this.uploading = false;
            console.error('Save error:', err);
            Swal.fire({ icon: 'error', title: 'Failed', text: 'Failed to save category', confirmButtonColor: '#9B7B5E' });
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
