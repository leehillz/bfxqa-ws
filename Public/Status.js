const WebSocket = require('ws');
const fs = require('fs');
const expect = require('chai').expect;
const ws_url = require('../config.json').ws_url

describe('Status Tests', function() {
        it('Status should return Symbol, MTS, Derivatives Price, Spot Price, Mark Price, Insurance Fund Balance, Next Funding Event MTS, Next Funding Accrued, Next Funding Step, Current Funding, Open Interest, Position ID, Amount, Base Price, Is Match, Is Market Sold, Liquidation Price', function(done) {

        this.timeout(10000)
        const StatusSocket = new WebSocket(ws_url);

        StatusSocket.onopen = function (event) {
            let payload = JSON.stringify({
                "event": "subscribe",
                "channel": "status",
                "key":"deriv:tBTCF0:USTF0"
              })
            StatusSocket.send(payload); 
          };

        StatusSocket.onmessage = function (event) {
            let data = JSON.parse(event.data)
              
            // Ignore the info and subscribed payloads
            if(data.event !== 'info' && data.event !== 'subscribed'){
                StatusSocket.close();
                expect(data).to.not.be.null
                console.log(`Status Data:`,JSON.stringify(data))

                //Returns two items, Channel ID and data
                expect(data.length).to.eq(2)

                //MTS
                expect(data[1][0]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)
                .and.to.match(/^(\d{13})?$/)

                //Placeholder
                expect(data[1][1]).to.be.null

                //Derivatives Price
                expect(data[1][2]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Spot Price
                expect(data[1][3]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Placeholder
                expect(data[1][4]).to.be.null

                //Insurance Fund Balance
                expect(data[1][5]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Placeholder
                expect(data[1][6]).to.be.null

                //Next Funding Event MTS
                expect(data[1][7]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)
                .and.to.match(/^(\d{13})?$/)

                //Next Funding Accrued
                expect(data[1][8]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Next Funding Step
                expect(data[1][9]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Placeholder
                expect(data[1][10]).to.be.null

                //Current Funding
                expect(data[1][11]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Placeholder
                expect(data[1][12]).to.be.null

                //Placeholder
                expect(data[1][13]).to.be.null

                //Mark Price
                expect(data[1][14]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)

                //Placeholder
                expect(data[1][15]).to.be.null

                //Placeholder
                expect(data[1][16]).to.be.null

                //Open Interest
                expect(data[1][17]).to.be.a('number')
                .and.to.match(/[0-9]+[.]{0,1}[0-9]*/)
                
                done()
                }   
            }
        });
    })
