const WebSocket = require('ws');
const fs = require('fs');
const expect = require('chai').expect;
const ws_url = require('../config.json').ws_url
const crypto = require('crypto-js') // Standard JavaScript cryptography library
const apiKey = require('../config.json').api_key
const apiSecret = require('../config.json').api_secret

//Auth
const CalcSocket = new WebSocket(ws_url);
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

//Sleep timer
function sleep(milliseconds) {
  const date = Date.now();
  let currentDate = null;
  do {
    currentDate = Date.now();
  } while (currentDate - date < milliseconds);
}

describe('Calc Tests (Tests "calc" inputs & authenticated channels: "miu", "wu" and "bu")', function() {
        it('Calc Margin Base should return a correct Margin Info message', function(done) {

        this.timeout(10000)

        CalcSocket.onopen = function (event) {
            let payload = JSON.stringify([
                0,
                "calc",
                null,
                [
                ["margin_base"]
                ]
                ])
            CalcSocket.send(JSON.stringify(payloadAuth))
            sleep(1000);
            CalcSocket.send(payload);
          };

        CalcSocket.onmessage = function (event) {
            let data = JSON.parse(event.data)
            
            // Target the miu message [0,"miu",["base",[0,0,23726359.61773215,23726359.61773215,0]]]      
            if(data[1] == 'miu'){
                expect(data).to.not.be.null
                console.log(`miu message:`,JSON.stringify(data))

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //Type
                expect(data[2][0]).to.be.a('string')
                .and.to.equal('base')

                //User PL
                expect(data[2][1][0]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //User Swaps
                expect(data[2][1][1]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Margin Balance
                expect(data[2][1][2]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Margin Net
                expect(data[2][1][3]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Margin Required
                expect(data[2][1][4]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)

                sleep(500)

                done()

                } 
            }
        });

        it('Calc Margin Sym should return a correct Margin Info message', function(done) {

        this.timeout(10000)

        let payload = JSON.stringify([
                0,
                "calc",
                null,
                [
                ["margin_sym_tBTCUSD"]
                ]
                ])

            CalcSocket.send(payload);

        CalcSocket.onmessage = function (event) {
            let data = JSON.parse(event.data)
            
            // Target the miu message [0,"miu",["sym","tBTCUSD",[113886526.1651143,113886526.1651143,26286.561146016,26286.561146015996,null,null,null,null]]]        
            if(data[1] == 'miu'){
                expect(data).to.not.be.null
                console.log(`miu message:`,JSON.stringify(data))

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //Type
                expect(data[2][0]).to.be.a('string')
                .and.to.equal('sym')

                //Type
                expect(data[2][1]).to.be.a('string')
                .and.to.equal('tBTCUSD')

                //Tradable Balance
                expect(data[2][2][0]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Gross Balance
                expect(data[2][2][1]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Buy
                expect(data[2][2][2]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Sell
                expect(data[2][2][3]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Placeholder
                expect(data[2][2][4]).to.be.null

                //Placeholder
                expect(data[2][2][5]).to.be.null

                //Placeholder
                expect(data[2][2][6]).to.be.null

                //Placeholder
                expect(data[2][2][7]).to.be.null

                sleep(500)

                done()

                } 
            }
        });

        it('Calc Wallet should return a correct Wallet Update message', function(done) {

        this.timeout(10000)

        let payload = JSON.stringify([
                0,
                "calc",
                null,
                [
                ["wallet_exchange_BTC"]
                ]
                ])

            CalcSocket.send(payload);

        CalcSocket.onmessage = function (event) {
            let data = JSON.parse(event.data)
            
            // Target the wu message [0,"wu",["exchange","BTC",5476.36690542,0,5476.36690542,null,null]]       
            if(data[1] == 'wu'){
                expect(data).to.not.be.null
                console.log(`wu message:`,JSON.stringify(data))

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //Wallet Type
                expect(data[2][0]).to.be.a('string')
                .and.to.equal('exchange')

                //Currency 
                expect(data[2][1]).to.be.a('string')
                .and.to.equal('BTC')

                //Balance
                expect(data[2][2]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Unsettled Interest
                expect(data[2][3]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Balance Available
                expect(data[2][4]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Description 
                expect(data[2][5]).to.satisfy(function (data) {
                    return typeof data === 'string'|| data === null;
                });

                //Meta 
                expect(data[2][6]).to.satisfy(function (data) {
                    return typeof data === 'object'|| data === null;
                });

                sleep(500)

                done()

                } 
            }
        });

        it('Calc Balance should return a correct Balance Update message', function(done) {

        this.timeout(10000)

        let payload = JSON.stringify([
                0,
                "calc",
                null,
                [
                ["balance"]
                ]
                ])

            CalcSocket.send(payload);

        CalcSocket.onmessage = function (event) {
            let data = JSON.parse(event.data)
            
            // Target the bu message [0,"bu",[302788227.94609207,302788227.94609207]]      
            if(data[1] == 'bu'){
                expect(data).to.not.be.null
                CalcSocket.close();
                console.log(`bu message:`,JSON.stringify(data))

                //Returns 3 items, chan ID, type and order data
                expect(data.length).to.eq(3)

                //Assets Under Management
                expect(data[2][0]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Net Assets Under Management
                expect(data[2][1]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)

                done()

                } 
            }
        });

    })
