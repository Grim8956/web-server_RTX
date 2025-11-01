import { Response } from 'express';
import pool from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { assignWaitlistItem } from '../services/waitlist.service';

export const createWaitlist = async (req: AuthRequest, res: Response) => {
  try {
    const { classroom_id, start_time, end_time } = req.body;

    if (!classroom_id || !start_time || !end_time) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const start = new Date(start_time);
    const end = new Date(end_time);

    // 해당 시간대의 최대 대기 순위 조회
    const [maxPosition] = await pool.execute(
      `SELECT COALESCE(MAX(queue_position), 0) as max_pos FROM waitlist 
       WHERE classroom_id = ? AND start_time = ? AND end_time = ?`,
      [classroom_id, start, end]
    ) as any;

    const nextPosition = maxPosition[0].max_pos + 1;

    // 대기열 생성
    const [result] = await pool.execute(
      'INSERT INTO waitlist (classroom_id, user_id, start_time, end_time, queue_position) VALUES (?, ?, ?, ?, ?)',
      [classroom_id, req.user!.id, start, end, nextPosition]
    ) as any;

    res.status(201).json({
      message: 'Added to waitlist successfully',
      waitlist: {
        id: result.insertId,
        classroom_id,
        start_time,
        end_time,
        queue_position: nextPosition
      }
    });
  } catch (error: any) {
    console.error('Create waitlist error:', error);
    res.status(500).json({ error: 'Failed to add to waitlist' });
  }
};

export const getMyWaitlist = async (req: AuthRequest, res: Response) => {
  try {
    const [waitlist] = await pool.execute(
      `SELECT w.*, c.name as classroom_name, c.location 
       FROM waitlist w 
       JOIN classrooms c ON w.classroom_id = c.id 
       WHERE w.user_id = ? 
       AND w.status = 'waiting' 
       ORDER BY w.created_at ASC`,
      [req.user!.id]
    );

    res.json({ waitlist });
  } catch (error: any) {
    console.error('Get waitlist error:', error);
    res.status(500).json({ error: 'Failed to fetch waitlist' });
  }
};

export const cancelWaitlist = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // 대기 신청 정보 조회
    const [waitlistItems] = (await pool.execute(
      'SELECT * FROM waitlist WHERE id = ?',
      [id]
    )) as any;

    if (waitlistItems.length === 0) {
      return res.status(404).json({ error: 'Waitlist item not found' });
    }

    const waitlistItem = waitlistItems[0];

    // 본인 대기 신청만 취소 가능
    if (waitlistItem.user_id !== req.user!.id) {
      return res.status(403).json({ error: 'Cannot cancel other users\' waitlist items' });
    }

    // 대기 신청 취소 처리 (status를 cancelled로 변경)
    await pool.execute(
      'UPDATE waitlist SET status = ? WHERE id = ?',
      ['cancelled', id]
    );

    res.json({ message: 'Waitlist item cancelled successfully' });
  } catch (error: any) {
    console.error('Cancel waitlist error:', error);
    res.status(500).json({ error: 'Failed to cancel waitlist item' });
  }
};

