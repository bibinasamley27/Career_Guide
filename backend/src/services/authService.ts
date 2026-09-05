import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { ConflictError, UnauthorizedError } from '../middleware/errorHandler';
import { LoginInput, RegisterInput } from '../schemas/auth';
import { createUser, findUserByEmail, findUserById, toPublicUser } from '../repositories/userRepository';

const BCRYPT_ROUNDS = 12;

export const AUTH_COOKIE_NAME = 'career_guide_token';

export const registerUser = async (input: RegisterInput) => {
  const existingUser = await findUserByEmail(input.email);
  if (existingUser) {
    throw new ConflictError('An account with this email already exists');
  }

  const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
  const user = await createUser({
    name: input.name,
    email: input.email,
    passwordHash,
  });

  return {
    user: toPublicUser(user),
    token: createAuthToken(user.id),
  };
};

export const loginUser = async (input: LoginInput) => {
  const user = await findUserByEmail(input.email);
  if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) {
    throw new UnauthorizedError('Invalid email or password');
  }

  return {
    user: toPublicUser(user),
    token: createAuthToken(user.id),
  };
};

export const getAuthenticatedUser = async (userId: string) => {
  const user = await findUserById(userId);
  if (!user) {
    throw new UnauthorizedError('Authentication required');
  }
  return toPublicUser(user);
};

export const createAuthToken = (userId: string) =>
  jwt.sign({ sub: userId }, config.JWT_SECRET, { expiresIn: '7d' });

export const verifyAuthToken = (token: string): string => {
  const payload = jwt.verify(token, config.JWT_SECRET);
  if (typeof payload === 'string' || typeof payload.sub !== 'string') {
    throw new UnauthorizedError('Authentication required');
  }
  return payload.sub;
};
