import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import { User } from '../types';

class UserManager {
  private users: Map<string, User> = new Map(); // id → User
  private emailIndex: Map<string, string> = new Map(); // email → id

  async register(email: string, password: string): Promise<User> {
    if (this.emailIndex.has(email.toLowerCase())) {
      throw new Error('Email already registered');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user: User = {
      id: uuidv4(),
      email: email.toLowerCase(),
      passwordHash,
      createdAt: Date.now(),
    };

    this.users.set(user.id, user);
    this.emailIndex.set(user.email, user.id);
    console.log(`[UserManager] User registered: ${user.email}`);
    return user;
  }

  async validatePassword(email: string, password: string): Promise<User | null> {
    const id = this.emailIndex.get(email.toLowerCase());
    if (!id) return null;

    const user = this.users.get(id);
    if (!user) return null;

    const valid = await bcrypt.compare(password, user.passwordHash);
    return valid ? user : null;
  }

  getById(id: string): User | undefined {
    return this.users.get(id);
  }
}

export const userManager = new UserManager();
