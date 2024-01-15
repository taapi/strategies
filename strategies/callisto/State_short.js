// Require your strategy's base state class
const State = require("./State.js");

// Create a new class that extends the base state class
class State_short extends State
{
    // Create a constructor that accepts the trade, config, database, and order objects
    constructor(trade, config, database, order) {

        // Call the base state class constructor
        super(trade, config, database, order);
    }

    async tick() {

        // If debug mode is enabled, log the tick
        if(this.config.server.debugMode) {
            console.log(`Tick - ${this.trade.state}:${this.trade.symbol}:${this.trade.interval}`);
        }

        // Fetch all indicators added both in this class and in State.js
        this.executeBulk().then( async ta => {

            console.log("We're short!");

            // Check target hit
            if(this.isTargetHit(candles)) {

                exitPositionResponse = await this.targetHit("long");
                this.chainTrade();
                
            }

            // Check stoploss hit
            else if(this.isStoplossHit(candles)) {
                    
                exitPositionResponse = await this.stoplossHit("long", this.trade.stoplossPrice, "Stoploss");
                this.chainTrade();

            }
        });
    }
}

// Export the class
module.exports = State_short;