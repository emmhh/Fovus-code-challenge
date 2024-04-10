// script.js
const { S3Client, PutObjectCommand, GetObjectCommand } = require("@aws-sdk/client-s3");
const { EC2Client, TerminateInstancesCommand } = require("@aws-sdk/client-ec2");
const { DynamoDBClient, GetItemCommand, PutItemCommand } = require("@aws-sdk/client-dynamodb");
const { createReadStream, createWriteStream } = require('fs');
const { pipeline } = require('stream/promises');
const { promisify } = require('util');
const { exec } = require('child_process');
// const { nanoid } = require('nanoid');
const execAsync = promisify(exec);
const { writeFile, appendFile } = require('fs/promises');
const fs = require('fs');
const path = require('path');

const ec2Client = new EC2Client({ region: "us-east-1" });
const dynamoDBClient = new DynamoDBClient({ region: "us-east-1" });
const s3Client = new S3Client({ region: "us-east-1" });

const tableName = 'fovus-app';
const primaryKey = process.argv[2]; // pk passed from CL argument
const s3Bucket = 'fovus-app-file-storage-test'; 
const logFileKey = `cloud-init-output-${primaryKey}.log`;

let nanoid;

async function loadNanoid() {
    const nanoidModule = await import('nanoid');
    nanoid = nanoidModule.nanoid;
}

async function uploadLogToS3(s3Bucket, logFileKey) {
    const logFilePath = '/var/log/cloud-init-output.log';
    try {
        const fileStream = createReadStream(logFilePath);
        const uploadParams = {
            Bucket: s3Bucket,
            Key: logFileKey,
            Body: fileStream,
        };
        await s3Client.send(new PutObjectCommand(uploadParams));
        console.log(`Log file uploaded successfully: ${logFileKey}`);
    } catch (err) {
        console.error("Error uploading log file to S3:", err);
        throw err;
    }
}

async function fetchDynamoDBEntry(primaryKey) {
    const params = {
        TableName: tableName,
        Key: {
            "id": { S: primaryKey }
        }
    };
    
    try {
        const { Item } = await dynamoDBClient.send(new GetItemCommand(params));
        return Item;
    } catch (err) {
        console.error("Error fetching item from DynamoDB:", err);
        throw err;
    }
}

async function fetchFileFromS3(bucketName, fileName) {
    const params = {
        Bucket: bucketName,
        Key: fileName,
    };

    try {
        const { Body } = await s3Client.send(new GetObjectCommand(params));
        await pipeline(Body, createWriteStream(fileName));
        console.log(`File downloaded successfully: ${fileName}`);
    } catch (err) {
        console.error("Error downloading file from S3:", err);
        throw err;
    }
}

async function terminateInstance() {
    const instanceId = await fetchInstanceId();
    const params = {
        InstanceIds: [instanceId],
    };

    try {
        await ec2Client.send(new TerminateInstancesCommand(params));
        console.log(`Instance terminated successfully: ${instanceId}`);
    } catch (err) {
        console.error("Error terminating the EC2 instance:", err);
        throw err;
    }
}

async function fetchInstanceId() {
    try {
        // fetch the token
        const { stdout: token } = await execAsync(`curl -X PUT "http://169.254.169.254/latest/api/token" -H "X-aws-ec2-metadata-token-ttl-seconds: 21600"`);
        // fetch the instance ID using the token
        const { stdout: instanceId } = await execAsync(`curl -H "X-aws-ec2-metadata-token: ${token.trim()}" http://169.254.169.254/latest/meta-data/instance-id`);
        return instanceId.trim();
    } catch (error) {
        console.error("Error fetching the instance ID:", error);
        throw error;
    }
}

async function processFile(inputFileName, textToAppend, outputFileName) {
    // Read the input file content, append text, and write to the output file
    const content = await fs.promises.readFile(inputFileName, 'utf8');
    const newContent = `${content} : ${textToAppend}`;
    await fs.promises.writeFile(outputFileName, newContent);
    console.log(`Content appended and saved to new file: ${outputFileName}`);
}

async function saveOutputFilePathToDynamoDB(outputFilePath) {
    await loadNanoid(); 

    const newPrimaryKey = nanoid();
    const params = {
        TableName: tableName,
        Item: {
            "id": { S: newPrimaryKey },
            "output_file_path": { S: outputFilePath }
        }
    };

    try {
        await dynamoDBClient.send(new PutItemCommand(params));
        console.log(`Saved output file path to DynamoDB with primary key: ${primaryKey}`);
    } catch (err) {
        console.error("Error saving output file path to DynamoDB:", err);
        throw err;
    }
}

async function uploadFileToS3(bucketName, localFilePath) {
    const fileName = path.basename(localFilePath);
    const fileStream = fs.createReadStream(localFilePath);

    const uploadParams = {
        Bucket: bucketName,
        Key: fileName,
        Body: fileStream
    };

    try {
        await s3Client.send(new PutObjectCommand(uploadParams));
        console.log(`File uploaded successfully: s3://${bucketName}/${fileName}`);
    } catch (err) {
        console.error("Error uploading file to S3:", err);
        throw err;
    }
}

async function main() {
    try {
        const entry = await fetchDynamoDBEntry(primaryKey);
        if (!entry || !entry.input_text || !entry.input_text.S || !entry.input_file_path || !entry.input_file_path.S) {
            throw new Error('DynamoDB entry does not have required attributes.');
        }

        // Extract input_text, bucketName, and fileName from DynamoDB entry
        const inputText = entry.input_text.S;
        const [bucketName, inputFileName] = entry.input_file_path.S.split('/');
        const outputFileName = `output_${primaryKey}.txt`;
        const localInputFilePath = `${inputFileName}`;
        const localOutputFilePath = `${outputFileName}`;

        await fetchFileFromS3(bucketName, inputFileName);

        await processFile(localInputFilePath, inputText, localOutputFilePath);

        await uploadFileToS3(bucketName, localOutputFilePath);

        const s3OutputFilePath = `${bucketName}/${outputFileName}`;
        await saveOutputFilePathToDynamoDB(s3OutputFilePath);
    } catch (err) {
        console.error("An error occurred in the script:", err);
    } finally {
        await uploadLogToS3(s3Bucket, logFileKey);
        await terminateInstance();
    }
}

main();
