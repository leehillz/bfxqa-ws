const WebSocket = require('ws');
const fs = require('fs');
const expect = require('chai').expect;
const ws_url = require('../config.json').ws_url
const crypto = require('crypto-js') // Standard JavaScript cryptography library
const apiKey = require('../config.json').api_key
const apiSecret = require('../config.json').api_secret
const SchemaAssertions = require("../Assertions/schema.js")

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
}

//Settings
const symbol = 'tBTCUSD'
const symbolFirst = symbol.substr(1,3)
const buyAmount = 0.0006 //min $5 USD equivalent
const sellAmount = -0.0006 //min $5 USD equivalent
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

describe('New Margin Order Tests (Tests "on" inputs and authenticated channels: "n", "on", "oc", "pn", "pu", "pc")', function() {
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
                console.log(`n message:`,JSON.stringify(data))

                //Assert data against Schema
                SchemaAssertions.assertOrdersSchema(data[2][4])

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //MTS Timestamp of Notification
                expect(data[2][0]).to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Type 
                expect(data[2][1]).to.equal('on-req')

                //Status
                expect(data[2][6]).to.equal('SUCCESS')

                //Text
                expect(data[2][7]).to.equal('Submitting limit buy order for '+buyAmount+' '+symbolFirst+'.')

                //Symbol
                expect(data[2][4][3]).to.equal(symbol)

                //Amount
                expect(data[2][4][6]).to.equal(buyAmount)

                //Amount Orig
                expect(data[2][4][7]).to.equal(buyAmount)

                //Order Type
                expect(data[2][4][8]).to.equal('LIMIT')

                //Status
                expect(data[2][4][13]).to.equal('ACTIVE')

                //Price
                expect(data[2][4][16]).to.equal(buyPrice)

                } 

            // Target the on message [0,"on",[1187238101,null,1588148883485,"tBTCUSD",1588148883486,1588148883491,1,1,"LIMIT",null,null,null,0,"ACTIVE",null,null,500,0,0,0,null,null,null,0,0,null,null,null,"BFX",null,null,null]
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
                expect(data[2][8]).to.equal('LIMIT')

                //Status
                expect(data[2][13]).to.equal('ACTIVE')

                //Price
                expect(data[2][16]).to.equal(buyPrice)
                
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
                console.log(`n message:`,JSON.stringify(data))

                //Assert data against Schema
                SchemaAssertions.assertOrdersSchema(data[2][4])

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //MTS Timestamp of Notification
                expect(data[2][0]).to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Type 
                expect(data[2][1]).to.equal('on-req')

                //Status
                expect(data[2][6]).to.equal('SUCCESS')

                //Text
                expect(data[2][7]).to.equal('Submitting limit sell order for '+sellAmount+' '+symbolFirst+'.')

                //Symbol
                expect(data[2][4][3]).to.equal(symbol)

                //Amount
                expect(data[2][4][6]).to.equal(sellAmount)

                //Amount Orig
                expect(data[2][4][7]).to.equal(sellAmount)

                //Order Type
                expect(data[2][4][8]).to.equal('LIMIT')

                //Status
                expect(data[2][4][13]).to.equal('ACTIVE')

                //Price
                expect(data[2][4][16]).to.equal(sellPrice)

                } 

            // Target the on message [0,"on",[1187238101,null,1588148883485,"tBTCUSD",1588148883486,1588148883491,1,1,"LIMIT",null,null,null,0,"ACTIVE",null,null,500,0,0,0,null,null,null,0,0,null,null,null,"BFX",null,null,null]
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
                expect(data[2][8]).to.equal('LIMIT')

                //Status
                expect(data[2][13]).to.equal('ACTIVE')

                //Price
                expect(data[2][16]).to.equal(sellPrice)
                
                
                done()
                }    
            }
        });

        it('New Market Buy Order should return a correct Notification, Order Info, Position New and Position Update message', function(done) {

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
                console.log(`n message:`,JSON.stringify(data))

                //Assert data against Schema
                SchemaAssertions.assertOrdersSchema(data[2][4])

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //MTS Timestamp of Notification
                expect(data[2][0]).to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Type 
                expect(data[2][1]).to.equal('on-req')

                //Status
                expect(data[2][6]).to.equal('SUCCESS')

                //Text
                expect(data[2][7]).to.equal('Submitting market buy order for '+buyAmount+' '+symbolFirst+'.')

                //Symbol
                expect(data[2][4][3]).to.equal(symbol)

                //Amount
                expect(data[2][4][6]).to.equal(buyAmount)

                //Amount Orig
                expect(data[2][4][7]).to.equal(buyAmount)

                //Order Type
                expect(data[2][4][8]).to.equal('MARKET')

                //Status
                expect(data[2][4][13]).to.equal('ACTIVE')

                } 

            // Target the oc message [0,"oc",[1187238160,null,1588158739438,"tBTCUSD",1588158739438,1588158739444,0,0.001,"MARKET",null,null,null,0,"EXECUTED @ 8150.0(0.001)",null,null,8150,8150,0,0,null,null,null,0,0,null,null,null,"BFX",null,null,null]]    
            if(data[1] == 'oc'){
                expect(data).to.not.be.null
                console.log(`oc message:`,JSON.stringify(data))

                //Assert data against Schema
                SchemaAssertions.assertOrdersSchema(data[2])

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //Symbol
                expect(data[2][3]).to.equal(symbol)

                //Amount Orig
                expect(data[2][7]).to.equal(buyAmount)

                //Order Type
                expect(data[2][8]).to.equal('MARKET')

                //Status
                expect(data[2][13]).to.contain('EXECUTED')
                
                }   

            // Target the pn message [0,"pn",["tBTCUSD","ACTIVE",0.001,7515,0,0,null,null,null,null,null,36444585,null,null,null,0,null,0,null,{"reason":"TRADE","order_id":1187239816,"order_id_oppo":1187239731,"liq_stage":null,"trade_price":"7515.0","trade_amount":"0.001"}]]   
            if(data[1] == 'pn'){
                expect(data).to.not.be.null
                console.log(`pn message:`,JSON.stringify(data))

                //Assert data against Schema
                SchemaAssertions.assertPositionsSchema(data[2])

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //Symbol
                expect(data[2][0]).to.equal(symbol)

                //Status
                expect(data[2][1]).to.equal('ACTIVE')

                //Amount
                expect(data[2][2]).to.equal(buyAmount)

                //Type
                expect(data[2][15]).to.equal(0)
                
                
                } 

            // Target the pu message [0,"pu",["tBTCUSD","ACTIVE",0.001,7515,0,0,-1.9025474000000002,-25.16699933466401,0.001515252188352619,2.4401324750166913e-7,null,36444585,null,null,null,0,null,0,0,{"reason":"TRADE","order_id":1187239816,"order_id_oppo":1187239731,"liq_stage":null,"trade_price":"7515.0","trade_amount":"0.001"}]]  
            if(data[1] == 'pu'){
                expect(data).to.not.be.null
                console.log(`pu message:`,JSON.stringify(data))

                //Assert data against Schema
                SchemaAssertions.assertPositionsSchema(data[2])

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //Symbol
                expect(data[2][0]).to.equal(symbol)

                //Status
                expect(data[2][1]).to.equal('ACTIVE')

                //Amount
                expect(data[2][2]).to.equal(buyAmount)

                //PL
                expect(data[2][6]).to.be.a('number')

                //PL Perc
                expect(data[2][7]).to.be.a('number')

                //Price Liq
                expect(data[2][8]).to.be.a('number')

                //Leverage
                expect(data[2][9]).to.be.a('number')

                //Position ID
                expect(data[2][11]).to.be.a('number')

                //Type
                expect(data[2][15]).to.equal(0)
                
                done()
                } 
            }
        });

        it('New Market Sell Order should return a correct Notification, Order Info and Position Close message', function(done) {

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
                console.log(`n message:`,JSON.stringify(data))

                //Assert data against Schema
                SchemaAssertions.assertOrdersSchema(data[2][4])

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //MTS Timestamp of Notification
                expect(data[2][0]).to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Type 
                expect(data[2][1]).to.equal('on-req')

                //Status
                expect(data[2][6]).to.equal('SUCCESS')

                //Text
                expect(data[2][7]).to.equal('Submitting market sell order for '+sellAmount+' '+symbolFirst+'.')

                //Symbol
                expect(data[2][4][3]).to.equal(symbol)

                //Amount
                expect(data[2][4][6]).to.equal(sellAmount)

                //Amount Orig
                expect(data[2][4][7]).to.equal(sellAmount)

                //Order Type
                expect(data[2][4][8]).to.equal('MARKET')

                //Status
                expect(data[2][4][13]).to.equal('ACTIVE')

                } 

            // Target the oc message [0,"oc",[1187238160,null,1588158739438,"tBTCUSD",1588158739438,1588158739444,0,0.001,"MARKET",null,null,null,0,"EXECUTED @ 8150.0(0.001)",null,null,8150,8150,0,0,null,null,null,0,0,null,null,null,"BFX",null,null,null]]    
            if(data[1] == 'oc'){
                expect(data).to.not.be.null
                console.log(`oc message:`,JSON.stringify(data))

                //Assert data against Schema
                SchemaAssertions.assertOrdersSchema(data[2])

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //Symbol
                expect(data[2][3]).to.equal(symbol)

                //Amount Orig
                expect(data[2][7]).to.equal(sellAmount)

                //Order Type
                expect(data[2][8]).to.equal('MARKET')

                //Status
                expect(data[2][13]).to.contain('EXECUTED')
                
                }    

            // Target the pc message [0,"pc",["tBTCUSD","CLOSED",0,7515,0,0,null,null,null,null,null,36444585,null,null,null,0,null,0,null,{"reason":"TRADE","order_id":1187239817,"order_id_oppo":1187239934,"liq_stage":null,"trade_price":"5623.71656244","trade_amount":"-0.001"}]]  
            if(data[1] == 'pc'){
                expect(data).to.not.be.null
                console.log(`pc message:`,JSON.stringify(data))

                //Assert data against Schema
                SchemaAssertions.assertPositionsSchema(data[2])

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //Symbol
                expect(data[2][0]).to.equal(symbol)

                //Status
                expect(data[2][1]).to.equal('CLOSED')

                //Amount
                expect(data[2][2]).to.equal(0)

                //Type
                expect(data[2][15]).to.equal(0)
                
                
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
                console.log(`n message:`,JSON.stringify(data))

                //Assert data against Schema
                SchemaAssertions.assertOrdersSchema(data[2][4])

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //MTS Timestamp of Notification
                expect(data[2][0]).to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Type 
                expect(data[2][1]).to.equal('on-req')

                //Status
                expect(data[2][6]).to.equal('SUCCESS')

                //Text
                expect(data[2][7]).to.equal('Submitting stop buy order for '+buyAmount+' '+symbolFirst+'.')

                //Symbol
                expect(data[2][4][3]).to.equal(symbol)

                //Amount
                expect(data[2][4][6]).to.equal(buyAmount)

                //Amount Orig
                expect(data[2][4][7]).to.equal(buyAmount)

                //Order Type
                expect(data[2][4][8]).to.equal('STOP')

                //Status
                expect(data[2][4][13]).to.equal('ACTIVE')

                //Price
                expect(data[2][4][16]).to.equal(sellPrice)

                } 

            // Target the on message [0,"on",[1187238101,null,1588148883485,"tBTCUSD",1588148883486,1588148883491,1,1,"LIMIT",null,null,null,0,"ACTIVE",null,null,500,0,0,0,null,null,null,0,0,null,null,null,"BFX",null,null,null]   
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
                expect(data[2][8]).to.equal('STOP')

                //Status
                expect(data[2][13]).to.contain('ACTIVE')

                //Price
                expect(data[2][16]).to.equal(sellPrice)
                
                
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
                console.log(`n message:`,JSON.stringify(data))

                //Assert data against Schema
                SchemaAssertions.assertOrdersSchema(data[2][4])

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //MTS Timestamp of Notification
                expect(data[2][0]).to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Type 
                expect(data[2][1]).to.equal('on-req')

                //Status
                expect(data[2][6]).to.equal('SUCCESS')

                //Text
                expect(data[2][7]).to.equal('Submitting stop sell order for '+sellAmount+' '+symbolFirst+'.')

                //Symbol
                expect(data[2][4][3]).to.equal(symbol)

                //Amount
                expect(data[2][4][6]).to.equal(sellAmount)

                //Amount Orig
                expect(data[2][4][7]).to.equal(sellAmount)

                //Order Type
                expect(data[2][4][8]).to.equal('STOP')

                //Status
                expect(data[2][4][13]).to.equal('ACTIVE')

                //Price
                expect(data[2][4][16]).to.equal(buyPrice)

                } 

            // Target the on message [0,"on",[1187238101,null,1588148883485,"tBTCUSD",1588148883486,1588148883491,1,1,"LIMIT",null,null,null,0,"ACTIVE",null,null,500,0,0,0,null,null,null,0,0,null,null,null,"BFX",null,null,null]   
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
                expect(data[2][8]).to.equal('STOP')

                //Status
                expect(data[2][13]).to.contain('ACTIVE')

                //Price
                expect(data[2][16]).to.equal(buyPrice)
                
                
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
                console.log(`n message:`,JSON.stringify(data))

                //Assert data against Schema
                SchemaAssertions.assertOrdersSchema(data[2][4])

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //MTS Timestamp of Notification
                expect(data[2][0]).to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Type 
                expect(data[2][1]).to.equal('on-req')

                //Status
                expect(data[2][6]).to.equal('SUCCESS')

                //Text
                expect(data[2][7]).to.equal('Submitting stop limit buy order for '+buyAmount+' '+symbolFirst+'.')

                //Symbol
                expect(data[2][4][3]).to.equal(symbol)

                //Amount
                expect(data[2][4][6]).to.equal(buyAmount)

                //Amount Orig
                expect(data[2][4][7]).to.equal(buyAmount)

                //Order Type
                expect(data[2][4][8]).to.equal('STOP LIMIT')

                //Status
                expect(data[2][4][13]).to.equal('ACTIVE')

                //Price
                expect(data[2][4][16]).to.equal(sellPrice)

                //Price Aux Limit
                expect(data[2][4][19]).to.equal(buyPrice)

                } 

            // Target the on message [0,"on",[1187238101,null,1588148883485,"tBTCUSD",1588148883486,1588148883491,1,1,"LIMIT",null,null,null,0,"ACTIVE",null,null,500,0,0,0,null,null,null,0,0,null,null,null,"BFX",null,null,null]   
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
                expect(data[2][8]).to.equal('STOP LIMIT')

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
                console.log(`n message:`,JSON.stringify(data))

                //Assert data against Schema
                SchemaAssertions.assertOrdersSchema(data[2][4])

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //MTS Timestamp of Notification
                expect(data[2][0]).to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Type 
                expect(data[2][1]).to.equal('on-req')

                //Status
                expect(data[2][6]).to.equal('SUCCESS')

                //Text
                expect(data[2][7]).to.equal('Submitting stop limit sell order for '+sellAmount+' '+symbolFirst+'.')

                //Symbol
                expect(data[2][4][3]).to.equal(symbol)

                //Amount
                expect(data[2][4][6]).to.equal(sellAmount)

                //Amount Orig
                expect(data[2][4][7]).to.equal(sellAmount)

                //Order Type
                expect(data[2][4][8]).to.equal('STOP LIMIT')

                //Status
                expect(data[2][4][13]).to.equal('ACTIVE')

                //Price
                expect(data[2][4][16]).to.equal(buyPrice)

                //Price Aux Limit
                expect(data[2][4][19]).to.equal(sellPrice)

                } 

            // Target the on message [0,"on",[1187238101,null,1588148883485,"tBTCUSD",1588148883486,1588148883491,1,1,"LIMIT",null,null,null,0,"ACTIVE",null,null,500,0,0,0,null,null,null,0,0,null,null,null,"BFX",null,null,null]   
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
                expect(data[2][8]).to.equal('STOP LIMIT')

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
                console.log(`n message:`,JSON.stringify(data))

                //Assert data against Schema
                SchemaAssertions.assertOrdersSchema(data[2][4])

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //MTS Timestamp of Notification
                expect(data[2][0]).to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Type 
                expect(data[2][1]).to.equal('on-req')

                //Status
                expect(data[2][6]).to.equal('SUCCESS')

                //Text
                expect(data[2][7]).to.equal('Submitting trailing stop buy order for '+buyAmount+' '+symbolFirst+'.')

                //Symbol
                expect(data[2][4][3]).to.equal(symbol)

                //Amount
                expect(data[2][4][6]).to.equal(buyAmount)

                //Amount Orig
                expect(data[2][4][7]).to.equal(buyAmount)

                //Order Type
                expect(data[2][4][8]).to.equal('TRAILING STOP')

                //Status
                expect(data[2][4][13]).to.equal('ACTIVE')

                //Price Trailing
                expect(data[2][4][18]).to.equal(buyPrice)

                } 

            // Target the on message [0,"on",[1187238101,null,1588148883485,"tBTCUSD",1588148883486,1588148883491,1,1,"LIMIT",null,null,null,0,"ACTIVE",null,null,500,0,0,0,null,null,null,0,0,null,null,null,"BFX",null,null,null]   
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
                expect(data[2][8]).to.equal('TRAILING STOP')

                //Status
                expect(data[2][13]).to.contain('ACTIVE')

                //Price Trailing
                expect(data[2][18]).to.equal(buyPrice)
                
                
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
                console.log(`n message:`,JSON.stringify(data))

                //Assert data against Schema
                SchemaAssertions.assertOrdersSchema(data[2][4])

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //MTS Timestamp of Notification
                expect(data[2][0]).to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Type 
                expect(data[2][1]).to.equal('on-req')

                //Status
                expect(data[2][6]).to.equal('SUCCESS')

                //Text
                expect(data[2][7]).to.equal('Submitting trailing stop sell order for '+sellAmount+' '+symbolFirst+'.')

                //Symbol
                expect(data[2][4][3]).to.equal(symbol)

                //Amount
                expect(data[2][4][6]).to.equal(sellAmount)

                //Amount Orig
                expect(data[2][4][7]).to.equal(sellAmount)

                //Order Type
                expect(data[2][4][8]).to.equal('TRAILING STOP')

                //Status
                expect(data[2][4][13]).to.equal('ACTIVE')

                //Price Trailing
                expect(data[2][4][18]).to.equal(buyPrice)

                } 

            // Target the on message [0,"on",[1187238101,null,1588148883485,"tBTCUSD",1588148883486,1588148883491,1,1,"LIMIT",null,null,null,0,"ACTIVE",null,null,500,0,0,0,null,null,null,0,0,null,null,null,"BFX",null,null,null]   
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
                expect(data[2][8]).to.equal('TRAILING STOP')

                //Status
                expect(data[2][13]).to.contain('ACTIVE')

                //Price Trailing
                expect(data[2][18]).to.equal(buyPrice)
                
                
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
                console.log(`n message:`,JSON.stringify(data))

                //Assert data against Schema
                SchemaAssertions.assertOrdersSchema(data[2][4])

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //MTS Timestamp of Notification
                expect(data[2][0]).to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Type 
                expect(data[2][1]).to.equal('on-req')

                //Status
                expect(data[2][6]).to.equal('SUCCESS')

                //Text
                expect(data[2][7]).to.equal('Submitting fok buy order for '+buyAmount+' '+symbolFirst+'.')

                //Symbol
                expect(data[2][4][3]).to.equal(symbol)

                //Amount
                expect(data[2][4][6]).to.equal(buyAmount)

                //Amount Orig
                expect(data[2][4][7]).to.equal(buyAmount)

                //Order Type
                expect(data[2][4][8]).to.equal('FOK')

                //Status
                expect(data[2][4][13]).to.equal('ACTIVE')

                //Price
                expect(data[2][4][16]).to.equal(buyPrice)

                } 

            // Target the oc message [0,"oc",[1187238160,null,1588158739438,"tBTCUSD",1588158739438,1588158739444,0,0.001,"MARKET",null,null,null,0,"EXECUTED @ 8150.0(0.001)",null,null,8150,8150,0,0,null,null,null,0,0,null,null,null,"BFX",null,null,null]]    
            if(data[1] == 'oc'){
                expect(data).to.not.be.null
                console.log(`oc message:`,JSON.stringify(data))

                //Assert data against Schema
                SchemaAssertions.assertOrdersSchema(data[2])

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //Symbol
                expect(data[2][3]).to.equal(symbol)

                //Amount Orig
                expect(data[2][7]).to.equal(buyAmount)

                //Order Type
                expect(data[2][8]).to.equal('FOK')

                //Status
                expect(data[2][13]).to.contain('FILLORKILL CANCELED')

                //Price
                expect(data[2][16]).to.equal(buyPrice)
                
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
                console.log(`n message:`,JSON.stringify(data))

                //Assert data against Schema
                SchemaAssertions.assertOrdersSchema(data[2][4])

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //MTS Timestamp of Notification
                expect(data[2][0]).to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Type 
                expect(data[2][1]).to.equal('on-req')

                //Status
                expect(data[2][6]).to.equal('SUCCESS')

                //Text
                expect(data[2][7]).to.equal('Submitting fok sell order for '+sellAmount+' '+symbolFirst+'.')

                //Symbol
                expect(data[2][4][3]).to.equal(symbol)

                //Amount
                expect(data[2][4][6]).to.equal(sellAmount)

                //Amount Orig
                expect(data[2][4][7]).to.equal(sellAmount)

                //Order Type
                expect(data[2][4][8]).to.equal('FOK')

                //Status
                expect(data[2][4][13]).to.equal('ACTIVE')

                //Price
                expect(data[2][4][16]).to.equal(sellPrice)

                } 

            // Target the oc message [0,"oc",[1187238160,null,1588158739438,"tBTCUSD",1588158739438,1588158739444,0,0.001,"MARKET",null,null,null,0,"EXECUTED @ 8150.0(0.001)",null,null,8150,8150,0,0,null,null,null,0,0,null,null,null,"BFX",null,null,null]]    
            if(data[1] == 'oc'){
                expect(data).to.not.be.null
                console.log(`oc message:`,JSON.stringify(data))

                //Assert data against Schema
                SchemaAssertions.assertOrdersSchema(data[2])

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //Symbol
                expect(data[2][3]).to.equal(symbol)

                //Amount Orig
                expect(data[2][7]).to.equal(sellAmount)

                //Order Type
                expect(data[2][8]).to.equal('FOK')

                //Status
                expect(data[2][13]).to.contain('FILLORKILL CANCELED')

                //Price
                expect(data[2][16]).to.equal(sellPrice)
                
                
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
                console.log(`n message:`,JSON.stringify(data))

                //Assert data against Schema
                SchemaAssertions.assertOrdersSchema(data[2][4])

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //MTS Timestamp of Notification
                expect(data[2][0]).to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Type 
                expect(data[2][1]).to.equal('on-req')

                //Status
                expect(data[2][6]).to.equal('SUCCESS')

                //Text
                expect(data[2][7]).to.equal('Submitting ioc buy order for '+buyAmount+' '+symbolFirst+'.')

                //Symbol
                expect(data[2][4][3]).to.equal(symbol)

                //Amount
                expect(data[2][4][6]).to.equal(buyAmount)

                //Amount Orig
                expect(data[2][4][7]).to.equal(buyAmount)

                //Order Type
                expect(data[2][4][8]).to.equal('IOC')

                //Status
                expect(data[2][4][13]).to.equal('ACTIVE')

                //Price
                expect(data[2][4][16]).to.equal(buyPrice)

                } 

            // Target the oc message [0,"oc",[1187238160,null,1588158739438,"tBTCUSD",1588158739438,1588158739444,0,0.001,"MARKET",null,null,null,0,"EXECUTED @ 8150.0(0.001)",null,null,8150,8150,0,0,null,null,null,0,0,null,null,null,"BFX",null,null,null]]    
            if(data[1] == 'oc'){
                expect(data).to.not.be.null
                console.log(`oc message:`,JSON.stringify(data))

                //Assert data against Schema
                SchemaAssertions.assertOrdersSchema(data[2])

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //Symbol
                expect(data[2][3]).to.equal(symbol)

                //Amount Orig
                expect(data[2][7]).to.equal(buyAmount)

                //Order Type
                expect(data[2][8]).to.equal('IOC')

                //Status
                expect(data[2][13]).to.contain('IOC CANCELED')

                //Price
                expect(data[2][16]).to.equal(buyPrice)
                
                
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
                console.log(`n message:`,JSON.stringify(data))

                //Assert data against Schema
                SchemaAssertions.assertOrdersSchema(data[2][4])

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //MTS Timestamp of Notification
                expect(data[2][0]).to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Type 
                expect(data[2][1]).to.equal('on-req')

                //Status
                expect(data[2][6]).to.equal('SUCCESS')

                //Text
                expect(data[2][7]).to.equal('Submitting ioc sell order for '+sellAmount+' '+symbolFirst+'.')

                //Symbol
                expect(data[2][4][3]).to.equal(symbol)

                //Amount
                expect(data[2][4][6]).to.equal(sellAmount)

                //Amount Orig
                expect(data[2][4][7]).to.equal(sellAmount)

                //Order Type
                expect(data[2][4][8]).to.equal('IOC')

                //Status
                expect(data[2][4][13]).to.equal('ACTIVE')

                //Price
                expect(data[2][4][16]).to.equal(sellPrice)

                } 

            // Target the oc message [0,"oc",[1187238160,null,1588158739438,"tBTCUSD",1588158739438,1588158739444,0,0.001,"MARKET",null,null,null,0,"EXECUTED @ 8150.0(0.001)",null,null,8150,8150,0,0,null,null,null,0,0,null,null,null,"BFX",null,null,null]]    
            if(data[1] == 'oc'){
                expect(data).to.not.be.null
                console.log(`oc message:`,JSON.stringify(data))

                //Assert data against Schema
                SchemaAssertions.assertOrdersSchema(data[2])

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //Symbol
                expect(data[2][3]).to.equal(symbol)

                //Amount Orig
                expect(data[2][7]).to.equal(sellAmount)

                //Order Type
                expect(data[2][8]).to.equal('IOC')

                //Status
                expect(data[2][13]).to.contain('IOC CANCELED')

                //Price
                expect(data[2][16]).to.equal(sellPrice)
                
                
                done()
                }    
            }
        });

        it('Open a Margin Position to be used for the next tests', function(done) {

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
                console.log(`n message:`,JSON.stringify(data))

                //Assert data against Schema
                SchemaAssertions.assertOrdersSchema(data[2][4])

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //MTS Timestamp of Notification
                expect(data[2][0]).to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Type 
                expect(data[2][1]).to.equal('on-req')

                //Status
                expect(data[2][6]).to.equal('SUCCESS')

                //Text
                expect(data[2][7]).to.equal('Submitting market buy order for '+buyAmount+' '+symbolFirst+'.')

                //Symbol
                expect(data[2][4][3]).to.equal(symbol)

                //Amount
                expect(data[2][4][6]).to.equal(buyAmount)

                //Amount Orig
                expect(data[2][4][7]).to.equal(buyAmount)

                //Order Type
                expect(data[2][4][8]).to.equal('MARKET')

                //Status
                expect(data[2][4][13]).to.equal('ACTIVE')

                } 

            // Target the oc message [0,"oc",[1187238160,null,1588158739438,"tBTCUSD",1588158739438,1588158739444,0,0.001,"MARKET",null,null,null,0,"EXECUTED @ 8150.0(0.001)",null,null,8150,8150,0,0,null,null,null,0,0,null,null,null,"BFX",null,null,null]]    
            if(data[1] == 'oc'){
                expect(data).to.not.be.null
                console.log(`oc message:`,JSON.stringify(data))

                //Assert data against Schema
                SchemaAssertions.assertOrdersSchema(data[2])

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //Symbol
                expect(data[2][3]).to.equal(symbol)

                //Amount Orig
                expect(data[2][7]).to.equal(buyAmount)

                //Order Type
                expect(data[2][8]).to.equal('MARKET')

                //Status
                expect(data[2][13]).to.contain('EXECUTED')

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

            NewMarginOrderSocket.send(payload);

        NewMarginOrderSocket.onmessage = function (event) {
            let data = JSON.parse(event.data)
            
            // Target the n message [0,"n",[1588340197655,"on-req",null,null,[null,null,null,"tBTCUSD",null,null,0.001,null,"LIMIT",null,null,null,1024,null,null,null,1,null,0,0,null,null,null,0,null,null,null,null,null,null,null,null],null,"ERROR","direction: invalid"]]        
            if(data[1] == 'n'){
                expect(data).to.not.be.null
                console.log(`n message:`,JSON.stringify(data))

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //MTS Timestamp of Notification
                expect(data[2][0]).to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Type 
                expect(data[2][1]).to.equal('on-req')

                //Status
                expect(data[2][6]).to.equal('ERROR')

                //Text
                expect(data[2][7]).to.equal('direction: invalid')

                //Order ID
                expect(data[2][4][0]).to.be.null

                //GID
                expect(data[2][4][1]).to.be.null

                //CID
                expect(data[2][4][2]).to.be.null

                //Symbol
                expect(data[2][4][3]).to.equal(symbol)

                //MTS Create
                expect(data[2][4][4]).to.be.null

                //MTS Update
                expect(data[2][4][5]).to.be.null

                //Amount
                expect(data[2][4][6]).to.equal(buyAmount)

                //Amount Orig
                expect(data[2][4][7]).to.be.null

                //Order Type
                expect(data[2][4][8]).to.equal('LIMIT')

                //Order Type Previous
                expect(data[2][4][9]).to.be.null

                //MTS TIF
                expect(data[2][4][10]).to.be.null

                //Placeholder
                expect(data[2][4][11]).to.be.null

                //Flags
                expect(data[2][4][12]).to.equal(1024)

                //Status
                expect(data[2][4][13]).to.be.null

                //Price
                expect(data[2][4][16]).to.equal(buyPrice)

                //Price Average
                expect(data[2][4][17]).to.be.null

                //Price Trailing
                expect(data[2][4][18]).to.equal(0)

                //Placeholder
                expect(data[2][4][20]).to.be.null

                //Placeholder
                expect(data[2][4][21]).to.be.null

                //Placeholder
                expect(data[2][4][22]).to.be.null

                //Notify
                expect(data[2][4][23]).to.equal(0)

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

            NewMarginOrderSocket.send(payload);

        NewMarginOrderSocket.onmessage = function (event) {
            let data = JSON.parse(event.data)
            
            // Target the n message [0,"n",[1588148817.151,"on-req",null,null,[1187238099,null,1588148817151,"tBTCUSD",1588148817151,1588148817151,1,1,"LIMIT",null,null,null,0,"ACTIVE",null,null,500,0,0,0,null,null,null,0,null,null,null,null,"BFX",null,null,null],null,"SUCCESS","Submitting limit buy order for 1 BTC."]]]        

            if(data[1] == 'n'){
                expect(data).to.not.be.null
                console.log(`n message:`,JSON.stringify(data))

                //Assert data against Schema
                SchemaAssertions.assertOrdersSchema(data[2][4])

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //MTS Timestamp of Notification
                expect(data[2][0]).to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Type 
                expect(data[2][1]).to.equal('on-req')

                //Status
                expect(data[2][6]).to.equal('SUCCESS')

                //Text
                expect(data[2][7]).to.equal('Submitting limit sell order for '+sellAmount+' '+symbolFirst+'.')

                //Symbol
                expect(data[2][4][3]).to.equal(symbol)

                //Amount
                expect(data[2][4][6]).to.equal(sellAmount)

                //Amount Orig
                expect(data[2][4][7]).to.equal(sellAmount)

                //Order Type
                expect(data[2][4][8]).to.equal('LIMIT')

                //Flags
                expect(data[2][4][12]).to.equal(1024)

                //Status
                expect(data[2][4][13]).to.equal('ACTIVE')

                //Price
                expect(data[2][4][16]).to.equal(sellPrice)

                } 

            // Target the on message [0,"on",[1187238101,null,1588148883485,"tBTCUSD",1588148883486,1588148883491,1,1,"LIMIT",null,null,null,0,"ACTIVE",null,null,500,0,0,0,null,null,null,0,0,null,null,null,"BFX",null,null,null]
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
                expect(data[2][8]).to.equal('LIMIT')

                //Flags
                expect(data[2][12]).to.equal(1024)

                //Status
                expect(data[2][13]).to.equal('ACTIVE')

                //Price
                expect(data[2][16]).to.equal(sellPrice)
                
                
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

            NewMarginOrderSocket.send(payload);

        NewMarginOrderSocket.onmessage = function (event) {
            let data = JSON.parse(event.data)
            
            // Target the n message [0,"n",[1588148817.151,"on-req",null,null,[1187238099,null,1588148817151,"tBTCUSD",1588148817151,1588148817151,1,1,"LIMIT",null,null,null,0,"ACTIVE",null,null,500,0,0,0,null,null,null,0,null,null,null,null,"BFX",null,null,null],null,"SUCCESS","Submitting limit buy order for 1 BTC."]]]        

            if(data[1] == 'n'){
                expect(data).to.not.be.null
                console.log(`n message:`,JSON.stringify(data))

                //Assert data against Schema
                SchemaAssertions.assertOrdersSchema(data[2][4])

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //MTS Timestamp of Notification
                expect(data[2][0]).to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Type 
                expect(data[2][1]).to.equal('on-req')

                //Status
                expect(data[2][6]).to.equal('SUCCESS')

                //Text
                expect(data[2][7]).to.equal('Submitting market sell order for -0.001 '+symbolFirst+'.')

                //Symbol
                expect(data[2][4][3]).to.equal(symbol)

                //Amount
                expect(data[2][4][6]).to.equal(-0.001)

                //Amount Orig
                expect(data[2][4][7]).to.equal(-0.001)

                //Order Type
                expect(data[2][4][8]).to.equal('MARKET')

                //Flags
                expect(data[2][4][12]).to.equal(512)

                //Status
                expect(data[2][4][13]).to.equal('ACTIVE (note:POSCLOSE)')

                } 

            // Target the oc message [0,"oc",[1187238160,null,1588158739438,"tBTCUSD",1588158739438,1588158739444,0,0.001,"MARKET",null,null,null,0,"EXECUTED @ 8150.0(0.001)",null,null,8150,8150,0,0,null,null,null,0,0,null,null,null,"BFX",null,null,null]]    
            if(data[1] == 'oc'){
                expect(data).to.not.be.null
                console.log(`oc message:`,JSON.stringify(data))

                //Assert data against Schema
                SchemaAssertions.assertOrdersSchema(data[2])

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //Symbol
                expect(data[2][3]).to.equal(symbol)

                //Amount Orig
                expect(data[2][7]).to.equal(sellAmount)

                //Order Type
                expect(data[2][8]).to.equal('MARKET')

                //Flags
                expect(data[2][12]).to.equal(512)

                //Status
                expect(data[2][13]).to.contain('EXECUTED')
                
                }    

            // Target the pc message [0,"pc",["tBTCUSD","CLOSED",0,7515,0,0,null,null,null,null,null,36444585,null,null,null,0,null,0,null,{"reason":"TRADE","order_id":1187239817,"order_id_oppo":1187239934,"liq_stage":null,"trade_price":"5623.71656244","trade_amount":"-0.001"}]]  
            if(data[1] == 'pc'){
                expect(data).to.not.be.null
                console.log(`pc message:`,JSON.stringify(data))

                //Assert data against Schema
                SchemaAssertions.assertPositionsSchema(data[2])

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //Symbol
                expect(data[2][0]).to.equal(symbol)

                //Status
                expect(data[2][1]).to.equal('CLOSED')

                //Amount
                expect(data[2][2]).to.equal(0)

                //Type
                expect(data[2][15]).to.equal(0)
                
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

            NewMarginOrderSocket.send(payload);

        NewMarginOrderSocket.onmessage = function (event) {
            let data = JSON.parse(event.data)
            
            // Target the n message [0,"n",[1588341920226,"oc_multi-req",null,null,[[1187248974,null,1588341908276,"tBTCUSD",1588341908277,1588341908284,1,1,"EXCHANGE LIMIT",null,null,null,0,"ACTIVE",null,null,1,0,0,0,null,null,null,0,0,null,null,null,"BFX",null,null,null],[1187248975,null,1588341909262,"tBTCUSD",1588341909262,1588341909266,1,1,"EXCHANGE LIMIT",null,null,null,0,"ACTIVE",null,null,1,0,0,0,null,null,null,0,0,null,null,null,"BFX",null,null,null]],null,"SUCCESS","Submitting 2 order cancellations."]]          

            if(data[1] == 'n'){
                expect(data).to.not.be.null
                NewMarginOrderSocket.close()
                console.log(`n message:`,JSON.stringify(data))

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //MTS Timestamp of Notification
                expect(data[2][0]).to.match(/[0-9]+[.]{0,1}[0-9]*/)

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
