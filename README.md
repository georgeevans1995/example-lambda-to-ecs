# Example Run Lambda like tasks in ECS Fargate 

This repo is to demo how simple it is to use ECS Fargate to replace longer running lambda functions. To read more about this process please read the corresponding blog post.

[https://www.gravitywell.co.uk/insights/using-ecs-tasks-on-aws-fargate-to-replace-lambda-functions/](https://www.gravitywell.co.uk/insights/using-ecs-tasks-on-aws-fargate-to-replace-lambda-functions/)

## Setup this project 
- Find and replace all instances of `ACCOUNT_ID` with your AWS account ID
- `yarn install`

## Testing/running functions locally
For the purpose of this repository, you can test the runtim code by runnign the commands:
- `yarn invoke:js-example` - to run the example Javascript file
- `yarn invoke:ts-example` - to run the example Typescript file with esbuild

## Deploying your infrasctuture
The project uses AWS CDK to provision all the required infrastructure. To deploy the infrastructure run: 
- `yarn cdk deply ExampleLambdaToEcsStack`

## Deploy your code
The deployment of code is separated out so that you can deploy infrastructure and code separately. In the repo there are 2 ways to deploy you code.

To deploy the Javascript handler example run:
- `yarn deploy:js`

To deploy the Typescript handler example run:
- `yarn deploy:ts`


## What isn't in this repo
There is a file name `tidy-up-ecs-tasks.ts`. This is an example of a lambda function that could be used to stop any ECS tasks that have been running too long, too avoid paying huge AWS costs on tasks that do not shut down correctly. This repo does not provide any infrastructure for the lambda function or the event bridge cron schedule.
