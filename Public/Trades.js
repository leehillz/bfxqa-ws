const WebSocket = require('ws');
const fs = require('fs');
const expect = require('chai').expect;
const ws_url = require('../config.json').ws_url

describe('Trades Tests', function() {
        it('Trades should return ID, MTS, Amount, Price', function(done) {

        this.timeout(10000)
        const TradesSocket = new WebSocket(ws_url);

        TradesSocket.onopen = function (event) {
            let payload = JSON.stringify({
                "event": "subscribe",
                "channel": "trades",
                "symbol": "tBTCUSD"
              })
            TradesSocket.send(payload); 
          };

        TradesSocket.onmessage = function (event) {
            let data = JSON.parse(event.data)
              
            // Ignore the info and subscribed payloads
            if(data.event !== 'info' && data.event !== 'subscribed'){
                TradesSocket.close();
                expect(data).to.not.be.null
                console.log(`Trades Data:`,JSON.stringify(data))

                //Returns two items, Channel ID and data
                expect(data.length).to.eq(2)

                //ID
                expect(data[1][1][0]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //MTS
                expect(data[1][1][1]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)
                .and.to.match(/^(\d{13})?$/)

                //Amount
                expect(data[1][1][2]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Price
                expect(data[1][1][3]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)
                
                done()
                }   
            }
        });

        it('Funding Trades should return ID, MTS, Amount, Rate, Period', function(done) {

        this.timeout(10000)
        const TradesSocket = new WebSocket(ws_url);

        TradesSocket.onopen = function (event) {
            let payload = JSON.stringify({
                "event": "subscribe",
                "channel": "trades",
                "symbol": "fUSD"
              })
            TradesSocket.send(payload); 
          };

        TradesSocket.onmessage = function (event) {
            let data = JSON.parse(event.data)
              
            // Ignore the info and subscribed payloads
            if(data.event !== 'info' && data.event !== 'subscribed'){
                TradesSocket.close();
                expect(data).to.not.be.null
                console.log(`Funding Trades Data:`,JSON.stringify(data))

                //Returns two items, Channel ID and data
                expect(data.length).to.eq(2)

                //ID
                expect(data[1][1][0]).to.be.a('number')
                expect(data[1][1][0]).to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //MTS
                expect(data[1][1][1]).to.be.a('number')
                expect(data[1][1][1]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[1][1][1]).to.match(/^(\d{13})?$/)

                //Amount
                expect(data[1][1][2]).to.be.a('number')
                expect(data[1][1][2]).to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Rate
                expect(data[1][1][3]).to.be.a('number')
                expect(data[1][1][3]).to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Period
                expect(data[1][1][4]).to.be.a('number')
                expect(data[1][1][4]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[1][1][4]).to.be.within(2,30)
                
                done()
                }   
            }
        });
    })
