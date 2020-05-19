const chai = require('chai')
var expect = chai.expect

class SchemaAssertions {
    
    //  Channel: Orders
    //  Documentation: https://docs.bitfinex.com/reference#ws-auth-orders
    static assertOrdersSchema(data) {
        expect(data).to.have.lengthOf(32)
        // Order ID
        expect(data[0]).to.be.a("number")
        // GID
        expect(data[1]).to.satisfy((d) => d === null || typeof d === "number")
        // CID
        expect(data[2]).to.be.a("number")
        // Symbol
        expect(data[3]).to.be.a("string")
        // MTS Create
        expect(data[4]).to.be.a("number")
        .and.to.match(/^(\d{13})?$/)
        // MTS Update
        expect(data[5]).to.be.a("number")
        .and.to.match(/^(\d{13})?$/)
        // Amount
        expect(data[6]).to.be.a("number")
        // Amount Original
        expect(data[7]).to.be.a("number")
        // Order Type
        expect(data[8]).to.be.a("string")
        // Order Type Previous
        expect(data[9]).to.satisfy((d) => d === null || typeof d === "string")
        // MTS TIF
        expect(data[10]).to.satisfy((d) => d === null || typeof d === "number")
        // Placeholder
        expect(data[11]).to.be.a("null")
        // Flags
        expect(data[12]).to.be.a("number")
        // Status
        expect(data[13]).to.be.a("string")
        // Placeholder
        expect(data[14]).to.be.a("null")
        // Placeholder
        expect(data[15]).to.be.a("null")
        // Price
        expect(data[16]).to.be.a("number")
        // Price Average
        expect(data[17]).to.be.a("number")
        // Price Trailing
        expect(data[18]).to.be.a("number")
        // Price Aux Limit
        expect(data[19]).to.be.a("number")
        // Placeholder
        expect(data[20]).to.be.a("null")
        // Placeholder
        expect(data[21]).to.be.a("null")
        // Placeholder
        expect(data[22]).to.be.a("null")
        // Notify
        expect(data[23]).to.be.a("number")
        // Hidden can be null or 0 to indicate disabled, or 1 to indicate enabled
        expect(data[24]).to.satisfy((d) => d === null || typeof d === "number")
        // OCO Order ID can be null or present if it's an OCO order
        expect(data[25]).to.satisfy((d) => d === null || typeof d === "number")
        // Placeholder
        expect(data[26]).to.be.a("null")
        // Placeholder
        expect(data[27]).to.be.a("null")
        // Routing
        expect(data[28]).to.be.a("string")
        .and.to.equal('API>BFX')
        // Placeholder
        expect(data[29]).to.be.a("null")
        // Placeholder
        expect(data[30]).to.be.a("null")
        // Can be null or present if the order has metadata
        expect(data[31]).to.satisfy((d) => d === null || typeof d === "object")
    }

    //  Channel: Positions
    //  Documentation: https://docs.bitfinex.com/reference#ws-auth-positions
    static assertPositionsSchema(data) {
        expect(data).to.have.lengthOf(20)
        // Symbol
        expect(data[0]).to.be.a('string')
        // Status
        expect(data[1]).to.be.a('string')
        // Amount
        expect(data[2]).to.be.a('number')
        // Base Price
        expect(data[3]).to.be.a('number')
        // Margin Funding
        expect(data[4]).to.be.a('number')
        // Margin Funding Type
        expect(data[5]).to.be.a('number')
        // PL
        expect(data[6]).to.satisfy((d) => d === null || typeof d === "number")
        // PL Perc
        expect(data[7]).to.satisfy((d) => d === null || typeof d === "number")
        // Price Liq
        expect(data[8]).to.satisfy((d) => d === null || typeof d === "number")
        // Leverage
        expect(data[9]).to.satisfy((d) => d === null || typeof d === "number")
        // Placeholder
        expect(data[10]).to.be.null
        // Position ID
        expect(data[11]).to.be.a('number')
        // Placeholder
        expect(data[12]).to.be.null
        // MTS Create
        expect(data[13]).to.satisfy((d) => d === null || typeof d === "number")
        // MTS Update
        expect(data[14]).to.satisfy((d) => d === null || typeof d === "number")
        // Type
        expect(data[15]).to.be.a('number')
        // Placeholder
        expect(data[16]).to.be.null
        // Collateral
        expect(data[17]).to.be.a('number')
        // Collateral Min
        expect(data[18]).to.satisfy((d) => d === null || typeof d === "number")
        // Position Meta
        expect(data[19]).to.be.a('object')
    }

    //  Channel: Trades
    //  Documentation: https://docs.bitfinex.com/reference#ws-auth-trades
    static assertTradesSchema(data) {
        // Trade ID
        expect(data[0]).to.be.a('number')
        // Symbol
        expect(data[1]).to.be.a('string')
        // MTS Create
        expect(data[2]).to.be.a('number')
        // Order ID
        expect(data[3]).to.be.a('number')
        // Exec Amount
        expect(data[4]).to.be.a('number')
        // Exec Price
        expect(data[5]).to.be.a('number')
        // Order Type
        expect(data[6]).to.be.a('string')
        // Order Price
        expect(data[7]).to.be.a('number')
        // Maker (1 if true, -1 if false)
        expect(data[8]).to.be.within(-1,1)
        // Fee
        expect(data[9]).to.satisfy((d) => d === null || typeof d === "number")
        // Fee Currency
        expect(data[10]).to.satisfy((d) => d === null || typeof d === "string")
    }

