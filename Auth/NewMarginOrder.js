const WebSocket = require('ws');
const fs = require('fs');
const expect = require('chai').expect;
const ws_url = require('../config.json').ws_url
const crypto = require('crypto-js') // Standard JavaScript cryptography library
const apiKey = require('../config.json').api_key
const apiSecret = require('../config.json').api_secret

//Auth
const NewMarginOrderSocket = new WebSocket(ws_url);
const authNonce = Date.now() * 1000 // Generate an ever increasing, single use value. (a timestamp satisfies this criteria)
const authPayload = 'AUTH' + authNonce // Compile the authentication payload, this is simply the string 'AUTH' prepended to the nonce value
const authSig = crypto.HmacSHA384(authPayload, apiSecret).toString(crypto.enc.Hex) // The authentication payload is hashed using the private key, the resulting hash is output as a hexadecimal string

const payloadAuth = {
    apiKey, //API key
    authSig, //Authentication Sig
    authNonce, 
    authPayload,
    event: 'auth', // The connection event, will always equal 'auth'
    //dms: 4, // Optional Deam-Man-Switch flag to cancel all orders when socket is closed
    //filter: [] // Optional filter for the account info received (default = everything)
}

//Settings
const symbol = 'tBTCUSD'
const symbolFirst = symbol.substr(1,3)
const buyAmount = 0.001
const sellAmount = -0.001
const buyPrice = 1
const sellPrice = 20000

//Sleep timer
function sleep(milliseconds) {
  const date = Date.now();
  let currentDate = null;
  do {
    currentDate = Date.now();
  } while (currentDate - date < milliseconds);
}

