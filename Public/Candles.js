const WebSocket = require('ws');
const fs = require('fs');
const expect = require('chai').expect;
const ws_url = require('../config.json').ws_url

describe('Candles Tests', function() {
        it('Candles should return MTS, Open, Close, High, Low, Volume', function(done) {

        this.timeout(10000)
        const CandlesSocket = new WebSocket(ws_url);

        CandlesSocket.onopen = function (event) {
            let payload = JSON.stringify({
                "event": "subscribe",
                "channel": "candles",
                "key": "trade:1m:tBTCUSD"
              })
            CandlesSocket.send(payload); 
          };

        CandlesSocket.onmessage = function (event) {
            let data = JSON.parse(event.data)
              
            // Ignore the info and subscribed payloads
            if(data.event !== 'info' && data.event !== 'subscribed'){
                CandlesSocket.close();
                expect(data).to.not.be.null

                //Returns two items, Channel ID and data
                expect(data.length).to.eq(2)

                //MTS
                expect(data[1][0][0]).to.be.a('number')
                expect(data[1][0][0].toString().length).to.eq(13)
                expect(data[1][0][0]).to.match(/[0-9]{13}/)

                //Open
                expect(data[1][0][1]).to.be.a('number')
                expect(data[1][0][1]).to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Close
                expect(data[1][0][2]).to.be.a('number')
                expect(data[1][0][2]).to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //High
                expect(data[1][0][3]).to.be.a('number')
                expect(data[1][0][3]).to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Low
                expect(data[1][0][4]).to.be.a('number')
                expect(data[1][0][4]).to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Volume
                expect(data[1][0][5]).to.be.a('number')
                expect(data[1][0][5]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                
                console.log(`Candles Data:`,JSON.stringify(data))
                done()
                }   
            }
        });
    })
