const WebSocket = require('ws');
const fs = require('fs');
const expect = require('chai').expect;
const ws_url = require('../config.json').ws_url
const crypto = require('crypto-js') // Standard JavaScript cryptography library
const apiKey = require('../config.json').api_key
const apiSecret = require('../config.json').api_secret
const SchemaAssertions = require("../Assertions/schema.js")

//Auth
const OrderMultiSocket = new WebSocket(ws_url);
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

const cidDate = yyyy+'-'+mm+'-'+dd;

//Sleep timer
function sleep(milliseconds) {
  const date = Date.now();
  let currentDate = null;
  do {
    currentDate = Date.now();
  } while (currentDate - date < milliseconds);
}

describe('Order Multi Order Tests (Tests "ox_multi", "on", "ou" and "oc" inputs and authenticated channels: "n", "on", "ou", "oc")', function() {
        it('Order Multi Single Order Create, Update, Delete should return a correct Notification and Order Info message', function(done) {

        this.timeout(10000)

        OrderMultiSocket.onopen = function (event) {
            let payload = JSON.stringify([
                0,
                "ox_multi",
                null,
                [
                ["on",
                {
                "cid": 12345,
                "type": "EXCHANGE LIMIT",
                "symbol": symbol,
                "amount": buyAmount.toString(),
                "price": buyPrice.toString()
                }],
                ["pause", 1500],
                ["ou",
                {
                "cid": 12345,
                "cid_date": cidDate,
                "amount": "1.2",
                "price": "2.1"
                }],
                ["pause", 1500],
                ["oc",
                {
                "cid": 12345,
                "cid_date": cidDate
                }]
                ]
                ])
            OrderMultiSocket.send(JSON.stringify(payloadAuth))
            sleep(1000);
            OrderMultiSocket.send(payload);
          };

        OrderMultiSocket.onmessage = function (event) {
            let data = JSON.parse(event.data)
            
            // Target the n message [0,"n",[1588586105.556,"on-req",null,null,[1187253244,null,12345,"tBTCUSD",1588586105556,1588586105556,0.001,0.001,"EXCHANGE LIMIT",null,null,null,0,"ACTIVE",null,null,1,0,0,0,null,null,null,0,null,null,null,null,"API>BFX",null,null,null],null,"SUCCESS","Submitting exchange limit buy order for 0.001 BTC."]]
            if(data[1] == 'n' && data[2][1] == 'on-req'){
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
                expect(data[2][4][2]).to.equal(12345)

                //Symbol
                expect(data[2][4][3]).to.equal(symbol)

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

                //Status
                expect(data[2][13]).to.equal('ACTIVE')

                //Price
                expect(data[2][16]).to.equal(buyPrice)
                
                } 

            // Target the n message [0,"n",[1588506601803,"ou-req",null,null,[1187252384,null,12345,"tBTCUSD",1588506601759,1588506601762,1.2,1.2,"EXCHANGE LIMIT",null,null,null,0,"ACTIVE",null,null,2.1,0,0,0,null,null,null,0,0,null,null,null,"API>BFX",null,null,null],null,"SUCCESS","Submitting update to exchange limit buy order for 1.2 BTC."]] 
            if(data[1] == 'n' && data[2][1] == 'ou-req'){
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
                expect(data[2][4][2]).to.equal(12345)

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

            // Target the ou message [0,"ou",[1187252382,null,12345,"tBTCUSD",1588506280354,1588506280403,1.2,1.2,"EXCHANGE LIMIT","EXCHANGE LIMIT",null,null,0,"ACTIVE",null,null,2.1,0,0,0,null,null,null,0,0,null,null,null,"API>BFX",null,null,null]]
            if(data[1] == 'ou'){
                expect(data).to.not.be.null
                console.log(`ou message:`,JSON.stringify(data))

                //Assert data against Schema
                SchemaAssertions.assertOrdersSchema(data[2])

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //CID
                expect(data[2][2]).to.equal(12345)

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

                //Status
                expect(data[2][13]).to.equal('ACTIVE')

                //Price
                expect(data[2][16]).to.equal(2.1)
                
                }

            // Target the n message [0,"n",[1588506601803,"oc-req",null,null,[1187252384,null,12345,"tBTCUSD",1588506601759,1588506601762,1.2,1.2,"EXCHANGE LIMIT",null,null,null,0,"ACTIVE",null,null,2.1,0,0,0,null,null,null,0,0,null,null,null,"API>BFX",null,null,null],null,"SUCCESS","Submitting update to exchange limit buy order for 1.2 BTC."]]       
            if(data[1] == 'n' && data[2][1] == 'oc-req'){
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
                expect(data[2][7]).to.be.a('string')
                .and.to.contain('Submitted for cancellation; waiting for confirmation')

                //CID
                expect(data[2][4][2]).to.equal(12345)

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

                //Status
                expect(data[2][4][13]).to.equal('ACTIVE')

                //Price
                expect(data[2][4][16]).to.equal(2.1)

                } 

            // Target the oc message [0,"oc",[1187252382,null,12345,"tBTCUSD",1588506280354,1588506280403,1.2,1.2,"EXCHANGE LIMIT","EXCHANGE LIMIT",null,null,0,"CANCELED",null,null,2.1,0,0,0,null,null,null,0,0,null,null,null,"API>BFX",null,null,null]]
            if(data[1] == 'oc'){
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
                expect(data[2][6]).to.equal(1.2)

                //Amount Orig
                expect(data[2][7]).to.equal(1.2)

                //Order Type
                expect(data[2][8]).to.equal('EXCHANGE LIMIT')

                //Order Type Previous
                expect(data[2][9]).to.equal('EXCHANGE LIMIT')

                //Status
                expect(data[2][13]).to.equal('CANCELED')

                //Price
                expect(data[2][16]).to.equal(2.1)
                
                done()
                }
            }
        });

        it('Order Multi Multiple Orders Create, Update, Delete should return a correct Notification and Order Info message', function(done) {

        this.timeout(10000)

            let payload = JSON.stringify([
                0,
                "ox_multi",
                null,
                [
                ["on",
                {
                "cid": 111,
                "type": "EXCHANGE LIMIT",
                "symbol": symbol,
                "amount": buyAmount.toString(),
                "price": buyPrice.toString()
                }],
                ["on",
                {
                "cid": 222,
                "type": "EXCHANGE LIMIT",
                "symbol": symbol,
                "amount": sellAmount.toString(),
                "price": sellPrice.toString()
                }],
                ["on",
                {
                "cid": 333,
                "type": "EXCHANGE STOP",
                "symbol": symbol,
                "amount": buyAmount.toString(),
                "price": sellPrice.toString()
                }],
                ["pause", 1500],
                ["ou",
                {
                "cid": 111,
                "cid_date": cidDate,
                "amount": "1.2",
                "price": "2.1"
                }],
                ["ou",
                {
                "cid": 222,
                "cid_date": cidDate,
                "amount": "-1.2",
                "price": "20001"
                }],
                ["ou",
                {
                "cid": 333,
                "cid_date": cidDate,
                "amount": "1.2",
                "price": "20001"
                }],
                ["pause", 1500],
                ["oc_multi",
                {
                    "cid": [
                      [111, cidDate],
                      [222, cidDate],
                      [333, cidDate]
                    ]
                  }]
                ]
                ])

            OrderMultiSocket.send(payload);

        OrderMultiSocket.onmessage = function (event) {
            let data = JSON.parse(event.data)
            
            // Target the n message [0,"n",[1588586105.556,"on-req",null,null,[1187253244,null,12345,"tBTCUSD",1588586105556,1588586105556,0.001,0.001,"EXCHANGE LIMIT",null,null,null,0,"ACTIVE",null,null,1,0,0,0,null,null,null,0,null,null,null,null,"API>BFX",null,null,null],null,"SUCCESS","Submitting exchange limit buy order for 0.001 BTC."]]
            if(data[1] == 'n' && data[2][1] == 'on-req' && data[2][4][2] == 111){
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
                expect(data[2][4][2]).to.equal(111)

                //Symbol
                expect(data[2][4][3]).to.equal(symbol)

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

            // Target the n message [0,"n",[1588586105.556,"on-req",null,null,[1187253244,null,12345,"tBTCUSD",1588586105556,1588586105556,0.001,0.001,"EXCHANGE LIMIT",null,null,null,0,"ACTIVE",null,null,1,0,0,0,null,null,null,0,null,null,null,null,"API>BFX",null,null,null],null,"SUCCESS","Submitting exchange limit buy order for 0.001 BTC."]]
            if(data[1] == 'n' && data[2][1] == 'on-req' && data[2][4][2] == 222){
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

                //CID
                expect(data[2][4][2]).to.equal(222)

                //Symbol
                expect(data[2][4][3]).to.equal(symbol)

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

            // Target the n message [0,"n",[1588586105.556,"on-req",null,null,[1187253244,null,12345,"tBTCUSD",1588586105556,1588586105556,0.001,0.001,"EXCHANGE LIMIT",null,null,null,0,"ACTIVE",null,null,1,0,0,0,null,null,null,0,null,null,null,null,"API>BFX",null,null,null],null,"SUCCESS","Submitting exchange limit buy order for 0.001 BTC."]]
            if(data[1] == 'n' && data[2][1] == 'on-req' && data[2][4][2] == 333){
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

                //CID
                expect(data[2][4][2]).to.equal(333)

                //Symbol
                expect(data[2][4][3]).to.equal(symbol)

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
            if(data[1] == 'on' && data[2][2] == 111){
                expect(data).to.not.be.null
                console.log(`on message:`,JSON.stringify(data))

                //Assert data against Schema
                SchemaAssertions.assertOrdersSchema(data[2])

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //CID
                expect(data[2][2]).to.equal(111)

                //Symbol
                expect(data[2][3]).to.equal(symbol)

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
                
                } 

            // Target the on message [0,"on",[1187238101,null,1588148883485,"tBTCUSD",1588148883486,1588148883491,1,1,"EXCHANGE LIMIT",null,null,null,0,"ACTIVE",null,null,500,0,0,0,null,null,null,0,0,null,null,null,"BFX",null,null,null]
            if(data[1] == 'on' && data[2][2] == 222){
                expect(data).to.not.be.null
                console.log(`on message:`,JSON.stringify(data))

                //Assert data against Schema
                SchemaAssertions.assertOrdersSchema(data[2])

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //CID
                expect(data[2][2]).to.equal(222)

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
                
                } 

            // Target the on message [0,"on",[1187238101,null,1588148883485,"tBTCUSD",1588148883486,1588148883491,1,1,"EXCHANGE LIMIT",null,null,null,0,"ACTIVE",null,null,500,0,0,0,null,null,null,0,0,null,null,null,"BFX",null,null,null]
            if(data[1] == 'on' && data[2][2] == 333){
                expect(data).to.not.be.null
                console.log(`on message:`,JSON.stringify(data))

                //Assert data against Schema
                SchemaAssertions.assertOrdersSchema(data[2])

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //CID
                expect(data[2][2]).to.equal(333)

                //Symbol
                expect(data[2][3]).to.equal(symbol)

                //Amount
                expect(data[2][6]).to.equal(buyAmount)

                //Amount Orig
                expect(data[2][7]).to.equal(buyAmount)

                //Order Type
                expect(data[2][8]).to.equal('EXCHANGE STOP')

                //Status
                expect(data[2][13]).to.equal('ACTIVE')

                //Price
                expect(data[2][16]).to.equal(sellPrice)
                
                } 

            // Target the n message [0,"n",[1588506601803,"ou-req",null,null,[1187252384,null,12345,"tBTCUSD",1588506601759,1588506601762,1.2,1.2,"EXCHANGE LIMIT",null,null,null,0,"ACTIVE",null,null,2.1,0,0,0,null,null,null,0,0,null,null,null,"API>BFX",null,null,null],null,"SUCCESS","Submitting update to exchange limit buy order for 1.2 BTC."]] 
            if(data[1] == 'n' && data[2][1] == 'ou-req' && data[2][4][2] == 111){
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
                expect(data[2][4][2]).to.equal(111)

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

            // Target the n message [0,"n",[1588506601803,"ou-req",null,null,[1187252384,null,12345,"tBTCUSD",1588506601759,1588506601762,1.2,1.2,"EXCHANGE LIMIT",null,null,null,0,"ACTIVE",null,null,2.1,0,0,0,null,null,null,0,0,null,null,null,"API>BFX",null,null,null],null,"SUCCESS","Submitting update to exchange limit buy order for 1.2 BTC."]] 
            if(data[1] == 'n' && data[2][1] == 'ou-req' && data[2][4][2] == 222){
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
                expect(data[2][7]).to.equal('Submitting update to exchange limit sell order for 1.2 '+symbolFirst+'.')

                //CID
                expect(data[2][4][2]).to.equal(222)

                //Symbol
                expect(data[2][4][3]).to.equal(symbol)

                //Amount
                expect(data[2][4][6]).to.equal(-1.2)

                //Amount Orig
                expect(data[2][4][7]).to.equal(-1.2)

                //Order Type
                expect(data[2][4][8]).to.equal('EXCHANGE LIMIT')

                //Status
                expect(data[2][4][13]).to.equal('ACTIVE')

                //Price
                expect(data[2][4][16]).to.equal(20001)

                }

            // Target the n message [0,"n",[1588506601803,"ou-req",null,null,[1187252384,null,12345,"tBTCUSD",1588506601759,1588506601762,1.2,1.2,"EXCHANGE LIMIT",null,null,null,0,"ACTIVE",null,null,2.1,0,0,0,null,null,null,0,0,null,null,null,"API>BFX",null,null,null],null,"SUCCESS","Submitting update to exchange limit buy order for 1.2 BTC."]] 
            if(data[1] == 'n' && data[2][1] == 'ou-req' && data[2][4][2] == 333){
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
                expect(data[2][7]).to.equal('Submitting update to exchange stop buy order for 1.2 '+symbolFirst+'.')

                //CID
                expect(data[2][4][2]).to.equal(333)

                //Symbol
                expect(data[2][4][3]).to.equal(symbol)

                //Amount
                expect(data[2][4][6]).to.equal(1.2)

                //Amount Orig
                expect(data[2][4][7]).to.equal(1.2)

                //Order Type
                expect(data[2][4][8]).to.equal('EXCHANGE STOP')

                //Status
                expect(data[2][4][13]).to.equal('ACTIVE')

                //Price
                expect(data[2][4][16]).to.equal(20001)

                }

            // Target the ou message [0,"ou",[1187252382,null,12345,"tBTCUSD",1588506280354,1588506280403,1.2,1.2,"EXCHANGE LIMIT","EXCHANGE LIMIT",null,null,0,"ACTIVE",null,null,2.1,0,0,0,null,null,null,0,0,null,null,null,"API>BFX",null,null,null]]
            if(data[1] == 'ou' && data[2][2] == 111){
                expect(data).to.not.be.null
                console.log(`ou message:`,JSON.stringify(data))

                //Assert data against Schema
                SchemaAssertions.assertOrdersSchema(data[2])

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //CID
                expect(data[2][2]).to.equal(111)

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

                //Status
                expect(data[2][13]).to.equal('ACTIVE')

                //Price
                expect(data[2][16]).to.equal(2.1)
                
                }

            // Target the ou message [0,"ou",[1187252382,null,12345,"tBTCUSD",1588506280354,1588506280403,1.2,1.2,"EXCHANGE LIMIT","EXCHANGE LIMIT",null,null,0,"ACTIVE",null,null,2.1,0,0,0,null,null,null,0,0,null,null,null,"API>BFX",null,null,null]]
            if(data[1] == 'ou' && data[2][2] == 222){
                expect(data).to.not.be.null
                console.log(`ou message:`,JSON.stringify(data))

                //Assert data against Schema
                SchemaAssertions.assertOrdersSchema(data[2])

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //CID
                expect(data[2][2]).to.equal(222)

                //Symbol
                expect(data[2][3]).to.equal(symbol)

                //Amount
                expect(data[2][6]).to.equal(-1.2)

                //Amount Orig
                expect(data[2][7]).to.equal(-1.2)

                //Order Type
                expect(data[2][8]).to.equal('EXCHANGE LIMIT')

                //Order Type Previous
                expect(data[2][9]).to.equal('EXCHANGE LIMIT')

                //Status
                expect(data[2][13]).to.equal('ACTIVE')

                //Price
                expect(data[2][16]).to.equal(20001)
                
                }

            // Target the ou message [0,"ou",[1187252382,null,12345,"tBTCUSD",1588506280354,1588506280403,1.2,1.2,"EXCHANGE LIMIT","EXCHANGE LIMIT",null,null,0,"ACTIVE",null,null,2.1,0,0,0,null,null,null,0,0,null,null,null,"API>BFX",null,null,null]]
            if(data[1] == 'ou' && data[2][2] == 333){
                expect(data).to.not.be.null
                console.log(`ou message:`,JSON.stringify(data))

                //Assert data against Schema
                SchemaAssertions.assertOrdersSchema(data[2])

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //CID
                expect(data[2][2]).to.equal(333)

                //Symbol
                expect(data[2][3]).to.equal(symbol)

                //Amount
                expect(data[2][6]).to.equal(1.2)

                //Amount Orig
                expect(data[2][7]).to.equal(1.2)

                //Order Type
                expect(data[2][8]).to.equal('EXCHANGE STOP')

                //Order Type Previous
                expect(data[2][9]).to.equal('EXCHANGE STOP')

                //Status
                expect(data[2][13]).to.equal('ACTIVE')

                //Price
                expect(data[2][16]).to.equal(20001)
                
                }

            // Target the n message [0,"n",[1588506601803,"oc-req",null,null,[1187252384,null,12345,"tBTCUSD",1588506601759,1588506601762,1.2,1.2,"EXCHANGE LIMIT",null,null,null,0,"ACTIVE",null,null,2.1,0,0,0,null,null,null,0,0,null,null,null,"API>BFX",null,null,null],null,"SUCCESS","Submitting update to exchange limit buy order for 1.2 BTC."]]       
            if(data[1] == 'n' && data[2][1] == 'oc-req' && data[2][4][2] == 111){
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
                expect(data[2][7]).to.be.a('string')
                .and.to.contain('Submitted for cancellation; waiting for confirmation')

                //CID
                expect(data[2][4][2]).to.equal(111)

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

                //Status
                expect(data[2][4][13]).to.equal('ACTIVE')

                //Price
                expect(data[2][4][16]).to.equal(2.1)

                } 

            // Target the n message [0,"n",[1588506601803,"oc-req",null,null,[1187252384,null,12345,"tBTCUSD",1588506601759,1588506601762,1.2,1.2,"EXCHANGE LIMIT",null,null,null,0,"ACTIVE",null,null,2.1,0,0,0,null,null,null,0,0,null,null,null,"API>BFX",null,null,null],null,"SUCCESS","Submitting update to exchange limit buy order for 1.2 BTC."]]       
            if(data[1] == 'n' && data[2][1] == 'oc-req' && data[2][4][2] == 222){
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
                expect(data[2][7]).to.be.a('string')
                .and.to.contain('Submitted for cancellation; waiting for confirmation')

                //CID
                expect(data[2][4][2]).to.equal(222)

                //Symbol
                expect(data[2][4][3]).to.equal(symbol)

                //Amount
                expect(data[2][4][6]).to.equal(-1.2)

                //Amount Orig
                expect(data[2][4][7]).to.equal(-1.2)

                //Order Type
                expect(data[2][4][8]).to.equal('EXCHANGE LIMIT')

                //Order Type Previous
                expect(data[2][4][9]).to.equal('EXCHANGE LIMIT')

                //Status
                expect(data[2][4][13]).to.equal('ACTIVE')

                //Price
                expect(data[2][4][16]).to.equal(20001)

                } 

            // Target the n message [0,"n",[1588506601803,"oc-req",null,null,[1187252384,null,12345,"tBTCUSD",1588506601759,1588506601762,1.2,1.2,"EXCHANGE LIMIT",null,null,null,0,"ACTIVE",null,null,2.1,0,0,0,null,null,null,0,0,null,null,null,"API>BFX",null,null,null],null,"SUCCESS","Submitting update to exchange limit buy order for 1.2 BTC."]]       
            if(data[1] == 'n' && data[2][1] == 'oc-req' && data[2][4][2] == 333){
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
                expect(data[2][7]).to.be.a('string')
                .and.to.contain('Submitted for cancellation; waiting for confirmation')

                //CID
                expect(data[2][4][2]).to.equal(333)

                //Symbol
                expect(data[2][4][3]).to.equal(symbol)

                //Amount
                expect(data[2][4][6]).to.equal(1.2)

                //Amount Orig
                expect(data[2][4][7]).to.equal(1.2)

                //Order Type
                expect(data[2][4][8]).to.equal('EXCHANGE STOP')

                //Order Type Previous
                expect(data[2][4][9]).to.equal('EXCHANGE STOP')

                //Status
                expect(data[2][4][13]).to.equal('ACTIVE')

                //Price
                expect(data[2][4][16]).to.equal(20001)

                } 

            // Target the oc message [0,"oc",[1187252382,null,12345,"tBTCUSD",1588506280354,1588506280403,1.2,1.2,"EXCHANGE LIMIT","EXCHANGE LIMIT",null,null,0,"CANCELED",null,null,2.1,0,0,0,null,null,null,0,0,null,null,null,"API>BFX",null,null,null]]
            if(data[1] == 'oc' && data[2][2] == 111){
                expect(data).to.not.be.null
                console.log(`oc message:`,JSON.stringify(data))

                //Assert data against Schema
                SchemaAssertions.assertOrdersSchema(data[2])

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //CID
                expect(data[2][2]).to.equal(111)

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

                //Status
                expect(data[2][13]).to.equal('CANCELED')

                //Price
                expect(data[2][16]).to.equal(2.1)

                }

            // Target the oc message [0,"oc",[1187252382,null,12345,"tBTCUSD",1588506280354,1588506280403,1.2,1.2,"EXCHANGE LIMIT","EXCHANGE LIMIT",null,null,0,"CANCELED",null,null,2.1,0,0,0,null,null,null,0,0,null,null,null,"API>BFX",null,null,null]]
            if(data[1] == 'oc' && data[2][2] == 222){
                expect(data).to.not.be.null
                console.log(`oc message:`,JSON.stringify(data))

                //Assert data against Schema
                SchemaAssertions.assertOrdersSchema(data[2])

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //CID
                expect(data[2][2]).to.equal(222)

                //Symbol
                expect(data[2][3]).to.equal(symbol)

                //Amount
                expect(data[2][6]).to.equal(-1.2)

                //Amount Orig
                expect(data[2][7]).to.equal(-1.2)

                //Order Type
                expect(data[2][8]).to.equal('EXCHANGE LIMIT')

                //Order Type Previous
                expect(data[2][9]).to.equal('EXCHANGE LIMIT')

                //Status
                expect(data[2][13]).to.equal('CANCELED')

                //Price
                expect(data[2][16]).to.equal(20001)

                }

            // Target the oc message [0,"oc",[1187252382,null,12345,"tBTCUSD",1588506280354,1588506280403,1.2,1.2,"EXCHANGE LIMIT","EXCHANGE LIMIT",null,null,0,"CANCELED",null,null,2.1,0,0,0,null,null,null,0,0,null,null,null,"API>BFX",null,null,null]]
            if(data[1] == 'oc' && data[2][2] == 333){
                expect(data).to.not.be.null
                OrderMultiSocket.close();
                console.log(`oc message:`,JSON.stringify(data))

                //Assert data against Schema
                SchemaAssertions.assertOrdersSchema(data[2])

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //CID
                expect(data[2][2]).to.equal(333)

                //Symbol
                expect(data[2][3]).to.equal(symbol)

                //Amount
                expect(data[2][6]).to.equal(1.2)

                //Amount Orig
                expect(data[2][7]).to.equal(1.2)

                //Order Type
                expect(data[2][8]).to.equal('EXCHANGE STOP')

                //Order Type Previous
                expect(data[2][9]).to.equal('EXCHANGE STOP')

                //Status
                expect(data[2][13]).to.equal('CANCELED')

                //Price
                expect(data[2][16]).to.equal(20001)

                done()

                }
            }
        });

    })
