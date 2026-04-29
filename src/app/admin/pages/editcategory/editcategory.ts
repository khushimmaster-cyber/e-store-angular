import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CategoryService } from '../../../service/category-service';
import { CloudinaryUploadService } from '../../../service/cloudinary-upload.service';
import { ValidationMessage } from '../../../validation-message/validation-message';
import { MSwal as Swal } from '../../../service/swal-service';

@Component({
  selector: 'app-edit-category',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, ValidationMessage],
  templateUrl: './editcategory.html',
  styleUrls: ['./editcategory.css']
})
export class EditCategory implements OnInit {

  frmGrp!: FormGroup;
  selectedFile: File | null = null;
  id!: string;
  oldImage: string = '';
  uploading = false;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private categoryService: CategoryService,
    private cloudinary: CloudinaryUploadService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.frmGrp = this.fb.group({
      cat_name: ['', Validators.required],
      cat_pic:  ['']
    });
    this.id = this.route.snapshot.paramMap.get('id')!;
    this.getSingleCategory();
  }

  getSingleCategory() {
    this.categoryService.getSingleCategory(this.id).subscribe({
      next: (res: any) => {
        const data = res.data;
        this.frmGrp.patchValue({ cat_name: data.cat_name });
        // Cloudinary URLs are full URLs; legacy filenames need the uploads prefix
        this.oldImage = data.cat_pic?.startsWith('http')
          ? data.cat_pic
          : 'https://moska-backend-1.onrender.com/uploads/' + data.cat_pic;
        this.cdr.detectChanges();
      },
      error: () => {
        Swal.fire({ icon: 'error', title: 'Load Failed', text: 'Failed to load category data', confirmButtonColor: '#9B7B5E' });
      }
    });
  }

  onFileChange(event: any) {
    if (event.target.files.length > 0) {
      this.selectedFile = event.target.files[0];
    }
  }

  onUpdate() {
    if (this.frmGrp.invalid) {
      Swal.fire({ icon: 'warning', title: 'Incomplete', text: 'Please fill in all required fields', confirmButtonColor: '#9B7B5E' });
      return;
    }

    this.uploading = true;

    if (this.selectedFile) {
      // New image selected — upload to Cloudinary first
      this.cloudinary.upload(this.selectedFile).subscribe({
        next: (cloudRes: any) => {
          const imageUrl = cloudRes.secure_url;
          console.log('✅ Cloudinary URL:', imageUrl);
          this.saveCategory(imageUrl);
        },
        error: (err) => {
          this.uploading = false;
          console.error('Cloudinary upload error:', err);
          Swal.fire({ icon: 'error', title: 'Upload Failed', text: 'Image upload to Cloudinary failed.', confirmButtonColor: '#9B7B5E' });
        }
      });
    } else {
      // No new image — just update the name
      this.saveCategory(null);
    }
  }

  private saveCategory(imageUrl: string | null) {
    const requestData: any = { cat_name: this.frmGrp.value.cat_name };
    if (imageUrl) requestData.image = imageUrl;

    this.categoryService.updateWithCloudinary(this.id, requestData).subscribe({
      next: () => {
        this.uploading = false;
        Swal.fire({ icon: 'success', title: 'Category Updated!', timer: 1500, showConfirmButton: false })
          .then(() => this.router.navigate(['/admin/category']));
      },
      error: (err) => {
        this.uploading = false;
        console.error('Update error:', err);
        Swal.fire({ icon: 'error', title: 'Update Failed', text: err.error?.message || err.message, confirmButtonColor: '#9B7B5E' });
      }
    });
  }
}
