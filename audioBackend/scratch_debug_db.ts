import { db } from "./src/infra/db";
import dotenv from "dotenv";

dotenv.config();

async function debug() {
    try {
        console.log("Checking Artists...");
        const artists = await db`SELECT id, name FROM artists LIMIT 5`;
        console.log("Artists:", JSON.stringify(artists, null, 2));

        if (artists.length > 0) {
            const firstArtist = artists[0];
            console.log(`Checking songs for artist: ${firstArtist.name}`);
            
            const normalizedName = `%${firstArtist.name.replace(/\.|\s/g, "")}%`;
            console.log(`Normalized search term: ${normalizedName}`);

            const songs = await db`
                SELECT id, title, artist_name 
                FROM songs 
                WHERE REPLACE(REPLACE(artist_name, '.', ''), ' ', '') ILIKE ${normalizedName}
                LIMIT 5
            `;
            console.log("Songs found:", JSON.stringify(songs, null, 2));
            
            const allSongs = await db`SELECT artist_name FROM songs LIMIT 10`;
            console.log("Sample artist names from songs table:", allSongs.map(s => s.artist_name));
        } else {
            console.log("No artists found in database.");
        }
    } catch (error) {
        console.error("Error during debug:", error);
    }
}

debug();
