const { ECS } = require("aws-sdk");

/**
 * Basic lambda handler to trigger an ecs task from a lambda
 * 
 * @param {*} event 
 * @param {*} context 
 * @returns 
 */
const handler = async (event, context) => {
	const ecs = new ECS();

	const taskDefinitions = await ecs.listTaskDefinitions({
		familyPrefix: process.env.ECS_TASK_FAMILY,
		maxResults: 1,
		sort: "DESC"
	}).promise();

	if (taskDefinitions.taskDefinitionArns?.length) {
		const latestTask = taskDefinitions.taskDefinitionArns[0];
		
		await ecs.runTask({
			cluster: process.env.ECS_CLUSTER_ARN,
			taskDefinition: latestTask,
			networkConfiguration: {
				awsvpcConfiguration: {
					subnets: process.env.SUBNET_IDS.split(","),
					assignPublicIp: "DISABLED"
				}
			},
			overrides: {
				// can override the cpu and memory here if required.
				// cpu: "",
				// memory: taskRunner.memoryMiB?.toString(),
				containerOverrides: [
					{
						name: process.env.ECS_CONTAINER_NAME,
						// task runtime variables
						environment: [
							{
								name: "EXAMPLE_DYNAMIC_VARIABLE",
								value: "test"
							}
						]
					}
				]
			},
			count: 1,
			launchType: "FARGATE"
		}).promise();

		return;
	}
}

module.exports = { handler };
