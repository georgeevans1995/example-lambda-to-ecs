import { Handler, Context } from "aws-lambda";
import { ECS } from "aws-sdk";
import * as moment from "moment";

/**
 * Tidy up hanging jobs
 *
 * @param event
 */

export const handler: Handler = async (event: any, context: Context) => {
  context.callbackWaitsForEmptyEventLoop = false;

  const ecs = new ECS();
  const cluster = process.env.CLUSTER_ARN;
  const tasks = await ecs.listTasks({ cluster }).promise();

  if (!tasks.taskArns || !tasks.taskArns.length) {
    return "No tasks to stop";
  }

  const taskResponse = await ecs.describeTasks({
    cluster,
    tasks: tasks.taskArns
  }).promise();

  let totalStopped = 0;

  if (!taskResponse .tasks) {
    return "No tasks running";
  }

  for (const task of taskResponse?.tasks) {
    if (task.taskArn && task.taskArn) {
      const diff = moment.utc().diff(moment.utc(task.startedAt), "minutes");
      const parts = task.taskArn.split("/");
      const taskId = parts[ parts.length - 1 ];

      // if the task has been running for 60 minutes then somethng probably went wrong so stop it
      // adjust this to match your timescales
      if (diff >= 60) {
        await ecs.stopTask({
          cluster,
          task: taskId,
          reason: "Task running for longer then 1 hour"
        }).promise();
        

        totalStopped++;
      }
    }
  }

  console.log(`${totalStopped} tasks were stopped`);

  return `${totalStopped} tasks were stopped`;
};
