import { Response } from 'express';
import pool from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { assignWaitlistItem } from '../services/waitlist.service';
import {
  validateDateRange,
  validateNumericId,
  validateWaitlistTime,
  validateParticipants,
} from '../utils/validation';

export const createWaitlist = async (req: AuthRequest, res: Response) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const { classroom_id, start_time, end_time, participants } = req.body;

    if (!classroom_id || !start_time || !end_time) {
      await connection.rollback();
      connection.release();
      return res.status(400).json({ error: 'All fields are required' });
    }

    // ID 검증
    const idValidation = validateNumericId(classroom_id);
    if (!idValidation.valid) {
      await connection.rollback();
      connection.release();
      return res.status(400).json({ error: idValidation.error });
    }

    // 날짜 범위 검증
    const dateRangeValidation = validateDateRange(start_time, end_time);
    if (!dateRangeValidation.valid) {
      await connection.rollback();
      connection.release();
      return res.status(400).json({ error: dateRangeValidation.error });
    }

    const start = dateRangeValidation.start!;
    const end = dateRangeValidation.end!;

    // 강의실 존재 여부 확인 및 capacity 조회
    const [classrooms] = (await connection.execute(
      'SELECT id, capacity FROM classrooms WHERE id = ?',
      [idValidation.value!]
    )) as any;

    if (classrooms.length === 0) {
      await connection.rollback();
      connection.release();
      return res.status(400).json({ error: 'Classroom not found' });
    }

    const classroom = classrooms[0];

    // 참여자 검증
    const participantsValidation = validateParticipants(participants);
    if (!participantsValidation.valid) {
      await connection.rollback();
      connection.release();
      return res.status(400).json({ error: participantsValidation.error });
    }

    // 참여자 수 검증 (본인 1명 + 참여자 수 <= capacity)
    const participantCount = 1 + (participantsValidation.value?.length || 0);
    if (participantCount > classroom.capacity) {
      await connection.rollback();
      connection.release();
      return res.status(400).json({ 
        error: `Total participants (${participantCount}) exceed classroom capacity (${classroom.capacity})` 
      });
    }

    // 대기 신청 검증 (시간, 날짜, 중복 등)
    const waitlistValidation = await validateWaitlistTime(
      idValidation.value!,
      start,
      end,
      req.user!.id
    );
    if (waitlistValidation) {
      await connection.rollback();
      connection.release();
      return res.status(400).json({ error: waitlistValidation });
    }

    // 예약 3개 제한 검증 (대기 신청도 포함)
    const [existingReservations] = (await connection.execute(
      `SELECT COUNT(*) as count FROM reservations 
       WHERE user_id = ? 
       AND status = 'active' 
       AND end_time > NOW()
       FOR UPDATE`,
      [req.user!.id]
    )) as any;

    if (existingReservations[0].count >= 3) {
      await connection.rollback();
      connection.release();
      return res.status(400).json({ error: 'Maximum 3 active reservations allowed. Please cancel existing reservations first.' });
    }

    // 해당 시간대의 최대 대기 순위 조회
    const [maxPosition] = (await connection.execute(
      `SELECT COALESCE(MAX(queue_position), 0) as max_pos FROM waitlist 
       WHERE classroom_id = ? AND start_time = ? AND end_time = ?`,
      [classroom_id, start, end]
    )) as any;

    const nextPosition = maxPosition[0].max_pos + 1;

    // participants를 JSON으로 변환하여 저장
    const participantsJson = participantsValidation.value && participantsValidation.value.length > 0
      ? JSON.stringify(participantsValidation.value)
      : null;

    // 대기열 생성
    const [result] = (await connection.execute(
      'INSERT INTO waitlist (classroom_id, user_id, start_time, end_time, queue_position, participants) VALUES (?, ?, ?, ?, ?, ?)',
      [idValidation.value!, req.user!.id, start, end, nextPosition, participantsJson]
    )) as any;

    await connection.commit();
    connection.release();

    res.status(201).json({
      message: 'Added to waitlist successfully',
      waitlist: {
        id: result.insertId,
        classroom_id: idValidation.value!,
        start_time,
        end_time,
        queue_position: nextPosition,
        participants: participantsValidation.value || []
      }
    });
  } catch (error: any) {
    await connection.rollback();
    connection.release();
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
    res.status(500).json({ error: 'Failed to fetch waitlist' });
  }
};

export const cancelWaitlist = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // ID 검증
    const idValidation = validateNumericId(id);
    if (!idValidation.valid) {
      return res.status(400).json({ error: idValidation.error });
    }

    // 대기 신청 정보 조회
    const [waitlistItems] = (await pool.execute(
      'SELECT * FROM waitlist WHERE id = ?',
      [idValidation.value]
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
      ['cancelled', idValidation.value]
    );

    res.json({ message: 'Waitlist item cancelled successfully' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to cancel waitlist item' });
  }
};

