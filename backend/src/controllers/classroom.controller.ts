import { Response } from "express";
import pool from "../config/database";
import { AuthRequest } from "../middleware/auth";
import { validateNumericId, validateString } from "../utils/validation";

export const createClassroom = async (req: AuthRequest, res: Response) => {
  try {
    const { name, location, capacity, has_projector, has_whiteboard } =
      req.body;

    if (!name || !location || !capacity) {
      return res
        .status(400)
        .json({ error: "Name, location, and capacity are required" });
    }

    const [result] = (await pool.execute(
      "INSERT INTO classrooms (name, location, capacity, has_projector, has_whiteboard) VALUES (?, ?, ?, ?, ?)",
      [
        name,
        location,
        capacity,
        has_projector || false,
        has_whiteboard || false,
      ]
    )) as any;

    res.status(201).json({
      message: "Classroom created successfully",
      classroom: {
        id: result.insertId,
        name,
        location,
        capacity,
        has_projector: has_projector || false,
        has_whiteboard: has_whiteboard || false,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to create classroom" });
  }
};

export const getAllClassrooms = async (req: AuthRequest, res: Response) => {
  try {
    const [classrooms] = (await pool.execute(
      "SELECT * FROM classrooms ORDER BY name"
    )) as any;

    // MySQL의 TINYINT(1)을 boolean으로 변환
    const formattedClassrooms = classrooms.map((classroom: any) => ({
      ...classroom,
      has_projector: Boolean(classroom.has_projector),
      has_whiteboard: Boolean(classroom.has_whiteboard),
    }));

    res.json({ classrooms: formattedClassrooms });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to fetch classrooms" });
  }
};

export const getClassroomById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // ID 검증
    const idValidation = validateNumericId(id);
    if (!idValidation.valid) {
      return res.status(400).json({ error: idValidation.error });
    }

    const [classrooms] = (await pool.execute(
      "SELECT * FROM classrooms WHERE id = ?",
      [idValidation.value]
    )) as any;

    if (classrooms.length === 0) {
      return res.status(404).json({ error: "Classroom not found" });
    }

    // MySQL의 TINYINT(1)을 boolean으로 변환
    const classroom = {
      ...classrooms[0],
      has_projector: Boolean(classrooms[0].has_projector),
      has_whiteboard: Boolean(classrooms[0].has_whiteboard),
    };

    res.json({ classroom });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to fetch classroom" });
  }
};

export const updateClassroom = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, location, capacity, has_projector, has_whiteboard } =
      req.body;

    // 존재 여부 확인
    const [existing] = (await pool.execute(
      "SELECT * FROM classrooms WHERE id = ?",
      [id]
    )) as any;

    if (existing.length === 0) {
      return res.status(404).json({ error: "Classroom not found" });
    }

    await pool.execute(
      "UPDATE classrooms SET name = ?, location = ?, capacity = ?, has_projector = ?, has_whiteboard = ? WHERE id = ?",
      [name, location, capacity, has_projector, has_whiteboard, id]
    );

    res.json({ message: "Classroom updated successfully" });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to update classroom" });
  }
};

export const deleteClassroom = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // ID 검증
    const idValidation = validateNumericId(id);
    if (!idValidation.valid) {
      return res.status(400).json({ error: idValidation.error });
    }

    // 존재 여부 확인
    const [existing] = (await pool.execute(
      "SELECT * FROM classrooms WHERE id = ?",
      [idValidation.value]
    )) as any;

    if (existing.length === 0) {
      return res.status(404).json({ error: "Classroom not found" });
    }

    // 트랜잭션 시작
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // 관련 데이터 확인 및 삭제 (CASCADE가 작동하지 않을 경우를 대비)
      const [reservations] = (await connection.execute(
        "SELECT COUNT(*) as count FROM reservations WHERE classroom_id = ?",
        [idValidation.value]
      )) as any;

      const [waitlist] = (await connection.execute(
        "SELECT COUNT(*) as count FROM waitlist WHERE classroom_id = ?",
        [idValidation.value]
      )) as any;

      const reservationCount = reservations[0]?.count || 0;
      const waitlistCount = waitlist[0]?.count || 0;

      // 관련 데이터를 먼저 삭제 (CASCADE가 작동하지 않는 경우 대비)
      // reservation_participants는 reservations의 CASCADE로 자동 삭제되므로 별도 처리 불필요
      
      // notifications는 reservation_id가 SET NULL이므로 직접 삭제하지 않아도 됨
      // 하지만 명시적으로 처리하여 확실히 함
      
      // 예약 관련 알림 삭제 (reservation_id가 NULL이 되어도 메시지 유지할 수도 있지만, 
      // 강의실 삭제 시 관련 알림도 정리하는 것이 좋음)
      await connection.execute(
        `DELETE n FROM notifications n 
         INNER JOIN reservations r ON n.reservation_id = r.id 
         WHERE r.classroom_id = ?`,
        [idValidation.value]
      );

      // 예약 참여자 삭제 (reservations의 CASCADE로 자동 삭제되지만 명시적으로 처리)
      await connection.execute(
        `DELETE rp FROM reservation_participants rp 
         INNER JOIN reservations r ON rp.reservation_id = r.id 
         WHERE r.classroom_id = ?`,
        [idValidation.value]
      );

      // 예약 삭제
      await connection.execute(
        "DELETE FROM reservations WHERE classroom_id = ?",
        [idValidation.value]
      );

      // 대기열 삭제
      await connection.execute(
        "DELETE FROM waitlist WHERE classroom_id = ?",
        [idValidation.value]
      );

      // 강의실 삭제
      await connection.execute(
        "DELETE FROM classrooms WHERE id = ?",
        [idValidation.value]
      );

      // 트랜잭션 커밋
      await connection.commit();
      connection.release();

      res.json({ 
        message: "Classroom deleted successfully",
        deletedReservations: reservationCount,
        deletedWaitlist: waitlistCount
      });
    } catch (transactionError: any) {
      // 트랜잭션 롤백
      await connection.rollback();
      connection.release();
      throw transactionError;
    }
  } catch (error: any) {
    // 에러 상세 정보
    const errorMessage = error.message || "Unknown error";
    const errorCode = error.code || "UNKNOWN";
    
    // 데이터베이스 연결 에러 체크
    if (errorCode === "ECONNREFUSED" || errorCode === "PROTOCOL_CONNECTION_LOST") {
      return res.status(503).json({ 
        error: "Database connection failed",
        details: "Please try again later"
      });
    }

    // 일반 에러
    res.status(500).json({ 
      error: "Failed to delete classroom",
      details: process.env.NODE_ENV === "development" ? errorMessage : undefined
    });
  }
};

