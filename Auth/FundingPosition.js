const WebSocket = require('ws');
const fs = require('fs');
const expect = require('chai').expect;
const request = require('request');
const ws_url = require('../config.json').ws_url
const crypto = require('crypto-js') // Standard JavaScript cryptography library
const apiKey = require('../config.json').api_key
const apiSecret = require('../config.json').api_secret
const restUrl = require('../config.json').rest_url
const SchemaAssertions = require("../Assertions/schema.js")

//Auth
const FundingPositionSocket = new WebSocket(ws_url);
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
const fundingSymbolFirst = 'f'+symbol.substr(1,3)
const fundingSymbolSecond = 'f'+symbol.substr(4,6)
const buyAmount = 0.01 //min $50 USD equivalent
const sellAmount = (buyAmount*-1)*2

//Sleep timer
function sleep(milliseconds) {
  const date = Date.now();
  let currentDate = null;
  do {
    currentDate = Date.now();
  } while (currentDate - date < milliseconds);
}

describe('New Funding Position Tests (Tests "on" inputs and authenticated channels: "n", "on", "oc", "pn", "pc", "fcn", "fcu", "fcc")', function() {

        let takenFunding

        it('New Margin Position should take correct funding', function(done) {

        this.timeout(1000000)

        FundingPositionSocket.onopen = function (event) {
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
            FundingPositionSocket.send(JSON.stringify(payloadAuth))
            sleep(1000);
            FundingPositionSocket.send(payload);
          };

        FundingPositionSocket.onmessage = function (event) {
            let data = JSON.parse(event.data)
            
            // Target the n message [0,"n",[1588148817.151,"on-req",null,null,[1187238099,null,1588148817151,"tBTCUSD",1588148817151,1588148817151,1,1,"LIMIT",null,null,null,0,"ACTIVE",null,null,500,0,0,0,null,null,null,0,null,null,null,null,"BFX",null,null,null],null,"SUCCESS","Submitting limit buy order for 1 BTC."]]]        

            if(data[1] == 'n'){
                expect(data).to.not.be.null
                console.log(`NOTE: This test takes a long time to run as it has to wait to take funding`)
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

                console.log(`Waiting for Funding to be Taken, can take up to 15 minutes...`)
                
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

            // Target the fcn message [0,"fcn",[26229850,"fUSD",-1,1588755061000,1588755061000,930.48726,0,"ACTIVE","FIXED",null,null,0.000944,14,1588755061000,null,null,0,null,0,null,0,"tBTCUSD"]] 
            if(data[1] == 'fcn' && data[2][1] == fundingSymbolSecond){
                expect(data).to.not.be.null
                console.log(`fcn message:`,JSON.stringify(data))

                takenFunding = data[2][0]

                //Assert data against Schema
                SchemaAssertions.assertFundingCreditsSchema(data[2])

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //Symbol
                expect(data[2][1]).to.equal(fundingSymbolSecond)

                //Side
                expect(data[2][2]).to.equal(-1)

                //Status
                expect(data[2][7]).to.equal('ACTIVE')

                //Type
                expect(data[2][8]).to.equal('FIXED')

                //No Close
                expect(data[2][20]).to.equal(0)

                //Position Pair
                expect(data[2][21]).to.equal(symbol)

                done()
                
                }
            }
        });

        it('Set Funding Keep to ON should return a correct Funding Credit Update message', function(done) {

        this.timeout(10000)

            //Keep Taking Funding
            let body = {"type":"credit","id":takenFunding}
            let apiPath = 'v2/auth/w/funding/keep'
            let signature = `/api/${apiPath}${authNonce}${JSON.stringify(body)}` // Consists of the complete url, nonce, and request body
            const sig = crypto.HmacSHA384(signature, apiSecret).toString() // The authentication signature is hashed using the private key

            const keepFunding = {
              url: `${restUrl}${apiPath}`,
              headers: {
                'bfx-nonce': authNonce,
                'bfx-apikey': apiKey,
                'bfx-signature': sig
              },
              body: body,
              json: true
            }


            request.post(keepFunding, (error, response, body) => {
              console.log(`Keep Funding Body:`,body); // Logs the response body
            })

        FundingPositionSocket.onmessage = function (event) {
            let data = JSON.parse(event.data)
            
            // Target the fcu message [0,"fcu",[26229850,"fUSD",-1,1588755061000,1588755074000,930.48726,0,"ACTIVE","FIXED",null,null,0.000944,14,1588755061000,null,null,0,null,0,null,1,"tBTCUSD"]] 
            if(data[1] == 'fcu'){
                expect(data).to.not.be.null
                console.log(`fcu message:`,JSON.stringify(data))

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)
                takenFunding = data[2][0]

                //Symbol
                expect(data[2][1]).to.equal(fundingSymbolSecond)

                //Side
                expect(data[2][2]).to.equal(-1)

                //Status
                expect(data[2][7]).to.equal('ACTIVE')

                //Type
                expect(data[2][8]).to.equal('FIXED')

                //No Close
                expect(data[2][20]).to.equal(1)

                //Position Pair
                expect(data[2][21]).to.equal(symbol)

                done()
                
                }
            }
    
        });

        it('Set Funding Keep to OFF should return a correct Funding Credit Update message', function(done) {

        this.timeout(10000)

            //Keep Taking Funding
            let body = {"type":"credit","id":takenFunding}
            let apiPath = 'v2/auth/w/funding/keep'
            let signature = `/api/${apiPath}${authNonce}${JSON.stringify(body)}` // Consists of the complete url, nonce, and request body
            const sig = crypto.HmacSHA384(signature, apiSecret).toString() // The authentication signature is hashed using the private key

            const keepFunding = {
              url: `${restUrl}${apiPath}`,
              headers: {
                'bfx-nonce': authNonce,
                'bfx-apikey': apiKey,
                'bfx-signature': sig
              },
              body: body,
              json: true
            }


            request.post(keepFunding, (error, response, body) => {
              console.log(`Keep Funding Body:`,body); // Logs the response body
            })

        FundingPositionSocket.onmessage = function (event) {
            let data = JSON.parse(event.data)
            
            // Target the fcu message [0,"fcu",[26229850,"fUSD",-1,1588755061000,1588755074000,930.48726,0,"ACTIVE","FIXED",null,null,0.000944,14,1588755061000,null,null,0,null,0,null,1,"tBTCUSD"]] 
            if(data[1] == 'fcu'){
                expect(data).to.not.be.null
                console.log(`fcu message:`,JSON.stringify(data))

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)
                takenFunding = data[2][0]

                //Symbol
                expect(data[2][1]).to.equal(fundingSymbolSecond)

                //Side
                expect(data[2][2]).to.equal(-1)

                //Status
                expect(data[2][7]).to.equal('ACTIVE')

                //Type
                expect(data[2][8]).to.equal('FIXED')

                //No Close
                expect(data[2][20]).to.equal(0)

                //Position Pair
                expect(data[2][21]).to.equal(symbol)

                done()
                
                }
            }
    
        });

        it('Flipped Margin Position should close current funding and take new funding', function(done) {

        this.timeout(1000000)

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
            FundingPositionSocket.send(payload);

        FundingPositionSocket.onmessage = function (event) {
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

                console.log(`Waiting for current Funding to be Closed and new Funding to be Taken, can take up to 15 minutes...`)
                
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
                expect(data[2][2]).to.equal(buyAmount*-1)

                //Type
                expect(data[2][15]).to.equal(0)
                
                } 

            // Target the fcc message [0,"fcc",[26229855,"fUSD",-1,1588758961000,1588758961000,1216.15468,0,"CLOSED (no more position)","FIXED",null,null,0.000944,14,1588758961000,1588759252000,null,0,null,0,null,0,"tBTCUSD"]]
            if(data[1] == 'fcc' && data[2][1] == fundingSymbolSecond){
                expect(data).to.not.be.null
                console.log(`fcc message:`,JSON.stringify(data))

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //Symbol
                expect(data[2][1]).to.equal(fundingSymbolSecond)

                //Side
                expect(data[2][2]).to.equal(-1)

                //Status
                expect(data[2][7]).to.equal('CLOSED (no more position)')

                //Type
                expect(data[2][8]).to.equal('FIXED')

                //No Close
                expect(data[2][20]).to.equal(0)

                //Position Pair
                expect(data[2][21]).to.equal(symbol)
                
                }  

            // Target the fcn message [0,"fcn",[26229850,"fUSD",-1,1588755061000,1588755061000,930.48726,0,"ACTIVE","FIXED",null,null,0.000944,14,1588755061000,null,null,0,null,0,null,0,"tBTCUSD"]] 
            if(data[1] == 'fcn' && data[2][1] == fundingSymbolFirst){
                expect(data).to.not.be.null
                console.log(`fcn message:`,JSON.stringify(data))

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //Symbol
                expect(data[2][1]).to.equal(fundingSymbolFirst)

                //Side
                expect(data[2][2]).to.equal(-1)

                //Status
                expect(data[2][7]).to.equal('ACTIVE')

                //Type
                expect(data[2][8]).to.equal('FIXED')

                //Position Pair
                expect(data[2][21]).to.equal(symbol)

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
                "amount":buyAmount.toString(),
                "flags": 512
                }
                ])

            FundingPositionSocket.send(payload);

        FundingPositionSocket.onmessage = function (event) {
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
                expect(data[2][7]).to.equal(buyAmount)

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
                FundingPositionSocket.close();
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

    })
