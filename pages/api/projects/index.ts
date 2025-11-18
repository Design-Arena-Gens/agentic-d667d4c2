import type { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '@/lib/mongodb';
import { verifyToken } from '@/lib/auth';
import { ObjectId } from 'mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);

    if (!payload) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const { db } = await connectToDatabase();

    if (req.method === 'GET') {
      const projects = await db
        .collection('projects')
        .find({ userId: new ObjectId(payload.userId) })
        .sort({ createdAt: -1 })
        .toArray();

      return res.status(200).json({ projects });
    }

    if (req.method === 'POST') {
      const { name, description, websiteUrl, status } = req.body;

      if (!name || !description || !websiteUrl) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const result = await db.collection('projects').insertOne({
        userId: new ObjectId(payload.userId),
        name,
        description,
        websiteUrl,
        status: status || 'planning',
        createdAt: new Date(),
      });

      return res.status(201).json({
        project: {
          _id: result.insertedId.toString(),
          name,
          description,
          websiteUrl,
          status,
          createdAt: new Date(),
        },
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Projects API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
