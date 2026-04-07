import {AlgoliaService} from "./search"
import {S3Service} from "./storage/s3";
import {AudioTranscoder} from "./transcode"

 export const searchService = new AlgoliaService(
    `${process.env.APP_ID}`,
    `${process.env.API_KEY}`,
    `${process.env.INDEX_NAME}`
);

export const storageService = new S3Service(
    `${process.env.REGION}`,
    `${process.env.ACCESS_KEY_ID}`,
    `${process.env.SECRET_KEY}`
)

export const transcodingService = new AudioTranscoder(
    6,
    storageService.getClient(),
    `${process.env.PRODUCTION_BUCKET_NAME}`,
    `${process.env.BASE_PATH}`
);