export const getAvailableClassrooms = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const {
      date,
      startTime,
      endTime,
      minCapacity,
      hasProjector,
      hasWhiteboard,
    } = req.query;

    if (!date || !startTime || !endTime) {
      return res
        .status(400)
        .json({ error: "Date, startTime, and endTime are required" });
    }

    // 날짜 형식 검증 및 변환
    // 시간 형식이 HH:mm 또는 HH:mm:ss인지 확인하고 표준화
    const normalizeTime = (time: string) => {
      // HH:mm 또는 HH:mm:ss 형식으로 변환
      const parts = time.split(':');
      if (parts.length < 2) {
        return null;
      }
      const hour = parts[0].padStart(2, '0');
      const minute = parts[1].padStart(2, '0');
      const second = parts[2] || '00';
      return `${hour}:${minute}:${second}`;
    };

    const normalizedStartTime = normalizeTime(startTime as string);
    const normalizedEndTime = normalizeTime(endTime as string);

    if (!normalizedStartTime || !normalizedEndTime) {
      return res.status(400).json({ error: "Invalid time format. Expected HH:mm or HH:mm:ss" });
    }

    const start = new Date(`${date}T${normalizedStartTime}`);
    const end = new Date(`${date}T${normalizedEndTime}`);
    
    // 유효한 날짜인지 확인
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ error: "Invalid date or time format" });
    }

    // 시작 시간이 종료 시간보다 늦으면 에러
    if (start >= end) {
      return res.status(400).json({ error: "Start time must be before end time" });
    }

    // 모든 강의실 조회 (예약 여부와 상관없이) + 예약 여부 확인
    let query = `
      SELECT 
        c.*,
        CASE 
          WHEN EXISTS (
            SELECT 1 
            FROM reservations r 
            WHERE r.classroom_id = c.id 
            AND r.status = 'active'
            AND (
              (r.start_time < ? AND r.end_time > ?) OR
              (r.start_time >= ? AND r.start_time < ?) OR
              (r.end_time > ? AND r.end_time <= ?)
            )
          ) THEN 0
          ELSE 1
        END as is_available
      FROM classrooms c
      WHERE 1=1
    `;

    const params: any[] = [end, start, start, end, start, end];

    // 추가 필터 조건
    if (minCapacity) {
      const capacity = parseInt(minCapacity as string);
      if (!isNaN(capacity) && capacity > 0) {
        query += " AND c.capacity >= ?";
        params.push(capacity);
      }
    }

    if (hasProjector === "true") {
      query += " AND c.has_projector = 1";
    }

    if (hasWhiteboard === "true") {
      query += " AND c.has_whiteboard = 1";
    }

    query += " ORDER BY c.name";

    const [classrooms] = (await pool.execute(query, params)) as any;

    // MySQL의 TINYINT(1)을 boolean으로 변환 + is_available도 boolean으로 변환
    const formattedClassrooms = classrooms.map((classroom: any) => ({
      ...classroom,
      has_projector: Boolean(classroom.has_projector),
      has_whiteboard: Boolean(classroom.has_whiteboard),
      is_available: Boolean(classroom.is_available),
    }));

    res.json({ classrooms: formattedClassrooms });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to fetch available classrooms" });
  }
};
