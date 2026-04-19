import { transcodeSong } from "./transcode.function";
import { transcribeSong } from "./transcribe.function";
import { processExtractedFeatures } from "./extractFeatures.function";
import { finalizeSong } from "./createSongInTable.function";
import { indexRecombee } from "./saveInRecombee.function";
import { indexAlgolia } from "./saveInAlgolia.function";
import { importFromYoutube } from "./importFromYoutube.function";

export const functions = [
    transcodeSong,
    transcribeSong,
    processExtractedFeatures,
    finalizeSong,
    indexRecombee,
    indexAlgolia,
    importFromYoutube
];