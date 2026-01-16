const { Pool } = require('pg');

/**
 * PostgreSQL connection pool
 */
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

/**
 * Initialize database and create tables
 */
const connectDB = async () => {
  try {
    // Test connection
    const client = await pool.connect();
    console.log('PostgreSQL Connected');
    
    // Create urls table if not exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS urls (
        id SERIAL PRIMARY KEY,
        short_code VARCHAR(12) UNIQUE NOT NULL,
        original_url TEXT NOT NULL,
        redirect_type INTEGER DEFAULT 301,
        custom_alias BOOLEAN DEFAULT false,
        click_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_accessed TIMESTAMP,
        expires_at TIMESTAMP,
        metadata JSONB,
        created_by VARCHAR(50) DEFAULT 'api',
        ip_hash VARCHAR(64)
      );
      
      CREATE INDEX IF NOT EXISTS idx_short_code ON urls(short_code);
      CREATE INDEX IF NOT EXISTS idx_original_url ON urls(original_url);
      CREATE INDEX IF NOT EXISTS idx_expires_at ON urls(expires_at);
    `);
    
    client.release();
    console.log('Database tables initialized');

    // Handle shutdown
    process.on('SIGINT', async () => {
      await pool.end();
      console.log('PostgreSQL connection closed');
      process.exit(0);
    });

  } catch (error) {
    console.error('Error connecting to PostgreSQL:', error.message);
    process.exit(1);
  }
};

module.exports = { connectDB, pool };
