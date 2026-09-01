import { Injectable, OnModuleInit, InternalServerErrorException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Client } from "minio";
import * as crypto from "crypto";
import * as url from "url";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { Readable } from "stream";

@Injectable()
export class MinioClientService implements OnModuleInit {
  private client: Client | null = null;
  private bucket: string;
  private useLocalFs: boolean = false;
  private localStoragePath: string;

  constructor(private readonly config: ConfigService) {}

  async onModuleInit() {
    this.bucket = this.config.get("STORAGE_BUCKET") || "studentvault";
    this.localStoragePath = path.join(os.tmpdir(), "studentvault-storage", this.bucket);
    
    // Try to initialize MinIO client
    try {
      const endpoint = this.config.get("STORAGE_ENDPOINT") || "localhost:9000";
      const parsed = new url.URL(endpoint);
      const useSSL = parsed.protocol === "https:" || this.config.get("STORAGE_USE_SSL") === "true";

      this.client = new Client({
        endPoint: parsed.hostname,
        port: parseInt(parsed.port || (parsed.protocol === "https:" ? "443" : "9000"), 10),
        useSSL: parsed.protocol === "https:",
        accessKey: this.config.get("STORAGE_ACCESS_KEY") || "minioadmin",
        secretKey: this.config.get("STORAGE_SECRET_KEY") || "minioadmin",
      });

      // Try to connect with timeout
      try {
        await Promise.race([
          this.client.bucketExists(this.bucket),
          new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 3000))
        ]);
      } catch {
        console.warn("MinIO not available, falling back to local filesystem storage");
        this.useLocalFs = true;
        this.client = null;
        await fs.promises.mkdir(this.localStoragePath, { recursive: true });
      }
    } catch {
      console.warn("MinIO not available, falling back to local filesystem storage");
      this.useLocalFs = true;
      this.client = null;
      await fs.promises.mkdir(this.localStoragePath, { recursive: true });
    }

    // Ensure local storage directory exists
    if (this.useLocalFs) {
      await fs.promises.mkdir(this.localStoragePath, { recursive: true });
    }
  }

  private getApiBaseUrl(): string {
    // Use env API_URL / APP_URL port or fallback to relative path for Vercel/Render
    const apiUrl = this.config.get("API_URL") || this.config.get("APP_URL");
    if (apiUrl) {
      // If API_URL is set, derive base (strip trailing slash)
      return apiUrl.replace(/\/$/, "");
    }
    // Fallback to request host via env PORT, else relative (works on same domain)
    const port = this.config.get("PORT") || 3001;
    return `http://localhost:${port}`;
  }

  async getPresignedPutUrl(objectKey: string, expirySeconds = 3600): Promise<string> {
    if (this.useLocalFs || !this.client) {
      // For local FS, return local upload endpoint (dynamic base for prod)
      const base = this.getApiBaseUrl();
      // In production on Render, local FS is ephemeral but still works for demo
      // For R2/Supabase transition, this will be replaced by presigned URL
      return `${base}/api/v1/uploads/local/${objectKey}`;
    }
    return this.client.presignedPutObject(this.bucket, objectKey, expirySeconds);
  }

  async getPresignedGetUrl(objectKey: string, expirySeconds = 3600): Promise<string> {
    if (this.useLocalFs || !this.client) {
      const base = this.getApiBaseUrl();
      return `${base}/api/v1/uploads/local/${objectKey}`;
    }
    return this.client.presignedGetObject(this.bucket, objectKey, expirySeconds);
  }

  async objectExists(objectKey: string): Promise<boolean> {
    if (this.useLocalFs || !this.client) {
      const filePath = path.join(this.localStoragePath, objectKey);
      try {
        await fs.promises.access(filePath);
        return true;
      } catch {
        return false;
      }
    }
    try {
      await this.client.statObject(this.bucket, objectKey);
      return true;
    } catch {
      return false;
    }
  }

  async getObjectChecksum(objectKey: string): Promise<string> {
    if (this.useLocalFs || !this.client) {
      const filePath = path.join(this.localStoragePath, objectKey);
      const fileBuffer = await fs.promises.readFile(filePath);
      return crypto.createHash("sha256").update(fileBuffer).digest("hex");
    }
    const stream = await this.client.getObject(this.bucket, objectKey);
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash("sha256");
      stream.on("data", (chunk: Buffer) => hash.update(chunk));
      stream.on("end", () => resolve(hash.digest("hex")));
      stream.on("error", reject);
    });
  }

  async putObject(objectKey: string, stream: NodeJS.ReadableStream, size: number, contentType: string): Promise<void> {
    if (this.useLocalFs || !this.client) {
      const filePath = path.join(this.localStoragePath, objectKey);
      await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
      const nodeStream = Readable.fromWeb(stream as any);
      const chunks: Buffer[] = [];
      for await (const chunk of nodeStream) {
        chunks.push(chunk);
      }
      await fs.promises.writeFile(filePath, Buffer.concat(chunks));
      return;
    }
    // Convert Node.js Readable to web ReadableStream if needed
    const webStream = Readable.toWeb(stream as any);
    await this.client.putObject(this.bucket, objectKey, webStream as any, size, { "Content-Type": contentType });
  }

  async getObjectAsNodeStream(objectKey: string): Promise<NodeJS.ReadableStream> {
    if (this.useLocalFs || !this.client) {
      const filePath = path.join(this.localStoragePath, objectKey);
      return fs.createReadStream(filePath);
    }
    const webStream = await this.client.getObject(this.bucket, objectKey);
    // Convert web ReadableStream to Node.js Readable
    return Readable.fromWeb(webStream as any);
  }

  async getObject(objectKey: string): Promise<NodeJS.ReadableStream> {
    return this.getObjectAsNodeStream(objectKey);
  }

  async removeObject(objectKey: string): Promise<void> {
    if (this.useLocalFs || !this.client) {
      const filePath = path.join(this.localStoragePath, objectKey);
      try {
        await fs.promises.unlink(filePath);
      } catch {
        // ignore
      }
      return;
    }
    await this.client.removeObject(this.bucket, objectKey);
  }

  isLocalFs(): boolean {
    return this.useLocalFs;
  }
}