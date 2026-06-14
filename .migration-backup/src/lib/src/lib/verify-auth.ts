import { NextRequest } from 'next/server';
import { getAdminAuth } from '@/lib/firebase-admin';

export class AuthError extends Error {
  status: number;
  constructor(message: string, status = 401) {
    super(message);
    this.status = status;
  }
}

export async function verifyAuthToken(req: NextRequest): Promise<{ uid: string }> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    throw new AuthError('Unauthorized: Missing or invalid token');
  }

  const token = authHeader.slice('Bearer '.length).trim();
  if (!token) {
    throw new AuthError('Unauthorized: Missing or invalid token');
  }

  try {
    const decoded = await getAdminAuth().verifyIdToken(token);
    return { uid: decoded.uid };
  } catch {
    throw new AuthError('Unauthorized: Invalid or expired token');
  }
}
