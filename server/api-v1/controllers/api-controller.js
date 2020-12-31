/**
 * Copyright 2020 IBM Corp. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an 'AS IS' BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

const log4js = require('log4js');
const logger = log4js.getLogger('[APP] sms-service [api-v1-controller]');
logger.level = process.env.LOG_LEVEL ? process.env.LOG_LEVEL : 'info';
const util = require('../helpers/util');

/**
 * Controller object
 */
const api = {};

api.postMessages = async (req, res) => {

    const logname = '[postMessages]';
    logger.debug(`${logname} entering function...`);
    logger.trace(`${logname} The request body: ` + JSON.stringify(req.body));

    // this will be the response object send back to the caller.
    let response = {};
   
    // Need to get the API Key
    const iamApiKey = process.env.IAM_API_KEY;
    if (!iamApiKey) {
        response.body = {
            message: 'Error:  There is no IAM API Key configured'
        }
        res.status(502).json(response);
        return;
    }

    //Get the Secrets Manager Instance ID
    const secretsMgrId = process.env.SECRETS_MGR_GUID
    if (!secretsMgrId) {
        response.body = {
            message: 'Error:  There is no Secrets Manager Instance ID configured'
        }
        res.status(502).json(response);
        return;
    }

    let params = {};
    //need to get the parameters
    params.secretId = req.body.access_key;
    params.authToken = req.body.auth_token;
    params.fromNumber = req.body.from;
    params.toNumber = req.body.to;
    params.smsMessage = req.body.message;

    // validate the input parameters
    // a response will come back from the validation function.  It should have a list of messages
    // to send back to the caller.  The list should be returned along with a 400 statusCode
    const validation = util.validateInput(params);
    logger.debug(`${logname} The validation response is ` + JSON.stringify(validation));

    if (!validation.valid) {
        response.body = {
            errors: validation.errors
        };

        res.status(400).json(response);
        return;

    }

    //Get the IAM Auth Token
    let iamToken = await util.getAuthToken(iamApiKey);
    logger.trace(`${logname} The IAM Auth Token is ` + iamToken.access_token);

    //Get the secret
    const secret = await util.getSecret('us-south', secretsMgrId, iamToken.access_token, params.secretId);
    logger.debug(`${logname} The secret is ` + JSON.stringify(secret));

    // a non-200 means the secret was not found or there was a problem accessing Secrets Manager
    if ( secret.statusCode != 200) {
        response.body = {
            message: 'Access Forbidden:  The provided Access Key was not found',
            statusCode: secret.statusCode
        }
        res.status(403).json(response);
        return;
    }

    // Verify that the auth_token provided matches the authToken in the secret
    secretAuthToken = JSON.parse(secret.body.resources[0].secret_data.payload).authToken;
    logger.debug(`${logname} The authToken in the secret is ` + secretAuthToken);

    if ( params.authToken != secretAuthToken) {
        response.body = {
            message: 'Access Forbidden:  The provided Auth Token is not valid',
        }
        res.status(403).json(response);
        return;
    }

    // Verify that the auth_token provided is authorized to send SMS messages
    let authorizedForSms = JSON.parse(secret.body.resources[0].secret_data.payload).sendSmsMessages;
    logger.debug(`${logname} The value of authorizedForSms is ` + authorizedForSms);

    if ( !authorizedForSms) {
        response.body = {
            message: 'Access Forbidden:  The provided Auth Token is not permitted to send SMS messages',
        }
        res.status(403).json(response);
        return;
    }

    // At this point the Secret has been retrieved, the Auth Token in the secret matches 
    // the one provided and is authorized to send SMS messages
    // Time to send the SMS message!!

    const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
    const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;

    // validate that we have Twilio credentials
    if (!twilioAccountSid) {
        response.body = {
            message: 'Error:  There is no Twilio Account SID configured'
        }
        res.status(502).json(response);
        return;
    }

    if (!twilioAuthToken) {
        response.body = {
            message: 'Error:  There is no Twilio Auth Token configured'
        }
        res.status(502).json(response);
        return;
    }

    const client = require('twilio')(twilioAccountSid,twilioAuthToken);
    logger.debug(`${logname} Calling Twilio to send message...`);
    client.messages
        .create({
            body: params.smsMessage,
            from: params.fromNumber,
            to: params.toNumber
        })
        .then(message => {
            logger.info(`${logname} the response from Twilio is ` + JSON.stringify(message));
            response.status = 'Message sent';
            response.message = message.body;
            response.from = message.from;
            response.to = message.to;
            response.dateCreated = message.dateCreated;
            res.status(200).json(response);
            logger.debug(`${logname} exiting function...`);
        });    
    };


// get Messages - This method doesn't make any sense from an api perspective, but demonstrates how it would work
api.getMessages = async (req, res) => {
    const logname = '[postMessages]';
    logger.debug(`${logname} entering function...`);
    res.json({
      messages: [
          {
            msg: "this is the first message"
          },
          {
            msg: "this is the second message"
          },
          {
            msg: "this is the third message"
          }          
      ]
    });
    logger.debug(`${logname} exiting function...`);
};

module.exports = api;

