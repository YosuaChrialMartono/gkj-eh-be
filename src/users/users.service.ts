import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { RegisterDto } from '../auth/dto/auth.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async findById(id: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  async create(data: RegisterDto & { passwordHash: string }): Promise<User> {
    const existing = await this.findByEmail(data.email);
    if (existing) {
      throw new ConflictException('Email already exists');
    }

    const user = this.usersRepository.create({
      name: data.name,
      email: data.email,
      password: data.passwordHash,
      role: 'viewer',
    });

    return this.usersRepository.save(user);
  }

  async createGoogleUser(profile: { name: string; email: string; avatar?: string }): Promise<User> {
    const existing = await this.findByEmail(profile.email);
    if (existing) {
      return existing;
    }

    const user = this.usersRepository.create({
      name: profile.name,
      email: profile.email,
      avatar: profile.avatar,
      password: null,
      role: 'viewer',
    });

    return this.usersRepository.save(user);
  }

  async validatePassword(user: User, password: string): Promise<boolean> {
    if (!user.password) {
      return false;
    }
    return bcrypt.compare(password, user.password);
  }

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }
}
