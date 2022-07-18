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

	await ecs.runTask({
		cluster: process.env.ECS_CLUSTER_ARN,
		taskDefinition: process.env.ECS_TASK_ARN,
		networkConfiguration: {
			awsvpcConfiguration: {
				subnets: process.env.SUBNET_IDS.split(","),
				assignPublicIp: "DISABLED"
			}
		},
		overrides: {
			// can override the cpu and memory here if required.
			// cpu: "",
			// memory: "",
			
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

module.exports = { handler };
