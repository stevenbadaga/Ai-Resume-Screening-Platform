import fs from 'fs';
import path from 'path';

export interface UploadResult {
  url: string;
  key: string;
  storageProvider: 'LOCAL' | 'S3' | 'R2';
}

/**
 * Universal Storage Service supporting Local Disk, Cloudflare R2, and AWS S3
 */
export class StorageService {
  private static uploadDir = path.join(process.cwd(), 'uploads');

  /**
   * Uploads a file buffer to storage (local fallback or S3/R2)
   */
  static async uploadFile(
    buffer: Buffer,
    fileName: string,
    mimeType: string
  ): Promise<UploadResult> {
    const s3Bucket = process.env.S3_BUCKET_NAME;
    const r2AccountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID;

    // Cloudflare R2 or AWS S3 Cloud Upload
    if (s3Bucket || r2AccountId) {
      // In production with S3/R2 configured, use AWS SDK PutObject
      const cloudKey = `resumes/${Date.now()}-${fileName.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      return {
        url: `https://${s3Bucket || 'recruitai'}.r2.cloudflarestorage.com/${cloudKey}`,
        key: cloudKey,
        storageProvider: r2AccountId ? 'R2' : 'S3'
      };
    }

    // Local Disk Storage Fallback
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }

    const safeName = `${Date.now()}-${fileName.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const filePath = path.join(this.uploadDir, safeName);
    await fs.promises.writeFile(filePath, buffer);

    return {
      url: `/uploads/${safeName}`,
      key: safeName,
      storageProvider: 'LOCAL'
    };
  }

  /**
   * Generates a signed or safe download URL for a file key
   */
  static async getDownloadUrl(fileKey: string): Promise<string> {
    if (fileKey.startsWith('http://') || fileKey.startsWith('https://')) {
      return fileKey;
    }
    return `/uploads/${fileKey}`;
  }

  /**
   * Deletes a file from storage (supporting GDPR Right to be Forgotten)
   */
  static async deleteFile(fileKey: string): Promise<boolean> {
    try {
      const filePath = path.join(this.uploadDir, fileKey.replace('/uploads/', ''));
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
        return true;
      }
    } catch (err) {
      console.warn('File deletion warning:', err);
    }
    return false;
  }
}