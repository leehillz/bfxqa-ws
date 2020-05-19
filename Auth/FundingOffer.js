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
const NewOfferSocket = new WebSocket(ws_url);
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
const symbol = 'fUST'
const symbolNice = symbol.substr(1,3)
const offerAmount = 50 //min $50 USD equivalent
const bidAmount = -50 //min $50 USD equivalent
const offerRate = 0.005
const bidRate = 0.00001
const period = 2 //between 2 and 30

//Sleep timer
function sleep(milliseconds) {
  const date = Date.now();
  let currentDate = null;
  do {
    currentDate = Date.now();
  } while (currentDate - date < milliseconds);
}

describe('New Funding Offer Tests (Tests "fon" inputs and authenticated channels: "n", "fon", "fou", foc", "fln", "flu", "flc", "fte", "ftu")', function() {

    let takenFunding1
    let takenFunding2
    let takenFunding3
    let offerId
    let bidId

        it('New Limit Offer should return a correct Notification and Funding Offer Info message', function(done) {

        this.timeout(10000)

        NewOfferSocket.onopen = function (event) {
            let payload = JSON.stringify([
                0,
                "fon",
                null,
                {
                "type": "LIMIT",
                "symbol": symbol,
                "amount": offerAmount.toString(),
                "rate": offerRate.toString(),
                "period": period
                }
                ])
            NewOfferSocket.send(JSON.stringify(payloadAuth))
            sleep(1000);
            NewOfferSocket.send(payload);
          };

        NewOfferSocket.onmessage = function (event) {
            let data = JSON.parse(event.data)
            
            // Target the n message [0,"n",[1588164952587,"fon-req",null,null,[41245492,null,null,null,50,null,null,null,null,null,null,null,null,null,0.005,2,null,null,null,null,null],null,"SUCCESS","Submitting funding offer of 50.0 USD at 0.5000 for 2 days."]]      

            if(data[1] == 'n'){
                expect(data).to.not.be.null
                console.log(`n message:`,JSON.stringify(data))

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //MTS Timestamp of Notification
                expect(data[2][0]).to.be.a('number')

                //Type 
                expect(data[2][1]).to.equal('fon-req')

                //Status
                expect(data[2][6]).to.equal('SUCCESS')

                //Text
                expect(data[2][7]).to.equal('Submitting funding offer of '+offerAmount+'.0 '+symbolNice+' at '+offerRate*100+'000 for '+period+' days.')

                //Funding ID
                expect(data[2][4][0]).to.be.a('number')

                //Placeholder
                expect(data[2][4][1]).to.be.null

                //Placeholder
                expect(data[2][4][2]).to.be.null

                //Placeholder
                expect(data[2][4][3]).to.be.null

                //Amount
                expect(data[2][4][4]).to.equal(offerAmount)

                //Placeholder
                expect(data[2][4][5]).to.be.null

                //Placeholder
                expect(data[2][4][6]).to.be.null

                //Placeholder
                expect(data[2][4][7]).to.be.null

                //Placeholder
                expect(data[2][4][8]).to.be.null

                //Placeholder
                expect(data[2][4][9]).to.be.null

                //Placeholder
                expect(data[2][4][10]).to.be.null

                //Placeholder
                expect(data[2][4][11]).to.be.null

                //Placeholder
                expect(data[2][4][12]).to.be.null

                //Placeholder
                expect(data[2][4][13]).to.be.null

                //Rate
                expect(data[2][4][14]).to.equal(offerRate)

                //Period
                expect(data[2][4][15]).to.equal(period)

                //Placeholder
                expect(data[2][4][16]).to.be.null

                //Placeholder
                expect(data[2][4][17]).to.be.null

                //Placeholder
                expect(data[2][4][18]).to.be.null

                //Placeholder
                expect(data[2][4][19]).to.be.null

                //Placeholder
                expect(data[2][4][20]).to.be.null

                } 

            // Target the fon message [0,"fon",[41245492,"fUSD",1588164953000,1588164953000,50,50,"LIMIT",null,null,null,"ACTIVE",null,null,null,0.005,2,0,0,null,0,null]]
            if(data[1] == 'fon'){
                expect(data).to.not.be.null
                console.log(`fon message:`,JSON.stringify(data))

                //Assert data against Schema
                SchemaAssertions.assertOffersSchema(data[2])

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //Symbol
                expect(data[2][1]).to.equal(symbol)

                //Amount
                expect(data[2][4]).to.equal(offerAmount)

                //Amount Orig
                expect(data[2][5]).to.equal(offerAmount)

                //Offer Type
                expect(data[2][6]).to.equal('LIMIT')

                //Status
                expect(data[2][10]).to.equal('ACTIVE')

                //Rate
                expect(data[2][14]).to.equal(offerRate)

                //Period
                expect(data[2][15]).to.equal(period)

                //Hidden
                expect(data[2][17]).to.equal(0)

                //Renew
                expect(data[2][19]).to.equal(0)

                done()
                }    
            }
        });

        it('New Limit Bid should return a correct Notification and Funding Offer Info message', function(done) {

        this.timeout(10000)

            let payload = JSON.stringify([
                0,
                "fon",
                null,
                {
                "type": "LIMIT",
                "symbol": symbol,
                "amount": bidAmount.toString(),
                "rate": bidRate.toString(),
                "period": period
                }
                ])

            NewOfferSocket.send(payload);

        NewOfferSocket.onmessage = function (event) {
            let data = JSON.parse(event.data)
            
            // Target the n message [0,"n",[1588164952587,"fon-req",null,null,[41245492,null,null,null,50,null,null,null,null,null,null,null,null,null,0.005,2,null,null,null,null,null],null,"SUCCESS","Submitting funding offer of 50.0 USD at 0.5000 for 2 days."]]      

            if(data[1] == 'n'){
                expect(data).to.not.be.null
                console.log(`n message:`,JSON.stringify(data))

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //MTS Timestamp of Notification
                expect(data[2][0]).to.be.a('number')

                //Type 
                expect(data[2][1]).to.equal('fon-req')

                //Status
                expect(data[2][6]).to.equal('SUCCESS')

                //Text
                expect(data[2][7]).to.equal('Submitting funding bid of '+bidAmount*-1+'.0 '+symbolNice+' at '+bidRate*100+'000 for '+period+' days.')

                //Funding ID
                expect(data[2][4][0]).to.be.a('number')
                bidId = data[2][4][0]

                //Placeholder
                expect(data[2][4][1]).to.be.null

                //Placeholder
                expect(data[2][4][2]).to.be.null

                //Placeholder
                expect(data[2][4][3]).to.be.null

                //Amount
                expect(data[2][4][4]).to.equal(bidAmount)

                //Placeholder
                expect(data[2][4][5]).to.be.null

                //Placeholder
                expect(data[2][4][6]).to.be.null

                //Placeholder
                expect(data[2][4][7]).to.be.null

                //Placeholder
                expect(data[2][4][8]).to.be.null

                //Placeholder
                expect(data[2][4][9]).to.be.null

                //Placeholder
                expect(data[2][4][10]).to.be.null

                //Placeholder
                expect(data[2][4][11]).to.be.null

                //Placeholder
                expect(data[2][4][12]).to.be.null

                //Placeholder
                expect(data[2][4][13]).to.be.null

                //Rate
                expect(data[2][4][14]).to.equal(bidRate)

                //Period
                expect(data[2][4][15]).to.equal(period)

                //Placeholder
                expect(data[2][4][16]).to.be.null

                //Placeholder
                expect(data[2][4][17]).to.be.null

                //Placeholder
                expect(data[2][4][18]).to.be.null

                //Placeholder
                expect(data[2][4][19]).to.be.null

                //Placeholder
                expect(data[2][4][20]).to.be.null

                } 

            // Target the fon message [0,"fon",[41245492,"fUSD",1588164953000,1588164953000,50,50,"LIMIT",null,null,null,"ACTIVE",null,null,null,0.005,2,0,0,null,0,null]]
            if(data[1] == 'fon'){
                expect(data).to.not.be.null
                console.log(`fon message:`,JSON.stringify(data))

                //Assert data against Schema
                SchemaAssertions.assertOffersSchema(data[2])

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //Symbol
                expect(data[2][1]).to.equal(symbol)

                //Amount
                expect(data[2][4]).to.equal(bidAmount)

                //Amount Orig
                expect(data[2][5]).to.equal(bidAmount)

                //Offer Type
                expect(data[2][6]).to.equal('LIMIT')

                //Status
                expect(data[2][10]).to.equal('ACTIVE')

                //Rate
                expect(data[2][14]).to.equal(bidRate)

                //Period
                expect(data[2][15]).to.equal(period)

                //Hidden
                expect(data[2][17]).to.equal(0)

                //Renew
                expect(data[2][19]).to.equal(0)

                done()
                }    
            }
        });

        it('New FRR Offer should return a correct Notification, Funding Offer Info, Funding Loan New, Funding Trade Executed and Funding Trade Update message', function(done) {

        this.timeout(10000)

            let payload = JSON.stringify([
                0,
                "fon",
                null,
                {
                "type": "FRRDELTAVAR",
                "symbol": symbol,
                "amount": (offerAmount*3).toString(),
                "rate": "0",
                "period": period
                }
                ])

            NewOfferSocket.send(payload);

        NewOfferSocket.onmessage = function (event) {
            let data = JSON.parse(event.data)
            
            // Target the n message [0,"n",[1588164952587,"fon-req",null,null,[41245492,null,null,null,50,null,null,null,null,null,null,null,null,null,0.005,2,null,null,null,null,null],null,"SUCCESS","Submitting funding offer of 50.0 USD at 0.5000 for 2 days."]]      

            if(data[1] == 'n'){
                expect(data).to.not.be.null
                console.log(`n message:`,JSON.stringify(data))

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //MTS Timestamp of Notification
                expect(data[2][0]).to.be.a('number')

                //Type 
                expect(data[2][1]).to.equal('fon-req')

                //Status
                expect(data[2][6]).to.equal('SUCCESS')

                //Text
                expect(data[2][7]).to.equal('Submitting funding offer of '+(offerAmount*3)+'.0 '+symbolNice+' at FRR 0.0000 for '+period+' days.')

                //Funding ID
                expect(data[2][4][0]).to.be.a('number')
                offerId = data[2][4][0]

                //Placeholder
                expect(data[2][4][1]).to.be.null

                //Placeholder
                expect(data[2][4][2]).to.be.null

                //Placeholder
                expect(data[2][4][3]).to.be.null

                //Amount
                expect(data[2][4][4]).to.equal(offerAmount*3)

                //Placeholder
                expect(data[2][4][5]).to.be.null

                //Placeholder
                expect(data[2][4][6]).to.be.null

                //Placeholder
                expect(data[2][4][7]).to.be.null

                //Placeholder
                expect(data[2][4][8]).to.be.null

                //Placeholder
                expect(data[2][4][9]).to.be.null

                //Placeholder
                expect(data[2][4][10]).to.be.null

                //Placeholder
                expect(data[2][4][11]).to.be.null

                //Placeholder
                expect(data[2][4][12]).to.be.null

                //Placeholder
                expect(data[2][4][13]).to.be.null

                //Rate
                expect(data[2][4][14]).to.equal(0)

                //Period
                expect(data[2][4][15]).to.equal(period)

                //Placeholder
                expect(data[2][4][16]).to.be.null

                //Placeholder
                expect(data[2][4][17]).to.be.null

                //Placeholder
                expect(data[2][4][18]).to.be.null

                //Placeholder
                expect(data[2][4][19]).to.be.null

                //Placeholder
                expect(data[2][4][20]).to.be.null
                
                } 

            // Target the fon message [0,"fon",[41245492,"fUSD",1588164953000,1588164953000,50,50,"LIMIT",null,null,null,"ACTIVE",null,null,null,0.005,2,0,0,null,0,null]]
            if(data[1] == 'fon'){
                expect(data).to.not.be.null
                console.log(`fon message:`,JSON.stringify(data))

                //Assert data against Schema
                SchemaAssertions.assertOffersSchema(data[2])

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //Symbol
                expect(data[2][1]).to.equal(symbol)

                //Amount
                expect(data[2][4]).to.equal(offerAmount*3)

                //Amount Orig
                expect(data[2][5]).to.equal(offerAmount*3)

                //Offer Type
                expect(data[2][6]).to.equal('FRRDELTAVAR')

                //Status
                expect(data[2][10]).to.equal('ACTIVE')

                //Rate
                expect(data[2][14]).to.equal(0)

                //Period
                expect(data[2][15]).to.equal(period)

                //Hidden
                expect(data[2][17]).to.equal(0)

                //Renew
                expect(data[2][19]).to.equal(0)

                done()
                }    
            }
        });

it('New FRR Bid should return a correct Notification and Funding Offer Info message', function(done) {

        this.timeout(10000)

            let payload = JSON.stringify([
                0,
                "fon",
                null,
                {
                "type": "FRRDELTAVAR",
                "symbol": symbol,
                "amount": bidAmount.toString(),
                "rate": "0",
                "period": period
                }
                ])

            NewOfferSocket.send(payload);

        NewOfferSocket.onmessage = function (event) {
            let data = JSON.parse(event.data)
            
            // Target the n message [0,"n",[1588164952587,"fon-req",null,null,[41245492,null,null,null,50,null,null,null,null,null,null,null,null,null,0.005,2,null,null,null,null,null],null,"SUCCESS","Submitting funding offer of 50.0 USD at 0.5000 for 2 days."]]      

            if(data[1] == 'n'){
                expect(data).to.not.be.null
                console.log(`n message:`,JSON.stringify(data))

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //MTS Timestamp of Notification
                expect(data[2][0]).to.be.a('number')

                //Type 
                expect(data[2][1]).to.equal('fon-req')

                //Status
                expect(data[2][6]).to.equal('SUCCESS')

                //Text
                expect(data[2][7]).to.equal('Submitting funding bid of '+bidAmount*-1+'.0 '+symbolNice+' at FRR 0.0000 for '+period+' days.')

                //Funding ID
                expect(data[2][4][0]).to.be.a('number')

                //Placeholder
                expect(data[2][4][1]).to.be.null

                //Placeholder
                expect(data[2][4][2]).to.be.null

                //Placeholder
                expect(data[2][4][3]).to.be.null

                //Amount
                expect(data[2][4][4]).to.equal(bidAmount)

                //Placeholder
                expect(data[2][4][5]).to.be.null

                //Placeholder
                expect(data[2][4][6]).to.be.null

                //Placeholder
                expect(data[2][4][7]).to.be.null

                //Placeholder
                expect(data[2][4][8]).to.be.null

                //Placeholder
                expect(data[2][4][9]).to.be.null

                //Placeholder
                expect(data[2][4][10]).to.be.null

                //Placeholder
                expect(data[2][4][11]).to.be.null

                //Placeholder
                expect(data[2][4][12]).to.be.null

                //Placeholder
                expect(data[2][4][13]).to.be.null

                //Rate
                expect(data[2][4][14]).to.equal(0)

                //Period
                expect(data[2][4][15]).to.equal(period)

                //Placeholder
                expect(data[2][4][16]).to.be.null

                //Placeholder
                expect(data[2][4][17]).to.be.null

                //Placeholder
                expect(data[2][4][18]).to.be.null

                //Placeholder
                expect(data[2][4][19]).to.be.null

                //Placeholder
                expect(data[2][4][20]).to.be.null
                
                } 

            // Target the oc message [0,"foc",[41245492,"fUSD",1588164953000,1588164953000,50,50,"LIMIT",null,null,null,"ACTIVE",null,null,null,0.005,2,0,0,null,0,null]]
            //[0,"foc",[41245527,"fUSD",1588169273000,1588169273000,0,-50,"FRRDELTAVAR",null,null,null,"EXECUTED at FRR delta (50.0)",null,null,null,0,2,0,0,null,0,null]]    
            if(data[1] == 'foc'){
                expect(data).to.not.be.null
                console.log(`fon message:`,JSON.stringify(data))

                //Assert data against Schema
                SchemaAssertions.assertOffersSchema(data[2])

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //Symbol
                expect(data[2][1]).to.equal(symbol)

                //Amount
                expect(data[2][4]).to.equal(0)

                //Amount Orig
                expect(data[2][5]).to.equal(bidAmount)

                //Offer Type
                expect(data[2][6]).to.equal('FRRDELTAVAR')

                //Status
                expect(data[2][10]).to.be.a('string')
                expect(data[2][10]).to.contain('EXECUTED')

                //Rate
                expect(data[2][14]).to.equal(0)

                //Period
                expect(data[2][15]).to.equal(period)

                //Hidden
                expect(data[2][17]).to.equal(0)

                //Renew
                expect(data[2][19]).to.equal(0)
                
                }  

            // Target the fou message [0,"fou",[41246004,"fUSD",1588668664000,1588668664000,50,100,"FRRDELTAVAR",null,null,null,"PARTIALLY FILLED at FRR delta (50.0)",null,null,null,0,30,0,0,null,0,null]]
            if(data[1] == 'fou'){
                expect(data).to.not.be.null
                console.log(`fou message:`,JSON.stringify(data))

                //Assert data against Schema
                SchemaAssertions.assertOffersSchema(data[2])

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //Symbol
                expect(data[2][1]).to.equal(symbol)

                //Amount
                expect(data[2][4]).to.equal(offerAmount*2)

                //Amount Orig
                expect(data[2][5]).to.equal(offerAmount*3)

                //Offer Type
                expect(data[2][6]).to.equal('FRRDELTAVAR')

                //Status
                expect(data[2][10]).to.equal('PARTIALLY FILLED at FRR delta ('+offerAmount+'.0)')

                //Rate
                expect(data[2][14]).to.equal(0)

                //Period
                expect(data[2][15]).to.equal(period)

                //Hidden
                expect(data[2][17]).to.equal(0)

                //Renew
                expect(data[2][19]).to.equal(0)

                } 

            // Target the fln message [0,"fln",[2996371,"fUSD",-1,1588244240000,1588244240000,50,0,"ACTIVE","VAR",null,null,0,4,1588244240000,1588244240000,null,0,null,0,null,0]]    
            if(data[1] == 'fln' && data [2][5] == (bidAmount*-1)){
                expect(data).to.not.be.null
                console.log(`fln message:`,JSON.stringify(data))

                takenFunding1 = data[2][0]

                //Assert data against Schema
                SchemaAssertions.assertFundingLoansSchema(data[2])

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //Symbol
                expect(data[2][1]).to.equal(symbol)

                //Amount
                expect(data[2][5]).to.equal(bidAmount*-1)

                //Flags
                expect(data[2][6]).to.equal(0)

                //Status
                expect(data[2][7]).to.equal('ACTIVE')

                //Type
                expect(data[2][8]).to.equal('VAR')

                //Rate
                expect(data[2][11]).to.equal(0)

                //Period
                expect(data[2][12]).to.be.at.least(period)

                //Renew
                expect(data[2][18]).to.equal(0)

                //No Close
                expect(data[2][20]).to.equal(0)
                
                } 

            // Target the flu message [0,"flu",[2996371,"fUSD",-1,1588244240000,1588244240000,50,0,"ACTIVE","VAR",null,null,0,4,1588244240000,1588244240000,null,0,null,0,null,0]]    
            if(data[1] == 'flu' && data [2][5] == (bidAmount*-1)){
                expect(data).to.not.be.null
                console.log(`flu message:`,JSON.stringify(data))

                //Assert data against Schema
                SchemaAssertions.assertFundingLoansSchema(data[2])

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //Symbol
                expect(data[2][1]).to.equal(symbol)

                //Amount
                expect(data[2][5]).to.equal(bidAmount*-1)

                //Flags
                expect(data[2][6]).to.equal(0)

                //Status
                expect(data[2][7]).to.equal('ACTIVE')

                //Type
                expect(data[2][8]).to.equal('VAR')

                //Rate
                expect(data[2][11]).to.equal(0)

                //Period
                expect(data[2][12]).to.be.at.least(period)

                //Renew
                expect(data[2][18]).to.equal(0)

                //No Close
                expect(data[2][20]).to.equal(0)
                
                }     

            // Target the fte message [0,"fte",[643492,"fUSD",1588244240000,41245717,-50,0.00091413,4,null]]  
            if(data[1] == 'fte' && data [2][4] == bidAmount){
                expect(data).to.not.be.null
                console.log(`fte message:`,JSON.stringify(data))

                //Assert data against Schema
                SchemaAssertions.assertFundingTradesSchema(data[2])

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //Symbol
                expect(data[2][1]).to.equal(symbol)

                //Amount
                expect(data[2][4]).to.equal(bidAmount)

                //Period
                expect(data[2][6]).to.be.at.least(period)

                //Maker (1 if true, null if false)
                expect(data[2][7]).to.be.null
                
                }   

            // Target the ftu message [0,"ftu",[643492,"fUSD",1588244240000,41245717,-50,0.00091413,4,null]] 
            if(data[1] == 'ftu' && data [2][4] == bidAmount){
                expect(data).to.not.be.null
                console.log(`ftu message:`,JSON.stringify(data))

                //Assert data against Schema
                SchemaAssertions.assertFundingTradesSchema(data[2])

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //Symbol
                expect(data[2][1]).to.equal(symbol)

                //Amount
                expect(data[2][4]).to.equal(bidAmount)

                //Period
                expect(data[2][6]).to.be.at.least(period)

                //Maker (1 if true, null if false)
                expect(data[2][7]).to.be.null
                
                done()
                }     
            }
        });

        it('New FRR Variable Offer should return a correct Notification and Funding Offer Info message', function(done) {

        this.timeout(10000)

            let payload = JSON.stringify([
                0,
                "fon",
                null,
                {
                "type": "FRRDELTAVAR",
                "symbol": symbol,
                "amount": offerAmount.toString(),
                "rate": "0.00001",
                "period": period
                }
                ])

            NewOfferSocket.send(payload);

        NewOfferSocket.onmessage = function (event) {
            let data = JSON.parse(event.data)
            
            // Target the n message [0,"n",[1588164952587,"fon-req",null,null,[41245492,null,null,null,50,null,null,null,null,null,null,null,null,null,0.005,2,null,null,null,null,null],null,"SUCCESS","Submitting funding offer of 50.0 USD at 0.5000 for 2 days."]]      
            if(data[1] == 'n'){
                expect(data).to.not.be.null
                console.log(`n message:`,JSON.stringify(data))

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //MTS Timestamp of Notification
                expect(data[2][0]).to.be.a('number')

                //Type 
                expect(data[2][1]).to.equal('fon-req')

                //Status
                expect(data[2][6]).to.equal('SUCCESS')

                //Text
                expect(data[2][7]).to.equal('Submitting funding offer of '+offerAmount+'.0 '+symbolNice+' at FRR 0.001000 for '+period+' days.')

                //Funding ID
                expect(data[2][4][0]).to.be.a('number')

                //Placeholder
                expect(data[2][4][1]).to.be.null

                //Placeholder
                expect(data[2][4][2]).to.be.null

                //Placeholder
                expect(data[2][4][3]).to.be.null

                //Amount
                expect(data[2][4][4]).to.equal(offerAmount)

                //Placeholder
                expect(data[2][4][5]).to.be.null

                //Placeholder
                expect(data[2][4][6]).to.be.null

                //Placeholder
                expect(data[2][4][7]).to.be.null

                //Placeholder
                expect(data[2][4][8]).to.be.null

                //Placeholder
                expect(data[2][4][9]).to.be.null

                //Placeholder
                expect(data[2][4][10]).to.be.null

                //Placeholder
                expect(data[2][4][11]).to.be.null

                //Placeholder
                expect(data[2][4][12]).to.be.null

                //Placeholder
                expect(data[2][4][13]).to.be.null

                //Rate
                expect(data[2][4][14]).to.equal(0.00001)

                //Period
                expect(data[2][4][15]).to.equal(period)

                //Placeholder
                expect(data[2][4][16]).to.be.null

                //Placeholder
                expect(data[2][4][17]).to.be.null

                //Placeholder
                expect(data[2][4][18]).to.be.null

                //Placeholder
                expect(data[2][4][19]).to.be.null

                //Placeholder
                expect(data[2][4][20]).to.be.null

                } 

            // Target the fon message [0,"fon",[41245492,"fUSD",1588164953000,1588164953000,50,50,"LIMIT",null,null,null,"ACTIVE",null,null,null,0.005,2,0,0,null,0,null]]
            if(data[1] == 'fon'){
                expect(data).to.not.be.null
                console.log(`fon message:`,JSON.stringify(data))

                //Assert data against Schema
                SchemaAssertions.assertOffersSchema(data[2])

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //Symbol
                expect(data[2][1]).to.equal(symbol)

                //Amount
                expect(data[2][4]).to.equal(offerAmount)

                //Amount Orig
                expect(data[2][5]).to.equal(offerAmount)

                //Offer Type
                expect(data[2][6]).to.equal('FRRDELTAVAR')

                //Status
                expect(data[2][10]).to.equal('ACTIVE')

                //Rate
                expect(data[2][14]).to.equal(0.00001)

                //Period
                expect(data[2][15]).to.equal(period)

                //Hidden
                expect(data[2][17]).to.equal(0)

                //Renew
                expect(data[2][19]).to.equal(0)

                done()
                }    
            }
        });

it('New FRR Variable Bid should return a correct Notification and Funding Offer Info message', function(done) {

        this.timeout(10000)

            let payload = JSON.stringify([
                0,
                "fon",
                null,
                {
                "type": "FRRDELTAVAR",
                "symbol": symbol,
                "amount": bidAmount.toString(),
                "rate": "0.00001",
                "period": period
                }
                ])

            NewOfferSocket.send(payload);

        NewOfferSocket.onmessage = function (event) {
            let data = JSON.parse(event.data)
            
            // Target the n message [0,"n",[1588164952587,"fon-req",null,null,[41245492,null,null,null,50,null,null,null,null,null,null,null,null,null,0.005,2,null,null,null,null,null],null,"SUCCESS","Submitting funding offer of 50.0 USD at 0.5000 for 2 days."]]      

            if(data[1] == 'n'){
                expect(data).to.not.be.null
                console.log(`n message:`,JSON.stringify(data))

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //MTS Timestamp of Notification
                expect(data[2][0]).to.be.a('number')

                //Type 
                expect(data[2][1]).to.equal('fon-req')

                //Status
                expect(data[2][6]).to.equal('SUCCESS')

                //Text
                expect(data[2][7]).to.equal('Submitting funding bid of '+bidAmount*-1+'.0 '+symbolNice+' at FRR 0.001000 for '+period+' days.')

                //Funding ID
                expect(data[2][4][0]).to.be.a('number')

                //Placeholder
                expect(data[2][4][1]).to.be.null

                //Placeholder
                expect(data[2][4][2]).to.be.null

                //Placeholder
                expect(data[2][4][3]).to.be.null

                //Amount
                expect(data[2][4][4]).to.equal(bidAmount)

                //Placeholder
                expect(data[2][4][5]).to.be.null

                //Placeholder
                expect(data[2][4][6]).to.be.null

                //Placeholder
                expect(data[2][4][7]).to.be.null

                //Placeholder
                expect(data[2][4][8]).to.be.null

                //Placeholder
                expect(data[2][4][9]).to.be.null

                //Placeholder
                expect(data[2][4][10]).to.be.null

                //Placeholder
                expect(data[2][4][11]).to.be.null

                //Placeholder
                expect(data[2][4][12]).to.be.null

                //Placeholder
                expect(data[2][4][13]).to.be.null

                //Rate
                expect(data[2][4][14]).to.equal(0.00001)

                //Period
                expect(data[2][4][15]).to.equal(period)

                //Placeholder
                expect(data[2][4][16]).to.be.null

                //Placeholder
                expect(data[2][4][17]).to.be.null

                //Placeholder
                expect(data[2][4][18]).to.be.null

                //Placeholder
                expect(data[2][4][19]).to.be.null

                //Placeholder
                expect(data[2][4][20]).to.be.null

                } 

            // Target the fln message [0,"fln",[2996371,"fUSD",-1,1588244240000,1588244240000,50,0,"ACTIVE","VAR",null,null,0,4,1588244240000,1588244240000,null,0,null,0,null,0]]    
            if(data[1] == 'fln' && data [2][5] == (bidAmount*-1)){
                expect(data).to.not.be.null
                console.log(`fln message:`,JSON.stringify(data))

                takenFunding2 = data[2][0]

                //Assert data against Schema
                SchemaAssertions.assertFundingLoansSchema(data[2])

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)
                
                } 

            // Target the oc message [0,"fon",[41245492,"fUSD",1588164953000,1588164953000,50,50,"LIMIT",null,null,null,"ACTIVE",null,null,null,0.005,2,0,0,null,0,null]]
            //[0,"foc",[41245527,"fUSD",1588169273000,1588169273000,0,-50,"FRRDELTAVAR",null,null,null,"EXECUTED at FRR delta (50.0)",null,null,null,0,2,0,0,null,0,null]]    
            if(data[1] == 'foc'){
                expect(data).to.not.be.null
                console.log(`foc message:`,JSON.stringify(data))

                //Assert data against Schema
                SchemaAssertions.assertOffersSchema(data[2])

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //Symbol
                expect(data[2][1]).to.equal(symbol)

                //Amount
                expect(data[2][4]).to.equal(0)

                //Amount Orig
                expect(data[2][5]).to.equal(bidAmount)

                //Offer Type
                expect(data[2][6]).to.equal('FRRDELTAVAR')

                //Status
                expect(data[2][10]).to.be.a('string')
                expect(data[2][10]).to.contain('EXECUTED')

                //Rate
                expect(data[2][14]).to.equal(0.00001)

                //Period
                expect(data[2][15]).to.equal(period)

                //Hidden
                expect(data[2][17]).to.equal(0)

                //Renew
                expect(data[2][19]).to.equal(0)

                done()
                }    
            }
        });

        it('New FRR Fixed Offer should return a correct Notification and Funding Offer Info message', function(done) {

        this.timeout(10000)

            let payload = JSON.stringify([
                0,
                "fon",
                null,
                {
                "type": "FRRDELTAFIX",
                "symbol": symbol,
                "amount": offerAmount.toString(),
                "rate": "0.00002",
                "period": period
                }
                ])

            NewOfferSocket.send(payload);

        NewOfferSocket.onmessage = function (event) {
            let data = JSON.parse(event.data)
            
            // Target the n message [0,"n",[1588164952587,"fon-req",null,null,[41245492,null,null,null,50,null,null,null,null,null,null,null,null,null,0.005,2,null,null,null,null,null],null,"SUCCESS","Submitting funding offer of 50.0 USD at 0.5000 for 2 days."]]      

            if(data[1] == 'n'){
                expect(data).to.not.be.null
                console.log(`n message:`,JSON.stringify(data))

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //MTS Timestamp of Notification
                expect(data[2][0]).to.be.a('number')

                //Type 
                expect(data[2][1]).to.equal('fon-req')

                //Status
                expect(data[2][6]).to.equal('SUCCESS')

                //Text
                expect(data[2][7]).to.equal('Submitting funding offer of '+offerAmount+'.0 '+symbolNice+' at FRR 0.002000 for '+period+' days.')

                //Funding ID
                expect(data[2][4][0]).to.be.a('number')

                //Placeholder
                expect(data[2][4][1]).to.be.null

                //Placeholder
                expect(data[2][4][2]).to.be.null

                //Placeholder
                expect(data[2][4][3]).to.be.null

                //Amount
                expect(data[2][4][4]).to.equal(offerAmount)

                //Placeholder
                expect(data[2][4][5]).to.be.null

                //Placeholder
                expect(data[2][4][6]).to.be.null

                //Placeholder
                expect(data[2][4][7]).to.be.null

                //Placeholder
                expect(data[2][4][8]).to.be.null

                //Placeholder
                expect(data[2][4][9]).to.be.null

                //Placeholder
                expect(data[2][4][10]).to.be.null

                //Placeholder
                expect(data[2][4][11]).to.be.null

                //Placeholder
                expect(data[2][4][12]).to.be.null

                //Placeholder
                expect(data[2][4][13]).to.be.null

                //Rate
                expect(data[2][4][14]).to.equal(0.00002)

                //Period
                expect(data[2][4][15]).to.equal(period)

                //Placeholder
                expect(data[2][4][16]).to.be.null

                //Placeholder
                expect(data[2][4][17]).to.be.null

                //Placeholder
                expect(data[2][4][18]).to.be.null

                //Placeholder
                expect(data[2][4][19]).to.be.null

                //Placeholder
                expect(data[2][4][20]).to.be.null

                } 

            // Target the fon message [0,"fon",[41245492,"fUSD",1588164953000,1588164953000,50,50,"LIMIT",null,null,null,"ACTIVE",null,null,null,0.005,2,0,0,null,0,null]]
            if(data[1] == 'fon'){
                expect(data).to.not.be.null
                console.log(`fon message:`,JSON.stringify(data))

                //Assert data against Schema
                SchemaAssertions.assertOffersSchema(data[2])

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //Symbol
                expect(data[2][1]).to.equal(symbol)

                //Amount
                expect(data[2][4]).to.equal(offerAmount)

                //Amount Orig
                expect(data[2][5]).to.equal(offerAmount)

                //Offer Type
                expect(data[2][6]).to.equal('FRRDELTAFIX')

                //Status
                expect(data[2][10]).to.equal('ACTIVE')

                //Rate
                expect(data[2][14]).to.equal(0.00002)

                //Period
                expect(data[2][15]).to.equal(period)

                //Hidden
                expect(data[2][17]).to.equal(0)

                //Renew
                expect(data[2][19]).to.equal(0)

                done()
                }    
            }
        });

it('New FRR Fixed Bid should return a correct Notification and Funding Offer Info message', function(done) {

        this.timeout(10000)

            let payload = JSON.stringify([
                0,
                "fon",
                null,
                {
                "type": "FRRDELTAFIX",
                "symbol": symbol,
                "amount": bidAmount.toString(),
                "rate": "0.00002",
                "period": period
                }
                ])

            NewOfferSocket.send(payload);

        NewOfferSocket.onmessage = function (event) {
            let data = JSON.parse(event.data)
            
            // Target the n message [0,"n",[1588164952587,"fon-req",null,null,[41245492,null,null,null,50,null,null,null,null,null,null,null,null,null,0.005,2,null,null,null,null,null],null,"SUCCESS","Submitting funding offer of 50.0 USD at 0.5000 for 2 days."]]      

            if(data[1] == 'n'){
                expect(data).to.not.be.null
                console.log(`n message:`,JSON.stringify(data))

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //MTS Timestamp of Notification
                expect(data[2][0]).to.be.a('number')

                //Type 
                expect(data[2][1]).to.equal('fon-req')

                //Status
                expect(data[2][6]).to.equal('SUCCESS')

                //Text
                expect(data[2][7]).to.equal('Submitting funding bid of '+bidAmount*-1+'.0 '+symbolNice+' at FRR 0.002000 for '+period+' days.')

                //Funding ID
                expect(data[2][4][0]).to.be.a('number')

                //Placeholder
                expect(data[2][4][1]).to.be.null

                //Placeholder
                expect(data[2][4][2]).to.be.null

                //Placeholder
                expect(data[2][4][3]).to.be.null

                //Amount
                expect(data[2][4][4]).to.equal(bidAmount)

                //Placeholder
                expect(data[2][4][5]).to.be.null

                //Placeholder
                expect(data[2][4][6]).to.be.null

                //Placeholder
                expect(data[2][4][7]).to.be.null

                //Placeholder
                expect(data[2][4][8]).to.be.null

                //Placeholder
                expect(data[2][4][9]).to.be.null

                //Placeholder
                expect(data[2][4][10]).to.be.null

                //Placeholder
                expect(data[2][4][11]).to.be.null

                //Placeholder
                expect(data[2][4][12]).to.be.null

                //Placeholder
                expect(data[2][4][13]).to.be.null

                //Rate
                expect(data[2][4][14]).to.equal(0.00002)

                //Period
                expect(data[2][4][15]).to.equal(period)

                //Placeholder
                expect(data[2][4][16]).to.be.null

                //Placeholder
                expect(data[2][4][17]).to.be.null

                //Placeholder
                expect(data[2][4][18]).to.be.null

                //Placeholder
                expect(data[2][4][19]).to.be.null

                //Placeholder
                expect(data[2][4][20]).to.be.null

                } 

            // Target the fln message [0,"fln",[2996371,"fUSD",-1,1588244240000,1588244240000,50,0,"ACTIVE","VAR",null,null,0,4,1588244240000,1588244240000,null,0,null,0,null,0]]    
            if(data[1] == 'fln' && data [2][5] == (bidAmount*-1)){
                expect(data).to.not.be.null
                console.log(`fln message:`,JSON.stringify(data))

                takenFunding3 = data[2][0]

                //Assert data against Schema
                SchemaAssertions.assertFundingLoansSchema(data[2])

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)
                
                } 

            //Target the foc message [0,"foc",[41246215,"fUST",1588673394000,1588673394000,0,-100,"FRRDELTAFIX",null,null,null,"EXECUTED at 0.0099% (100.0)",null,null,null,0.00001,2,0,0,null,0,null]]  
            if(data[1] == 'foc' && data[2][5] == bidAmount){
                expect(data).to.not.be.null
                console.log(`foc message:`,JSON.stringify(data))

                //Assert data against Schema
                SchemaAssertions.assertOffersSchema(data[2])

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //Symbol
                expect(data[2][1]).to.equal(symbol)

                //Amount
                expect(data[2][4]).to.equal(0)

                //Amount Orig
                expect(data[2][5]).to.equal(bidAmount)

                //Offer Type
                expect(data[2][6]).to.equal('FRRDELTAFIX')

                //Status
                expect(data[2][10]).to.be.a('string')
                .and.to.contain('EXECUTED')

                //Rate
                expect(data[2][14]).to.equal(0.00002)

                //Period
                expect(data[2][15]).to.equal(period)

                //Hidden
                expect(data[2][17]).to.equal(0)

                //Renew
                expect(data[2][19]).to.equal(0)

                done()
                }    
            }
        });

        it('Hidden Offer should return a correct Notification and Funding Offer Info message', function(done) {

        this.timeout(10000)

            let payload = JSON.stringify([
                0,
                "fon",
                null,
                {
                "type": "LIMIT",
                "symbol": symbol,
                "amount": offerAmount.toString(),
                "rate": offerRate.toString(),
                "period": period,
                "flags": 64
                }
                ])

            NewOfferSocket.send(payload);
          
        NewOfferSocket.onmessage = function (event) {
            let data = JSON.parse(event.data)
            
            // Target the n message [0,"n",[1588667670908,"fon-req",null,null,[41245965,null,null,null,50,null,null,null,null,null,null,null,null,null,0.005,2,null,null,null,null,null],null,"SUCCESS","Submitting funding offer of 50.0 USD at 0.5000 for 2 days."]]     

            if(data[1] == 'n'){
                expect(data).to.not.be.null
                console.log(`n message:`,JSON.stringify(data))

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //MTS Timestamp of Notification
                expect(data[2][0]).to.be.a('number')

                //Type 
                expect(data[2][1]).to.equal('fon-req')

                //Status
                expect(data[2][6]).to.equal('SUCCESS')

                //Text
                expect(data[2][7]).to.equal('Submitting funding offer of '+offerAmount+'.0 '+symbolNice+' at '+offerRate*100+'000 for '+period+' days.')

                //Funding ID
                expect(data[2][4][0]).to.be.a('number')

                //Placeholder
                expect(data[2][4][1]).to.be.null

                //Placeholder
                expect(data[2][4][2]).to.be.null

                //Placeholder
                expect(data[2][4][3]).to.be.null

                //Amount
                expect(data[2][4][4]).to.equal(offerAmount)

                //Placeholder
                expect(data[2][4][5]).to.be.null

                //Placeholder
                expect(data[2][4][6]).to.be.null

                //Placeholder
                expect(data[2][4][7]).to.be.null

                //Placeholder
                expect(data[2][4][8]).to.be.null

                //Placeholder
                expect(data[2][4][9]).to.be.null

                //Placeholder
                expect(data[2][4][10]).to.be.null

                //Placeholder
                expect(data[2][4][11]).to.be.null

                //Placeholder
                expect(data[2][4][12]).to.be.null

                //Placeholder
                expect(data[2][4][13]).to.be.null

                //Rate
                expect(data[2][4][14]).to.equal(offerRate)

                //Period
                expect(data[2][4][15]).to.equal(period)

                //Placeholder
                expect(data[2][4][16]).to.be.null

                //Placeholder
                expect(data[2][4][17]).to.be.null

                //Placeholder
                expect(data[2][4][18]).to.be.null

                //Placeholder
                expect(data[2][4][19]).to.be.null

                //Placeholder
                expect(data[2][4][20]).to.be.null

                } 

            // Target the fon message [0,"fon",[41245965,"fUSD",1588667671000,1588667671000,50,50,"LIMIT",null,null,64,"ACTIVE",null,null,null,0.005,2,0,1,null,0,null]]
            if(data[1] == 'fon'){
                expect(data).to.not.be.null
                console.log(`fon message:`,JSON.stringify(data))

                //Assert data against Schema
                SchemaAssertions.assertOffersSchema(data[2])

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //Symbol
                expect(data[2][1]).to.equal(symbol)

                //Amount
                expect(data[2][4]).to.equal(offerAmount)

                //Amount Orig
                expect(data[2][5]).to.equal(offerAmount)

                //Offer Type
                expect(data[2][6]).to.equal('LIMIT')

                //Placeholder
                expect(data[2][7]).to.be.null

                //Placeholder
                expect(data[2][8]).to.be.null

                //Flags
                expect(data[2][9]).to.equal(64)

                //Status
                expect(data[2][10]).to.equal('ACTIVE')

                //Rate
                expect(data[2][14]).to.equal(offerRate)

                //Period
                expect(data[2][15]).to.equal(period)

                //Hidden
                expect(data[2][17]).to.equal(1)

                //Renew
                expect(data[2][19]).to.equal(0)

                done()
                }    
            }
        });

        it('Cancel single offer should return a correct Notification and Funding Offer Cancel message', function(done) {

        this.timeout(10000)

            let payload = JSON.stringify([
                0,
                "foc",
                null,
                {
                "id": bidId
                }
                ])

            NewOfferSocket.send(payload);
          
        NewOfferSocket.onmessage = function (event) {
            let data = JSON.parse(event.data)
            
            // Target the foc message [0,"foc",[41246459,"fUST",1588676068000,1588676069000,50,150,"FRRDELTAVAR",null,null,null,"CANCELED",null,null,null,0,30,0,0,null,0,null]] 
            if(data[1] == 'foc' && data[2][0] == bidId){
                expect(data).to.not.be.null
                console.log(`fon message:`,JSON.stringify(data))

                //Assert data against Schema
                SchemaAssertions.assertOffersSchema(data[2])

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //Funding ID
                expect(data[2][0]).to.equal(bidId)

                //Symbol
                expect(data[2][1]).to.equal(symbol)

                //Amount
                expect(data[2][4]).to.equal(bidAmount)

                //Amount Orig
                expect(data[2][5]).to.equal(bidAmount)

                //Offer Type
                expect(data[2][6]).to.equal('LIMIT')

                //Status
                expect(data[2][10]).to.equal('CANCELED')

                //Rate
                expect(data[2][14]).to.equal(bidRate)

                //Period
                expect(data[2][15]).to.equal(period)

                //Hidden
                expect(data[2][17]).to.equal(0)

                //Renew
                expect(data[2][19]).to.equal(0)

                done()
                }    
            }
        });

        it('Cancel All Offers should return a correct Funding Offer Cancel message', function(done) {

        this.timeout(10000)

            let body = {}
            let apiPath = 'v2/auth/w/funding/offer/cancel/all'
            let signature = `/api/${apiPath}${authNonce}${JSON.stringify(body)}` // Consists of the complete url, nonce, and request body
            const sig = crypto.HmacSHA384(signature, apiSecret).toString() // The authentication signature is hashed using the private key

            const cancelAll = {
              url: `${restUrl}${apiPath}`,
              headers: {
                'bfx-nonce': authNonce,
                'bfx-apikey': apiKey,
                'bfx-signature': sig
              },
              body: body,
              json: true
            }

            request.post(cancelAll, (error, response, body) => {
              console.log(`Cancel All Body:`,body); // Logs the response body
            })
          
        NewOfferSocket.onmessage = function (event) {
            let data = JSON.parse(event.data)
        
            // Target the foc message [0,"foc",[41246459,"fUST",1588676068000,1588676069000,50,150,"FRRDELTAVAR",null,null,null,"CANCELED",null,null,null,0,30,0,0,null,0,null]]    
            if(data[1] == 'foc' && data[2][0] == offerId){
                expect(data).to.not.be.null
                console.log(`foc message:`,JSON.stringify(data))

                //Assert data against Schema
                SchemaAssertions.assertOffersSchema(data[2])

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //Funding ID
                expect(data[2][0]).to.equal(offerId)

                //Symbol
                expect(data[2][1]).to.equal(symbol)

                //Amount
                expect(data[2][4]).to.equal(offerAmount)

                //Amount Orig
                expect(data[2][5]).to.equal(offerAmount*3)

                //Offer Type
                expect(data[2][6]).to.equal('FRRDELTAVAR')

                //Status
                expect(data[2][10]).to.equal('CANCELED')

                //Rate
                expect(data[2][14]).to.equal(0)

                //Period
                expect(data[2][15]).to.equal(period)

                //Hidden
                expect(data[2][17]).to.equal(0)

                //Renew
                expect(data[2][19]).to.equal(0)

                done()
                }       
            }
        });

        it('Calc Funding Sym should return a correct Funding Info message', function(done) {

        this.timeout(10000)

        let payload = JSON.stringify([
                0,
                "calc",
                null,
                [
                ["funding_sym_fUST"]
                ]
                ])

            NewOfferSocket.send(payload);

        NewOfferSocket.onmessage = function (event) {
            let data = JSON.parse(event.data)

            // Target the fiu message [0,"fiu",["sym","fUST",[0.0005959698630136986,0.0008444547945205479,20.66662037037037,29.999953703703703]]]     
            if(data[1] == 'fiu'){
                expect(data).to.not.be.null
                console.log(`fiu message:`,JSON.stringify(data))

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //Type
                expect(data[2][0]).to.equal('sym')

                //Symbol
                expect(data[2][1]).to.equal(symbol)

                //Loan Yield
                expect(data[2][2][0]).to.be.a('number')

                //Lend Yield
                expect(data[2][2][1]).to.be.a('number')

                //Loan Duration
                expect(data[2][2][2]).to.be.a('number')

                //Lend Duration
                expect(data[2][2][3]).to.be.a('number')

                done()
                
                }
            }
        });

        it('Close Taken Funding 1 should return a correct Funding Close message', function(done) {

        this.timeout(10000)

            //Close Funding Offer 1
            let body = {"id": takenFunding1}
            let apiPath = 'v2/auth/w/funding/close'
            let signature = `/api/${apiPath}${authNonce}${JSON.stringify(body)}` // Consists of the complete url, nonce, and request body
            const sig = crypto.HmacSHA384(signature, apiSecret).toString() // The authentication signature is hashed using the private key

            const closeFunding = {
              url: `${restUrl}${apiPath}`,
              headers: {
                'bfx-nonce': authNonce,
                'bfx-apikey': apiKey,
                'bfx-signature': sig
              },
              body: body,
              json: true
            }


            request.post(closeFunding, (error, response, body) => {
              console.log(`Close Funding Body:`,body); // Logs the response body
            })

        let counter = 0 // Set counter to 0

        NewOfferSocket.onmessage = function (event) {
            let data = JSON.parse(event.data)
            // Target the flc message [0,"flc",[2996781,"fUST",0,1588684682000,1588684682000,50,0,"CLOSED","VAR",null,null,0,30,1588684682000,1588684682000,null,0,null,0,null,0]]  
            if(data[1] == 'flc' && data[2][0] == takenFunding1){
                expect(data).to.not.be.null
                console.log(`flc message:`,JSON.stringify(data))

                //Assert data against Schema
                SchemaAssertions.assertFundingLoansSchema(data[2])

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //Symbol
                expect(data[2][1]).to.equal(symbol)

                //Amount
                expect(data[2][5]).to.equal(bidAmount*-1)

                //Flags
                expect(data[2][6]).to.equal(0)

                //Status
                expect(data[2][7]).to.equal('CLOSED')

                //Type
                expect(data[2][8]).to.equal('VAR')

                //Period
                expect(data[2][12]).to.be.at.least(period)

                //Renew
                expect(data[2][18]).to.equal(0)

                //No Close
                expect(data[2][20]).to.equal(0)

                counter++ // After receiving the message, increase counter
                
                }
            
                if(counter == 1) // Enough messages are received
                done()
            }
        });

        it('Close Taken Funding 2 should return a correct Funding Close message', function(done) {

        this.timeout(10000)

            //Close Funding Offer 2
            let body = {"id": takenFunding2}
            let apiPath = 'v2/auth/w/funding/close'
            let signature = `/api/${apiPath}${authNonce}${JSON.stringify(body)}` // Consists of the complete url, nonce, and request body
            const sig = crypto.HmacSHA384(signature, apiSecret).toString() // The authentication signature is hashed using the private key

            const closeFunding = {
              url: `${restUrl}${apiPath}`,
              headers: {
                'bfx-nonce': authNonce,
                'bfx-apikey': apiKey,
                'bfx-signature': sig
              },
              body: body,
              json: true
            }


            request.post(closeFunding, (error, response, body) => {
              console.log(`Close Funding Body:`,body); // Logs the response body
            })

        let counter = 0 // Set counter to 0

        NewOfferSocket.onmessage = function (event) {
            let data = JSON.parse(event.data)
            // Target the flc message [0,"flc",[2996610,"fUST",0,1588679096000,1588679096000,50,0,"CLOSED","VAR",null,null,0,30,1588679096000,1588679096000,null,0,null,0,null,0]]  
            if(data[1] == 'flc' && data[2][0] == takenFunding2){
                expect(data).to.not.be.null
                console.log(`flc message:`,JSON.stringify(data))

                //Assert data against Schema
                SchemaAssertions.assertFundingLoansSchema(data[2])

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //Symbol
                expect(data[2][1]).to.equal(symbol)

                //Amount
                expect(data[2][5]).to.equal(bidAmount*-1)

                //Flags
                expect(data[2][6]).to.equal(0)

                //Status
                expect(data[2][7]).to.equal('CLOSED')

                //Type
                expect(data[2][8]).to.equal('VAR')

                //Period
                expect(data[2][12]).to.be.at.least(period)

                //Renew
                expect(data[2][18]).to.equal(0)

                //No Close
                expect(data[2][20]).to.equal(0)

                counter++ // After receiving the message, increase counter
                
                }
            
                if(counter == 1) // Enough messages are received
                done()
            }
    
        });

        it('Close Taken Funding 3 should return a correct Funding Close message', function(done) {

        this.timeout(10000)

            //Close Funding Offer 3
            let body = {"id": takenFunding3}
            let apiPath = 'v2/auth/w/funding/close'
            let signature = `/api/${apiPath}${authNonce}${JSON.stringify(body)}` // Consists of the complete url, nonce, and request body
            const sig = crypto.HmacSHA384(signature, apiSecret).toString() // The authentication signature is hashed using the private key

            const closeFunding = {
              url: `${restUrl}${apiPath}`,
              headers: {
                'bfx-nonce': authNonce,
                'bfx-apikey': apiKey,
                'bfx-signature': sig
              },
              body: body,
              json: true
            }

            request.post(closeFunding, (error, response, body) => {
              console.log(`Close Funding Body:`,body); // Logs the response body
            })
        
        let counter = 0 // Set counter to 0

        NewOfferSocket.onmessage = function (event) {
            let data = JSON.parse(event.data)
            // Target the flc message [0,"flc",[2996610,"fUST",0,1588679096000,1588679096000,50,0,"CLOSED","VAR",null,null,0,30,1588679096000,1588679096000,null,0,null,0,null,0]]  
            if(data[1] == 'flc' && data[2][0] == takenFunding3){
                expect(data).to.not.be.null
                console.log(`flc message:`,JSON.stringify(data))

                //Assert data against Schema
                SchemaAssertions.assertFundingLoansSchema(data[2])

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //Symbol
                expect(data[2][1]).to.equal(symbol)

                //Amount
                expect(data[2][5]).to.equal(bidAmount*-1)

                //Flags
                expect(data[2][6]).to.equal(0)

                //Status
                expect(data[2][7]).to.equal('CLOSED')

                //Type
                expect(data[2][8]).to.equal('FIXED')

                //Period
                expect(data[2][12]).to.be.at.least(period)

                //Renew
                expect(data[2][18]).to.equal(0)

                //No Close
                expect(data[2][20]).to.equal(0)

                counter++ // After receiving the message, increase counter
                
                }
            
                if(counter == 1)  // Enough messages are received
                done()
                NewOfferSocket.close();
            }
    
        });

    })