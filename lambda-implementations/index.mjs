import { EC2Client, RunInstancesCommand, CreateKeyPairCommand } from "@aws-sdk/client-ec2";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { DynamoDBClient, GetItemCommand } from "@aws-sdk/client-dynamodb";

const ec2Client = new EC2Client({ region: "us-east-1" });
const s3Client = new S3Client({ region: "us-east-1" });
const dynamoDBClient = new DynamoDBClient({ region: "us-east-1" });

async function createKeyPairAndStoreInS3(keyName, s3Bucket) {
    const createKeyPairCommand = new CreateKeyPairCommand({ KeyName: keyName });
    const keyPair = await ec2Client.send(createKeyPairCommand);
    //  DEBUG: store .pemn in s3 for ssh connections.
    // const putObjectCommand = new PutObjectCommand({
    //     Bucket: s3Bucket,
    //     Key: `${keyName}.pem`,
    //     Body: keyPair.KeyMaterial,
    //     ContentType: 'text/plain',
    //     ACL: 'private'
    // });
    // await s3Client.send(putObjectCommand);
    // console.log(`The key pair was successfully uploaded to s3://${s3Bucket}/${keyName}.pem`);

    return keyName;
}

async function launchInstance(primaryKey, s3Bucket, nodeScriptKey, keyName) {
    const userDataScript = `#!/bin/bash
# install Node.js v20.x
curl -sL https://rpm.nodesource.com/setup_20.x | bash -
yum install -y nodejs

# Download the Node.js project zip from S3 and extract it
aws s3 cp s3://${s3Bucket}/${nodeScriptKey} /home/ec2-user/script.zip
unzip /home/ec2-user/script.zip -d /home/ec2-user/

# Change to the directory where the script is located and execute it
cd /home/ec2-user/
node index.js ${primaryKey} || echo "Node.js script failed to run."

# After the Node.js script finishes, upload the cloud-init-output.log to S3
LOG_FILE="/var/log/cloud-init-output.log"
S3_LOG_PATH="s3://${s3Bucket}/cloud-init-output-${primaryKey}.log"
aws s3 cp $LOG_FILE $S3_LOG_PATH
`;


    const command = new RunInstancesCommand({
        ImageId: "ami-051f8a213df8bc089", // Amazon Linux 2023 AMI ID
        InstanceType: "t2.micro",
        MinCount: 1,
        MaxCount: 1,
        UserData: Buffer.from(userDataScript).toString('base64'),
        KeyName: keyName,
        IamInstanceProfile: {
            Name: "fovus-ec2-role"
        }
    });

    try {
        const data = await ec2Client.send(command);
        console.log("EC2 instance launched successfully:", data);
    } catch (err) {
        console.error("Error launching EC2 instance:", err);
        throw err;
    }
}

async function fetchDynamoDBEntry(primaryKey) {
    const params = {
        TableName: 'fovus-app',
        Key: {
            "id": { S: primaryKey }
        }
    };
    try {
        const { Item } = await dynamoDBClient.send(new GetItemCommand(params));
        return Item;
    } catch (err) {
        console.error("Error fetching item from DynamoDB:", err);
        return null;
    }
}

export const handler = async (event) => {
    // console.log('event is ### ', event);
    try {
        const keyNamePrefix = 'fovus-ec2-keypair';
        const s3Bucket = 'fovus-app-file-storage-test'; 
        const nodeScriptKey = 'script.zip'; 
        
        for (const record of event.Records) {
            // console.log('record is ### ', record);
            if (record.eventName === 'INSERT') {
                 // Fetch the from DynamoDB wit id
                const primaryKey = record.dynamodb.Keys.id.S;
                const item = await fetchDynamoDBEntry(primaryKey);
                if (item && !item.output_file_path){
                    const newKeyName = await createKeyPairAndStoreInS3(`${keyNamePrefix}-${Date.now()}`, s3Bucket);
                    await launchInstance(primaryKey, s3Bucket, nodeScriptKey, newKeyName);
                }
            }
        }
    } catch (error) {
        console.error("Error:", error);
    }
};
