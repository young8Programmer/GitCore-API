import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { exec, ExecException } from 'child_process';
import { promisify } from 'util';
import { createHash } from 'crypto';
import * as path from 'path';
import * as fs from 'fs/promises';

const execAsync = promisify(exec);

@Injectable()
export class GitService {
  private readonly logger = new Logger(GitService.name);
  private readonly reposPath: string;

  constructor(private configService: ConfigService) {
    this.reposPath = this.configService.get('STORAGE_PATH', './storage/repos');
  }

  /**
   * Initialize a new Git repository
   */
  async initRepository(repoPath: string): Promise<void> {
    try {
      await fs.mkdir(repoPath, { recursive: true });
      await execAsync(`git init --bare`, { cwd: repoPath });
      this.logger.log(`Repository initialized at ${repoPath}`);
    } catch (error) {
      this.logger.error(`Failed to init repository: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get repository path
   */
  getRepositoryPath(owner: string, repoName: string): string {
    return path.join(this.reposPath, owner, `${repoName}.git`);
  }

  /**
   * Create a commit (simulation)
   */
  async createCommit(
    repoPath: string,
    message: string,
    author: { name: string; email: string },
    files: { path: string; content: string }[],
  ): Promise<string> {
    try {
      // Create a work tree
      const workTreePath = path.join(repoPath, 'worktree');
      await fs.mkdir(workTreePath, { recursive: true });

      // Write files
      for (const file of files) {
        const filePath = path.join(workTreePath, file.path);
        await fs.mkdir(path.dirname(filePath), { recursive: true });
        await fs.writeFile(filePath, file.content, 'utf-8');
      }

      // Create commit object manually (simplified Git logic)
      const treeHash = await this.createTree(repoPath, workTreePath);
      const commitHash = await this.createCommitObject(
        repoPath,
        treeHash,
        message,
        author,
      );

      // Clean up work tree
      await fs.rm(workTreePath, { recursive: true, force: true });

      return commitHash;
    } catch (error) {
      this.logger.error(`Failed to create commit: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create a tree object (simplified)
   */
  private async createTree(
    repoPath: string,
    workTreePath: string,
  ): Promise<string> {
    // This is a simplified version
    // In real Git, this would create proper tree objects
    const treeContent = await this.buildTreeStructure(workTreePath);
    return this.hashObject(treeContent);
  }

  /**
   * Build tree structure recursively
   */
  private async buildTreeStructure(dirPath: string): Promise<string> {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    let treeContent = '';

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        const subTree = await this.buildTreeStructure(fullPath);
        treeContent += `tree ${this.hashObject(subTree)} ${entry.name}\n`;
      } else {
        const content = await fs.readFile(fullPath, 'utf-8');
        const blobHash = this.hashObject(content);
        treeContent += `blob ${blobHash} ${entry.name}\n`;
      }
    }

    return treeContent;
  }

  /**
   * Create commit object
   */
  private async createCommitObject(
    repoPath: string,
    treeHash: string,
    message: string,
    author: { name: string; email: string },
  ): Promise<string> {
    const timestamp = Math.floor(Date.now() / 1000);
    const commitContent = `tree ${treeHash}
author ${author.name} <${author.email}> ${timestamp} +0000
committer ${author.name} <${author.email}> ${timestamp} +0000

${message}`;

    return this.hashObject(commitContent);
  }

  /**
   * Hash object (SHA-1 like Git)
   */
  hashObject(content: string): string {
    const hash = createHash('sha1');
    hash.update(content);
    return hash.digest('hex');
  }

  /**
   * Get file tree structure
   */
  async getFileTree(
    repoPath: string,
    branch: string = 'main',
  ): Promise<object> {
    try {
      // Try to use real Git if available
      try {
        const { stdout } = await execAsync(
          `git ls-tree -r --name-only ${branch}`,
          { cwd: repoPath },
        );
        const files = stdout.trim().split('\n').filter(Boolean);
        return this.buildTreeFromPaths(files);
      } catch {
        // Fallback: read from storage
        return await this.getFileTreeFromStorage(repoPath);
      }
    } catch (error) {
      this.logger.error(`Failed to get file tree: ${error.message}`);
      throw error;
    }
  }

  /**
   * Build tree structure from file paths
   */
  private buildTreeFromPaths(paths: string[]): object {
    const tree: any = {};

    for (const filePath of paths) {
      const parts = filePath.split('/');
      let current = tree;

      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        const isLast = i === parts.length - 1;

        if (isLast) {
          current[part] = { type: 'file', path: filePath };
        } else {
          if (!current[part]) {
            current[part] = { type: 'directory', children: {} };
          }
          current = current[part].children;
        }
      }
    }

    return tree;
  }

