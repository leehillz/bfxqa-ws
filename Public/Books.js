const WebSocket = require('ws');
const fs = require('fs');
const expect = require('chai').expect;
const ws_url = require('../config.json').ws_url

describe('Book Tests', function() {
        it('Book should return Price, Count and Amount', function(done) {

        this.timeout(10000)
        const BookSocket = new WebSocket(ws_url);

        BookSocket.onopen = function (event) {
            let payload = JSON.stringify({
                "event": "subscribe",
                "channel": "book",
                "symbol": "tBTCUSD",
                "prec": "P0",
                "freq": "F0",
                "len": 25
              })
            BookSocket.send(payload); 
          };

        BookSocket.onmessage = function (event) {
            let data = JSON.parse(event.data)
              
            // Ignore the info and subscribed payloads
            if(data.event !== 'info' && data.event !== 'subscribed'){
                BookSocket.close();
                expect(data).to.not.be.null

                //Returns two items, Channel ID and data
                expect(data.length).to.eq(2)

                //Price
                expect(data[1][0][0]).to.be.a('number')
                expect(data[1][0][0]).to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Count
                expect(data[1][0][1]).to.be.a('number')
                expect(data[1][0][1]).to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Amount
                expect(data[1][0][2]).to.be.a('number')
                expect(data[1][0][2]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                
                console.log(`Book Data:`,JSON.stringify(data))
                done()
                }   
            }
        });
    })
