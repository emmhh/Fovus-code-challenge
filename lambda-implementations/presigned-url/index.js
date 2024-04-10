const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

// Initialize the S3 client
const s3Client = new S3Client({ region: "us-east-1" });

exports.handler = async (event) => {
    // Define the parameters for the PutObject command
    const bucketParams = {
        Bucket: "fovus-app-file-storage-test",
        Key: event.queryStringParameters.fileName,
        ContentType: 'binary/octet-stream', 
    };

    try {
        // Generate the pre-signed URL for the PUT operation
        const command = new PutObjectCommand(bucketParams);
        const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 }); // URL expires in 1 hour

        // Return the pre-signed URL in the response
        return {
            statusCode: 200,
            headers: {"Access-Control-Allow-Origin": "*"},
            body: JSON.stringify({ url: presignedUrl }),
        };
    } catch (err) {
        console.error("Error generating pre-signed URL", err);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Error generating pre-signed URL" }),
        };
    }
};
