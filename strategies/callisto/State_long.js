// Require your strategy's base state class
const State = require("./State.js");

// Create a new class that extends the base state class
class State_long extends State
{
    // Create a constructor that accepts the trade, config, database, and order objects
    constructor(trade, config, database, order) {

        // Call the base state class constructor
        super(trade, config, database, order);

        // Get 5m, 15m, 1h candles
        this.addCalculation("candles", "1m", `candles_1m`, { period: 30 });
    }

    /**
     * Tick function is called every time the FSM Timer ticks. In our
     * example every 1 second past every 5 minutes, plus the trade delay.
     */
    async tick() {

        // If debug mode is enabled, log the tick
        if(this.config.server.debugMode) {
            console.log(`Tick - ${this.trade.state}:${this.trade.symbol}:${this.trade.interval}`);
        }

        // Fetch all indicators added both in this class and in State.js
        await this.executeBulk().then( async ta => {

            // Reverse candles arrays
            //ta.candles_1m.reverse();

            console.log("We're long!");

            // Check target hit
            if(this.isTargetHit(ta.candles_1m)) {

                this.targetHit("long");                
                
            }

            // Check stoploss hit
            else if(this.isStoplossHit(ta.candles_1m)) {
                    
                this.stoplossHit("long", this.trade.stoplossPrice, "Stoploss");

            }

        });
    }
}

// Export the class
module.exports = State_long;