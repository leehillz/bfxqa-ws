const WebSocket = require('ws');
const fs = require('fs');
const expect = require('chai').expect;
const ws_url = require('../config.json').ws_url
const crypto = require('crypto-js') // Standard JavaScript cryptography library
const apiKey = require('../config.json').api_key
const apiSecret = require('../config.json').api_secret

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
    //dms: 4, // Optional Deam-Man-Switch flag to cancel all orders when socket is closed
    //filter: [] // Optional filter for the account info received (default = everything)
}

//Settings
const symbol = 'fUSD'
const symbolNice = symbol.substr(1,3)
const offerAmount = 50
const bidAmount = -50
const offerRate = 0.005
const bidRate = 0.00001
const period = 2

//Sleep timer
function sleep(milliseconds) {
  const date = Date.now();
  let currentDate = null;
  do {
    currentDate = Date.now();
  } while (currentDate - date < milliseconds);
}

describe('New Funding Offer Tests', function() {
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

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //MTS Timestamp of Notification
                expect(data[2][0]).to.be.a('number')
                expect(data[2][0]).to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Type 
                expect(data[2][1]).to.be.a('string')
                expect(data[2][1]).to.equal('fon-req')

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
                expect(data[2][7]).to.equal('Submitting funding offer of '+offerAmount+'.0 '+symbolNice+' at '+offerRate*100+'000 for '+period+' days.')

                //Funding ID
                expect(data[2][4][0]).to.be.a('number')
                expect(data[2][4][0]).to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Placeholder
                expect(data[2][4][1]).to.be.a('null')

                //Placeholder
                expect(data[2][4][2]).to.be.a('null')

                //Placeholder
                expect(data[2][4][3]).to.be.a('null')

                //Amount
                expect(data[2][4][4]).to.be.a('number')
                expect(data[2][4][4]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][4][4]).to.equal(offerAmount)

                //Placeholder
                expect(data[2][4][5]).to.be.a('null')

                //Placeholder
                expect(data[2][4][6]).to.be.a('null')

                //Placeholder
                expect(data[2][4][7]).to.be.a('null')

                //Placeholder
                expect(data[2][4][8]).to.be.a('null')

                //Placeholder
                expect(data[2][4][9]).to.be.a('null')

                //Placeholder
                expect(data[2][4][10]).to.be.a('null')

                //Placeholder
                expect(data[2][4][11]).to.be.a('null')

                //Placeholder
                expect(data[2][4][12]).to.be.a('null')

                //Placeholder
                expect(data[2][4][13]).to.be.a('null')

                //Rate
                expect(data[2][4][14]).to.be.a('number')
                expect(data[2][4][14]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][4][14]).to.equal(offerRate)

                //Period
                expect(data[2][4][15]).to.be.a('number')
                expect(data[2][4][15]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][4][15]).to.equal(period)

                //Placeholder
                expect(data[2][4][16]).to.be.a('null')

                //Placeholder
                expect(data[2][4][17]).to.be.a('null')

                //Placeholder
                expect(data[2][4][18]).to.be.a('null')

                //Placeholder
                expect(data[2][4][19]).to.be.a('null')

                //Placeholder
                expect(data[2][4][20]).to.be.a('null')

                console.log(`n message:`,JSON.stringify(data))
                } 

            // Target the on message [0,"fon",[41245492,"fUSD",1588164953000,1588164953000,50,50,"LIMIT",null,null,null,"ACTIVE",null,null,null,0.005,2,0,0,null,0,null]]
            if(data[1] == 'fon'){
                //NewOfferSocket.close();
                expect(data).to.not.be.null

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //Funding ID
                expect(data[2][0]).to.be.a('number')
                expect(data[2][0]).to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Symbol
                expect(data[2][1]).to.be.a('string')
                expect(data[2][1]).to.equal(symbol)

                //MTS Create
                expect(data[2][2]).to.be.a('number')
                expect(data[2][2]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][2]).to.match(/^(\d{13})?$/)

                //MTS Update
                expect(data[2][3]).to.be.a('number')
                expect(data[2][3]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][3]).to.match(/^(\d{13})?$/)

                //Amount
                expect(data[2][4]).to.be.a('number')
                expect(data[2][4]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][4]).to.equal(offerAmount)

                //Amount Orig
                expect(data[2][5]).to.be.a('number')
                expect(data[2][5]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][5]).to.equal(offerAmount)

                //Offer Type
                expect(data[2][6]).to.be.a('string')
                expect(data[2][6]).to.equal('LIMIT')

                //Placeholder
                expect(data[2][7]).to.be.a('null')

                //Placeholder
                expect(data[2][8]).to.be.a('null')

                //Placeholder
                expect(data[2][9]).to.be.a('null')

                //Status
                expect(data[2][10]).to.be.a('string')
                expect(data[2][10]).to.equal('ACTIVE')

                //Placeholder
                expect(data[2][11]).to.be.a('null')

                //Placeholder
                expect(data[2][12]).to.be.a('null')

                //Placeholder
                expect(data[2][13]).to.be.a('null')

                //Rate
                expect(data[2][14]).to.be.a('number')
                expect(data[2][14]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][14]).to.equal(offerRate)

                //Period
                expect(data[2][15]).to.be.a('number')
                expect(data[2][15]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][15]).to.equal(period)

                //Notify
                expect(data[2][16]).to.be.a('number')
                expect(data[2][16]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][16]).to.equal(0)

                //Hidden
                expect(data[2][17]).to.be.a('number')
                expect(data[2][17]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][17]).to.equal(0)

                //Placeholder
                expect(data[2][18]).to.be.a('null')

                //Renew
                expect(data[2][19]).to.be.a('number')
                expect(data[2][19]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][19]).to.equal(0)

                //Placeholder
                expect(data[2][20]).to.be.a('null')

                
                console.log(`fon message:`,JSON.stringify(data))
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

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //MTS Timestamp of Notification
                expect(data[2][0]).to.be.a('number')
                expect(data[2][0]).to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Type 
                expect(data[2][1]).to.be.a('string')
                expect(data[2][1]).to.equal('fon-req')

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
                expect(data[2][7]).to.equal('Submitting funding bid of '+bidAmount*-1+'.0 '+symbolNice+' at '+bidRate*100+'000 for '+period+' days.')

                //Funding ID
                expect(data[2][4][0]).to.be.a('number')
                expect(data[2][4][0]).to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Placeholder
                expect(data[2][4][1]).to.be.a('null')

                //Placeholder
                expect(data[2][4][2]).to.be.a('null')

                //Placeholder
                expect(data[2][4][3]).to.be.a('null')

                //Amount
                expect(data[2][4][4]).to.be.a('number')
                expect(data[2][4][4]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][4][4]).to.equal(bidAmount)

                //Placeholder
                expect(data[2][4][5]).to.be.a('null')

                //Placeholder
                expect(data[2][4][6]).to.be.a('null')

                //Placeholder
                expect(data[2][4][7]).to.be.a('null')

                //Placeholder
                expect(data[2][4][8]).to.be.a('null')

                //Placeholder
                expect(data[2][4][9]).to.be.a('null')

                //Placeholder
                expect(data[2][4][10]).to.be.a('null')

                //Placeholder
                expect(data[2][4][11]).to.be.a('null')

                //Placeholder
                expect(data[2][4][12]).to.be.a('null')

                //Placeholder
                expect(data[2][4][13]).to.be.a('null')

                //Rate
                expect(data[2][4][14]).to.be.a('number')
                expect(data[2][4][14]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][4][14]).to.equal(bidRate)

                //Period
                expect(data[2][4][15]).to.be.a('number')
                expect(data[2][4][15]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][4][15]).to.equal(period)

                //Placeholder
                expect(data[2][4][16]).to.be.a('null')

                //Placeholder
                expect(data[2][4][17]).to.be.a('null')

                //Placeholder
                expect(data[2][4][18]).to.be.a('null')

                //Placeholder
                expect(data[2][4][19]).to.be.a('null')

                //Placeholder
                expect(data[2][4][20]).to.be.a('null')

                console.log(`n message:`,JSON.stringify(data))
                } 

            // Target the on message [0,"fon",[41245492,"fUSD",1588164953000,1588164953000,50,50,"LIMIT",null,null,null,"ACTIVE",null,null,null,0.005,2,0,0,null,0,null]]
            if(data[1] == 'fon'){
                //NewOfferSocket.close();
                expect(data).to.not.be.null

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //Funding ID
                expect(data[2][0]).to.be.a('number')
                expect(data[2][0]).to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Symbol
                expect(data[2][1]).to.be.a('string')
                expect(data[2][1]).to.equal(symbol)

                //MTS Create
                expect(data[2][2]).to.be.a('number')
                expect(data[2][2]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][2]).to.match(/^(\d{13})?$/)

                //MTS Update
                expect(data[2][3]).to.be.a('number')
                expect(data[2][3]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][3]).to.match(/^(\d{13})?$/)

                //Amount
                expect(data[2][4]).to.be.a('number')
                expect(data[2][4]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][4]).to.equal(bidAmount)

                //Amount Orig
                expect(data[2][5]).to.be.a('number')
                expect(data[2][5]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][5]).to.equal(bidAmount)

                //Offer Type
                expect(data[2][6]).to.be.a('string')
                expect(data[2][6]).to.equal('LIMIT')

                //Placeholder
                expect(data[2][7]).to.be.a('null')

                //Placeholder
                expect(data[2][8]).to.be.a('null')

                //Placeholder
                expect(data[2][9]).to.be.a('null')

                //Status
                expect(data[2][10]).to.be.a('string')
                expect(data[2][10]).to.equal('ACTIVE')

                //Placeholder
                expect(data[2][11]).to.be.a('null')

                //Placeholder
                expect(data[2][12]).to.be.a('null')

                //Placeholder
                expect(data[2][13]).to.be.a('null')

                //Rate
                expect(data[2][14]).to.be.a('number')
                expect(data[2][14]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][14]).to.equal(bidRate)

                //Period
                expect(data[2][15]).to.be.a('number')
                expect(data[2][15]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][15]).to.equal(period)

                //Notify
                expect(data[2][16]).to.be.a('number')
                expect(data[2][16]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][16]).to.equal(0)

                //Hidden
                expect(data[2][17]).to.be.a('number')
                expect(data[2][17]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][17]).to.equal(0)

                //Placeholder
                expect(data[2][18]).to.be.a('null')

                //Renew
                expect(data[2][19]).to.be.a('number')
                expect(data[2][19]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][19]).to.equal(0)

                //Placeholder
                expect(data[2][20]).to.be.a('null')

                
                console.log(`fon message:`,JSON.stringify(data))
                done()
                }    
            }
        });

        it('New FRR Offer should return a correct Notification and Funding Offer Info message', function(done) {

        this.timeout(10000)

            let payload = JSON.stringify([
                0,
                "fon",
                null,
                {
                "type": "FRRDELTAVAR",
                "symbol": symbol,
                "amount": offerAmount.toString(),
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

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //MTS Timestamp of Notification
                expect(data[2][0]).to.be.a('number')
                expect(data[2][0]).to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Type 
                expect(data[2][1]).to.be.a('string')
                expect(data[2][1]).to.equal('fon-req')

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
                expect(data[2][7]).to.equal('Submitting funding offer of '+offerAmount+'.0 '+symbolNice+' at FRR 0.0000 for '+period+' days.')

                //Funding ID
                expect(data[2][4][0]).to.be.a('number')
                expect(data[2][4][0]).to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Placeholder
                expect(data[2][4][1]).to.be.a('null')

                //Placeholder
                expect(data[2][4][2]).to.be.a('null')

                //Placeholder
                expect(data[2][4][3]).to.be.a('null')

                //Amount
                expect(data[2][4][4]).to.be.a('number')
                expect(data[2][4][4]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][4][4]).to.equal(offerAmount)

                //Placeholder
                expect(data[2][4][5]).to.be.a('null')

                //Placeholder
                expect(data[2][4][6]).to.be.a('null')

                //Placeholder
                expect(data[2][4][7]).to.be.a('null')

                //Placeholder
                expect(data[2][4][8]).to.be.a('null')

                //Placeholder
                expect(data[2][4][9]).to.be.a('null')

                //Placeholder
                expect(data[2][4][10]).to.be.a('null')

                //Placeholder
                expect(data[2][4][11]).to.be.a('null')

                //Placeholder
                expect(data[2][4][12]).to.be.a('null')

                //Placeholder
                expect(data[2][4][13]).to.be.a('null')

                //Rate
                expect(data[2][4][14]).to.be.a('number')
                expect(data[2][4][14]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][4][14]).to.equal(0)

                //Period
                expect(data[2][4][15]).to.be.a('number')
                expect(data[2][4][15]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][4][15]).to.equal(period)

                //Placeholder
                expect(data[2][4][16]).to.be.a('null')

                //Placeholder
                expect(data[2][4][17]).to.be.a('null')

                //Placeholder
                expect(data[2][4][18]).to.be.a('null')

                //Placeholder
                expect(data[2][4][19]).to.be.a('null')

                //Placeholder
                expect(data[2][4][20]).to.be.a('null')

                console.log(`n message:`,JSON.stringify(data))
                } 

            // Target the on message [0,"fon",[41245492,"fUSD",1588164953000,1588164953000,50,50,"LIMIT",null,null,null,"ACTIVE",null,null,null,0.005,2,0,0,null,0,null]]
            if(data[1] == 'fon'){
                //NewOfferSocket.close();
                expect(data).to.not.be.null

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //Funding ID
                expect(data[2][0]).to.be.a('number')
                expect(data[2][0]).to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Symbol
                expect(data[2][1]).to.be.a('string')
                expect(data[2][1]).to.equal(symbol)

                //MTS Create
                expect(data[2][2]).to.be.a('number')
                expect(data[2][2]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][2]).to.match(/^(\d{13})?$/)

                //MTS Update
                expect(data[2][3]).to.be.a('number')
                expect(data[2][3]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][3]).to.match(/^(\d{13})?$/)

                //Amount
                expect(data[2][4]).to.be.a('number')
                expect(data[2][4]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][4]).to.equal(offerAmount)

                //Amount Orig
                expect(data[2][5]).to.be.a('number')
                expect(data[2][5]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][5]).to.equal(offerAmount)

                //Offer Type
                expect(data[2][6]).to.be.a('string')
                expect(data[2][6]).to.equal('FRRDELTAVAR')

                //Placeholder
                expect(data[2][7]).to.be.a('null')

                //Placeholder
                expect(data[2][8]).to.be.a('null')

                //Placeholder
                expect(data[2][9]).to.be.a('null')

                //Status
                expect(data[2][10]).to.be.a('string')
                expect(data[2][10]).to.equal('ACTIVE')

                //Placeholder
                expect(data[2][11]).to.be.a('null')

                //Placeholder
                expect(data[2][12]).to.be.a('null')

                //Placeholder
                expect(data[2][13]).to.be.a('null')

                //Rate
                expect(data[2][14]).to.be.a('number')
                expect(data[2][14]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][14]).to.equal(0)

                //Period
                expect(data[2][15]).to.be.a('number')
                expect(data[2][15]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][15]).to.equal(period)

                //Notify
                expect(data[2][16]).to.be.a('number')
                expect(data[2][16]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][16]).to.equal(0)

                //Hidden
                expect(data[2][17]).to.be.a('number')
                expect(data[2][17]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][17]).to.equal(0)

                //Placeholder
                expect(data[2][18]).to.be.a('null')

                //Renew
                expect(data[2][19]).to.be.a('number')
                expect(data[2][19]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][19]).to.equal(0)

                //Placeholder
                expect(data[2][20]).to.be.a('null')

                
                console.log(`fon message:`,JSON.stringify(data))
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

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //MTS Timestamp of Notification
                expect(data[2][0]).to.be.a('number')
                expect(data[2][0]).to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Type 
                expect(data[2][1]).to.be.a('string')
                expect(data[2][1]).to.equal('fon-req')

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
                expect(data[2][7]).to.equal('Submitting funding bid of '+bidAmount*-1+'.0 '+symbolNice+' at FRR 0.0000 for '+period+' days.')

                //Funding ID
                expect(data[2][4][0]).to.be.a('number')
                expect(data[2][4][0]).to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Placeholder
                expect(data[2][4][1]).to.be.a('null')

                //Placeholder
                expect(data[2][4][2]).to.be.a('null')

                //Placeholder
                expect(data[2][4][3]).to.be.a('null')

                //Amount
                expect(data[2][4][4]).to.be.a('number')
                expect(data[2][4][4]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][4][4]).to.equal(bidAmount)

                //Placeholder
                expect(data[2][4][5]).to.be.a('null')

                //Placeholder
                expect(data[2][4][6]).to.be.a('null')

                //Placeholder
                expect(data[2][4][7]).to.be.a('null')

                //Placeholder
                expect(data[2][4][8]).to.be.a('null')

                //Placeholder
                expect(data[2][4][9]).to.be.a('null')

                //Placeholder
                expect(data[2][4][10]).to.be.a('null')

                //Placeholder
                expect(data[2][4][11]).to.be.a('null')

                //Placeholder
                expect(data[2][4][12]).to.be.a('null')

                //Placeholder
                expect(data[2][4][13]).to.be.a('null')

                //Rate
                expect(data[2][4][14]).to.be.a('number')
                expect(data[2][4][14]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][4][14]).to.equal(0)

                //Period
                expect(data[2][4][15]).to.be.a('number')
                expect(data[2][4][15]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][4][15]).to.equal(period)

                //Placeholder
                expect(data[2][4][16]).to.be.a('null')

                //Placeholder
                expect(data[2][4][17]).to.be.a('null')

                //Placeholder
                expect(data[2][4][18]).to.be.a('null')

                //Placeholder
                expect(data[2][4][19]).to.be.a('null')

                //Placeholder
                expect(data[2][4][20]).to.be.a('null')

                console.log(`n message:`,JSON.stringify(data))
                } 

            // Target the oc message [0,"fon",[41245492,"fUSD",1588164953000,1588164953000,50,50,"LIMIT",null,null,null,"ACTIVE",null,null,null,0.005,2,0,0,null,0,null]]
            //[0,"foc",[41245527,"fUSD",1588169273000,1588169273000,0,-50,"FRRDELTAVAR",null,null,null,"EXECUTED at FRR delta (50.0)",null,null,null,0,2,0,0,null,0,null]]    
            if(data[1] == 'foc'){
                //NewOfferSocket.close();
                expect(data).to.not.be.null

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //Funding ID
                expect(data[2][0]).to.be.a('number')
                expect(data[2][0]).to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Symbol
                expect(data[2][1]).to.be.a('string')
                expect(data[2][1]).to.equal(symbol)

                //MTS Create
                expect(data[2][2]).to.be.a('number')
                expect(data[2][2]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][2]).to.match(/^(\d{13})?$/)

                //MTS Update
                expect(data[2][3]).to.be.a('number')
                expect(data[2][3]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][3]).to.match(/^(\d{13})?$/)

                //Amount
                expect(data[2][4]).to.be.a('number')
                expect(data[2][4]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][4]).to.equal(0)

                //Amount Orig
                expect(data[2][5]).to.be.a('number')
                expect(data[2][5]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][5]).to.equal(bidAmount)

                //Offer Type
                expect(data[2][6]).to.be.a('string')
                expect(data[2][6]).to.equal('FRRDELTAVAR')

                //Placeholder
                expect(data[2][7]).to.be.a('null')

                //Placeholder
                expect(data[2][8]).to.be.a('null')

                //Placeholder
                expect(data[2][9]).to.be.a('null')

                //Status
                expect(data[2][10]).to.be.a('string')
                expect(data[2][10]).to.contain('EXECUTED')

                //Placeholder
                expect(data[2][11]).to.be.a('null')

                //Placeholder
                expect(data[2][12]).to.be.a('null')

                //Placeholder
                expect(data[2][13]).to.be.a('null')

                //Rate
                expect(data[2][14]).to.be.a('number')
                expect(data[2][14]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][14]).to.equal(0)

                //Period
                expect(data[2][15]).to.be.a('number')
                expect(data[2][15]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][15]).to.equal(period)

                //Notify
                expect(data[2][16]).to.be.a('number')
                expect(data[2][16]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][16]).to.equal(0)

                //Hidden
                expect(data[2][17]).to.be.a('number')
                expect(data[2][17]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][17]).to.equal(0)

                //Placeholder
                expect(data[2][18]).to.be.a('null')

                //Renew
                expect(data[2][19]).to.be.a('number')
                expect(data[2][19]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][19]).to.equal(0)

                //Placeholder
                expect(data[2][20]).to.be.a('null')

                
                console.log(`fon message:`,JSON.stringify(data))
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

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //MTS Timestamp of Notification
                expect(data[2][0]).to.be.a('number')
                expect(data[2][0]).to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Type 
                expect(data[2][1]).to.be.a('string')
                expect(data[2][1]).to.equal('fon-req')

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
                expect(data[2][7]).to.equal('Submitting funding offer of '+offerAmount+'.0 '+symbolNice+' at FRR 0.001000 for '+period+' days.')

                //Funding ID
                expect(data[2][4][0]).to.be.a('number')
                expect(data[2][4][0]).to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Placeholder
                expect(data[2][4][1]).to.be.a('null')

                //Placeholder
                expect(data[2][4][2]).to.be.a('null')

                //Placeholder
                expect(data[2][4][3]).to.be.a('null')

                //Amount
                expect(data[2][4][4]).to.be.a('number')
                expect(data[2][4][4]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][4][4]).to.equal(offerAmount)

                //Placeholder
                expect(data[2][4][5]).to.be.a('null')

                //Placeholder
                expect(data[2][4][6]).to.be.a('null')

                //Placeholder
                expect(data[2][4][7]).to.be.a('null')

                //Placeholder
                expect(data[2][4][8]).to.be.a('null')

                //Placeholder
                expect(data[2][4][9]).to.be.a('null')

                //Placeholder
                expect(data[2][4][10]).to.be.a('null')

                //Placeholder
                expect(data[2][4][11]).to.be.a('null')

                //Placeholder
                expect(data[2][4][12]).to.be.a('null')

                //Placeholder
                expect(data[2][4][13]).to.be.a('null')

                //Rate
                expect(data[2][4][14]).to.be.a('number')
                expect(data[2][4][14]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][4][14]).to.equal(0.00001)

                //Period
                expect(data[2][4][15]).to.be.a('number')
                expect(data[2][4][15]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][4][15]).to.equal(period)

                //Placeholder
                expect(data[2][4][16]).to.be.a('null')

                //Placeholder
                expect(data[2][4][17]).to.be.a('null')

                //Placeholder
                expect(data[2][4][18]).to.be.a('null')

                //Placeholder
                expect(data[2][4][19]).to.be.a('null')

                //Placeholder
                expect(data[2][4][20]).to.be.a('null')

                console.log(`n message:`,JSON.stringify(data))
                } 

            // Target the on message [0,"fon",[41245492,"fUSD",1588164953000,1588164953000,50,50,"LIMIT",null,null,null,"ACTIVE",null,null,null,0.005,2,0,0,null,0,null]]
            if(data[1] == 'fon'){
                //NewOfferSocket.close();
                expect(data).to.not.be.null

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //Funding ID
                expect(data[2][0]).to.be.a('number')
                expect(data[2][0]).to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Symbol
                expect(data[2][1]).to.be.a('string')
                expect(data[2][1]).to.equal(symbol)

                //MTS Create
                expect(data[2][2]).to.be.a('number')
                expect(data[2][2]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][2]).to.match(/^(\d{13})?$/)

                //MTS Update
                expect(data[2][3]).to.be.a('number')
                expect(data[2][3]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][3]).to.match(/^(\d{13})?$/)

                //Amount
                expect(data[2][4]).to.be.a('number')
                expect(data[2][4]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][4]).to.equal(offerAmount)

                //Amount Orig
                expect(data[2][5]).to.be.a('number')
                expect(data[2][5]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][5]).to.equal(offerAmount)

                //Offer Type
                expect(data[2][6]).to.be.a('string')
                expect(data[2][6]).to.equal('FRRDELTAVAR')

                //Placeholder
                expect(data[2][7]).to.be.a('null')

                //Placeholder
                expect(data[2][8]).to.be.a('null')

                //Placeholder
                expect(data[2][9]).to.be.a('null')

                //Status
                expect(data[2][10]).to.be.a('string')
                expect(data[2][10]).to.equal('ACTIVE')

                //Placeholder
                expect(data[2][11]).to.be.a('null')

                //Placeholder
                expect(data[2][12]).to.be.a('null')

                //Placeholder
                expect(data[2][13]).to.be.a('null')

                //Rate
                expect(data[2][14]).to.be.a('number')
                expect(data[2][14]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][14]).to.equal(0.00001)

                //Period
                expect(data[2][15]).to.be.a('number')
                expect(data[2][15]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][15]).to.equal(period)

                //Notify
                expect(data[2][16]).to.be.a('number')
                expect(data[2][16]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][16]).to.equal(0)

                //Hidden
                expect(data[2][17]).to.be.a('number')
                expect(data[2][17]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][17]).to.equal(0)

                //Placeholder
                expect(data[2][18]).to.be.a('null')

                //Renew
                expect(data[2][19]).to.be.a('number')
                expect(data[2][19]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][19]).to.equal(0)

                //Placeholder
                expect(data[2][20]).to.be.a('null')

                
                console.log(`fon message:`,JSON.stringify(data))
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

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //MTS Timestamp of Notification
                expect(data[2][0]).to.be.a('number')
                expect(data[2][0]).to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Type 
                expect(data[2][1]).to.be.a('string')
                expect(data[2][1]).to.equal('fon-req')

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
                expect(data[2][7]).to.equal('Submitting funding bid of '+bidAmount*-1+'.0 '+symbolNice+' at FRR 0.001000 for '+period+' days.')

                //Funding ID
                expect(data[2][4][0]).to.be.a('number')
                expect(data[2][4][0]).to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Placeholder
                expect(data[2][4][1]).to.be.a('null')

                //Placeholder
                expect(data[2][4][2]).to.be.a('null')

                //Placeholder
                expect(data[2][4][3]).to.be.a('null')

                //Amount
                expect(data[2][4][4]).to.be.a('number')
                expect(data[2][4][4]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][4][4]).to.equal(bidAmount)

                //Placeholder
                expect(data[2][4][5]).to.be.a('null')

                //Placeholder
                expect(data[2][4][6]).to.be.a('null')

                //Placeholder
                expect(data[2][4][7]).to.be.a('null')

                //Placeholder
                expect(data[2][4][8]).to.be.a('null')

                //Placeholder
                expect(data[2][4][9]).to.be.a('null')

                //Placeholder
                expect(data[2][4][10]).to.be.a('null')

                //Placeholder
                expect(data[2][4][11]).to.be.a('null')

                //Placeholder
                expect(data[2][4][12]).to.be.a('null')

                //Placeholder
                expect(data[2][4][13]).to.be.a('null')

                //Rate
                expect(data[2][4][14]).to.be.a('number')
                expect(data[2][4][14]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][4][14]).to.equal(0.00001)

                //Period
                expect(data[2][4][15]).to.be.a('number')
                expect(data[2][4][15]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][4][15]).to.equal(period)

                //Placeholder
                expect(data[2][4][16]).to.be.a('null')

                //Placeholder
                expect(data[2][4][17]).to.be.a('null')

                //Placeholder
                expect(data[2][4][18]).to.be.a('null')

                //Placeholder
                expect(data[2][4][19]).to.be.a('null')

                //Placeholder
                expect(data[2][4][20]).to.be.a('null')

                console.log(`n message:`,JSON.stringify(data))
                } 

            // Target the oc message [0,"fon",[41245492,"fUSD",1588164953000,1588164953000,50,50,"LIMIT",null,null,null,"ACTIVE",null,null,null,0.005,2,0,0,null,0,null]]
            //[0,"foc",[41245527,"fUSD",1588169273000,1588169273000,0,-50,"FRRDELTAVAR",null,null,null,"EXECUTED at FRR delta (50.0)",null,null,null,0,2,0,0,null,0,null]]    
            if(data[1] == 'foc'){
                //NewOfferSocket.close();
                expect(data).to.not.be.null

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //Funding ID
                expect(data[2][0]).to.be.a('number')
                expect(data[2][0]).to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Symbol
                expect(data[2][1]).to.be.a('string')
                expect(data[2][1]).to.equal(symbol)

                //MTS Create
                expect(data[2][2]).to.be.a('number')
                expect(data[2][2]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][2]).to.match(/^(\d{13})?$/)

                //MTS Update
                expect(data[2][3]).to.be.a('number')
                expect(data[2][3]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][3]).to.match(/^(\d{13})?$/)

                //Amount
                expect(data[2][4]).to.be.a('number')
                expect(data[2][4]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][4]).to.equal(0)

                //Amount Orig
                expect(data[2][5]).to.be.a('number')
                expect(data[2][5]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][5]).to.equal(bidAmount)

                //Offer Type
                expect(data[2][6]).to.be.a('string')
                expect(data[2][6]).to.equal('FRRDELTAVAR')

                //Placeholder
                expect(data[2][7]).to.be.a('null')

                //Placeholder
                expect(data[2][8]).to.be.a('null')

                //Placeholder
                expect(data[2][9]).to.be.a('null')

                //Status
                expect(data[2][10]).to.be.a('string')
                expect(data[2][10]).to.contain('EXECUTED')

                //Placeholder
                expect(data[2][11]).to.be.a('null')

                //Placeholder
                expect(data[2][12]).to.be.a('null')

                //Placeholder
                expect(data[2][13]).to.be.a('null')

                //Rate
                expect(data[2][14]).to.be.a('number')
                expect(data[2][14]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][14]).to.equal(0.00001)

                //Period
                expect(data[2][15]).to.be.a('number')
                expect(data[2][15]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][15]).to.equal(period)

                //Notify
                expect(data[2][16]).to.be.a('number')
                expect(data[2][16]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][16]).to.equal(0)

                //Hidden
                expect(data[2][17]).to.be.a('number')
                expect(data[2][17]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][17]).to.equal(0)

                //Placeholder
                expect(data[2][18]).to.be.a('null')

                //Renew
                expect(data[2][19]).to.be.a('number')
                expect(data[2][19]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][19]).to.equal(0)

                //Placeholder
                expect(data[2][20]).to.be.a('null')

                
                console.log(`fon message:`,JSON.stringify(data))
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

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //MTS Timestamp of Notification
                expect(data[2][0]).to.be.a('number')
                expect(data[2][0]).to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Type 
                expect(data[2][1]).to.be.a('string')
                expect(data[2][1]).to.equal('fon-req')

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
                expect(data[2][7]).to.equal('Submitting funding offer of '+offerAmount+'.0 '+symbolNice+' at FRR 0.002000 for '+period+' days.')

                //Funding ID
                expect(data[2][4][0]).to.be.a('number')
                expect(data[2][4][0]).to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Placeholder
                expect(data[2][4][1]).to.be.a('null')

                //Placeholder
                expect(data[2][4][2]).to.be.a('null')

                //Placeholder
                expect(data[2][4][3]).to.be.a('null')

                //Amount
                expect(data[2][4][4]).to.be.a('number')
                expect(data[2][4][4]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][4][4]).to.equal(offerAmount)

                //Placeholder
                expect(data[2][4][5]).to.be.a('null')

                //Placeholder
                expect(data[2][4][6]).to.be.a('null')

                //Placeholder
                expect(data[2][4][7]).to.be.a('null')

                //Placeholder
                expect(data[2][4][8]).to.be.a('null')

                //Placeholder
                expect(data[2][4][9]).to.be.a('null')

                //Placeholder
                expect(data[2][4][10]).to.be.a('null')

                //Placeholder
                expect(data[2][4][11]).to.be.a('null')

                //Placeholder
                expect(data[2][4][12]).to.be.a('null')

                //Placeholder
                expect(data[2][4][13]).to.be.a('null')

                //Rate
                expect(data[2][4][14]).to.be.a('number')
                expect(data[2][4][14]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][4][14]).to.equal(0.00002)

                //Period
                expect(data[2][4][15]).to.be.a('number')
                expect(data[2][4][15]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][4][15]).to.equal(period)

                //Placeholder
                expect(data[2][4][16]).to.be.a('null')

                //Placeholder
                expect(data[2][4][17]).to.be.a('null')

                //Placeholder
                expect(data[2][4][18]).to.be.a('null')

                //Placeholder
                expect(data[2][4][19]).to.be.a('null')

                //Placeholder
                expect(data[2][4][20]).to.be.a('null')

                console.log(`n message:`,JSON.stringify(data))
                } 

            // Target the on message [0,"fon",[41245492,"fUSD",1588164953000,1588164953000,50,50,"LIMIT",null,null,null,"ACTIVE",null,null,null,0.005,2,0,0,null,0,null]]
            if(data[1] == 'fon'){
                //NewOfferSocket.close();
                expect(data).to.not.be.null

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //Funding ID
                expect(data[2][0]).to.be.a('number')
                expect(data[2][0]).to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Symbol
                expect(data[2][1]).to.be.a('string')
                expect(data[2][1]).to.equal(symbol)

                //MTS Create
                expect(data[2][2]).to.be.a('number')
                expect(data[2][2]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][2]).to.match(/^(\d{13})?$/)

                //MTS Update
                expect(data[2][3]).to.be.a('number')
                expect(data[2][3]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][3]).to.match(/^(\d{13})?$/)

                //Amount
                expect(data[2][4]).to.be.a('number')
                expect(data[2][4]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][4]).to.equal(offerAmount)

                //Amount Orig
                expect(data[2][5]).to.be.a('number')
                expect(data[2][5]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][5]).to.equal(offerAmount)

                //Offer Type
                expect(data[2][6]).to.be.a('string')
                expect(data[2][6]).to.equal('FRRDELTAFIX')

                //Placeholder
                expect(data[2][7]).to.be.a('null')

                //Placeholder
                expect(data[2][8]).to.be.a('null')

                //Placeholder
                expect(data[2][9]).to.be.a('null')

                //Status
                expect(data[2][10]).to.be.a('string')
                expect(data[2][10]).to.equal('ACTIVE')

                //Placeholder
                expect(data[2][11]).to.be.a('null')

                //Placeholder
                expect(data[2][12]).to.be.a('null')

                //Placeholder
                expect(data[2][13]).to.be.a('null')

                //Rate
                expect(data[2][14]).to.be.a('number')
                expect(data[2][14]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][14]).to.equal(0.00002)

                //Period
                expect(data[2][15]).to.be.a('number')
                expect(data[2][15]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][15]).to.equal(period)

                //Notify
                expect(data[2][16]).to.be.a('number')
                expect(data[2][16]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][16]).to.equal(0)

                //Hidden
                expect(data[2][17]).to.be.a('number')
                expect(data[2][17]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][17]).to.equal(0)

                //Placeholder
                expect(data[2][18]).to.be.a('null')

                //Renew
                expect(data[2][19]).to.be.a('number')
                expect(data[2][19]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][19]).to.equal(0)

                //Placeholder
                expect(data[2][20]).to.be.a('null')

                
                console.log(`fon message:`,JSON.stringify(data))
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

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //MTS Timestamp of Notification
                expect(data[2][0]).to.be.a('number')
                expect(data[2][0]).to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Type 
                expect(data[2][1]).to.be.a('string')
                expect(data[2][1]).to.equal('fon-req')

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
                expect(data[2][7]).to.equal('Submitting funding bid of '+bidAmount*-1+'.0 '+symbolNice+' at FRR 0.001000 for '+period+' days.')

                //Funding ID
                expect(data[2][4][0]).to.be.a('number')
                expect(data[2][4][0]).to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Placeholder
                expect(data[2][4][1]).to.be.a('null')

                //Placeholder
                expect(data[2][4][2]).to.be.a('null')

                //Placeholder
                expect(data[2][4][3]).to.be.a('null')

                //Amount
                expect(data[2][4][4]).to.be.a('number')
                expect(data[2][4][4]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][4][4]).to.equal(bidAmount)

                //Placeholder
                expect(data[2][4][5]).to.be.a('null')

                //Placeholder
                expect(data[2][4][6]).to.be.a('null')

                //Placeholder
                expect(data[2][4][7]).to.be.a('null')

                //Placeholder
                expect(data[2][4][8]).to.be.a('null')

                //Placeholder
                expect(data[2][4][9]).to.be.a('null')

                //Placeholder
                expect(data[2][4][10]).to.be.a('null')

                //Placeholder
                expect(data[2][4][11]).to.be.a('null')

                //Placeholder
                expect(data[2][4][12]).to.be.a('null')

                //Placeholder
                expect(data[2][4][13]).to.be.a('null')

                //Rate
                expect(data[2][4][14]).to.be.a('number')
                expect(data[2][4][14]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][4][14]).to.equal(0.00001)

                //Period
                expect(data[2][4][15]).to.be.a('number')
                expect(data[2][4][15]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][4][15]).to.equal(period)

                //Placeholder
                expect(data[2][4][16]).to.be.a('null')

                //Placeholder
                expect(data[2][4][17]).to.be.a('null')

                //Placeholder
                expect(data[2][4][18]).to.be.a('null')

                //Placeholder
                expect(data[2][4][19]).to.be.a('null')

                //Placeholder
                expect(data[2][4][20]).to.be.a('null')

                console.log(`n message:`,JSON.stringify(data))
                } 

            // Target the oc message [0,"fon",[41245492,"fUSD",1588164953000,1588164953000,50,50,"LIMIT",null,null,null,"ACTIVE",null,null,null,0.005,2,0,0,null,0,null]]
            //[0,"foc",[41245527,"fUSD",1588169273000,1588169273000,0,-50,"FRRDELTAVAR",null,null,null,"EXECUTED at FRR delta (50.0)",null,null,null,0,2,0,0,null,0,null]]    
            if(data[1] == 'fon'){
                NewOfferSocket.close();
                expect(data).to.not.be.null

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //Funding ID
                expect(data[2][0]).to.be.a('number')
                expect(data[2][0]).to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Symbol
                expect(data[2][1]).to.be.a('string')
                expect(data[2][1]).to.equal(symbol)

                //MTS Create
                expect(data[2][2]).to.be.a('number')
                expect(data[2][2]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][2]).to.match(/^(\d{13})?$/)

                //MTS Update
                expect(data[2][3]).to.be.a('number')
                expect(data[2][3]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][3]).to.match(/^(\d{13})?$/)

                //Amount
                expect(data[2][4]).to.be.a('number')
                expect(data[2][4]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][5]).to.equal(bidAmount)

                //Amount Orig
                expect(data[2][5]).to.be.a('number')
                expect(data[2][5]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][5]).to.equal(bidAmount)

                //Offer Type
                expect(data[2][6]).to.be.a('string')
                expect(data[2][6]).to.equal('FRRDELTAFIX')

                //Placeholder
                expect(data[2][7]).to.be.a('null')

                //Placeholder
                expect(data[2][8]).to.be.a('null')

                //Placeholder
                expect(data[2][9]).to.be.a('null')

                //Status
                expect(data[2][10]).to.be.a('string')
                expect(data[2][10]).to.equal('ACTIVE')

                //Placeholder
                expect(data[2][11]).to.be.a('null')

                //Placeholder
                expect(data[2][12]).to.be.a('null')

                //Placeholder
                expect(data[2][13]).to.be.a('null')

                //Rate
                expect(data[2][14]).to.be.a('number')
                expect(data[2][14]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][14]).to.equal(0.00001)

                //Period
                expect(data[2][15]).to.be.a('number')
                expect(data[2][15]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][15]).to.equal(period)

                //Notify
                expect(data[2][16]).to.be.a('number')
                expect(data[2][16]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][16]).to.equal(0)

                //Hidden
                expect(data[2][17]).to.be.a('number')
                expect(data[2][17]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][17]).to.equal(0)

                //Placeholder
                expect(data[2][18]).to.be.a('null')

                //Renew
                expect(data[2][19]).to.be.a('number')
                expect(data[2][19]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[2][19]).to.equal(0)

                //Placeholder
                expect(data[2][20]).to.be.a('null')

                
                console.log(`fon message:`,JSON.stringify(data))
                done()
                }    
            }
        });

    })
