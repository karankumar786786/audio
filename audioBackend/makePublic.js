const { S3Client, PutBucketPolicyCommand, DeletePublicAccessBlockCommand } = require('@aws-sdk/client-s3');
require('dotenv').config();
const s3 = new S3Client({ region: process.env.REGION, credentials: { accessKeyId: process.env.ACCESS_KEY_ID, secretAccessKey: process.env.SECRET_KEY } });
const bucket = process.env.PRODUCTION_BUCKET_NAME;

async function makePublic() {
  try {
    await s3.send(new DeletePublicAccessBlockCommand({ Bucket: bucket }));
    console.log('Deleted public access block');
    const policy = {
      Version: '2012-10-17',
      Statement: [{ Sid: 'PublicReadGetObject', Effect: 'Allow', Principal: '*', Action: 's3:GetObject', Resource: `arn:aws:s3:::${bucket}/*` }]
    };
    await s3.send(new PutBucketPolicyCommand({ Bucket: bucket, Policy: JSON.stringify(policy) }));
    console.log('Bucket policy updated to public read');
  } catch (e) { console.error('Error:', e); }
}
makePublic();
