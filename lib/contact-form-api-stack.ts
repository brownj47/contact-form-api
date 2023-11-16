import { Stack, StackProps } from "aws-cdk-lib";
import * as sns from "aws-cdk-lib/aws-sns";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as chatbot from "aws-cdk-lib/aws-chatbot";
import * as lambdaNodejs from "aws-cdk-lib/aws-lambda-nodejs";
import { Runtime } from "aws-cdk-lib/aws-lambda";


import "dotenv/config"

import { Construct } from "constructs";
import { RetentionDays } from "aws-cdk-lib/aws-logs";

export class ContactFormApiStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const contactFormApiTopic = new sns.Topic(this, "ContactFormApiTopic");

    new chatbot.SlackChannelConfiguration(this, "ContactFormPortfolioSlackChannel", {
      slackChannelConfigurationName: "ContactFormPortfolioSlackChannel",
      slackWorkspaceId: process.env.SLACK_WORKSPACE_ID || "",
      slackChannelId: process.env.CONTACT_FORM_CHANNEL_ID || "",
      notificationTopics: [contactFormApiTopic],
      logRetention: RetentionDays.FIVE_DAYS,
    })

    const contactFormLambda = new lambdaNodejs.NodejsFunction(this, "ContactFormLambda", {
      functionName: "ContactFormLambda",
      entry: "functions/contact-form.ts",
      runtime: Runtime.NODEJS_18_X,
      logRetention: RetentionDays.FIVE_DAYS,
      environment: {
        SNS_TOPIC_ARN: contactFormApiTopic.topicArn,
      },
    });

    contactFormApiTopic.grantPublish(contactFormLambda);

    const contactFormApi = new apigateway.RestApi(this, "ContactFormApi", {
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        disableCache: true,
      },
      apiKeySourceType: apigateway.ApiKeySourceType.HEADER,
    }
    );

    const contactFormLambdaIntegration = new apigateway.LambdaIntegration(contactFormLambda);

    contactFormApi.root.addMethod("POST", contactFormLambdaIntegration, {
      apiKeyRequired: true,
    });

    const contactFormApiUsagePlan = contactFormApi.addUsagePlan("ContactFormApiUsagePlan", {
      throttle: {
        rateLimit: 10,
        burstLimit: 2,
      },
      quota: {
        limit: 1000,
        period: apigateway.Period.MONTH,
      },
      apiStages: [
        {
          api: contactFormApi,
          stage: contactFormApi.deploymentStage,
        }
      ]
    });

    const contactFormApiKey = contactFormApi.addApiKey("ContactFormApiKey");

    contactFormApiUsagePlan.addApiKey(contactFormApiKey);

  };
}
