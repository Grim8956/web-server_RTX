import { Response } from 'express';
import pool from '../config/database';
import { AuthRequest } from '../middleware/auth';

export const getMyNotifications = async (req: AuthRequest, res: Response) => {
  try {
    const [notifications] = await pool.execute(
      `SELECT n.*, r.start_time, c.name as classroom_name 
       FROM notifications n 
       LEFT JOIN reservations r ON n.reservation_id = r.id 
       LEFT JOIN classrooms c ON r.classroom_id = c.id 
       WHERE n.user_id = ? 
       ORDER BY n.created_at DESC`,
      [req.user!.id]
    );

    res.json({ notifications });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
};

export const markAsRead = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    await pool.execute(
      'UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?',
      [id, req.user!.id]
    );

    res.json({ message: 'Notification marked as read' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
};