describe('New Order Tests', function() {
        it('New Limit Buy Order should return a correct Notification and Order Info message', function(done) {

        this.timeout(10000)

        NewMarginOrderSocket.onopen = function (event) {
            let payload = JSON.stringify([
                0,
                "on",
                null,
                {
                "type": "LIMIT",
                "symbol": symbol,
                "amount": buyAmount.toString(),
                "price": buyPrice.toString()
                }
                ])
            NewMarginOrderSocket.send(JSON.stringify(payloadAuth))
            sleep(1000);
            NewMarginOrderSocket.send(payload);
          };

        NewMarginOrderSocket.onmessage = function (event) {
            let data = JSON.parse(event.data)
            
            // Target the n message [0,"n",[1588148817.151,"on-req",null,null,[1187238099,null,1588148817151,"tBTCUSD",1588148817151,1588148817151,1,1,"LIMIT",null,null,null,0,"ACTIVE",null,null,500,0,0,0,null,null,null,0,null,null,null,null,"BFX",null,null,null],null,"SUCCESS","Submitting limit buy order for 1 BTC."]]]        

            if(data[1] == 'n'){
                expect(data).to.not.be.null

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //MTS Timestamp of Notification
                expect(data[2][0]).to.be.a('number')
                expect(data[2][0]).to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Type 
                expect(data[2][1]).to.be.a('string')
                expect(data[2][1]).to.equal('on-req')

                //Message ID
                expect(data[2][2]).to.be.a('null')

                //Placeholder
                expect(data[2][3]).to.be.a('null')

                //Notify Info
                expect(data[2][4]).to.be.a('Array')

                //Code
                expect(data[2][5]).to.be.a('null')

                //Status
                expect(data[2][6]).to.be.a('string')
                expect(data[2][6]).to.equal('SUCCESS')

                //Text
                expect(data[2][7]).to.be.a('string')
                expect(data[2][7]).to.equal('Submitting limit buy order for '+buyAmount+' '+symbolFirst+'.')

                //Order ID
                expect(data[2][4][0]).to.be.a('number')
                expect(data[2][4][0]).to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //GID
                expect(data[2][4][1]).to.be.a('null')

                //CID
                expect(data[2][4][2]).to.be.a('number')
                expect(data[2][4][2]).to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Symbol
                expect(data[2][4][3]).to.be.a('string')
                expect(data[2][4][3]).to.equal(symbol)

                //MTS Create
                expect(data[2][4][4]).to.be.a('number')
                expect(data[2][4][4]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][4][4]).to.match(/^(\d{13})?$/)

                //MTS Update
                expect(data[2][4][5]).to.be.a('number')
                expect(data[2][4][5]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][4][5]).to.match(/^(\d{13})?$/)
                expect(data[2][4][5]).to.equal(data[2][4][4])

                //Amount
                expect(data[2][4][6]).to.be.a('number')
                expect(data[2][4][6]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][4][6]).to.equal(buyAmount)

                //Amount Orig
                expect(data[2][4][7]).to.be.a('number')
                expect(data[2][4][7]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][4][7]).to.equal(buyAmount)

                //Order Type
                expect(data[2][4][8]).to.be.a('string')
                expect(data[2][4][8]).to.equal('LIMIT')

                //Order Type Previous
                expect(data[2][4][9]).to.be.a('null')

                //MTS TIF
                expect(data[2][4][10]).to.be.a('null')

                //Placeholder
                expect(data[2][4][11]).to.be.a('null')

                //Flags
                expect(data[2][4][12]).to.be.a('number')
                expect(data[2][4][12]).to.equal(0)

                //Flags
                expect(data[2][4][13]).to.be.a('String')
                expect(data[2][4][13]).to.equal('ACTIVE')

                //Placeholder
                expect(data[2][4][14]).to.be.a('null')

                //Placeholder
                expect(data[2][4][15]).to.be.a('null')

                //Price
                expect(data[2][4][16]).to.be.a('number')
                expect(data[2][4][16]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][4][16]).to.equal(buyPrice)

                //Price Average
                expect(data[2][4][17]).to.be.a('number')
                expect(data[2][4][17]).to.equal(0)

                //Price Trailing
                expect(data[2][4][18]).to.be.a('number')
                expect(data[2][4][18]).to.equal(0)

                //Price Aux Limit
                expect(data[2][4][19]).to.be.a('number')
                expect(data[2][4][19]).to.equal(0)

                //Placeholder
                expect(data[2][4][20]).to.be.a('null')

                //Placeholder
                expect(data[2][4][21]).to.be.a('null')

                //Placeholder
                expect(data[2][4][22]).to.be.a('null')

                //Notify
                expect(data[2][4][23]).to.be.a('number')
                expect(data[2][4][23]).to.equal(0)

                //Hidden
                expect(data[2][4][24]).to.be.a('null')

                //Placeholder
                expect(data[2][4][25]).to.be.a('null')

                //Placeholder
                expect(data[2][4][26]).to.be.a('null')

                //Placeholder
                expect(data[2][4][27]).to.be.a('null')

                //Routing
                expect(data[2][4][28]).to.be.a('string')
                expect(data[2][4][28]).to.equal('API>BFX')

                //Placeholder
                expect(data[2][4][29]).to.be.a('null')

                //Placeholder
                expect(data[2][4][30]).to.be.a('null')

                //Placeholder
                expect(data[2][4][31]).to.be.a('null')

                console.log(`n message:`,JSON.stringify(data))
                } 

            // Target the on message [0,"on",[1187238101,null,1588148883485,"tBTCUSD",1588148883486,1588148883491,1,1,"LIMIT",null,null,null,0,"ACTIVE",null,null,500,0,0,0,null,null,null,0,0,null,null,null,"BFX",null,null,null]
            if(data[1] == 'on'){
                //NewMarginOrderSocket.close();
                expect(data).to.not.be.null

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //Order ID
                expect(data[2][0]).to.be.a('number')
                expect(data[2][0]).to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //GID
                expect(data[2][1]).to.be.a('null')

                //CID
                expect(data[2][2]).to.be.a('number')
                expect(data[2][2]).to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Symbol
                expect(data[2][3]).to.be.a('string')
                expect(data[2][3]).to.equal(symbol)

                //MTS Create
                expect(data[2][4]).to.be.a('number')
                expect(data[2][4]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][4]).to.match(/^(\d{13})?$/)

                //MTS Update
                expect(data[2][5]).to.be.a('number')
                expect(data[2][5]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][5]).to.match(/^(\d{13})?$/)
                expect(data[2][5]).to.be.greaterThan(data[2][4])

                //Amount
                expect(data[2][6]).to.be.a('number')
                expect(data[2][6]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][6]).to.equal(buyAmount)

                //Amount Orig
                expect(data[2][7]).to.be.a('number')
                expect(data[2][7]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][7]).to.equal(buyAmount)

                //Order Type
                expect(data[2][8]).to.be.a('string')
                expect(data[2][8]).to.equal('LIMIT')

                //Order Type Previous
                expect(data[2][9]).to.be.a('null')

                //MTS TIF
                expect(data[2][10]).to.be.a('null')

                //Placeholder
                expect(data[2][11]).to.be.a('null')

                //Flags
                expect(data[2][12]).to.be.a('number')
                expect(data[2][12]).to.equal(0)

                //Flags
                expect(data[2][13]).to.be.a('String')
                expect(data[2][13]).to.equal('ACTIVE')

                //Placeholder
                expect(data[2][14]).to.be.a('null')

                //Placeholder
                expect(data[2][15]).to.be.a('null')

                //Price
                expect(data[2][16]).to.be.a('number')
                expect(data[2][16]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][16]).to.equal(buyPrice)

                //Price Average
                expect(data[2][17]).to.be.a('number')
                expect(data[2][17]).to.equal(0)

                //Price Trailing
                expect(data[2][18]).to.be.a('number')
                expect(data[2][18]).to.equal(0)

                //Price Aux Limit
                expect(data[2][19]).to.be.a('number')
                expect(data[2][19]).to.equal(0)

                //Placeholder
                expect(data[2][20]).to.be.a('null')

                //Placeholder
                expect(data[2][21]).to.be.a('null')

                //Placeholder
                expect(data[2][22]).to.be.a('null')

                //Notify
                expect(data[2][23]).to.be.a('number')
                expect(data[2][23]).to.equal(0)

                //Hidden
                expect(data[2][24]).to.be.a('number')
                expect(data[2][24]).to.equal(0)

                //Placeholder
                expect(data[2][25]).to.be.a('null')

                //Placeholder
                expect(data[2][26]).to.be.a('null')

                //Placeholder
                expect(data[2][27]).to.be.a('null')

                //Routing
                expect(data[2][28]).to.be.a('string')
                expect(data[2][28]).to.equal('API>BFX')

                //Placeholder
                expect(data[2][29]).to.be.a('null')

                //Placeholder
                expect(data[2][30]).to.be.a('null')

                //Placeholder
                expect(data[2][31]).to.be.a('null')
                
                console.log(`on message:`,JSON.stringify(data))
                done()
                }    
            }
        });

        it('New Limit Sell Order should return a correct Notification and Order Info message', function(done) {

        this.timeout(10000)

            let payload = JSON.stringify([
                0,
                "on",
                null,
                {
                "type": "LIMIT",
                "symbol": symbol,
                "amount": sellAmount.toString(),
                "price": sellPrice.toString()
                }
                ])

            NewMarginOrderSocket.send(payload);

        NewMarginOrderSocket.onmessage = function (event) {
            let data = JSON.parse(event.data)
            
            // Target the n message [0,"n",[1588148817.151,"on-req",null,null,[1187238099,null,1588148817151,"tBTCUSD",1588148817151,1588148817151,1,1,"LIMIT",null,null,null,0,"ACTIVE",null,null,500,0,0,0,null,null,null,0,null,null,null,null,"BFX",null,null,null],null,"SUCCESS","Submitting limit buy order for 1 BTC."]]]        

            if(data[1] == 'n'){
                expect(data).to.not.be.null

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //MTS Timestamp of Notification
                expect(data[2][0]).to.be.a('number')
                expect(data[2][0]).to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Type 
                expect(data[2][1]).to.be.a('string')
                expect(data[2][1]).to.equal('on-req')

                //Message ID
                expect(data[2][2]).to.be.a('null')

                //Placeholder
                expect(data[2][3]).to.be.a('null')

                //Notify Info
                expect(data[2][4]).to.be.a('Array')

                //Code
                expect(data[2][5]).to.be.a('null')

                //Status
                expect(data[2][6]).to.be.a('string')
                expect(data[2][6]).to.equal('SUCCESS')

                //Text
                expect(data[2][7]).to.be.a('string')
                expect(data[2][7]).to.equal('Submitting limit sell order for '+sellAmount+' '+symbolFirst+'.')

                //Order ID
                expect(data[2][4][0]).to.be.a('number')
                expect(data[2][4][0]).to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //GID
                expect(data[2][4][1]).to.be.a('null')

                //CID
                expect(data[2][4][2]).to.be.a('number')
                expect(data[2][4][2]).to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Symbol
                expect(data[2][4][3]).to.be.a('string')
                expect(data[2][4][3]).to.equal(symbol)

                //MTS Create
                expect(data[2][4][4]).to.be.a('number')
                expect(data[2][4][4]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][4][4]).to.match(/^(\d{13})?$/)

                //MTS Update
                expect(data[2][4][5]).to.be.a('number')
                expect(data[2][4][5]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][4][5]).to.match(/^(\d{13})?$/)
                expect(data[2][4][5]).to.equal(data[2][4][4])

                //Amount
                expect(data[2][4][6]).to.be.a('number')
                expect(data[2][4][6]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][4][6]).to.equal(sellAmount)

                //Amount Orig
                expect(data[2][4][7]).to.be.a('number')
                expect(data[2][4][7]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][4][7]).to.equal(sellAmount)

                //Order Type
                expect(data[2][4][8]).to.be.a('string')
                expect(data[2][4][8]).to.equal('LIMIT')

                //Order Type Previous
                expect(data[2][4][9]).to.be.a('null')

                //MTS TIF
                expect(data[2][4][10]).to.be.a('null')

                //Placeholder
                expect(data[2][4][11]).to.be.a('null')

                //Flags
                expect(data[2][4][12]).to.be.a('number')
                expect(data[2][4][12]).to.equal(0)

                //Flags
                expect(data[2][4][13]).to.be.a('String')
                expect(data[2][4][13]).to.equal('ACTIVE')

                //Placeholder
                expect(data[2][4][14]).to.be.a('null')

                //Placeholder
                expect(data[2][4][15]).to.be.a('null')

                //Price
                expect(data[2][4][16]).to.be.a('number')
                expect(data[2][4][16]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][4][16]).to.equal(sellPrice)

                //Price Average
                expect(data[2][4][17]).to.be.a('number')
                expect(data[2][4][17]).to.equal(0)

                //Price Trailing
                expect(data[2][4][18]).to.be.a('number')
                expect(data[2][4][18]).to.equal(0)

                //Price Aux Limit
                expect(data[2][4][19]).to.be.a('number')
                expect(data[2][4][19]).to.equal(0)

                //Placeholder
                expect(data[2][4][20]).to.be.a('null')

                //Placeholder
                expect(data[2][4][21]).to.be.a('null')

                //Placeholder
                expect(data[2][4][22]).to.be.a('null')

                //Notify
                expect(data[2][4][23]).to.be.a('number')
                expect(data[2][4][23]).to.equal(0)

                //Hidden
                expect(data[2][4][24]).to.be.a('null')

                //Placeholder
                expect(data[2][4][25]).to.be.a('null')

                //Placeholder
                expect(data[2][4][26]).to.be.a('null')

                //Placeholder
                expect(data[2][4][27]).to.be.a('null')

                //Routing
                expect(data[2][4][28]).to.be.a('string')
                expect(data[2][4][28]).to.equal('API>BFX')

                //Placeholder
                expect(data[2][4][29]).to.be.a('null')

                //Placeholder
                expect(data[2][4][30]).to.be.a('null')

                //Placeholder
                expect(data[2][4][31]).to.be.a('null')

                console.log(`n message:`,JSON.stringify(data))
                } 

            // Target the on message [0,"on",[1187238101,null,1588148883485,"tBTCUSD",1588148883486,1588148883491,1,1,"LIMIT",null,null,null,0,"ACTIVE",null,null,500,0,0,0,null,null,null,0,0,null,null,null,"BFX",null,null,null]
            if(data[1] == 'on'){
                expect(data).to.not.be.null

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //Order ID
                expect(data[2][0]).to.be.a('number')
                expect(data[2][0]).to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //GID
                expect(data[2][1]).to.be.a('null')

                //CID
                expect(data[2][2]).to.be.a('number')
                expect(data[2][2]).to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Symbol
                expect(data[2][3]).to.be.a('string')
                expect(data[2][3]).to.equal(symbol)

                //MTS Create
                expect(data[2][4]).to.be.a('number')
                expect(data[2][4]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][4]).to.match(/^(\d{13})?$/)

                //MTS Update
                expect(data[2][5]).to.be.a('number')
                expect(data[2][5]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][5]).to.match(/^(\d{13})?$/)
                expect(data[2][5]).to.be.greaterThan(data[2][4])

                //Amount
                expect(data[2][6]).to.be.a('number')
                expect(data[2][6]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][6]).to.equal(sellAmount)

                //Amount Orig
                expect(data[2][7]).to.be.a('number')
                expect(data[2][7]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][7]).to.equal(sellAmount)

                //Order Type
                expect(data[2][8]).to.be.a('string')
                expect(data[2][8]).to.equal('LIMIT')

                //Order Type Previous
                expect(data[2][9]).to.be.a('null')

                //MTS TIF
                expect(data[2][10]).to.be.a('null')

                //Placeholder
                expect(data[2][11]).to.be.a('null')

                //Flags
                expect(data[2][12]).to.be.a('number')
                expect(data[2][12]).to.equal(0)

                //Flags
                expect(data[2][13]).to.be.a('String')
                expect(data[2][13]).to.equal('ACTIVE')

                //Placeholder
                expect(data[2][14]).to.be.a('null')

                //Placeholder
                expect(data[2][15]).to.be.a('null')

                //Price
                expect(data[2][16]).to.be.a('number')
                expect(data[2][16]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][16]).to.equal(sellPrice)

                //Price Average
                expect(data[2][17]).to.be.a('number')
                expect(data[2][17]).to.equal(0)

                //Price Trailing
                expect(data[2][18]).to.be.a('number')
                expect(data[2][18]).to.equal(0)

                //Price Aux Limit
                expect(data[2][19]).to.be.a('number')
                expect(data[2][19]).to.equal(0)

                //Placeholder
                expect(data[2][20]).to.be.a('null')

                //Placeholder
                expect(data[2][21]).to.be.a('null')

                //Placeholder
                expect(data[2][22]).to.be.a('null')

                //Notify
                expect(data[2][23]).to.be.a('number')
                expect(data[2][23]).to.equal(0)

                //Hidden
                expect(data[2][24]).to.be.a('number')
                expect(data[2][24]).to.equal(0)

                //Placeholder
                expect(data[2][25]).to.be.a('null')

                //Placeholder
                expect(data[2][26]).to.be.a('null')

                //Placeholder
                expect(data[2][27]).to.be.a('null')

                //Routing
                expect(data[2][28]).to.be.a('string')
                expect(data[2][28]).to.equal('API>BFX')

                //Placeholder
                expect(data[2][29]).to.be.a('null')

                //Placeholder
                expect(data[2][30]).to.be.a('null')

                //Placeholder
                expect(data[2][31]).to.be.a('null')
                
                console.log(`on message:`,JSON.stringify(data))
                done()
                }    
            }
        });

        it('New Market Buy Order should return a correct Notification and Order Info message', function(done) {

        this.timeout(10000)

            let payload = JSON.stringify([
                0,
                "on",
                null,
                {
                "type": "MARKET",
                "symbol": symbol,
                "amount": buyAmount.toString()
                }
                ])

            NewMarginOrderSocket.send(payload);

        NewMarginOrderSocket.onmessage = function (event) {
            let data = JSON.parse(event.data)
            
            // Target the n message [0,"n",[1588148817.151,"on-req",null,null,[1187238099,null,1588148817151,"tBTCUSD",1588148817151,1588148817151,1,1,"LIMIT",null,null,null,0,"ACTIVE",null,null,500,0,0,0,null,null,null,0,null,null,null,null,"BFX",null,null,null],null,"SUCCESS","Submitting limit buy order for 1 BTC."]]]        

            if(data[1] == 'n'){
                expect(data).to.not.be.null

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //MTS Timestamp of Notification
                expect(data[2][0]).to.be.a('number')
                expect(data[2][0]).to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Type 
                expect(data[2][1]).to.be.a('string')
                expect(data[2][1]).to.equal('on-req')

                //Message ID
                expect(data[2][2]).to.be.a('null')

                //Placeholder
                expect(data[2][3]).to.be.a('null')

                //Notify Info
                expect(data[2][4]).to.be.a('Array')

                //Code
                expect(data[2][5]).to.be.a('null')

                //Status
                expect(data[2][6]).to.be.a('string')
                expect(data[2][6]).to.equal('SUCCESS')

                //Text
                expect(data[2][7]).to.be.a('string')
                expect(data[2][7]).to.equal('Submitting market buy order for '+buyAmount+' '+symbolFirst+'.')

                //Order ID
                expect(data[2][4][0]).to.be.a('number')
                expect(data[2][4][0]).to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //GID
                expect(data[2][4][1]).to.be.a('null')

                //CID
                expect(data[2][4][2]).to.be.a('number')
                expect(data[2][4][2]).to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Symbol
                expect(data[2][4][3]).to.be.a('string')
                expect(data[2][4][3]).to.equal(symbol)

                //MTS Create
                expect(data[2][4][4]).to.be.a('number')
                expect(data[2][4][4]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][4][4]).to.match(/^(\d{13})?$/)

                //MTS Update
                expect(data[2][4][5]).to.be.a('number')
                expect(data[2][4][5]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][4][5]).to.match(/^(\d{13})?$/)
                expect(data[2][4][5]).to.equal(data[2][4][4])

                //Amount
                expect(data[2][4][6]).to.be.a('number')
                expect(data[2][4][6]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][4][6]).to.equal(buyAmount)

                //Amount Orig
                expect(data[2][4][7]).to.be.a('number')
                expect(data[2][4][7]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][4][7]).to.equal(buyAmount)

                //Order Type
                expect(data[2][4][8]).to.be.a('string')
                expect(data[2][4][8]).to.equal('MARKET')

                //Order Type Previous
                expect(data[2][4][9]).to.be.a('null')

                //MTS TIF
                expect(data[2][4][10]).to.be.a('null')

                //Placeholder
                expect(data[2][4][11]).to.be.a('null')

                //Flags
                expect(data[2][4][12]).to.be.a('number')
                expect(data[2][4][12]).to.equal(0)

                //Flags
                expect(data[2][4][13]).to.be.a('String')
                expect(data[2][4][13]).to.equal('ACTIVE')

                //Placeholder
                expect(data[2][4][14]).to.be.a('null')

                //Placeholder
                expect(data[2][4][15]).to.be.a('null')

                //Price
                expect(data[2][4][16]).to.be.a('number')
                expect(data[2][4][16]).to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Price Average
                expect(data[2][4][17]).to.be.a('number')
                expect(data[2][4][17]).to.equal(0)

                //Price Trailing
                expect(data[2][4][18]).to.be.a('number')
                expect(data[2][4][18]).to.equal(0)

                //Price Aux Limit
                expect(data[2][4][19]).to.be.a('number')
                expect(data[2][4][19]).to.equal(0)

                //Placeholder
                expect(data[2][4][20]).to.be.a('null')

                //Placeholder
                expect(data[2][4][21]).to.be.a('null')

                //Placeholder
                expect(data[2][4][22]).to.be.a('null')

                //Notify
                expect(data[2][4][23]).to.be.a('number')
                expect(data[2][4][23]).to.equal(0)

                //Hidden
                expect(data[2][4][24]).to.be.a('null')

                //Placeholder
                expect(data[2][4][25]).to.be.a('null')

                //Placeholder
                expect(data[2][4][26]).to.be.a('null')

                //Placeholder
                expect(data[2][4][27]).to.be.a('null')

                //Routing
                expect(data[2][4][28]).to.be.a('string')
                expect(data[2][4][28]).to.equal('API>BFX')

                //Placeholder
                expect(data[2][4][29]).to.be.a('null')

                //Placeholder
                expect(data[2][4][30]).to.be.a('null')

                //Placeholder
                expect(data[2][4][31]).to.be.a('null')

                console.log(`n message:`,JSON.stringify(data))
                } 

            // Target the oc message [0,"oc",[1187238160,null,1588158739438,"tBTCUSD",1588158739438,1588158739444,0,0.001,"MARKET",null,null,null,0,"EXECUTED @ 8150.0(0.001)",null,null,8150,8150,0,0,null,null,null,0,0,null,null,null,"BFX",null,null,null]]    
            if(data[1] == 'oc'){
                expect(data).to.not.be.null

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //Order ID
                expect(data[2][0]).to.be.a('number')
                expect(data[2][0]).to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //GID
                expect(data[2][1]).to.be.a('null')

                //CID
                expect(data[2][2]).to.be.a('number')
                expect(data[2][2]).to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Symbol
                expect(data[2][3]).to.be.a('string')
                expect(data[2][3]).to.equal(symbol)

                //MTS Create
                expect(data[2][4]).to.be.a('number')
                expect(data[2][4]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][4]).to.match(/^(\d{13})?$/)

                //MTS Update
                expect(data[2][5]).to.be.a('number')
                expect(data[2][5]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][5]).to.match(/^(\d{13})?$/)
                expect(data[2][5]).to.be.greaterThan(data[2][4])

                //Amount
                expect(data[2][6]).to.be.a('number')
                expect(data[2][6]).to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Amount Orig
                expect(data[2][7]).to.be.a('number')
                expect(data[2][7]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][7]).to.equal(buyAmount)

                //Order Type
                expect(data[2][8]).to.be.a('string')
                expect(data[2][8]).to.equal('MARKET')

                //Order Type Previous
                expect(data[2][9]).to.be.a('null')

                //MTS TIF
                expect(data[2][10]).to.be.a('null')

                //Placeholder
                expect(data[2][11]).to.be.a('null')

                //Flags
                expect(data[2][12]).to.be.a('number')
                expect(data[2][12]).to.equal(0)

                //Flags
                expect(data[2][13]).to.be.a('String')
                expect(data[2][13]).to.contain('EXECUTED')

                //Placeholder
                expect(data[2][14]).to.be.a('null')

                //Placeholder
                expect(data[2][15]).to.be.a('null')

                //Price
                expect(data[2][16]).to.be.a('number')
                expect(data[2][16]).to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Price Average
                expect(data[2][17]).to.be.a('number')
                expect(data[2][17]).to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Price Trailing
                expect(data[2][18]).to.be.a('number')
                expect(data[2][18]).to.equal(0)

                //Price Aux Limit
                expect(data[2][19]).to.be.a('number')
                expect(data[2][19]).to.equal(0)

                //Placeholder
                expect(data[2][20]).to.be.a('null')

                //Placeholder
                expect(data[2][21]).to.be.a('null')

                //Placeholder
                expect(data[2][22]).to.be.a('null')

                //Notify
                expect(data[2][23]).to.be.a('number')
                expect(data[2][23]).to.equal(0)

                //Hidden
                expect(data[2][24]).to.be.a('number')
                expect(data[2][24]).to.equal(0)

                //Placeholder
                expect(data[2][25]).to.be.a('null')

                //Placeholder
                expect(data[2][26]).to.be.a('null')

                //Placeholder
                expect(data[2][27]).to.be.a('null')

                //Routing
                expect(data[2][28]).to.be.a('string')
                expect(data[2][28]).to.equal('API>BFX')

                //Placeholder
                expect(data[2][29]).to.be.a('null')

                //Placeholder
                expect(data[2][30]).to.be.a('null')

                //Placeholder
                expect(data[2][31]).to.be.a('null')
                
                console.log(`on message:`,JSON.stringify(data))
                done()
                }    
            }
        });

        it('New Market Sell Order should return a correct Notification and Order Info message', function(done) {

        this.timeout(10000)

            let payload = JSON.stringify([
                0,
                "on",
                null,
                {
                "type": "MARKET",
                "symbol": symbol,
                "amount": sellAmount.toString()
                }
                ])

            NewMarginOrderSocket.send(payload);

        NewMarginOrderSocket.onmessage = function (event) {
            let data = JSON.parse(event.data)
            
            // Target the n message [0,"n",[1588148817.151,"on-req",null,null,[1187238099,null,1588148817151,"tBTCUSD",1588148817151,1588148817151,1,1,"LIMIT",null,null,null,0,"ACTIVE",null,null,500,0,0,0,null,null,null,0,null,null,null,null,"BFX",null,null,null],null,"SUCCESS","Submitting limit buy order for 1 BTC."]]]        

            if(data[1] == 'n'){
                expect(data).to.not.be.null

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //MTS Timestamp of Notification
                expect(data[2][0]).to.be.a('number')
                expect(data[2][0]).to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Type 
                expect(data[2][1]).to.be.a('string')
                expect(data[2][1]).to.equal('on-req')

                //Message ID
                expect(data[2][2]).to.be.a('null')

                //Placeholder
                expect(data[2][3]).to.be.a('null')

                //Notify Info
                expect(data[2][4]).to.be.a('Array')

                //Code
                expect(data[2][5]).to.be.a('null')

                //Status
                expect(data[2][6]).to.be.a('string')
                expect(data[2][6]).to.equal('SUCCESS')

                //Text
                expect(data[2][7]).to.be.a('string')
                expect(data[2][7]).to.equal('Submitting market sell order for '+sellAmount+' '+symbolFirst+'.')

                //Order ID
                expect(data[2][4][0]).to.be.a('number')
                expect(data[2][4][0]).to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //GID
                expect(data[2][4][1]).to.be.a('null')

                //CID
                expect(data[2][4][2]).to.be.a('number')
                expect(data[2][4][2]).to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Symbol
                expect(data[2][4][3]).to.be.a('string')
                expect(data[2][4][3]).to.equal(symbol)

                //MTS Create
                expect(data[2][4][4]).to.be.a('number')
                expect(data[2][4][4]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][4][4]).to.match(/^(\d{13})?$/)

                //MTS Update
                expect(data[2][4][5]).to.be.a('number')
                expect(data[2][4][5]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][4][5]).to.match(/^(\d{13})?$/)
                expect(data[2][4][5]).to.equal(data[2][4][4])

                //Amount
                expect(data[2][4][6]).to.be.a('number')
                expect(data[2][4][6]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][4][6]).to.equal(sellAmount)

                //Amount Orig
                expect(data[2][4][7]).to.be.a('number')
                expect(data[2][4][7]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][4][7]).to.equal(sellAmount)

                //Order Type
                expect(data[2][4][8]).to.be.a('string')
                expect(data[2][4][8]).to.equal('MARKET')

                //Order Type Previous
                expect(data[2][4][9]).to.be.a('null')

                //MTS TIF
                expect(data[2][4][10]).to.be.a('null')

                //Placeholder
                expect(data[2][4][11]).to.be.a('null')

                //Flags
                expect(data[2][4][12]).to.be.a('number')
                expect(data[2][4][12]).to.equal(0)

                //Flags
                expect(data[2][4][13]).to.be.a('String')
                expect(data[2][4][13]).to.equal('ACTIVE')

                //Placeholder
                expect(data[2][4][14]).to.be.a('null')

                //Placeholder
                expect(data[2][4][15]).to.be.a('null')

                //Price
                expect(data[2][4][16]).to.be.a('number')
                expect(data[2][4][16]).to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Price Average
                expect(data[2][4][17]).to.be.a('number')
                expect(data[2][4][17]).to.equal(0)

                //Price Trailing
                expect(data[2][4][18]).to.be.a('number')
                expect(data[2][4][18]).to.equal(0)

                //Price Aux Limit
                expect(data[2][4][19]).to.be.a('number')
                expect(data[2][4][19]).to.equal(0)

                //Placeholder
                expect(data[2][4][20]).to.be.a('null')

                //Placeholder
                expect(data[2][4][21]).to.be.a('null')

                //Placeholder
                expect(data[2][4][22]).to.be.a('null')

                //Notify
                expect(data[2][4][23]).to.be.a('number')
                expect(data[2][4][23]).to.equal(0)

                //Hidden
                expect(data[2][4][24]).to.be.a('null')

                //Placeholder
                expect(data[2][4][25]).to.be.a('null')

                //Placeholder
                expect(data[2][4][26]).to.be.a('null')

                //Placeholder
                expect(data[2][4][27]).to.be.a('null')

                //Routing
                expect(data[2][4][28]).to.be.a('string')
                expect(data[2][4][28]).to.equal('API>BFX')

                //Placeholder
                expect(data[2][4][29]).to.be.a('null')

                //Placeholder
                expect(data[2][4][30]).to.be.a('null')

                //Placeholder
                expect(data[2][4][31]).to.be.a('null')

                console.log(`n message:`,JSON.stringify(data))
                } 

            // Target the oc message [0,"oc",[1187238160,null,1588158739438,"tBTCUSD",1588158739438,1588158739444,0,0.001,"MARKET",null,null,null,0,"EXECUTED @ 8150.0(0.001)",null,null,8150,8150,0,0,null,null,null,0,0,null,null,null,"BFX",null,null,null]]    
            if(data[1] == 'oc'){
                expect(data).to.not.be.null

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //Order ID
                expect(data[2][0]).to.be.a('number')
                expect(data[2][0]).to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //GID
                expect(data[2][1]).to.be.a('null')

                //CID
                expect(data[2][2]).to.be.a('number')
                expect(data[2][2]).to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Symbol
                expect(data[2][3]).to.be.a('string')
                expect(data[2][3]).to.equal(symbol)

                //MTS Create
                expect(data[2][4]).to.be.a('number')
                expect(data[2][4]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][4]).to.match(/^(\d{13})?$/)

                //MTS Update
                expect(data[2][5]).to.be.a('number')
                expect(data[2][5]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][5]).to.match(/^(\d{13})?$/)
                expect(data[2][5]).to.be.greaterThan(data[2][4])

                //Amount
                expect(data[2][6]).to.be.a('number')
                expect(data[2][6]).to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Amount Orig
                expect(data[2][7]).to.be.a('number')
                expect(data[2][7]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][7]).to.equal(sellAmount)

                //Order Type
                expect(data[2][8]).to.be.a('string')
                expect(data[2][8]).to.equal('MARKET')

                //Order Type Previous
                expect(data[2][9]).to.be.a('null')

                //MTS TIF
                expect(data[2][10]).to.be.a('null')

                //Placeholder
                expect(data[2][11]).to.be.a('null')

                //Flags
                expect(data[2][12]).to.be.a('number')
                expect(data[2][12]).to.equal(0)

                //Flags
                expect(data[2][13]).to.be.a('String')
                expect(data[2][13]).to.contain('EXECUTED')

                //Placeholder
                expect(data[2][14]).to.be.a('null')

                //Placeholder
                expect(data[2][15]).to.be.a('null')

                //Price
                expect(data[2][16]).to.be.a('number')
                expect(data[2][16]).to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Price Average
                expect(data[2][17]).to.be.a('number')
                expect(data[2][17]).to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Price Trailing
                expect(data[2][18]).to.be.a('number')
                expect(data[2][18]).to.equal(0)

                //Price Aux Limit
                expect(data[2][19]).to.be.a('number')
                expect(data[2][19]).to.equal(0)

                //Placeholder
                expect(data[2][20]).to.be.a('null')

                //Placeholder
                expect(data[2][21]).to.be.a('null')

                //Placeholder
                expect(data[2][22]).to.be.a('null')

                //Notify
                expect(data[2][23]).to.be.a('number')
                expect(data[2][23]).to.equal(0)

                //Hidden
                expect(data[2][24]).to.be.a('number')
                expect(data[2][24]).to.equal(0)

                //Placeholder
                expect(data[2][25]).to.be.a('null')

                //Placeholder
                expect(data[2][26]).to.be.a('null')

                //Placeholder
                expect(data[2][27]).to.be.a('null')

                //Routing
                expect(data[2][28]).to.be.a('string')
                expect(data[2][28]).to.equal('API>BFX')

                //Placeholder
                expect(data[2][29]).to.be.a('null')

                //Placeholder
                expect(data[2][30]).to.be.a('null')

                //Placeholder
                expect(data[2][31]).to.be.a('null')
                
                console.log(`on message:`,JSON.stringify(data))
                done()
                }    
            }
        });

        it('New Stop Buy Order should return a correct Notification and Order Info message', function(done) {

        this.timeout(10000)

            let payload = JSON.stringify([
                0,
                "on",
                null,
                {
                "type": "STOP",
                "symbol": symbol,
                "amount": buyAmount.toString(),
                "price": sellPrice.toString()
                }
                ])

            NewMarginOrderSocket.send(payload);

        NewMarginOrderSocket.onmessage = function (event) {
            let data = JSON.parse(event.data)
            
            // Target the n message [0,"n",[1588148817.151,"on-req",null,null,[1187238099,null,1588148817151,"tBTCUSD",1588148817151,1588148817151,1,1,"LIMIT",null,null,null,0,"ACTIVE",null,null,500,0,0,0,null,null,null,0,null,null,null,null,"BFX",null,null,null],null,"SUCCESS","Submitting limit buy order for 1 BTC."]]]        

            if(data[1] == 'n'){
                expect(data).to.not.be.null

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //MTS Timestamp of Notification
                expect(data[2][0]).to.be.a('number')
                expect(data[2][0]).to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Type 
                expect(data[2][1]).to.be.a('string')
                expect(data[2][1]).to.equal('on-req')

                //Message ID
                expect(data[2][2]).to.be.a('null')

                //Placeholder
                expect(data[2][3]).to.be.a('null')

                //Notify Info
                expect(data[2][4]).to.be.a('Array')

                //Code
                expect(data[2][5]).to.be.a('null')

                //Status
                expect(data[2][6]).to.be.a('string')
                expect(data[2][6]).to.equal('SUCCESS')

                //Text
                expect(data[2][7]).to.be.a('string')
                expect(data[2][7]).to.equal('Submitting stop buy order for '+buyAmount+' '+symbolFirst+'.')

                //Order ID
                expect(data[2][4][0]).to.be.a('number')
                expect(data[2][4][0]).to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //GID
                expect(data[2][4][1]).to.be.a('null')

                //CID
                expect(data[2][4][2]).to.be.a('number')
                expect(data[2][4][2]).to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Symbol
                expect(data[2][4][3]).to.be.a('string')
                expect(data[2][4][3]).to.equal(symbol)

                //MTS Create
                expect(data[2][4][4]).to.be.a('number')
                expect(data[2][4][4]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][4][4]).to.match(/^(\d{13})?$/)

                //MTS Update
                expect(data[2][4][5]).to.be.a('number')
                expect(data[2][4][5]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][4][5]).to.match(/^(\d{13})?$/)
                expect(data[2][4][5]).to.equal(data[2][4][4])

                //Amount
                expect(data[2][4][6]).to.be.a('number')
                expect(data[2][4][6]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][4][6]).to.equal(buyAmount)

                //Amount Orig
                expect(data[2][4][7]).to.be.a('number')
                expect(data[2][4][7]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][4][7]).to.equal(buyAmount)

                //Order Type
                expect(data[2][4][8]).to.be.a('string')
                expect(data[2][4][8]).to.equal('STOP')

                //Order Type Previous
                expect(data[2][4][9]).to.be.a('null')

                //MTS TIF
                expect(data[2][4][10]).to.be.a('null')

                //Placeholder
                expect(data[2][4][11]).to.be.a('null')

                //Flags
                expect(data[2][4][12]).to.be.a('number')
                expect(data[2][4][12]).to.equal(0)

                //Flags
                expect(data[2][4][13]).to.be.a('String')
                expect(data[2][4][13]).to.equal('ACTIVE')

                //Placeholder
                expect(data[2][4][14]).to.be.a('null')

                //Placeholder
                expect(data[2][4][15]).to.be.a('null')

                //Price
                expect(data[2][4][16]).to.be.a('number')
                expect(data[2][4][16]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][4][16]).to.equal(sellPrice)

                //Price Average
                expect(data[2][4][17]).to.be.a('number')
                expect(data[2][4][17]).to.equal(0)

                //Price Trailing
                expect(data[2][4][18]).to.be.a('number')
                expect(data[2][4][18]).to.equal(0)

                //Price Aux Limit
                expect(data[2][4][19]).to.be.a('number')
                expect(data[2][4][19]).to.equal(0)

                //Placeholder
                expect(data[2][4][20]).to.be.a('null')

                //Placeholder
                expect(data[2][4][21]).to.be.a('null')

                //Placeholder
                expect(data[2][4][22]).to.be.a('null')

                //Notify
                expect(data[2][4][23]).to.be.a('number')
                expect(data[2][4][23]).to.equal(0)

                //Hidden
                expect(data[2][4][24]).to.be.a('null')

                //Placeholder
                expect(data[2][4][25]).to.be.a('null')

                //Placeholder
                expect(data[2][4][26]).to.be.a('null')

                //Placeholder
                expect(data[2][4][27]).to.be.a('null')

                //Routing
                expect(data[2][4][28]).to.be.a('string')
                expect(data[2][4][28]).to.equal('API>BFX')

                //Placeholder
                expect(data[2][4][29]).to.be.a('null')

                //Placeholder
                expect(data[2][4][30]).to.be.a('null')

                //Placeholder
                expect(data[2][4][31]).to.be.a('null')

                console.log(`n message:`,JSON.stringify(data))
                } 

            // Target the on message [0,"on",[1187238101,null,1588148883485,"tBTCUSD",1588148883486,1588148883491,1,1,"LIMIT",null,null,null,0,"ACTIVE",null,null,500,0,0,0,null,null,null,0,0,null,null,null,"BFX",null,null,null]   
            if(data[1] == 'on'){
                expect(data).to.not.be.null

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //Order ID
                expect(data[2][0]).to.be.a('number')
                expect(data[2][0]).to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //GID
                expect(data[2][1]).to.be.a('null')

                //CID
                expect(data[2][2]).to.be.a('number')
                expect(data[2][2]).to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Symbol
                expect(data[2][3]).to.be.a('string')
                expect(data[2][3]).to.equal(symbol)

                //MTS Create
                expect(data[2][4]).to.be.a('number')
                expect(data[2][4]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][4]).to.match(/^(\d{13})?$/)

                //MTS Update
                expect(data[2][5]).to.be.a('number')
                expect(data[2][5]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][5]).to.match(/^(\d{13})?$/)
                expect(data[2][5]).to.be.greaterThan(data[2][4])

                //Amount
                expect(data[2][6]).to.be.a('number')
                expect(data[2][6]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][6]).to.equal(buyAmount)

                //Amount Orig
                expect(data[2][7]).to.be.a('number')
                expect(data[2][7]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][7]).to.equal(buyAmount)

                //Order Type
                expect(data[2][8]).to.be.a('string')
                expect(data[2][8]).to.equal('STOP')

                //Order Type Previous
                expect(data[2][9]).to.be.a('null')

                //MTS TIF
                expect(data[2][10]).to.be.a('null')

                //Placeholder
                expect(data[2][11]).to.be.a('null')

                //Flags
                expect(data[2][12]).to.be.a('number')
                expect(data[2][12]).to.equal(0)

                //Flags
                expect(data[2][13]).to.be.a('String')
                expect(data[2][13]).to.contain('ACTIVE')

                //Placeholder
                expect(data[2][14]).to.be.a('null')

                //Placeholder
                expect(data[2][15]).to.be.a('null')

                //Price
                expect(data[2][16]).to.be.a('number')
                expect(data[2][16]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][16]).to.equal(sellPrice)

                //Price Average
                expect(data[2][17]).to.be.a('number')
                expect(data[2][17]).to.equal(0)

                //Price Trailing
                expect(data[2][18]).to.be.a('number')
                expect(data[2][18]).to.equal(0)

                //Price Aux Limit
                expect(data[2][19]).to.be.a('number')
                expect(data[2][19]).to.equal(0)

                //Placeholder
                expect(data[2][20]).to.be.a('null')

                //Placeholder
                expect(data[2][21]).to.be.a('null')

                //Placeholder
                expect(data[2][22]).to.be.a('null')

                //Notify
                expect(data[2][23]).to.be.a('number')
                expect(data[2][23]).to.equal(0)

                //Hidden
                expect(data[2][24]).to.be.a('number')
                expect(data[2][24]).to.equal(0)

                //Placeholder
                expect(data[2][25]).to.be.a('null')

                //Placeholder
                expect(data[2][26]).to.be.a('null')

                //Placeholder
                expect(data[2][27]).to.be.a('null')

                //Routing
                expect(data[2][28]).to.be.a('string')
                expect(data[2][28]).to.equal('API>BFX')

                //Placeholder
                expect(data[2][29]).to.be.a('null')

                //Placeholder
                expect(data[2][30]).to.be.a('null')

                //Placeholder
                expect(data[2][31]).to.be.a('null')
                
                console.log(`on message:`,JSON.stringify(data))
                done()
                }    
            }
        });

        it('New Stop Sell Order should return a correct Notification and Order Info message', function(done) {

        this.timeout(10000)

            let payload = JSON.stringify([
                0,
                "on",
                null,
                {
                "type": "STOP",
                "symbol": symbol,
                "amount": sellAmount.toString(),
                "price": buyPrice.toString()
                }
                ])

            NewMarginOrderSocket.send(payload);

        NewMarginOrderSocket.onmessage = function (event) {
            let data = JSON.parse(event.data)
            
            // Target the n message [0,"n",[1588148817.151,"on-req",null,null,[1187238099,null,1588148817151,"tBTCUSD",1588148817151,1588148817151,1,1,"LIMIT",null,null,null,0,"ACTIVE",null,null,500,0,0,0,null,null,null,0,null,null,null,null,"BFX",null,null,null],null,"SUCCESS","Submitting limit buy order for 1 BTC."]]]        

            if(data[1] == 'n'){
                expect(data).to.not.be.null

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //MTS Timestamp of Notification
                expect(data[2][0]).to.be.a('number')
                expect(data[2][0]).to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Type 
                expect(data[2][1]).to.be.a('string')
                expect(data[2][1]).to.equal('on-req')

                //Message ID
                expect(data[2][2]).to.be.a('null')

                //Placeholder
                expect(data[2][3]).to.be.a('null')

                //Notify Info
                expect(data[2][4]).to.be.a('Array')

                //Code
                expect(data[2][5]).to.be.a('null')

                //Status
                expect(data[2][6]).to.be.a('string')
                expect(data[2][6]).to.equal('SUCCESS')

                //Text
                expect(data[2][7]).to.be.a('string')
                expect(data[2][7]).to.equal('Submitting stop sell order for '+sellAmount+' '+symbolFirst+'.')

                //Order ID
                expect(data[2][4][0]).to.be.a('number')
                expect(data[2][4][0]).to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //GID
                expect(data[2][4][1]).to.be.a('null')

                //CID
                expect(data[2][4][2]).to.be.a('number')
                expect(data[2][4][2]).to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Symbol
                expect(data[2][4][3]).to.be.a('string')
                expect(data[2][4][3]).to.equal(symbol)

                //MTS Create
                expect(data[2][4][4]).to.be.a('number')
                expect(data[2][4][4]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][4][4]).to.match(/^(\d{13})?$/)

                //MTS Update
                expect(data[2][4][5]).to.be.a('number')
                expect(data[2][4][5]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][4][5]).to.match(/^(\d{13})?$/)
                expect(data[2][4][5]).to.equal(data[2][4][4])

                //Amount
                expect(data[2][4][6]).to.be.a('number')
                expect(data[2][4][6]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][4][6]).to.equal(sellAmount)

                //Amount Orig
                expect(data[2][4][7]).to.be.a('number')
                expect(data[2][4][7]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][4][7]).to.equal(sellAmount)

                //Order Type
                expect(data[2][4][8]).to.be.a('string')
                expect(data[2][4][8]).to.equal('STOP')

                //Order Type Previous
                expect(data[2][4][9]).to.be.a('null')

                //MTS TIF
                expect(data[2][4][10]).to.be.a('null')

                //Placeholder
                expect(data[2][4][11]).to.be.a('null')

                //Flags
                expect(data[2][4][12]).to.be.a('number')
                expect(data[2][4][12]).to.equal(0)

                //Flags
                expect(data[2][4][13]).to.be.a('String')
                expect(data[2][4][13]).to.equal('ACTIVE')

                //Placeholder
                expect(data[2][4][14]).to.be.a('null')

                //Placeholder
                expect(data[2][4][15]).to.be.a('null')

                //Price
                expect(data[2][4][16]).to.be.a('number')
                expect(data[2][4][16]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][4][16]).to.equal(buyPrice)

                //Price Average
                expect(data[2][4][17]).to.be.a('number')
                expect(data[2][4][17]).to.equal(0)

                //Price Trailing
                expect(data[2][4][18]).to.be.a('number')
                expect(data[2][4][18]).to.equal(0)

                //Price Aux Limit
                expect(data[2][4][19]).to.be.a('number')
                expect(data[2][4][19]).to.equal(0)

                //Placeholder
                expect(data[2][4][20]).to.be.a('null')

                //Placeholder
                expect(data[2][4][21]).to.be.a('null')

                //Placeholder
                expect(data[2][4][22]).to.be.a('null')

                //Notify
                expect(data[2][4][23]).to.be.a('number')
                expect(data[2][4][23]).to.equal(0)

                //Hidden
                expect(data[2][4][24]).to.be.a('null')

                //Placeholder
                expect(data[2][4][25]).to.be.a('null')

                //Placeholder
                expect(data[2][4][26]).to.be.a('null')

                //Placeholder
                expect(data[2][4][27]).to.be.a('null')

                //Routing
                expect(data[2][4][28]).to.be.a('string')
                expect(data[2][4][28]).to.equal('API>BFX')

                //Placeholder
                expect(data[2][4][29]).to.be.a('null')

                //Placeholder
                expect(data[2][4][30]).to.be.a('null')

                //Placeholder
                expect(data[2][4][31]).to.be.a('null')

                console.log(`n message:`,JSON.stringify(data))
                } 

            // Target the on message [0,"on",[1187238101,null,1588148883485,"tBTCUSD",1588148883486,1588148883491,1,1,"LIMIT",null,null,null,0,"ACTIVE",null,null,500,0,0,0,null,null,null,0,0,null,null,null,"BFX",null,null,null]   
            if(data[1] == 'on'){
                expect(data).to.not.be.null

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //Order ID
                expect(data[2][0]).to.be.a('number')
                expect(data[2][0]).to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //GID
                expect(data[2][1]).to.be.a('null')

                //CID
                expect(data[2][2]).to.be.a('number')
                expect(data[2][2]).to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Symbol
                expect(data[2][3]).to.be.a('string')
                expect(data[2][3]).to.equal(symbol)

                //MTS Create
                expect(data[2][4]).to.be.a('number')
                expect(data[2][4]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][4]).to.match(/^(\d{13})?$/)

                //MTS Update
                expect(data[2][5]).to.be.a('number')
                expect(data[2][5]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][5]).to.match(/^(\d{13})?$/)
                expect(data[2][5]).to.be.greaterThan(data[2][4])

                //Amount
                expect(data[2][6]).to.be.a('number')
                expect(data[2][6]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][6]).to.equal(sellAmount)

                //Amount Orig
                expect(data[2][7]).to.be.a('number')
                expect(data[2][7]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][7]).to.equal(sellAmount)

                //Order Type
                expect(data[2][8]).to.be.a('string')
                expect(data[2][8]).to.equal('STOP')

                //Order Type Previous
                expect(data[2][9]).to.be.a('null')

                //MTS TIF
                expect(data[2][10]).to.be.a('null')

                //Placeholder
                expect(data[2][11]).to.be.a('null')

                //Flags
                expect(data[2][12]).to.be.a('number')
                expect(data[2][12]).to.equal(0)

                //Flags
                expect(data[2][13]).to.be.a('String')
                expect(data[2][13]).to.contain('ACTIVE')

                //Placeholder
                expect(data[2][14]).to.be.a('null')

                //Placeholder
                expect(data[2][15]).to.be.a('null')

                //Price
                expect(data[2][16]).to.be.a('number')
                expect(data[2][16]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][16]).to.equal(buyPrice)

                //Price Average
                expect(data[2][17]).to.be.a('number')
                expect(data[2][17]).to.equal(0)

                //Price Trailing
                expect(data[2][18]).to.be.a('number')
                expect(data[2][18]).to.equal(0)

                //Price Aux Limit
                expect(data[2][19]).to.be.a('number')
                expect(data[2][19]).to.equal(0)

                //Placeholder
                expect(data[2][20]).to.be.a('null')

                //Placeholder
                expect(data[2][21]).to.be.a('null')

                //Placeholder
                expect(data[2][22]).to.be.a('null')

                //Notify
                expect(data[2][23]).to.be.a('number')
                expect(data[2][23]).to.equal(0)

                //Hidden
                expect(data[2][24]).to.be.a('number')
                expect(data[2][24]).to.equal(0)

                //Placeholder
                expect(data[2][25]).to.be.a('null')

                //Placeholder
                expect(data[2][26]).to.be.a('null')

                //Placeholder
                expect(data[2][27]).to.be.a('null')

                //Routing
                expect(data[2][28]).to.be.a('string')
                expect(data[2][28]).to.equal('API>BFX')

                //Placeholder
                expect(data[2][29]).to.be.a('null')

                //Placeholder
                expect(data[2][30]).to.be.a('null')

                //Placeholder
                expect(data[2][31]).to.be.a('null')
                
                console.log(`on message:`,JSON.stringify(data))
                done()
                }    
            }
        });

        it('New Stop Limit Buy Order should return a correct Notification and Order Info message', function(done) {

        this.timeout(10000)

            let payload = JSON.stringify([
                0,
                "on",
                null,
                {
                "type": "STOP LIMIT",
                "symbol": symbol,
                "amount": buyAmount.toString(),
                "price": sellPrice.toString(),
                "price_aux_limit": buyPrice.toString()
                }
                ])

            NewMarginOrderSocket.send(payload);

        NewMarginOrderSocket.onmessage = function (event) {
            let data = JSON.parse(event.data)
            
            // Target the n message [0,"n",[1588148817.151,"on-req",null,null,[1187238099,null,1588148817151,"tBTCUSD",1588148817151,1588148817151,1,1,"LIMIT",null,null,null,0,"ACTIVE",null,null,500,0,0,0,null,null,null,0,null,null,null,null,"BFX",null,null,null],null,"SUCCESS","Submitting limit buy order for 1 BTC."]]]        

            if(data[1] == 'n'){
                expect(data).to.not.be.null

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //MTS Timestamp of Notification
                expect(data[2][0]).to.be.a('number')
                expect(data[2][0]).to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Type 
                expect(data[2][1]).to.be.a('string')
                expect(data[2][1]).to.equal('on-req')

                //Message ID
                expect(data[2][2]).to.be.a('null')

                //Placeholder
                expect(data[2][3]).to.be.a('null')

                //Notify Info
                expect(data[2][4]).to.be.a('Array')

                //Code
                expect(data[2][5]).to.be.a('null')

                //Status
                expect(data[2][6]).to.be.a('string')
                expect(data[2][6]).to.equal('SUCCESS')

                //Text
                expect(data[2][7]).to.be.a('string')
                expect(data[2][7]).to.equal('Submitting stop limit buy order for '+buyAmount+' '+symbolFirst+'.')

                //Order ID
                expect(data[2][4][0]).to.be.a('number')
                expect(data[2][4][0]).to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //GID
                expect(data[2][4][1]).to.be.a('null')

                //CID
                expect(data[2][4][2]).to.be.a('number')
                expect(data[2][4][2]).to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Symbol
                expect(data[2][4][3]).to.be.a('string')
                expect(data[2][4][3]).to.equal(symbol)

                //MTS Create
                expect(data[2][4][4]).to.be.a('number')
                expect(data[2][4][4]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][4][4]).to.match(/^(\d{13})?$/)

                //MTS Update
                expect(data[2][4][5]).to.be.a('number')
                expect(data[2][4][5]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][4][5]).to.match(/^(\d{13})?$/)
                expect(data[2][4][5]).to.equal(data[2][4][4])

                //Amount
                expect(data[2][4][6]).to.be.a('number')
                expect(data[2][4][6]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][4][6]).to.equal(buyAmount)

                //Amount Orig
                expect(data[2][4][7]).to.be.a('number')
                expect(data[2][4][7]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][4][7]).to.equal(buyAmount)

                //Order Type
                expect(data[2][4][8]).to.be.a('string')
                expect(data[2][4][8]).to.equal('STOP LIMIT')

                //Order Type Previous
                expect(data[2][4][9]).to.be.a('null')

                //MTS TIF
                expect(data[2][4][10]).to.be.a('null')

                //Placeholder
                expect(data[2][4][11]).to.be.a('null')

                //Flags
                expect(data[2][4][12]).to.be.a('number')
                expect(data[2][4][12]).to.equal(0)

                //Flags
                expect(data[2][4][13]).to.be.a('String')
                expect(data[2][4][13]).to.equal('ACTIVE')

                //Placeholder
                expect(data[2][4][14]).to.be.a('null')

                //Placeholder
                expect(data[2][4][15]).to.be.a('null')

                //Price
                expect(data[2][4][16]).to.be.a('number')
                expect(data[2][4][16]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][4][16]).to.equal(sellPrice)

                //Price Average
                expect(data[2][4][17]).to.be.a('number')
                expect(data[2][4][17]).to.equal(0)

                //Price Trailing
                expect(data[2][4][18]).to.be.a('number')
                expect(data[2][4][18]).to.equal(0)

                //Price Aux Limit
                expect(data[2][4][19]).to.be.a('number')
                expect(data[2][4][16]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][4][19]).to.equal(buyPrice)

                //Placeholder
                expect(data[2][4][20]).to.be.a('null')

                //Placeholder
                expect(data[2][4][21]).to.be.a('null')

                //Placeholder
                expect(data[2][4][22]).to.be.a('null')

                //Notify
                expect(data[2][4][23]).to.be.a('number')
                expect(data[2][4][23]).to.equal(0)

                //Hidden
                expect(data[2][4][24]).to.be.a('null')

                //Placeholder
                expect(data[2][4][25]).to.be.a('null')

                //Placeholder
                expect(data[2][4][26]).to.be.a('null')

                //Placeholder
                expect(data[2][4][27]).to.be.a('null')

                //Routing
                expect(data[2][4][28]).to.be.a('string')
                expect(data[2][4][28]).to.equal('API>BFX')

                //Placeholder
                expect(data[2][4][29]).to.be.a('null')

                //Placeholder
                expect(data[2][4][30]).to.be.a('null')

                //Placeholder
                expect(data[2][4][31]).to.be.a('null')

                console.log(`n message:`,JSON.stringify(data))
                } 

            // Target the on message [0,"on",[1187238101,null,1588148883485,"tBTCUSD",1588148883486,1588148883491,1,1,"LIMIT",null,null,null,0,"ACTIVE",null,null,500,0,0,0,null,null,null,0,0,null,null,null,"BFX",null,null,null]   
            if(data[1] == 'on'){
                expect(data).to.not.be.null

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //Order ID
                expect(data[2][0]).to.be.a('number')
                expect(data[2][0]).to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //GID
                expect(data[2][1]).to.be.a('null')

                //CID
                expect(data[2][2]).to.be.a('number')
                expect(data[2][2]).to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Symbol
                expect(data[2][3]).to.be.a('string')
                expect(data[2][3]).to.equal(symbol)

                //MTS Create
                expect(data[2][4]).to.be.a('number')
                expect(data[2][4]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][4]).to.match(/^(\d{13})?$/)

                //MTS Update
                expect(data[2][5]).to.be.a('number')
                expect(data[2][5]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][5]).to.match(/^(\d{13})?$/)
                expect(data[2][5]).to.be.greaterThan(data[2][4])

                //Amount
                expect(data[2][6]).to.be.a('number')
                expect(data[2][6]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][6]).to.equal(buyAmount)

                //Amount Orig
                expect(data[2][7]).to.be.a('number')
                expect(data[2][7]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][7]).to.equal(buyAmount)

                //Order Type
                expect(data[2][8]).to.be.a('string')
                expect(data[2][8]).to.equal('STOP LIMIT')

                //Order Type Previous
                expect(data[2][9]).to.be.a('null')

                //MTS TIF
                expect(data[2][10]).to.be.a('null')

                //Placeholder
                expect(data[2][11]).to.be.a('null')

                //Flags
                expect(data[2][12]).to.be.a('number')
                expect(data[2][12]).to.equal(0)

                //Flags
                expect(data[2][13]).to.be.a('String')
                expect(data[2][13]).to.contain('ACTIVE')

                //Placeholder
                expect(data[2][14]).to.be.a('null')

                //Placeholder
                expect(data[2][15]).to.be.a('null')

                //Price
                expect(data[2][16]).to.be.a('number')
                expect(data[2][16]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][16]).to.equal(sellPrice)

                //Price Average
                expect(data[2][17]).to.be.a('number')
                expect(data[2][17]).to.equal(0)

                //Price Trailing
                expect(data[2][18]).to.be.a('number')
                expect(data[2][18]).to.equal(0)

                //Price Aux Limit
                expect(data[2][19]).to.be.a('number')
                expect(data[2][19]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][19]).to.equal(buyPrice)

                //Placeholder
                expect(data[2][20]).to.be.a('null')

                //Placeholder
                expect(data[2][21]).to.be.a('null')

                //Placeholder
                expect(data[2][22]).to.be.a('null')

                //Notify
                expect(data[2][23]).to.be.a('number')
                expect(data[2][23]).to.equal(0)

                //Hidden
                expect(data[2][24]).to.be.a('number')
                expect(data[2][24]).to.equal(0)

                //Placeholder
                expect(data[2][25]).to.be.a('null')

                //Placeholder
                expect(data[2][26]).to.be.a('null')

                //Placeholder
                expect(data[2][27]).to.be.a('null')

                //Routing
                expect(data[2][28]).to.be.a('string')
                expect(data[2][28]).to.equal('API>BFX')

                //Placeholder
                expect(data[2][29]).to.be.a('null')

                //Placeholder
                expect(data[2][30]).to.be.a('null')

                //Placeholder
                expect(data[2][31]).to.be.a('null')
                
                console.log(`on message:`,JSON.stringify(data))
                done()
                }    
            }
        });

        it('New Stop Limit Sell Order should return a correct Notification and Order Info message', function(done) {

        this.timeout(10000)

            let payload = JSON.stringify([
                0,
                "on",
                null,
                {
                "type": "STOP LIMIT",
                "symbol": symbol,
                "amount": sellAmount.toString(),
                "price": buyPrice.toString(),
                "price_aux_limit": sellPrice.toString(),
                }
                ])

            NewMarginOrderSocket.send(payload);

        NewMarginOrderSocket.onmessage = function (event) {
            let data = JSON.parse(event.data)
            
            // Target the n message [0,"n",[1588148817.151,"on-req",null,null,[1187238099,null,1588148817151,"tBTCUSD",1588148817151,1588148817151,1,1,"LIMIT",null,null,null,0,"ACTIVE",null,null,500,0,0,0,null,null,null,0,null,null,null,null,"BFX",null,null,null],null,"SUCCESS","Submitting limit buy order for 1 BTC."]]]        

            if(data[1] == 'n'){
                expect(data).to.not.be.null

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //MTS Timestamp of Notification
                expect(data[2][0]).to.be.a('number')
                expect(data[2][0]).to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Type 
                expect(data[2][1]).to.be.a('string')
                expect(data[2][1]).to.equal('on-req')

                //Message ID
                expect(data[2][2]).to.be.a('null')

                //Placeholder
                expect(data[2][3]).to.be.a('null')

                //Notify Info
                expect(data[2][4]).to.be.a('Array')

                //Code
                expect(data[2][5]).to.be.a('null')

                //Status
                expect(data[2][6]).to.be.a('string')
                expect(data[2][6]).to.equal('SUCCESS')

                //Text
                expect(data[2][7]).to.be.a('string')
                expect(data[2][7]).to.equal('Submitting stop limit sell order for '+sellAmount+' '+symbolFirst+'.')

                //Order ID
                expect(data[2][4][0]).to.be.a('number')
                expect(data[2][4][0]).to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //GID
                expect(data[2][4][1]).to.be.a('null')

                //CID
                expect(data[2][4][2]).to.be.a('number')
                expect(data[2][4][2]).to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Symbol
                expect(data[2][4][3]).to.be.a('string')
                expect(data[2][4][3]).to.equal(symbol)

                //MTS Create
                expect(data[2][4][4]).to.be.a('number')
                expect(data[2][4][4]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][4][4]).to.match(/^(\d{13})?$/)

                //MTS Update
                expect(data[2][4][5]).to.be.a('number')
                expect(data[2][4][5]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][4][5]).to.match(/^(\d{13})?$/)
                expect(data[2][4][5]).to.equal(data[2][4][4])

                //Amount
                expect(data[2][4][6]).to.be.a('number')
                expect(data[2][4][6]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][4][6]).to.equal(sellAmount)

                //Amount Orig
                expect(data[2][4][7]).to.be.a('number')
                expect(data[2][4][7]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][4][7]).to.equal(sellAmount)

                //Order Type
                expect(data[2][4][8]).to.be.a('string')
                expect(data[2][4][8]).to.equal('STOP LIMIT')

                //Order Type Previous
                expect(data[2][4][9]).to.be.a('null')

                //MTS TIF
                expect(data[2][4][10]).to.be.a('null')

                //Placeholder
                expect(data[2][4][11]).to.be.a('null')

                //Flags
                expect(data[2][4][12]).to.be.a('number')
                expect(data[2][4][12]).to.equal(0)

                //Flags
                expect(data[2][4][13]).to.be.a('String')
                expect(data[2][4][13]).to.equal('ACTIVE')

                //Placeholder
                expect(data[2][4][14]).to.be.a('null')

                //Placeholder
                expect(data[2][4][15]).to.be.a('null')

                //Price
                expect(data[2][4][16]).to.be.a('number')
                expect(data[2][4][16]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][4][16]).to.equal(buyPrice)

                //Price Average
                expect(data[2][4][17]).to.be.a('number')
                expect(data[2][4][17]).to.equal(0)

                //Price Trailing
                expect(data[2][4][18]).to.be.a('number')
                expect(data[2][4][18]).to.equal(0)

                //Price Aux Limit
                expect(data[2][4][19]).to.be.a('number')
                expect(data[2][4][19]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][4][19]).to.equal(sellPrice)

                //Placeholder
                expect(data[2][4][20]).to.be.a('null')

                //Placeholder
                expect(data[2][4][21]).to.be.a('null')

                //Placeholder
                expect(data[2][4][22]).to.be.a('null')

                //Notify
                expect(data[2][4][23]).to.be.a('number')
                expect(data[2][4][23]).to.equal(0)

                //Hidden
                expect(data[2][4][24]).to.be.a('null')

                //Placeholder
                expect(data[2][4][25]).to.be.a('null')

                //Placeholder
                expect(data[2][4][26]).to.be.a('null')

                //Placeholder
                expect(data[2][4][27]).to.be.a('null')

                //Routing
                expect(data[2][4][28]).to.be.a('string')
                expect(data[2][4][28]).to.equal('API>BFX')

                //Placeholder
                expect(data[2][4][29]).to.be.a('null')

                //Placeholder
                expect(data[2][4][30]).to.be.a('null')

                //Placeholder
                expect(data[2][4][31]).to.be.a('null')

                console.log(`n message:`,JSON.stringify(data))
                } 

            // Target the on message [0,"on",[1187238101,null,1588148883485,"tBTCUSD",1588148883486,1588148883491,1,1,"LIMIT",null,null,null,0,"ACTIVE",null,null,500,0,0,0,null,null,null,0,0,null,null,null,"BFX",null,null,null]   
            if(data[1] == 'on'){
                expect(data).to.not.be.null

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //Order ID
                expect(data[2][0]).to.be.a('number')
                expect(data[2][0]).to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //GID
                expect(data[2][1]).to.be.a('null')

                //CID
                expect(data[2][2]).to.be.a('number')
                expect(data[2][2]).to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Symbol
                expect(data[2][3]).to.be.a('string')
                expect(data[2][3]).to.equal(symbol)

                //MTS Create
                expect(data[2][4]).to.be.a('number')
                expect(data[2][4]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][4]).to.match(/^(\d{13})?$/)

                //MTS Update
                expect(data[2][5]).to.be.a('number')
                expect(data[2][5]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][5]).to.match(/^(\d{13})?$/)
                expect(data[2][5]).to.be.greaterThan(data[2][4])

                //Amount
                expect(data[2][6]).to.be.a('number')
                expect(data[2][6]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][6]).to.equal(sellAmount)

                //Amount Orig
                expect(data[2][7]).to.be.a('number')
                expect(data[2][7]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][7]).to.equal(sellAmount)

                //Order Type
                expect(data[2][8]).to.be.a('string')
                expect(data[2][8]).to.equal('STOP LIMIT')

                //Order Type Previous
                expect(data[2][9]).to.be.a('null')

                //MTS TIF
                expect(data[2][10]).to.be.a('null')

                //Placeholder
                expect(data[2][11]).to.be.a('null')

                //Flags
                expect(data[2][12]).to.be.a('number')
                expect(data[2][12]).to.equal(0)

                //Flags
                expect(data[2][13]).to.be.a('String')
                expect(data[2][13]).to.contain('ACTIVE')

                //Placeholder
                expect(data[2][14]).to.be.a('null')

                //Placeholder
                expect(data[2][15]).to.be.a('null')

                //Price
                expect(data[2][16]).to.be.a('number')
                expect(data[2][16]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][16]).to.equal(buyPrice)

                //Price Average
                expect(data[2][17]).to.be.a('number')
                expect(data[2][17]).to.equal(0)

                //Price Trailing
                expect(data[2][18]).to.be.a('number')
                expect(data[2][18]).to.equal(0)

                //Price Aux Limit
                expect(data[2][19]).to.be.a('number')
                expect(data[2][19]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][19]).to.equal(sellPrice)

                //Placeholder
                expect(data[2][20]).to.be.a('null')

                //Placeholder
                expect(data[2][21]).to.be.a('null')

                //Placeholder
                expect(data[2][22]).to.be.a('null')

                //Notify
                expect(data[2][23]).to.be.a('number')
                expect(data[2][23]).to.equal(0)

                //Hidden
                expect(data[2][24]).to.be.a('number')
                expect(data[2][24]).to.equal(0)

                //Placeholder
                expect(data[2][25]).to.be.a('null')

                //Placeholder
                expect(data[2][26]).to.be.a('null')

                //Placeholder
                expect(data[2][27]).to.be.a('null')

                //Routing
                expect(data[2][28]).to.be.a('string')
                expect(data[2][28]).to.equal('API>BFX')

                //Placeholder
                expect(data[2][29]).to.be.a('null')

                //Placeholder
                expect(data[2][30]).to.be.a('null')

                //Placeholder
                expect(data[2][31]).to.be.a('null')
                
                console.log(`on message:`,JSON.stringify(data))
                done()
                }    
            }
        });

        it('New Trailing Stop Buy Order should return a correct Notification and Order Info message', function(done) {

        this.timeout(10000)

            let payload = JSON.stringify([
                0,
                "on",
                null,
                {
                "type": "TRAILING STOP",
                "symbol": symbol,
                "amount": buyAmount.toString(),
                "price": buyPrice.toString()
                }
                ])

            NewMarginOrderSocket.send(payload);

        NewMarginOrderSocket.onmessage = function (event) {
            let data = JSON.parse(event.data)
            
            // Target the n message [0,"n",[1588148817.151,"on-req",null,null,[1187238099,null,1588148817151,"tBTCUSD",1588148817151,1588148817151,1,1,"LIMIT",null,null,null,0,"ACTIVE",null,null,500,0,0,0,null,null,null,0,null,null,null,null,"BFX",null,null,null],null,"SUCCESS","Submitting limit buy order for 1 BTC."]]]        

            if(data[1] == 'n'){
                expect(data).to.not.be.null

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //MTS Timestamp of Notification
                expect(data[2][0]).to.be.a('number')
                expect(data[2][0]).to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Type 
                expect(data[2][1]).to.be.a('string')
                expect(data[2][1]).to.equal('on-req')

                //Message ID
                expect(data[2][2]).to.be.a('null')

                //Placeholder
                expect(data[2][3]).to.be.a('null')

                //Notify Info
                expect(data[2][4]).to.be.a('Array')

                //Code
                expect(data[2][5]).to.be.a('null')

                //Status
                expect(data[2][6]).to.be.a('string')
                expect(data[2][6]).to.equal('SUCCESS')

                //Text
                expect(data[2][7]).to.be.a('string')
                expect(data[2][7]).to.equal('Submitting trailing stop buy order for '+buyAmount+' '+symbolFirst+'.')

                //Order ID
                expect(data[2][4][0]).to.be.a('number')
                expect(data[2][4][0]).to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //GID
                expect(data[2][4][1]).to.be.a('null')

                //CID
                expect(data[2][4][2]).to.be.a('number')
                expect(data[2][4][2]).to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Symbol
                expect(data[2][4][3]).to.be.a('string')
                expect(data[2][4][3]).to.equal(symbol)

                //MTS Create
                expect(data[2][4][4]).to.be.a('number')
                expect(data[2][4][4]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][4][4]).to.match(/^(\d{13})?$/)

                //MTS Update
                expect(data[2][4][5]).to.be.a('number')
                expect(data[2][4][5]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][4][5]).to.match(/^(\d{13})?$/)
                expect(data[2][4][5]).to.equal(data[2][4][4])

                //Amount
                expect(data[2][4][6]).to.be.a('number')
                expect(data[2][4][6]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][4][6]).to.equal(buyAmount)

                //Amount Orig
                expect(data[2][4][7]).to.be.a('number')
                expect(data[2][4][7]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][4][7]).to.equal(buyAmount)

                //Order Type
                expect(data[2][4][8]).to.be.a('string')
                expect(data[2][4][8]).to.equal('TRAILING STOP')

                //Order Type Previous
                expect(data[2][4][9]).to.be.a('null')

                //MTS TIF
                expect(data[2][4][10]).to.be.a('null')

                //Placeholder
                expect(data[2][4][11]).to.be.a('null')

                //Flags
                expect(data[2][4][12]).to.be.a('number')
                expect(data[2][4][12]).to.equal(0)

                //Flags
                expect(data[2][4][13]).to.be.a('String')
                expect(data[2][4][13]).to.equal('ACTIVE')

                //Placeholder
                expect(data[2][4][14]).to.be.a('null')

                //Placeholder
                expect(data[2][4][15]).to.be.a('null')

                //Price
                expect(data[2][4][16]).to.be.a('number')
                expect(data[2][4][16]).to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Price Average
                expect(data[2][4][17]).to.be.a('number')
                expect(data[2][4][17]).to.equal(0)

                //Price Trailing
                expect(data[2][4][18]).to.be.a('number')
                expect(data[2][4][18]).to.equal(buyPrice)

                //Price Aux Limit
                expect(data[2][4][19]).to.be.a('number')
                expect(data[2][4][19]).to.equal(0)

                //Placeholder
                expect(data[2][4][20]).to.be.a('null')

                //Placeholder
                expect(data[2][4][21]).to.be.a('null')

                //Placeholder
                expect(data[2][4][22]).to.be.a('null')

                //Notify
                expect(data[2][4][23]).to.be.a('number')
                expect(data[2][4][23]).to.equal(0)

                //Hidden
                expect(data[2][4][24]).to.be.a('null')

                //Placeholder
                expect(data[2][4][25]).to.be.a('null')

                //Placeholder
                expect(data[2][4][26]).to.be.a('null')

                //Placeholder
                expect(data[2][4][27]).to.be.a('null')

                //Routing
                expect(data[2][4][28]).to.be.a('string')
                expect(data[2][4][28]).to.equal('API>BFX')

                //Placeholder
                expect(data[2][4][29]).to.be.a('null')

                //Placeholder
                expect(data[2][4][30]).to.be.a('null')

                //Placeholder
                expect(data[2][4][31]).to.be.a('null')

                console.log(`n message:`,JSON.stringify(data))
                } 

            // Target the on message [0,"on",[1187238101,null,1588148883485,"tBTCUSD",1588148883486,1588148883491,1,1,"LIMIT",null,null,null,0,"ACTIVE",null,null,500,0,0,0,null,null,null,0,0,null,null,null,"BFX",null,null,null]   
            if(data[1] == 'on'){
                expect(data).to.not.be.null

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //Order ID
                expect(data[2][0]).to.be.a('number')
                expect(data[2][0]).to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //GID
                expect(data[2][1]).to.be.a('null')

                //CID
                expect(data[2][2]).to.be.a('number')
                expect(data[2][2]).to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Symbol
                expect(data[2][3]).to.be.a('string')
                expect(data[2][3]).to.equal(symbol)

                //MTS Create
                expect(data[2][4]).to.be.a('number')
                expect(data[2][4]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][4]).to.match(/^(\d{13})?$/)

                //MTS Update
                expect(data[2][5]).to.be.a('number')
                expect(data[2][5]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][5]).to.match(/^(\d{13})?$/)
                expect(data[2][5]).to.be.greaterThan(data[2][4])

                //Amount
                expect(data[2][6]).to.be.a('number')
                expect(data[2][6]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][6]).to.equal(buyAmount)

                //Amount Orig
                expect(data[2][7]).to.be.a('number')
                expect(data[2][7]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][7]).to.equal(buyAmount)

                //Order Type
                expect(data[2][8]).to.be.a('string')
                expect(data[2][8]).to.equal('TRAILING STOP')

                //Order Type Previous
                expect(data[2][9]).to.be.a('null')

                //MTS TIF
                expect(data[2][10]).to.be.a('null')

                //Placeholder
                expect(data[2][11]).to.be.a('null')

                //Flags
                expect(data[2][12]).to.be.a('number')
                expect(data[2][12]).to.equal(0)

                //Flags
                expect(data[2][13]).to.be.a('string')
                expect(data[2][13]).to.contain('ACTIVE')

                //Placeholder
                expect(data[2][14]).to.be.a('null')

                //Placeholder
                expect(data[2][15]).to.be.a('null')

                //Price
                expect(data[2][16]).to.be.a('number')
                expect(data[2][16]).to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Price Average
                expect(data[2][17]).to.be.a('number')
                expect(data[2][17]).to.equal(0)

                //Price Trailing
                expect(data[2][18]).to.be.a('number')
                expect(data[2][18]).to.equal(buyPrice)

                //Price Aux Limit
                expect(data[2][19]).to.be.a('number')
                expect(data[2][19]).to.equal(0)

                //Placeholder
                expect(data[2][20]).to.be.a('null')

                //Placeholder
                expect(data[2][21]).to.be.a('null')

                //Placeholder
                expect(data[2][22]).to.be.a('null')

                //Notify
                expect(data[2][23]).to.be.a('number')
                expect(data[2][23]).to.equal(0)

                //Hidden
                expect(data[2][24]).to.be.a('number')
                expect(data[2][24]).to.equal(0)

                //Placeholder
                expect(data[2][25]).to.be.a('null')

                //Placeholder
                expect(data[2][26]).to.be.a('null')

                //Placeholder
                expect(data[2][27]).to.be.a('null')

                //Routing
                expect(data[2][28]).to.be.a('string')
                expect(data[2][28]).to.equal('API>BFX')

                //Placeholder
                expect(data[2][29]).to.be.a('null')

                //Placeholder
                expect(data[2][30]).to.be.a('null')

                //Placeholder
                expect(data[2][31]).to.be.a('null')
                
                console.log(`on message:`,JSON.stringify(data))
                done()
                }    
            }
        });

        it('New Trailing Stop Sell Order should return a correct Notification and Order Info message', function(done) {

        this.timeout(10000)

            let payload = JSON.stringify([
                0,
                "on",
                null,
                {
                "type": "TRAILING STOP",
                "symbol": symbol,
                "amount": sellAmount.toString(),
                "price": buyPrice.toString()
                }
                ])

            NewMarginOrderSocket.send(payload);

        NewMarginOrderSocket.onmessage = function (event) {
            let data = JSON.parse(event.data)
            
            // Target the n message [0,"n",[1588148817.151,"on-req",null,null,[1187238099,null,1588148817151,"tBTCUSD",1588148817151,1588148817151,1,1,"LIMIT",null,null,null,0,"ACTIVE",null,null,500,0,0,0,null,null,null,0,null,null,null,null,"BFX",null,null,null],null,"SUCCESS","Submitting limit buy order for 1 BTC."]]]        

            if(data[1] == 'n'){
                expect(data).to.not.be.null

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //MTS Timestamp of Notification
                expect(data[2][0]).to.be.a('number')
                expect(data[2][0]).to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Type 
                expect(data[2][1]).to.be.a('string')
                expect(data[2][1]).to.equal('on-req')

                //Message ID
                expect(data[2][2]).to.be.a('null')

                //Placeholder
                expect(data[2][3]).to.be.a('null')

                //Notify Info
                expect(data[2][4]).to.be.a('Array')

                //Code
                expect(data[2][5]).to.be.a('null')

                //Status
                expect(data[2][6]).to.be.a('string')
                expect(data[2][6]).to.equal('SUCCESS')

                //Text
                expect(data[2][7]).to.be.a('string')
                expect(data[2][7]).to.equal('Submitting trailing stop sell order for '+sellAmount+' '+symbolFirst+'.')

                //Order ID
                expect(data[2][4][0]).to.be.a('number')
                expect(data[2][4][0]).to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //GID
                expect(data[2][4][1]).to.be.a('null')

                //CID
                expect(data[2][4][2]).to.be.a('number')
                expect(data[2][4][2]).to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Symbol
                expect(data[2][4][3]).to.be.a('string')
                expect(data[2][4][3]).to.equal(symbol)

                //MTS Create
                expect(data[2][4][4]).to.be.a('number')
                expect(data[2][4][4]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][4][4]).to.match(/^(\d{13})?$/)

                //MTS Update
                expect(data[2][4][5]).to.be.a('number')
                expect(data[2][4][5]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][4][5]).to.match(/^(\d{13})?$/)
                expect(data[2][4][5]).to.equal(data[2][4][4])

                //Amount
                expect(data[2][4][6]).to.be.a('number')
                expect(data[2][4][6]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][4][6]).to.equal(sellAmount)

                //Amount Orig
                expect(data[2][4][7]).to.be.a('number')
                expect(data[2][4][7]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][4][7]).to.equal(sellAmount)

                //Order Type
                expect(data[2][4][8]).to.be.a('string')
                expect(data[2][4][8]).to.equal('TRAILING STOP')

                //Order Type Previous
                expect(data[2][4][9]).to.be.a('null')

                //MTS TIF
                expect(data[2][4][10]).to.be.a('null')

                //Placeholder
                expect(data[2][4][11]).to.be.a('null')

                //Flags
                expect(data[2][4][12]).to.be.a('number')
                expect(data[2][4][12]).to.equal(0)

                //Flags
                expect(data[2][4][13]).to.be.a('String')
                expect(data[2][4][13]).to.equal('ACTIVE')

                //Placeholder
                expect(data[2][4][14]).to.be.a('null')

                //Placeholder
                expect(data[2][4][15]).to.be.a('null')

                //Price
                expect(data[2][4][16]).to.be.a('number')
                expect(data[2][4][16]).to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Price Average
                expect(data[2][4][17]).to.be.a('number')
                expect(data[2][4][17]).to.equal(0)

                //Price Trailing
                expect(data[2][4][18]).to.be.a('number')
                expect(data[2][4][18]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][4][18]).to.equal(buyPrice)

                //Price Aux Limit
                expect(data[2][4][19]).to.be.a('number')
                expect(data[2][4][19]).to.equal(0)

                //Placeholder
                expect(data[2][4][20]).to.be.a('null')

                //Placeholder
                expect(data[2][4][21]).to.be.a('null')

                //Placeholder
                expect(data[2][4][22]).to.be.a('null')

                //Notify
                expect(data[2][4][23]).to.be.a('number')
                expect(data[2][4][23]).to.equal(0)

                //Hidden
                expect(data[2][4][24]).to.be.a('null')

                //Placeholder
                expect(data[2][4][25]).to.be.a('null')

                //Placeholder
                expect(data[2][4][26]).to.be.a('null')

                //Placeholder
                expect(data[2][4][27]).to.be.a('null')

                //Routing
                expect(data[2][4][28]).to.be.a('string')
                expect(data[2][4][28]).to.equal('API>BFX')

                //Placeholder
                expect(data[2][4][29]).to.be.a('null')

                //Placeholder
                expect(data[2][4][30]).to.be.a('null')

                //Placeholder
                expect(data[2][4][31]).to.be.a('null')

                console.log(`n message:`,JSON.stringify(data))
                } 

            // Target the on message [0,"on",[1187238101,null,1588148883485,"tBTCUSD",1588148883486,1588148883491,1,1,"LIMIT",null,null,null,0,"ACTIVE",null,null,500,0,0,0,null,null,null,0,0,null,null,null,"BFX",null,null,null]   
            if(data[1] == 'on'){
                expect(data).to.not.be.null

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //Order ID
                expect(data[2][0]).to.be.a('number')
                expect(data[2][0]).to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //GID
                expect(data[2][1]).to.be.a('null')

                //CID
                expect(data[2][2]).to.be.a('number')
                expect(data[2][2]).to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Symbol
                expect(data[2][3]).to.be.a('string')
                expect(data[2][3]).to.equal(symbol)

                //MTS Create
                expect(data[2][4]).to.be.a('number')
                expect(data[2][4]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][4]).to.match(/^(\d{13})?$/)

                //MTS Update
                expect(data[2][5]).to.be.a('number')
                expect(data[2][5]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][5]).to.match(/^(\d{13})?$/)
                expect(data[2][5]).to.be.greaterThan(data[2][4])

                //Amount
                expect(data[2][6]).to.be.a('number')
                expect(data[2][6]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][6]).to.equal(sellAmount)

                //Amount Orig
                expect(data[2][7]).to.be.a('number')
                expect(data[2][7]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][7]).to.equal(sellAmount)

                //Order Type
                expect(data[2][8]).to.be.a('string')
                expect(data[2][8]).to.equal('TRAILING STOP')

                //Order Type Previous
                expect(data[2][9]).to.be.a('null')

                //MTS TIF
                expect(data[2][10]).to.be.a('null')

                //Placeholder
                expect(data[2][11]).to.be.a('null')

                //Flags
                expect(data[2][12]).to.be.a('number')
                expect(data[2][12]).to.equal(0)

                //Flags
                expect(data[2][13]).to.be.a('String')
                expect(data[2][13]).to.contain('ACTIVE')

                //Placeholder
                expect(data[2][14]).to.be.a('null')

                //Placeholder
                expect(data[2][15]).to.be.a('null')

                //Price
                expect(data[2][16]).to.be.a('number')
                expect(data[2][16]).to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Price Average
                expect(data[2][17]).to.be.a('number')
                expect(data[2][17]).to.equal(0)

                //Price Trailing
                expect(data[2][18]).to.be.a('number')
                expect(data[2][18]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][18]).to.equal(buyPrice)

                //Price Aux Limit
                expect(data[2][19]).to.be.a('number')
                expect(data[2][19]).to.equal(0)

                //Placeholder
                expect(data[2][20]).to.be.a('null')

                //Placeholder
                expect(data[2][21]).to.be.a('null')

                //Placeholder
                expect(data[2][22]).to.be.a('null')

                //Notify
                expect(data[2][23]).to.be.a('number')
                expect(data[2][23]).to.equal(0)

                //Hidden
                expect(data[2][24]).to.be.a('number')
                expect(data[2][24]).to.equal(0)

                //Placeholder
                expect(data[2][25]).to.be.a('null')

                //Placeholder
                expect(data[2][26]).to.be.a('null')

                //Placeholder
                expect(data[2][27]).to.be.a('null')

                //Routing
                expect(data[2][28]).to.be.a('string')
                expect(data[2][28]).to.equal('API>BFX')

                //Placeholder
                expect(data[2][29]).to.be.a('null')

                //Placeholder
                expect(data[2][30]).to.be.a('null')

                //Placeholder
                expect(data[2][31]).to.be.a('null')
                
                console.log(`on message:`,JSON.stringify(data))
                done()
                }    
            }
        });

        it('New FOK Buy Order should return a correct Notification and Order Info message', function(done) {

        this.timeout(10000)

            let payload = JSON.stringify([
                0,
                "on",
                null,
                {
                "type": "FOK",
                "symbol": symbol,
                "amount": buyAmount.toString(),
                "price": buyPrice.toString()
                }
                ])

            NewMarginOrderSocket.send(payload);

        NewMarginOrderSocket.onmessage = function (event) {
            let data = JSON.parse(event.data)
            
            // Target the n message [0,"n",[1588148817.151,"on-req",null,null,[1187238099,null,1588148817151,"tBTCUSD",1588148817151,1588148817151,1,1,"LIMIT",null,null,null,0,"ACTIVE",null,null,500,0,0,0,null,null,null,0,null,null,null,null,"BFX",null,null,null],null,"SUCCESS","Submitting limit buy order for 1 BTC."]]]        

            if(data[1] == 'n'){
                expect(data).to.not.be.null

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //MTS Timestamp of Notification
                expect(data[2][0]).to.be.a('number')
                expect(data[2][0]).to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Type 
                expect(data[2][1]).to.be.a('string')
                expect(data[2][1]).to.equal('on-req')

                //Message ID
                expect(data[2][2]).to.be.a('null')

                //Placeholder
                expect(data[2][3]).to.be.a('null')

                //Notify Info
                expect(data[2][4]).to.be.a('Array')

                //Code
                expect(data[2][5]).to.be.a('null')

                //Status
                expect(data[2][6]).to.be.a('string')
                expect(data[2][6]).to.equal('SUCCESS')

                //Text
                expect(data[2][7]).to.be.a('string')
                expect(data[2][7]).to.equal('Submitting fok buy order for '+buyAmount+' '+symbolFirst+'.')

                //Order ID
                expect(data[2][4][0]).to.be.a('number')
                expect(data[2][4][0]).to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //GID
                expect(data[2][4][1]).to.be.a('null')

                //CID
                expect(data[2][4][2]).to.be.a('number')
                expect(data[2][4][2]).to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Symbol
                expect(data[2][4][3]).to.be.a('string')
                expect(data[2][4][3]).to.equal(symbol)

                //MTS Create
                expect(data[2][4][4]).to.be.a('number')
                expect(data[2][4][4]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][4][4]).to.match(/^(\d{13})?$/)

                //MTS Update
                expect(data[2][4][5]).to.be.a('number')
                expect(data[2][4][5]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][4][5]).to.match(/^(\d{13})?$/)
                expect(data[2][4][5]).to.equal(data[2][4][4])

                //Amount
                expect(data[2][4][6]).to.be.a('number')
                expect(data[2][4][6]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][4][6]).to.equal(buyAmount)

                //Amount Orig
                expect(data[2][4][7]).to.be.a('number')
                expect(data[2][4][7]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][4][7]).to.equal(buyAmount)

                //Order Type
                expect(data[2][4][8]).to.be.a('string')
                expect(data[2][4][8]).to.equal('FOK')

                //Order Type Previous
                expect(data[2][4][9]).to.be.a('null')

                //MTS TIF
                expect(data[2][4][10]).to.be.a('null')

                //Placeholder
                expect(data[2][4][11]).to.be.a('null')

                //Flags
                expect(data[2][4][12]).to.be.a('number')
                expect(data[2][4][12]).to.equal(0)

                //Flags
                expect(data[2][4][13]).to.be.a('String')
                expect(data[2][4][13]).to.equal('ACTIVE')

                //Placeholder
                expect(data[2][4][14]).to.be.a('null')

                //Placeholder
                expect(data[2][4][15]).to.be.a('null')

                //Price
                expect(data[2][4][16]).to.be.a('number')
                expect(data[2][4][16]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][4][16]).to.equal(buyPrice)

                //Price Average
                expect(data[2][4][17]).to.be.a('number')
                expect(data[2][4][17]).to.equal(0)

                //Price Trailing
                expect(data[2][4][18]).to.be.a('number')
                expect(data[2][4][18]).to.equal(0)

                //Price Aux Limit
                expect(data[2][4][19]).to.be.a('number')
                expect(data[2][4][19]).to.equal(0)

                //Placeholder
                expect(data[2][4][20]).to.be.a('null')

                //Placeholder
                expect(data[2][4][21]).to.be.a('null')

                //Placeholder
                expect(data[2][4][22]).to.be.a('null')

                //Notify
                expect(data[2][4][23]).to.be.a('number')
                expect(data[2][4][23]).to.equal(0)

                //Hidden
                expect(data[2][4][24]).to.be.a('null')

                //Placeholder
                expect(data[2][4][25]).to.be.a('null')

                //Placeholder
                expect(data[2][4][26]).to.be.a('null')

                //Placeholder
                expect(data[2][4][27]).to.be.a('null')

                //Routing
                expect(data[2][4][28]).to.be.a('string')
                expect(data[2][4][28]).to.equal('API>BFX')

                //Placeholder
                expect(data[2][4][29]).to.be.a('null')

                //Placeholder
                expect(data[2][4][30]).to.be.a('null')

                //Placeholder
                expect(data[2][4][31]).to.be.a('null')

                console.log(`n message:`,JSON.stringify(data))
                } 

            // Target the oc message [0,"oc",[1187238160,null,1588158739438,"tBTCUSD",1588158739438,1588158739444,0,0.001,"MARKET",null,null,null,0,"EXECUTED @ 8150.0(0.001)",null,null,8150,8150,0,0,null,null,null,0,0,null,null,null,"BFX",null,null,null]]    
            if(data[1] == 'oc'){
                expect(data).to.not.be.null

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //Order ID
                expect(data[2][0]).to.be.a('number')
                expect(data[2][0]).to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //GID
                expect(data[2][1]).to.be.a('null')

                //CID
                expect(data[2][2]).to.be.a('number')
                expect(data[2][2]).to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Symbol
                expect(data[2][3]).to.be.a('string')
                expect(data[2][3]).to.equal(symbol)

                //MTS Create
                expect(data[2][4]).to.be.a('number')
                expect(data[2][4]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][4]).to.match(/^(\d{13})?$/)

                //MTS Update
                expect(data[2][5]).to.be.a('number')
                expect(data[2][5]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][5]).to.match(/^(\d{13})?$/)
                expect(data[2][5]).to.be.greaterThan(data[2][4])

                //Amount
                expect(data[2][6]).to.be.a('number')
                expect(data[2][6]).to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Amount Orig
                expect(data[2][7]).to.be.a('number')
                expect(data[2][7]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][7]).to.equal(buyAmount)

                //Order Type
                expect(data[2][8]).to.be.a('string')
                expect(data[2][8]).to.equal('FOK')

                //Order Type Previous
                expect(data[2][9]).to.be.a('null')

                //MTS TIF
                expect(data[2][10]).to.be.a('null')

                //Placeholder
                expect(data[2][11]).to.be.a('null')

                //Flags
                expect(data[2][12]).to.be.a('number')
                expect(data[2][12]).to.equal(0)

                //Flags
                expect(data[2][13]).to.be.a('String')
                expect(data[2][13]).to.contain('FILLORKILL CANCELED')

                //Placeholder
                expect(data[2][14]).to.be.a('null')

                //Placeholder
                expect(data[2][15]).to.be.a('null')

                //Price
                expect(data[2][16]).to.be.a('number')
                expect(data[2][16]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][16]).to.equal(buyPrice)

                //Price Average
                expect(data[2][17]).to.be.a('number')
                expect(data[2][17]).to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Price Trailing
                expect(data[2][18]).to.be.a('number')
                expect(data[2][18]).to.equal(0)

                //Price Aux Limit
                expect(data[2][19]).to.be.a('number')
                expect(data[2][19]).to.equal(0)

                //Placeholder
                expect(data[2][20]).to.be.a('null')

                //Placeholder
                expect(data[2][21]).to.be.a('null')

                //Placeholder
                expect(data[2][22]).to.be.a('null')

                //Notify
                expect(data[2][23]).to.be.a('number')
                expect(data[2][23]).to.equal(0)

                //Hidden
                expect(data[2][24]).to.be.a('number')
                expect(data[2][24]).to.equal(0)

                //Placeholder
                expect(data[2][25]).to.be.a('null')

                //Placeholder
                expect(data[2][26]).to.be.a('null')

                //Placeholder
                expect(data[2][27]).to.be.a('null')

                //Routing
                expect(data[2][28]).to.be.a('string')
                expect(data[2][28]).to.equal('API>BFX')

                //Placeholder
                expect(data[2][29]).to.be.a('null')

                //Placeholder
                expect(data[2][30]).to.be.a('null')

                //Placeholder
                expect(data[2][31]).to.be.a('null')
                
                console.log(`on message:`,JSON.stringify(data))
                done()
                }    
            }
        });

        it('New FOK Sell Order should return a correct Notification and Order Info message', function(done) {

        this.timeout(10000)

            let payload = JSON.stringify([
                0,
                "on",
                null,
                {
                "type": "FOK",
                "symbol": symbol,
                "amount": sellAmount.toString(),
                "price": sellPrice.toString()
                }
                ])

            NewMarginOrderSocket.send(payload);

        NewMarginOrderSocket.onmessage = function (event) {
            let data = JSON.parse(event.data)
            
            // Target the n message [0,"n",[1588148817.151,"on-req",null,null,[1187238099,null,1588148817151,"tBTCUSD",1588148817151,1588148817151,1,1,"LIMIT",null,null,null,0,"ACTIVE",null,null,500,0,0,0,null,null,null,0,null,null,null,null,"BFX",null,null,null],null,"SUCCESS","Submitting limit buy order for 1 BTC."]]]        

            if(data[1] == 'n'){
                expect(data).to.not.be.null

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //MTS Timestamp of Notification
                expect(data[2][0]).to.be.a('number')
                expect(data[2][0]).to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Type 
                expect(data[2][1]).to.be.a('string')
                expect(data[2][1]).to.equal('on-req')

                //Message ID
                expect(data[2][2]).to.be.a('null')

                //Placeholder
                expect(data[2][3]).to.be.a('null')

                //Notify Info
                expect(data[2][4]).to.be.a('Array')

                //Code
                expect(data[2][5]).to.be.a('null')

                //Status
                expect(data[2][6]).to.be.a('string')
                expect(data[2][6]).to.equal('SUCCESS')

                //Text
                expect(data[2][7]).to.be.a('string')
                expect(data[2][7]).to.equal('Submitting fok sell order for '+sellAmount+' '+symbolFirst+'.')

                //Order ID
                expect(data[2][4][0]).to.be.a('number')
                expect(data[2][4][0]).to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //GID
                expect(data[2][4][1]).to.be.a('null')

                //CID
                expect(data[2][4][2]).to.be.a('number')
                expect(data[2][4][2]).to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Symbol
                expect(data[2][4][3]).to.be.a('string')
                expect(data[2][4][3]).to.equal(symbol)

                //MTS Create
                expect(data[2][4][4]).to.be.a('number')
                expect(data[2][4][4]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][4][4]).to.match(/^(\d{13})?$/)

                //MTS Update
                expect(data[2][4][5]).to.be.a('number')
                expect(data[2][4][5]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][4][5]).to.match(/^(\d{13})?$/)
                expect(data[2][4][5]).to.equal(data[2][4][4])

                //Amount
                expect(data[2][4][6]).to.be.a('number')
                expect(data[2][4][6]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][4][6]).to.equal(sellAmount)

                //Amount Orig
                expect(data[2][4][7]).to.be.a('number')
                expect(data[2][4][7]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][4][7]).to.equal(sellAmount)

                //Order Type
                expect(data[2][4][8]).to.be.a('string')
                expect(data[2][4][8]).to.equal('FOK')

                //Order Type Previous
                expect(data[2][4][9]).to.be.a('null')

                //MTS TIF
                expect(data[2][4][10]).to.be.a('null')

                //Placeholder
                expect(data[2][4][11]).to.be.a('null')

                //Flags
                expect(data[2][4][12]).to.be.a('number')
                expect(data[2][4][12]).to.equal(0)

                //Flags
                expect(data[2][4][13]).to.be.a('String')
                expect(data[2][4][13]).to.equal('ACTIVE')

                //Placeholder
                expect(data[2][4][14]).to.be.a('null')

                //Placeholder
                expect(data[2][4][15]).to.be.a('null')

                //Price
                expect(data[2][4][16]).to.be.a('number')
                expect(data[2][4][16]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][4][16]).to.equal(sellPrice)

                //Price Average
                expect(data[2][4][17]).to.be.a('number')
                expect(data[2][4][17]).to.equal(0)

                //Price Trailing
                expect(data[2][4][18]).to.be.a('number')
                expect(data[2][4][18]).to.equal(0)

                //Price Aux Limit
                expect(data[2][4][19]).to.be.a('number')
                expect(data[2][4][19]).to.equal(0)

                //Placeholder
                expect(data[2][4][20]).to.be.a('null')

                //Placeholder
                expect(data[2][4][21]).to.be.a('null')

                //Placeholder
                expect(data[2][4][22]).to.be.a('null')

                //Notify
                expect(data[2][4][23]).to.be.a('number')
                expect(data[2][4][23]).to.equal(0)

                //Hidden
                expect(data[2][4][24]).to.be.a('null')

                //Placeholder
                expect(data[2][4][25]).to.be.a('null')

                //Placeholder
                expect(data[2][4][26]).to.be.a('null')

                //Placeholder
                expect(data[2][4][27]).to.be.a('null')

                //Routing
                expect(data[2][4][28]).to.be.a('string')
                expect(data[2][4][28]).to.equal('API>BFX')

                //Placeholder
                expect(data[2][4][29]).to.be.a('null')

                //Placeholder
                expect(data[2][4][30]).to.be.a('null')

                //Placeholder
                expect(data[2][4][31]).to.be.a('null')

                console.log(`n message:`,JSON.stringify(data))
                } 

            // Target the oc message [0,"oc",[1187238160,null,1588158739438,"tBTCUSD",1588158739438,1588158739444,0,0.001,"MARKET",null,null,null,0,"EXECUTED @ 8150.0(0.001)",null,null,8150,8150,0,0,null,null,null,0,0,null,null,null,"BFX",null,null,null]]    
            if(data[1] == 'oc'){
                expect(data).to.not.be.null

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //Order ID
                expect(data[2][0]).to.be.a('number')
                expect(data[2][0]).to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //GID
                expect(data[2][1]).to.be.a('null')

                //CID
                expect(data[2][2]).to.be.a('number')
                expect(data[2][2]).to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Symbol
                expect(data[2][3]).to.be.a('string')
                expect(data[2][3]).to.equal(symbol)

                //MTS Create
                expect(data[2][4]).to.be.a('number')
                expect(data[2][4]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][4]).to.match(/^(\d{13})?$/)

                //MTS Update
                expect(data[2][5]).to.be.a('number')
                expect(data[2][5]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][5]).to.match(/^(\d{13})?$/)
                expect(data[2][5]).to.be.greaterThan(data[2][4])

                //Amount
                expect(data[2][6]).to.be.a('number')
                expect(data[2][6]).to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Amount Orig
                expect(data[2][7]).to.be.a('number')
                expect(data[2][7]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][7]).to.equal(sellAmount)

                //Order Type
                expect(data[2][8]).to.be.a('string')
                expect(data[2][8]).to.equal('FOK')

                //Order Type Previous
                expect(data[2][9]).to.be.a('null')

                //MTS TIF
                expect(data[2][10]).to.be.a('null')

                //Placeholder
                expect(data[2][11]).to.be.a('null')

                //Flags
                expect(data[2][12]).to.be.a('number')
                expect(data[2][12]).to.equal(0)

                //Flags
                expect(data[2][13]).to.be.a('String')
                expect(data[2][13]).to.contain('FILLORKILL CANCELED')

                //Placeholder
                expect(data[2][14]).to.be.a('null')

                //Placeholder
                expect(data[2][15]).to.be.a('null')

                //Price
                expect(data[2][16]).to.be.a('number')
                expect(data[2][16]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][16]).to.equal(sellPrice)

                //Price Average
                expect(data[2][17]).to.be.a('number')
                expect(data[2][17]).to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Price Trailing
                expect(data[2][18]).to.be.a('number')
                expect(data[2][18]).to.equal(0)

                //Price Aux Limit
                expect(data[2][19]).to.be.a('number')
                expect(data[2][19]).to.equal(0)

                //Placeholder
                expect(data[2][20]).to.be.a('null')

                //Placeholder
                expect(data[2][21]).to.be.a('null')

                //Placeholder
                expect(data[2][22]).to.be.a('null')

                //Notify
                expect(data[2][23]).to.be.a('number')
                expect(data[2][23]).to.equal(0)

                //Hidden
                expect(data[2][24]).to.be.a('number')
                expect(data[2][24]).to.equal(0)

                //Placeholder
                expect(data[2][25]).to.be.a('null')

                //Placeholder
                expect(data[2][26]).to.be.a('null')

                //Placeholder
                expect(data[2][27]).to.be.a('null')

                //Routing
                expect(data[2][28]).to.be.a('string')
                expect(data[2][28]).to.equal('API>BFX')

                //Placeholder
                expect(data[2][29]).to.be.a('null')

                //Placeholder
                expect(data[2][30]).to.be.a('null')

                //Placeholder
                expect(data[2][31]).to.be.a('null')
                
                console.log(`on message:`,JSON.stringify(data))
                done()
                }    
            }
        });

        it('New IOC Buy Order should return a correct Notification and Order Info message', function(done) {

        this.timeout(10000)

            let payload = JSON.stringify([
                0,
                "on",
                null,
                {
                "type": "IOC",
                "symbol": symbol,
                "amount": buyAmount.toString(),
                "price": buyPrice.toString()
                }
                ])

            NewMarginOrderSocket.send(payload);

        NewMarginOrderSocket.onmessage = function (event) {
            let data = JSON.parse(event.data)
            
            // Target the n message [0,"n",[1588148817.151,"on-req",null,null,[1187238099,null,1588148817151,"tBTCUSD",1588148817151,1588148817151,1,1,"LIMIT",null,null,null,0,"ACTIVE",null,null,500,0,0,0,null,null,null,0,null,null,null,null,"BFX",null,null,null],null,"SUCCESS","Submitting limit buy order for 1 BTC."]]]        

            if(data[1] == 'n'){
                expect(data).to.not.be.null

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //MTS Timestamp of Notification
                expect(data[2][0]).to.be.a('number')
                expect(data[2][0]).to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Type 
                expect(data[2][1]).to.be.a('string')
                expect(data[2][1]).to.equal('on-req')

                //Message ID
                expect(data[2][2]).to.be.a('null')

                //Placeholder
                expect(data[2][3]).to.be.a('null')

                //Notify Info
                expect(data[2][4]).to.be.a('Array')

                //Code
                expect(data[2][5]).to.be.a('null')

                //Status
                expect(data[2][6]).to.be.a('string')
                expect(data[2][6]).to.equal('SUCCESS')

                //Text
                expect(data[2][7]).to.be.a('string')
                expect(data[2][7]).to.equal('Submitting ioc buy order for '+buyAmount+' '+symbolFirst+'.')

                //Order ID
                expect(data[2][4][0]).to.be.a('number')
                expect(data[2][4][0]).to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //GID
                expect(data[2][4][1]).to.be.a('null')

                //CID
                expect(data[2][4][2]).to.be.a('number')
                expect(data[2][4][2]).to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Symbol
                expect(data[2][4][3]).to.be.a('string')
                expect(data[2][4][3]).to.equal(symbol)

                //MTS Create
                expect(data[2][4][4]).to.be.a('number')
                expect(data[2][4][4]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][4][4]).to.match(/^(\d{13})?$/)

                //MTS Update
                expect(data[2][4][5]).to.be.a('number')
                expect(data[2][4][5]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][4][5]).to.match(/^(\d{13})?$/)
                expect(data[2][4][5]).to.equal(data[2][4][4])

                //Amount
                expect(data[2][4][6]).to.be.a('number')
                expect(data[2][4][6]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][4][6]).to.equal(buyAmount)

                //Amount Orig
                expect(data[2][4][7]).to.be.a('number')
                expect(data[2][4][7]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][4][7]).to.equal(buyAmount)

                //Order Type
                expect(data[2][4][8]).to.be.a('string')
                expect(data[2][4][8]).to.equal('IOC')

                //Order Type Previous
                expect(data[2][4][9]).to.be.a('null')

                //MTS TIF
                expect(data[2][4][10]).to.be.a('null')

                //Placeholder
                expect(data[2][4][11]).to.be.a('null')

                //Flags
                expect(data[2][4][12]).to.be.a('number')
                expect(data[2][4][12]).to.equal(0)

                //Flags
                expect(data[2][4][13]).to.be.a('String')
                expect(data[2][4][13]).to.equal('ACTIVE')

                //Placeholder
                expect(data[2][4][14]).to.be.a('null')

                //Placeholder
                expect(data[2][4][15]).to.be.a('null')

                //Price
                expect(data[2][4][16]).to.be.a('number')
                expect(data[2][4][16]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][4][16]).to.equal(buyPrice)

                //Price Average
                expect(data[2][4][17]).to.be.a('number')
                expect(data[2][4][17]).to.equal(0)

                //Price Trailing
                expect(data[2][4][18]).to.be.a('number')
                expect(data[2][4][18]).to.equal(0)

                //Price Aux Limit
                expect(data[2][4][19]).to.be.a('number')
                expect(data[2][4][19]).to.equal(0)

                //Placeholder
                expect(data[2][4][20]).to.be.a('null')

                //Placeholder
                expect(data[2][4][21]).to.be.a('null')

                //Placeholder
                expect(data[2][4][22]).to.be.a('null')

                //Notify
                expect(data[2][4][23]).to.be.a('number')
                expect(data[2][4][23]).to.equal(0)

                //Hidden
                expect(data[2][4][24]).to.be.a('null')

                //Placeholder
                expect(data[2][4][25]).to.be.a('null')

                //Placeholder
                expect(data[2][4][26]).to.be.a('null')

                //Placeholder
                expect(data[2][4][27]).to.be.a('null')

                //Routing
                expect(data[2][4][28]).to.be.a('string')
                expect(data[2][4][28]).to.equal('API>BFX')

                //Placeholder
                expect(data[2][4][29]).to.be.a('null')

                //Placeholder
                expect(data[2][4][30]).to.be.a('null')

                //Placeholder
                expect(data[2][4][31]).to.be.a('null')

                console.log(`n message:`,JSON.stringify(data))
                } 

            // Target the oc message [0,"oc",[1187238160,null,1588158739438,"tBTCUSD",1588158739438,1588158739444,0,0.001,"MARKET",null,null,null,0,"EXECUTED @ 8150.0(0.001)",null,null,8150,8150,0,0,null,null,null,0,0,null,null,null,"BFX",null,null,null]]    
            if(data[1] == 'oc'){
                expect(data).to.not.be.null

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //Order ID
                expect(data[2][0]).to.be.a('number')
                expect(data[2][0]).to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //GID
                expect(data[2][1]).to.be.a('null')

                //CID
                expect(data[2][2]).to.be.a('number')
                expect(data[2][2]).to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Symbol
                expect(data[2][3]).to.be.a('string')
                expect(data[2][3]).to.equal(symbol)

                //MTS Create
                expect(data[2][4]).to.be.a('number')
                expect(data[2][4]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][4]).to.match(/^(\d{13})?$/)

                //MTS Update
                expect(data[2][5]).to.be.a('number')
                expect(data[2][5]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][5]).to.match(/^(\d{13})?$/)
                expect(data[2][5]).to.be.greaterThan(data[2][4])

                //Amount
                expect(data[2][6]).to.be.a('number')
                expect(data[2][6]).to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Amount Orig
                expect(data[2][7]).to.be.a('number')
                expect(data[2][7]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][7]).to.equal(buyAmount)

                //Order Type
                expect(data[2][8]).to.be.a('string')
                expect(data[2][8]).to.equal('IOC')

                //Order Type Previous
                expect(data[2][9]).to.be.a('null')

                //MTS TIF
                expect(data[2][10]).to.be.a('null')

                //Placeholder
                expect(data[2][11]).to.be.a('null')

                //Flags
                expect(data[2][12]).to.be.a('number')
                expect(data[2][12]).to.equal(0)

                //Flags
                expect(data[2][13]).to.be.a('String')
                expect(data[2][13]).to.contain('IOC CANCELED')

                //Placeholder
                expect(data[2][14]).to.be.a('null')

                //Placeholder
                expect(data[2][15]).to.be.a('null')

                //Price
                expect(data[2][16]).to.be.a('number')
                expect(data[2][16]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][16]).to.equal(buyPrice)

                //Price Average
                expect(data[2][17]).to.be.a('number')
                expect(data[2][17]).to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Price Trailing
                expect(data[2][18]).to.be.a('number')
                expect(data[2][18]).to.equal(0)

                //Price Aux Limit
                expect(data[2][19]).to.be.a('number')
                expect(data[2][19]).to.equal(0)

                //Placeholder
                expect(data[2][20]).to.be.a('null')

                //Placeholder
                expect(data[2][21]).to.be.a('null')

                //Placeholder
                expect(data[2][22]).to.be.a('null')

                //Notify
                expect(data[2][23]).to.be.a('number')
                expect(data[2][23]).to.equal(0)

                //Hidden
                expect(data[2][24]).to.be.a('number')
                expect(data[2][24]).to.equal(0)

                //Placeholder
                expect(data[2][25]).to.be.a('null')

                //Placeholder
                expect(data[2][26]).to.be.a('null')

                //Placeholder
                expect(data[2][27]).to.be.a('null')

                //Routing
                expect(data[2][28]).to.be.a('string')
                expect(data[2][28]).to.equal('API>BFX')

                //Placeholder
                expect(data[2][29]).to.be.a('null')

                //Placeholder
                expect(data[2][30]).to.be.a('null')

                //Placeholder
                expect(data[2][31]).to.be.a('null')
                
                console.log(`on message:`,JSON.stringify(data))
                done()
                }    
            }
        });

        it('New IOC Sell Order should return a correct Notification and Order Info message', function(done) {

        this.timeout(10000)

            let payload = JSON.stringify([
                0,
                "on",
                null,
                {
                "type": "IOC",
                "symbol": symbol,
                "amount": sellAmount.toString(),
                "price": sellPrice.toString()
                }
                ])

            NewMarginOrderSocket.send(payload);

        NewMarginOrderSocket.onmessage = function (event) {
            let data = JSON.parse(event.data)
            
            // Target the n message [0,"n",[1588148817.151,"on-req",null,null,[1187238099,null,1588148817151,"tBTCUSD",1588148817151,1588148817151,1,1,"LIMIT",null,null,null,0,"ACTIVE",null,null,500,0,0,0,null,null,null,0,null,null,null,null,"BFX",null,null,null],null,"SUCCESS","Submitting limit buy order for 1 BTC."]]]        

            if(data[1] == 'n'){
                expect(data).to.not.be.null

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //MTS Timestamp of Notification
                expect(data[2][0]).to.be.a('number')
                expect(data[2][0]).to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Type 
                expect(data[2][1]).to.be.a('string')
                expect(data[2][1]).to.equal('on-req')

                //Message ID
                expect(data[2][2]).to.be.a('null')

                //Placeholder
                expect(data[2][3]).to.be.a('null')

                //Notify Info
                expect(data[2][4]).to.be.a('Array')

                //Code
                expect(data[2][5]).to.be.a('null')

                //Status
                expect(data[2][6]).to.be.a('string')
                expect(data[2][6]).to.equal('SUCCESS')

                //Text
                expect(data[2][7]).to.be.a('string')
                expect(data[2][7]).to.equal('Submitting ioc sell order for '+sellAmount+' '+symbolFirst+'.')

                //Order ID
                expect(data[2][4][0]).to.be.a('number')
                expect(data[2][4][0]).to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //GID
                expect(data[2][4][1]).to.be.a('null')

                //CID
                expect(data[2][4][2]).to.be.a('number')
                expect(data[2][4][2]).to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Symbol
                expect(data[2][4][3]).to.be.a('string')
                expect(data[2][4][3]).to.equal(symbol)

                //MTS Create
                expect(data[2][4][4]).to.be.a('number')
                expect(data[2][4][4]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][4][4]).to.match(/^(\d{13})?$/)

                //MTS Update
                expect(data[2][4][5]).to.be.a('number')
                expect(data[2][4][5]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][4][5]).to.match(/^(\d{13})?$/)
                expect(data[2][4][5]).to.equal(data[2][4][4])

                //Amount
                expect(data[2][4][6]).to.be.a('number')
                expect(data[2][4][6]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][4][6]).to.equal(sellAmount)

                //Amount Orig
                expect(data[2][4][7]).to.be.a('number')
                expect(data[2][4][7]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][4][7]).to.equal(sellAmount)

                //Order Type
                expect(data[2][4][8]).to.be.a('string')
                expect(data[2][4][8]).to.equal('IOC')

                //Order Type Previous
                expect(data[2][4][9]).to.be.a('null')

                //MTS TIF
                expect(data[2][4][10]).to.be.a('null')

                //Placeholder
                expect(data[2][4][11]).to.be.a('null')

                //Flags
                expect(data[2][4][12]).to.be.a('number')
                expect(data[2][4][12]).to.equal(0)

                //Flags
                expect(data[2][4][13]).to.be.a('String')
                expect(data[2][4][13]).to.equal('ACTIVE')

                //Placeholder
                expect(data[2][4][14]).to.be.a('null')

                //Placeholder
                expect(data[2][4][15]).to.be.a('null')

                //Price
                expect(data[2][4][16]).to.be.a('number')
                expect(data[2][4][16]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][4][16]).to.equal(sellPrice)

                //Price Average
                expect(data[2][4][17]).to.be.a('number')
                expect(data[2][4][17]).to.equal(0)

                //Price Trailing
                expect(data[2][4][18]).to.be.a('number')
                expect(data[2][4][18]).to.equal(0)

                //Price Aux Limit
                expect(data[2][4][19]).to.be.a('number')
                expect(data[2][4][19]).to.equal(0)

                //Placeholder
                expect(data[2][4][20]).to.be.a('null')

                //Placeholder
                expect(data[2][4][21]).to.be.a('null')

                //Placeholder
                expect(data[2][4][22]).to.be.a('null')

                //Notify
                expect(data[2][4][23]).to.be.a('number')
                expect(data[2][4][23]).to.equal(0)

                //Hidden
                expect(data[2][4][24]).to.be.a('null')

                //Placeholder
                expect(data[2][4][25]).to.be.a('null')

                //Placeholder
                expect(data[2][4][26]).to.be.a('null')

                //Placeholder
                expect(data[2][4][27]).to.be.a('null')

                //Routing
                expect(data[2][4][28]).to.be.a('string')
                expect(data[2][4][28]).to.equal('API>BFX')

                //Placeholder
                expect(data[2][4][29]).to.be.a('null')

                //Placeholder
                expect(data[2][4][30]).to.be.a('null')

                //Placeholder
                expect(data[2][4][31]).to.be.a('null')

                console.log(`n message:`,JSON.stringify(data))
                } 

            // Target the oc message [0,"oc",[1187238160,null,1588158739438,"tBTCUSD",1588158739438,1588158739444,0,0.001,"MARKET",null,null,null,0,"EXECUTED @ 8150.0(0.001)",null,null,8150,8150,0,0,null,null,null,0,0,null,null,null,"BFX",null,null,null]]    
            if(data[1] == 'oc'){
                NewMarginOrderSocket.close();
                expect(data).to.not.be.null

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //Order ID
                expect(data[2][0]).to.be.a('number')
                expect(data[2][0]).to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //GID
                expect(data[2][1]).to.be.a('null')

                //CID
                expect(data[2][2]).to.be.a('number')
                expect(data[2][2]).to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Symbol
                expect(data[2][3]).to.be.a('string')
                expect(data[2][3]).to.equal(symbol)

                //MTS Create
                expect(data[2][4]).to.be.a('number')
                expect(data[2][4]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][4]).to.match(/^(\d{13})?$/)

                //MTS Update
                expect(data[2][5]).to.be.a('number')
                expect(data[2][5]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][5]).to.match(/^(\d{13})?$/)
                expect(data[2][5]).to.be.greaterThan(data[2][4])

                //Amount
                expect(data[2][6]).to.be.a('number')
                expect(data[2][6]).to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Amount Orig
                expect(data[2][7]).to.be.a('number')
                expect(data[2][7]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][7]).to.equal(sellAmount)

                //Order Type
                expect(data[2][8]).to.be.a('string')
                expect(data[2][8]).to.equal('IOC')

                //Order Type Previous
                expect(data[2][9]).to.be.a('null')

                //MTS TIF
                expect(data[2][10]).to.be.a('null')

                //Placeholder
                expect(data[2][11]).to.be.a('null')

                //Flags
                expect(data[2][12]).to.be.a('number')
                expect(data[2][12]).to.equal(0)

                //Flags
                expect(data[2][13]).to.be.a('String')
                expect(data[2][13]).to.contain('IOC CANCELED')

                //Placeholder
                expect(data[2][14]).to.be.a('null')

                //Placeholder
                expect(data[2][15]).to.be.a('null')

                //Price
                expect(data[2][16]).to.be.a('number')
                expect(data[2][16]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][16]).to.equal(sellPrice)

                //Price Average
                expect(data[2][17]).to.be.a('number')
                expect(data[2][17]).to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Price Trailing
                expect(data[2][18]).to.be.a('number')
                expect(data[2][18]).to.equal(0)

                //Price Aux Limit
                expect(data[2][19]).to.be.a('number')
                expect(data[2][19]).to.equal(0)

                //Placeholder
                expect(data[2][20]).to.be.a('null')

                //Placeholder
                expect(data[2][21]).to.be.a('null')

                //Placeholder
                expect(data[2][22]).to.be.a('null')

                //Notify
                expect(data[2][23]).to.be.a('number')
                expect(data[2][23]).to.equal(0)

                //Hidden
                expect(data[2][24]).to.be.a('number')
                expect(data[2][24]).to.equal(0)

                //Placeholder
                expect(data[2][25]).to.be.a('null')

                //Placeholder
                expect(data[2][26]).to.be.a('null')

                //Placeholder
                expect(data[2][27]).to.be.a('null')

                //Routing
                expect(data[2][28]).to.be.a('string')
                expect(data[2][28]).to.equal('API>BFX')

                //Placeholder
                expect(data[2][29]).to.be.a('null')

                //Placeholder
                expect(data[2][30]).to.be.a('null')

                //Placeholder
                expect(data[2][31]).to.be.a('null')
                
                console.log(`on message:`,JSON.stringify(data))
                done()
                }    
            }
        });

    })
