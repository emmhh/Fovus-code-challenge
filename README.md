# Fovus Code Challenge - submission

quick demo link:  https://youtu.be/-PvsZCwobU8?si=_aULqpspwJTybgqM

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


# References
https://github.com/ai/nanoid#readme
https://stackoverflow.com/questions/72597602/nanoid4-in-codecept-error-err-require-esm-require-of-es-module
https://stackoverflow.com/questions/70800567/return-oldm-filename-error-err-require-esm-require-of-es-module
https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c
https://mui.com/material-ui/react-button/#file-upload
https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/ec2-example-creating-an-instance.html
https://www.iguazio.com/docs/latest-release/cluster-mgmt/deployment/cloud/aws/howto/iam-role-n-instance-profile-create/
https://www.youtube.com/watch?v=nlb8yo7SZ2I
https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/setting-up-node-on-ec2-instance.html
https://www.warp.dev/terminus/curl-post-request
https://medium.com/tomincode/launching-ec2-instances-from-lambda-4a96f1264afb
https://medium.com/@chaosgears/dynamodb-streams-handy-and-tricky-as-well-2968b740a9b8#:~:text=yml)%7D%20in%20the%20serverless,yml%20file.&text=You%20probably%20notice%20the%20parameter,old%20images%20of%20the%20item.
https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/terminating-instances.html
https://aws.amazon.com/blogs/security/defense-in-depth-open-firewalls-reverse-proxies-ssrf-vulnerabilities-ec2-instance-metadata-service/
https://www.youtube.com/watch?v=7aGYmQ1xDr0
https://www.youtube.com/watch?v=KmjEU_Ba4yA
https://docs.aws.amazon.com/lambda/latest/dg/with-ddb.html
https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Streams.Lambda.Tutorial2.html
https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Streams.Lambda.Tutorial2.html
https://docs.aws.amazon.com/lambda/latest/dg/invocation-eventfiltering.html
https://www.youtube.com/watch?v=lss7T0R019M
https://www.youtube.com/watch?v=Hg80rQ2eoEI
https://stackoverflow.com/questions/3260739/add-keypair-to-existing-ec2-instance
https://medium.com/@brianhulela/upload-files-to-aws-s3-bucket-from-react-using-pre-signed-urls-543cca728ab8
https://medium.com/p/c75b16604d97
