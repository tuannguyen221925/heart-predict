import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST,
  port: parseInt(process.env.MYSQL_PORT || "3306"),
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export async function query<T>(sql: string, params?: (string | number | null)[]): Promise<T> {
  const [results] = await pool.execute(sql, params);
  return results as T;
}

export async function initializeDatabase() {
  const connection = await pool.getConnection();
  
  try {
    // Create users table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Create predictions table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS predictions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        age INT NOT NULL,
        sex INT NOT NULL,
        cp VARCHAR(50) NOT NULL,
        trestbps FLOAT NOT NULL,
        chol FLOAT NOT NULL,
        fbs INT NOT NULL,
        restecg VARCHAR(50) NOT NULL,
        thalch FLOAT NOT NULL,
        exang INT NOT NULL,
        oldpeak FLOAT NOT NULL,
        slope VARCHAR(50) NOT NULL,
        ca INT,
        thal VARCHAR(50),
        prediction INT NOT NULL,
        probability FLOAT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    console.log("Database initialized successfully");
  } finally {
    connection.release();
  }
}

export default pool;
