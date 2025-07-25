import { prisma } from '../_db';
import bcrypt from 'bcryptjs';
import type { Request, Response } from 'express';

export default async function handler(req: Request, res: Response) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, name, picture, googleId } = req.body;

    // Check if user exists
    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Create new user if doesn't exist
      const randomPassword = Math.random().toString(36).slice(-8);
      const hashedPassword = await bcrypt.hash(randomPassword, 10);

      user = await prisma.user.create({
        data: {
          email,
          name,
          password: hashedPassword,
          profilePicture: picture,
          googleId,
        },
      });
    } else {
      // Update existing user's Google info
      user = await prisma.user.update({
        where: { email },
        data: {
          googleId,
          profilePicture: picture || user.profilePicture,
        },
      });
    }

    // Set session or return token here
    return res.status(200).json({
      id: user.id,
      email: user.email,
      name: user.name,
      profilePicture: user.profilePicture,
    });
  } catch (error) {
    console.error('Google auth error:', error);
    return res.status(500).json({ error: 'Authentication failed' });
  }
} 