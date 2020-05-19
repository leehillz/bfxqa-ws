const WebSocket = require('ws');
const fs = require('fs');
const expect = require('chai').expect;
const ws_url = require('../config.json').ws_url
const crypto = require('crypto-js') // Standard JavaScript cryptography library
const apiKey = require('../config.json').api_key
const apiSecret = require('../config.json').api_secret
const SchemaAssertions = require("../Assertions/schema.js")

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
var dd = date.getDate();
var dd1 = date.getDate()+1;
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
const tifDate = yyyy+'-'+mm+'-'+dd1+' 10:45:23';
const cidDate = yyyy+'-'+mm+'-'+dd;

//Sleep timer
function sleep(milliseconds) {
  const date = Date.now();
  let currentDate = null;
  do {
    currentDate = Date.now();
  } while (currentDate - date < milliseconds);
}

describe('Order Flags Tests (Tests "on", "ou", "oc", "oc_multi" inputs and authenticated channels: "n", "on", "ou", "oc")', function() {
        it('Hidden Buy Order should return a correct Notification and Order Info message', function(done) {

        this.timeout(10000)

        OrderFlagsSocket.onopen = function (event) {
            let payload = JSON.stringify([
                0,
                "on",
                null,
                {
                "cid": 12345,
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

                //Assert data against Schema
                SchemaAssertions.assertOrdersSchema(data[2][4])

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //MTS Timestamp of Notification
                expect(data[2][0]).to.be.a('number')

                //Type 
                expect(data[2][1]).to.equal('on-req')

                //Status
                expect(data[2][6]).to.equal('SUCCESS')

                //Text
                expect(data[2][7]).to.equal('Submitting exchange limit buy order for '+buyAmount+' '+symbolFirst+'.')

                //Symbol
                expect(data[2][4][3]).to.equal(symbol)

                //Amount
                expect(data[2][4][6]).to.equal(buyAmount)

                //Amount Orig
                expect(data[2][4][7]).to.equal(buyAmount)

                //Order Type
                expect(data[2][4][8]).to.equal('EXCHANGE LIMIT')

                //Flags
                expect(data[2][4][12]).to.equal(64)

                //Status
                expect(data[2][4][13]).to.equal('ACTIVE')

                //Price
                expect(data[2][4][16]).to.equal(buyPrice)

                //Hidden
                expect(data[2][4][24]).to.equal(1)

                } 

            // Target the on message [0,"on",[1187238101,null,1588148883485,"tBTCUSD",1588148883486,1588148883491,1,1,"EXCHANGE LIMIT",null,null,null,0,"ACTIVE",null,null,500,0,0,0,null,null,null,0,0,null,null,null,"BFX",null,null,null]
            if(data[1] == 'on'){
                expect(data).to.not.be.null
                console.log(`on message:`,JSON.stringify(data))

                //Assert data against Schema
                SchemaAssertions.assertOrdersSchema(data[2])

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //Symbol
                expect(data[2][3]).to.equal(symbol)

                //Amount
                expect(data[2][6]).to.equal(buyAmount)

                //Amount Orig
                expect(data[2][7]).to.equal(buyAmount)

                //Order Type
                expect(data[2][8]).to.equal('EXCHANGE LIMIT')

                //Flags
                expect(data[2][12]).to.equal(64)

                //Status
                expect(data[2][13]).to.equal('ACTIVE')

                //Price
                expect(data[2][16]).to.equal(buyPrice)

                //Hidden
                expect(data[2][24]).to.equal(1)
                
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
                "cid": 54321,
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

                //Assert data against Schema
                SchemaAssertions.assertOrdersSchema(data[2][4])

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //MTS Timestamp of Notification
                expect(data[2][0]).to.be.a('number')

                //Type 
                expect(data[2][1]).to.equal('on-req')

                //Status
                expect(data[2][6]).to.equal('SUCCESS')

                //Text
                expect(data[2][7]).to.equal('Submitting exchange limit buy order for '+buyAmount+' '+symbolFirst+'.')

                //Symbol
                expect(data[2][4][3]).to.equal(symbol)

                //Amount
                expect(data[2][4][6]).to.equal(buyAmount)

                //Amount Orig
                expect(data[2][4][7]).to.equal(buyAmount)

                //Order Type
                expect(data[2][4][8]).to.equal('EXCHANGE LIMIT')

                //Flags
                expect(data[2][4][12]).to.equal(4096)

                //Status
                expect(data[2][4][13]).to.equal('ACTIVE')

                //Price
                expect(data[2][4][16]).to.equal(buyPrice)

                //Meta
                expect(data[2][4][31]).to.have.property('$F7',1)

                } 

            // Target the on message [0,"on",[1187238101,null,1588148883485,"tBTCUSD",1588148883486,1588148883491,1,1,"EXCHANGE LIMIT",null,null,null,0,"ACTIVE",null,null,500,0,0,0,null,null,null,0,0,null,null,null,"BFX",null,null,null]
            if(data[1] == 'on'){
                expect(data).to.not.be.null
                console.log(`on message:`,JSON.stringify(data))

                //Assert data against Schema
                SchemaAssertions.assertOrdersSchema(data[2])

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //Symbol
                expect(data[2][3]).to.equal(symbol)

                //Amount
                expect(data[2][6]).to.equal(buyAmount)

                //Amount Orig
                expect(data[2][7]).to.equal(buyAmount)

                //Order Type
                expect(data[2][8]).to.equal('EXCHANGE LIMIT')

                //Flags
                expect(data[2][12]).to.equal(0)

                //Status
                expect(data[2][13]).to.equal('ACTIVE')

                //Price
                expect(data[2][16]).to.equal(buyPrice)

                //Hidden
                expect(data[2][24]).to.equal(0)

                //Placeholder
                expect(data[2][31]).to.have.property('$F7',1)
                
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

                //Assert data against Schema
                SchemaAssertions.assertOrdersSchema(data[2][4])

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //MTS Timestamp of Notification
                expect(data[2][0]).to.be.a('number')

                //Type 
                expect(data[2][1]).to.equal('on-req')

                //Status
                expect(data[2][6]).to.equal('SUCCESS')

                //Text
                expect(data[2][7]).to.equal('Submitting exchange limit buy order for '+buyAmount+' '+symbolFirst+'.')

                //Symbol
                expect(data[2][4][3]).to.equal(symbol)

                //Amount
                expect(data[2][4][6]).to.equal(buyAmount)

                //Amount Orig
                expect(data[2][4][7]).to.equal(buyAmount)

                //Order Type
                expect(data[2][4][8]).to.equal('EXCHANGE LIMIT')

                //Flags
                expect(data[2][4][12]).to.equal(4096)

                //Status
                expect(data[2][4][13]).to.equal('ACTIVE')

                //Price
                expect(data[2][4][16]).to.equal(sellPrice)

                //Meta
                expect(data[2][4][31]).to.have.property('$F7',1)

                } 

            // Target the oc message [0,"oc",[1187238160,null,1588158739438,"tBTCUSD",1588158739438,1588158739444,0,0.001,"EXCHANGE MARKET",null,null,null,0,"EXECUTED @ 8150.0(0.001)",null,null,8150,8150,0,0,null,null,null,0,0,null,null,null,"BFX",null,null,null]]
            if(data[1] == 'oc'){
                expect(data).to.not.be.null
                console.log(`oc message:`,JSON.stringify(data))

                //Assert data against Schema
                SchemaAssertions.assertOrdersSchema(data[2])

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //Symbol
                expect(data[2][3]).to.equal(symbol)

                //Amount
                expect(data[2][6]).to.equal(buyAmount)

                //Amount Orig
                expect(data[2][7]).to.equal(buyAmount)

                //Order Type
                expect(data[2][8]).to.equal('EXCHANGE LIMIT')

                //Flags
                expect(data[2][12]).to.equal(4096)

                //Status
                expect(data[2][13]).to.equal('POSTONLY CANCELED')

                //Price
                expect(data[2][16]).to.equal(sellPrice)

                //Hidden
                expect(data[2][24]).to.equal(0)

                //Placeholder
                expect(data[2][31]).to.have.property('$F7',1)
                
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

                //Assert data against Schema
                SchemaAssertions.assertOrdersSchema(data[2][4])

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //MTS Timestamp of Notification
                expect(data[2][0]).to.be.a('number')

                //Type 
                expect(data[2][1]).to.equal('on-req')

                //Status
                expect(data[2][6]).to.equal('SUCCESS')

                //Text
                expect(data[2][7]).to.equal('Submitting exchange limit buy order for '+buyAmount+' '+symbolFirst+'.')

                //Symbol
                expect(data[2][4][3]).to.equal(symbol)

                //Amount
                expect(data[2][4][6]).to.equal(buyAmount)

                //Amount Orig
                expect(data[2][4][7]).to.equal(buyAmount)

                //Order Type
                expect(data[2][4][8]).to.equal('EXCHANGE LIMIT')

                //Flags
                expect(data[2][4][12]).to.equal(16384)

                //Status
                expect(data[2][4][13]).to.equal('ACTIVE')

                //Price
                expect(data[2][4][16]).to.equal(buyPrice)

                } 

            // Target the on message [0,"on",[1187238101,null,1588148883485,"tBTCUSD",1588148883486,1588148883491,1,1,"EXCHANGE LIMIT",null,null,null,0,"ACTIVE",null,null,500,0,0,0,null,null,null,0,0,null,null,null,"BFX",null,null,null]
            if(data[1] == 'on' && data[2][8] == 'EXCHANGE STOP'){
                expect(data).to.not.be.null
                console.log(`on message:`,JSON.stringify(data))

                //Assert data against Schema
                SchemaAssertions.assertOrdersSchema(data[2])

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //Symbol
                expect(data[2][3]).to.equal(symbol)

                //Amount
                expect(data[2][6]).to.equal(buyAmount)

                //Amount Orig
                expect(data[2][7]).to.equal(buyAmount)

                //Order Type
                expect(data[2][8]).to.equal('EXCHANGE STOP')

                //Flags
                expect(data[2][12]).to.equal(16384)

                //Status
                expect(data[2][13]).to.equal('ACTIVE')

                //Price
                expect(data[2][16]).to.equal(sellPrice)

                //Hidden
                expect(data[2][24]).to.equal(0)

                //OCO Order
                expect(data[2][25]).to.be.a('number')
                
                } 

            // Target the on message [0,"on",[1187238101,null,1588148883485,"tBTCUSD",1588148883486,1588148883491,1,1,"EXCHANGE LIMIT",null,null,null,0,"ACTIVE",null,null,500,0,0,0,null,null,null,0,0,null,null,null,"BFX",null,null,null]
            if(data[1] == 'on' && data[2][8] == 'EXCHANGE LIMIT'){
                expect(data).to.not.be.null
                console.log(`on message:`,JSON.stringify(data))

                //Assert data against Schema
                SchemaAssertions.assertOrdersSchema(data[2])

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //Symbol
                expect(data[2][3]).to.equal(symbol)

                //Amount
                expect(data[2][6]).to.equal(buyAmount)

                //Amount Orig
                expect(data[2][7]).to.equal(buyAmount)

                //Order Type
                expect(data[2][8]).to.equal('EXCHANGE LIMIT')

                //Flags
                expect(data[2][12]).to.equal(16384)

                //Status
                expect(data[2][13]).to.equal('ACTIVE')

                //Price
                expect(data[2][16]).to.equal(buyPrice)

                //Hidden
                expect(data[2][24]).to.equal(0)

                //OCO Order
                expect(data[2][25]).to.be.a('number')

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

                //Assert data against Schema
                SchemaAssertions.assertOrdersSchema(data[2][4])

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //MTS Timestamp of Notification
                expect(data[2][0]).to.be.a('number')

                //Type 
                expect(data[2][1]).to.equal('on-req')

                //Status
                expect(data[2][6]).to.equal('SUCCESS')

                //Text
                expect(data[2][7]).to.equal('Submitting exchange limit buy order for '+buyAmount+' '+symbolFirst+'.')

                //Symbol
                expect(data[2][4][3]).to.equal(symbol)

                //Amount
                expect(data[2][4][6]).to.equal(buyAmount)

                //Amount Orig
                expect(data[2][4][7]).to.equal(buyAmount)

                //Order Type
                expect(data[2][4][8]).to.equal('EXCHANGE LIMIT')

                //Flags
                expect(data[2][4][12]).to.equal(4160)

                //Status
                expect(data[2][4][13]).to.equal('ACTIVE')

                //Price
                expect(data[2][4][16]).to.equal(buyPrice)

                //Meta
                expect(data[2][4][31]).to.have.property('$F7',1)

                } 

            // Target the on message [0,"on",[1187238101,null,1588148883485,"tBTCUSD",1588148883486,1588148883491,1,1,"EXCHANGE LIMIT",null,null,null,0,"ACTIVE",null,null,500,0,0,0,null,null,null,0,0,null,null,null,"BFX",null,null,null]
            if(data[1] == 'on'){
                expect(data).to.not.be.null
                console.log(`on message:`,JSON.stringify(data))

                //Assert data against Schema
                SchemaAssertions.assertOrdersSchema(data[2])

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //Symbol
                expect(data[2][3]).to.equal(symbol)

                //Amount
                expect(data[2][6]).to.equal(buyAmount)

                //Amount Orig
                expect(data[2][7]).to.equal(buyAmount)

                //Order Type
                expect(data[2][8]).to.equal('EXCHANGE LIMIT')

                //Flags
                expect(data[2][12]).to.equal(64)

                //Status
                expect(data[2][13]).to.equal('ACTIVE')

                //Price
                expect(data[2][16]).to.equal(buyPrice)

                //Hidden
                expect(data[2][24]).to.equal(1)

                //Meta
                expect(data[2][31]).to.have.property('$F7',1)
                
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

                //Assert data against Schema
                SchemaAssertions.assertOrdersSchema(data[2][4])

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //MTS Timestamp of Notification
                expect(data[2][0]).to.be.a('number')

                //Type 
                expect(data[2][1]).to.equal('on-req')

                //Status
                expect(data[2][6]).to.equal('SUCCESS')

                //Text
                expect(data[2][7]).to.equal('Submitting exchange limit buy order for '+buyAmount+' '+symbolFirst+'.')

                //Symbol
                expect(data[2][4][3]).to.equal(symbol)

                //Amount
                expect(data[2][4][6]).to.equal(buyAmount)

                //Amount Orig
                expect(data[2][4][7]).to.equal(buyAmount)

                //Order Type
                expect(data[2][4][8]).to.equal('EXCHANGE LIMIT')

                //MTS TIF
                expect(data[2][4][10]).to.be.a('number')

                //Flags
                expect(data[2][4][12]).to.equal(0)

                //Status
                expect(data[2][4][13]).to.equal('ACTIVE')

                //Price
                expect(data[2][4][16]).to.equal(buyPrice)

                } 

            // Target the on message [0,"on",[1187238101,null,1588148883485,"tBTCUSD",1588148883486,1588148883491,1,1,"EXCHANGE LIMIT",null,null,null,0,"ACTIVE",null,null,500,0,0,0,null,null,null,0,0,null,null,null,"BFX",null,null,null]
            if(data[1] == 'on'){
                expect(data).to.not.be.null
                console.log(`on message:`,JSON.stringify(data))

                //Assert data against Schema
                SchemaAssertions.assertOrdersSchema(data[2])

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //Symbol
                expect(data[2][3]).to.equal(symbol)

                //Amount
                expect(data[2][6]).to.equal(buyAmount)

                //Amount Orig
                expect(data[2][7]).to.equal(buyAmount)

                //Order Type
                expect(data[2][8]).to.equal('EXCHANGE LIMIT')

                //MTS TIF
                expect(data[2][10]).to.be.a('number')

                //Flags
                expect(data[2][12]).to.equal(0)

                //Status
                expect(data[2][13]).to.equal('ACTIVE')

                //Price
                expect(data[2][16]).to.equal(buyPrice)

                //Hidden
                expect(data[2][24]).to.equal(0)
                
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

                //Assert data against Schema
                SchemaAssertions.assertOrdersSchema(data[2][4])

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //MTS Timestamp of Notification
                expect(data[2][0]).to.be.a('number')

                //Type 
                expect(data[2][1]).to.equal('on-req')

                //Status
                expect(data[2][6]).to.equal('SUCCESS')

                //Text
                expect(data[2][7]).to.equal('Submitting exchange limit buy order for '+buyAmount+' '+symbolFirst+'.')

                //Symbol
                expect(data[2][4][3]).to.equal(symbol)

                //Amount
                expect(data[2][4][6]).to.equal(buyAmount)

                //Amount Orig
                expect(data[2][4][7]).to.equal(buyAmount)

                //Order Type
                expect(data[2][4][8]).to.equal('EXCHANGE LIMIT')

                //Flags
                expect(data[2][4][12]).to.equal(0)

                //Status
                expect(data[2][4][13]).to.equal('ACTIVE')

                //Price
                expect(data[2][4][16]).to.equal(buyPrice)

                //Meta
                expect(data[2][4][31]).to.have.property('aff_code','tEsT_4ffc0d3')

                } 

            // Target the on message [0,"on",[1187238101,null,1588148883485,"tBTCUSD",1588148883486,1588148883491,1,1,"EXCHANGE LIMIT",null,null,null,0,"ACTIVE",null,null,500,0,0,0,null,null,null,0,0,null,null,null,"BFX",null,null,null]
            if(data[1] == 'on'){
                expect(data).to.not.be.null
                console.log(`on message:`,JSON.stringify(data))

                //Assert data against Schema
                SchemaAssertions.assertOrdersSchema(data[2])

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //Symbol
                expect(data[2][3]).to.equal(symbol)

                //Amount
                expect(data[2][6]).to.equal(buyAmount)

                //Amount Orig
                expect(data[2][7]).to.equal(buyAmount)

                //Order Type
                expect(data[2][8]).to.equal('EXCHANGE LIMIT')

                //Flags
                expect(data[2][12]).to.equal(0)

                //Status
                expect(data[2][13]).to.equal('ACTIVE')

                //Price
                expect(data[2][16]).to.equal(buyPrice)

                //Hidden
                expect(data[2][24]).to.equal(0)

                //Meta
                expect(data[2][31]).to.have.property('aff_code','tEsT_4ffc0d3')
                
                done()
                }    
            }
        });

        it('CID Order should return a correct Notification and Order Info message', function(done) {

        this.timeout(10000)

            let payload = JSON.stringify([
                0,
                "on",
                null,
                {
                "cid": 112233,
                "type": "EXCHANGE LIMIT",
                "symbol": symbol,
                "amount": buyAmount.toString(),
                "price": buyPrice.toString()
                }
                ])

            OrderFlagsSocket.send(payload);

        OrderFlagsSocket.onmessage = function (event) {
            let data = JSON.parse(event.data)
            
            // Target the n message [0,"n",[1588148817.151,"on-req",null,null,[1187238099,null,1588148817151,"tBTCUSD",1588148817151,1588148817151,1,1,"EXCHANGE LIMIT",null,null,null,0,"ACTIVE",null,null,500,0,0,0,null,null,null,0,null,null,null,null,"BFX",null,null,null],null,"SUCCESS","Submitting exchange limit buy order for 1 BTC."]]]        

            if(data[1] == 'n'){
                expect(data).to.not.be.null
                console.log(`n message:`,JSON.stringify(data))

                //Assert data against Schema
                SchemaAssertions.assertOrdersSchema(data[2][4])

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //MTS Timestamp of Notification
                expect(data[2][0]).to.be.a('number')

                //Type 
                expect(data[2][1]).to.equal('on-req')

                //Status
                expect(data[2][6]).to.equal('SUCCESS')

                //Text
                expect(data[2][7]).to.equal('Submitting exchange limit buy order for '+buyAmount+' '+symbolFirst+'.')
                
                //CID
                expect(data[2][4][2]).to.equal(112233)

                //Symbol
                expect(data[2][4][3]).to.equal(symbol)

                //Amount
                expect(data[2][4][6]).to.equal(buyAmount)

                //Amount Orig
                expect(data[2][4][7]).to.equal(buyAmount)

                //Order Type
                expect(data[2][4][8]).to.equal('EXCHANGE LIMIT')

                //Flags
                expect(data[2][4][12]).to.equal(0)

                //Status
                expect(data[2][4][13]).to.equal('ACTIVE')

                //Price
                expect(data[2][4][16]).to.equal(buyPrice)

                //Hidden
                expect(data[2][4][24]).to.be.null

                } 

            // Target the on message [0,"on",[1187238101,null,1588148883485,"tBTCUSD",1588148883486,1588148883491,1,1,"EXCHANGE LIMIT",null,null,null,0,"ACTIVE",null,null,500,0,0,0,null,null,null,0,0,null,null,null,"BFX",null,null,null]
            if(data[1] == 'on'){
                expect(data).to.not.be.null
                console.log(`on message:`,JSON.stringify(data))

                //Assert data against Schema
                SchemaAssertions.assertOrdersSchema(data[2])

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)
                
                //CID
                expect(data[2][2]).to.equal(112233)

                //Symbol
                expect(data[2][3]).to.equal(symbol)

                //Amount
                expect(data[2][6]).to.equal(buyAmount)

                //Amount Orig
                expect(data[2][7]).to.equal(buyAmount)

                //Order Type
                expect(data[2][8]).to.equal('EXCHANGE LIMIT')

                //Flags
                expect(data[2][12]).to.equal(0)

                //Status
                expect(data[2][13]).to.equal('ACTIVE')

                //Price
                expect(data[2][16]).to.equal(buyPrice)

                //Hidden
                expect(data[2][24]).to.equal(0)
                
                done()
                }    
            }
        });

        it('CID Order Update should return a correct Notification and Order Update message', function(done) {

        this.timeout(10000)

            let payload = JSON.stringify([
                0,
                "ou",
                null,
                {
                "cid": 112233,
                "cid_date": cidDate,
                "amount": "1.2",
                "price": "2.1"
                }
                ])

            OrderFlagsSocket.send(payload);

        OrderFlagsSocket.onmessage = function (event) {
            let data = JSON.parse(event.data)
            
            // Target the n message [0,"n",[1588506601803,"ou-req",null,null,[1187252384,null,112233,"tBTCUSD",1588506601759,1588506601762,1.2,1.2,"EXCHANGE LIMIT",null,null,null,0,"ACTIVE",null,null,2.1,0,0,0,null,null,null,0,0,null,null,null,"API>BFX",null,null,null],null,"SUCCESS","Submitting update to exchange limit buy order for 1.2 BTC."]]       

            if(data[1] == 'n'){
                expect(data).to.not.be.null
                console.log(`n message:`,JSON.stringify(data))

                //Assert data against Schema
                SchemaAssertions.assertOrdersSchema(data[2][4])

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //MTS Timestamp of Notification
                expect(data[2][0]).to.be.a('number')

                //Type 
                expect(data[2][1]).to.equal('ou-req')

                //Status
                expect(data[2][6]).to.equal('SUCCESS')

                //Text
                expect(data[2][7]).to.equal('Submitting update to exchange limit buy order for 1.2 '+symbolFirst+'.')
                
                //CID
                expect(data[2][4][2]).to.equal(112233)

                //Symbol
                expect(data[2][4][3]).to.equal(symbol)

                //Amount
                expect(data[2][4][6]).to.equal(1.2)

                //Amount Orig
                expect(data[2][4][7]).to.equal(1.2)

                //Order Type
                expect(data[2][4][8]).to.equal('EXCHANGE LIMIT')

                //Flags
                expect(data[2][4][12]).to.equal(0)

                //Status
                expect(data[2][4][13]).to.equal('ACTIVE')

                //Price
                expect(data[2][4][16]).to.equal(2.1)

                //Hidden
                expect(data[2][4][24]).to.equal(0)

                } 

            // Target the ou message [0,"ou",[1187252382,null,112233,"tBTCUSD",1588506280354,1588506280403,1.2,1.2,"EXCHANGE LIMIT","EXCHANGE LIMIT",null,null,0,"ACTIVE",null,null,2.1,0,0,0,null,null,null,0,0,null,null,null,"API>BFX",null,null,null]]
            if(data[1] == 'ou'){
                expect(data).to.not.be.null
                console.log(`ou message:`,JSON.stringify(data))

                //Assert data against Schema
                SchemaAssertions.assertOrdersSchema(data[2])

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)
                
                //CID
                expect(data[2][2]).to.equal(112233)

                //Symbol
                expect(data[2][3]).to.equal(symbol)

                //Amount
                expect(data[2][6]).to.equal(1.2)

                //Amount Orig
                expect(data[2][7]).to.equal(1.2)

                //Order Type
                expect(data[2][8]).to.equal('EXCHANGE LIMIT')

                //Order Type Previous
                expect(data[2][9]).to.equal('EXCHANGE LIMIT')

                //Symbol
                expect(data[2][3]).to.equal(symbol)

                //Flags
                expect(data[2][12]).to.equal(0)

                //Status
                expect(data[2][13]).to.equal('ACTIVE')

                //Price
                expect(data[2][16]).to.equal(2.1)

                //Hidden
                expect(data[2][24]).to.equal(0)
                
                done()
                }    
            }
        });

        it('Delta Order Update should return a correct Notification and Order Update message', function(done) {

        this.timeout(10000)

            let payload = JSON.stringify([
                0,
                "ou",
                null,
                {
                "cid": 112233,
                "cid_date": cidDate,
                "delta": "0.1"
                }
                ])

            OrderFlagsSocket.send(payload);

        OrderFlagsSocket.onmessage = function (event) {
            let data = JSON.parse(event.data)
            
            // Target the n message [0,"n",[1588506601803,"ou-req",null,null,[1187252384,null,112233,"tBTCUSD",1588506601759,1588506601762,1.2,1.2,"EXCHANGE LIMIT",null,null,null,0,"ACTIVE",null,null,2.1,0,0,0,null,null,null,0,0,null,null,null,"API>BFX",null,null,null],null,"SUCCESS","Submitting update to exchange limit buy order for 1.2 BTC."]]       

            if(data[1] == 'n'){
                expect(data).to.not.be.null
                console.log(`n message:`,JSON.stringify(data))

                //Assert data against Schema
                SchemaAssertions.assertOrdersSchema(data[2][4])

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //MTS Timestamp of Notification
                expect(data[2][0]).to.be.a('number')

                //Type 
                expect(data[2][1]).to.equal('ou-req')

                //Status
                expect(data[2][6]).to.equal('SUCCESS')

                //Text
                expect(data[2][7]).to.equal('Submitting update to exchange limit buy order for 1.3 '+symbolFirst+'.')
                
                //CID
                expect(data[2][4][2]).to.equal(112233)

                //Symbol
                expect(data[2][4][3]).to.equal(symbol)

                //Amount
                expect(data[2][4][6]).to.equal(1.3)

                //Amount Orig
                expect(data[2][4][7]).to.equal(1.3)

                //Order Type
                expect(data[2][4][8]).to.equal('EXCHANGE LIMIT')

                //Order Type Previous
                expect(data[2][4][9]).to.equal('EXCHANGE LIMIT')

                //Flags
                expect(data[2][4][12]).to.equal(0)

                //Status
                expect(data[2][4][13]).to.equal('ACTIVE')

                //Price
                expect(data[2][4][16]).to.equal(2.1)

                //Hidden
                expect(data[2][4][24]).to.equal(0)

                } 

            // Target the ou message [0,"ou",[1187252382,null,112233,"tBTCUSD",1588506280354,1588506280403,1.2,1.2,"EXCHANGE LIMIT","EXCHANGE LIMIT",null,null,0,"ACTIVE",null,null,2.1,0,0,0,null,null,null,0,0,null,null,null,"API>BFX",null,null,null]]
            if(data[1] == 'ou'){
                expect(data).to.not.be.null
                console.log(`ou message:`,JSON.stringify(data))

                //Assert data against Schema
                SchemaAssertions.assertOrdersSchema(data[2])

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)
                
                //CID
                expect(data[2][2]).to.equal(112233)

                //Symbol
                expect(data[2][3]).to.equal(symbol)

                //Amount
                expect(data[2][6]).to.equal(1.3)

                //Amount Orig
                expect(data[2][7]).to.equal(1.3)

                //Order Type
                expect(data[2][8]).to.equal('EXCHANGE LIMIT')

                //Order Type Previous
                expect(data[2][9]).to.equal('EXCHANGE LIMIT')

                //Symbol
                expect(data[2][3]).to.equal(symbol)

                //Flags
                expect(data[2][12]).to.equal(0)

                //Status
                expect(data[2][13]).to.equal('ACTIVE')

                //Price
                expect(data[2][16]).to.equal(2.1)

                //Hidden
                expect(data[2][24]).to.equal(0)
                
                done()
                }    
            }
        });

        it('CID Order Cancel should return a correct Notification and Order Cancel message', function(done) {

        this.timeout(10000)

            let payload = JSON.stringify([
                0,
                "oc",
                null,
                {
                "cid": 112233,
                "cid_date": cidDate
                }
                ])

            OrderFlagsSocket.send(payload);

        OrderFlagsSocket.onmessage = function (event) {
            let data = JSON.parse(event.data)
            
            // Target the n message [0,"n",[1588506601803,"oc-req",null,null,[1187252384,null,112233,"tBTCUSD",1588506601759,1588506601762,1.2,1.2,"EXCHANGE LIMIT",null,null,null,0,"ACTIVE",null,null,2.1,0,0,0,null,null,null,0,0,null,null,null,"API>BFX",null,null,null],null,"SUCCESS","Submitting update to exchange limit buy order for 1.2 BTC."]]       

            if(data[1] == 'n'){
                expect(data).to.not.be.null
                console.log(`n message:`,JSON.stringify(data))

                //Assert data against Schema
                SchemaAssertions.assertOrdersSchema(data[2][4])

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //MTS Timestamp of Notification
                expect(data[2][0]).to.be.a('number')

                //Type 
                expect(data[2][1]).to.equal('oc-req')

                //Status
                expect(data[2][6]).to.equal('SUCCESS')

                //Text
                expect(data[2][7]).to.contain('Submitted for cancellation; waiting for confirmation')
                
                //CID
                expect(data[2][4][2]).to.equal(112233)

                //Symbol
                expect(data[2][4][3]).to.equal(symbol)

                //Amount
                expect(data[2][4][6]).to.equal(1.3)

                //Amount Orig
                expect(data[2][4][7]).to.equal(1.3)

                //Order Type
                expect(data[2][4][8]).to.equal('EXCHANGE LIMIT')

                //Order Type Previous
                expect(data[2][4][9]).to.equal('EXCHANGE LIMIT')

                //Flags
                expect(data[2][4][12]).to.equal(0)

                //Status
                expect(data[2][4][13]).to.equal('ACTIVE')

                //Price
                expect(data[2][4][16]).to.equal(2.1)

                //Hidden
                expect(data[2][4][24]).to.equal(0)

                } 

            // Target the oc message [0,"oc",[1187252382,null,112233,"tBTCUSD",1588506280354,1588506280403,1.2,1.2,"EXCHANGE LIMIT","EXCHANGE LIMIT",null,null,0,"CANCELED",null,null,2.1,0,0,0,null,null,null,0,0,null,null,null,"API>BFX",null,null,null]]
            if(data[1] == 'oc'){
                expect(data).to.not.be.null
                console.log(`oc message:`,JSON.stringify(data))

                //Assert data against Schema
                SchemaAssertions.assertOrdersSchema(data[2])

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)
                
                //CID
                expect(data[2][2]).to.equal(112233)

                //Symbol
                expect(data[2][3]).to.equal(symbol)

                //Amount
                expect(data[2][6]).to.equal(1.3)

                //Amount Orig
                expect(data[2][7]).to.equal(1.3)

                //Order Type
                expect(data[2][8]).to.equal('EXCHANGE LIMIT')

                //Order Type Previous
                expect(data[2][9]).to.equal('EXCHANGE LIMIT')

                //Symbol
                expect(data[2][3]).to.equal(symbol)

                //Flags
                expect(data[2][12]).to.equal(0)

                //Status
                expect(data[2][13]).to.equal('CANCELED')

                //Price
                expect(data[2][16]).to.equal(2.1)

                //Hidden
                expect(data[2][24]).to.equal(0)
                
                done()
                }    
            }
        });

        it('CID Multi Order Cancel should return a correct Notification and Order Cancel message', function(done) {

        this.timeout(10000)

            let payload = JSON.stringify([
                  0,
                  "oc_multi",
                  null,
                  {
                    "cid": [
                      [12345, cidDate],
                      [54321, cidDate]
                    ]
                  }
                ])

            sleep(3000) //Wait for orders to be placed

            OrderFlagsSocket.send(payload);

        OrderFlagsSocket.onmessage = function (event) {
            let data = JSON.parse(event.data)
            
            // Target the n message [0,"n",[1588583855699,"oc_multi-req",null,null,[[1187253121,null,12345,"tBTCUSD",1588583852201,1588583852205,0.001,0.001,"EXCHANGE LIMIT",null,null,null,64,"ACTIVE",null,null,1,0,0,0,null,null,null,0,1,null,null,null,"API>BFX",null,null,null],[1187253122,null,54321,"tBTCUSD",1588583852246,1588583852251,0.001,0.001,"EXCHANGE LIMIT",null,null,null,0,"ACTIVE",null,null,1,0,0,0,null,null,null,0,0,null,null,null,"API>BFX",null,null,{"$F7":1}]],null,"SUCCESS","Submitting 2 order cancellations."]]     

            if(data[1] == 'n'){
                expect(data).to.not.be.null
                console.log(`n message:`,JSON.stringify(data))

                //Assert data against Schema
                SchemaAssertions.assertOrdersSchema(data[2][4][0])

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //MTS Timestamp of Notification
                expect(data[2][0]).to.be.a('number')

                //Type 
                expect(data[2][1]).to.equal('oc_multi-req')

                //Status
                expect(data[2][6]).to.equal('SUCCESS')

                //Text
                expect(data[2][7]).to.be.a('string')
                .and.to.contain('Submitting')
                expect(data[2][7]).to.contain('Submitting 2 order cancellations.')

                //Order ID
                expect(data[2][4][0][0]).to.be.a('number')

                //CID
                expect(data[2][4][0][2]).to.be.a('number')

                //Symbol
                expect(data[2][4][0][3]).to.equal(symbol)

                //MTS Create
                expect(data[2][4][0][4]).to.be.a('number')
                .and.to.match(/^(\d{13})?$/)

                //MTS Update
                expect(data[2][4][0][5]).to.be.a('number')
                .and.to.match(/^(\d{13})?$/)

                //Amount
                expect(data[2][4][0][6]).to.be.a('number')

                //Amount Orig
                expect(data[2][4][0][7]).to.be.a('number')

                //Order Type
                expect(data[2][4][0][8]).to.be.a('string')

                //Flags
                expect(data[2][4][0][12]).to.be.a('number')

                //Status
                expect(data[2][4][0][13]).to.be.a('string')

                //Price
                expect(data[2][4][0][16]).to.be.a('number')

                //Price Average
                expect(data[2][4][0][17]).to.be.a('number')

                //Price Trailing
                expect(data[2][4][0][18]).to.be.a('number')

                //Price Aux Limit
                expect(data[2][4][0][19]).to.be.a('number')

                //Notify
                expect(data[2][4][0][23]).to.equal(0)

                //Routing
                expect(data[2][4][0][28]).to.equal('API>BFX')

            }

            // Target the oc message [0,"oc",[1187253121,null,12345,"tBTCUSD",1588583852201,1588583855704,0.001,0.001,"EXCHANGE LIMIT",null,null,null,64,"CANCELED",null,null,1,0,0,0,null,null,null,0,1,null,null,null,"API>BFX",null,null,null]]
            if(data[1] == 'oc' && data[2][2] == 12345){
                expect(data).to.not.be.null
                console.log(`oc message:`,JSON.stringify(data))

                //Assert data against Schema
                SchemaAssertions.assertOrdersSchema(data[2])

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)
                
                //CID
                expect(data[2][2]).to.equal(12345)

                //Symbol
                expect(data[2][3]).to.equal(symbol)

                //Amount
                expect(data[2][6]).to.equal(buyAmount)

                //Amount Orig
                expect(data[2][7]).to.equal(buyAmount)

                //Order Type
                expect(data[2][8]).to.equal('EXCHANGE LIMIT')

                //Flags
                expect(data[2][12]).to.equal(64)

                //Status
                expect(data[2][13]).to.equal('CANCELED')

                //Price
                expect(data[2][16]).to.equal(buyPrice)

                //Hidden
                expect(data[2][24]).to.equal(1)
                
                } 

                 // Target the oc message [0,"oc",[1187253122,null,54321,"tBTCUSD",1588583852246,1588583855705,0.001,0.001,"EXCHANGE LIMIT",null,null,null,0,"CANCELED",null,null,1,0,0,0,null,null,null,0,0,null,null,null,"API>BFX",null,null,{"$F7":1}]]
            if(data[1] == 'oc' && data[2][2] == 54321){
                expect(data).to.not.be.null
                console.log(`oc message:`,JSON.stringify(data))

                // //Assert data against Schema
                // SchemaAssertions.assertOrdersSchema(data[2])

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //CID
                expect(data[2][2]).to.equal(54321)

                //Symbol
                expect(data[2][3]).to.equal(symbol)

                //Amount
                expect(data[2][6]).to.equal(buyAmount)

                //Amount Orig
                expect(data[2][7]).to.equal(buyAmount)

                //Order Type
                expect(data[2][8]).to.equal('EXCHANGE LIMIT')

                //Flags
                expect(data[2][12]).to.equal(0)

                //Status
                expect(data[2][13]).to.equal('CANCELED')

                //Price
                expect(data[2][16]).to.equal(buyPrice)

                //Hidden
                expect(data[2][24]).to.equal(0)

                //Placeholder
                expect(data[2][31]).to.have.property('$F7',1)
                
                done()
                }   
            }
        });

        it('Cancel all orders should return a correct Notification', function(done) {

        this.timeout(10000)

            let payload = JSON.stringify([
                0,
                "oc_multi",
                null,
                {
                "all": 1
                }
                ])

            OrderFlagsSocket.send(payload);

        OrderFlagsSocket.onmessage = function (event) {
            let data = JSON.parse(event.data)
            
            // Target the n message [0,"n",[1588341920226,"oc_multi-req",null,null,[[1187248974,null,1588341908276,"tBTCUSD",1588341908277,1588341908284,1,1,"EXCHANGE LIMIT",null,null,null,0,"ACTIVE",null,null,1,0,0,0,null,null,null,0,0,null,null,null,"BFX",null,null,null],[1187248975,null,1588341909262,"tBTCUSD",1588341909262,1588341909266,1,1,"EXCHANGE LIMIT",null,null,null,0,"ACTIVE",null,null,1,0,0,0,null,null,null,0,0,null,null,null,"BFX",null,null,null]],null,"SUCCESS","Submitting 2 order cancellations."]]          

            if(data[1] == 'n'){
                expect(data).to.not.be.null
                OrderFlagsSocket.close()
                console.log(`n message:`,JSON.stringify(data))

                //Assert data against Schema
                SchemaAssertions.assertOrdersSchema(data[2][4][0])

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //MTS Timestamp of Notification
                expect(data[2][0]).to.be.a('number')

                //Type 
                expect(data[2][1]).to.equal('oc_multi-req')

                //Status
                expect(data[2][6]).to.equal('SUCCESS')

                //Text
                expect(data[2][7]).to.be.a('string')
                .and.to.contain('Submitting')
                expect(data[2][7]).to.contain('order cancellations')

                //Order ID
                expect(data[2][4][0][0]).to.be.a('number')

                //CID
                expect(data[2][4][0][2]).to.be.a('number')

                //Symbol
                expect(data[2][4][0][3]).to.equal(symbol)

                //MTS Create
                expect(data[2][4][0][4]).to.be.a('number')
                .and.to.match(/^(\d{13})?$/)

                //MTS Update
                expect(data[2][4][0][5]).to.be.a('number')
                .and.to.match(/^(\d{13})?$/)

                //Amount
                expect(data[2][4][0][6]).to.be.a('number')

                //Amount Orig
                expect(data[2][4][0][7]).to.be.a('number')

                //Order Type
                expect(data[2][4][0][8]).to.be.a('string')

                //Flags
                expect(data[2][4][0][12]).to.be.a('number')

                //Status
                expect(data[2][4][0][13]).to.be.a('string')

                //Price
                expect(data[2][4][0][16]).to.be.a('number')

                //Price Average
                expect(data[2][4][0][17]).to.be.a('number')

                //Price Trailing
                expect(data[2][4][0][18]).to.be.a('number')

                //Price Aux Limit
                expect(data[2][4][0][19]).to.be.a('number')

                //Notify
                expect(data[2][4][0][23]).to.equal(0)

                //Routing
                expect(data[2][4][0][28]).to.equal('API>BFX')

                done()

                }    
            }
        });

    })
