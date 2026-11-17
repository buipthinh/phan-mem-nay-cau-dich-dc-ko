import sql from 'mssql';

/**
 * Kết nối tới SQL Server. Các thông số đọc từ file .env (xem .env.example).
 * Có DB_INSTANCE (ví dụ SQLEXPRESS) thì mssql tự hỏi SQL Server Browser cổng của instance đó.
 */
const config = {
  server: process.env.DB_SERVER ?? 'localhost',
  database: process.env.DB_DATABASE ?? 'MuaThuLongLay',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ...(process.env.DB_INSTANCE ? {} : { port: Number(process.env.DB_PORT ?? 1433) }),
  options: {
    instanceName: process.env.DB_INSTANCE || undefined,
    // SQL Server trên máy cá nhân dùng chứng chỉ tự ký, nên tin chứng chỉ đó.
    trustServerCertificate: true,
  },
  pool: { max: 10, idleTimeoutMillis: 30000 },
};

let poolPromise;

/** Dùng chung một pool kết nối cho cả API, chỉ mở lần đầu. */
export function getPool() {
  poolPromise ??= new sql.ConnectionPool(config).connect().catch((err) => {
    poolPromise = undefined;
    throw err;
  });
  return poolPromise;
}

/** Chạy một câu SQL có tham số: query('select * from stalls where id = @id', { id: 'F1' }). */
export async function query(text, params = {}) {
  const request = (await getPool()).request();
  for (const [name, value] of Object.entries(params)) request.input(name, value);
  const result = await request.query(text);
  return result.recordset ?? [];
}

export { sql };
