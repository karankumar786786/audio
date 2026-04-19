import { db } from "../src/infra/db";
import { artistService, songService, playlistService } from "../src/infra";

async function testDeletion() {
  console.log("--- Testing Deletions ---");

  // 1. Create dummy artist
  console.log("\n1. Testing Artist Deletion");
  try {
    const artist = await artistService.createArtist({
      name: "Test Artist " + Date.now(),
      about: "Testing deletion",
      dob: "1990-01-01",
      coverImageKey: "test/cover.jpg",
      bannerImageKey: "test/banner.jpg"
    });
    console.log("Created artist:", artist.id);
    
    // Attempt delete
    await artistService.deleteArtist(artist.id);
    console.log("Deleted artist successfully");
  } catch (err: any) {
    console.error("Artist deletion failed:", err.message);
  }

  // 2. Testing Playlist Deletion (with songs)
  console.log("\n2. Testing Playlist Deletion (with songs)");
  try {
    const playlist = await playlistService.createPlaylist({
      name: "Test Playlist " + Date.now(),
      description: "Testing deletion with songs",
      coverImageKey: "test/p-cover.jpg",
      bannerImageKey: "test/p-banner.jpg"
    });
    console.log("Created playlist:", playlist.id);

    // Add a song to it? Wait, I need a real song.
    // I'll just try to delete the empty playlist first.
    await playlistService.deletePlaylist(playlist.id);
    console.log("Deleted empty playlist successfully");
    
    // Now create again and add a song
    const p2 = await playlistService.createPlaylist({
        name: "Test Playlist 2 " + Date.now(),
        description: "Testing deletion with songs",
        coverImageKey: "test/p-cover.jpg",
        bannerImageKey: "test/p-banner.jpg"
      });
    
    const songs = await songService.getSongs({ page: 1, limit: 1 });
    if (songs.data.length > 0) {
        const songId = songs.data[0].id;
        console.log("Adding song", songId, "to playlist", p2.id);
        await playlistService.addSongToPlaylist({ playlistId: p2.id, songId });
        
        console.log("Attempting to delete playlist with songs...");
        await playlistService.deletePlaylist(p2.id);
        console.log("Deleted playlist with songs successfully");
    } else {
        console.log("No songs available to test playlist relation deletion");
    }
  } catch (err: any) {
    console.error("Playlist deletion failed:", err.message);
  }

  // 3. Testing Song Deletion
  console.log("\n3. Testing Song Deletion");
  try {
     const songs = await songService.getSongs({ page: 1, limit: 1 });
     if (songs.data.length > 0) {
         const songId = songs.data[0].id;
         console.log("Attempting to delete song", songId);
         // Note: This will delete a real song!
         // But I have to test it.
         // Actually, let's just see if there's a constraint check.
         const res = await playlistService.getPlaylistSongs(songs.data[0].id, { page: 1, limit: 10 });
         // Wait, I should create a dummy song if possible, but createSong is complex (job based).
         
         console.log("Skipping real song deletion for safety, but check the code for relation cleanup");
     }
  } catch (err: any) {
    console.error("Song deletion failed:", err.message);
  }

  process.exit(0);
}

testDeletion();
