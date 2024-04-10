const { EC2Client, RunInstancesCommand } = require("@aws-sdk/client-ec2");
const ec2Client = new EC2Client({ region: "us-east-1" });

async function launchInstanceWithPrimaryKey(primaryKey) {
    const userDataScript = `#!/bin/bash echo ${primaryKey} > /tmp/primaryKey.txt; curl -H "Content-Type: application/json" -d '{"input_text": "output test from ec2 curl", "input_file": "output_test"}' -X POST https://yl9zletvr9.execute-api.us-east-1.amazonaws.com/dev`;

    const command = new RunInstancesCommand({
        ImageId: "ami-xxxxxxx", // Specify your AMI ID
        InstanceType: "t2.micro",
        MinCount: 1,
        MaxCount: 1,
        UserData: Buffer.from(userDataScript).toString('base64'),
        IamInstanceProfile:{
            Name: "fovus-ec2-role"
        }
    });

    try {
        const data = await ec2Client.send(command);
        console.log("Success", data);
        // Additional code to handle the response
    } catch (err) {
        console.log("Error", err);
    }
}

export const handler = async (event) => {
    try {
        // Iterate over each record in the event
        for (const record of event.Records) {
            if (record.eventName === 'INSERT') {
                // Extract the primary key value from the record
                const primaryKey = record.dynamodb.Keys.id.S;
                // Launch EC2 instance with the extracted primary key
                await launchInstanceWithPrimaryKey(primaryKey);
            }
        }
    } catch (error) {
        console.error("Error:", error);
    }
};

// export const handler = async (event) => {
//     for (const record of event.Records) {
//         if (record.eventName === 'INSERT') {
//             const primaryKey = record.dynamodb.Keys.id.S;
//             await launchInstanceWithPrimaryKey(primaryKey);
//         }
//     }
// };



// import { EC2Client, RunInstancesCommand } from "@aws-sdk/client-ec2";
// import { S3Client, HeadObjectCommand } from "@aws-sdk/client-s3";

// const ec2Client = new EC2Client({ region: "us-east-1" });
// const s3Client = new S3Client({ region: "us-east-1" });

// async function checkS3FileExists(bucketName, fileName) {
//     const params = {
//         Bucket: bucketName,
//         Key: fileName,
//     };
    
//     try {
//         await s3Client.send(new HeadObjectCommand(params));
//         return true; // file found in S3
//     } catch (err) {
//         if (err.name === 'NotFound') {
//             return false; // file not found
//         }
//         throw err;
//     }
// }

// async function launchInstanceWithPrimaryKey(primaryKey, bucketName, fileName) {
//     // Check if the S3 file exists
//     const fileExists = await checkS3FileExists(bucketName, fileName);
//     if (!fileExists) {
//         console.log(`File: ${fileName} not found in bucket: ${bucketName}`);
//         return; // exit if the file does not exist
//     }

//     // If the file exists, proceed with launching the instance
//     const userDataScript = `#!/bin/bash
//     echo ${primaryKey} > /tmp/primaryKey.txt;
//     curl -H "Content-Type: application/json" -d '{"input_text": "output test from ec2 curl", "input_file": "doesNotExist.txt"}' -X POST https://yl9zletvr9.execute-api.us-east-1.amazonaws.com/dev;
//     INSTANCE_ID=$(curl http://169.254.169.254/latest/meta-data/instance-id);
//     aws ec2 terminate-instances --instance-ids $INSTANCE_ID --region us-east-1;
//     `;

//     const command = new RunInstancesCommand({
//         ImageId: "ami-051f8a213df8bc089",
//         InstanceType: "t2.micro",
//         MinCount: 1,
//         MaxCount: 1,
//         UserData: Buffer.from(userDataScript).toString('base64'),
//         IamInstanceProfile:{
//             Name: "fovus-ec2-role"
//         }
//     });

//     try {
//         const data = await ec2Client.send(command);
//         console.log("Success", data);
//     } catch (err) {
//         console.error("Error", err);
//     }
// }

// export const handler = async (event) => {
//     console.log('Received event:', JSON.stringify(event, null, 2));
//     try {
//         for (const record of event.Records) {
//             if (record.eventName === 'INSERT') {
//                 // Extract the input_file
//                 const input_file = record.dynamodb.NewImage.input_file.S;
//                 const [bucketName, fileName] = input_file.split('/');
                
//                 const primaryKey = record.dynamodb.Keys.id.S;

//                 await launchInstanceWithPrimaryKey(primaryKey, bucketName, fileName);
//             }
//         }
//     } catch (error) {
//         console.error("Error:", error);
//     }
// };
