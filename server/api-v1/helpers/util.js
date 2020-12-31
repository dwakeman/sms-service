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

const querystring = require('querystring');
const https = require('https');
const log4js = require('log4js');
const logger = log4js.getLogger('[APP] sms-service [helpers - util]');
logger.level = process.env.LOG_LEVEL ? process.env.LOG_LEVEL : 'info';
const ibmcloudUrl = process.env.IBMCLOUD_URL ? process.env.IBMCLOUD_URL : 'cloud.ibm.com';
logger.debug('The IBM Cloud URL is ' + ibmcloudUrl);

/**
 * Util object
 */
const util = {};


util.validateInput = function(params) {


    let response = {
        valid: true,
        errors: []
    }

    if (!params.secretId) {
        response.valid = false;
        response.errors.push({
            message: "Access key is missing"
        });
    }

    if (!params.authToken) {
        response.valid = false;
        response.errors.push({
            message: "Auth token is missing"
        });
    }

    if (!params.fromNumber) {
        response.valid = false;
        response.errors.push({
            message: "from phone number is missing"
        });
    }

    if (!params.toNumber) {
        response.valid = false;
        response.errors.push({
            message: "to phone number is missing"
        });
    }

    if (!params.smsMessage) {
        response.valid = false;
        response.errors.push({
            message: "SMS message is missing"
        });
    }

    return response;
}


/**
 * getAuthToken() exchanges an IBM Cloud API Key for an IAM oauth token for authentication to IBM APIs
 * 
 * @param {string} apiKey the API key to be exchanged for the auth token
 * 
 * @returns {object} the object returned from the IAM API
 */
util.getAuthToken = function(apiKey) {
    const logname = '[getAuthToken]';
    logger.trace(`${logname} entering function....`);

    return new Promise ((resolve, reject) => {
        logger.debug(`${logname} exchanging API key for auth token `);
        const formData = querystring.stringify({
            "grant_type": "urn:ibm:params:oauth:grant-type:apikey",
            "apikey": apiKey
        });
    
        const headers = {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    
        const options = {
            hostname: 'iam.' + ibmcloudUrl,
            port: 443,
            path: '/identity/token',
            method: 'POST',
            headers: headers
        }

        const req = https.request(options, (res) => {

            let rawbody = '';

            res.on('data', d => {
                rawbody += d;
            });

            res.on('error', err => {
                logger.debug(`${logname} exiting with error....`);
                reject(err);
            });

            res.on('end', () =>{
                logger.debug(`${logname} exiting with success....`);
                logger.trace(`${logname} The raw body is ` + rawbody);
                body = JSON.parse(rawbody);
                resolve(body);                
            });

        })

        logger.debug(`${logname} writing form data`);
        req.write(formData);
        req.end();

    });
}; //end of function getAuthToken

/**
 * getSecret() retrieves a secret from IBM Secrets Manager
 * 
 * @param {string} region - The IBM Cloud region in which Secrets Manager is provisioned (i.e. 'us-south')
 * @param {string} instanceId - The GUID of the Secrets Manager instance
 * @param {string} token - The IAM Token to be used as the bearer token in the Authorization header
 * @param {string} secretId - The GUID of the secret to be retrieved
 * 
 * @returns {object} the JSON object returned by the Secrets Manager API - https://cloud.ibm.com/apidocs/secrets-manager#get-secret
 */
util.getSecret = function(region, instanceId, authToken, secretId) {

    const logname = '[getSecret]';
    logger.trace(`${logname} entering function....`);
    const headers = {
        'Accept': 'application/json',
        'Authorization': 'Bearer ' + authToken
    }

    logger.trace(`${logname} the headers are ` + JSON.stringify(headers));
//    const secretMgrUrl = 'https://'+ instanceId + '.' + region  + '.secrets-manager.appdomain.cloud';
    const secretMgrUrl = instanceId + '.' + region  + '.secrets-manager.appdomain.cloud';
    const secretMgrPath = '/api/v1/secrets/arbitrary/' + secretId;

    logger.debug(`${logname} the secretMgrUrl is ` + secretMgrUrl);
    logger.debug(`${logname} the path is ` + secretMgrPath);
    
    const options = {
        hostname: secretMgrUrl ,
        port: 443,
        path: secretMgrPath,
        method: 'GET',
        headers: headers
    }

    return new Promise ((resolve, reject) => {
        logger.debug(`${logname} In the promise `);
        const req = https.request(options, (res) =>{
            logger.debug(`${logname} statusCode: ` + res.statusCode);
            let rawbody = '';

            res.on('data', d => {
                rawbody += d;
            });

            res.on('error', err => {
                logger.debug(`${logname} exiting with error....`);
                reject(err)
            });

            res.on('end', () =>{
                logger.trace(`${logname} exiting with success....`);
                logger.debug(`${logname} The raw body is ` + rawbody);
                body = JSON.parse(rawbody);
                resolve({
                    statusCode: res.statusCode,
                    body: body
                })                
            })

        });

        req.end();
    });

}; // end of function getSecret

module.exports = util;

