import { Response } from "express";
import pool from "../config/database";
import { AuthRequest } from "../middleware/auth";
import {
  validateReservationTime,
  validateActiveReservationLimit,
  validateReservationDate,
  validateDateRange,
  validateNumericId,
  validateClassroomExists,
  validateParticipants,
  validateOnTheHour,
} from "../utils/validation";
import { io } from "../server";
import { assignWaitlistItem } from "../services/waitlist.service";

export const createReservation = async (req: AuthRequest, res: Response) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const { classroom_id, start_time, end_time, participants } = req.body;

    // 필수 필드 검증
    if (!classroom_id || !start_time || !end_time) {
      await connection.rollback();
      connection.release();
      return res.status(400).json({ error: "All fields are required" });
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

    // 정시 검증
    const onTheHourError = validateOnTheHour(start, end);
    if (onTheHourError) {
      await connection.rollback();
      connection.release();
      return res.status(400).json({ error: onTheHourError });
    }

    // 날짜 검증 (과거, 7일 이내)
    const dateError = await validateReservationDate(start);
    if (dateError) {
      await connection.rollback();
      connection.release();
      return res.status(400).json({ error: dateError });
    }

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

    // 개인당 활성 예약 3개 제한 (트랜잭션 내에서 재검증, SELECT FOR UPDATE로 락 걸어 동시성 문제 방지)
    // end_time > NOW()를 사용하여 현재 진행 중이거나 미래 예약을 모두 카운트
    const [existingReservations] = (await connection.execute(
      `SELECT * FROM reservations 
       WHERE user_id = ? 
       AND status = 'active' 
       AND end_time > NOW()
       FOR UPDATE`,
      [req.user!.id]
    )) as any;

    if (existingReservations.length >= 3) {
      await connection.rollback();
      connection.release();
      return res
        .status(400)
        .json({ error: "Maximum 3 active reservations allowed" });
    }

    // 겹침 검증 (트랜잭션 내에서 재검증)
    const [overlapping] = (await connection.execute(
      `SELECT * FROM reservations 
       WHERE classroom_id = ? 
       AND status = 'active' 
       AND (
         (start_time < ? AND end_time > ?) OR
         (start_time >= ? AND start_time < ?) OR
         (end_time > ? AND end_time <= ?)
       )`,
      [idValidation.value!, end, start, start, end, start, end]
    )) as any;

    if (overlapping.length > 0) {
      await connection.rollback();
      connection.release();
      return res
        .status(400)
        .json({ error: "This time slot is already reserved" });
    }

    // 예약 생성 직전에 최종 검증 (동시성 문제 완전 방지)
    const [finalCheck] = (await connection.execute(
      `SELECT COUNT(*) as count FROM reservations 
       WHERE user_id = ? 
       AND status = 'active' 
       AND end_time > NOW()`,
      [req.user!.id]
    )) as any;

    if (finalCheck[0].count >= 3) {
      await connection.rollback();
      connection.release();
      return res
        .status(400)
        .json({ error: "Maximum 3 active reservations allowed" });
    }

    // 참여자의 활성 예약 개수 사전 검증 (예약 생성 전)
    // 다른 사용자가 내 학번을 참여자로 추가할 때 내 예약이 3개를 초과하는지 트랜잭션 내에서 확인
    if (participants && Array.isArray(participants) && participants.length > 0) {
      for (const studentId of participants) {
        const [users] = (await connection.execute(
          "SELECT id FROM users WHERE student_id = ?",
          [studentId]
        )) as any;

        if (users.length > 0) {
          const participantUserId = users[0].id;
          
          // 참여자가 예약자로 가진 활성 예약 개수 확인 (트랜잭션 내, SELECT FOR UPDATE로 락)
          const [participantAsOwner] = (await connection.execute(
            `SELECT COUNT(*) as count FROM reservations 
             WHERE user_id = ? 
             AND status = 'active' 
             AND end_time > NOW()
             FOR UPDATE`,
            [participantUserId]
          )) as any;

          const ownerCount = participantAsOwner[0].count || 0;

          // 참여자가 참여자로 참여하고 있는 활성 예약 개수 확인 (트랜잭션 내, SELECT FOR UPDATE로 락)
          const [participantAsParticipant] = (await connection.execute(
            `SELECT COUNT(DISTINCT r.id) as count 
             FROM reservation_participants rp
             JOIN reservations r ON rp.reservation_id = r.id
             WHERE rp.user_id = ? 
             AND r.status = 'active' 
             AND r.end_time > NOW()
             FOR UPDATE`,
            [participantUserId]
          )) as any;

          const participantCount = participantAsParticipant[0].count || 0;
          
          // 총 활성 예약 수 (예약자로 + 참여자로) + 현재 추가되는 예약 1개
          const totalActiveReservations = ownerCount + participantCount;
          
          // 현재 추가되는 예약으로 인해 3개를 초과하면 차단
          if (totalActiveReservations >= 3) {
            await connection.rollback();
            connection.release();
            return res.status(400).json({ 
              error: `Participant ${studentId} already has ${totalActiveReservations} active reservations. Maximum 3 allowed.` 
            });
          }
        }
      }
    }

    // 예약 생성 (트랜잭션 내)
    const [result] = (await connection.execute(
      "INSERT INTO reservations (classroom_id, user_id, start_time, end_time) VALUES (?, ?, ?, ?)",
      [classroom_id, req.user!.id, start, end]
    )) as any;

    const reservationId = result.insertId;

    // 참여자 추가
    if (participants && Array.isArray(participants)) {
      for (const studentId of participants) {
        const [users] = (await connection.execute(
          "SELECT id FROM users WHERE student_id = ?",
          [studentId]
        )) as any;

        if (users.length > 0) {
          await connection.execute(
            "INSERT INTO reservation_participants (reservation_id, user_id) VALUES (?, ?)",
            [reservationId, users[0].id]
          );
        }
      }
    }

    // 예약 정보 조회
    const [reservations] = (await connection.execute(
      `SELECT r.*, c.name as classroom_name, c.location, u.name as user_name 
       FROM reservations r 
       JOIN classrooms c ON r.classroom_id = c.id 
       JOIN users u ON r.user_id = u.id 
       WHERE r.id = ?`,
      [reservationId]
    )) as any;

    await connection.commit();
    connection.release();

    // Socket.io로 실시간 브로드캐스트
    io.to(`classroom:${classroom_id}`).emit(
      "reservation:created",
      reservations[0]
    );

    res.status(201).json({
      message: "Reservation created successfully",
      reservation: reservations[0],
    });
  } catch (error: any) {
    await connection.rollback();
    connection.release();
    res.status(500).json({ error: "Failed to create reservation" });
  }
};

