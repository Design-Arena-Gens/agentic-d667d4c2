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

    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Invalid project ID' });
    }

    const { db } = await connectToDatabase();

    if (req.method === 'GET') {
      const project = await db.collection('projects').findOne({
        _id: new ObjectId(id),
        userId: new ObjectId(payload.userId),
      });

      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      return res.status(200).json({ project });
    }

    if (req.method === 'PUT') {
      const { name, description, websiteUrl, status } = req.body;

      const result = await db.collection('projects').updateOne(
        {
          _id: new ObjectId(id),
          userId: new ObjectId(payload.userId),
        },
        {
          $set: {
            ...(name && { name }),
            ...(description && { description }),
            ...(websiteUrl && { websiteUrl }),
            ...(status && { status }),
            updatedAt: new Date(),
          },
        }
      );

      if (result.matchedCount === 0) {
        return res.status(404).json({ error: 'Project not found' });
      }

      return res.status(200).json({ message: 'Project updated successfully' });
    }

    if (req.method === 'DELETE') {
      const result = await db.collection('projects').deleteOne({
        _id: new ObjectId(id),
        userId: new ObjectId(payload.userId),
      });

      if (result.deletedCount === 0) {
        return res.status(404).json({ error: 'Project not found' });
      }

      return res.status(200).json({ message: 'Project deleted successfully' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Project API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
