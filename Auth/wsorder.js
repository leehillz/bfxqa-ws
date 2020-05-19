const crypto = require('crypto-js') // Standard JavaScript cryptography library
const WebSocket = require('ws') // Websocket library for Node
const apiKey = 'IpV40jhfSBadLxCKJt8xc27qIdGLhOx4sue7lTMLv8t' // Users API credentials are defined here
const apiSecret = 'e4ZljFVxj4BJxiDhuifCsjVPEptFDLTM3mEu7EFpEw3'
const authNonce = Date.now() * 1000 // Generate an ever increasing, single use value. (a timestamp satisfies this criteria)
const authPayload = 'AUTH' + authNonce // Compile the authentication payload, this is simply the string 'AUTH' prepended to the nonce value
const authSig = crypto.HmacSHA384(authPayload, apiSecret).toString(crypto.enc.Hex) // The authentication payload is hashed using the private key, the resulting hash is output as a hexadecimal string
const payload = {
  apiKey, //API key
  authSig, //Authentication Sig
  authNonce, 
  authPayload,
  event: 'auth', // The connection event, will always equal 'auth'
}

function sleep(milliseconds) {
  const date = Date.now();
  let currentDate = null;
  do {
    currentDate = Date.now();
  } while (currentDate - date < milliseconds);
}

const wss = new WebSocket('wss://test.bitfinex.com/ws/2')

wss.onopen = function (event) {
            let inputPayload = JSON.stringify([
                0,
                "on",
                null,
                {
                "type": "LIMIT",
                "symbol": "tETHUSD",
                "amount": "-0.2",
                "price": "200"
                }
                ])
            wss.send(JSON.stringify(payload))
            sleep(1000);
            wss.send(inputPayload);
          };


// const wss = new WebSocket('wss://test.bitfinex.com/ws/2') // Create new Websocket
// wss.on('open', () => wss.send(JSON.stringify(payload)))
// sleep(1000);
// wss.send([0, 'on', null, inputDetails])

// const inputPayload = [0, 'on', null, inputDetails] // Note how the payload is constructed here. It consists of an array starting with the CHANNEL_ID, TYPE, and PLACEHOLDER and is followed by the inputDetails object.
//Websocket Listener
wss.on('message', (msg) => {     // The 'message' event is called whenever the ws recieves ANY message
  // let response = JSON.parse(msg)
  // if (response.event === 'auth') {
  //   wss.send(JSON.stringify(inputPayload));// Submit payload for input
  // }
  console.log(msg); // ALL ws receipts will be logged to console
})