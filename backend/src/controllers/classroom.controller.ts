import { Response } from "express";
import pool from "../config/database";
import { AuthRequest } from "../middleware/auth";

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
    console.error("Create classroom error:", error);
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
    console.error("Get classrooms error:", error);
    res.status(500).json({ error: "Failed to fetch classrooms" });
  }
};

export const getClassroomById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const [classrooms] = (await pool.execute(
      "SELECT * FROM classrooms WHERE id = ?",
      [id]
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
    console.error("Get classroom error:", error);
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
    console.error("Update classroom error:", error);
    res.status(500).json({ error: "Failed to update classroom" });
  }
};

export const deleteClassroom = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // 존재 여부 확인
    const [existing] = (await pool.execute(
      "SELECT * FROM classrooms WHERE id = ?",
      [id]
    )) as any;

    if (existing.length === 0) {
      return res.status(404).json({ error: "Classroom not found" });
    }

    await pool.execute("DELETE FROM classrooms WHERE id = ?", [id]);

    res.json({ message: "Classroom deleted successfully" });
  } catch (error: any) {
    console.error("Delete classroom error:", error);
    res.status(500).json({ error: "Failed to delete classroom" });
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

    const start = new Date(`${date}T${startTime}`);
    const end = new Date(`${date}T${endTime}`);

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
      query += " AND c.capacity >= ?";
      params.push(parseInt(minCapacity as string));
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
    console.error("Get available classrooms error:", error);
    res.status(500).json({ error: "Failed to fetch available classrooms" });
  }
};
