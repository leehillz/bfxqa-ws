const WebSocket = require('ws');
const fs = require('fs');
const expect = require('chai').expect;
const ws_url = require('../config.json').ws_url

describe('Raw Book Tests', function() {
        it('Raw Book should return Price, Count and Amount', function(done) {

        this.timeout(10000)
        const RawBookSocket = new WebSocket(ws_url);

        RawBookSocket.onopen = function (event) {
            let payload = JSON.stringify({
                "event": "subscribe",
                "channel": "book",
                "symbol": "tBTCUSD",
                "prec": "R0"
              })
            RawBookSocket.send(payload); 
          };

        RawBookSocket.onmessage = function (event) {
            let data = JSON.parse(event.data)
              
            // Ignore the info and subscribed payloads
            if(data.event !== 'info' && data.event !== 'subscribed'){
                RawBookSocket.close();
                expect(data).to.not.be.null
                console.log(`Raw Book Data:`,JSON.stringify(data))

                //Returns two items, Channel ID and data
                expect(data.length).to.eq(2)

                //Price
                expect(data[1][1][0]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Count
                expect(data[1][1][1]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Amount
                expect(data[1][1][2]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)
                
                done()
                }   
            }
        });
    })
