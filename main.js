/*
 * https://developers.facebook.com/docs/messenger-platform/getting-started/quick-start/
 *
 * process.env.MY_PAGE_ACCESS_TOKEN
 * process.env.MY_VERIFY_TOKEN
 * 
 */

'use strict';

// Imports dependencies and set up http server
const 
  request = require('request'),
  express = require('express'),
  body_parser = require('body-parser'),
  app = express().use(body_parser.json()); // creates express http server

// for heroku
app.set('port', (process.env.PORT || 5000));
const PAGE_ACCESS_TOKEN = process.env.MY_PAGE_ACCESS_TOKEN;

// test, unrelated to fb
app.get('/', function(request, response) {
  response.status(200).send("Hello world");
});



// Accepts POST requests at /webhook endpoint
app.post('/webhook', function(req, res){ 
	

  
  // Parse the request body from the POST
  let body = req.body;

  // Check the webhook event is from a Page subscription
  if (body.object === 'page') {

    // Iterate over each entry - there may be multiple if batched
    body.entry.forEach(function(entry) {

      // Get the webhook event. entry.messaging is an array, but 
      // will only ever contain one event, so we get index 0
      let webhook_event = entry.messaging[0];
      console.log(webhook_event);
      
      
      
      // Get the sender PSID
      let sender_psid = webhook_event.sender.id;
      console.log('Sender PSID: ' + sender_psid);
      
      // Check if the event is a message or postback and
      // pass the event to the appropriate handler function
      if (webhook_event.message) {
            handleMessage(sender_psid, webhook_event.message);        
      } else { //if (webhook_event.postback) { handlePostback(sender_psid, webhook_event.postback); }
			sendViaAPI(sender_psid, { "text": "?" });
      }
      
      
    });

    // Return a '200 OK' response to all events
    res.status(200).send('EVENT_RECEIVED');

  } else {
    // Return a '404 Not Found' if event is not from a page subscription
    res.sendStatus(404);
  }

});

// Accepts GET requests at the /webhook endpoint
app.get('/webhook', function(req, res){
  // localhost:5000/webhook?hub.mode=subscribe&hub.verify_token=test&hub.challenge=i
  
  /** UPDATE YOUR VERIFY TOKEN **/
  const VERIFY_TOKEN = process.env.MY_VERIFY_TOKEN;
  
  // Parse params from the webhook verification request
  let mode = req.query['hub.mode'];
  let token = req.query['hub.verify_token'];
  let challenge = req.query['hub.challenge'];
   
  
  // Check if a token and mode were sent
  if (mode && token) {
  
    // Check the mode and token sent are correct
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      
      // Respond with 200 OK and challenge token from the request
      console.log('WEBHOOK_VERIFIED');
      res.status(200).send(challenge);
    
    } else {
      // Responds with '403 Forbidden' if verify tokens do not match
      //res.sendStatus(403);  
      res.status(403).send("mismatch!");    
    }
    
  } else { // I added it
	 res.status(403).send("wrong query");
  }  
});




// Handles messages events
function handleMessage(sender_psid, received_message) {

  let response;
  
  // Check if the message contains text
  if (received_message.text) {    
    // Creates the payload for a basic text message, which
    // will be added to the body of our request to the Send API
    response = {
      "text": `You sent the message: "${received_message.text}". `
    }

  }
    
  // Sends the response message
  sendViaAPI(sender_psid, response); 
}

// Handles messaging_postbacks events
function handlePostback(sender_psid, received_postback) {

  // Send the message to acknowledge the postback
  sendViaAPI(sender_psid, { "text": "Thanks!" });
}

// Sends response messages via the Send API
function sendViaAPI(sender_psid, response) {
	

  // Construct the message body
  let request_body = {
    "recipient": {
      "id": sender_psid
    },
    "message": response
  }
  
  
  // Send the HTTP request to the Messenger Platform
  request({
    "uri": "https://graph.facebook.com/v2.6/me/messages",
    "qs": { "access_token": PAGE_ACCESS_TOKEN },
    "method": "POST",
    "json": request_body
  }, (err, res, body) => {
    if (!err) {
      console.log('message sent!')
    } else {
      console.error("Unable to send message:" + err);
    }
  });
  
  //here message is sent
}

// heroku 
app.listen(app.get('port'), function() {
  console.log('Node app is running...');
});

//non heroku init
// app.listen(process.env.PORT || 1337, () => console.log('webhook is listening'));
