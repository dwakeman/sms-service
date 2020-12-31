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

// import dependencies and initialize express
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const log4js = require('log4js');
const appName = require('../package').name;
const appVersion = require('../package').version;
const logger = log4js.getLogger('[APP] ' + appName);
const healthRoutes = require('./routes/health-route');
const swaggerRoutes = require('./routes/swagger-route');
const apiV1Routes = require('./api-v1/routes/api-route');
logger.level = process.env.LOG_LEVEL ? process.env.LOG_LEVEL : 'info';
logger.info('Log level is ' + logger.level);
logger.info('App Version is ' + appVersion);

const app = express();

// enable parsing of http request body
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// routes and api calls
app.use('/health', healthRoutes);
//swagger is now served up from the /api/vi path so that it can be version specific
//app.use('/swagger', swaggerRoutes);
app.use('/api/v1', apiV1Routes);

// default path to serve up index.html (single page application)
app.all('', (req, res) => {
  res.status(200).sendFile(path.join(__dirname, '../public', 'index.html'));
});

// start node server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  logger.info(`App UI available http://localhost:${port}`);
  logger.info(`Swagger UI available http://localhost:${port}/api/v1/api-docs`);
});

// error handler for unmatched routes or api calls
app.use((req, res, next) => {
  res.sendFile(path.join(__dirname, '../public', '404.html'));
});

module.exports = app;
