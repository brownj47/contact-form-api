import { Stack, StackProps } from "aws-cdk-lib";
import * as sns from "aws-cdk-lib/aws-sns";
import * as subs from "aws-cdk-lib/aws-sns-subscriptions";
import * as apiGateway from "aws-cdk-lib/aws-apigateway";
import * as chatbot from "aws-cdk-lib/aws-chatbot";
import * as lambda from "aws-cdk-lib/aws-lambda";


import 'dotenv/config'

import { Construct } from "constructs";
import { RetentionDays } from "aws-cdk-lib/aws-logs";

export class ContactFormApiStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const contactFormApiTopic = new sns.Topic(this, "ContactFormApiTopic");

    new chatbot.SlackChannelConfiguration(this, "ContactFormSlackChannel", {
      slackChannelConfigurationName: "ContactFormPortfolioSlackChannel",
      slackWorkspaceId: process.env.SLACK_WORKSPACE_ID || "",
      slackChannelId: process.env.CONTACT_FORM_CHANNEL_ID || "",
      notificationTopics: [contactFormApiTopic],
      logRetention: RetentionDays.FIVE_DAYS,
    })

    // make a REST API Gateway
    const contactFormApi = new apiGateway.RestApi(this, "contact-me", {
      restApiName: "Contact Form API",
      description: "This API handles contact form submissions",
    });
    contactFormApi.root.addMethod("POST");
  };

  // hook APIGateway to SNS in Chatbot approved format (may require a lambda)

}
