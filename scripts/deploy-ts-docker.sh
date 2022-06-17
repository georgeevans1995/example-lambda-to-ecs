#!/usr/bin/env bash

# Build the 
yarn esbuild src/esbuild-example-task.ts --bundle --platform=node --outfile=.esbuild/esbuild-example-task.js

aws ecr get-login-password --region eu-west-2 | docker login --username AWS --password-stdin ACCOUNT_ID.dkr.ecr.eu-west-2.amazonaws.com

docker build -f ./infrastructure/ecs/Dockerfile -t ecs-lambda-stack-processor-repository .

docker tag ecs-lambda-stack-processor-repository:latest ACCOUNT_ID.dkr.ecr.eu-west-2.amazonaws.com/ecs-lambda-stack-processor-repository:latest

docker push ACCOUNT_ID.dkr.ecr.eu-west-2.amazonaws.com/ecs-lambda-stack-processor-repository:latest
