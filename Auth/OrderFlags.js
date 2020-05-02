const WebSocket = require('ws');
const fs = require('fs');
const expect = require('chai').expect;
const ws_url = require('../config.json').ws_url
const crypto = require('crypto-js') // Standard JavaScript cryptography library
const apiKey = require('../config.json').api_key
const apiSecret = require('../config.json').api_secret

//Auth
const OrderFlagsSocket = new WebSocket(ws_url);
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
const symbolSecond = symbol.substr(4,6)
const buyAmount = 0.001 //min $5 USD equivalent
const sellAmount = -0.001 //min $5 USD equivalent
const buyPrice = 1
const sellPrice = 20000

//Date
var date = new Date();
var dd = date.getDate()+1;
var mm = date.getMonth()+1; 
var yyyy = date.getFullYear();
if(dd<10) 
{
    dd='0'+dd;
} 
if(mm<10) 
{
    mm='0'+mm;
} 
const tifDate = yyyy+'-'+mm+'-'+dd+' 10:45:23';

//Sleep timer
function sleep(milliseconds) {
  const date = Date.now();
  let currentDate = null;
  do {
    currentDate = Date.now();
  } while (currentDate - date < milliseconds);
}

describe('Order Flags Tests (Tests "on" inputs and authenticated channels: "n", "on", "oc")', function() {
        it('Hidden Buy Order should return a correct Notification and Order Info message', function(done) {

        this.timeout(10000)

        OrderFlagsSocket.onopen = function (event) {
            let payload = JSON.stringify([
                0,
                "on",
                null,
                {
                "type": "EXCHANGE LIMIT",
                "symbol": symbol,
                "amount": buyAmount.toString(),
                "price": buyPrice.toString(),
                "flags": 64
                }
                ])
            OrderFlagsSocket.send(JSON.stringify(payloadAuth))
            sleep(1000);
            OrderFlagsSocket.send(payload);
          };

        OrderFlagsSocket.onmessage = function (event) {
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
                .and.to.equal('Submitting exchange limit buy order for '+buyAmount+' '+symbolFirst+'.')

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
                .and.to.equal('EXCHANGE LIMIT')

                //Order Type Previous
                expect(data[2][4][9]).to.be.null

                //MTS TIF
                expect(data[2][4][10]).to.be.null

                //Placeholder
                expect(data[2][4][11]).to.be.null

                //Flags
                expect(data[2][4][12]).to.be.a('number')
                .and.to.equal(64)

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
                expect(data[2][4][24]).to.be.a('number')
                .and.to.equal(1)

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

                //Placeholder
                expect(data[2][4][31]).to.be.null

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
                .and.to.equal('EXCHANGE LIMIT')

                //Order Type Previous
                expect(data[2][9]).to.be.null

                //MTS TIF
                expect(data[2][10]).to.be.null

                //Placeholder
                expect(data[2][11]).to.be.null

                //Flags
                expect(data[2][12]).to.be.a('number')
                .and.to.equal(64)

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
                .and.to.equal(1)

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

                //Placeholder
                expect(data[2][31]).to.be.null
                
                done()
                }    
            }
        });

        it('Post Only Order (Not Matched) should return a correct Notification and Order Info message', function(done) {

        this.timeout(10000)

            let payload = JSON.stringify([
                0,
                "on",
                null,
                {
                "type": "EXCHANGE LIMIT",
                "symbol": symbol,
                "amount": buyAmount.toString(),
                "price": buyPrice.toString(),
                "flags": 4096
                }
                ])

            OrderFlagsSocket.send(payload);

            OrderFlagsSocket.onmessage = function (event) {
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
                .and.to.equal('Submitting exchange limit buy order for '+buyAmount+' '+symbolFirst+'.')

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
                .and.to.equal('EXCHANGE LIMIT')

                //Order Type Previous
                expect(data[2][4][9]).to.be.null

                //MTS TIF
                expect(data[2][4][10]).to.be.null

                //Placeholder
                expect(data[2][4][11]).to.be.null

                //Flags
                expect(data[2][4][12]).to.be.a('number')
                .and.to.equal(4096)

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
                .and.to.have.property('$F7',1)

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
                .and.to.equal('EXCHANGE LIMIT')

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

                //Placeholder
                expect(data[2][31]).to.be.a('object')
                .and.to.have.property('$F7',1)
                
                done()
                }    
            }
        });

        it('Post Only Order (Matched) should return a correct Notification and Order Cancel message', function(done) {

        this.timeout(10000)

            let payload = JSON.stringify([
                0,
                "on",
                null,
                {
                "type": "EXCHANGE LIMIT",
                "symbol": symbol,
                "amount": buyAmount.toString(),
                "price": sellPrice.toString(),
                "flags": 4096
                }
                ])

            OrderFlagsSocket.send(payload);

            OrderFlagsSocket.onmessage = function (event) {
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
                .and.to.equal('Submitting exchange limit buy order for '+buyAmount+' '+symbolFirst+'.')

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
                .and.to.equal('EXCHANGE LIMIT')

                //Order Type Previous
                expect(data[2][4][9]).to.be.null

                //MTS TIF
                expect(data[2][4][10]).to.be.null

                //Placeholder
                expect(data[2][4][11]).to.be.null

                //Flags
                expect(data[2][4][12]).to.be.a('number')
                .and.to.equal(4096)

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
                .and.to.have.property('$F7',1)

                } 

            // Target the oc message [0,"oc",[1187238160,null,1588158739438,"tBTCUSD",1588158739438,1588158739444,0,0.001,"EXCHANGE MARKET",null,null,null,0,"EXECUTED @ 8150.0(0.001)",null,null,8150,8150,0,0,null,null,null,0,0,null,null,null,"BFX",null,null,null]]
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
                .and.to.equal(buyAmount)

                //Amount Orig
                expect(data[2][7]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)
                .and.to.equal(buyAmount)

                //Order Type
                expect(data[2][8]).to.be.a('string')
                .and.to.equal('EXCHANGE LIMIT')

                //Order Type Previous
                expect(data[2][9]).to.be.null

                //MTS TIF
                expect(data[2][10]).to.be.null

                //Placeholder
                expect(data[2][11]).to.be.null

                //Flags
                expect(data[2][12]).to.be.a('number')
                .and.to.equal(4096)

                //Status
                expect(data[2][13]).to.be.a('string')
                .and.to.equal('POSTONLY CANCELED')

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

                //Placeholder
                expect(data[2][31]).to.be.a('object')
                .and.to.have.property('$F7',1)
                
                done()
                }    
            }
        });

        it('OCO Order should return a correct Notification and Order Info message', function(done) {

        this.timeout(10000)

            let payload = JSON.stringify([
                0,
                "on",
                null,
                {
                "type": "EXCHANGE LIMIT",
                "symbol": symbol,
                "amount": buyAmount.toString(),
                "price": buyPrice.toString(),
                "flags": 16384,
                "price_oco_stop": sellPrice.toString()
                }
                ])

            OrderFlagsSocket.send(payload);

            OrderFlagsSocket.onmessage = function (event) {
            let data = JSON.parse(event.data)
            
            // Target the n message [0,"n",[1588148817.151,"on-req",null,null,[1187238099,null,1588148817151,"tBTCUSD",1588148817151,1588148817151,1,1,"EXCHANGE LIMIT",null,null,null,0,"ACTIVE",null,null,500,0,0,0,null,null,null,0,null,null,null,null,"BFX",null,null,null],null,"SUCCESS","Submitting exchange limit buy order for 1 BTC."]]]        

            if(data[1] == 'n' && data[2][4][8] == 'EXCHANGE LIMIT'){
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
                .and.to.equal('Submitting exchange limit buy order for '+buyAmount+' '+symbolFirst+'.')

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
                .and.to.equal('EXCHANGE LIMIT')

                //Order Type Previous
                expect(data[2][4][9]).to.be.null

                //MTS TIF
                expect(data[2][4][10]).to.be.null

                //Placeholder
                expect(data[2][4][11]).to.be.null

                //Flags
                expect(data[2][4][12]).to.be.a('number')
                .and.to.equal(16384)

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
                expect(data[2][4][31]).to.be.null

                } 

            // Target the on message [0,"on",[1187238101,null,1588148883485,"tBTCUSD",1588148883486,1588148883491,1,1,"EXCHANGE LIMIT",null,null,null,0,"ACTIVE",null,null,500,0,0,0,null,null,null,0,0,null,null,null,"BFX",null,null,null]
            if(data[1] == 'on' && data[2][8] == 'EXCHANGE STOP'){
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
                .and.to.equal('EXCHANGE STOP')

                //Order Type Previous
                expect(data[2][9]).to.be.null

                //MTS TIF
                expect(data[2][10]).to.be.null

                //Placeholder
                expect(data[2][11]).to.be.null

                //Flags
                expect(data[2][12]).to.be.a('number')
                .and.to.equal(16384)

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

                //OCO Order
                expect(data[2][25]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)

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

                //Placeholder
                expect(data[2][31]).to.be.null
                
                } 

            // Target the on message [0,"on",[1187238101,null,1588148883485,"tBTCUSD",1588148883486,1588148883491,1,1,"EXCHANGE LIMIT",null,null,null,0,"ACTIVE",null,null,500,0,0,0,null,null,null,0,0,null,null,null,"BFX",null,null,null]
            if(data[1] == 'on' && data[2][8] == 'EXCHANGE LIMIT'){
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
                .and.to.equal('EXCHANGE LIMIT')

                //Order Type Previous
                expect(data[2][9]).to.be.null

                //MTS TIF
                expect(data[2][10]).to.be.null

                //Placeholder
                expect(data[2][11]).to.be.null

                //Flags
                expect(data[2][12]).to.be.a('number')
                .and.to.equal(16384)

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

                //OCO Order
                expect(data[2][25]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)

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

                //Placeholder
                expect(data[2][31]).to.be.null

                done()
                
                }  
 
            }
        });

        it('Hidden Post Only should return a correct Notification and Order Info message', function(done) {

        this.timeout(10000)

            let payload = JSON.stringify([
                0,
                "on",
                null,
                {
                "type": "EXCHANGE LIMIT",
                "symbol": symbol,
                "amount": buyAmount.toString(),
                "price": buyPrice.toString(),
                "flags": 4160
                }
                ])

            OrderFlagsSocket.send(payload);

            OrderFlagsSocket.onmessage = function (event) {
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
                .and.to.equal('Submitting exchange limit buy order for '+buyAmount+' '+symbolFirst+'.')

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
                .and.to.equal('EXCHANGE LIMIT')

                //Order Type Previous
                expect(data[2][4][9]).to.be.null

                //MTS TIF
                expect(data[2][4][10]).to.be.null

                //Placeholder
                expect(data[2][4][11]).to.be.null

                //Flags
                expect(data[2][4][12]).to.be.a('number')
                .and.to.equal(4160)

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
                expect(data[2][4][24]).to.be.a('number')
                .and.to.equal(1)

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
                .and.to.have.property('$F7',1)

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
                .and.to.equal('EXCHANGE LIMIT')

                //Order Type Previous
                expect(data[2][9]).to.be.null

                //MTS TIF
                expect(data[2][10]).to.be.null

                //Placeholder
                expect(data[2][11]).to.be.null

                //Flags
                expect(data[2][12]).to.be.a('number')
                .and.to.equal(64)

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
                .and.to.equal(1)

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
                .and.to.have.property('$F7',1)
                
                done()

                }    
            }
        });

        it('TIF Order should return a correct Notification and Order Info message', function(done) {

        this.timeout(10000)

            let payload = JSON.stringify([
                0,
                "on",
                null,
                {
                "type": "EXCHANGE LIMIT",
                "symbol": symbol,
                "amount": buyAmount.toString(),
                "price": buyPrice.toString(),
                "tif": tifDate
                }
                ])

            OrderFlagsSocket.send(payload);

            OrderFlagsSocket.onmessage = function (event) {
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
                .and.to.equal('Submitting exchange limit buy order for '+buyAmount+' '+symbolFirst+'.')

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
                .and.to.equal('EXCHANGE LIMIT')

                //Order Type Previous
                expect(data[2][4][9]).to.be.null

                //MTS TIF
                expect(data[2][4][10]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)

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
                expect(data[2][4][31]).to.be.null

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
                .and.to.equal('EXCHANGE LIMIT')

                //Order Type Previous
                expect(data[2][9]).to.be.null

                //MTS TIF
                expect(data[2][10]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)

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

                //Placeholder
                expect(data[2][31]).to.be.null
                
                done()
                }    
            }
        });

        it('Aff Code Order should return a correct Notification and Order Info message', function(done) {

        this.timeout(10000)

            let payload = JSON.stringify([
                0,
                "on",
                null,
                {
                "type": "EXCHANGE LIMIT",
                "symbol": symbol,
                "amount": buyAmount.toString(),
                "price": buyPrice.toString(),
                "meta": {aff_code:"tEsT_4ffc0d3"}
                }
                ])

            OrderFlagsSocket.send(payload);

            OrderFlagsSocket.onmessage = function (event) {
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
                .and.to.equal('Submitting exchange limit buy order for '+buyAmount+' '+symbolFirst+'.')

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
                .and.to.equal('EXCHANGE LIMIT')

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
                .and.to.have.property('aff_code','tEsT_4ffc0d3')

                } 

            // Target the on message [0,"on",[1187238101,null,1588148883485,"tBTCUSD",1588148883486,1588148883491,1,1,"EXCHANGE LIMIT",null,null,null,0,"ACTIVE",null,null,500,0,0,0,null,null,null,0,0,null,null,null,"BFX",null,null,null]
            if(data[1] == 'on'){
                expect(data).to.not.be.null
                OrderFlagsSocket.close();
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
                .and.to.equal('EXCHANGE LIMIT')

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
                .and.to.have.property('aff_code','tEsT_4ffc0d3')
                
                done()
                }    
            }
        });

    })
