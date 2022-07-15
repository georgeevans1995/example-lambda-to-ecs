#!/usr/bin/env bash

# Build the 
yarn esbuild src/ecs-handlers/esbuild-example-task.ts --bundle --platform=node --outfile=.esbuild/esbuild-example-task.js

aws ecr get-login-password --region eu-west-2 | docker login --username AWS --password-stdin 865243937210.dkr.ecr.eu-west-2.amazonaws.com

docker build -f ./Dockerfile -t example-lambda-to-ecs-stack-processor-repository .

docker tag example-lambda-to-ecs-stack-processor-repository:latest 865243937210.dkr.ecr.eu-west-2.amazonaws.com/example-lambda-to-ecs-stack-processor-repository:latest

docker push 865243937210.dkr.ecr.eu-west-2.amazonaws.com/example-lambda-to-ecs-stack-processor-repository:latest
