import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SSHKey } from '../../entities/ssh-key.entity';
import { createHash } from 'crypto';
import { CreateSSHKeyDto } from './dto/ssh-key.dto';

@Injectable()
export class SSHKeyService {
  constructor(
    @InjectRepository(SSHKey)
    private sshKeyRepository: Repository<SSHKey>,
  ) {}

  async create(userId: string, createDto: CreateSSHKeyDto): Promise<SSHKey> {
    // Validate and parse SSH key
    const fingerprint = this.calculateFingerprint(createDto.publicKey);

    // Check if key already exists
    const existing = await this.sshKeyRepository.findOne({
      where: { fingerprint },
    });

    if (existing) {
      throw new ForbiddenException('SSH key already exists');
    }

    const sshKey = this.sshKeyRepository.create({
      title: createDto.title,
      publicKey: createDto.publicKey,
      fingerprint,
      userId,
    });

    return await this.sshKeyRepository.save(sshKey);
  }

  async findAll(userId: string): Promise<SSHKey[]> {
    return await this.sshKeyRepository.find({
      where: { userId, isActive: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, userId: string): Promise<SSHKey> {
    const key = await this.sshKeyRepository.findOne({ where: { id } });

    if (!key) {
      throw new NotFoundException('SSH key not found');
    }

    if (key.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return key;
  }

  async delete(id: string, userId: string): Promise<void> {
    const key = await this.findOne(id, userId);
    await this.sshKeyRepository.remove(key);
  }

  async updateLastUsed(fingerprint: string): Promise<void> {
    const key = await this.sshKeyRepository.findOne({
      where: { fingerprint },
    });

    if (key) {
      key.lastUsedAt = new Date();
      await this.sshKeyRepository.save(key);
    }
  }

  private calculateFingerprint(publicKey: string): string {
    // Remove key type and comment, get just the key data
    const keyData = publicKey
      .replace(/^(ssh-rsa|ssh-ed25519|ecdsa-sha2-nistp256)\s+/, '')
      .replace(/\s+.*$/, '')
      .trim();

    // Decode base64 and create MD5 fingerprint (GitHub style)
    const buffer = Buffer.from(keyData, 'base64');
    const hash = createHash('md5');
    hash.update(buffer);
    const fingerprint = hash.digest('hex');

    // Format as xx:xx:xx:xx...
    return fingerprint.match(/.{2}/g)?.join(':') || fingerprint;
  }
}
