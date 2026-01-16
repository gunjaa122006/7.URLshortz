const { pool } = require('../config/database');

/**
 * URL Model - PostgreSQL implementation
 */
class Url {
  /**
   * Create a new shortened URL
   */
  static async create(data) {
    const { shortCode, originalUrl, redirectType, customAlias, expiresAt, metadata } = data;
    
    const query = `
      INSERT INTO urls (short_code, original_url, redirect_type, custom_alias, expires_at, metadata, ip_hash, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    
    const values = [
      shortCode,
      originalUrl,
      redirectType || 301,
      customAlias || false,
      expiresAt || null,
      metadata || {},
      metadata?.ipHash || null,
      metadata?.createdBy || 'api'
    ];
    
    const result = await pool.query(query, values);
    return this.mapRow(result.rows[0]);
  }

  /**
   * Find URL by short code
   */
  static async findOne(filter) {
    const { shortCode } = filter;
    const query = 'SELECT * FROM urls WHERE short_code = $1 LIMIT 1';
    const result = await pool.query(query, [shortCode]);
    
    return result.rows.length > 0 ? this.mapRow(result.rows[0]) : null;
  }

  /**
   * Find URL by original URL
   */
  static async findByOriginalUrl(originalUrl) {
    const query = 'SELECT * FROM urls WHERE original_url = $1 LIMIT 1';
    const result = await pool.query(query, [originalUrl]);
    
    return result.rows.length > 0 ? this.mapRow(result.rows[0]) : null;
  }

  /**
   * Find URL and increment click count atomically
   */
  static async findAndIncrementClicks(shortCode) {
    const query = `
      UPDATE urls 
      SET click_count = click_count + 1, 
          last_accessed = CURRENT_TIMESTAMP
      WHERE short_code = $1
      RETURNING *
    `;
    
    const result = await pool.query(query, [shortCode]);
    return result.rows.length > 0 ? this.mapRow(result.rows[0]) : null;
  }

  /**
   * Map database row to object with methods
   */
  static mapRow(row) {
    if (!row) return null;
    
    return {
      id: row.id,
      shortCode: row.short_code,
      originalUrl: row.original_url,
      redirectType: row.redirect_type,
      customAlias: row.custom_alias,
      clickCount: row.click_count,
      createdAt: row.created_at,
      lastAccessed: row.last_accessed,
      expiresAt: row.expires_at,
      metadata: row.metadata,
      isExpired: function() {
        return this.expiresAt && new Date(this.expiresAt) < new Date();
      }
    };
  }
}

module.exports = Url;
