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
const logger = log4js.getLogger('sms-service [api-v1-controller]');
logger.level = process.env.LOG_LEVEL ? process.env.LOG_LEVEL : 'info';
const util = require('../helpers/util');

/**
 * Controller object
 */
const api = {};

// send Messages
api.postMessages = async (req, res) => {
 
    const logname = '[postMessages]';
    logger.debug(`${logname} entering function...`);
    logger.trace(`${logname} The request body: ` + JSON.stringify(req.body));

    //this will be the response object send back to the caller.
    let response = {};
   
    //Need to get the API Key
    const iamApiKey = process.env.IAM_API_KEY;
    if (!iamApiKey) {
        response.body = {
            message: 'Error:  There is no IAM API Key provided'
        }
        res.status(400).json(response);
        return;
    }

    //Get the Secrets Manager Instance ID
    const secretsMgrId = process.env.SECRETS_MGR_GUID
    if (!secretsMgrId) {
        response.body = {
            message: 'Error:  There is no Secrets Manager Instance ID provided'
        }
        res.status(400).json(response);
        return;
    }

    //need to get the parameters
    const secretId = req.body.access_key;
    const authToken = req.body.auth_token;
    const toNumber = req.body.to;
    const smsMessage = req.body.message;

    //This is temporary code to test the function
    response.body = {
        secretId: secretId,
        authToken: authToken,
        to: toNumber,
        msg: smsMessage
    }

    //Get the IAM Auth Token
    let iamToken = await util.getAuthToken(iamApiKey);
    logger.trace(`${logname} The IAM Auth Token is ` + iamToken.access_token);


    //Get the secret
    const secret = await util.getSecret('us-south', secretsMgrId, iamToken.access_token, secretId);
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

    if ( authToken != secretAuthToken) {
        response.body = {
            message: 'Access Forbidden:  The provided Auth Token is not valid',
        }
        res.status(403).json(response);
        return;
    }

    //At this point the Secret has been retrieved and the Auth Token in the secret matches the one provided
    //Time to send the SMS message!!

    //Everything seems good.  For debugging purposes I am adding the secret to the payload
//    response.secret = secret;

    //Use this format to send back a response with a non-200 status.
    res.status(200).json(response);
    logger.debug(`${logname} exiting function...`);
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

