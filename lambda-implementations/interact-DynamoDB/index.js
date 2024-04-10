
// const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
// const { DynamoDBDocumentClient, PutCommand } = require("@aws-sdk/lib-dynamodb");
// const { nanoid } = require("nanoid");
// // Initialize DynamoDB 
// const ddbClient = new DynamoDBClient({ region: "us-east-1" });
// const docClient = DynamoDBDocumentClient.from(ddbClient);

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { nanoid } from "nanoid";
const ddbClient = new DynamoDBClient({ region: "us-east-1" });
const docClient = DynamoDBDocumentClient.from(ddbClient);

// set the DynamoDB table name and S3 bucket name
const TABLE_NAME = "fovus-app";
const BUCKET_NAME = "fovus-app-file-storage-test";

// exports.handler = async (event) => {
async function handler(event) {
  const body = JSON.parse(event.body);
  const inputText = body.input_text;
  const inputFile = body.input_file;

  const id = nanoid();

  // Construct the path to the file stored in S3
  const inputFilePath = `${BUCKET_NAME}/${inputFile}`;

  // create a new item to be inserted into DynamoDB
  const item = {
    id: id,
    input_text: inputText,
    input_file_path: inputFilePath,
  };

  try {
    // insert the new item into the DynamoDB table
    await docClient.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: item,
    }));

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Data stored successfully",
        itemId: id,
      }),
    };
  } catch (err) {
    console.error("Error storing data in DynamoDB", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Error storing data" }),
    };
  }
};
export { handler };