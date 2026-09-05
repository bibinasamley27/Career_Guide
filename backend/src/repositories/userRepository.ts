import { User } from '@prisma/client';
import prisma from '../lib/prisma';

export type PublicUser = Pick<User, 'id' | 'name' | 'email' | 'createdAt'>;

export const findUserByEmail = (email: string) =>
  prisma.user.findUnique({ where: { email } });

export const findUserById = (id: string) =>
  prisma.user.findUnique({ where: { id } });

export const createUser = (data: Pick<User, 'name' | 'email' | 'passwordHash'>) =>
  prisma.user.create({ data });

export const toPublicUser = (user: User): PublicUser => ({
  id: user.id,
  name: user.name,
  email: user.email,
  createdAt: user.createdAt,
});