export const getMyReservations = async (req: AuthRequest, res: Response) => {
  try {
    const [reservations] = await pool.execute(
      `SELECT DISTINCT r.*, c.name as classroom_name, c.location, u.name as user_name, u.student_id
       FROM reservations r 
       JOIN classrooms c ON r.classroom_id = c.id 
       JOIN users u ON r.user_id = u.id
       LEFT JOIN reservation_participants rp ON r.id = rp.reservation_id
       WHERE (r.user_id = ? OR rp.user_id = ?)
       AND r.status = 'active'
       ORDER BY r.start_time ASC`,
      [req.user!.id, req.user!.id]
    );

    res.json({ reservations });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to fetch reservations" });
  }
};

export const getClassroomTimeline = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const [reservations] = await pool.execute(
      `SELECT r.*, c.name as classroom_name, c.location, u.name as user_name, u.student_id
       FROM reservations r 
       JOIN classrooms c ON r.classroom_id = c.id 
       JOIN users u ON r.user_id = u.id
       WHERE r.classroom_id = ? 
       AND r.status = 'active'
       ORDER BY r.start_time ASC`,
      [id]
    );

    res.json({ reservations });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to fetch timeline" });
  }
};

export const cancelReservation = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // ID 검증
    const idValidation = validateNumericId(id);
    if (!idValidation.valid) {
      return res.status(400).json({ error: idValidation.error });
    }

    // 예약 정보 조회
    const [reservations] = (await pool.execute(
      "SELECT * FROM reservations WHERE id = ?",
      [idValidation.value]
    )) as any;

    if (reservations.length === 0) {
      return res.status(404).json({ error: "Reservation not found" });
    }

    const reservation = reservations[0];

    // 본인 예약만 취소 가능
    if (reservation.user_id !== req.user!.id) {
      return res
        .status(403)
        .json({ error: "Cannot cancel other users' reservations" });
    }

    // 취소 처리
    await pool.execute("UPDATE reservations SET status = ? WHERE id = ?", [
      "cancelled",
      idValidation.value,
    ]);

    // Socket.io로 실시간 브로드캐스트
    io.to(`classroom:${reservation.classroom_id}`).emit(
      "reservation:cancelled",
      { 
        id: idValidation.value,
        classroom_id: reservation.classroom_id,
        start_time: reservation.start_time,
        end_time: reservation.end_time
      }
    );

    // 대기열 1순위 확인 및 할당
    await assignWaitlistItem(
      reservation.classroom_id,
      reservation.start_time,
      reservation.end_time
    );

    res.json({ message: "Reservation cancelled successfully" });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to cancel reservation" });
  }
};
