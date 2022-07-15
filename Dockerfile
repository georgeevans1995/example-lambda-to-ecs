FROM --platform=linux/amd64 node:14

RUN mkdir -p /var/task
WORKDIR /var/task

COPY src/ecs-handlers/example-task.js handler.js
# For esbuild use line below
# COPY .esbuild/esbuild-example-task.js handler.js

CMD ["node", "handler.js" ] 
