import { Response } from 'express';
import pool from '../config/database';
import { AuthRequest } from '../middleware/auth';

export const getTopClassrooms = async (req: AuthRequest, res: Response) => {
  try {
    const [results] = await pool.execute(
      `SELECT c.id, c.name, c.location, COUNT(*) as reservation_count
       FROM reservations r
       JOIN classrooms c ON r.classroom_id = c.id
       WHERE r.status IN ('active', 'done')
       GROUP BY c.id, c.name, c.location
       ORDER BY reservation_count DESC
       LIMIT 5`
    );

    res.json({ topClassrooms: results });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
};

