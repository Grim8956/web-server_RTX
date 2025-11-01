import mysql from "mysql2/promise";
import dotenv from "dotenv";

// .env 파일 로드 확인
dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "3306"),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "classroom_reservation",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: "+09:00", // 한국 시간대 설정
};

// 데이터베이스 연결 설정 로그 (비밀번호 제외)
console.log("Database configuration:", {
  host: dbConfig.host,
  port: dbConfig.port,
  user: dbConfig.user,
  database: dbConfig.database,
  password: dbConfig.password ? "***" : "(empty - check .env file)",
});

export const pool = mysql.createPool(dbConfig);

export default pool;
