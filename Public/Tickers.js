const WebSocket = require('ws');
const fs = require('fs');
const expect = require('chai').expect;
const ws_url = require('../config.json').ws_url

describe('Ticker Tests', function() {
        it('Trading Ticker should return Bid, Bid Size, Ask, Ask Size, Daily Change, Daily Change Relative, Last Price, Volume, High, Low', function(done) {

        this.timeout(10000)
        const TickerSocket = new WebSocket(ws_url);

        TickerSocket.onopen = function (event) {
            let payload = JSON.stringify({
                "event": "subscribe",
                "channel": "ticker",
                "symbol": "tBTCUSD"
              })
            TickerSocket.send(payload); 
            };

        TickerSocket.onmessage = function (event) {
            let data = JSON.parse(event.data)
              
            // Ignore the info and subscribed payloads
            if(data.event !== 'info' && data.event !== 'subscribed'){
                TickerSocket.close();
                expect(data).to.not.be.null

                //Returns two items, Channel ID and data
                expect(data.length).to.eq(2)

                //Bid
                expect(data[1][0]).to.be.a('number')
                expect(data[1][0]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[1][0]).to.match(/^(?!(?:.*[1-9](\.?[0-9]){5,}))([-+]?\d+\.?\d*?)$/)

                //Bid Size
                expect(data[1][1]).to.be.a('number')
                expect(data[1][1]).to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Ask
                expect(data[1][2]).to.be.a('number')
                expect(data[1][2]).to.match(/[0-9]+/)
                expect(data[1][2]).to.match(/^(?!(?:.*[1-9](\.?[0-9]){5,}))([-+]?\d+\.?\d*?)$/)
                expect(data[1][2]).to.be.greaterThan((data[1][0]))

                //Ask Size
                expect(data[1][3]).to.be.a('number')
                expect(data[1][3]).to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Daily Change
                expect(data[1][4]).to.be.a('number')
                expect(data[1][4]).to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Daily Change Relative
                expect(data[1][5]).to.be.a('number')
                expect(data[1][5]).to.match(/[0-9]+/)

                //Last Price
                expect(data[1][6]).to.be.a('number')
                expect(data[1][6]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[1][6]).to.match(/^(?!(?:.*[1-9](\.?[0-9]){5,}))([-+]?\d+\.?\d*?)$/)

                //Volume
                expect(data[1][7]).to.be.a('number')
                expect(data[1][7]).to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //High
                expect(data[1][8]).to.be.a('number')
                expect(data[1][8]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[1][8]).to.match(/^(?!(?:.*[1-9](\.?[0-9]){5,}))([-+]?\d+\.?\d*?)$/)

                //Low
                expect(data[1][9]).to.be.a('number')
                expect(data[1][9]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[1][9]).to.match(/^(?!(?:.*[1-9](\.?[0-9]){5,}))([-+]?\d+\.?\d*?)$/)
                expect(data[1][9]).to.be.lessThan((data[1][8]))

                console.log(`Trading Ticker Data:`,JSON.stringify(data))
                done()
                }   
            }
        });

        it('Funding Ticker should return FRR, Bid, Bid Period, Bid Size, Ask, Ask Period, Ask Size, Daily Change, Daily Change Relative, LastPrice, Volume, High, Low', function(done) {
 
        const TickerSocket = new WebSocket(ws_url);

        TickerSocket.onopen = function (event) {
            let payload = JSON.stringify({
                "event": "subscribe",
                "channel": "ticker",
                "symbol": "fUSD"
              })
            TickerSocket.send(payload); 
          };

        TickerSocket.onmessage = function (event) {
            let data = JSON.parse(event.data)
              
            // Ignore the info and subscribed payloads
            if(data.event !== 'info' && data.event !== 'subscribed'){

                TickerSocket.close();
                expect(data).to.not.be.null

                //Returns two items, Channel ID and data
                expect(data.length).to.eq(2)

                //FRR
                expect(data[1][0]).to.be.a('number')
                expect(data[1][0]).to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Bid
                expect(data[1][1]).to.be.a('number')
                expect(data[1][1]).to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Bid Period
                expect(data[1][2]).to.be.a('number')
                expect(data[1][2]).to.match(/[0-9]+/)
                expect(data[1][2]).to.be.within(2,30)

                //Bid Size
                expect(data[1][3]).to.be.a('number')
                expect(data[1][3]).to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Ask
                expect(data[1][4]).to.be.a('number')
                expect(data[1][4]).to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Ask Period
                expect(data[1][5]).to.be.a('number')
                expect(data[1][5]).to.match(/[0-9]+/)
                expect(data[1][5]).to.be.within(2,30)

                //Ask Size
                expect(data[1][6]).to.be.a('number')
                expect(data[1][6]).to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Daily Change
                expect(data[1][7]).to.be.a('number')
                expect(data[1][7]).to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Daily Change Relative
                expect(data[1][8]).to.be.a('number')
                expect(data[1][8]).to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Last Price
                expect(data[1][9]).to.be.a('number')
                expect(data[1][9]).to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Volume
                expect(data[1][10]).to.be.a('number')
                expect(data[1][10]).to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //High
                expect(data[1][11]).to.be.a('number')
                expect(data[1][11]).to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Low
                expect(data[1][12]).to.be.a('number')
                expect(data[1][12]).to.match(/[0-9]+[.]{0,1}[0-9]*/)
                expect(data[1][12]).to.be.lessThan(data[1][11])

                console.log(`Funding Ticker Data:`,JSON.stringify(data))
                done()
                }   
            }
        });
    })