  /**
   * Get file tree from storage (fallback)
   */
  private async getFileTreeFromStorage(repoPath: string): Promise<object> {
    try {
      const workTreePath = path.join(repoPath, 'worktree');
      return await this.readDirectoryTree(workTreePath);
    } catch {
      return {};
    }
  }

  /**
   * Read directory tree recursively
   */
  private async readDirectoryTree(dirPath: string): Promise<object> {
    try {
      const tree: any = {};
      const entries = await fs.readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        if (entry.isDirectory()) {
          tree[entry.name] = {
            type: 'directory',
            children: await this.readDirectoryTree(fullPath),
          };
        } else {
          tree[entry.name] = {
            type: 'file',
            path: fullPath,
          };
        }
      }

      return tree;
    } catch {
      return {};
    }
  }

  /**
   * Get diff between two commits/branches
   */
  async getDiff(
    repoPath: string,
    from: string,
    to: string,
  ): Promise<{ files: any[]; stats: any }> {
    try {
      const { stdout } = await execAsync(
        `git diff --stat ${from}..${to}`,
        { cwd: repoPath },
      );
      // Parse diff output
      return this.parseDiff(stdout);
    } catch (error) {
      this.logger.warn(`Git diff failed, using fallback: ${error.message}`);
      return { files: [], stats: { additions: 0, deletions: 0 } };
    }
  }

  /**
   * Parse diff output
   */
  private parseDiff(diffOutput: string): { files: any[]; stats: any } {
    const lines = diffOutput.split('\n');
    const files: any[] = [];
    let additions = 0;
    let deletions = 0;

    for (const line of lines) {
      if (line.includes('|')) {
        const match = line.match(/(.+?)\s+\|\s+(\d+)\s+([+-]+)/);
        if (match) {
          const [, file, changes, signs] = match;
          const add = (signs.match(/\+/g) || []).length;
          const del = (signs.match(/-/g) || []).length;
          files.push({ file, additions: add, deletions: del });
          additions += add;
          deletions += del;
        }
      }
    }

    return {
      files,
      stats: { additions, deletions },
    };
  }

  /**
   * Create a branch
   */
  async createBranch(repoPath: string, branchName: string): Promise<void> {
    try {
      await execAsync(`git branch ${branchName}`, { cwd: repoPath });
    } catch (error) {
      this.logger.error(`Failed to create branch: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get all branches
   */
  async getBranches(repoPath: string): Promise<string[]> {
    try {
      const { stdout } = await execAsync(`git branch`, { cwd: repoPath });
      return stdout
        .split('\n')
        .map((b) => b.trim().replace(/^\*\s*/, ''))
        .filter(Boolean);
    } catch {
      return ['main'];
    }
  }

  /**
   * Checkout a branch
   */
  async checkoutBranch(repoPath: string, branchName: string): Promise<void> {
    try {
      await execAsync(`git checkout ${branchName}`, { cwd: repoPath });
    } catch (error) {
      this.logger.error(`Failed to checkout branch: ${error.message}`);
      throw error;
    }
  }

  /**
   * Merge branches
   */
  async mergeBranches(
    repoPath: string,
    sourceBranch: string,
    targetBranch: string,
  ): Promise<string> {
    try {
      await this.checkoutBranch(repoPath, targetBranch);
      const { stdout } = await execAsync(
        `git merge ${sourceBranch} --no-ff -m "Merge ${sourceBranch} into ${targetBranch}"`,
        { cwd: repoPath },
      );
      return stdout;
    } catch (error) {
      this.logger.error(`Failed to merge branches: ${error.message}`);
      throw error;
    }
  }
}
