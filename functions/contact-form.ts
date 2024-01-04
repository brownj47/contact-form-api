import { env } from "node:process"
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { SNSClient, PublishCommand, PublishCommandInput } from "@aws-sdk/client-sns";

const snsClient = new SNSClient({ region: "us-east-2" });

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    console.log("request:", JSON.stringify(event, undefined, 2));

    // send a message to the SNS topic
    // The message must follow a certain format in order to be passed along to the Slack channel through Chatbot.
    // https://docs.aws.amazon.com/chatbot/latest/adminguide/custom-notifs.html#sample-custom-notifs

    const body = event.body || ""
    const { name, email, message } = JSON.parse(body)
    const title = ":boom: Contact Form Submission :boom:"
    let messageToSlack = `${name} sent a message: \n`
    messageToSlack += `\`\`\`${message}\`\`\`\n`
    messageToSlack += `Email them back at ${email}`

    const customNotification = {
        "version": "1.0",
        "source": "custom",
        "content": {
            title,
            "description": messageToSlack,
        }
    }

    const publishCommandInput: PublishCommandInput = {
        TopicArn: env.SNS_TOPIC_ARN || "",
        Message: JSON.stringify(customNotification),
    }

    const publishCommandOutput = await snsClient.send(new PublishCommand(publishCommandInput));
    console.log("publishCommandOutput:", JSON.stringify(publishCommandOutput));

    /* https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html#api-gateway-simple-proxy-for-lambda-output-format
        {
        "isBase64Encoded": true|false,
        "statusCode": httpStatusCode,
        "headers": { "headerName": "headerValue", ... },
        "multiValueHeaders": { "headerName": ["headerValue", "headerValue2", ...], ... },
        "body": "..."
        }
    */

    const response = {
        "isBase64Encoded": false,
        "statusCode": 200,
        "headers": {
            // https://docs.aws.amazon.com/apigateway/latest/developerguide/how-to-cors.html#apigateway-enable-cors-proxy
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "https://brownj47.github.io",
            "Access-Control-Allow-Headers": "*",
            "Access-Control-Allow-Methods": "*",
        },
        "body": JSON.stringify({
            message: "Your message has been sent!",
        }),

    };

    return response;
};