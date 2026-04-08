import { neon } from "@neondatabase/serverless";
import {config} from "dotenv";
config();

const sql = neon(`${process.env.DATABASE_URL}`);

(async () => {
  try {
    // 🎵 SONGS
    await sql`
    CREATE TABLE IF NOT EXISTS songs (
      id VARCHAR(255) PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      artist_name VARCHAR(255) NOT NULL,
      duration DOUBLE PRECISION NOT NULL,
      song_key TEXT NOT NULL,
      image_key TEXT NOT NULL,
      language VARCHAR(255) NOT NULL,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      )
      `;
      
    await sql`
      CREATE TABLE IF NOT EXISTS artists (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        about TEXT NOT NULL,
        dob TIMESTAMPTZ NOT NULL,
        cover_image_key TEXT NOT NULL,
        banner_image_key TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // 📀 SYSTEM PLAYLIST
    await sql`
      CREATE TABLE IF NOT EXISTS system_playlists (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        cover_image_key TEXT NOT NULL,
        banner_image_key TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // 🎶 SYSTEM PLAYLIST SONGS (many-to-many)
    await sql`
      CREATE TABLE IF NOT EXISTS system_playlist_songs (
        id VARCHAR(255) PRIMARY KEY,
        playlist_id VARCHAR(255) NOT NULL,
        song_id VARCHAR(255) NOT NULL,

        CONSTRAINT fk_playlist
          FOREIGN KEY (playlist_id)
          REFERENCES system_playlists(id)
          ON DELETE CASCADE,

        CONSTRAINT fk_song
          FOREIGN KEY (song_id)
          REFERENCES songs(id)
          ON DELETE CASCADE,

        CONSTRAINT unique_playlist_song UNIQUE (playlist_id, song_id)
      )
    `;

    // 👤 USER PLAYLIST (no FK to users as per your constraint)
    await sql`
      CREATE TABLE IF NOT EXISTS user_playlists (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        user_id VARCHAR(255) NOT NULL,

        CONSTRAINT unique_user_playlist UNIQUE (name, user_id)
      )
    `;

    // 🎧 USER PLAYLIST SONGS
    await sql`
      CREATE TABLE IF NOT EXISTS user_playlist_songs (
        id VARCHAR(255) PRIMARY KEY,
        playlist_id VARCHAR(255) NOT NULL,
        song_id VARCHAR(255) NOT NULL,

        CONSTRAINT fk_user_playlist
          FOREIGN KEY (playlist_id)
          REFERENCES user_playlists(id)
          ON DELETE CASCADE,

        CONSTRAINT fk_user_song
          FOREIGN KEY (song_id)
          REFERENCES songs(id)
          ON DELETE CASCADE,

        CONSTRAINT unique_user_playlist_song UNIQUE (playlist_id, song_id)
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS user_favourite_songs (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        song_id VARCHAR(255) NOT NULL,

        CONSTRAINT fk_user_favourite_song
          FOREIGN KEY (song_id)
          REFERENCES songs(id)
          ON DELETE CASCADE,

        CONSTRAINT unique_user_favourite_song UNIQUE (user_id, song_id)
      )
    `;

    // 🕑 USER HISTORY (no FK to user)
    await sql`
      CREATE TABLE IF NOT EXISTS user_history (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        song_id VARCHAR(255) NOT NULL,
        part INT NOT NULL,
        listened_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

        CONSTRAINT fk_history_song
          FOREIGN KEY (song_id)
          REFERENCES songs(id)
          ON DELETE CASCADE
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS user_search_history(
      id VARCHAR(255) PRIMARY KEY,
      user_id VARCHAR(255) NOT NULL,
      searched_text VARCHAR(255) NOT NULL
      )
    `

    await sql`CREATE INDEX IF NOT EXISTS idx_artist_name ON songs(artist_name);`;

    console.log("✅ All tables created successfully");
  } catch (err) {
    console.error("❌ Error creating tables:", err);
  }
})();