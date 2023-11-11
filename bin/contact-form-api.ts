#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { ContactFormApiStack } from '../lib/contact-form-api-stack';

const app = new cdk.App();
new ContactFormApiStack(app, 'ContactFormApiStack');
