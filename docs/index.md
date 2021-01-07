# Overview

This is the documentation for Dave's SMS Service.  It is a simple UI and API for sending SMS messages via Twilio.  Sending messages with Twilio requires a Twilio account and phone number.  Accounts are identified by an Account SID and authorization is granted by an auth token provided by Twilio.  The Acccount SID and auth token need to be passed to the Twilio API.

The goal of the service it to allow people without a Twilio account or any knowledge of how to use it to send messages using this application's straightforward (and simplified) API.  To prevent unwanted use or abuse of the Twilio account used by this service some sort of independent authorization scheme is required.

Perhaps the easiest way to implement authorization would be to establish new credentials and authorizations that are validated by the application before sending the message.  These credentials would be issued to each developer or application that wants to use this service, and the credentials would be provided by the application calling the API.

# Design

The application is written as a Node.js application.  The application will contain a very simple UI for demo purposes, but the primary function of the appliction will be to implement the API.  The application will be containerized, which means it can be deployed to any platform that supports containers, such as [OpenShift on IBM Cloud](https://cloud.ibm.com/kubernetes/overview?platformType=openshift) or [IBM Code Engine](https://cloud.ibm.com/codeengine/overview).

