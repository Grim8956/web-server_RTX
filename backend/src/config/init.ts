import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import pool from './database';

export async function initializeDatabase() {
  try {
    const sql = fs.readFileSync(path.join(__dirname, 'init.sql'), 'utf8');
    
    // SQL 문을 개별적으로 실행
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    for (const statement of statements) {
      await pool.execute(statement);
    }

  } catch (error: any) {
    if (error.code !== 'ER_TABLE_EXISTS_ERROR') {
      throw error;
    }
  }
}

export async function createDefaultAdmin() {
  try {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const [existingAdmin] = await pool.execute(
      'SELECT * FROM users WHERE student_id = ?',
      ['admin']
    );

    if (Array.isArray(existingAdmin) && existingAdmin.length === 0) {
      await pool.execute(
        'INSERT INTO users (student_id, password, name, role) VALUES (?, ?, ?, ?)',
        ['admin', hashedPassword, '관리자', 'admin']
      );
    }
  } catch (error: any) {
    // Error creating default admin
  }
}