    //  Channel: Funding Offers
    //  Documentation: https://docs.bitfinex.com/reference#ws-auth-funding-offers
    static assertOffersSchema(data) {
        expect(data).to.have.lengthOf(21)
        // Funding ID
        expect(data[0]).to.be.a('number')
        // Symbol
        expect(data[1]).to.be.a('string')
        // MTS Create
        expect(data[2]).to.be.a('number')
        // MTS Update
        expect(data[3]).to.be.a('number')
        // Amount
        expect(data[4]).to.be.a('number')
        // Amount Orig
        expect(data[5]).to.be.a('number')
        // Offer Type
        expect(data[6]).to.be.a('string')
        // Placeholder
        expect(data[7]).to.be.null
        // Placeholder
        expect(data[8]).to.be.null
        // Flags
        expect(data[9]).to.satisfy((d) => d === null || typeof d === "number")
        // Status
        expect(data[10]).to.be.a('string')
        // Placeholder
        expect(data[11]).to.be.null
        // Placeholder
        expect(data[12]).to.be.null
        // Placeholder
        expect(data[13]).to.be.null
        // Rate
        expect(data[14]).to.be.a('number')
        // Period
        expect(data[15]).to.be.a('number')
        // Notify
        expect(data[16]).to.be.a('number')
        // Hidden
        expect(data[17]).to.be.a('number')
        // Placeholder
        expect(data[18]).to.be.null
        // Renew
        expect(data[19]).to.be.a('number')
        // Placeholder
        expect(data[20]).to.be.null
    }

    //  Channel: Funding Trades
    //  Documentation: https://docs.bitfinex.com/reference#ws-auth-funding-trades
    static assertFundingTradesSchema(data) {
        expect(data).to.have.lengthOf(8)
        // ID
        expect(data[0]).to.be.a('number')
        // Symbol
        expect(data[1]).to.be.a('string')
        // MTS Create
        expect(data[2]).to.be.a('number')
        // Offer ID
        expect(data[3]).to.be.a('number')
        // Amount
        expect(data[4]).to.be.a('number')
        // Rate
        expect(data[5]).to.be.a('number')
        // Period
        expect(data[6]).to.be.a('number')
        // Maker (1 if true, null if false)
        expect(data[7]).to.satisfy((d) => d === null || typeof d === "number")
    }

    //  Channel: Funding Loans
    //  Documentation: https://docs.bitfinex.com/reference#ws-auth-funding-loans
    static assertFundingLoansSchema(data) {
        expect(data).to.have.lengthOf(21)
        // ID
        expect(data[0]).to.be.a('number')
        // Symbol
        expect(data[1]).to.be.a('string')
        // Side (1 = lender, -1 = borrower, 0 = both)
        expect(data[2]).to.be.within(-1,1)
        // MTS Create
        expect(data[3]).to.be.a('number')
        // MTS Update
        expect(data[4]).to.be.a('number')
        // Amount
        expect(data[5]).to.be.a('number')
        // Flags
        expect(data[6]).to.be.a('number')
        // Status
        expect(data[7]).to.be.a('string')
        // Type
        expect(data[8]).to.be.a('string')
        // Placeholder
        expect(data[9]).to.be.null
        // Placeholder
        expect(data[10]).to.be.null
        // Rate
        expect(data[11]).to.be.a('number')
        // Period
        expect(data[12]).to.be.within(2,30)
        // MTS Opening
        expect(data[13]).to.be.a('number')
        // MTS Last Payout
        expect(data[14]).to.be.a('number')
        // Placeholder
        expect(data[15]).to.be.null
        // Hidden
        expect(data[17]).to.satisfy((d) => d === null || typeof d === "number")
        // Renew
        expect(data[18]).to.be.a('number')
        // Rate Real
        expect(data[19]).to.satisfy((d) => d === null || typeof d === "number")
        // No Close
        expect(data[20]).to.be.a('number')
    }

    //  Channel: Funding Credits
    //  Documentation: https://docs.bitfinex.com/reference#ws-auth-funding-loans
    static assertFundingCreditsSchema(data) {
        expect(data).to.have.lengthOf(22)
        // ID
        expect(data[0]).to.be.a('number')
        // Symbol
        expect(data[1]).to.be.a('string')
        // Side (1 = lender, -1 = borrower, 0 = both)
        expect(data[2]).to.be.within(-1,1)
        // MTS Create
        expect(data[3]).to.be.a('number')
        // MTS Update
        expect(data[4]).to.be.a('number')
        // Amount
        expect(data[5]).to.be.a('number')
        // Flags
        expect(data[6]).to.be.a('number')
        // Status
        expect(data[7]).to.be.a('string')
        // Type
        expect(data[8]).to.be.a('string')
        // Placeholder
        expect(data[9]).to.be.null
        // Placeholder
        expect(data[10]).to.be.null
        // Rate
        expect(data[11]).to.be.a('number')
        // Period
        expect(data[12]).to.be.within(2,30)
        // MTS Opening
        expect(data[13]).to.be.a('number')
        // MTS Last Payout
        expect(data[14]).to.satisfy((d) => d === null || typeof d === "number")
        // Placeholder
        expect(data[15]).to.be.null
        // Hidden
        expect(data[16]).to.satisfy((d) => d === null || typeof d === "number")
        // Placeholder
        expect(data[17]).to.be.null
        // Renew
        expect(data[18]).to.satisfy((d) => d === null || typeof d === "number")
        // Rate Real
        expect(data[19]).to.satisfy((d) => d === null || typeof d === "number")
        // No Close
        expect(data[20]).to.be.a('number')
        // Position Pair
        expect(data[21]).to.be.a('string')
    }

}

module.exports = SchemaAssertions