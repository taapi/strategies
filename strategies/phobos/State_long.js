// Require your strategy's base state class
const State = require("./State.js");

// Create a new class that extends the base state class
class State_long extends State
{
    // Create a constructor that accepts the trade, config, database, and order objects
    constructor(trade, config, database, order) {

        // Call the base state class constructor
        super(trade, config, database, order);
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
        await this.executeBulk().then( ta => {

            // If the 9 EMA is greater than the 20 EMA
            if(ta.ema_9 < ta.ema_20) {

                // Exit position
                this.exitPosition().then( exitPositionResult => {

                    // Verify that whole position is closed
                    if(exitPositionResult.success) {

                        // Enter new opposite position
                        this.enterPosition("SHORT", ta.price).then( enterPositionResult => {

                            // Verify that whole position is filled and take profit and stoploss orders are placed
                            if(enterPositionResult.success) {
                                this.changeState("short");
                            }
                        });
                    }
                });                
            }

        });
    }
}

// Export the class
module.exports = State_long;