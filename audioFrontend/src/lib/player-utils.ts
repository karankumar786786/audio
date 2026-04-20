import { type Song } from "./api";
import { getImageUrl } from "./image-utils";

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
    coverUrl: getImageUrl(song.imageKey, {
      width: 400,
      height: 400,
      focus: "auto",
      aspectRatio: "1-1",
    }) || "",
    posterUrl: getImageUrl(song.imageKey, {
      width: 720,
      height: 720,
      focus: "auto",
      aspectRatio: "1-1",
      quality: 90,
    }) || "",
  };
}

export function mapListToPlayerSongs(songs: Song[]): PlayerSong[] {
  return songs.map(mapToPlayerSong);
}
