import * as fs from 'fs/promises';
import * as path from 'path';

export class FileService {
  public async readFile(filePath: string): Promise<string> {
    return await fs.readFile(filePath, 'utf-8');
  }

  public async deleteFile(filePath: string): Promise<void> {
    await fs.unlink(filePath);
  }

  // Upload/Download are typically handled via streams and HTTP,
  // but here are stub methods for the interface.
  public async writeFile(filePath: string, content: string | Buffer): Promise<void> {
    await fs.writeFile(filePath, content);
  }
}

export const fileService = new FileService();
