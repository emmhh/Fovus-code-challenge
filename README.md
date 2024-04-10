# Fovus Code Challenge - submission

Please forgive me for not adding .gitignore :D

## Description
Full stack project 
- front-end uploads a form (text and file input) to S3 bucket (private, upload through presigned URL),
- with API gateway and AWS Lambda as api endpoint, stores text inpout and file path in dynamoDB
- There is also another lambda function that gets triggered when theres new entry created in DynamoDB:
    - when triggered: create a new ec2 instance, run scripts to set up environment, load scripts from S3 bucket and execute.
    - the script will perform a few tasks while running in ec2 instance (with a give primary id)
      - fetch stored file_path and text_input from dynamoDB based on primary id
      - fetch file based on file_path
      - append text_input to the end of downloaded file seperated by " : "
      - store file to s3
      - store path to dynamoDB
      - utilise filters in trigger to avoid activating trigger when storing output files.
    - the script will terminate the ec2 instance when tasks finishes

## Getting Started

### AWS
- Have aws-cli installed to start with `aws-cli/2.13.15`. \

In the folder `lambda-implementations` includes the code of all lambda functions implemented.

#### GET presigned URL to upload file to private S3 Bucket
- configure your aws-cli profile. 
- go to each lambda functions folder and deploy through aws-cli
```bash
cd lambda-implementations/presigned-url
npm install
zip -r deploy.zip ./
aws lambda create-function --function-name presigned-url --zip-file fileb://deploy.zip --handler index.handler --runtime nodejs20.x --role [arn of your role]
```
After all lambda functions are deployed, go to API Gateway create RESTFUL API , Get method , create new stage and deploy.

#### POST text_input, file_path to DynamoDB

- create DynamoDB table with your preferred name in aws cloud console
```bash
cd lambda-implementations/interact-DynamoDB
npm install
zip -r deploy.zip ./
aws lambda create-function --function-name interact-DynamoDB --zip-file fileb://deploy.zip --handler index.handler --runtime nodejs20.x --role [arn of your role]
```
- create API gateway RESTFUL API POST method and connect with lambda function
- test with postman

#### DynamoDB Trigger - activate on "INSERT" event.
create new lambda function in cloud, past the code in lambda-implementations/index.mjs and deploy. Add trigger in the cloud console to listen to dynamoDB data stream. this script prepares the ec2 instance, pass in the parameter, and run the scripts. It also catches the log file just for debugging, i.e. just in case when scripts in ec2 failed before storing log file.
another debug option is to save the .pem to s3 when creating the instance, but this is not the best practices, should be avoided.

#### upload scripts to S3 for ec2 instance

```bash
cd scripts-in-ec2
zip -r deploy.zip ./
aws s3 cp script.zip s3://fovus-app-file-storage-test/script.zip
```

after all connected and working, upload a file and text input from front end would trigger all lambda functions, and there will be instances triggered and terminated, resultting in a output file in S3 and output_file_path in dynamoDB. The id of all dynamoDB are managed with `"nanoid": "^5.0.7"`

### specs quick peak

```bash
node.js v20.10.0
AWS CDK v3 JS
"@aws-sdk/client-dynamodb": "^3.549.0",
"@aws-sdk/client-ec2": "^3.549.0",
"@aws-sdk/client-s3": "^3.550.0",
"nanoid": "^5.0.7",
"@emotion/react": "^11.11.4",
"@emotion/styled": "^11.11.5",
"@mui/material": "^5.15.15",
"next": "14.1.4",
"react": "^18",
"react-dom": "^18",
ami-051f8a213df8bc089 (Amazon Linux 2023)
```
