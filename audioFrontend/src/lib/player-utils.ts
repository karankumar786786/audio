import { type Song } from "./api";

const IMAGEKIT_BASE_URL = "https://ik.imagekit.io/zaa6pbi9f";
const S3_BASE_URL = "https://videotranscodeprod.s3.ap-south-1.amazonaws.com";

export interface PlayerSong extends Song {
  streamUrl: string;
  coverUrl: string;
  captionUrl?: string;
  posterUrl: string;
}

/**
 * Maps a backend Song object to a PlayerSong with full URLs.
 */
export function mapToPlayerSong(song: Song): PlayerSong {
  const streamBase = `${S3_BASE_URL}/${song.songKey}`;
  
  return {
    ...song,
    streamUrl: `${streamBase}/master.mpd`,
    captionUrl: `${streamBase}/caption.vtt`, 
    coverUrl: `${IMAGEKIT_BASE_URL}${song.imageKey}?tr=w-400,h-400,f-auto`,
    posterUrl: `${IMAGEKIT_BASE_URL}${song.imageKey}?tr=w-720,h-720,f-auto`,
  };
}

export function mapListToPlayerSongs(songs: Song[]): PlayerSong[] {
  return songs.map(mapToPlayerSong);
}
