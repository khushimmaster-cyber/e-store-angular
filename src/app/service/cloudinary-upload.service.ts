import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// ─── Cloudinary config ────────────────────────────────────────────────────────
// 1. Go to Cloudinary Dashboard → Settings → Upload → Upload Presets
// 2. Click "Add upload preset"
// 3. Set Signing Mode = Unsigned
// 4. Set Folder = moska_products
// 5. Save and copy the preset name below
const CLOUD_NAME    = 'dhvuewhdd';
const UPLOAD_PRESET = 'moska_unsigned'; // ← replace with your actual preset name
// ─────────────────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class CloudinaryUploadService {

  private uploadUrl = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

  constructor(private http: HttpClient) {}

  /**
   * Upload a File directly to Cloudinary.
   * Returns the full Cloudinary response (use .secure_url for the image URL).
   */
  upload(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);
    return this.http.post(this.uploadUrl, formData);
  }
}
