// Require your strategy's base state class
const State = require("./State.js");

// Create a new class that extends the base state class
class State_consolidate extends State
{
    // Create a constructor that accepts the trade, config, database, and order objects
    constructor(trade, config, database, order) {

        // Call the base state class constructor
        super(trade, config, database, order);

        // Get candles
        this.addCalculation("candles", "1h", `candles_1h`, { period: 30 });
        this.addCalculation("candles", "4h", `candles_4h`, { period: 30 });

        // Get latest stochastic RSI value, 1h, 4h, 1d, 1w
        this.addCalculation("stochrsi", "1h", "stochrsi_1h", { k: 3, d: 3 });
        this.addCalculation("stochrsi", "4h", "stochrsi_4h", { k: 3, d: 3 });
        this.addCalculation("stochrsi", "1d", "stochrsi_1d", { k: 3, d: 3 });
        this.addCalculation("stochrsi", "1w", "stochrsi_1w", { k: 3, d: 3 });
        
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
        this.executeBulk().then( ta => {

            // Reverse candles arrays
            ta.candles_1h.reverse();
            ta.candles_4h.reverse();

            let relativeVolume1h = this.calculateRelativeVolume(ta.candles_1h, 20, 1);
            let relativeVolume4h = this.calculateRelativeVolume(ta.candles_4h, 20, 1);
            
            // Then check if we have high relative volume on the 1h and 4h candles
            if(relativeVolume1h > 100 && relativeVolume4h > 100) {

                // If Stoch RSI 1h, 4h, 1d, 1w are all bullish
                if(ta.stochrsi_1h.valueFastK > ta.stochrsi_1h.valueFastD && 
                    ta.stochrsi_4h.valueFastK > ta.stochrsi_4h.valueFastD && 
                    ta.stochrsi_1d.valueFastK > ta.stochrsi_1d.valueFastD && 
                    ta.stochrsi_1w.valueFastK > ta.stochrsi_1w.valueFastD ) {

                        this.notifications.postSlackMessage(`Changing state to long_bias...`);

                        // Then we look to long positions only
                        this.changeState("long_bias");
                } 
                
                // And visa versa
                else if(ta.stochrsi_1h.valueFastK < ta.stochrsi_1h.valueFastD && 
                    ta.stochrsi_4h.valueFastK < ta.stochrsi_4h.valueFastD && 
                    ta.stochrsi_1d.valueFastK < ta.stochrsi_1d.valueFastD && 
                    ta.stochrsi_1w.valueFastK < ta.stochrsi_1w.valueFastD ) {

                        this.notifications.postSlackMessage(`Changing state to short_bias...`);

                        // Then we look to short positions only
                        this.changeState("short_bias");
                }
            }

        });
    }
}

// Export the class
module.exports = State_consolidate;