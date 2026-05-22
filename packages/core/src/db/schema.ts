import { pgTable, varchar, timestamp, text, integer, doublePrecision, boolean, unique, index } from "drizzle-orm/pg-core";

// 👤 USERS
export const users = pgTable("users", {
  id: varchar("id", { length: 255 }).primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  role: varchar("role", { length: 50 }).default("user").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow()
});

// 🎵 SONGS
export const songs = pgTable("songs", {
  id: varchar("id", { length: 255 }).primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  artistName: varchar("artist_name", { length: 255 }).notNull(),
  duration: doublePrecision("duration").notNull(),
  songKey: text("song_key").notNull(),
  imageKey: text("image_key").notNull(),
  language: varchar("language", { length: 255 }).notNull(),
  jobId: varchar("job_id", { length: 255 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow()
});

// 👤 ARTISTS
export const artists = pgTable("artists", {
  id: varchar("id", { length: 255 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  about: text("about").notNull(),
  dob: timestamp("dob", { withTimezone: true }).notNull(),
  coverImageKey: text("cover_image_key").notNull(),
  bannerImageKey: text("banner_image_key").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow()
});

// 📀 PLAYLIST
export const playlists = pgTable("playlists", {
  id: varchar("id", { length: 255 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  coverImageKey: text("cover_image_key").notNull(),
  bannerImageKey: text("banner_image_key").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow()
});

// 🎶 PLAYLIST SONGS (many-to-many)
export const playlistSongs = pgTable("playlist_songs", {
  id: varchar("id", { length: 255 }).primaryKey(),
  playlistId: varchar("playlist_id", { length: 255 }).notNull().references(() => playlists.id, { onDelete: "cascade" }),
  songId: varchar("song_id", { length: 255 }).notNull().references(() => songs.id, { onDelete: "cascade" })
}, (t) => ({
  uniquePlaylistSong: unique("unique_playlist_song").on(t.playlistId, t.songId)
}));

// 👤 USER PLAYLIST
export const userPlaylists = pgTable("user_playlists", {
  id: varchar("id", { length: 255 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  userId: varchar("user_id", { length: 255 }).notNull().references(() => users.id, { onDelete: "cascade" })
}, (t) => ({
  uniqueUserPlaylist: unique("unique_user_playlist").on(t.name, t.userId)
}));

// 🎧 USER PLAYLIST SONGS
export const userPlaylistSongs = pgTable("user_playlist_songs", {
  id: varchar("id", { length: 255 }).primaryKey(),
  playlistId: varchar("playlist_id", { length: 255 }).notNull().references(() => userPlaylists.id, { onDelete: "cascade" }),
  songId: varchar("song_id", { length: 255 }).notNull().references(() => songs.id, { onDelete: "cascade" })
}, (t) => ({
  uniqueUserPlaylistSong: unique("unique_user_playlist_song").on(t.playlistId, t.songId),
  playlistIdIdx: index("user_playlist_songs_playlist_id_idx").on(t.playlistId)
}));

// 👤 USER FAVOURITE SONGS
export const userFavouriteSongs = pgTable("user_favourite_songs", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull().references(() => users.id, { onDelete: "cascade" }),
  songId: varchar("song_id", { length: 255 }).notNull().references(() => songs.id, { onDelete: "cascade" })
}, (t) => ({
  uniqueUserFavouriteSong: unique("unique_user_favourite_song").on(t.userId, t.songId)
}));

// 🕑 USER HISTORY
export const userHistory = pgTable("user_history", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull().references(() => users.id, { onDelete: "cascade" }),
  songId: varchar("song_id", { length: 255 }).notNull().references(() => songs.id, { onDelete: "cascade" }),
  part: integer("part").notNull(),
  listenedAt: timestamp("listened_at", { withTimezone: true }).defaultNow()
}, (t) => ({
  userIdIdx: index("user_history_user_id_idx").on(t.userId)
}));

// 🕑 USER SEARCH HISTORY
export const userSearchHistory = pgTable("user_search_history", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull().references(() => users.id, { onDelete: "cascade" }),
  searchedText: varchar("searched_text", { length: 255 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow()
});

// ⚙️ SONG PROCESSING JOB
export const songProcessingJob = pgTable("song_processing_job", {
  id: varchar("id", { length: 255 }).primaryKey(),
  jobId: varchar("job_id", { length: 255 }),
  title: varchar("title", { length: 255 }).notNull(),
  artistName: varchar("artist_name", { length: 255 }).notNull(),
  duration: doublePrecision("duration"),
  tempSongKey: text("temp_song_key").notNull(),
  songKey: text("song_key"),
  imageKey: text("image_key").notNull(),
  language: varchar("language", { length: 255 }),
  sampleRate: doublePrecision("sample_rate"),
  loudness: doublePrecision("loudness"),
  dynamicComplexity: doublePrecision("dynamic_complexity"),
  bpm: doublePrecision("bpm"),
  spectralCentroid: doublePrecision("spectral_centroid"),
  spectralFlux: doublePrecision("spectral_flux"),
  zeroCrossingRate: doublePrecision("zero_crossing_rate"),
  savedInSearch: boolean("saved_in_search").default(false),
  savedInRecommendation: boolean("saved_in_recommendation").default(false),
  transcodingId: varchar("transcoding_id", { length: 255 }),
  transcodingAttempt: integer("transcoding_attempt").default(0),
  transcoded: boolean("transcoded").default(false),
  transcribingId: varchar("transcribing_id", { length: 255 }),
  transcribingAttempt: integer("transcribing_attempt").default(0),
  transcribed: boolean("transcribed").default(false),
  extractedFeatures: boolean("extracted_features").default(false),
  status: varchar("status", { length: 50 }).notNull().default("pending")
});
