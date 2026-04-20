import { db } from "../src/infra/db";
import { UserFavouriteSongRepository } from "../src/repository/user-favourite-song.repository";
import { NodeCryptoSignatureService } from "../src/lib/signature/node-crypto";
import { logger } from "../src/infra";

async function testDelete() {
    const sig = new NodeCryptoSignatureService(process.env.SIGNATURE_SECRET!);
    const repo = new UserFavouriteSongRepository(db, logger, sig);

    // Get a valid user and song to test with
    const [fav] = await db`SELECT user_id, song_id FROM user_favourite_songs LIMIT 1`;
    
    if (!fav) {
        console.log("No favorites found to test deletion.");
        return;
    }

    console.log("Testing deletion for:", fav);
    try {
        const result = await repo.deleteFavorite(fav.user_id, fav.song_id);
        console.log("Deletion success:", result);
    } catch (e) {
        console.error("Deletion failed with error:", e);
    }
}

testDelete().catch(console.error);
