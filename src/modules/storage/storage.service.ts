import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs/promises';
import * as path from 'path';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { Readable } from 'stream';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly storageType: string;
  private readonly storagePath: string;
  private s3Client: S3Client | null = null;
  private s3Bucket: string | null = null;

  constructor(private configService: ConfigService) {
    this.storageType = this.configService.get('STORAGE_TYPE', 'local');
    this.storagePath = this.configService.get('STORAGE_PATH', './storage');

    if (this.storageType === 's3') {
      this.initializeS3();
    } else {
      this.initializeLocalStorage();
    }
  }

  private initializeS3(): void {
    const region = this.configService.get('AWS_REGION', 'us-east-1');
    const accessKeyId = this.configService.get('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get('AWS_SECRET_ACCESS_KEY');
    this.s3Bucket = this.configService.get('S3_BUCKET');

    if (!accessKeyId || !secretAccessKey || !this.s3Bucket) {
      throw new Error('S3 credentials not configured');
    }

    this.s3Client = new S3Client({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    this.logger.log('S3 storage initialized');
  }

  private async initializeLocalStorage(): Promise<void> {
    try {
      await fs.mkdir(this.storagePath, { recursive: true });
      await fs.mkdir(path.join(this.storagePath, 'repos'), { recursive: true });
      await fs.mkdir(path.join(this.storagePath, 'files'), { recursive: true });
      this.logger.log('Local storage initialized');
    } catch (error) {
      this.logger.error(`Failed to initialize local storage: ${error.message}`);
    }
  }

  /**
   * Save file content
   */
  async saveFile(
    filePath: string,
    content: string | Buffer,
    repositoryId: string,
  ): Promise<string> {
    if (this.storageType === 's3') {
      return this.saveFileToS3(filePath, content, repositoryId);
    } else {
      return this.saveFileToLocal(filePath, content, repositoryId);
    }
  }

  private async saveFileToLocal(
    filePath: string,
    content: string | Buffer,
    repositoryId: string,
  ): Promise<string> {
    const fullPath = path.join(
      this.storagePath,
      'repos',
      repositoryId,
      filePath,
    );
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, content);
    return fullPath;
  }

  private async saveFileToS3(
    filePath: string,
    content: string | Buffer,
    repositoryId: string,
  ): Promise<string> {
    if (!this.s3Client || !this.s3Bucket) {
      throw new Error('S3 not initialized');
    }

    const key = `repos/${repositoryId}/${filePath}`;
    const command = new PutObjectCommand({
      Bucket: this.s3Bucket,
      Key: key,
      Body: content,
    });

    await this.s3Client.send(command);
    return key;
  }

  /**
   * Read file content
   */
  async readFile(filePath: string, repositoryId: string): Promise<string> {
    if (this.storageType === 's3') {
      return this.readFileFromS3(filePath, repositoryId);
    } else {
      return this.readFileFromLocal(filePath, repositoryId);
    }
  }

  private async readFileFromLocal(
    filePath: string,
    repositoryId: string,
  ): Promise<string> {
    const fullPath = path.join(
      this.storagePath,
      'repos',
      repositoryId,
      filePath,
    );
    return await fs.readFile(fullPath, 'utf-8');
  }

  private async readFileFromS3(
    filePath: string,
    repositoryId: string,
  ): Promise<string> {
    if (!this.s3Client || !this.s3Bucket) {
      throw new Error('S3 not initialized');
    }

    const key = `repos/${repositoryId}/${filePath}`;
    const command = new GetObjectCommand({
      Bucket: this.s3Bucket,
      Key: key,
    });

    const response = await this.s3Client.send(command);
    const stream = response.Body as Readable;
    
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      stream.on('data', (chunk) => chunks.push(chunk));
      stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
      stream.on('error', reject);
    });
  }

  /**
   * Delete file
   */
  async deleteFile(filePath: string, repositoryId: string): Promise<void> {
    if (this.storageType === 's3') {
      await this.deleteFileFromS3(filePath, repositoryId);
    } else {
      await this.deleteFileFromLocal(filePath, repositoryId);
    }
  }

  private async deleteFileFromLocal(
    filePath: string,
    repositoryId: string,
  ): Promise<void> {
    const fullPath = path.join(
      this.storagePath,
      'repos',
      repositoryId,
      filePath,
    );
    await fs.unlink(fullPath).catch(() => {
      // File might not exist
    });
  }

  private async deleteFileFromS3(
    filePath: string,
    repositoryId: string,
  ): Promise<void> {
    if (!this.s3Client || !this.s3Bucket) {
      throw new Error('S3 not initialized');
    }

    const key = `repos/${repositoryId}/${filePath}`;
    const command = new DeleteObjectCommand({
      Bucket: this.s3Bucket,
      Key: key,
    });

    await this.s3Client.send(command);
  }

  /**
   * List files in directory
   */
  async listFiles(
    directory: string,
    repositoryId: string,
  ): Promise<string[]> {
    if (this.storageType === 's3') {
      // S3 listing would require ListObjectsV2Command
      return [];
    } else {
      return this.listFilesFromLocal(directory, repositoryId);
    }
  }

  private async listFilesFromLocal(
    directory: string,
    repositoryId: string,
  ): Promise<string[]> {
    const fullPath = path.join(
      this.storagePath,
      'repos',
      repositoryId,
      directory,
    );
    try {
      const entries = await fs.readdir(fullPath, { withFileTypes: true });
      return entries.map((entry) => entry.name);
    } catch {
      return [];
    }
  }
}
