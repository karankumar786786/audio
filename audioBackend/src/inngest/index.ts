import { transcodeSong } from "./transcode.function";
import { transcribeSong } from "./trancribe.function";
import { processExtractedFeatures } from "./extractFeatures.function";
import { finalizeSong } from "./createSongInTable.function";
import { indexRecombee } from "./saveInRecombee.function";
import { indexAlgolia } from "./saveInAlgolia.function";

export const functions = [
    transcodeSong,
    transcribeSong,
    processExtractedFeatures,
    finalizeSong,
    indexRecombee,
    indexAlgolia
];