import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import {
  aws_ecs as ecs,
  aws_ec2 as ec2,
  aws_iam as iam,
  aws_ecr,
  aws_cloudwatch,
  aws_cloudwatch_actions,
  Duration,
  aws_sns,
  aws_sns_subscriptions,
  aws_lambda
} from "aws-cdk-lib";
import { Secret } from 'aws-cdk-lib/aws-secretsmanager';
export class ExampleLambdaToEcsStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // vpc with 2 availability zones
    const vpc = new ec2.Vpc(this, "VPC", {
      natGateways: 2,
      maxAzs: 2
    });

    // Repository for storing docker images
    const ecsRepo = new aws_ecr.Repository(this, "ECRRepo", {
      repositoryName: `${props?.stackName}-processor-repository`,
      lifecycleRules: [{ maxImageCount: 5 }] // no need to store lots of old images
    });

    // ECS cluster to deploy tasks to
    const cluster = new ecs.Cluster(scope, "ECSCluster", {
      clusterName: `${props?.stackName}-cluster`,
      vpc,
      containerInsights: true // allow metrics to show up in cloudwath
    });

    // ecs task for defining config 
    const ECSTaskRunner = new ecs.TaskDefinition(this, `ECSTaskDef`, {
      family: `${props?.stackName}-task-definition`,
      compatibility: ecs.Compatibility.FARGATE,
      // provide the memory and cpu needed for the task
      cpu: "1024",
      memoryMiB: "2048"
    });

    // add any permissions/policies that your task may need e.g "s3:PutObject"
    ECSTaskRunner.addToTaskRolePolicy(new iam.PolicyStatement({
      actions: ["ecs:StartTelemetrySession"] as string[],
      effect: iam.Effect.ALLOW,
      resources: ["*"]
    }));

    // attach the docker container to the task
    ECSTaskRunner.addContainer(`ECSContainer`, {
      containerName: `${props?.stackName}-container`,
      image: ecs.ContainerImage.fromEcrRepository(ecsRepo, "latest"), // pull the latest image from the ecs repository
      environment: {
        NORMAL_ENV_VAR: "example"
      },
      secrets: {
        EXAMPLE_PASSWORD_ENVIRONMENT_VALUE: ecs.Secret.fromSecretsManager(Secret.fromSecretCompleteArn(this, "Secret", "<secret-arn-here>"), "password")
      },
      logging: ecs.LogDriver.awsLogs({ streamPrefix: `${props?.stackName}-container-logs` })
    });

    //BONUS: add some alarms to keep track of memory and cpu usage
    const topic = new aws_sns.Topic(this, "Alarm topic", { displayName: `${props?.stackName}-ecs-alarm-topic` });

    // get an email if youre alarms are triggered
    topic.addSubscription(
      new aws_sns_subscriptions.EmailSubscription("<email_address_here>")
    );

    // Use some maths to compare the total provisioned cpu vs the used cpu 
    const cpuPercentUsed = new aws_cloudwatch.MathExpression({
      expression: "utilized / reserved",
      usingMetrics: {
        utilized: new aws_cloudwatch.Metric({
          namespace: "ECS/ContainerInsights",
          metricName: "CpuUtilized",
          statistic: "Average",
          period: Duration.minutes(2),
          dimensionsMap: { ClusterName: cluster.clusterName }
        }),
        reserved: new aws_cloudwatch.Metric({
          namespace: "ECS/ContainerInsights",
          metricName: "CpuReserved",
          statistic: "Average",
          period: Duration.minutes(2),
          dimensionsMap: { ClusterName: cluster.clusterName }
        })
      }
    });

    const CPUHigh = new aws_cloudwatch.Alarm(this, "CPUHigh", {
      metric: cpuPercentUsed,
      threshold: 0.9, // = 90%
      evaluationPeriods: 1,
      comparisonOperator: aws_cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD
    });

    // Use some maths to compare the total provisioned memory vs the used memory 
    const memoryPercentUsed = new aws_cloudwatch.MathExpression({
      expression: "utilized / reserved",
      usingMetrics: {
        utilized: new aws_cloudwatch.Metric({
          namespace: "ECS/ContainerInsights",
          metricName: "MemoryUtilized",
          statistic: "Average",
          period: Duration.minutes(1),
          dimensionsMap: { ClusterName: cluster.clusterName }
        }),
        reserved: new aws_cloudwatch.Metric({
          namespace: "ECS/ContainerInsights",
          metricName: "MemoryReserved",
          statistic: "Average",
          period: Duration.minutes(1),
          dimensionsMap: { ClusterName: cluster.clusterName }
        })
      }
    });

    const MemoryUtilHigh = new aws_cloudwatch.Alarm(this, "MemoryUtilHigh", {
      metric: memoryPercentUsed,
      threshold: 0.9, // = 90%
      evaluationPeriods: 1,
      comparisonOperator: aws_cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD
    });
    
    // attach the alarms to SNS so they trigger the emails
    MemoryUtilHigh.addAlarmAction(new aws_cloudwatch_actions.SnsAction(topic));
    CPUHigh.addAlarmAction(new aws_cloudwatch_actions.SnsAction(topic));

  }
}
