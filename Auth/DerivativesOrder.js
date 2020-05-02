const WebSocket = require('ws');
const fs = require('fs');
const expect = require('chai').expect;
const ws_url = require('../config.json').ws_url
const crypto = require('crypto-js') // Standard JavaScript cryptography library
const apiKey = require('../config.json').api_key
const apiSecret = require('../config.json').api_secret

//Auth
const DerivativesOrderSocket = new WebSocket(ws_url);
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
const symbol = 'tBTCF0:USTF0'
const symbolFirst = symbol.substr(1,5)
const symbolSecond = symbol.substr(7,11)
const buyAmount = 0.0008 //min $5 USD equivalent
const sellAmount = -0.0008 //min $5 USD equivalent
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

describe('Derivatives Order Tests (Tests "on" inputs and authenticated channels: "n", "on", "oc", "pn", "pu", "pc")', function() {
        it('Derivatives Limit Buy Order should return a correct Notification and Order Info message', function(done) {

        this.timeout(10000)

        DerivativesOrderSocket.onopen = function (event) {
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
            DerivativesOrderSocket.send(JSON.stringify(payloadAuth))
            sleep(1000);
            DerivativesOrderSocket.send(payload);
          };

        DerivativesOrderSocket.onmessage = function (event) {
            let data = JSON.parse(event.data)
            
            // Target the n message [0,"n",[1588148817.151,"on-req",null,null,[1187238099,null,1588148817151,"tBTCUSD",1588148817151,1588148817151,1,1,"EXCHANGE LIMIT",null,null,null,0,"ACTIVE",null,null,500,0,0,0,null,null,null,0,null,null,null,null,"BFX",null,null,null],null,"SUCCESS","Submitting exchange limit buy order for 1 BTC."]]]        

            if(data[1] == 'n'){
                expect(data).to.not.be.null
                console.log(`n message:`,JSON.stringify(data))

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //MTS Timestamp of Notification
                expect(data[2][0]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Type 
                expect(data[2][1]).to.be.a('string')
                .and.to.equal('on-req')

                //Message ID
                expect(data[2][2]).to.be.null

                //Placeholder
                expect(data[2][3]).to.be.null

                //Notify Info
                expect(data[2][4]).to.be.a('Array')

                //Code
                expect(data[2][5]).to.be.null

                //Status
                expect(data[2][6]).to.be.a('string')
                .and.to.equal('SUCCESS')

                //Text
                expect(data[2][7]).to.be.a('string')
                .and.to.equal('Submitting limit buy order for '+buyAmount+' '+symbolFirst+'.')

                //Order ID
                expect(data[2][4][0]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //GID
                expect(data[2][4][1]).to.be.null

                //CID
                expect(data[2][4][2]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Symbol
                expect(data[2][4][3]).to.be.a('string')
                .and.to.equal(symbol)

                //MTS Create
                expect(data[2][4][4]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)
                .and.to.match(/^(\d{13})?$/)

                //MTS Update
                expect(data[2][4][5]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)
                .and.to.match(/^(\d{13})?$/)
                .and.to.equal(data[2][4][4])

                //Amount
                expect(data[2][4][6]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)
                .and.to.equal(buyAmount)

                //Amount Orig
                expect(data[2][4][7]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)
                .and.to.equal(buyAmount)

                //Order Type
                expect(data[2][4][8]).to.be.a('string')
                .and.to.equal('LIMIT')

                //Order Type Previous
                expect(data[2][4][9]).to.be.null

                //MTS TIF
                expect(data[2][4][10]).to.be.null

                //Placeholder
                expect(data[2][4][11]).to.be.null

                //Flags
                expect(data[2][4][12]).to.be.a('number')
                .and.to.equal(0)

                //Status
                expect(data[2][4][13]).to.be.a('string')
                .and.to.equal('ACTIVE')

                //Placeholder
                expect(data[2][4][14]).to.be.null

                //Placeholder
                expect(data[2][4][15]).to.be.null

                //Price
                expect(data[2][4][16]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)
                .and.to.equal(buyPrice)

                //Price Average
                expect(data[2][4][17]).to.be.a('number')
                .and.to.equal(0)

                //Price Trailing
                expect(data[2][4][18]).to.be.a('number')
                .and.to.equal(0)

                //Price Aux Limit
                expect(data[2][4][19]).to.be.a('number')
                .and.to.equal(0)

                //Placeholder
                expect(data[2][4][20]).to.be.null

                //Placeholder
                expect(data[2][4][21]).to.be.null

                //Placeholder
                expect(data[2][4][22]).to.be.null

                //Notify
                expect(data[2][4][23]).to.be.a('number')
                .and.to.equal(0)

                //Hidden
                expect(data[2][4][24]).to.be.null

                //Placeholder
                expect(data[2][4][25]).to.be.null

                //Placeholder
                expect(data[2][4][26]).to.be.null

                //Placeholder
                expect(data[2][4][27]).to.be.null

                //Routing
                expect(data[2][4][28]).to.be.a('string')
                .and.to.equal('API>BFX')

                //Placeholder
                expect(data[2][4][29]).to.be.null

                //Placeholder
                expect(data[2][4][30]).to.be.null

                //Meta
                expect(data[2][4][31]).to.be.a('object')
                .and.to.have.property('lev',10)
                expect(data[2][4][31]).and.to.have.property('$F33',10)

                } 

            // Target the on message [0,"on",[1187238101,null,1588148883485,"tBTCUSD",1588148883486,1588148883491,1,1,"EXCHANGE LIMIT",null,null,null,0,"ACTIVE",null,null,500,0,0,0,null,null,null,0,0,null,null,null,"BFX",null,null,null]
            if(data[1] == 'on'){
                expect(data).to.not.be.null
                console.log(`on message:`,JSON.stringify(data))

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //Order ID
                expect(data[2][0]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //GID
                expect(data[2][1]).to.be.null

                //CID
                expect(data[2][2]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Symbol
                expect(data[2][3]).to.be.a('string')
                .and.to.equal(symbol)

                //MTS Create
                expect(data[2][4]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)
                .and.to.match(/^(\d{13})?$/)

                //MTS Update
                expect(data[2][5]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)
                .and.to.match(/^(\d{13})?$/)
                .and.to.be.greaterThan(data[2][4])

                //Amount
                expect(data[2][6]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)
                .and.to.equal(buyAmount)

                //Amount Orig
                expect(data[2][7]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)
                .and.to.equal(buyAmount)

                //Order Type
                expect(data[2][8]).to.be.a('string')
                .and.to.equal('LIMIT')

                //Order Type Previous
                expect(data[2][9]).to.be.null

                //MTS TIF
                expect(data[2][10]).to.be.null

                //Placeholder
                expect(data[2][11]).to.be.null

                //Flags
                expect(data[2][12]).to.be.a('number')
                .and.to.equal(0)

                //Status
                expect(data[2][13]).to.be.a('string')
                .and.to.equal('ACTIVE')

                //Placeholder
                expect(data[2][14]).to.be.null

                //Placeholder
                expect(data[2][15]).to.be.null

                //Price
                expect(data[2][16]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)
                .and.to.equal(buyPrice)

                //Price Average
                expect(data[2][17]).to.be.a('number')
                .and.to.equal(0)

                //Price Trailing
                expect(data[2][18]).to.be.a('number')
                .and.to.equal(0)

                //Price Aux Limit
                expect(data[2][19]).to.be.a('number')
                .and.to.equal(0)

                //Placeholder
                expect(data[2][20]).to.be.null

                //Placeholder
                expect(data[2][21]).to.be.null

                //Placeholder
                expect(data[2][22]).to.be.null

                //Notify
                expect(data[2][23]).to.be.a('number')
                .and.to.equal(0)

                //Hidden
                expect(data[2][24]).to.be.a('number')
                .and.to.equal(0)

                //Placeholder
                expect(data[2][25]).to.be.null

                //Placeholder
                expect(data[2][26]).to.be.null

                //Placeholder
                expect(data[2][27]).to.be.null

                //Routing
                expect(data[2][28]).to.be.a('string')
                .and.to.equal('API>BFX')

                //Placeholder
                expect(data[2][29]).to.be.null

                //Placeholder
                expect(data[2][30]).to.be.null

                //Meta
                expect(data[2][31]).to.be.a('object')
                .and.to.have.property('lev',10)
                expect(data[2][31]).and.to.have.property('$F33',10)
                
                done()
                }    
            }
        });

        it('Derivatives Limit Sell Order should return a correct Notification and Order Info message', function(done) {

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

            DerivativesOrderSocket.send(payload);
            
        DerivativesOrderSocket.onmessage = function (event) {
            let data = JSON.parse(event.data)
            
            // Target the n message [0,"n",[1588148817.151,"on-req",null,null,[1187238099,null,1588148817151,"tBTCUSD",1588148817151,1588148817151,1,1,"EXCHANGE LIMIT",null,null,null,0,"ACTIVE",null,null,500,0,0,0,null,null,null,0,null,null,null,null,"BFX",null,null,null],null,"SUCCESS","Submitting exchange limit buy order for 1 BTC."]]]        

            if(data[1] == 'n'){
                expect(data).to.not.be.null
                console.log(`n message:`,JSON.stringify(data))

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //MTS Timestamp of Notification
                expect(data[2][0]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Type 
                expect(data[2][1]).to.be.a('string')
                .and.to.equal('on-req')

                //Message ID
                expect(data[2][2]).to.be.null

                //Placeholder
                expect(data[2][3]).to.be.null

                //Notify Info
                expect(data[2][4]).to.be.a('Array')

                //Code
                expect(data[2][5]).to.be.null

                //Status
                expect(data[2][6]).to.be.a('string')
                .and.to.equal('SUCCESS')

                //Text
                expect(data[2][7]).to.be.a('string')
                .and.to.equal('Submitting limit sell order for '+sellAmount+' '+symbolFirst+'.')

                //Order ID
                expect(data[2][4][0]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //GID
                expect(data[2][4][1]).to.be.null

                //CID
                expect(data[2][4][2]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Symbol
                expect(data[2][4][3]).to.be.a('string')
                .and.to.equal(symbol)

                //MTS Create
                expect(data[2][4][4]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)
                .and.to.match(/^(\d{13})?$/)

                //MTS Update
                expect(data[2][4][5]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)
                .and.to.match(/^(\d{13})?$/)
                .and.to.equal(data[2][4][4])

                //Amount
                expect(data[2][4][6]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)
                .and.to.equal(sellAmount)

                //Amount Orig
                expect(data[2][4][7]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)
                .and.to.equal(sellAmount)

                //Order Type
                expect(data[2][4][8]).to.be.a('string')
                .and.to.equal('LIMIT')

                //Order Type Previous
                expect(data[2][4][9]).to.be.null

                //MTS TIF
                expect(data[2][4][10]).to.be.null

                //Placeholder
                expect(data[2][4][11]).to.be.null

                //Flags
                expect(data[2][4][12]).to.be.a('number')
                .and.to.equal(0)

                //Status
                expect(data[2][4][13]).to.be.a('string')
                .and.to.equal('ACTIVE')

                //Placeholder
                expect(data[2][4][14]).to.be.null

                //Placeholder
                expect(data[2][4][15]).to.be.null

                //Price
                expect(data[2][4][16]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)
                .and.to.equal(sellPrice)

                //Price Average
                expect(data[2][4][17]).to.be.a('number')
                .and.to.equal(0)

                //Price Trailing
                expect(data[2][4][18]).to.be.a('number')
                .and.to.equal(0)

                //Price Aux Limit
                expect(data[2][4][19]).to.be.a('number')
                .and.to.equal(0)

                //Placeholder
                expect(data[2][4][20]).to.be.null

                //Placeholder
                expect(data[2][4][21]).to.be.null

                //Placeholder
                expect(data[2][4][22]).to.be.null

                //Notify
                expect(data[2][4][23]).to.be.a('number')
                .and.to.equal(0)

                //Hidden
                expect(data[2][4][24]).to.be.null

                //Placeholder
                expect(data[2][4][25]).to.be.null

                //Placeholder
                expect(data[2][4][26]).to.be.null

                //Placeholder
                expect(data[2][4][27]).to.be.null

                //Routing
                expect(data[2][4][28]).to.be.a('string')
                .and.to.equal('API>BFX')

                //Placeholder
                expect(data[2][4][29]).to.be.null

                //Placeholder
                expect(data[2][4][30]).to.be.null

                //Meta
                expect(data[2][4][31]).to.be.a('object')
                .and.to.have.property('lev',10)
                expect(data[2][4][31]).and.to.have.property('$F33',10)

                } 

            // Target the on message [0,"on",[1187238101,null,1588148883485,"tBTCUSD",1588148883486,1588148883491,1,1,"EXCHANGE LIMIT",null,null,null,0,"ACTIVE",null,null,500,0,0,0,null,null,null,0,0,null,null,null,"BFX",null,null,null]
            if(data[1] == 'on'){
                expect(data).to.not.be.null
                console.log(`on message:`,JSON.stringify(data))

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //Order ID
                expect(data[2][0]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //GID
                expect(data[2][1]).to.be.null

                //CID
                expect(data[2][2]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Symbol
                expect(data[2][3]).to.be.a('string')
                .and.to.equal(symbol)

                //MTS Create
                expect(data[2][4]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)
                .and.to.match(/^(\d{13})?$/)

                //MTS Update
                expect(data[2][5]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)
                .and.to.match(/^(\d{13})?$/)
                .and.to.be.greaterThan(data[2][4])

                //Amount
                expect(data[2][6]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)
                .and.to.equal(sellAmount)

                //Amount Orig
                expect(data[2][7]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)
                .and.to.equal(sellAmount)

                //Order Type
                expect(data[2][8]).to.be.a('string')
                .and.to.equal('LIMIT')

                //Order Type Previous
                expect(data[2][9]).to.be.null

                //MTS TIF
                expect(data[2][10]).to.be.null

                //Placeholder
                expect(data[2][11]).to.be.null

                //Flags
                expect(data[2][12]).to.be.a('number')
                .and.to.equal(0)

                //Status
                expect(data[2][13]).to.be.a('string')
                .and.to.equal('ACTIVE')

                //Placeholder
                expect(data[2][14]).to.be.null

                //Placeholder
                expect(data[2][15]).to.be.null

                //Price
                expect(data[2][16]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)
                .and.to.equal(sellPrice)

                //Price Average
                expect(data[2][17]).to.be.a('number')
                .and.to.equal(0)

                //Price Trailing
                expect(data[2][18]).to.be.a('number')
                .and.to.equal(0)

                //Price Aux Limit
                expect(data[2][19]).to.be.a('number')
                .and.to.equal(0)

                //Placeholder
                expect(data[2][20]).to.be.null

                //Placeholder
                expect(data[2][21]).to.be.null

                //Placeholder
                expect(data[2][22]).to.be.null

                //Notify
                expect(data[2][23]).to.be.a('number')
                .and.to.equal(0)

                //Hidden
                expect(data[2][24]).to.be.a('number')
                .and.to.equal(0)

                //Placeholder
                expect(data[2][25]).to.be.null

                //Placeholder
                expect(data[2][26]).to.be.null

                //Placeholder
                expect(data[2][27]).to.be.null

                //Routing
                expect(data[2][28]).to.be.a('string')
                .and.to.equal('API>BFX')

                //Placeholder
                expect(data[2][29]).to.be.null

                //Placeholder
                expect(data[2][30]).to.be.null

                //Meta
                expect(data[2][31]).to.be.a('object')
                .and.to.have.property('lev',10)
                expect(data[2][31]).and.to.have.property('$F33',10)
                
                done()
                }    
            }
        });

        it('Derivatives Market Buy Order should return a correct Notification, Order Info, Position New and Position Update message', function(done) {

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

            DerivativesOrderSocket.send(payload);

        DerivativesOrderSocket.onmessage = function (event) {
            let data = JSON.parse(event.data)
            
            // Target the n message [0,"n",[1588148817.151,"on-req",null,null,[1187238099,null,1588148817151,"tBTCUSD",1588148817151,1588148817151,1,1,"LIMIT",null,null,null,0,"ACTIVE",null,null,500,0,0,0,null,null,null,0,null,null,null,null,"BFX",null,null,null],null,"SUCCESS","Submitting limit buy order for 1 BTC."]]]        

            if(data[1] == 'n'){
                expect(data).to.not.be.null
                console.log(`n message:`,JSON.stringify(data))

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //MTS Timestamp of Notification
                expect(data[2][0]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Type 
                expect(data[2][1]).to.be.a('string')
                .and.to.equal('on-req')

                //Message ID
                expect(data[2][2]).to.be.null

                //Placeholder
                expect(data[2][3]).to.be.null

                //Notify Info
                expect(data[2][4]).to.be.a('Array')

                //Code
                expect(data[2][5]).to.be.null

                //Status
                expect(data[2][6]).to.be.a('string')
                .and.to.equal('SUCCESS')

                //Text
                expect(data[2][7]).to.be.a('string')
                .and.to.equal('Submitting market buy order for '+buyAmount+' '+symbolFirst+'.')

                //Order ID
                expect(data[2][4][0]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //GID
                expect(data[2][4][1]).to.be.null

                //CID
                expect(data[2][4][2]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Symbol
                expect(data[2][4][3]).to.be.a('string')
                .and.to.equal(symbol)

                //MTS Create
                expect(data[2][4][4]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)
                .and.to.match(/^(\d{13})?$/)

                //MTS Update
                expect(data[2][4][5]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)
                .and.to.match(/^(\d{13})?$/)
                .and.to.equal(data[2][4][4])

                //Amount
                expect(data[2][4][6]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)
                .and.to.equal(buyAmount)

                //Amount Orig
                expect(data[2][4][7]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)
                .and.to.equal(buyAmount)

                //Order Type
                expect(data[2][4][8]).to.be.a('string')
                .and.to.equal('MARKET')

                //Order Type Previous
                expect(data[2][4][9]).to.be.null

                //MTS TIF
                expect(data[2][4][10]).to.be.null

                //Placeholder
                expect(data[2][4][11]).to.be.null

                //Flags
                expect(data[2][4][12]).to.be.a('number')
                .and.to.equal(0)

                //Status
                expect(data[2][4][13]).to.be.a('string')
                .and.to.equal('ACTIVE')

                //Placeholder
                expect(data[2][4][14]).to.be.null

                //Placeholder
                expect(data[2][4][15]).to.be.null

                //Price
                expect(data[2][4][16]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Price Average
                expect(data[2][4][17]).to.be.a('number')
                .and.to.equal(0)

                //Price Trailing
                expect(data[2][4][18]).to.be.a('number')
                .and.to.equal(0)

                //Price Aux Limit
                expect(data[2][4][19]).to.be.a('number')
                .and.to.equal(0)

                //Placeholder
                expect(data[2][4][20]).to.be.null

                //Placeholder
                expect(data[2][4][21]).to.be.null

                //Placeholder
                expect(data[2][4][22]).to.be.null

                //Notify
                expect(data[2][4][23]).to.be.a('number')
                .and.to.equal(0)

                //Hidden
                expect(data[2][4][24]).to.be.null

                //Placeholder
                expect(data[2][4][25]).to.be.null

                //Placeholder
                expect(data[2][4][26]).to.be.null

                //Placeholder
                expect(data[2][4][27]).to.be.null

                //Routing
                expect(data[2][4][28]).to.be.a('string')
                .and.to.equal('API>BFX')

                //Placeholder
                expect(data[2][4][29]).to.be.null

                //Placeholder
                expect(data[2][4][30]).to.be.null

                //Meta
                expect(data[2][4][31]).to.be.a('object')
                .and.to.have.property('lev',10)
                expect(data[2][4][31]).and.to.have.property('$F33',10)

                } 

            // Target the oc message 
            //[0,"oc",[1187238160,null,1588158739438,"tBTCUSD",1588158739438,1588158739444,0,0.001,"MARKET",null,null,null,0,"EXECUTED @ 8150.0(0.001)",null,null,8150,8150,0,0,null,null,null,0,0,null,null,null,"BFX",null,null,null]]    
            //[0,"oc",[1187248540,null,1588332669193,"tBTCF0:USTF0",1588332669194,1588332669201,0,0.0008,"MARKET",null,null,null,0,"EXECUTED @ 9000.0(0.0008)",null,null,9000,9000,0,0,null,null,null,0,0,null,null,null,"API>BFX",null,null,{"lev":10,"$F33":10}]]
            if(data[1] == 'oc'){
                expect(data).to.not.be.null
                console.log(`oc message:`,JSON.stringify(data))

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //Order ID
                expect(data[2][0]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //GID
                expect(data[2][1]).to.be.null

                //CID
                expect(data[2][2]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Symbol
                expect(data[2][3]).to.be.a('string')
                .and.to.equal(symbol)

                //MTS Create
                expect(data[2][4]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)
                .and.to.match(/^(\d{13})?$/)

                //MTS Update
                expect(data[2][5]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)
                .and.to.match(/^(\d{13})?$/)
                .and.to.be.greaterThan(data[2][4])

                //Amount
                expect(data[2][6]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Amount Orig
                expect(data[2][7]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)
                .and.to.equal(buyAmount)

                //Order Type
                expect(data[2][8]).to.be.a('string')
                .and.to.equal('MARKET')

                //Order Type Previous
                expect(data[2][9]).to.be.null

                //MTS TIF
                expect(data[2][10]).to.be.null

                //Placeholder
                expect(data[2][11]).to.be.null

                //Flags
                expect(data[2][12]).to.be.a('number')
                .and.to.equal(0)

                //Status
                expect(data[2][13]).to.be.a('string')
                expect(data[2][13]).to.contain('EXECUTED')

                //Placeholder
                expect(data[2][14]).to.be.null

                //Placeholder
                expect(data[2][15]).to.be.null

                //Price
                expect(data[2][16]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Price Average
                expect(data[2][17]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Price Trailing
                expect(data[2][18]).to.be.a('number')
                .and.to.equal(0)

                //Price Aux Limit
                expect(data[2][19]).to.be.a('number')
                .and.to.equal(0)

                //Placeholder
                expect(data[2][20]).to.be.null

                //Placeholder
                expect(data[2][21]).to.be.null

                //Placeholder
                expect(data[2][22]).to.be.null

                //Notify
                expect(data[2][23]).to.be.a('number')
                .and.to.equal(0)

                //Hidden
                expect(data[2][24]).to.be.a('number')
                .and.to.equal(0)

                //Placeholder
                expect(data[2][25]).to.be.null

                //Placeholder
                expect(data[2][26]).to.be.null

                //Placeholder
                expect(data[2][27]).to.be.null

                //Routing
                expect(data[2][28]).to.be.a('string')
                .and.to.equal('API>BFX')

                //Placeholder
                expect(data[2][29]).to.be.null

                //Placeholder
                expect(data[2][30]).to.be.null

                //Meta
                expect(data[2][31]).to.be.a('object')
                .and.to.have.property('lev',10)
                expect(data[2][31]).and.to.have.property('$F33',10)
                
                } 

            // Target the pn message [0,"pn",["tBTCF0:USTF0","ACTIVE",0.0008,9000,0.00005702,0,null,null,null,null,null,36444676,null,null,null,1,null,0.72,null,{"reason":"TRADE","order_id":1187248626,"order_id_oppo":1187239941,"liq_stage":null,"trade_price":"9000.0","trade_amount":"0.0008"}]]  
            if(data[1] == 'pn'){
                expect(data).to.not.be.null
                console.log(`pn message:`,JSON.stringify(data))

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //Symbol
                expect(data[2][0]).to.be.a('string')
                .and.to.equal(symbol)

                //Status
                expect(data[2][1]).to.be.a('string')
                .and.to.equal('ACTIVE')

                //Amount
                expect(data[2][2]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)
                .and.to.equal(buyAmount)

                //Base Price
                expect(data[2][3]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Derivatives Funding
                expect(data[2][4]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Derivatives Funding Type
                expect(data[2][5]).to.be.a('number')
                .and.to.equal(0)

                //PL
                expect(data[2][6]).to.be.null

                //PL Perc
                expect(data[2][7]).to.be.null

                //Price Liq
                expect(data[2][8]).to.be.null

                //Leverage
                expect(data[2][9]).to.be.null

                //Placeholder
                expect(data[2][10]).to.be.null

                //Position ID
                expect(data[2][11]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Placeholder
                expect(data[2][12]).to.be.null

                //MTS Create
                expect(data[2][13]).to.be.null

                //MTS Update
                expect(data[2][14]).to.be.null

                //Type
                expect(data[2][15]).to.be.a('number')
                .and.to.equal(1)

                //Placeholder
                expect(data[2][16]).to.be.null

                //Collateral
                expect(data[2][17]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Collateral Min
                expect(data[2][18]).to.be.null

                //Position Meta
                expect(data[2][19]).to.be.a('object')
                       
                } 

            // Target the pu message [0,"pu",["tBTCF0:USTF0","ACTIVE",0.0008,9000,-0.0025,0,-0.08,-1.1111111111111112,8145,1.7108543647129272e-7,null,36444678,null,null,null,1,null,0.72,0.07200000000000001,{"reason":"TRADE","order_id":1187248640,"order_id_oppo":1187239941,"liq_stage":null,"trade_price":"9000.0","trade_amount":"0.0008"}]]
            if(data[1] == 'pu'){
                expect(data).to.not.be.null
                console.log(`pu message:`,JSON.stringify(data))

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //Symbol
                expect(data[2][0]).to.be.a('string')
                .and.to.equal(symbol)

                //Status
                expect(data[2][1]).to.be.a('string')
                .and.to.equal('ACTIVE')

                //Amount
                expect(data[2][2]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)
                .and.to.equal(buyAmount)

                //Base Price
                expect(data[2][3]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Derivatives Funding
                expect(data[2][4]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Derivatives Funding Type
                expect(data[2][5]).to.be.a('number')
                .and.to.equal(0)

                //PL
                expect(data[2][6]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //PL Perc
                expect(data[2][7]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Price Liq
                expect(data[2][8]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Leverage
                expect(data[2][9]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Placeholder
                expect(data[2][10]).to.be.null

                //Position ID
                expect(data[2][11]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Placeholder
                expect(data[2][12]).to.be.null

                //MTS Create
                expect(data[2][13]).to.be.null

                //MTS Update
                expect(data[2][14]).to.be.null

                //Type
                expect(data[2][15]).to.be.a('number')
                .and.to.equal(1)

                //Placeholder
                expect(data[2][16]).to.be.null

                //Collateral
                expect(data[2][17]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Collateral Min
                expect(data[2][18]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Position Meta
                expect(data[2][19]).to.be.a('object')

                done()
                
                }

            }
        });

        it('Derivatives Market Sell Order should return a correct Notification, Order Info and Position Close message', function(done) {

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

            DerivativesOrderSocket.send(payload);

        DerivativesOrderSocket.onmessage = function (event) {
            let data = JSON.parse(event.data)
            
            // Target the n message [0,"n",[1588148817.151,"on-req",null,null,[1187238099,null,1588148817151,"tBTCUSD",1588148817151,1588148817151,1,1,"LIMIT",null,null,null,0,"ACTIVE",null,null,500,0,0,0,null,null,null,0,null,null,null,null,"BFX",null,null,null],null,"SUCCESS","Submitting limit buy order for 1 BTC."]]]        

            if(data[1] == 'n'){
                expect(data).to.not.be.null
                console.log(`n message:`,JSON.stringify(data))

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //MTS Timestamp of Notification
                expect(data[2][0]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Type 
                expect(data[2][1]).to.be.a('string')
                .and.to.equal('on-req')

                //Message ID
                expect(data[2][2]).to.be.null

                //Placeholder
                expect(data[2][3]).to.be.null

                //Notify Info
                expect(data[2][4]).to.be.a('Array')

                //Code
                expect(data[2][5]).to.be.null

                //Status
                expect(data[2][6]).to.be.a('string')
                .and.to.equal('SUCCESS')

                //Text
                expect(data[2][7]).to.be.a('string')
                .and.to.equal('Submitting market sell order for '+sellAmount+' '+symbolFirst+'.')

                //Order ID
                expect(data[2][4][0]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //GID
                expect(data[2][4][1]).to.be.null

                //CID
                expect(data[2][4][2]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Symbol
                expect(data[2][4][3]).to.be.a('string')
                .and.to.equal(symbol)

                //MTS Create
                expect(data[2][4][4]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)
                .and.to.match(/^(\d{13})?$/)

                //MTS Update
                expect(data[2][4][5]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)
                .and.to.match(/^(\d{13})?$/)
                .and.to.equal(data[2][4][4])

                //Amount
                expect(data[2][4][6]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)
                .and.to.equal(sellAmount)

                //Amount Orig
                expect(data[2][4][7]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)
                .and.to.equal(sellAmount)

                //Order Type
                expect(data[2][4][8]).to.be.a('string')
                .and.to.equal('MARKET')

                //Order Type Previous
                expect(data[2][4][9]).to.be.null

                //MTS TIF
                expect(data[2][4][10]).to.be.null

                //Placeholder
                expect(data[2][4][11]).to.be.null

                //Flags
                expect(data[2][4][12]).to.be.a('number')
                .and.to.equal(0)

                //Status
                expect(data[2][4][13]).to.be.a('string')
                .and.to.equal('ACTIVE')

                //Placeholder
                expect(data[2][4][14]).to.be.null

                //Placeholder
                expect(data[2][4][15]).to.be.null

                //Price
                expect(data[2][4][16]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Price Average
                expect(data[2][4][17]).to.be.a('number')
                .and.to.equal(0)

                //Price Trailing
                expect(data[2][4][18]).to.be.a('number')
                .and.to.equal(0)

                //Price Aux Limit
                expect(data[2][4][19]).to.be.a('number')
                .and.to.equal(0)

                //Placeholder
                expect(data[2][4][20]).to.be.null

                //Placeholder
                expect(data[2][4][21]).to.be.null

                //Placeholder
                expect(data[2][4][22]).to.be.null

                //Notify
                expect(data[2][4][23]).to.be.a('number')
                .and.to.equal(0)

                //Hidden
                expect(data[2][4][24]).to.be.null

                //Placeholder
                expect(data[2][4][25]).to.be.null

                //Placeholder
                expect(data[2][4][26]).to.be.null

                //Placeholder
                expect(data[2][4][27]).to.be.null

                //Routing
                expect(data[2][4][28]).to.be.a('string')
                .and.to.equal('API>BFX')

                //Placeholder
                expect(data[2][4][29]).to.be.null

                //Placeholder
                expect(data[2][4][30]).to.be.null

                //Meta
                expect(data[2][4][31]).to.be.a('object')
                .and.to.have.property('lev',10)
                expect(data[2][4][31]).and.to.have.property('$F33',10)

                } 

            // Target the pc message [0,"pc",["tBTCF0:USTF0","CLOSED",0,9000,0,0,null,null,null,null,null,36444682,null,null,null,1,null,0.72,null,{"reason":"TRADE","order_id":1187248673,"order_id_oppo":1187239942,"liq_stage":null,"trade_price":"8900.0","trade_amount":"-0.0008"}]]   
            if(data[1] == 'pc'){
                expect(data).to.not.be.null
                console.log(`pc message:`,JSON.stringify(data))

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //Symbol
                expect(data[2][0]).to.be.a('string')
                .and.to.equal(symbol)

                //Status
                expect(data[2][1]).to.be.a('string')
                .and.to.equal('CLOSED')

                //Amount
                expect(data[2][2]).to.be.a('number')
                .and.to.equal(0)

                //Base Price
                expect(data[2][3]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Derivatives Funding
                expect(data[2][4]).to.be.a('number')
                .and.to.equal(0)

                //Derivatives Funding Type
                expect(data[2][5]).to.be.a('number')
                .and.to.equal(0)

                //PL
                expect(data[2][6]).to.be.null

                //PL Perc
                expect(data[2][7]).to.be.null

                //Price Liq
                expect(data[2][8]).to.be.null

                //Leverage
                expect(data[2][9]).to.be.null

                //Placeholder
                expect(data[2][10]).to.be.null

                //Position ID
                expect(data[2][11]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Placeholder
                expect(data[2][12]).to.be.null

                //MTS Create
                expect(data[2][13]).to.be.null

                //MTS Update
                expect(data[2][14]).to.be.null

                //Type
                expect(data[2][15]).to.be.a('number')
                .and.to.equal(1)

                //Placeholder
                expect(data[2][16]).to.be.null

                //Collateral
                expect(data[2][17]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Collateral Min
                expect(data[2][18]).to.be.null

                //Position Meta
                expect(data[2][19]).to.be.a('object')
                
                } 

            // Target the oc message [0,"oc",[1187238160,null,1588158739438,"tBTCUSD",1588158739438,1588158739444,0,0.001,"MARKET",null,null,null,0,"EXECUTED @ 8150.0(0.001)",null,null,8150,8150,0,0,null,null,null,0,0,null,null,null,"BFX",null,null,null]]    
            if(data[1] == 'oc'){
                expect(data).to.not.be.null
                console.log(`oc message:`,JSON.stringify(data))

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //Order ID
                expect(data[2][0]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //GID
                expect(data[2][1]).to.be.null

                //CID
                expect(data[2][2]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Symbol
                expect(data[2][3]).to.be.a('string')
                .and.to.equal(symbol)

                //MTS Create
                expect(data[2][4]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)
                .and.to.match(/^(\d{13})?$/)

                //MTS Update
                expect(data[2][5]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)
                .and.to.match(/^(\d{13})?$/)
                .and.to.be.greaterThan(data[2][4])

                //Amount
                expect(data[2][6]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Amount Orig
                expect(data[2][7]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)
                .and.to.equal(sellAmount)

                //Order Type
                expect(data[2][8]).to.be.a('string')
                .and.to.equal('MARKET')

                //Order Type Previous
                expect(data[2][9]).to.be.null

                //MTS TIF
                expect(data[2][10]).to.be.null

                //Placeholder
                expect(data[2][11]).to.be.null

                //Flags
                expect(data[2][12]).to.be.a('number')
                .and.to.equal(0)

                //Status
                expect(data[2][13]).to.be.a('string')
                expect(data[2][13]).to.contain('EXECUTED')

                //Placeholder
                expect(data[2][14]).to.be.null

                //Placeholder
                expect(data[2][15]).to.be.null

                //Price
                expect(data[2][16]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Price Average
                expect(data[2][17]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Price Trailing
                expect(data[2][18]).to.be.a('number')
                .and.to.equal(0)

                //Price Aux Limit
                expect(data[2][19]).to.be.a('number')
                .and.to.equal(0)

                //Placeholder
                expect(data[2][20]).to.be.null

                //Placeholder
                expect(data[2][21]).to.be.null

                //Placeholder
                expect(data[2][22]).to.be.null

                //Notify
                expect(data[2][23]).to.be.a('number')
                .and.to.equal(0)

                //Hidden
                expect(data[2][24]).to.be.a('number')
                .and.to.equal(0)

                //Placeholder
                expect(data[2][25]).to.be.null

                //Placeholder
                expect(data[2][26]).to.be.null

                //Placeholder
                expect(data[2][27]).to.be.null

                //Routing
                expect(data[2][28]).to.be.a('string')
                .and.to.equal('API>BFX')

                //Placeholder
                expect(data[2][29]).to.be.null

                //Placeholder
                expect(data[2][30]).to.be.null

                //Meta
                expect(data[2][31]).to.be.a('object')
                .and.to.have.property('lev',10)
                expect(data[2][31]).and.to.have.property('$F33',10)

                done()
                
                }   
            }
        });

        it('Derivatives Stop Buy Order should return a correct Notification and Order Info message', function(done) {

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

            DerivativesOrderSocket.send(payload);

        DerivativesOrderSocket.onmessage = function (event) {
            let data = JSON.parse(event.data)
            
            // Target the n message [0,"n",[1588148817.151,"on-req",null,null,[1187238099,null,1588148817151,"tBTCUSD",1588148817151,1588148817151,1,1,"LIMIT",null,null,null,0,"ACTIVE",null,null,500,0,0,0,null,null,null,0,null,null,null,null,"BFX",null,null,null],null,"SUCCESS","Submitting limit buy order for 1 BTC."]]]        

            if(data[1] == 'n'){
                expect(data).to.not.be.null
                console.log(`n message:`,JSON.stringify(data))

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //MTS Timestamp of Notification
                expect(data[2][0]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Type 
                expect(data[2][1]).to.be.a('string')
                .and.to.equal('on-req')

                //Message ID
                expect(data[2][2]).to.be.null

                //Placeholder
                expect(data[2][3]).to.be.null

                //Notify Info
                expect(data[2][4]).to.be.a('Array')

                //Code
                expect(data[2][5]).to.be.null

                //Status
                expect(data[2][6]).to.be.a('string')
                .and.to.equal('SUCCESS')

                //Text
                expect(data[2][7]).to.be.a('string')
                .and.to.equal('Submitting stop buy order for '+buyAmount+' '+symbolFirst+'.')

                //Order ID
                expect(data[2][4][0]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //GID
                expect(data[2][4][1]).to.be.null

                //CID
                expect(data[2][4][2]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Symbol
                expect(data[2][4][3]).to.be.a('string')
                .and.to.equal(symbol)

                //MTS Create
                expect(data[2][4][4]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)
                .and.to.match(/^(\d{13})?$/)

                //MTS Update
                expect(data[2][4][5]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)
                .and.to.match(/^(\d{13})?$/)
                .and.to.equal(data[2][4][4])

                //Amount
                expect(data[2][4][6]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)
                .and.to.equal(buyAmount)

                //Amount Orig
                expect(data[2][4][7]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)
                .and.to.equal(buyAmount)

                //Order Type
                expect(data[2][4][8]).to.be.a('string')
                .and.to.equal('STOP')

                //Order Type Previous
                expect(data[2][4][9]).to.be.null

                //MTS TIF
                expect(data[2][4][10]).to.be.null

                //Placeholder
                expect(data[2][4][11]).to.be.null

                //Flags
                expect(data[2][4][12]).to.be.a('number')
                .and.to.equal(0)

                //Status
                expect(data[2][4][13]).to.be.a('string')
                .and.to.equal('ACTIVE')

                //Placeholder
                expect(data[2][4][14]).to.be.null

                //Placeholder
                expect(data[2][4][15]).to.be.null

                //Price
                expect(data[2][4][16]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)
                .and.to.equal(sellPrice)

                //Price Average
                expect(data[2][4][17]).to.be.a('number')
                .and.to.equal(0)

                //Price Trailing
                expect(data[2][4][18]).to.be.a('number')
                .and.to.equal(0)

                //Price Aux Limit
                expect(data[2][4][19]).to.be.a('number')
                .and.to.equal(0)

                //Placeholder
                expect(data[2][4][20]).to.be.null

                //Placeholder
                expect(data[2][4][21]).to.be.null

                //Placeholder
                expect(data[2][4][22]).to.be.null

                //Notify
                expect(data[2][4][23]).to.be.a('number')
                .and.to.equal(0)

                //Hidden
                expect(data[2][4][24]).to.be.null

                //Placeholder
                expect(data[2][4][25]).to.be.null

                //Placeholder
                expect(data[2][4][26]).to.be.null

                //Placeholder
                expect(data[2][4][27]).to.be.null

                //Routing
                expect(data[2][4][28]).to.be.a('string')
                .and.to.equal('API>BFX')

                //Placeholder
                expect(data[2][4][29]).to.be.null

                //Placeholder
                expect(data[2][4][30]).to.be.null

                //Meta
                expect(data[2][4][31]).to.be.a('object')
                .and.to.have.property('lev',10)
                expect(data[2][4][31]).and.to.have.property('$F33',10)

                } 

            // Target the on message [0,"on",[1187238101,null,1588148883485,"tBTCUSD",1588148883486,1588148883491,1,1,"LIMIT",null,null,null,0,"ACTIVE",null,null,500,0,0,0,null,null,null,0,0,null,null,null,"BFX",null,null,null]   
            if(data[1] == 'on'){
                expect(data).to.not.be.null
                console.log(`on message:`,JSON.stringify(data))

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //Order ID
                expect(data[2][0]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //GID
                expect(data[2][1]).to.be.null

                //CID
                expect(data[2][2]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Symbol
                expect(data[2][3]).to.be.a('string')
                .and.to.equal(symbol)

                //MTS Create
                expect(data[2][4]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)
                .and.to.match(/^(\d{13})?$/)

                //MTS Update
                expect(data[2][5]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)
                .and.to.match(/^(\d{13})?$/)
                .and.to.be.greaterThan(data[2][4])

                //Amount
                expect(data[2][6]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)
                .and.to.equal(buyAmount)

                //Amount Orig
                expect(data[2][7]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)
                .and.to.equal(buyAmount)

                //Order Type
                expect(data[2][8]).to.be.a('string')
                .and.to.equal('STOP')

                //Order Type Previous
                expect(data[2][9]).to.be.null

                //MTS TIF
                expect(data[2][10]).to.be.null

                //Placeholder
                expect(data[2][11]).to.be.null

                //Flags
                expect(data[2][12]).to.be.a('number')
                .and.to.equal(0)

                //Status
                expect(data[2][13]).to.be.a('string')
                expect(data[2][13]).to.contain('ACTIVE')

                //Placeholder
                expect(data[2][14]).to.be.null

                //Placeholder
                expect(data[2][15]).to.be.null

                //Price
                expect(data[2][16]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)
                .and.to.equal(sellPrice)

                //Price Average
                expect(data[2][17]).to.be.a('number')
                .and.to.equal(0)

                //Price Trailing
                expect(data[2][18]).to.be.a('number')
                .and.to.equal(0)

                //Price Aux Limit
                expect(data[2][19]).to.be.a('number')
                .and.to.equal(0)

                //Placeholder
                expect(data[2][20]).to.be.null

                //Placeholder
                expect(data[2][21]).to.be.null

                //Placeholder
                expect(data[2][22]).to.be.null

                //Notify
                expect(data[2][23]).to.be.a('number')
                .and.to.equal(0)

                //Hidden
                expect(data[2][24]).to.be.a('number')
                .and.to.equal(0)

                //Placeholder
                expect(data[2][25]).to.be.null

                //Placeholder
                expect(data[2][26]).to.be.null

                //Placeholder
                expect(data[2][27]).to.be.null

                //Routing
                expect(data[2][28]).to.be.a('string')
                .and.to.equal('API>BFX')

                //Placeholder
                expect(data[2][29]).to.be.null

                //Placeholder
                expect(data[2][30]).to.be.null

                //Meta
                expect(data[2][31]).to.be.a('object')
                .and.to.have.property('lev',10)
                expect(data[2][31]).and.to.have.property('$F33',10)
                
                
                done()
                }    
            }
        });

        it('Derivatives Stop Sell Order should return a correct Notification and Order Info message', function(done) {

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

            DerivativesOrderSocket.send(payload);

        DerivativesOrderSocket.onmessage = function (event) {
            let data = JSON.parse(event.data)
            
            // Target the n message [0,"n",[1588148817.151,"on-req",null,null,[1187238099,null,1588148817151,"tBTCUSD",1588148817151,1588148817151,1,1,"LIMIT",null,null,null,0,"ACTIVE",null,null,500,0,0,0,null,null,null,0,null,null,null,null,"BFX",null,null,null],null,"SUCCESS","Submitting limit buy order for 1 BTC."]]]        

            if(data[1] == 'n'){
                expect(data).to.not.be.null
                console.log(`n message:`,JSON.stringify(data))

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //MTS Timestamp of Notification
                expect(data[2][0]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Type 
                expect(data[2][1]).to.be.a('string')
                .and.to.equal('on-req')

                //Message ID
                expect(data[2][2]).to.be.null

                //Placeholder
                expect(data[2][3]).to.be.null

                //Notify Info
                expect(data[2][4]).to.be.a('Array')

                //Code
                expect(data[2][5]).to.be.null

                //Status
                expect(data[2][6]).to.be.a('string')
                .and.to.equal('SUCCESS')

                //Text
                expect(data[2][7]).to.be.a('string')
                .and.to.equal('Submitting stop sell order for '+sellAmount+' '+symbolFirst+'.')

                //Order ID
                expect(data[2][4][0]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //GID
                expect(data[2][4][1]).to.be.null

                //CID
                expect(data[2][4][2]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Symbol
                expect(data[2][4][3]).to.be.a('string')
                .and.to.equal(symbol)

                //MTS Create
                expect(data[2][4][4]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)
                .and.to.match(/^(\d{13})?$/)

                //MTS Update
                expect(data[2][4][5]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)
                .and.to.match(/^(\d{13})?$/)
                .and.to.equal(data[2][4][4])

                //Amount
                expect(data[2][4][6]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)
                .and.to.equal(sellAmount)

                //Amount Orig
                expect(data[2][4][7]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)
                .and.to.equal(sellAmount)

                //Order Type
                expect(data[2][4][8]).to.be.a('string')
                .and.to.equal('STOP')

                //Order Type Previous
                expect(data[2][4][9]).to.be.null

                //MTS TIF
                expect(data[2][4][10]).to.be.null

                //Placeholder
                expect(data[2][4][11]).to.be.null

                //Flags
                expect(data[2][4][12]).to.be.a('number')
                .and.to.equal(0)

                //Status
                expect(data[2][4][13]).to.be.a('string')
                .and.to.equal('ACTIVE')

                //Placeholder
                expect(data[2][4][14]).to.be.null

                //Placeholder
                expect(data[2][4][15]).to.be.null

                //Price
                expect(data[2][4][16]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)
                .and.to.equal(buyPrice)

                //Price Average
                expect(data[2][4][17]).to.be.a('number')
                .and.to.equal(0)

                //Price Trailing
                expect(data[2][4][18]).to.be.a('number')
                .and.to.equal(0)

                //Price Aux Limit
                expect(data[2][4][19]).to.be.a('number')
                .and.to.equal(0)

                //Placeholder
                expect(data[2][4][20]).to.be.null

                //Placeholder
                expect(data[2][4][21]).to.be.null

                //Placeholder
                expect(data[2][4][22]).to.be.null

                //Notify
                expect(data[2][4][23]).to.be.a('number')
                .and.to.equal(0)

                //Hidden
                expect(data[2][4][24]).to.be.null

                //Placeholder
                expect(data[2][4][25]).to.be.null

                //Placeholder
                expect(data[2][4][26]).to.be.null

                //Placeholder
                expect(data[2][4][27]).to.be.null

                //Routing
                expect(data[2][4][28]).to.be.a('string')
                .and.to.equal('API>BFX')

                //Placeholder
                expect(data[2][4][29]).to.be.null

                //Placeholder
                expect(data[2][4][30]).to.be.null

                //Meta
                expect(data[2][4][31]).to.be.a('object')
                .and.to.have.property('lev',10)
                expect(data[2][4][31]).and.to.have.property('$F33',10)

                } 

            // Target the on message [0,"on",[1187238101,null,1588148883485,"tBTCUSD",1588148883486,1588148883491,1,1,"LIMIT",null,null,null,0,"ACTIVE",null,null,500,0,0,0,null,null,null,0,0,null,null,null,"BFX",null,null,null]   
            if(data[1] == 'on'){
                expect(data).to.not.be.null
                console.log(`on message:`,JSON.stringify(data))

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //Order ID
                expect(data[2][0]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //GID
                expect(data[2][1]).to.be.null

                //CID
                expect(data[2][2]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Symbol
                expect(data[2][3]).to.be.a('string')
                .and.to.equal(symbol)

                //MTS Create
                expect(data[2][4]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)
                .and.to.match(/^(\d{13})?$/)

                //MTS Update
                expect(data[2][5]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)
                .and.to.match(/^(\d{13})?$/)
                .and.to.be.greaterThan(data[2][4])

                //Amount
                expect(data[2][6]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)
                .and.to.equal(sellAmount)

                //Amount Orig
                expect(data[2][7]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)
                .and.to.equal(sellAmount)

                //Order Type
                expect(data[2][8]).to.be.a('string')
                .and.to.equal('STOP')

                //Order Type Previous
                expect(data[2][9]).to.be.null

                //MTS TIF
                expect(data[2][10]).to.be.null

                //Placeholder
                expect(data[2][11]).to.be.null

                //Flags
                expect(data[2][12]).to.be.a('number')
                .and.to.equal(0)

                //Status
                expect(data[2][13]).to.be.a('string')
                expect(data[2][13]).to.contain('ACTIVE')

                //Placeholder
                expect(data[2][14]).to.be.null

                //Placeholder
                expect(data[2][15]).to.be.null

                //Price
                expect(data[2][16]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)
                .and.to.equal(buyPrice)

                //Price Average
                expect(data[2][17]).to.be.a('number')
                .and.to.equal(0)

                //Price Trailing
                expect(data[2][18]).to.be.a('number')
                .and.to.equal(0)

                //Price Aux Limit
                expect(data[2][19]).to.be.a('number')
                .and.to.equal(0)

                //Placeholder
                expect(data[2][20]).to.be.null

                //Placeholder
                expect(data[2][21]).to.be.null

                //Placeholder
                expect(data[2][22]).to.be.null

                //Notify
                expect(data[2][23]).to.be.a('number')
                .and.to.equal(0)

                //Hidden
                expect(data[2][24]).to.be.a('number')
                .and.to.equal(0)

                //Placeholder
                expect(data[2][25]).to.be.null

                //Placeholder
                expect(data[2][26]).to.be.null

                //Placeholder
                expect(data[2][27]).to.be.null

                //Routing
                expect(data[2][28]).to.be.a('string')
                .and.to.equal('API>BFX')

                //Placeholder
                expect(data[2][29]).to.be.null

                //Placeholder
                expect(data[2][30]).to.be.null

                //Meta
                expect(data[2][31]).to.be.a('object')
                .and.to.have.property('lev',10)
                expect(data[2][31]).and.to.have.property('$F33',10)
                
                
                done()
                }    
            }
        });

        it('Derivatives Stop Limit Buy Order should return a correct Notification and Order Info message', function(done) {

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

            DerivativesOrderSocket.send(payload);

        DerivativesOrderSocket.onmessage = function (event) {
            let data = JSON.parse(event.data)
            
            // Target the n message [0,"n",[1588148817.151,"on-req",null,null,[1187238099,null,1588148817151,"tBTCUSD",1588148817151,1588148817151,1,1,"LIMIT",null,null,null,0,"ACTIVE",null,null,500,0,0,0,null,null,null,0,null,null,null,null,"BFX",null,null,null],null,"SUCCESS","Submitting limit buy order for 1 BTC."]]]        

            if(data[1] == 'n'){
                expect(data).to.not.be.null
                console.log(`n message:`,JSON.stringify(data))

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //MTS Timestamp of Notification
                expect(data[2][0]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Type 
                expect(data[2][1]).to.be.a('string')
                .and.to.equal('on-req')

                //Message ID
                expect(data[2][2]).to.be.null

                //Placeholder
                expect(data[2][3]).to.be.null

                //Notify Info
                expect(data[2][4]).to.be.a('Array')

                //Code
                expect(data[2][5]).to.be.null

                //Status
                expect(data[2][6]).to.be.a('string')
                .and.to.equal('SUCCESS')

                //Text
                expect(data[2][7]).to.be.a('string')
                .and.to.equal('Submitting stop limit buy order for '+buyAmount+' '+symbolFirst+'.')

                //Order ID
                expect(data[2][4][0]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //GID
                expect(data[2][4][1]).to.be.null

                //CID
                expect(data[2][4][2]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Symbol
                expect(data[2][4][3]).to.be.a('string')
                .and.to.equal(symbol)

                //MTS Create
                expect(data[2][4][4]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)
                .and.to.match(/^(\d{13})?$/)

                //MTS Update
                expect(data[2][4][5]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)
                .and.to.match(/^(\d{13})?$/)
                .and.to.equal(data[2][4][4])

                //Amount
                expect(data[2][4][6]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)
                .and.to.equal(buyAmount)

                //Amount Orig
                expect(data[2][4][7]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)
                .and.to.equal(buyAmount)

                //Order Type
                expect(data[2][4][8]).to.be.a('string')
                .and.to.equal('STOP LIMIT')

                //Order Type Previous
                expect(data[2][4][9]).to.be.null

                //MTS TIF
                expect(data[2][4][10]).to.be.null

                //Placeholder
                expect(data[2][4][11]).to.be.null

                //Flags
                expect(data[2][4][12]).to.be.a('number')
                .and.to.equal(0)

                //Status
                expect(data[2][4][13]).to.be.a('string')
                .and.to.equal('ACTIVE')

                //Placeholder
                expect(data[2][4][14]).to.be.null

                //Placeholder
                expect(data[2][4][15]).to.be.null

                //Price
                expect(data[2][4][16]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)
                .and.to.equal(sellPrice)

                //Price Average
                expect(data[2][4][17]).to.be.a('number')
                .and.to.equal(0)

                //Price Trailing
                expect(data[2][4][18]).to.be.a('number')
                .and.to.equal(0)

                //Price Aux Limit
                expect(data[2][4][19]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)
                .and.to.equal(buyPrice)

                //Placeholder
                expect(data[2][4][20]).to.be.null

                //Placeholder
                expect(data[2][4][21]).to.be.null

                //Placeholder
                expect(data[2][4][22]).to.be.null

                //Notify
                expect(data[2][4][23]).to.be.a('number')
                .and.to.equal(0)

                //Hidden
                expect(data[2][4][24]).to.be.null

                //Placeholder
                expect(data[2][4][25]).to.be.null

                //Placeholder
                expect(data[2][4][26]).to.be.null

                //Placeholder
                expect(data[2][4][27]).to.be.null

                //Routing
                expect(data[2][4][28]).to.be.a('string')
                .and.to.equal('API>BFX')

                //Placeholder
                expect(data[2][4][29]).to.be.null

                //Placeholder
                expect(data[2][4][30]).to.be.null

                //Meta
                expect(data[2][4][31]).to.be.a('object')
                .and.to.have.property('lev',10)
                expect(data[2][4][31]).and.to.have.property('$F33',10)

                } 

            // Target the on message [0,"on",[1187238101,null,1588148883485,"tBTCUSD",1588148883486,1588148883491,1,1,"LIMIT",null,null,null,0,"ACTIVE",null,null,500,0,0,0,null,null,null,0,0,null,null,null,"BFX",null,null,null]   
            if(data[1] == 'on'){
                expect(data).to.not.be.null
                console.log(`on message:`,JSON.stringify(data))

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //Order ID
                expect(data[2][0]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //GID
                expect(data[2][1]).to.be.null

                //CID
                expect(data[2][2]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Symbol
                expect(data[2][3]).to.be.a('string')
                .and.to.equal(symbol)

                //MTS Create
                expect(data[2][4]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)
                .and.to.match(/^(\d{13})?$/)

                //MTS Update
                expect(data[2][5]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)
                .and.to.match(/^(\d{13})?$/)
                .and.to.be.greaterThan(data[2][4])

                //Amount
                expect(data[2][6]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)
                .and.to.equal(buyAmount)

                //Amount Orig
                expect(data[2][7]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)
                .and.to.equal(buyAmount)

                //Order Type
                expect(data[2][8]).to.be.a('string')
                .and.to.equal('STOP LIMIT')

                //Order Type Previous
                expect(data[2][9]).to.be.null

                //MTS TIF
                expect(data[2][10]).to.be.null

                //Placeholder
                expect(data[2][11]).to.be.null

                //Flags
                expect(data[2][12]).to.be.a('number')
                .and.to.equal(0)

                //Status
                expect(data[2][13]).to.be.a('string')
                expect(data[2][13]).to.contain('ACTIVE')

                //Placeholder
                expect(data[2][14]).to.be.null

                //Placeholder
                expect(data[2][15]).to.be.null

                //Price
                expect(data[2][16]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)
                .and.to.equal(sellPrice)

                //Price Average
                expect(data[2][17]).to.be.a('number')
                .and.to.equal(0)

                //Price Trailing
                expect(data[2][18]).to.be.a('number')
                .and.to.equal(0)

                //Price Aux Limit
                expect(data[2][19]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)
                .and.to.equal(buyPrice)

                //Placeholder
                expect(data[2][20]).to.be.null

                //Placeholder
                expect(data[2][21]).to.be.null

                //Placeholder
                expect(data[2][22]).to.be.null

                //Notify
                expect(data[2][23]).to.be.a('number')
                .and.to.equal(0)

                //Hidden
                expect(data[2][24]).to.be.a('number')
                .and.to.equal(0)

                //Placeholder
                expect(data[2][25]).to.be.null

                //Placeholder
                expect(data[2][26]).to.be.null

                //Placeholder
                expect(data[2][27]).to.be.null

                //Routing
                expect(data[2][28]).to.be.a('string')
                .and.to.equal('API>BFX')

                //Placeholder
                expect(data[2][29]).to.be.null

                //Placeholder
                expect(data[2][30]).to.be.null

                //Meta
                expect(data[2][31]).to.be.a('object')
                .and.to.have.property('lev',10)
                expect(data[2][31]).and.to.have.property('$F33',10)
                
                
                done()
                }    
            }
        });

        it('Derivatives Stop Limit Sell Order should return a correct Notification and Order Info message', function(done) {

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

            DerivativesOrderSocket.send(payload);

        DerivativesOrderSocket.onmessage = function (event) {
            let data = JSON.parse(event.data)
            
            // Target the n message [0,"n",[1588148817.151,"on-req",null,null,[1187238099,null,1588148817151,"tBTCUSD",1588148817151,1588148817151,1,1,"LIMIT",null,null,null,0,"ACTIVE",null,null,500,0,0,0,null,null,null,0,null,null,null,null,"BFX",null,null,null],null,"SUCCESS","Submitting limit buy order for 1 BTC."]]]        

            if(data[1] == 'n'){
                expect(data).to.not.be.null
                console.log(`n message:`,JSON.stringify(data))

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //MTS Timestamp of Notification
                expect(data[2][0]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Type 
                expect(data[2][1]).to.be.a('string')
                .and.to.equal('on-req')

                //Message ID
                expect(data[2][2]).to.be.null

                //Placeholder
                expect(data[2][3]).to.be.null

                //Notify Info
                expect(data[2][4]).to.be.a('Array')

                //Code
                expect(data[2][5]).to.be.null

                //Status
                expect(data[2][6]).to.be.a('string')
                .and.to.equal('SUCCESS')

                //Text
                expect(data[2][7]).to.be.a('string')
                .and.to.equal('Submitting stop limit sell order for '+sellAmount+' '+symbolFirst+'.')

                //Order ID
                expect(data[2][4][0]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //GID
                expect(data[2][4][1]).to.be.null

                //CID
                expect(data[2][4][2]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Symbol
                expect(data[2][4][3]).to.be.a('string')
                .and.to.equal(symbol)

                //MTS Create
                expect(data[2][4][4]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)
                .and.to.match(/^(\d{13})?$/)

                //MTS Update
                expect(data[2][4][5]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)
                .and.to.match(/^(\d{13})?$/)
                .and.to.equal(data[2][4][4])

                //Amount
                expect(data[2][4][6]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)
                .and.to.equal(sellAmount)

                //Amount Orig
                expect(data[2][4][7]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)
                .and.to.equal(sellAmount)

                //Order Type
                expect(data[2][4][8]).to.be.a('string')
                .and.to.equal('STOP LIMIT')

                //Order Type Previous
                expect(data[2][4][9]).to.be.null

                //MTS TIF
                expect(data[2][4][10]).to.be.null

                //Placeholder
                expect(data[2][4][11]).to.be.null

                //Flags
                expect(data[2][4][12]).to.be.a('number')
                .and.to.equal(0)

                //Status
                expect(data[2][4][13]).to.be.a('string')
                .and.to.equal('ACTIVE')

                //Placeholder
                expect(data[2][4][14]).to.be.null

                //Placeholder
                expect(data[2][4][15]).to.be.null

                //Price
                expect(data[2][4][16]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)
                .and.to.equal(buyPrice)

                //Price Average
                expect(data[2][4][17]).to.be.a('number')
                .and.to.equal(0)

                //Price Trailing
                expect(data[2][4][18]).to.be.a('number')
                .and.to.equal(0)

                //Price Aux Limit
                expect(data[2][4][19]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)
                .and.to.equal(sellPrice)

                //Placeholder
                expect(data[2][4][20]).to.be.null

                //Placeholder
                expect(data[2][4][21]).to.be.null

                //Placeholder
                expect(data[2][4][22]).to.be.null

                //Notify
                expect(data[2][4][23]).to.be.a('number')
                .and.to.equal(0)

                //Hidden
                expect(data[2][4][24]).to.be.null

                //Placeholder
                expect(data[2][4][25]).to.be.null

                //Placeholder
                expect(data[2][4][26]).to.be.null

                //Placeholder
                expect(data[2][4][27]).to.be.null

                //Routing
                expect(data[2][4][28]).to.be.a('string')
                .and.to.equal('API>BFX')

                //Placeholder
                expect(data[2][4][29]).to.be.null

                //Placeholder
                expect(data[2][4][30]).to.be.null

                //Meta
                expect(data[2][4][31]).to.be.a('object')
                .and.to.have.property('lev',10)
                expect(data[2][4][31]).and.to.have.property('$F33',10)

                } 

            // Target the on message [0,"on",[1187238101,null,1588148883485,"tBTCUSD",1588148883486,1588148883491,1,1,"LIMIT",null,null,null,0,"ACTIVE",null,null,500,0,0,0,null,null,null,0,0,null,null,null,"BFX",null,null,null]   
            if(data[1] == 'on'){
                expect(data).to.not.be.null
                console.log(`on message:`,JSON.stringify(data))

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //Order ID
                expect(data[2][0]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //GID
                expect(data[2][1]).to.be.null

                //CID
                expect(data[2][2]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Symbol
                expect(data[2][3]).to.be.a('string')
                .and.to.equal(symbol)

                //MTS Create
                expect(data[2][4]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)
                .and.to.match(/^(\d{13})?$/)

                //MTS Update
                expect(data[2][5]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)
                .and.to.match(/^(\d{13})?$/)
                .and.to.be.greaterThan(data[2][4])

                //Amount
                expect(data[2][6]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)
                .and.to.equal(sellAmount)

                //Amount Orig
                expect(data[2][7]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)
                .and.to.equal(sellAmount)

                //Order Type
                expect(data[2][8]).to.be.a('string')
                .and.to.equal('STOP LIMIT')

                //Order Type Previous
                expect(data[2][9]).to.be.null

                //MTS TIF
                expect(data[2][10]).to.be.null

                //Placeholder
                expect(data[2][11]).to.be.null

                //Flags
                expect(data[2][12]).to.be.a('number')
                .and.to.equal(0)

                //Status
                expect(data[2][13]).to.be.a('string')
                expect(data[2][13]).to.contain('ACTIVE')

                //Placeholder
                expect(data[2][14]).to.be.null

                //Placeholder
                expect(data[2][15]).to.be.null

                //Price
                expect(data[2][16]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)
                .and.to.equal(buyPrice)

                //Price Average
                expect(data[2][17]).to.be.a('number')
                .and.to.equal(0)

                //Price Trailing
                expect(data[2][18]).to.be.a('number')
                .and.to.equal(0)

                //Price Aux Limit
                expect(data[2][19]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)
                .and.to.equal(sellPrice)

                //Placeholder
                expect(data[2][20]).to.be.null

                //Placeholder
                expect(data[2][21]).to.be.null

                //Placeholder
                expect(data[2][22]).to.be.null

                //Notify
                expect(data[2][23]).to.be.a('number')
                .and.to.equal(0)

                //Hidden
                expect(data[2][24]).to.be.a('number')
                .and.to.equal(0)

                //Placeholder
                expect(data[2][25]).to.be.null

                //Placeholder
                expect(data[2][26]).to.be.null

                //Placeholder
                expect(data[2][27]).to.be.null

                //Routing
                expect(data[2][28]).to.be.a('string')
                .and.to.equal('API>BFX')

                //Placeholder
                expect(data[2][29]).to.be.null

                //Placeholder
                expect(data[2][30]).to.be.null

                //Meta
                expect(data[2][31]).to.be.a('object')
                .and.to.have.property('lev',10)
                expect(data[2][31]).and.to.have.property('$F33',10)
                
                
                done()
                }    
            }
        });

        it('Derivatives Trailing Stop Buy Order should return a correct Notification and Order Info message', function(done) {

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

            DerivativesOrderSocket.send(payload);

        DerivativesOrderSocket.onmessage = function (event) {
            let data = JSON.parse(event.data)
            
            // Target the n message [0,"n",[1588148817.151,"on-req",null,null,[1187238099,null,1588148817151,"tBTCUSD",1588148817151,1588148817151,1,1,"LIMIT",null,null,null,0,"ACTIVE",null,null,500,0,0,0,null,null,null,0,null,null,null,null,"BFX",null,null,null],null,"SUCCESS","Submitting limit buy order for 1 BTC."]]]        

            if(data[1] == 'n'){
                expect(data).to.not.be.null
                console.log(`n message:`,JSON.stringify(data))

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //MTS Timestamp of Notification
                expect(data[2][0]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Type 
                expect(data[2][1]).to.be.a('string')
                .and.to.equal('on-req')

                //Message ID
                expect(data[2][2]).to.be.null

                //Placeholder
                expect(data[2][3]).to.be.null

                //Notify Info
                expect(data[2][4]).to.be.a('Array')

                //Code
                expect(data[2][5]).to.be.null

                //Status
                expect(data[2][6]).to.be.a('string')
                .and.to.equal('SUCCESS')

                //Text
                expect(data[2][7]).to.be.a('string')
                .and.to.equal('Submitting trailing stop buy order for '+buyAmount+' '+symbolFirst+'.')

                //Order ID
                expect(data[2][4][0]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //GID
                expect(data[2][4][1]).to.be.null

                //CID
                expect(data[2][4][2]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Symbol
                expect(data[2][4][3]).to.be.a('string')
                .and.to.equal(symbol)

                //MTS Create
                expect(data[2][4][4]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)
                .and.to.match(/^(\d{13})?$/)

                //MTS Update
                expect(data[2][4][5]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)
                .and.to.match(/^(\d{13})?$/)
                .and.to.equal(data[2][4][4])

                //Amount
                expect(data[2][4][6]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)
                .and.to.equal(buyAmount)

                //Amount Orig
                expect(data[2][4][7]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)
                .and.to.equal(buyAmount)

                //Order Type
                expect(data[2][4][8]).to.be.a('string')
                .and.to.equal('TRAILING STOP')

                //Order Type Previous
                expect(data[2][4][9]).to.be.null

                //MTS TIF
                expect(data[2][4][10]).to.be.null

                //Placeholder
                expect(data[2][4][11]).to.be.null

                //Flags
                expect(data[2][4][12]).to.be.a('number')
                .and.to.equal(0)

                //Status
                expect(data[2][4][13]).to.be.a('string')
                .and.to.equal('ACTIVE')

                //Placeholder
                expect(data[2][4][14]).to.be.null

                //Placeholder
                expect(data[2][4][15]).to.be.null

                //Price
                expect(data[2][4][16]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Price Average
                expect(data[2][4][17]).to.be.a('number')
                .and.to.equal(0)

                //Price Trailing
                expect(data[2][4][18]).to.be.a('number')
                .and.to.equal(buyPrice)

                //Price Aux Limit
                expect(data[2][4][19]).to.be.a('number')
                .and.to.equal(0)

                //Placeholder
                expect(data[2][4][20]).to.be.null

                //Placeholder
                expect(data[2][4][21]).to.be.null

                //Placeholder
                expect(data[2][4][22]).to.be.null

                //Notify
                expect(data[2][4][23]).to.be.a('number')
                .and.to.equal(0)

                //Hidden
                expect(data[2][4][24]).to.be.null

                //Placeholder
                expect(data[2][4][25]).to.be.null

                //Placeholder
                expect(data[2][4][26]).to.be.null

                //Placeholder
                expect(data[2][4][27]).to.be.null

                //Routing
                expect(data[2][4][28]).to.be.a('string')
                .and.to.equal('API>BFX')

                //Placeholder
                expect(data[2][4][29]).to.be.null

                //Placeholder
                expect(data[2][4][30]).to.be.null

                //Meta
                expect(data[2][4][31]).to.be.a('object')
                .and.to.have.property('lev',10)
                expect(data[2][4][31]).and.to.have.property('$F33',10)

                } 

            // Target the on message [0,"on",[1187238101,null,1588148883485,"tBTCUSD",1588148883486,1588148883491,1,1,"LIMIT",null,null,null,0,"ACTIVE",null,null,500,0,0,0,null,null,null,0,0,null,null,null,"BFX",null,null,null]   
            if(data[1] == 'on'){
                expect(data).to.not.be.null
                console.log(`on message:`,JSON.stringify(data))

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //Order ID
                expect(data[2][0]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //GID
                expect(data[2][1]).to.be.null

                //CID
                expect(data[2][2]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Symbol
                expect(data[2][3]).to.be.a('string')
                .and.to.equal(symbol)

                //MTS Create
                expect(data[2][4]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)
                .and.to.match(/^(\d{13})?$/)

                //MTS Update
                expect(data[2][5]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)
                .and.to.match(/^(\d{13})?$/)
                .and.to.be.greaterThan(data[2][4])

                //Amount
                expect(data[2][6]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)
                .and.to.equal(buyAmount)

                //Amount Orig
                expect(data[2][7]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)
                .and.to.equal(buyAmount)

                //Order Type
                expect(data[2][8]).to.be.a('string')
                .and.to.equal('TRAILING STOP')

                //Order Type Previous
                expect(data[2][9]).to.be.null

                //MTS TIF
                expect(data[2][10]).to.be.null

                //Placeholder
                expect(data[2][11]).to.be.null

                //Flags
                expect(data[2][12]).to.be.a('number')
                .and.to.equal(0)

                //Status
                expect(data[2][13]).to.be.a('string')
                expect(data[2][13]).to.contain('ACTIVE')

                //Placeholder
                expect(data[2][14]).to.be.null

                //Placeholder
                expect(data[2][15]).to.be.null

                //Price
                expect(data[2][16]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Price Average
                expect(data[2][17]).to.be.a('number')
                .and.to.equal(0)

                //Price Trailing
                expect(data[2][18]).to.be.a('number')
                .and.to.equal(buyPrice)

                //Price Aux Limit
                expect(data[2][19]).to.be.a('number')
                .and.to.equal(0)

                //Placeholder
                expect(data[2][20]).to.be.null

                //Placeholder
                expect(data[2][21]).to.be.null

                //Placeholder
                expect(data[2][22]).to.be.null

                //Notify
                expect(data[2][23]).to.be.a('number')
                .and.to.equal(0)

                //Hidden
                expect(data[2][24]).to.be.a('number')
                .and.to.equal(0)

                //Placeholder
                expect(data[2][25]).to.be.null

                //Placeholder
                expect(data[2][26]).to.be.null

                //Placeholder
                expect(data[2][27]).to.be.null

                //Routing
                expect(data[2][28]).to.be.a('string')
                .and.to.equal('API>BFX')

                //Placeholder
                expect(data[2][29]).to.be.null

                //Placeholder
                expect(data[2][30]).to.be.null

                //Meta
                expect(data[2][31]).to.be.a('object')
                .and.to.have.property('lev',10)
                expect(data[2][31]).and.to.have.property('$F33',10)
                
                
                done()
                }    
            }
        });

        it('Derivatives Trailing Stop Sell Order should return a correct Notification and Order Info message', function(done) {

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

            DerivativesOrderSocket.send(payload);

        DerivativesOrderSocket.onmessage = function (event) {
            let data = JSON.parse(event.data)
            
            // Target the n message [0,"n",[1588148817.151,"on-req",null,null,[1187238099,null,1588148817151,"tBTCUSD",1588148817151,1588148817151,1,1,"LIMIT",null,null,null,0,"ACTIVE",null,null,500,0,0,0,null,null,null,0,null,null,null,null,"BFX",null,null,null],null,"SUCCESS","Submitting limit buy order for 1 BTC."]]]        

            if(data[1] == 'n'){
                expect(data).to.not.be.null
                console.log(`n message:`,JSON.stringify(data))

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //MTS Timestamp of Notification
                expect(data[2][0]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Type 
                expect(data[2][1]).to.be.a('string')
                .and.to.equal('on-req')

                //Message ID
                expect(data[2][2]).to.be.null

                //Placeholder
                expect(data[2][3]).to.be.null

                //Notify Info
                expect(data[2][4]).to.be.a('Array')

                //Code
                expect(data[2][5]).to.be.null

                //Status
                expect(data[2][6]).to.be.a('string')
                .and.to.equal('SUCCESS')

                //Text
                expect(data[2][7]).to.be.a('string')
                .and.to.equal('Submitting trailing stop sell order for '+sellAmount+' '+symbolFirst+'.')

                //Order ID
                expect(data[2][4][0]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //GID
                expect(data[2][4][1]).to.be.null

                //CID
                expect(data[2][4][2]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Symbol
                expect(data[2][4][3]).to.be.a('string')
                .and.to.equal(symbol)

                //MTS Create
                expect(data[2][4][4]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)
                .and.to.match(/^(\d{13})?$/)

                //MTS Update
                expect(data[2][4][5]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)
                .and.to.match(/^(\d{13})?$/)
                .and.to.equal(data[2][4][4])

                //Amount
                expect(data[2][4][6]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)
                .and.to.equal(sellAmount)

                //Amount Orig
                expect(data[2][4][7]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)
                .and.to.equal(sellAmount)

                //Order Type
                expect(data[2][4][8]).to.be.a('string')
                .and.to.equal('TRAILING STOP')

                //Order Type Previous
                expect(data[2][4][9]).to.be.null

                //MTS TIF
                expect(data[2][4][10]).to.be.null

                //Placeholder
                expect(data[2][4][11]).to.be.null

                //Flags
                expect(data[2][4][12]).to.be.a('number')
                .and.to.equal(0)

                //Status
                expect(data[2][4][13]).to.be.a('string')
                .and.to.equal('ACTIVE')

                //Placeholder
                expect(data[2][4][14]).to.be.null

                //Placeholder
                expect(data[2][4][15]).to.be.null

                //Price
                expect(data[2][4][16]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Price Average
                expect(data[2][4][17]).to.be.a('number')
                .and.to.equal(0)

                //Price Trailing
                expect(data[2][4][18]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)
                .and.to.equal(buyPrice)

                //Price Aux Limit
                expect(data[2][4][19]).to.be.a('number')
                .and.to.equal(0)

                //Placeholder
                expect(data[2][4][20]).to.be.null

                //Placeholder
                expect(data[2][4][21]).to.be.null

                //Placeholder
                expect(data[2][4][22]).to.be.null

                //Notify
                expect(data[2][4][23]).to.be.a('number')
                .and.to.equal(0)

                //Hidden
                expect(data[2][4][24]).to.be.null

                //Placeholder
                expect(data[2][4][25]).to.be.null

                //Placeholder
                expect(data[2][4][26]).to.be.null

                //Placeholder
                expect(data[2][4][27]).to.be.null

                //Routing
                expect(data[2][4][28]).to.be.a('string')
                .and.to.equal('API>BFX')

                //Placeholder
                expect(data[2][4][29]).to.be.null

                //Placeholder
                expect(data[2][4][30]).to.be.null

                //Meta
                expect(data[2][4][31]).to.be.a('object')
                .and.to.have.property('lev',10)
                expect(data[2][4][31]).and.to.have.property('$F33',10)

                } 

            // Target the on message [0,"on",[1187238101,null,1588148883485,"tBTCUSD",1588148883486,1588148883491,1,1,"LIMIT",null,null,null,0,"ACTIVE",null,null,500,0,0,0,null,null,null,0,0,null,null,null,"BFX",null,null,null]   
            if(data[1] == 'on'){
                expect(data).to.not.be.null
                console.log(`on message:`,JSON.stringify(data))

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //Order ID
                expect(data[2][0]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //GID
                expect(data[2][1]).to.be.null

                //CID
                expect(data[2][2]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Symbol
                expect(data[2][3]).to.be.a('string')
                .and.to.equal(symbol)

                //MTS Create
                expect(data[2][4]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)
                .and.to.match(/^(\d{13})?$/)

                //MTS Update
                expect(data[2][5]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)
                .and.to.match(/^(\d{13})?$/)
                .and.to.be.greaterThan(data[2][4])

                //Amount
                expect(data[2][6]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)
                .and.to.equal(sellAmount)

                //Amount Orig
                expect(data[2][7]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)
                .and.to.equal(sellAmount)

                //Order Type
                expect(data[2][8]).to.be.a('string')
                .and.to.equal('TRAILING STOP')

                //Order Type Previous
                expect(data[2][9]).to.be.null

                //MTS TIF
                expect(data[2][10]).to.be.null

                //Placeholder
                expect(data[2][11]).to.be.null

                //Flags
                expect(data[2][12]).to.be.a('number')
                .and.to.equal(0)

                //Status
                expect(data[2][13]).to.be.a('string')
                expect(data[2][13]).to.contain('ACTIVE')

                //Placeholder
                expect(data[2][14]).to.be.null

                //Placeholder
                expect(data[2][15]).to.be.null

                //Price
                expect(data[2][16]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Price Average
                expect(data[2][17]).to.be.a('number')
                .and.to.equal(0)

                //Price Trailing
                expect(data[2][18]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)
                .and.to.equal(buyPrice)

                //Price Aux Limit
                expect(data[2][19]).to.be.a('number')
                .and.to.equal(0)

                //Placeholder
                expect(data[2][20]).to.be.null

                //Placeholder
                expect(data[2][21]).to.be.null

                //Placeholder
                expect(data[2][22]).to.be.null

                //Notify
                expect(data[2][23]).to.be.a('number')
                .and.to.equal(0)

                //Hidden
                expect(data[2][24]).to.be.a('number')
                .and.to.equal(0)

                //Placeholder
                expect(data[2][25]).to.be.null

                //Placeholder
                expect(data[2][26]).to.be.null

                //Placeholder
                expect(data[2][27]).to.be.null

                //Routing
                expect(data[2][28]).to.be.a('string')
                .and.to.equal('API>BFX')

                //Placeholder
                expect(data[2][29]).to.be.null

                //Placeholder
                expect(data[2][30]).to.be.null

                //Meta
                expect(data[2][31]).to.be.a('object')
                .and.to.have.property('lev',10)
                expect(data[2][31]).and.to.have.property('$F33',10)
                
                
                done()
                }    
            }
        });

        it('Derivatives FOK Buy Order should return a correct Notification and Order Info message', function(done) {

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

            DerivativesOrderSocket.send(payload);

        DerivativesOrderSocket.onmessage = function (event) {
            let data = JSON.parse(event.data)
            
            // Target the n message [0,"n",[1588148817.151,"on-req",null,null,[1187238099,null,1588148817151,"tBTCUSD",1588148817151,1588148817151,1,1,"LIMIT",null,null,null,0,"ACTIVE",null,null,500,0,0,0,null,null,null,0,null,null,null,null,"BFX",null,null,null],null,"SUCCESS","Submitting limit buy order for 1 BTC."]]]        

            if(data[1] == 'n'){
                expect(data).to.not.be.null
                console.log(`n message:`,JSON.stringify(data))

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //MTS Timestamp of Notification
                expect(data[2][0]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Type 
                expect(data[2][1]).to.be.a('string')
                .and.to.equal('on-req')

                //Message ID
                expect(data[2][2]).to.be.null

                //Placeholder
                expect(data[2][3]).to.be.null

                //Notify Info
                expect(data[2][4]).to.be.a('Array')

                //Code
                expect(data[2][5]).to.be.null

                //Status
                expect(data[2][6]).to.be.a('string')
                .and.to.equal('SUCCESS')

                //Text
                expect(data[2][7]).to.be.a('string')
                .and.to.equal('Submitting fok buy order for '+buyAmount+' '+symbolFirst+'.')

                //Order ID
                expect(data[2][4][0]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //GID
                expect(data[2][4][1]).to.be.null

                //CID
                expect(data[2][4][2]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Symbol
                expect(data[2][4][3]).to.be.a('string')
                .and.to.equal(symbol)

                //MTS Create
                expect(data[2][4][4]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)
                .and.to.match(/^(\d{13})?$/)

                //MTS Update
                expect(data[2][4][5]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)
                .and.to.match(/^(\d{13})?$/)
                .and.to.equal(data[2][4][4])

                //Amount
                expect(data[2][4][6]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)
                .and.to.equal(buyAmount)

                //Amount Orig
                expect(data[2][4][7]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)
                .and.to.equal(buyAmount)

                //Order Type
                expect(data[2][4][8]).to.be.a('string')
                .and.to.equal('FOK')

                //Order Type Previous
                expect(data[2][4][9]).to.be.null

                //MTS TIF
                expect(data[2][4][10]).to.be.null

                //Placeholder
                expect(data[2][4][11]).to.be.null

                //Flags
                expect(data[2][4][12]).to.be.a('number')
                .and.to.equal(0)

                //Status
                expect(data[2][4][13]).to.be.a('string')
                .and.to.equal('ACTIVE')

                //Placeholder
                expect(data[2][4][14]).to.be.null

                //Placeholder
                expect(data[2][4][15]).to.be.null

                //Price
                expect(data[2][4][16]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)
                .and.to.equal(buyPrice)

                //Price Average
                expect(data[2][4][17]).to.be.a('number')
                .and.to.equal(0)

                //Price Trailing
                expect(data[2][4][18]).to.be.a('number')
                .and.to.equal(0)

                //Price Aux Limit
                expect(data[2][4][19]).to.be.a('number')
                .and.to.equal(0)

                //Placeholder
                expect(data[2][4][20]).to.be.null

                //Placeholder
                expect(data[2][4][21]).to.be.null

                //Placeholder
                expect(data[2][4][22]).to.be.null

                //Notify
                expect(data[2][4][23]).to.be.a('number')
                .and.to.equal(0)

                //Hidden
                expect(data[2][4][24]).to.be.null

                //Placeholder
                expect(data[2][4][25]).to.be.null

                //Placeholder
                expect(data[2][4][26]).to.be.null

                //Placeholder
                expect(data[2][4][27]).to.be.null

                //Routing
                expect(data[2][4][28]).to.be.a('string')
                .and.to.equal('API>BFX')

                //Placeholder
                expect(data[2][4][29]).to.be.null

                //Placeholder
                expect(data[2][4][30]).to.be.null

                //Meta
                expect(data[2][4][31]).to.be.a('object')
                .and.to.have.property('lev',10)
                expect(data[2][4][31]).and.to.have.property('$F33',10)

                } 

            // Target the oc message [0,"oc",[1187238160,null,1588158739438,"tBTCUSD",1588158739438,1588158739444,0,0.001,"MARKET",null,null,null,0,"EXECUTED @ 8150.0(0.001)",null,null,8150,8150,0,0,null,null,null,0,0,null,null,null,"BFX",null,null,null]]    
            if(data[1] == 'oc'){
                expect(data).to.not.be.null
                console.log(`oc message:`,JSON.stringify(data))

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //Order ID
                expect(data[2][0]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //GID
                expect(data[2][1]).to.be.null

                //CID
                expect(data[2][2]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Symbol
                expect(data[2][3]).to.be.a('string')
                .and.to.equal(symbol)

                //MTS Create
                expect(data[2][4]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)
                .and.to.match(/^(\d{13})?$/)

                //MTS Update
                expect(data[2][5]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)
                .and.to.match(/^(\d{13})?$/)
                .and.to.be.greaterThan(data[2][4])

                //Amount
                expect(data[2][6]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Amount Orig
                expect(data[2][7]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)
                .and.to.equal(buyAmount)

                //Order Type
                expect(data[2][8]).to.be.a('string')
                .and.to.equal('FOK')

                //Order Type Previous
                expect(data[2][9]).to.be.null

                //MTS TIF
                expect(data[2][10]).to.be.null

                //Placeholder
                expect(data[2][11]).to.be.null

                //Flags
                expect(data[2][12]).to.be.a('number')
                .and.to.equal(0)

                //Status
                expect(data[2][13]).to.be.a('string')
                expect(data[2][13]).to.contain('FILLORKILL CANCELED')

                //Placeholder
                expect(data[2][14]).to.be.null

                //Placeholder
                expect(data[2][15]).to.be.null

                //Price
                expect(data[2][16]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)
                .and.to.equal(buyPrice)

                //Price Average
                expect(data[2][17]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Price Trailing
                expect(data[2][18]).to.be.a('number')
                .and.to.equal(0)

                //Price Aux Limit
                expect(data[2][19]).to.be.a('number')
                .and.to.equal(0)

                //Placeholder
                expect(data[2][20]).to.be.null

                //Placeholder
                expect(data[2][21]).to.be.null

                //Placeholder
                expect(data[2][22]).to.be.null

                //Notify
                expect(data[2][23]).to.be.a('number')
                .and.to.equal(0)

                //Hidden
                expect(data[2][24]).to.be.a('number')
                .and.to.equal(0)

                //Placeholder
                expect(data[2][25]).to.be.null

                //Placeholder
                expect(data[2][26]).to.be.null

                //Placeholder
                expect(data[2][27]).to.be.null

                //Routing
                expect(data[2][28]).to.be.a('string')
                .and.to.equal('API>BFX')

                //Placeholder
                expect(data[2][29]).to.be.null

                //Placeholder
                expect(data[2][30]).to.be.null

                //Meta
                expect(data[2][31]).to.be.a('object')
                .and.to.have.property('lev',10)
                expect(data[2][31]).and.to.have.property('$F33',10)
                
                
                done()
                }    
            }
        });

        it('Derivatives FOK Sell Order should return a correct Notification and Order Info message', function(done) {

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

            DerivativesOrderSocket.send(payload);

        DerivativesOrderSocket.onmessage = function (event) {
            let data = JSON.parse(event.data)
            
            // Target the n message [0,"n",[1588148817.151,"on-req",null,null,[1187238099,null,1588148817151,"tBTCUSD",1588148817151,1588148817151,1,1,"LIMIT",null,null,null,0,"ACTIVE",null,null,500,0,0,0,null,null,null,0,null,null,null,null,"BFX",null,null,null],null,"SUCCESS","Submitting limit buy order for 1 BTC."]]]        

            if(data[1] == 'n'){
                expect(data).to.not.be.null
                console.log(`n message:`,JSON.stringify(data))

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //MTS Timestamp of Notification
                expect(data[2][0]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Type 
                expect(data[2][1]).to.be.a('string')
                .and.to.equal('on-req')

                //Message ID
                expect(data[2][2]).to.be.null

                //Placeholder
                expect(data[2][3]).to.be.null

                //Notify Info
                expect(data[2][4]).to.be.a('Array')

                //Code
                expect(data[2][5]).to.be.null

                //Status
                expect(data[2][6]).to.be.a('string')
                .and.to.equal('SUCCESS')

                //Text
                expect(data[2][7]).to.be.a('string')
                .and.to.equal('Submitting fok sell order for '+sellAmount+' '+symbolFirst+'.')

                //Order ID
                expect(data[2][4][0]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //GID
                expect(data[2][4][1]).to.be.null

                //CID
                expect(data[2][4][2]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Symbol
                expect(data[2][4][3]).to.be.a('string')
                .and.to.equal(symbol)

                //MTS Create
                expect(data[2][4][4]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)
                .and.to.match(/^(\d{13})?$/)

                //MTS Update
                expect(data[2][4][5]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)
                .and.to.match(/^(\d{13})?$/)
                .and.to.equal(data[2][4][4])

                //Amount
                expect(data[2][4][6]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)
                .and.to.equal(sellAmount)

                //Amount Orig
                expect(data[2][4][7]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)
                .and.to.equal(sellAmount)

                //Order Type
                expect(data[2][4][8]).to.be.a('string')
                .and.to.equal('FOK')

                //Order Type Previous
                expect(data[2][4][9]).to.be.null

                //MTS TIF
                expect(data[2][4][10]).to.be.null

                //Placeholder
                expect(data[2][4][11]).to.be.null

                //Flags
                expect(data[2][4][12]).to.be.a('number')
                .and.to.equal(0)

                //Status
                expect(data[2][4][13]).to.be.a('string')
                .and.to.equal('ACTIVE')

                //Placeholder
                expect(data[2][4][14]).to.be.null

                //Placeholder
                expect(data[2][4][15]).to.be.null

                //Price
                expect(data[2][4][16]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)
                .and.to.equal(sellPrice)

                //Price Average
                expect(data[2][4][17]).to.be.a('number')
                .and.to.equal(0)

                //Price Trailing
                expect(data[2][4][18]).to.be.a('number')
                .and.to.equal(0)

                //Price Aux Limit
                expect(data[2][4][19]).to.be.a('number')
                .and.to.equal(0)

                //Placeholder
                expect(data[2][4][20]).to.be.null

                //Placeholder
                expect(data[2][4][21]).to.be.null

                //Placeholder
                expect(data[2][4][22]).to.be.null

                //Notify
                expect(data[2][4][23]).to.be.a('number')
                .and.to.equal(0)

                //Hidden
                expect(data[2][4][24]).to.be.null

                //Placeholder
                expect(data[2][4][25]).to.be.null

                //Placeholder
                expect(data[2][4][26]).to.be.null

                //Placeholder
                expect(data[2][4][27]).to.be.null

                //Routing
                expect(data[2][4][28]).to.be.a('string')
                .and.to.equal('API>BFX')

                //Placeholder
                expect(data[2][4][29]).to.be.null

                //Placeholder
                expect(data[2][4][30]).to.be.null

                //Meta
                expect(data[2][4][31]).to.be.a('object')
                .and.to.have.property('lev',10)
                expect(data[2][4][31]).and.to.have.property('$F33',10)

                } 

            // Target the oc message [0,"oc",[1187238160,null,1588158739438,"tBTCUSD",1588158739438,1588158739444,0,0.001,"MARKET",null,null,null,0,"EXECUTED @ 8150.0(0.001)",null,null,8150,8150,0,0,null,null,null,0,0,null,null,null,"BFX",null,null,null]]    
            if(data[1] == 'oc'){
                expect(data).to.not.be.null
                console.log(`oc message:`,JSON.stringify(data))

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //Order ID
                expect(data[2][0]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //GID
                expect(data[2][1]).to.be.null

                //CID
                expect(data[2][2]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Symbol
                expect(data[2][3]).to.be.a('string')
                .and.to.equal(symbol)

                //MTS Create
                expect(data[2][4]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)
                .and.to.match(/^(\d{13})?$/)

                //MTS Update
                expect(data[2][5]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)
                .and.to.match(/^(\d{13})?$/)
                .and.to.be.greaterThan(data[2][4])

                //Amount
                expect(data[2][6]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Amount Orig
                expect(data[2][7]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)
                .and.to.equal(sellAmount)

                //Order Type
                expect(data[2][8]).to.be.a('string')
                .and.to.equal('FOK')

                //Order Type Previous
                expect(data[2][9]).to.be.null

                //MTS TIF
                expect(data[2][10]).to.be.null

                //Placeholder
                expect(data[2][11]).to.be.null

                //Flags
                expect(data[2][12]).to.be.a('number')
                .and.to.equal(0)

                //Status
                expect(data[2][13]).to.be.a('string')
                expect(data[2][13]).to.contain('FILLORKILL CANCELED')

                //Placeholder
                expect(data[2][14]).to.be.null

                //Placeholder
                expect(data[2][15]).to.be.null

                //Price
                expect(data[2][16]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)
                .and.to.equal(sellPrice)

                //Price Average
                expect(data[2][17]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Price Trailing
                expect(data[2][18]).to.be.a('number')
                .and.to.equal(0)

                //Price Aux Limit
                expect(data[2][19]).to.be.a('number')
                .and.to.equal(0)

                //Placeholder
                expect(data[2][20]).to.be.null

                //Placeholder
                expect(data[2][21]).to.be.null

                //Placeholder
                expect(data[2][22]).to.be.null

                //Notify
                expect(data[2][23]).to.be.a('number')
                .and.to.equal(0)

                //Hidden
                expect(data[2][24]).to.be.a('number')
                .and.to.equal(0)

                //Placeholder
                expect(data[2][25]).to.be.null

                //Placeholder
                expect(data[2][26]).to.be.null

                //Placeholder
                expect(data[2][27]).to.be.null

                //Routing
                expect(data[2][28]).to.be.a('string')
                .and.to.equal('API>BFX')

                //Placeholder
                expect(data[2][29]).to.be.null

                //Placeholder
                expect(data[2][30]).to.be.null

                //Meta
                expect(data[2][31]).to.be.a('object')
                .and.to.have.property('lev',10)
                expect(data[2][31]).and.to.have.property('$F33',10)
                
                
                done()
                }    
            }
        });

        it('Derivatives IOC Buy Order should return a correct Notification and Order Info message', function(done) {

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

            DerivativesOrderSocket.send(payload);

        DerivativesOrderSocket.onmessage = function (event) {
            let data = JSON.parse(event.data)
            
            // Target the n message [0,"n",[1588148817.151,"on-req",null,null,[1187238099,null,1588148817151,"tBTCUSD",1588148817151,1588148817151,1,1,"LIMIT",null,null,null,0,"ACTIVE",null,null,500,0,0,0,null,null,null,0,null,null,null,null,"BFX",null,null,null],null,"SUCCESS","Submitting limit buy order for 1 BTC."]]]        

            if(data[1] == 'n'){
                expect(data).to.not.be.null
                console.log(`n message:`,JSON.stringify(data))

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //MTS Timestamp of Notification
                expect(data[2][0]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Type 
                expect(data[2][1]).to.be.a('string')
                .and.to.equal('on-req')

                //Message ID
                expect(data[2][2]).to.be.null

                //Placeholder
                expect(data[2][3]).to.be.null

                //Notify Info
                expect(data[2][4]).to.be.a('Array')

                //Code
                expect(data[2][5]).to.be.null

                //Status
                expect(data[2][6]).to.be.a('string')
                .and.to.equal('SUCCESS')

                //Text
                expect(data[2][7]).to.be.a('string')
                .and.to.equal('Submitting ioc buy order for '+buyAmount+' '+symbolFirst+'.')

                //Order ID
                expect(data[2][4][0]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //GID
                expect(data[2][4][1]).to.be.null

                //CID
                expect(data[2][4][2]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Symbol
                expect(data[2][4][3]).to.be.a('string')
                .and.to.equal(symbol)

                //MTS Create
                expect(data[2][4][4]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)
                .and.to.match(/^(\d{13})?$/)

                //MTS Update
                expect(data[2][4][5]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)
                .and.to.match(/^(\d{13})?$/)
                .and.to.equal(data[2][4][4])

                //Amount
                expect(data[2][4][6]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)
                .and.to.equal(buyAmount)

                //Amount Orig
                expect(data[2][4][7]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)
                .and.to.equal(buyAmount)

                //Order Type
                expect(data[2][4][8]).to.be.a('string')
                .and.to.equal('IOC')

                //Order Type Previous
                expect(data[2][4][9]).to.be.null

                //MTS TIF
                expect(data[2][4][10]).to.be.null

                //Placeholder
                expect(data[2][4][11]).to.be.null

                //Flags
                expect(data[2][4][12]).to.be.a('number')
                .and.to.equal(0)

                //Status
                expect(data[2][4][13]).to.be.a('string')
                .and.to.equal('ACTIVE')

                //Placeholder
                expect(data[2][4][14]).to.be.null

                //Placeholder
                expect(data[2][4][15]).to.be.null

                //Price
                expect(data[2][4][16]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)
                .and.to.equal(buyPrice)

                //Price Average
                expect(data[2][4][17]).to.be.a('number')
                .and.to.equal(0)

                //Price Trailing
                expect(data[2][4][18]).to.be.a('number')
                .and.to.equal(0)

                //Price Aux Limit
                expect(data[2][4][19]).to.be.a('number')
                .and.to.equal(0)

                //Placeholder
                expect(data[2][4][20]).to.be.null

                //Placeholder
                expect(data[2][4][21]).to.be.null

                //Placeholder
                expect(data[2][4][22]).to.be.null

                //Notify
                expect(data[2][4][23]).to.be.a('number')
                .and.to.equal(0)

                //Hidden
                expect(data[2][4][24]).to.be.null

                //Placeholder
                expect(data[2][4][25]).to.be.null

                //Placeholder
                expect(data[2][4][26]).to.be.null

                //Placeholder
                expect(data[2][4][27]).to.be.null

                //Routing
                expect(data[2][4][28]).to.be.a('string')
                .and.to.equal('API>BFX')

                //Placeholder
                expect(data[2][4][29]).to.be.null

                //Placeholder
                expect(data[2][4][30]).to.be.null

                //Meta
                expect(data[2][4][31]).to.be.a('object')
                .and.to.have.property('lev',10)
                expect(data[2][4][31]).and.to.have.property('$F33',10)

                } 

            // Target the oc message [0,"oc",[1187238160,null,1588158739438,"tBTCUSD",1588158739438,1588158739444,0,0.001,"MARKET",null,null,null,0,"EXECUTED @ 8150.0(0.001)",null,null,8150,8150,0,0,null,null,null,0,0,null,null,null,"BFX",null,null,null]]    
            if(data[1] == 'oc'){
                expect(data).to.not.be.null
                console.log(`oc message:`,JSON.stringify(data))

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //Order ID
                expect(data[2][0]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //GID
                expect(data[2][1]).to.be.null

                //CID
                expect(data[2][2]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Symbol
                expect(data[2][3]).to.be.a('string')
                .and.to.equal(symbol)

                //MTS Create
                expect(data[2][4]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)
                .and.to.match(/^(\d{13})?$/)

                //MTS Update
                expect(data[2][5]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)
                .and.to.match(/^(\d{13})?$/)
                .and.to.be.greaterThan(data[2][4])

                //Amount
                expect(data[2][6]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Amount Orig
                expect(data[2][7]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)
                .and.to.equal(buyAmount)

                //Order Type
                expect(data[2][8]).to.be.a('string')
                .and.to.equal('IOC')

                //Order Type Previous
                expect(data[2][9]).to.be.null

                //MTS TIF
                expect(data[2][10]).to.be.null

                //Placeholder
                expect(data[2][11]).to.be.null

                //Flags
                expect(data[2][12]).to.be.a('number')
                .and.to.equal(0)

                //Status
                expect(data[2][13]).to.be.a('string')
                expect(data[2][13]).to.contain('IOC CANCELED')

                //Placeholder
                expect(data[2][14]).to.be.null

                //Placeholder
                expect(data[2][15]).to.be.null

                //Price
                expect(data[2][16]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)
                .and.to.equal(buyPrice)

                //Price Average
                expect(data[2][17]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Price Trailing
                expect(data[2][18]).to.be.a('number')
                .and.to.equal(0)

                //Price Aux Limit
                expect(data[2][19]).to.be.a('number')
                .and.to.equal(0)

                //Placeholder
                expect(data[2][20]).to.be.null

                //Placeholder
                expect(data[2][21]).to.be.null

                //Placeholder
                expect(data[2][22]).to.be.null

                //Notify
                expect(data[2][23]).to.be.a('number')
                .and.to.equal(0)

                //Hidden
                expect(data[2][24]).to.be.a('number')
                .and.to.equal(0)

                //Placeholder
                expect(data[2][25]).to.be.null

                //Placeholder
                expect(data[2][26]).to.be.null

                //Placeholder
                expect(data[2][27]).to.be.null

                //Routing
                expect(data[2][28]).to.be.a('string')
                .and.to.equal('API>BFX')

                //Placeholder
                expect(data[2][29]).to.be.null

                //Placeholder
                expect(data[2][30]).to.be.null

                //Meta
                expect(data[2][31]).to.be.a('object')
                .and.to.have.property('lev',10)
                expect(data[2][31]).and.to.have.property('$F33',10)
                
                
                done()
                }    
            }
        });

        it('Derivatives IOC Sell Order should return a correct Notification and Order Info message', function(done) {

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

            DerivativesOrderSocket.send(payload);

        DerivativesOrderSocket.onmessage = function (event) {
            let data = JSON.parse(event.data)
            
            // Target the n message [0,"n",[1588148817.151,"on-req",null,null,[1187238099,null,1588148817151,"tBTCUSD",1588148817151,1588148817151,1,1,"LIMIT",null,null,null,0,"ACTIVE",null,null,500,0,0,0,null,null,null,0,null,null,null,null,"BFX",null,null,null],null,"SUCCESS","Submitting limit buy order for 1 BTC."]]]        

            if(data[1] == 'n'){
                expect(data).to.not.be.null
                console.log(`n message:`,JSON.stringify(data))

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //MTS Timestamp of Notification
                expect(data[2][0]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Type 
                expect(data[2][1]).to.be.a('string')
                .and.to.equal('on-req')

                //Message ID
                expect(data[2][2]).to.be.null

                //Placeholder
                expect(data[2][3]).to.be.null

                //Notify Info
                expect(data[2][4]).to.be.a('Array')

                //Code
                expect(data[2][5]).to.be.null

                //Status
                expect(data[2][6]).to.be.a('string')
                .and.to.equal('SUCCESS')

                //Text
                expect(data[2][7]).to.be.a('string')
                .and.to.equal('Submitting ioc sell order for '+sellAmount+' '+symbolFirst+'.')

                //Order ID
                expect(data[2][4][0]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //GID
                expect(data[2][4][1]).to.be.null

                //CID
                expect(data[2][4][2]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Symbol
                expect(data[2][4][3]).to.be.a('string')
                .and.to.equal(symbol)

                //MTS Create
                expect(data[2][4][4]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)
                .and.to.match(/^(\d{13})?$/)

                //MTS Update
                expect(data[2][4][5]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)
                .and.to.match(/^(\d{13})?$/)
                .and.to.equal(data[2][4][4])

                //Amount
                expect(data[2][4][6]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)
                .and.to.equal(sellAmount)

                //Amount Orig
                expect(data[2][4][7]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)
                .and.to.equal(sellAmount)

                //Order Type
                expect(data[2][4][8]).to.be.a('string')
                .and.to.equal('IOC')

                //Order Type Previous
                expect(data[2][4][9]).to.be.null

                //MTS TIF
                expect(data[2][4][10]).to.be.null

                //Placeholder
                expect(data[2][4][11]).to.be.null

                //Flags
                expect(data[2][4][12]).to.be.a('number')
                .and.to.equal(0)

                //Status
                expect(data[2][4][13]).to.be.a('string')
                .and.to.equal('ACTIVE')

                //Placeholder
                expect(data[2][4][14]).to.be.null

                //Placeholder
                expect(data[2][4][15]).to.be.null

                //Price
                expect(data[2][4][16]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)
                .and.to.equal(sellPrice)

                //Price Average
                expect(data[2][4][17]).to.be.a('number')
                .and.to.equal(0)

                //Price Trailing
                expect(data[2][4][18]).to.be.a('number')
                .and.to.equal(0)

                //Price Aux Limit
                expect(data[2][4][19]).to.be.a('number')
                .and.to.equal(0)

                //Placeholder
                expect(data[2][4][20]).to.be.null

                //Placeholder
                expect(data[2][4][21]).to.be.null

                //Placeholder
                expect(data[2][4][22]).to.be.null

                //Notify
                expect(data[2][4][23]).to.be.a('number')
                .and.to.equal(0)

                //Hidden
                expect(data[2][4][24]).to.be.null

                //Placeholder
                expect(data[2][4][25]).to.be.null

                //Placeholder
                expect(data[2][4][26]).to.be.null

                //Placeholder
                expect(data[2][4][27]).to.be.null

                //Routing
                expect(data[2][4][28]).to.be.a('string')
                .and.to.equal('API>BFX')

                //Placeholder
                expect(data[2][4][29]).to.be.null

                //Placeholder
                expect(data[2][4][30]).to.be.null

                //Meta
                expect(data[2][4][31]).to.be.a('object')
                .and.to.have.property('lev',10)
                expect(data[2][4][31]).and.to.have.property('$F33',10)

                } 

            // Target the oc message [0,"oc",[1187238160,null,1588158739438,"tBTCUSD",1588158739438,1588158739444,0,0.001,"MARKET",null,null,null,0,"EXECUTED @ 8150.0(0.001)",null,null,8150,8150,0,0,null,null,null,0,0,null,null,null,"BFX",null,null,null]]    
            if(data[1] == 'oc'){
                expect(data).to.not.be.null
                console.log(`oc message:`,JSON.stringify(data))

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //Order ID
                expect(data[2][0]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //GID
                expect(data[2][1]).to.be.null

                //CID
                expect(data[2][2]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Symbol
                expect(data[2][3]).to.be.a('string')
                .and.to.equal(symbol)

                //MTS Create
                expect(data[2][4]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)
                .and.to.match(/^(\d{13})?$/)

                //MTS Update
                expect(data[2][5]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)
                .and.to.match(/^(\d{13})?$/)
                .and.to.be.greaterThan(data[2][4])

                //Amount
                expect(data[2][6]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Amount Orig
                expect(data[2][7]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)
                .and.to.equal(sellAmount)

                //Order Type
                expect(data[2][8]).to.be.a('string')
                .and.to.equal('IOC')

                //Order Type Previous
                expect(data[2][9]).to.be.null

                //MTS TIF
                expect(data[2][10]).to.be.null

                //Placeholder
                expect(data[2][11]).to.be.null

                //Flags
                expect(data[2][12]).to.be.a('number')
                .and.to.equal(0)

                //Status
                expect(data[2][13]).to.be.a('string')
                expect(data[2][13]).to.contain('IOC CANCELED')

                //Placeholder
                expect(data[2][14]).to.be.null

                //Placeholder
                expect(data[2][15]).to.be.null

                //Price
                expect(data[2][16]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)
                .and.to.equal(sellPrice)

                //Price Average
                expect(data[2][17]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Price Trailing
                expect(data[2][18]).to.be.a('number')
                .and.to.equal(0)

                //Price Aux Limit
                expect(data[2][19]).to.be.a('number')
                .and.to.equal(0)

                //Placeholder
                expect(data[2][20]).to.be.null

                //Placeholder
                expect(data[2][21]).to.be.null

                //Placeholder
                expect(data[2][22]).to.be.null

                //Notify
                expect(data[2][23]).to.be.a('number')
                .and.to.equal(0)

                //Hidden
                expect(data[2][24]).to.be.a('number')
                .and.to.equal(0)

                //Placeholder
                expect(data[2][25]).to.be.null

                //Placeholder
                expect(data[2][26]).to.be.null

                //Placeholder
                expect(data[2][27]).to.be.null

                //Routing
                expect(data[2][28]).to.be.a('string')
                .and.to.equal('API>BFX')

                //Placeholder
                expect(data[2][29]).to.be.null

                //Placeholder
                expect(data[2][30]).to.be.null

                //Meta
                expect(data[2][31]).to.be.a('object')
                .and.to.have.property('lev',10)
                expect(data[2][31]).and.to.have.property('$F33',10)
                
                
                done()
                }    
            }
        });

        it('Open a Derivatives Position to be used for the next tests', function(done) {

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

            DerivativesOrderSocket.send(payload);

        DerivativesOrderSocket.onmessage = function (event) {
            let data = JSON.parse(event.data)
            
            if(data[1] == 'n'){
                expect(data).to.not.be.null
                console.log(`n message:`,JSON.stringify(data))

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //MTS Timestamp of Notification
                expect(data[2][0]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Type 
                expect(data[2][1]).to.be.a('string')
                .and.to.equal('on-req')

                //Message ID
                expect(data[2][2]).to.be.null

                //Placeholder
                expect(data[2][3]).to.be.null

                //Notify Info
                expect(data[2][4]).to.be.a('Array')

                //Code
                expect(data[2][5]).to.be.null

                //Status
                expect(data[2][6]).to.be.a('string')
                .and.to.equal('SUCCESS')

                //Text
                expect(data[2][7]).to.be.a('string')
                .and.to.equal('Submitting market buy order for '+buyAmount+' '+symbolFirst+'.')

                //Order ID
                expect(data[2][4][0]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //GID
                expect(data[2][4][1]).to.be.null

                //CID
                expect(data[2][4][2]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Symbol
                expect(data[2][4][3]).to.be.a('string')
                .and.to.equal(symbol)

                //MTS Create
                expect(data[2][4][4]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)
                .and.to.match(/^(\d{13})?$/)

                //MTS Update
                expect(data[2][4][5]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)
                .and.to.match(/^(\d{13})?$/)
                .and.to.equal(data[2][4][4])

                //Amount
                expect(data[2][4][6]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)
                .and.to.equal(buyAmount)

                //Amount Orig
                expect(data[2][4][7]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)
                .and.to.equal(buyAmount)

                //Order Type
                expect(data[2][4][8]).to.be.a('string')
                .and.to.equal('MARKET')

                //Order Type Previous
                expect(data[2][4][9]).to.be.null

                //MTS TIF
                expect(data[2][4][10]).to.be.null

                //Placeholder
                expect(data[2][4][11]).to.be.null

                //Flags
                expect(data[2][4][12]).to.be.a('number')
                .and.to.equal(0)

                //Status
                expect(data[2][4][13]).to.be.a('string')
                .and.to.equal('ACTIVE')

                //Placeholder
                expect(data[2][4][14]).to.be.null

                //Placeholder
                expect(data[2][4][15]).to.be.null

                //Price
                expect(data[2][4][16]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Price Average
                expect(data[2][4][17]).to.be.a('number')
                .and.to.equal(0)

                //Price Trailing
                expect(data[2][4][18]).to.be.a('number')
                .and.to.equal(0)

                //Price Aux Limit
                expect(data[2][4][19]).to.be.a('number')
                .and.to.equal(0)

                //Placeholder
                expect(data[2][4][20]).to.be.null

                //Placeholder
                expect(data[2][4][21]).to.be.null

                //Placeholder
                expect(data[2][4][22]).to.be.null

                //Notify
                expect(data[2][4][23]).to.be.a('number')
                .and.to.equal(0)

                //Hidden
                expect(data[2][4][24]).to.be.null

                //Placeholder
                expect(data[2][4][25]).to.be.null

                //Placeholder
                expect(data[2][4][26]).to.be.null

                //Placeholder
                expect(data[2][4][27]).to.be.null

                //Routing
                expect(data[2][4][28]).to.be.a('string')
                .and.to.equal('API>BFX')

                //Placeholder
                expect(data[2][4][29]).to.be.null

                //Placeholder
                expect(data[2][4][30]).to.be.null

                //Meta
                expect(data[2][4][31]).to.be.a('object')
                .and.to.have.property('lev',10)
                expect(data[2][4][31]).and.to.have.property('$F33',10)

                } 

            // Target the oc message 
            //[0,"oc",[1187238160,null,1588158739438,"tBTCUSD",1588158739438,1588158739444,0,0.001,"MARKET",null,null,null,0,"EXECUTED @ 8150.0(0.001)",null,null,8150,8150,0,0,null,null,null,0,0,null,null,null,"BFX",null,null,null]]    
            //[0,"oc",[1187248540,null,1588332669193,"tBTCF0:USTF0",1588332669194,1588332669201,0,0.0008,"MARKET",null,null,null,0,"EXECUTED @ 9000.0(0.0008)",null,null,9000,9000,0,0,null,null,null,0,0,null,null,null,"API>BFX",null,null,{"lev":10,"$F33":10}]]
            if(data[1] == 'oc'){
                expect(data).to.not.be.null
                console.log(`oc message:`,JSON.stringify(data))

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //Order ID
                expect(data[2][0]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //GID
                expect(data[2][1]).to.be.null

                //CID
                expect(data[2][2]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Symbol
                expect(data[2][3]).to.be.a('string')
                .and.to.equal(symbol)

                //MTS Create
                expect(data[2][4]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)
                .and.to.match(/^(\d{13})?$/)

                //MTS Update
                expect(data[2][5]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)
                .and.to.match(/^(\d{13})?$/)
                .and.to.be.greaterThan(data[2][4])

                //Amount
                expect(data[2][6]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Amount Orig
                expect(data[2][7]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)
                .and.to.equal(buyAmount)

                //Order Type
                expect(data[2][8]).to.be.a('string')
                .and.to.equal('MARKET')

                //Order Type Previous
                expect(data[2][9]).to.be.null

                //MTS TIF
                expect(data[2][10]).to.be.null

                //Placeholder
                expect(data[2][11]).to.be.null

                //Flags
                expect(data[2][12]).to.be.a('number')
                .and.to.equal(0)

                //Status
                expect(data[2][13]).to.be.a('string')
                expect(data[2][13]).to.contain('EXECUTED')

                //Placeholder
                expect(data[2][14]).to.be.null

                //Placeholder
                expect(data[2][15]).to.be.null

                //Price
                expect(data[2][16]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Price Average
                expect(data[2][17]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Price Trailing
                expect(data[2][18]).to.be.a('number')
                .and.to.equal(0)

                //Price Aux Limit
                expect(data[2][19]).to.be.a('number')
                .and.to.equal(0)

                //Placeholder
                expect(data[2][20]).to.be.null

                //Placeholder
                expect(data[2][21]).to.be.null

                //Placeholder
                expect(data[2][22]).to.be.null

                //Notify
                expect(data[2][23]).to.be.a('number')
                .and.to.equal(0)

                //Hidden
                expect(data[2][24]).to.be.a('number')
                .and.to.equal(0)

                //Placeholder
                expect(data[2][25]).to.be.null

                //Placeholder
                expect(data[2][26]).to.be.null

                //Placeholder
                expect(data[2][27]).to.be.null

                //Routing
                expect(data[2][28]).to.be.a('string')
                .and.to.equal('API>BFX')

                //Placeholder
                expect(data[2][29]).to.be.null

                //Placeholder
                expect(data[2][30]).to.be.null

                //Meta
                expect(data[2][31]).to.be.a('object')
                .and.to.have.property('lev',10)
                expect(data[2][31]).and.to.have.property('$F33',10)

                done()
                
                }
            }

        });


        it('Reduce Only order wrong direction should return a correct Notification message', function(done) {

        this.timeout(10000)

            let payload = JSON.stringify([
                0,
                "on",
                null,
                {
                "type": "LIMIT",
                "symbol": symbol,
                "amount": buyAmount.toString(),
                "price": buyPrice.toString(),
                "flags": 1024
                }
                ])

            DerivativesOrderSocket.send(payload);

        DerivativesOrderSocket.onmessage = function (event) {
            let data = JSON.parse(event.data)
            
            // Target the n message [0,"n",[1588340197655,"on-req",null,null,[null,null,null,"tBTCUSD",null,null,0.001,null,"LIMIT",null,null,null,1024,null,null,null,1,null,0,0,null,null,null,0,null,null,null,null,null,null,null,null],null,"ERROR","direction: invalid"]]        
            if(data[1] == 'n'){
                expect(data).to.not.be.null
                console.log(`n message:`,JSON.stringify(data))

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //MTS Timestamp of Notification
                expect(data[2][0]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Type 
                expect(data[2][1]).to.be.a('string')
                .and.to.equal('on-req')

                //Message ID
                expect(data[2][2]).to.be.null

                //Placeholder
                expect(data[2][3]).to.be.null

                //Notify Info
                expect(data[2][4]).to.be.a('Array')

                //Code
                expect(data[2][5]).to.be.null

                //Status
                expect(data[2][6]).to.be.a('string')
                .and.to.equal('ERROR')

                //Text
                expect(data[2][7]).to.be.a('string')
                .and.to.equal('direction: invalid')

                //Order ID
                expect(data[2][4][0]).to.be.null

                //GID
                expect(data[2][4][1]).to.be.null

                //CID
                expect(data[2][4][2]).to.be.null

                //Symbol
                expect(data[2][4][3]).to.be.a('string')
                .and.to.equal(symbol)

                //MTS Create
                expect(data[2][4][4]).to.be.null

                //MTS Update
                expect(data[2][4][5]).to.be.null

                //Amount
                expect(data[2][4][6]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)
                .and.to.equal(buyAmount)

                //Amount Orig
                expect(data[2][4][7]).to.be.null

                //Order Type
                expect(data[2][4][8]).to.be.a('string')
                .and.to.equal('LIMIT')

                //Order Type Previous
                expect(data[2][4][9]).to.be.null

                //MTS TIF
                expect(data[2][4][10]).to.be.null

                //Placeholder
                expect(data[2][4][11]).to.be.null

                //Flags
                expect(data[2][4][12]).to.be.a('number')
                .and.to.equal(1024)

                //Status
                expect(data[2][4][13]).to.be.null

                //Placeholder
                expect(data[2][4][14]).to.be.null

                //Placeholder
                expect(data[2][4][15]).to.be.null

                //Price
                expect(data[2][4][16]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)
                .and.to.equal(buyPrice)

                //Price Average
                expect(data[2][4][17]).to.be.null

                //Price Trailing
                expect(data[2][4][18]).to.be.a('number')
                .and.to.equal(0)

                //Price Aux Limit
                expect(data[2][4][19]).to.be.a('number')
                .and.to.equal(0)

                //Placeholder
                expect(data[2][4][20]).to.be.null

                //Placeholder
                expect(data[2][4][21]).to.be.null

                //Placeholder
                expect(data[2][4][22]).to.be.null

                //Notify
                expect(data[2][4][23]).to.be.a('number')
                .and.to.equal(0)

                //Hidden
                expect(data[2][4][24]).to.be.null

                //Placeholder
                expect(data[2][4][25]).to.be.null

                //Placeholder
                expect(data[2][4][26]).to.be.null

                //Placeholder
                expect(data[2][4][27]).to.be.null

                //Routing
                expect(data[2][4][28]).to.be.null

                //Placeholder
                expect(data[2][4][29]).to.be.null

                //Placeholder
                expect(data[2][4][30]).to.be.null

                //Placeholder
                expect(data[2][4][31]).to.be.null

                done()

                }   
            }
        });

it('Reduce Only order correct direction should return a correct Notification and Order Info message', function(done) {

        this.timeout(10000)

            let payload = JSON.stringify([
                0,
                "on",
                null,
                {
                "type": "LIMIT",
                "symbol": symbol,
                "amount": sellAmount.toString(),
                "price": sellPrice.toString(),
                "flags": 1024
                }
                ])

            DerivativesOrderSocket.send(payload);

        DerivativesOrderSocket.onmessage = function (event) {
            let data = JSON.parse(event.data)
            
            // Target the n message [0,"n",[1588148817.151,"on-req",null,null,[1187238099,null,1588148817151,"tBTCUSD",1588148817151,1588148817151,1,1,"EXCHANGE LIMIT",null,null,null,0,"ACTIVE",null,null,500,0,0,0,null,null,null,0,null,null,null,null,"BFX",null,null,null],null,"SUCCESS","Submitting exchange limit buy order for 1 BTC."]]]        

            if(data[1] == 'n'){
                expect(data).to.not.be.null
                console.log(`n message:`,JSON.stringify(data))

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //MTS Timestamp of Notification
                expect(data[2][0]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Type 
                expect(data[2][1]).to.be.a('string')
                .and.to.equal('on-req')

                //Message ID
                expect(data[2][2]).to.be.null

                //Placeholder
                expect(data[2][3]).to.be.null

                //Notify Info
                expect(data[2][4]).to.be.a('Array')

                //Code
                expect(data[2][5]).to.be.null

                //Status
                expect(data[2][6]).to.be.a('string')
                .and.to.equal('SUCCESS')

                //Text
                expect(data[2][7]).to.be.a('string')
                .and.to.equal('Submitting limit sell order for '+sellAmount+' '+symbolFirst+'.')

                //Order ID
                expect(data[2][4][0]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //GID
                expect(data[2][4][1]).to.be.null

                //CID
                expect(data[2][4][2]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Symbol
                expect(data[2][4][3]).to.be.a('string')
                .and.to.equal(symbol)

                //MTS Create
                expect(data[2][4][4]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)
                .and.to.match(/^(\d{13})?$/)

                //MTS Update
                expect(data[2][4][5]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)
                .and.to.match(/^(\d{13})?$/)
                .and.to.equal(data[2][4][4])

                //Amount
                expect(data[2][4][6]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)
                .and.to.equal(sellAmount)

                //Amount Orig
                expect(data[2][4][7]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)
                .and.to.equal(sellAmount)

                //Order Type
                expect(data[2][4][8]).to.be.a('string')
                .and.to.equal('LIMIT')

                //Order Type Previous
                expect(data[2][4][9]).to.be.null

                //MTS TIF
                expect(data[2][4][10]).to.be.null

                //Placeholder
                expect(data[2][4][11]).to.be.null

                //Flags
                expect(data[2][4][12]).to.be.a('number')
                .and.to.equal(1024)

                //Status
                expect(data[2][4][13]).to.be.a('string')
                .and.to.equal('ACTIVE')

                //Placeholder
                expect(data[2][4][14]).to.be.null

                //Placeholder
                expect(data[2][4][15]).to.be.null

                //Price
                expect(data[2][4][16]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)
                .and.to.equal(sellPrice)

                //Price Average
                expect(data[2][4][17]).to.be.a('number')
                .and.to.equal(0)

                //Price Trailing
                expect(data[2][4][18]).to.be.a('number')
                .and.to.equal(0)

                //Price Aux Limit
                expect(data[2][4][19]).to.be.a('number')
                .and.to.equal(0)

                //Placeholder
                expect(data[2][4][20]).to.be.null

                //Placeholder
                expect(data[2][4][21]).to.be.null

                //Placeholder
                expect(data[2][4][22]).to.be.null

                //Notify
                expect(data[2][4][23]).to.be.a('number')
                .and.to.equal(0)

                //Hidden
                expect(data[2][4][24]).to.be.null

                //Placeholder
                expect(data[2][4][25]).to.be.null

                //Placeholder
                expect(data[2][4][26]).to.be.null

                //Placeholder
                expect(data[2][4][27]).to.be.null

                //Routing
                expect(data[2][4][28]).to.be.a('string')
                .and.to.equal('API>BFX')

                //Placeholder
                expect(data[2][4][29]).to.be.null

                //Placeholder
                expect(data[2][4][30]).to.be.null

                //Meta
                expect(data[2][4][31]).to.be.a('object')
                .and.to.have.property('lev',10)
                expect(data[2][4][31]).and.to.have.property('$F33',10)

                } 

            // Target the on message [0,"on",[1187238101,null,1588148883485,"tBTCUSD",1588148883486,1588148883491,1,1,"EXCHANGE LIMIT",null,null,null,0,"ACTIVE",null,null,500,0,0,0,null,null,null,0,0,null,null,null,"BFX",null,null,null]
            if(data[1] == 'on'){
                expect(data).to.not.be.null
                console.log(`on message:`,JSON.stringify(data))

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //Order ID
                expect(data[2][0]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //GID
                expect(data[2][1]).to.be.null

                //CID
                expect(data[2][2]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Symbol
                expect(data[2][3]).to.be.a('string')
                .and.to.equal(symbol)

                //MTS Create
                expect(data[2][4]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)
                .and.to.match(/^(\d{13})?$/)

                //MTS Update
                expect(data[2][5]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)
                .and.to.match(/^(\d{13})?$/)
                .and.to.be.greaterThan(data[2][4])

                //Amount
                expect(data[2][6]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)
                .and.to.equal(sellAmount)

                //Amount Orig
                expect(data[2][7]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)
                .and.to.equal(sellAmount)

                //Order Type
                expect(data[2][8]).to.be.a('string')
                .and.to.equal('LIMIT')

                //Order Type Previous
                expect(data[2][9]).to.be.null

                //MTS TIF
                expect(data[2][10]).to.be.null

                //Placeholder
                expect(data[2][11]).to.be.null

                //Flags
                expect(data[2][12]).to.be.a('number')
                .and.to.equal(1024)

                //Status
                expect(data[2][13]).to.be.a('string')
                .and.to.equal('ACTIVE')

                //Placeholder
                expect(data[2][14]).to.be.null

                //Placeholder
                expect(data[2][15]).to.be.null

                //Price
                expect(data[2][16]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)
                .and.to.equal(sellPrice)

                //Price Average
                expect(data[2][17]).to.be.a('number')
                .and.to.equal(0)

                //Price Trailing
                expect(data[2][18]).to.be.a('number')
                .and.to.equal(0)

                //Price Aux Limit
                expect(data[2][19]).to.be.a('number')
                .and.to.equal(0)

                //Placeholder
                expect(data[2][20]).to.be.null

                //Placeholder
                expect(data[2][21]).to.be.null

                //Placeholder
                expect(data[2][22]).to.be.null

                //Notify
                expect(data[2][23]).to.be.a('number')
                .and.to.equal(0)

                //Hidden
                expect(data[2][24]).to.be.a('number')
                .and.to.equal(0)

                //Placeholder
                expect(data[2][25]).to.be.null

                //Placeholder
                expect(data[2][26]).to.be.null

                //Placeholder
                expect(data[2][27]).to.be.null

                //Routing
                expect(data[2][28]).to.be.a('string')
                .and.to.equal('API>BFX')

                //Placeholder
                expect(data[2][29]).to.be.null

                //Placeholder
                expect(data[2][30]).to.be.null

                //Meta
                expect(data[2][31]).to.be.a('object')
                .and.to.have.property('lev',10)
                expect(data[2][31]).and.to.have.property('$F33',10)
                
                done()
                }
            }
        });

        it('Close Position order should return a correct Notification and Order Info message', function(done) {

        this.timeout(10000)

            let payload = JSON.stringify([
                0,
                "on",
                null,
                {
                "type": "MARKET",
                "symbol": symbol,
                "amount": '-0.001',
                "flags": 512
                }
                ])

            DerivativesOrderSocket.send(payload);

        DerivativesOrderSocket.onmessage = function (event) {
            let data = JSON.parse(event.data)
            
            // Target the n message [0,"n",[1588343615.627,"on-req",null,null,[1187249326,null,1588343615625,"tBTCF0:USTF0",1588343615626,1588343615626,-0.001,-0.001,"MARKET",null,null,null,512,"ACTIVE (note:POSCLOSE)",null,null,8900,0,0,0,null,null,null,0,null,null,null,null,"API>BFX",null,null,{"lev":10,"$F33":10}],null,"SUCCESS","Submitting market sell order for -0.001 BTCF0."]]       

            if(data[1] == 'n'){
                expect(data).to.not.be.null
                console.log(`n message:`,JSON.stringify(data))

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //MTS Timestamp of Notification
                expect(data[2][0]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Type 
                expect(data[2][1]).to.be.a('string')
                .and.to.equal('on-req')

                //Message ID
                expect(data[2][2]).to.be.null

                //Placeholder
                expect(data[2][3]).to.be.null

                //Notify Info
                expect(data[2][4]).to.be.a('Array')

                //Code
                expect(data[2][5]).to.be.null

                //Status
                expect(data[2][6]).to.be.a('string')
                .and.to.equal('SUCCESS')

                //Text
                expect(data[2][7]).to.be.a('string')
                .and.to.equal('Submitting market sell order for -0.001 '+symbolFirst+'.')

                //Order ID
                expect(data[2][4][0]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //GID
                expect(data[2][4][1]).to.be.null

                //CID
                expect(data[2][4][2]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Symbol
                expect(data[2][4][3]).to.be.a('string')
                .and.to.equal(symbol)

                //MTS Create
                expect(data[2][4][4]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)
                .and.to.match(/^(\d{13})?$/)

                //MTS Update
                expect(data[2][4][5]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)
                .and.to.match(/^(\d{13})?$/)
                .and.to.equal(data[2][4][4])

                //Amount
                expect(data[2][4][6]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)
                .and.to.equal(-0.001)

                //Amount Orig
                expect(data[2][4][7]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)
                .and.to.equal(-0.001)

                //Order Type
                expect(data[2][4][8]).to.be.a('string')
                .and.to.equal('MARKET')

                //Order Type Previous
                expect(data[2][4][9]).to.be.null

                //MTS TIF
                expect(data[2][4][10]).to.be.null

                //Placeholder
                expect(data[2][4][11]).to.be.null

                //Flags
                expect(data[2][4][12]).to.be.a('number')
                .and.to.equal(512)

                //Status
                expect(data[2][4][13]).to.be.a('string')
                .and.to.equal('ACTIVE (note:POSCLOSE)')

                //Placeholder
                expect(data[2][4][14]).to.be.null

                //Placeholder
                expect(data[2][4][15]).to.be.null

                //Price
                expect(data[2][4][16]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Price Average
                expect(data[2][4][17]).to.be.a('number')
                .and.to.equal(0)

                //Price Trailing
                expect(data[2][4][18]).to.be.a('number')
                .and.to.equal(0)

                //Price Aux Limit
                expect(data[2][4][19]).to.be.a('number')
                .and.to.equal(0)

                //Placeholder
                expect(data[2][4][20]).to.be.null

                //Placeholder
                expect(data[2][4][21]).to.be.null

                //Placeholder
                expect(data[2][4][22]).to.be.null

                //Notify
                expect(data[2][4][23]).to.be.a('number')
                .and.to.equal(0)

                //Hidden
                expect(data[2][4][24]).to.be.null

                //Placeholder
                expect(data[2][4][25]).to.be.null

                //Placeholder
                expect(data[2][4][26]).to.be.null

                //Placeholder
                expect(data[2][4][27]).to.be.null

                //Routing
                expect(data[2][4][28]).to.be.a('string')
                .and.to.equal('API>BFX')

                //Placeholder
                expect(data[2][4][29]).to.be.null

                //Placeholder
                expect(data[2][4][30]).to.be.null

                //Meta
                expect(data[2][4][31]).to.be.a('object')
                .and.to.have.property('lev',10)
                expect(data[2][4][31]).and.to.have.property('$F33',10)

                } 

            // Target the pc message [0,"pc",["tBTCF0:USTF0","CLOSED",0,9000,0,0,null,null,null,null,null,36444682,null,null,null,1,null,0.72,null,{"reason":"TRADE","order_id":1187248673,"order_id_oppo":1187239942,"liq_stage":null,"trade_price":"8900.0","trade_amount":"-0.0008"}]]   
            if(data[1] == 'pc'){
                expect(data).to.not.be.null
                console.log(`pc message:`,JSON.stringify(data))

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //Symbol
                expect(data[2][0]).to.be.a('string')
                .and.to.equal(symbol)

                //Status
                expect(data[2][1]).to.be.a('string')
                .and.to.equal('CLOSED')

                //Amount
                expect(data[2][2]).to.be.a('number')
                .and.to.equal(0)

                //Base Price
                expect(data[2][3]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Derivatives Funding
                expect(data[2][4]).to.be.a('number')
                .and.to.equal(0)

                //Derivatives Funding Type
                expect(data[2][5]).to.be.a('number')
                .and.to.equal(0)

                //PL
                expect(data[2][6]).to.be.null

                //PL Perc
                expect(data[2][7]).to.be.null

                //Price Liq
                expect(data[2][8]).to.be.null

                //Leverage
                expect(data[2][9]).to.be.null

                //Placeholder
                expect(data[2][10]).to.be.null

                //Position ID
                expect(data[2][11]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Placeholder
                expect(data[2][12]).to.be.null

                //MTS Create
                expect(data[2][13]).to.be.null

                //MTS Update
                expect(data[2][14]).to.be.null

                //Type
                expect(data[2][15]).to.be.a('number')
                .and.to.equal(1)

                //Placeholder
                expect(data[2][16]).to.be.null

                //Collateral
                expect(data[2][17]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Collateral Min
                expect(data[2][18]).to.be.null

                //Position Meta
                expect(data[2][19]).to.be.a('object')
                
                } 

            // Target the oc message [0,"oc",[1187238160,null,1588158739438,"tBTCUSD",1588158739438,1588158739444,0,0.001,"MARKET",null,null,null,0,"EXECUTED @ 8150.0(0.001)",null,null,8150,8150,0,0,null,null,null,0,0,null,null,null,"BFX",null,null,null]]    
            if(data[1] == 'oc'){
                expect(data).to.not.be.null
                console.log(`oc message:`,JSON.stringify(data))

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //Order ID
                expect(data[2][0]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //GID
                expect(data[2][1]).to.be.null

                //CID
                expect(data[2][2]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Symbol
                expect(data[2][3]).to.be.a('string')
                .and.to.equal(symbol)

                //MTS Create
                expect(data[2][4]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)
                .and.to.match(/^(\d{13})?$/)

                //MTS Update
                expect(data[2][5]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)
                .and.to.match(/^(\d{13})?$/)
                .and.to.be.greaterThan(data[2][4])

                //Amount
                expect(data[2][6]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Amount Orig
                expect(data[2][7]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)
                .and.to.equal(sellAmount)

                //Order Type
                expect(data[2][8]).to.be.a('string')
                .and.to.equal('MARKET')

                //Order Type Previous
                expect(data[2][9]).to.be.null

                //MTS TIF
                expect(data[2][10]).to.be.null

                //Placeholder
                expect(data[2][11]).to.be.null

                //Flags
                expect(data[2][12]).to.be.a('number')
                .and.to.equal(512)

                //Status
                expect(data[2][13]).to.be.a('string')
                expect(data[2][13]).to.contain('EXECUTED')

                //Placeholder
                expect(data[2][14]).to.be.null

                //Placeholder
                expect(data[2][15]).to.be.null

                //Price
                expect(data[2][16]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Price Average
                expect(data[2][17]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Price Trailing
                expect(data[2][18]).to.be.a('number')
                .and.to.equal(0)

                //Price Aux Limit
                expect(data[2][19]).to.be.a('number')
                .and.to.equal(0)

                //Placeholder
                expect(data[2][20]).to.be.null

                //Placeholder
                expect(data[2][21]).to.be.null

                //Placeholder
                expect(data[2][22]).to.be.null

                //Notify
                expect(data[2][23]).to.be.a('number')
                .and.to.equal(0)

                //Hidden
                expect(data[2][24]).to.be.a('number')
                .and.to.equal(0)

                //Placeholder
                expect(data[2][25]).to.be.null

                //Placeholder
                expect(data[2][26]).to.be.null

                //Placeholder
                expect(data[2][27]).to.be.null

                //Routing
                expect(data[2][28]).to.be.a('string')
                .and.to.equal('API>BFX')

                //Placeholder
                expect(data[2][29]).to.be.null

                //Placeholder
                expect(data[2][30]).to.be.null

                //Meta
                expect(data[2][31]).to.be.a('object')
                .and.to.have.property('lev',10)
                expect(data[2][31]).and.to.have.property('$F33',10)

                done()
                
                }
            }
        });

        it('Cancel all orders should return a correct Notification and Order Info message', function(done) {

        this.timeout(10000)

            let payload = JSON.stringify([
                0,
                "oc_multi",
                null,
                {
                "all": 1
                }
                ])

            DerivativesOrderSocket.send(payload);

        DerivativesOrderSocket.onmessage = function (event) {
            let data = JSON.parse(event.data)
            
            // Target the n message [0,"n",[1588341920226,"oc_multi-req",null,null,[[1187248974,null,1588341908276,"tBTCUSD",1588341908277,1588341908284,1,1,"EXCHANGE LIMIT",null,null,null,0,"ACTIVE",null,null,1,0,0,0,null,null,null,0,0,null,null,null,"BFX",null,null,null],[1187248975,null,1588341909262,"tBTCUSD",1588341909262,1588341909266,1,1,"EXCHANGE LIMIT",null,null,null,0,"ACTIVE",null,null,1,0,0,0,null,null,null,0,0,null,null,null,"BFX",null,null,null]],null,"SUCCESS","Submitting 2 order cancellations."]]          

            if(data[1] == 'n'){
                expect(data).to.not.be.null
                DerivativesOrderSocket.close()
                console.log(`n message:`,JSON.stringify(data))

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //MTS Timestamp of Notification
                expect(data[2][0]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Type 
                expect(data[2][1]).to.be.a('string')
                .and.to.equal('oc_multi-req')

                //Message ID
                expect(data[2][2]).to.be.null

                //Placeholder
                expect(data[2][3]).to.be.null

                //Notify Info
                expect(data[2][4]).to.be.a('Array')

                //Code
                expect(data[2][5]).to.be.null

                //Status
                expect(data[2][6]).to.be.a('string')
                .and.to.equal('SUCCESS')

                //Text
                expect(data[2][7]).to.be.a('string')
                .and.to.contain('Submitting')
                expect(data[2][7]).to.contain('order cancellations')

                //Order ID
                expect(data[2][4][0][0]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //CID
                expect(data[2][4][0][2]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Symbol
                expect(data[2][4][0][3]).to.be.a('string')
                .and.to.equal(symbol)

                //MTS Create
                expect(data[2][4][0][4]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)
                .and.to.match(/^(\d{13})?$/)

                //MTS Update
                expect(data[2][4][0][5]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)
                .and.to.match(/^(\d{13})?$/)

                //Amount
                expect(data[2][4][0][6]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Amount Orig
                expect(data[2][4][0][7]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Order Type
                expect(data[2][4][0][8]).to.be.a('string')

                //Flags
                expect(data[2][4][0][12]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Status
                expect(data[2][4][0][13]).to.be.a('string')

                //Price
                expect(data[2][4][0][16]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Price Average
                expect(data[2][4][0][17]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Price Trailing
                expect(data[2][4][0][18]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Price Aux Limit
                expect(data[2][4][0][19]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Notify
                expect(data[2][4][0][23]).to.be.a('number')
                .and.to.equal(0)

                //Routing
                expect(data[2][4][0][28]).to.be.a('string')
                .and.to.equal('API>BFX')

                done()

                }    
            }
        });

    })
