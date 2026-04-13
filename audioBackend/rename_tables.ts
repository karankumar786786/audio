import { db } from "./src/infra";

async function renameTables() {
    try {
        console.log("Renaming tables...");
        await db`ALTER TABLE system_playlists RENAME TO playlists`;
        await db`ALTER TABLE system_playlist_songs RENAME TO playlist_songs`;
        console.log("Tables renamed successfully.");
    } catch (error) {
        console.error("Error renaming tables:", error);
    } finally {
        process.exit();
    }
}

renameTables();
