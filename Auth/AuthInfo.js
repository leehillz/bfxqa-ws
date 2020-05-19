const WebSocket = require('ws');
const fs = require('fs');
const expect = require('chai').expect;
const ws_url = require('../config.json').ws_url
const crypto = require('crypto-js') // Standard JavaScript cryptography library
const apiKey = require('../config.json').api_key
const apiSecret = require('../config.json').api_secret

//Auth
const AuthInfoSocket = new WebSocket(ws_url);
const authNonce = Date.now() * 1000 // Generate an ever increasing, single use value. (a timestamp satisfies this criteria)
const authPayload = 'AUTH' + authNonce // Compile the authentication payload, this is simply the string 'AUTH' prepended to the nonce value
const authSig = crypto.HmacSHA384(authPayload, apiSecret).toString(crypto.enc.Hex) // The authentication payload is hashed using the private key, the resulting hash is output as a hexadecimal string

const payloadAuth = {
    apiKey, //API key
    authSig, //Authentication Sig
    authNonce, 
    authPayload,
    event: 'auth', // The connection event, will always equal 'auth'
}

//Sleep timer
function sleep(milliseconds) {
  const date = Date.now();
  let currentDate = null;
  do {
    currentDate = Date.now();
  } while (currentDate - date < milliseconds);
}

describe('Auth Info Tests (Tests authenticated channels: "ws")', function() {
        it('Auth Info should return a correct ws message', function(done) {

        this.timeout(10000)

        AuthInfoSocket.onopen = function (event) {
            AuthInfoSocket.send(JSON.stringify(payloadAuth))
          };

        AuthInfoSocket.onmessage = function (event) {
            let data = JSON.parse(event.data)
            
            // Target the ws message [0,"ws",[["exchange","USD",512316.64413271693,0,null,"Exchange 0.001 BTC for USD @ 5432.0",{"reason":"TRADE","order_id":1187242504,"order_id_oppo":1187242389,"trade_price":"5432.0","trade_amount":"0.001"}],["exchange","BTC",50241.46782217,0,null,"Trading fees for 0.001 BTC (BTCUSD) @ 5432.0 on BFX (0.2%)",null],["exchange","ETH",25.8997032,0,null,null,null],["exchange","GRG",0.974,0,null,null,null],["exchange","EUR",1502.35914797,0,null,null,null],["exchange","JPY",1336750.01635206,0,null,null,null],["exchange","SAN",4.6e-7,0,null,null,null],["exchange","USDF0",8779.08993704,0,null,null,null],["exchange","UST",24251.00483267,0,null,null,null],["exchange","USTF0",10,0,null,null,null],["exchange","IOT",16538.35443966,0,null,null,null],["funding","BTC",10071.95627575,0,null,null,null],["funding","USD",7512.66470958,0,null,null,null],["funding","XAUT",53.30391187,0,null,null,null],["margin","BTC",5476.36690982,0,null,null,null],["margin","USDF0",574.46716667,0,null,null,null],["margin","USTF0",1050.94362679,0,null,null,null],["margin","USD",2.456224e-8,0,null,null,null]]]      
            if(data[1] == 'ws'){
                expect(data).to.not.be.null
                AuthInfoSocket.close();
                console.log(`ws message:`,JSON.stringify(data))

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //Wallet Type
                expect(data[2][0][0]).to.be.a('string')
                .and.to.match(/(?:exchange|margin|funding)/)

                //Currency 
                expect(data[2][0][1]).to.be.a('string')

                //Balance
                expect(data[2][0][2]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Unsettled Interest
                expect(data[2][0][3]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Balance Available
                expect(data[2][0][4]).to.be.null

                //Description 
                expect(data[2][0][5]).to.satisfy(function (data) {
                    return typeof data === 'string'|| data === null;
                });

                //Meta 
                expect(data[2][0][6]).to.satisfy(function (data) {
                    return typeof data === 'object'|| data === null;
                });
                done()

                } 
            }
        });

    })
