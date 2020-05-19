const WebSocket = require('ws');
const fs = require('fs');
const expect = require('chai').expect;
const ws_url = require('../config.json').ws_url
const crypto = require('crypto-js') // Standard JavaScript cryptography library
const apiKey = require('../config.json').api_key
const apiSecret = require('../config.json').api_secret
const SchemaAssertions = require("../Assertions/schema.js")

//Auth
const NewExchangeOrderSocket = new WebSocket(ws_url);
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
let orderId
let orderId2

//Sleep timer
function sleep(milliseconds) {
  const date = Date.now();
  let currentDate = null;
  do {
    currentDate = Date.now();
  } while (currentDate - date < milliseconds);
}

describe('New Exchange Order Tests (Tests "on", "ou", "oc" and "oc_multi" inputs and authenticated channels: "n", "on", "ou", "oc", "te", "tu")', function() {
        it('New Exchange Limit Buy Order should return a correct Notification and Order Info message', function(done) {

        this.timeout(10000)

        NewExchangeOrderSocket.onopen = function (event) {
            let payload = JSON.stringify([
                0,
                "on",
                null,
                {
                "type": "EXCHANGE LIMIT",
                "symbol": symbol,
                "amount": buyAmount.toString(),
                "price": buyPrice.toString()
                }
                ])
            NewExchangeOrderSocket.send(JSON.stringify(payloadAuth))
            sleep(1000);
            NewExchangeOrderSocket.send(payload);
          };

        NewExchangeOrderSocket.onmessage = function (event) {
            let data = JSON.parse(event.data)
            
            // Target the n message [0,"n",[1588148817.151,"on-req",null,null,[1187238099,null,1588148817151,"tBTCUSD",1588148817151,1588148817151,1,1,"EXCHANGE LIMIT",null,null,null,0,"ACTIVE",null,null,500,0,0,0,null,null,null,0,null,null,null,null,"BFX",null,null,null],null,"SUCCESS","Submitting exchange limit buy order for 1 BTC."]]]        
            if(data[1] == 'n'){
                expect(data).to.not.be.null
                console.log(`n message:`,JSON.stringify(data))

                //Assert data against Schema
                SchemaAssertions.assertOrdersSchema(data[2][4])

                //Save Order ID to be used in later test
                orderId = data[2][4][0]

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

                //MTS Update
                expect(data[2][4][5]).to.equal(data[2][4][4])

                //Amount
                expect(data[2][4][6]).to.equal(buyAmount)

                //Amount Orig
                expect(data[2][4][7]).to.equal(buyAmount)

                //Order Type
                expect(data[2][4][8]).to.equal('EXCHANGE LIMIT')

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

                //MTS Update
                expect(data[2][5]).to.be.greaterThan(data[2][4])

                //Amount
                expect(data[2][6]).to.equal(buyAmount)

                //Amount Orig
                expect(data[2][7]).to.equal(buyAmount)

                //Order Type
                expect(data[2][8]).to.equal('EXCHANGE LIMIT')

                //Status
                expect(data[2][13]).to.equal('ACTIVE')

                //Price
                expect(data[2][16]).to.equal(buyPrice)
                
                done()
                }    
            }
        });

        it('Update Exchange Limit Buy Order should return a correct Notification and Order Update message', function(done) {

        this.timeout(10000)

            let payload = JSON.stringify([
                0,
                "ou",
                null,
                {
                "id": orderId,
                "amount": "1.2",
                "price": "2.1"
                }
                ])
            NewExchangeOrderSocket.send(payload);

        NewExchangeOrderSocket.onmessage = function (event) {
            let data = JSON.parse(event.data)
            
            // Target the n message [0,"n",[1588506601803,"ou-req",null,null,[1187252384,null,1588506601758,"tBTCUSD",1588506601759,1588506601762,1.2,1.2,"EXCHANGE LIMIT",null,null,null,0,"ACTIVE",null,null,2.1,0,0,0,null,null,null,0,0,null,null,null,"API>BFX",null,null,null],null,"SUCCESS","Submitting update to exchange limit buy order for 1.2 BTC."]]    

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

                //Order ID
                expect(data[2][4][0]).to.equal(orderId)

                //Symbol
                expect(data[2][4][3]).to.equal(symbol)

                //Amount
                expect(data[2][4][6]).to.equal(1.2)

                //Amount Orig
                expect(data[2][4][7]).to.equal(1.2)

                //Order Type
                expect(data[2][4][8]).to.equal('EXCHANGE LIMIT')

                //Status
                expect(data[2][4][13]).to.equal('ACTIVE')

                //Price
                expect(data[2][4][16]).to.equal(2.1)

                } 

            // Target the ou message [0,"ou",[1187252382,null,1588506280353,"tBTCUSD",1588506280354,1588506280403,1.2,1.2,"EXCHANGE LIMIT","EXCHANGE LIMIT",null,null,0,"ACTIVE",null,null,2.1,0,0,0,null,null,null,0,0,null,null,null,"API>BFX",null,null,null]]   
            if(data[1] == 'ou'){
                expect(data).to.not.be.null
                console.log(`ou message:`,JSON.stringify(data))

                //Assert data against Schema
                SchemaAssertions.assertOrdersSchema(data[2])

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //Order ID
                expect(data[2][0]).to.equal(orderId)

                //Symbol
                expect(data[2][3]).to.equal(symbol)

                //Amount
                expect(data[2][6]).to.equal(1.2)

                //Amount Orig
                expect(data[2][7]).to.equal(1.2)

                //Order Type
                expect(data[2][8]).to.equal('EXCHANGE LIMIT')

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

        it('Update Hidden Exchange Limit Buy Order should return a correct Notification and Order Update message', function(done) {

        this.timeout(10000)

            let payload = JSON.stringify([
                0,
                "ou",
                null,
                {
                "id": orderId,
                "amount": "1.2",
                "price": "2.1",
                "flags": 64
                }
                ])
            NewExchangeOrderSocket.send(payload);

        NewExchangeOrderSocket.onmessage = function (event) {
            let data = JSON.parse(event.data)
            
            // Target the n message [0,"n",[1588506601803,"ou-req",null,null,[1187252384,null,1588506601758,"tBTCUSD",1588506601759,1588506601762,1.2,1.2,"EXCHANGE LIMIT",null,null,null,0,"ACTIVE",null,null,2.1,0,0,0,null,null,null,0,0,null,null,null,"API>BFX",null,null,null],null,"SUCCESS","Submitting update to exchange limit buy order for 1.2 BTC."]]    

            if(data[1] == 'n'){
                expect(data).to.not.be.null
                console.log(`n message:`,JSON.stringify(data))

                //Assert data against Schema
                SchemaAssertions.assertOrdersSchema(data[2][4])

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //Type 
                expect(data[2][1]).to.equal('ou-req')

                //Status
                expect(data[2][6]).to.equal('SUCCESS')

                //Text
                expect(data[2][7]).to.equal('Submitting update to exchange limit buy order for 1.2 '+symbolFirst+'.')

                //Order ID
                expect(data[2][4][0]).to.equal(orderId)

                //Symbol
                expect(data[2][4][3]).to.equal(symbol)

                //Amount
                expect(data[2][4][6]).to.equal(1.2)

                //Amount Orig
                expect(data[2][4][7]).to.equal(1.2)

                //Order Type
                expect(data[2][4][8]).to.equal('EXCHANGE LIMIT')

                //Order Type Previous
                expect(data[2][4][9]).to.equal('EXCHANGE LIMIT')

                //Flags
                expect(data[2][4][12]).to.equal(64)

                //Status
                expect(data[2][4][13]).to.equal('ACTIVE')

                //Price
                expect(data[2][4][16]).to.equal(2.1)

                } 

            // Target the ou message [0,"ou",[1187252382,null,1588506280353,"tBTCUSD",1588506280354,1588506280403,1.2,1.2,"EXCHANGE LIMIT","EXCHANGE LIMIT",null,null,0,"ACTIVE",null,null,2.1,0,0,0,null,null,null,0,0,null,null,null,"API>BFX",null,null,null]]   
            if(data[1] == 'ou'){
                expect(data).to.not.be.null
                console.log(`ou message:`,JSON.stringify(data))

                //Assert data against Schema
                SchemaAssertions.assertOrdersSchema(data[2])

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //Order ID
                expect(data[2][0]).to.equal(orderId)

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

                //Flags
                expect(data[2][12]).to.equal(64)

                //Status
                expect(data[2][13]).to.equal('ACTIVE')

                //Price
                expect(data[2][16]).to.equal(2.1)

                //Hidden
                expect(data[2][24]).to.equal(1)
                
                done()
                }    
            }
        });

        it('Cancel Exchange Limit Buy Order should return a correct Notification and Order Cancel message', function(done) {

        this.timeout(10000)

            let payload = JSON.stringify([
                0,
                "oc",
                null,
                {
                "id": orderId
                }
                ])
            NewExchangeOrderSocket.send(payload);

        NewExchangeOrderSocket.onmessage = function (event) {
            let data = JSON.parse(event.data)
            
            // Target the n message [0,"n",[1588507087690,"oc-req",null,null,[1187252325,null,1588507083225,"tBTCUSD",1588507083225,1588507083232,1,1,"EXCHANGE LIMIT",null,null,null,0,"ACTIVE",null,null,1,0,0,0,null,null,null,0,0,null,null,null,"BFX",null,null,null],null,"SUCCESS","Submitted for cancellation; waiting for confirmation (ID: 1187252325)."]]        

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
                expect(data[2][7]).to.equal('Submitted for cancellation; waiting for confirmation (ID: '+orderId+').')

                //Order ID
                expect(data[2][4][0]).to.equal(orderId)

                //Symbol
                expect(data[2][4][3]).to.equal(symbol)

                //Amount
                expect(data[2][4][6]).to.equal(1.2)

                //Amount Orig
                expect(data[2][4][7]).to.equal(1.2)

                //Order Type
                expect(data[2][4][8]).to.equal('EXCHANGE LIMIT')

                //Order Type Previous
                expect(data[2][4][9]).to.equal('EXCHANGE LIMIT')

                //Flags
                expect(data[2][4][12]).to.equal(64)

                //Status
                expect(data[2][4][13]).to.equal('ACTIVE')

                //Price
                expect(data[2][4][16]).to.equal(2.1)

                //Hidden
                expect(data[2][4][24]).to.equal(1)

                } 

            // Target the oc message [0,"oc",[1187252325,null,1588507083225,"tBTCUSD",1588507083225,1588507087695,1,1,"EXCHANGE LIMIT",null,null,null,0,"CANCELED",null,null,1,0,0,0,null,null,null,0,0,null,null,null,"BFX",null,null,null]]     
            if(data[1] == 'oc'){
                expect(data).to.not.be.null
                console.log(`oc message:`,JSON.stringify(data))

                //Assert data against Schema
                SchemaAssertions.assertOrdersSchema(data[2])

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //Order ID
                expect(data[2][0]).to.equal(orderId)

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

                //Flags
                expect(data[2][12]).to.equal(64)

                //Status
                expect(data[2][13]).to.equal('CANCELED')

                //Price
                expect(data[2][16]).to.equal(2.1)

                //Hidden
                expect(data[2][24]).to.equal(1)
                
                done()
                }    
            }
        });

        it('New Exchange Limit Sell Order should return a correct Notification and Order Info message', function(done) {

        this.timeout(10000)

            let payload = JSON.stringify([
                0,
                "on",
                null,
                {
                "type": "EXCHANGE LIMIT",
                "symbol": symbol,
                "amount": sellAmount.toString(),
                "price": sellPrice.toString()
                }
                ])

            NewExchangeOrderSocket.send(payload);

        NewExchangeOrderSocket.onmessage = function (event) {
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
                expect(data[2][7]).to.equal('Submitting exchange limit sell order for '+sellAmount+' '+symbolFirst+'.')

                //Symbol
                expect(data[2][4][3]).to.equal(symbol)

                //MTS Update
                expect(data[2][4][5]).to.equal(data[2][4][4])

                //Amount
                expect(data[2][4][6]).to.equal(sellAmount)

                //Amount Orig
                expect(data[2][4][7]).to.equal(sellAmount)

                //Order Type
                expect(data[2][4][8]).to.equal('EXCHANGE LIMIT')

                //Status
                expect(data[2][4][13]).to.equal('ACTIVE')

                //Price
                expect(data[2][4][16]).to.equal(sellPrice)

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
                expect(data[2][6]).to.equal(sellAmount)

                //Amount Orig
                expect(data[2][7]).to.equal(sellAmount)

                //Order Type
                expect(data[2][8]).to.equal('EXCHANGE LIMIT')

                //Status
                expect(data[2][13]).to.equal('ACTIVE')

                //Price
                expect(data[2][16]).to.equal(sellPrice)
                
                done()
                }    
            }
        });

        it('New Exchange Market Buy Order should return a correct Notification, Order Info, Trade Execution and Trade Execution Update message', function(done) {

        this.timeout(10000)

            let payload = JSON.stringify([
                0,
                "on",
                null,
                {
                "type": "EXCHANGE MARKET",
                "symbol": symbol,
                "amount": buyAmount.toString()
                }
                ])

            NewExchangeOrderSocket.send(payload);

        NewExchangeOrderSocket.onmessage = function (event) {
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
                expect(data[2][7]).to.equal('Submitting exchange market buy order for '+buyAmount+' '+symbolFirst+'.')

                //Symbol
                expect(data[2][4][3]).to.equal(symbol)

                //MTS Update
                expect(data[2][4][5]).to.equal(data[2][4][4])

                //Amount
                expect(data[2][4][6]).to.equal(buyAmount)

                //Amount Orig
                expect(data[2][4][7]).to.equal(buyAmount)

                //Order Type
                expect(data[2][4][8]).to.equal('EXCHANGE MARKET')

                //Status
                expect(data[2][4][13]).to.equal('ACTIVE')

                //Price
                expect(data[2][4][16]).to.be.a('number')

                } 

            // Target the oc message [0,"oc",[1187238160,null,1588158739438,"tBTCUSD",1588158739438,1588158739444,0,0.001,"EXCHANGE MARKET",null,null,null,0,"EXECUTED @ 8150.0(0.001)",null,null,8150,8150,0,0,null,null,null,0,0,null,null,null,"BFX",null,null,null]]    
            if(data[1] == 'oc'){
                expect(data).to.not.be.null
                console.log(`oc message:`,JSON.stringify(data))

                //Assert data against Schema
                SchemaAssertions.assertOrdersSchema(data[2])

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //Order ID
                expect(data[2][0]).to.be.a('number')

                //Symbol
                expect(data[2][3]).to.equal(symbol)

                //MTS Update
                expect(data[2][5]).to.be.greaterThan(data[2][4])

                //Amount
                expect(data[2][6]).to.be.a('number')

                //Amount Orig
                expect(data[2][7]).to.equal(buyAmount)

                //Order Type
                expect(data[2][8]).to.equal('EXCHANGE MARKET')

                //Status
                expect(data[2][13]).to.contain('EXECUTED')

                } 

            // Target the te message [0,"te",[25210868,"tBTCUSD",1588241444015.25,1187242129,0.001,8360.8,"EXCHANGE MARKET",8360.8,-1,null,null,1588241444012]]  
            if(data[1] == 'te' && data [2][6] == 'EXCHANGE MARKET'){
                expect(data).to.not.be.null
                console.log(`te message:`,JSON.stringify(data))

                //Assert data against Schema
                SchemaAssertions.assertTradesSchema(data[2])

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //Symbol
                expect(data[2][1]).to.equal(symbol)

                //Exec Amount
                expect(data[2][4]).to.equal(buyAmount)

                //Order Type
                expect(data[2][6]).to.equal('EXCHANGE MARKET')

                //Maker (1 if true, -1 if false)
                expect(data[2][8]).to.equal(-1)

                //Fee
                expect(data[2][9]).to.be.null

                //Fee Currency
                expect(data[2][10]).to.be.null
                //MTS
                
                expect(data[2][11]).to.be.a('number')
                
                }   

            // Target the tu message [0,"tu",[25210868,"tBTCUSD",1588241444015,1187242129,0.001,8360.8,"EXCHANGE MARKET",8360.8,-1,-0.000002,"BTC"]]  
            if(data[1] == 'tu' && data [2][6] == 'EXCHANGE MARKET'){
                expect(data).to.not.be.null
                console.log(`tu message:`,JSON.stringify(data))

                //Assert data against Schema
                SchemaAssertions.assertTradesSchema(data[2])

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //Symbol
                expect(data[2][1]).to.equal(symbol)

                //Exec Amount
                expect(data[2][4]).to.equal(buyAmount)

                //Order Type
                expect(data[2][6]).to.equal('EXCHANGE MARKET')

                //Maker (1 if true, -1 if false)
                expect(data[2][8]).to.equal(-1)

                //Fee
                expect(data[2][9]).to.equal((buyAmount*0.002)*-1)

                //Fee Currency
                expect(data[2][10]).to.equal(symbolFirst)
                
                done()
                } 
            }
        });

        it('New Exchange Market Sell Order should return a correct Notification and Order Info message', function(done) {

        this.timeout(10000)

            let payload = JSON.stringify([
                0,
                "on",
                null,
                {
                "type": "EXCHANGE MARKET",
                "symbol": symbol,
                "amount": sellAmount.toString()
                }
                ])

            NewExchangeOrderSocket.send(payload);

        NewExchangeOrderSocket.onmessage = function (event) {
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
                expect(data[2][7]).to.equal('Submitting exchange market sell order for '+sellAmount+' '+symbolFirst+'.')

                //Symbol
                expect(data[2][4][3]).to.equal(symbol)

                //MTS Update
                expect(data[2][4][5]).to.equal(data[2][4][4])

                //Amount
                expect(data[2][4][6]).to.equal(sellAmount)

                //Amount Orig
                expect(data[2][4][7]).to.equal(sellAmount)

                //Order Type
                expect(data[2][4][8]).to.equal('EXCHANGE MARKET')

                //Status
                expect(data[2][4][13]).to.equal('ACTIVE')

                //Price
                expect(data[2][4][16]).to.be.a('number')

                } 

            // Target the oc message [0,"oc",[1187238160,null,1588158739438,"tBTCUSD",1588158739438,1588158739444,0,0.001,"EXCHANGE MARKET",null,null,null,0,"EXECUTED @ 8150.0(0.001)",null,null,8150,8150,0,0,null,null,null,0,0,null,null,null,"BFX",null,null,null]]    
            if(data[1] == 'oc'){
                expect(data).to.not.be.null
                console.log(`oc message:`,JSON.stringify(data))

                //Assert data against Schema
                SchemaAssertions.assertOrdersSchema(data[2])

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //Order ID
                expect(data[2][0]).to.be.a('number')

                //Symbol
                expect(data[2][3]).to.equal(symbol)

                //MTS Update
                expect(data[2][5]).to.be.greaterThan(data[2][4])

                //Amount
                expect(data[2][6]).to.be.a('number')

                //Amount Orig
                expect(data[2][7]).to.equal(sellAmount)

                //Order Type
                expect(data[2][8]).to.equal('EXCHANGE MARKET')

                //Status
                expect(data[2][13]).to.contain('EXECUTED')

                } 

            // Target the te message [0,"te",[25210868,"tBTCUSD",1588241444015.25,1187242129,0.001,8360.8,"EXCHANGE MARKET",8360.8,-1,null,null,1588241444012]]  
            if(data[1] == 'te' && data [2][6] == 'EXCHANGE MARKET'){
                expect(data).to.not.be.null
                console.log(`te message:`,JSON.stringify(data))

                //Assert data against Schema
                SchemaAssertions.assertTradesSchema(data[2])

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //Symbol
                expect(data[2][1]).to.equal(symbol)

                //Exec Amount
                expect(data[2][4]).to.equal(sellAmount)

                //Order Type
                expect(data[2][6]).to.equal('EXCHANGE MARKET')

                //Maker (1 if true, -1 if false)
                expect(data[2][8]).to.equal(-1)

                //Fee
                expect(data[2][9]).to.be.null

                //Fee Currency
                expect(data[2][10]).to.be.null

                //MTS
                expect(data[2][11]).to.be.a('number')
                
                }   

            // Target the tu message [0,"tu",[25210868,"tBTCUSD",1588241444015,1187242129,0.001,8360.8,"EXCHANGE MARKET",8360.8,-1,-0.000002,"BTC"]]  
            if(data[1] == 'tu' && data [2][6] == 'EXCHANGE MARKET'){
                expect(data).to.not.be.null
                console.log(`tu message:`,JSON.stringify(data))

                //Assert data against Schema
                SchemaAssertions.assertTradesSchema(data[2])

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //Symbol
                expect(data[2][1]).to.equal(symbol)

                //Exec Amount
                expect(data[2][4]).to.equal(sellAmount)

                //Order Type
                expect(data[2][6]).to.equal('EXCHANGE MARKET')

                //Maker (1 if true, -1 if false)
                expect(data[2][8]).to.equal(-1)

                //Fee
                expect(data[2][9]).to.be.a('number')

                //Fee Currency
                expect(data[2][10]).to.equal(symbolSecond)
                
                done()
                }   
            }
        });

        it('New Exchange Stop Buy Order should return a correct Notification and Order Info message', function(done) {

        this.timeout(10000)

            let payload = JSON.stringify([
                0,
                "on",
                null,
                {
                "type": "EXCHANGE STOP",
                "symbol": symbol,
                "amount": buyAmount.toString(),
                "price": sellPrice.toString()
                }
                ])

            NewExchangeOrderSocket.send(payload);

        NewExchangeOrderSocket.onmessage = function (event) {
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
                expect(data[2][7]).to.equal('Submitting exchange stop buy order for '+buyAmount+' '+symbolFirst+'.')

                //Order ID
                expect(data[2][4][0]).to.be.a('number')
                orderId = data[2][4][0]

                //CID
                expect(data[2][4][2]).to.be.a('number')

                //Symbol
                expect(data[2][4][3]).to.equal(symbol)

                //MTS Update
                expect(data[2][4][5]).to.equal(data[2][4][4])

                //Amount
                expect(data[2][4][6]).to.equal(buyAmount)

                //Amount Orig
                expect(data[2][4][7]).to.equal(buyAmount)

                //Order Type
                expect(data[2][4][8]).to.equal('EXCHANGE STOP')

                //Status
                expect(data[2][4][13]).to.equal('ACTIVE')

                //Price
                expect(data[2][4][16]).to.equal(sellPrice)

                

                } 

            // Target the on message [0,"on",[1187238101,null,1588148883485,"tBTCUSD",1588148883486,1588148883491,1,1,"EXCHANGE LIMIT",null,null,null,0,"ACTIVE",null,null,500,0,0,0,null,null,null,0,0,null,null,null,"BFX",null,null,null]   
            if(data[1] == 'on'){
                expect(data).to.not.be.null
                console.log(`on message:`,JSON.stringify(data))

                //Assert data against Schema
                SchemaAssertions.assertOrdersSchema(data[2])

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //Order ID
                expect(data[2][0]).to.be.a('number')

                //Symbol
                expect(data[2][3]).to.equal(symbol)

                //MTS Update
                expect(data[2][5]).to.be.greaterThan(data[2][4])

                //Amount
                expect(data[2][6]).to.equal(buyAmount)

                //Amount Orig
                expect(data[2][7]).to.equal(buyAmount)

                //Order Type
                expect(data[2][8]).to.equal('EXCHANGE STOP')

                //Status
                expect(data[2][13]).to.contain('ACTIVE')

                //Price
                expect(data[2][16]).to.equal(sellPrice)

                //Price Average
                expect(data[2][17]).to.equal(0)


                done()
                }    
            }
        });

        it('New Exchange Stop Sell Order should return a correct Notification and Order Info message', function(done) {

        this.timeout(10000)

            let payload = JSON.stringify([
                0,
                "on",
                null,
                {
                "type": "EXCHANGE STOP",
                "symbol": symbol,
                "amount": sellAmount.toString(),
                "price": buyPrice.toString()
                }
                ])

            NewExchangeOrderSocket.send(payload);

        NewExchangeOrderSocket.onmessage = function (event) {
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
                expect(data[2][7]).to.equal('Submitting exchange stop sell order for '+sellAmount+' '+symbolFirst+'.')

                //Order ID
                expect(data[2][4][0]).to.be.a('number')
                orderId2 = data[2][4][0]

                //CID
                expect(data[2][4][2]).to.be.a('number')

                //Symbol
                expect(data[2][4][3]).to.equal(symbol)

                //MTS Update
                expect(data[2][4][5]).to.equal(data[2][4][4])

                //Amount
                expect(data[2][4][6]).to.equal(sellAmount)

                //Amount Orig
                expect(data[2][4][7]).to.equal(sellAmount)

                //Order Type
                expect(data[2][4][8]).to.equal('EXCHANGE STOP')

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

                //Order ID
                expect(data[2][0]).to.be.a('number')

                //Symbol
                expect(data[2][3]).to.equal(symbol)

                //MTS Update
                expect(data[2][5]).to.be.greaterThan(data[2][4])

                //Amount
                expect(data[2][6]).to.equal(sellAmount)

                //Amount Orig
                expect(data[2][7]).to.equal(sellAmount)

                //Order Type
                expect(data[2][8]).to.equal('EXCHANGE STOP')

                //Status
                expect(data[2][13]).to.contain('ACTIVE')

                //Price
                expect(data[2][16]).to.equal(buyPrice)

                //Price Average
                expect(data[2][17]).to.equal(0)


                done()
                }    
            }
        });

        it('New Exchange Stop Limit Buy Order should return a correct Notification and Order Info message', function(done) {

        this.timeout(10000)

            let payload = JSON.stringify([
                0,
                "on",
                null,
                {
                "type": "EXCHANGE STOP LIMIT",
                "symbol": symbol,
                "amount": buyAmount.toString(),
                "price": sellPrice.toString(),
                "price_aux_limit": buyPrice.toString()
                }
                ])

            NewExchangeOrderSocket.send(payload);

        NewExchangeOrderSocket.onmessage = function (event) {
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
                expect(data[2][7]).to.equal('Submitting exchange stop limit buy order for '+buyAmount+' '+symbolFirst+'.')

                //Symbol
                expect(data[2][4][3]).to.equal(symbol)

                //MTS Update
                expect(data[2][4][5]).to.equal(data[2][4][4])

                //Amount
                expect(data[2][4][6]).to.equal(buyAmount)

                //Amount Orig
                expect(data[2][4][7]).to.equal(buyAmount)

                //Order Type
                expect(data[2][4][8]).to.equal('EXCHANGE STOP LIMIT')

                //Status
                expect(data[2][4][13]).to.equal('ACTIVE')

                //Price
                expect(data[2][4][16]).to.equal(sellPrice)

                //Price Aux Limit
                expect(data[2][4][19]).to.equal(buyPrice)

                } 

            // Target the on message [0,"on",[1187238101,null,1588148883485,"tBTCUSD",1588148883486,1588148883491,1,1,"EXCHANGE LIMIT",null,null,null,0,"ACTIVE",null,null,500,0,0,0,null,null,null,0,0,null,null,null,"BFX",null,null,null]   
            if(data[1] == 'on'){
                expect(data).to.not.be.null
                console.log(`on message:`,JSON.stringify(data))

                //Assert data against Schema
                SchemaAssertions.assertOrdersSchema(data[2])

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //Order ID
                expect(data[2][0]).to.be.a('number')

                //Symbol
                expect(data[2][3]).to.equal(symbol)

                //MTS Update
                expect(data[2][5]).to.be.greaterThan(data[2][4])

                //Amount
                expect(data[2][6]).to.equal(buyAmount)

                //Amount Orig
                expect(data[2][7]).to.equal(buyAmount)

                //Order Type
                expect(data[2][8]).to.equal('EXCHANGE STOP LIMIT')

                //Status
                expect(data[2][13]).to.contain('ACTIVE')

                //Price
                expect(data[2][16]).to.equal(sellPrice)

                //Price Aux Limit
                expect(data[2][19]).to.equal(buyPrice)
                
                done()
                }    
            }
        });

        it('New Exchange Stop Limit Sell Order should return a correct Notification and Order Info message', function(done) {

        this.timeout(10000)

            let payload = JSON.stringify([
                0,
                "on",
                null,
                {
                "type": "EXCHANGE STOP LIMIT",
                "symbol": symbol,
                "amount": sellAmount.toString(),
                "price": buyPrice.toString(),
                "price_aux_limit": sellPrice.toString(),
                }
                ])

            NewExchangeOrderSocket.send(payload);

        NewExchangeOrderSocket.onmessage = function (event) {
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
                expect(data[2][7]).to.equal('Submitting exchange stop limit sell order for '+sellAmount+' '+symbolFirst+'.')

                //Symbol
                expect(data[2][4][3]).to.equal(symbol)

                //MTS Update
                expect(data[2][4][5]).to.equal(data[2][4][4])

                //Amount
                expect(data[2][4][6]).to.equal(sellAmount)

                //Amount Orig
                expect(data[2][4][7]).to.equal(sellAmount)

                //Order Type
                expect(data[2][4][8]).to.equal('EXCHANGE STOP LIMIT')

                //Status
                expect(data[2][4][13]).to.equal('ACTIVE')

                //Price
                expect(data[2][4][16]).to.equal(buyPrice)

                //Price Aux Limit
                expect(data[2][4][19]).to.equal(sellPrice)

                } 

            // Target the on message [0,"on",[1187238101,null,1588148883485,"tBTCUSD",1588148883486,1588148883491,1,1,"EXCHANGE LIMIT",null,null,null,0,"ACTIVE",null,null,500,0,0,0,null,null,null,0,0,null,null,null,"BFX",null,null,null]   
            if(data[1] == 'on'){
                expect(data).to.not.be.null
                console.log(`on message:`,JSON.stringify(data))

                //Assert data against Schema
                SchemaAssertions.assertOrdersSchema(data[2])

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //Order ID
                expect(data[2][0]).to.be.a('number')

                //Symbol
                expect(data[2][3]).to.equal(symbol)

                //MTS Update
                expect(data[2][5]).to.be.greaterThan(data[2][4])

                //Amount
                expect(data[2][6]).to.equal(sellAmount)

                //Amount Orig
                expect(data[2][7]).to.equal(sellAmount)

                //Order Type
                expect(data[2][8]).to.equal('EXCHANGE STOP LIMIT')

                //Status
                expect(data[2][13]).to.contain('ACTIVE')

                //Price
                expect(data[2][16]).to.equal(buyPrice)

                //Price Aux Limit
                expect(data[2][19]).to.equal(sellPrice)
                
                done()
                }    
            }
        });

        it('New Exchange Trailing Stop Buy Order should return a correct Notification and Order Info message', function(done) {

        this.timeout(10000)

            let payload = JSON.stringify([
                0,
                "on",
                null,
                {
                "type": "EXCHANGE TRAILING STOP",
                "symbol": symbol,
                "amount": buyAmount.toString(),
                "price": buyPrice.toString()
                }
                ])

            NewExchangeOrderSocket.send(payload);

        NewExchangeOrderSocket.onmessage = function (event) {
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
                expect(data[2][7]).to.equal('Submitting exchange trailing stop buy order for '+buyAmount+' '+symbolFirst+'.')

                //Symbol
                expect(data[2][4][3]).to.equal(symbol)

                //MTS Update
                expect(data[2][4][5]).to.equal(data[2][4][4])

                //Amount
                expect(data[2][4][6]).to.equal(buyAmount)

                //Amount Orig
                expect(data[2][4][7]).to.equal(buyAmount)

                //Order Type
                expect(data[2][4][8]).to.equal('EXCHANGE TRAILING STOP')

                //Status
                expect(data[2][4][13]).to.equal('ACTIVE')

                //Price Trailing
                expect(data[2][4][18]).to.equal(buyPrice)

                } 

            // Target the on message [0,"on",[1187238101,null,1588148883485,"tBTCUSD",1588148883486,1588148883491,1,1,"EXCHANGE LIMIT",null,null,null,0,"ACTIVE",null,null,500,0,0,0,null,null,null,0,0,null,null,null,"BFX",null,null,null]   
            if(data[1] == 'on'){
                expect(data).to.not.be.null
                console.log(`on message:`,JSON.stringify(data))

                //Assert data against Schema
                SchemaAssertions.assertOrdersSchema(data[2])

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //Order ID
                expect(data[2][0]).to.be.a('number')

                //Symbol
                expect(data[2][3]).to.equal(symbol)

                //MTS Update
                expect(data[2][5]).to.be.greaterThan(data[2][4])

                //Amount
                expect(data[2][6]).to.equal(buyAmount)

                //Amount Orig
                expect(data[2][7]).to.equal(buyAmount)

                //Order Type
                expect(data[2][8]).to.equal('EXCHANGE TRAILING STOP')

                //Status
                expect(data[2][13]).to.contain('ACTIVE')

                //Price Trailing
                expect(data[2][18]).to.equal(buyPrice)
                
                done()
                }    
            }
        });

        it('New Exchange Trailing Stop Sell Order should return a correct Notification and Order Info message', function(done) {

        this.timeout(10000)

            let payload = JSON.stringify([
                0,
                "on",
                null,
                {
                "type": "EXCHANGE TRAILING STOP",
                "symbol": symbol,
                "amount": sellAmount.toString(),
                "price": buyPrice.toString()
                }
                ])

            NewExchangeOrderSocket.send(payload);

        NewExchangeOrderSocket.onmessage = function (event) {
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
                expect(data[2][7]).to.equal('Submitting exchange trailing stop sell order for '+sellAmount+' '+symbolFirst+'.')

                //Symbol
                expect(data[2][4][3]).to.equal(symbol)

                //MTS Update
                expect(data[2][4][5]).to.equal(data[2][4][4])

                //Amount
                expect(data[2][4][6]).to.equal(sellAmount)

                //Amount Orig
                expect(data[2][4][7]).to.equal(sellAmount)

                //Order Type
                expect(data[2][4][8]).to.equal('EXCHANGE TRAILING STOP')

                //Status
                expect(data[2][4][13]).to.equal('ACTIVE')

                //Price Trailing
                expect(data[2][4][18]).to.equal(buyPrice)

                } 

            // Target the on message [0,"on",[1187238101,null,1588148883485,"tBTCUSD",1588148883486,1588148883491,1,1,"EXCHANGE LIMIT",null,null,null,0,"ACTIVE",null,null,500,0,0,0,null,null,null,0,0,null,null,null,"BFX",null,null,null]   
            if(data[1] == 'on'){
                expect(data).to.not.be.null
                console.log(`on message:`,JSON.stringify(data))

                //Assert data against Schema
                SchemaAssertions.assertOrdersSchema(data[2])

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //Order ID
                expect(data[2][0]).to.be.a('number')

                //Symbol
                expect(data[2][3]).to.equal(symbol)

                //MTS Update
                expect(data[2][5]).to.be.greaterThan(data[2][4])

                //Amount
                expect(data[2][6]).to.equal(sellAmount)

                //Amount Orig
                expect(data[2][7]).to.equal(sellAmount)

                //Order Type
                expect(data[2][8]).to.equal('EXCHANGE TRAILING STOP')

                //Status
                expect(data[2][13]).to.contain('ACTIVE')

                //Price Trailing
                expect(data[2][18]).to.equal(buyPrice)
                
                done()
                }    
            }
        });

        it('New Exchange FOK Buy Order should return a correct Notification and Order Info message', function(done) {

        this.timeout(10000)

            let payload = JSON.stringify([
                0,
                "on",
                null,
                {
                "type": "EXCHANGE FOK",
                "symbol": symbol,
                "amount": buyAmount.toString(),
                "price": buyPrice.toString()
                }
                ])

            NewExchangeOrderSocket.send(payload);

        NewExchangeOrderSocket.onmessage = function (event) {
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
                expect(data[2][7]).to.equal('Submitting exchange fok buy order for '+buyAmount+' '+symbolFirst+'.')

                //Symbol
                expect(data[2][4][3]).to.equal(symbol)

                //MTS Update
                expect(data[2][4][5]).to.equal(data[2][4][4])

                //Amount
                expect(data[2][4][6]).to.equal(buyAmount)

                //Amount Orig
                expect(data[2][4][7]).to.equal(buyAmount)

                //Order Type
                expect(data[2][4][8]).to.equal('EXCHANGE FOK')

                //Status
                expect(data[2][4][13]).to.equal('ACTIVE')

                //Price
                expect(data[2][4][16]).to.equal(buyPrice)

                

                } 

            // Target the oc message [0,"oc",[1187238160,null,1588158739438,"tBTCUSD",1588158739438,1588158739444,0,0.001,"EXCHANGE MARKET",null,null,null,0,"EXECUTED @ 8150.0(0.001)",null,null,8150,8150,0,0,null,null,null,0,0,null,null,null,"BFX",null,null,null]]    
            if(data[1] == 'oc'){
                expect(data).to.not.be.null
                console.log(`oc message:`,JSON.stringify(data))

                //Assert data against Schema
                SchemaAssertions.assertOrdersSchema(data[2])

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //Order ID
                expect(data[2][0]).to.be.a('number')

                //Symbol
                expect(data[2][3]).to.equal(symbol)

                //MTS Update
                expect(data[2][5]).to.be.greaterThan(data[2][4])

                //Amount
                expect(data[2][6]).to.be.a('number')

                //Amount Orig
                expect(data[2][7]).to.equal(buyAmount)

                //Order Type
                expect(data[2][8]).to.equal('EXCHANGE FOK')

                //Status
                expect(data[2][13]).to.contain('FILLORKILL CANCELED')

                //Price
                expect(data[2][16]).to.equal(buyPrice)

                done()
                }    
            }
        });

        it('New Exchange FOK Sell Order should return a correct Notification and Order Info message', function(done) {

        this.timeout(10000)

            let payload = JSON.stringify([
                0,
                "on",
                null,
                {
                "type": "EXCHANGE FOK",
                "symbol": symbol,
                "amount": sellAmount.toString(),
                "price": sellPrice.toString()
                }
                ])

            NewExchangeOrderSocket.send(payload);

        NewExchangeOrderSocket.onmessage = function (event) {
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
                expect(data[2][7]).to.equal('Submitting exchange fok sell order for '+sellAmount+' '+symbolFirst+'.')

                //Symbol
                expect(data[2][4][3]).to.equal(symbol)

                //MTS Update
                expect(data[2][4][5]).to.equal(data[2][4][4])

                //Amount
                expect(data[2][4][6]).to.equal(sellAmount)

                //Amount Orig
                expect(data[2][4][7]).to.equal(sellAmount)

                //Order Type
                expect(data[2][4][8]).to.equal('EXCHANGE FOK')

                //Status
                expect(data[2][4][13]).to.equal('ACTIVE')

                //Price
                expect(data[2][4][16]).to.equal(sellPrice)
                

                } 

            // Target the oc message [0,"oc",[1187238160,null,1588158739438,"tBTCUSD",1588158739438,1588158739444,0,0.001,"EXCHANGE MARKET",null,null,null,0,"EXECUTED @ 8150.0(0.001)",null,null,8150,8150,0,0,null,null,null,0,0,null,null,null,"BFX",null,null,null]]    
            if(data[1] == 'oc'){
                expect(data).to.not.be.null
                console.log(`oc message:`,JSON.stringify(data))

                //Assert data against Schema
                SchemaAssertions.assertOrdersSchema(data[2])

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //Order ID
                expect(data[2][0]).to.be.a('number')

                //Symbol
                expect(data[2][3]).to.equal(symbol)

                //MTS Update
                expect(data[2][5]).to.be.greaterThan(data[2][4])

                //Amount Orig
                expect(data[2][7]).to.equal(sellAmount)

                //Order Type
                expect(data[2][8]).to.equal('EXCHANGE FOK')

                //Status
                expect(data[2][13]).to.contain('FILLORKILL CANCELED')

                //Price
                expect(data[2][16]).to.equal(sellPrice)

                done()
                }    
            }
        });

        it('New Exchange IOC Buy Order should return a correct Notification and Order Info message', function(done) {

        this.timeout(10000)

            let payload = JSON.stringify([
                0,
                "on",
                null,
                {
                "type": "EXCHANGE IOC",
                "symbol": symbol,
                "amount": buyAmount.toString(),
                "price": buyPrice.toString()
                }
                ])

            NewExchangeOrderSocket.send(payload);

        NewExchangeOrderSocket.onmessage = function (event) {
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
                expect(data[2][7]).to.equal('Submitting exchange ioc buy order for '+buyAmount+' '+symbolFirst+'.')

                //Symbol
                expect(data[2][4][3]).to.equal(symbol)

                //MTS Update
                expect(data[2][4][5]).to.equal(data[2][4][4])

                //Amount
                expect(data[2][4][6]).to.equal(buyAmount)

                //Amount Orig
                expect(data[2][4][7]).to.equal(buyAmount)

                //Order Type
                expect(data[2][4][8]).to.equal('EXCHANGE IOC')

                //Status
                expect(data[2][4][13]).to.equal('ACTIVE')

                //Price
                expect(data[2][4][16]).to.equal(buyPrice)

                

                } 

            // Target the oc message [0,"oc",[1187238160,null,1588158739438,"tBTCUSD",1588158739438,1588158739444,0,0.001,"EXCHANGE MARKET",null,null,null,0,"EXECUTED @ 8150.0(0.001)",null,null,8150,8150,0,0,null,null,null,0,0,null,null,null,"BFX",null,null,null]]    
            if(data[1] == 'oc'){
                expect(data).to.not.be.null
                console.log(`oc message:`,JSON.stringify(data))

                //Assert data against Schema
                SchemaAssertions.assertOrdersSchema(data[2])

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //Order ID
                expect(data[2][0]).to.be.a('number')

                //Symbol
                expect(data[2][3]).to.equal(symbol)

                //MTS Update
                expect(data[2][5]).to.be.greaterThan(data[2][4])

                //Amount
                expect(data[2][6]).to.be.a('number')

                //Amount Orig
                expect(data[2][7]).to.equal(buyAmount)

                //Order Type
                expect(data[2][8]).to.equal('EXCHANGE IOC')

                //Status
                expect(data[2][13]).to.contain('IOC CANCELED')

                //Price
                expect(data[2][16]).to.equal(buyPrice)

                done()
                }    
            }
        });

        it('New Exchange IOC Sell Order should return a correct Notification and Order Info message', function(done) {

        this.timeout(10000)

            let payload = JSON.stringify([
                0,
                "on",
                null,
                {
                "type": "EXCHANGE IOC",
                "symbol": symbol,
                "amount": sellAmount.toString(),
                "price": sellPrice.toString()
                }
                ])

            NewExchangeOrderSocket.send(payload);

        NewExchangeOrderSocket.onmessage = function (event) {
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
                expect(data[2][7]).to.equal('Submitting exchange ioc sell order for '+sellAmount+' '+symbolFirst+'.')

                //Symbol
                expect(data[2][4][3]).to.equal(symbol)

                //MTS Update
                expect(data[2][4][5]).to.equal(data[2][4][4])

                //Amount
                expect(data[2][4][6]).to.equal(sellAmount)

                //Amount Orig
                expect(data[2][4][7]).to.equal(sellAmount)

                //Order Type
                expect(data[2][4][8]).to.equal('EXCHANGE IOC')

                //Status
                expect(data[2][4][13]).to.equal('ACTIVE')

                //Price
                expect(data[2][4][16]).to.equal(sellPrice)

                

                } 

            // Target the oc message [0,"oc",[1187238160,null,1588158739438,"tBTCUSD",1588158739438,1588158739444,0,0.001,"EXCHANGE MARKET",null,null,null,0,"EXECUTED @ 8150.0(0.001)",null,null,8150,8150,0,0,null,null,null,0,0,null,null,null,"BFX",null,null,null]]    
            if(data[1] == 'oc'){
                expect(data).to.not.be.null
                console.log(`oc message:`,JSON.stringify(data))

                //Assert data against Schema
                SchemaAssertions.assertOrdersSchema(data[2])

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //Order ID
                expect(data[2][0]).to.be.a('number')

                //Symbol
                expect(data[2][3]).to.equal(symbol)

                //MTS Update
                expect(data[2][5]).to.be.greaterThan(data[2][4])

                //Amount
                expect(data[2][6]).to.be.a('number')

                //Amount Orig
                expect(data[2][7]).to.equal(sellAmount)

                //Order Type
                expect(data[2][8]).to.equal('EXCHANGE IOC')

                //Status
                expect(data[2][13]).to.contain('IOC CANCELED')

                //Price
                expect(data[2][16]).to.equal(sellPrice)

                done()
                }    
            }
        });

        it('Cancel multiple orders by ID should return a correct Notification and Order Cancel message', function(done) {

        this.timeout(10000)

            let payload = JSON.stringify([
                0,
                "oc_multi",
                null,
                {
                "id": [orderId, orderId2]
                }
                ])

            sleep(3000) //Wait for orders to be placed

            NewExchangeOrderSocket.send(payload);

        NewExchangeOrderSocket.onmessage = function (event) {
            let data = JSON.parse(event.data)
            
            // Target the n message [0,"n",[1588507557173,"oc_multi-req",null,null,[[1187252408,null,1588507556752,"tBTCUSD",1588507556752,1588507556752,0.001,0.001,"EXCHANGE STOP",null,null,null,0,"ACTIVE",null,null,20000,0,0,0,null,null,null,0,null,null,null,null,"API>BFX",null,null,null],[1187252409,null,1588507556793,"tBTCUSD",1588507556793,1588507556793,-0.001,-0.001,"EXCHANGE STOP",null,null,null,0,"ACTIVE",null,null,1,0,0,0,null,null,null,0,null,null,null,null,"API>BFX",null,null,null]],null,"SUCCESS","Submitting 2 order cancellations."]]         

            if(data[1] == 'n'){
                expect(data).to.not.be.null
                console.log(`n message:`,JSON.stringify(data))

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //MTS Timestamp of Notification
                expect(data[2][0]).to.be.a('number')

                //Type 
                expect(data[2][1]).to.equal('oc_multi-req')

                //Status
                expect(data[2][6]).to.equal('SUCCESS')

                //Text
                expect(data[2][7]).to.equal('Submitting 2 order cancellations.')

                //Order ID
                expect(data[2][4][0][0]).to.equal(orderId)

                //Order ID 2
                expect(data[2][4][1][0]).to.equal(orderId2)

                }

            // Target the oc message [0,"oc",[1187252704,null,1588509495021,"tBTCUSD",1588509495022,1588509498465,0.001,0.001,"EXCHANGE STOP",null,null,null,0,"CANCELED",null,null,20000,0,0,0,null,null,null,0,0,null,null,null,"API>BFX",null,null,null]]   
            if(data[1] == 'oc' && data[2][0] == orderId){
                expect(data).to.not.be.null
                console.log(`oc message:`,JSON.stringify(data))

                //Assert data against Schema
                SchemaAssertions.assertOrdersSchema(data[2])

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //Order ID
                expect(data[2][0]).to.equal(orderId)

                //Symbol
                expect(data[2][3]).to.equal(symbol)

                //MTS Update
                expect(data[2][5]).to.be.greaterThan(data[2][4])

                //Amount
                expect(data[2][6]).to.equal(buyAmount)

                //Amount Orig
                expect(data[2][7]).to.equal(buyAmount)

                //Order Type
                expect(data[2][8]).to.equal('EXCHANGE STOP')

                //Status
                expect(data[2][13]).to.equal('CANCELED')

                //Price
                expect(data[2][16]).to.equal(sellPrice)

                } 

            // Target the oc message [0,"oc",[1187252705,null,1588509495058,"tBTCUSD",1588509495058,1588509498467,-0.001,-0.001,"EXCHANGE STOP",null,null,null,0,"CANCELED",null,null,1,0,0,0,null,null,null,0,0,null,null,null,"API>BFX",null,null,null]]  
            if(data[1] == 'oc' && data[2][0] == orderId2){
                expect(data).to.not.be.null
                console.log(`oc message:`,JSON.stringify(data))

                //Assert data against Schema
                SchemaAssertions.assertOrdersSchema(data[2])

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //Order ID
                expect(data[2][0]).to.equal(orderId2)

                //Symbol
                expect(data[2][3]).to.equal(symbol)

                //MTS Update
                expect(data[2][5]).to.be.greaterThan(data[2][4])

                //Amount
                expect(data[2][6]).to.equal(sellAmount)

                //Amount Orig
                expect(data[2][7]).to.equal(sellAmount)

                //Order Type
                expect(data[2][8]).to.equal('EXCHANGE STOP')

                //Status
                expect(data[2][13]).to.equal('CANCELED')

                //Price
                expect(data[2][16]).to.equal(buyPrice)

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

            NewExchangeOrderSocket.send(payload);

        NewExchangeOrderSocket.onmessage = function (event) {
            let data = JSON.parse(event.data)
            
            // Target the n message [0,"n",[1588341920226,"oc_multi-req",null,null,[[1187248974,null,1588341908276,"tBTCUSD",1588341908277,1588341908284,1,1,"EXCHANGE LIMIT",null,null,null,0,"ACTIVE",null,null,1,0,0,0,null,null,null,0,0,null,null,null,"BFX",null,null,null],[1187248975,null,1588341909262,"tBTCUSD",1588341909262,1588341909266,1,1,"EXCHANGE LIMIT",null,null,null,0,"ACTIVE",null,null,1,0,0,0,null,null,null,0,0,null,null,null,"BFX",null,null,null]],null,"SUCCESS","Submitting 2 order cancellations."]]          

            if(data[1] == 'n'){
                expect(data).to.not.be.null
                NewExchangeOrderSocket.close()
                console.log(`n message:`,JSON.stringify(data))

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

                done()

                }    
            }
        });

    })
