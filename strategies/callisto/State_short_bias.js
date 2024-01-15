// Require your strategy's base state class
const State = require("./State.js");

// Create a new class that extends the base state class
class State_shortBias extends State
{
    // Create a constructor that accepts the trade, config, database, and order objects
    constructor(trade, config, database, order) {

        // Call the base state class constructor
        super(trade, config, database, order);

        // Get 5m, 15m, 1h candles
        this.addCalculation("candles", "5m", `candles_5m`, { period: 30 });
        this.addCalculation("candles", "15m", `candles_15m`, { period: 30 });
        this.addCalculation("candles", "1h", `candles_1h`, { period: 30 });

        // Get EMA 50, 128, 200 on 1m candles
        this.addCalculation("ema", "1m", "ema50_1m", { period: 50, gaps: false });
        this.addCalculation("ema", "1m", "ema128_1m", { period: 128, gaps: false });
        this.addCalculation("ema", "1m", "ema200_1m", { period: 200, gaps: false });

        // Get EMA 50, 128, 200 on 5m candles
        this.addCalculation("ema", "5m", "ema50_5m", { period: 50, gaps: false });
        this.addCalculation("ema", "5m", "ema128_5m", { period: 128, gaps: false });
        this.addCalculation("ema", "5m", "ema200_5m", { period: 200, gaps: false });

        // Get EMA 50, 128, 200 on 15m candles
        this.addCalculation("ema", "15m", "ema50_15m", { period: 50, gaps: false });
        this.addCalculation("ema", "15m", "ema128_15m", { period: 128, gaps: false });
        this.addCalculation("ema", "15m", "ema200_15m", { period: 200, gaps: false });

        // Get EMA 50, 128, 200 on 1h candles
        this.addCalculation("ema", "1h", "ema50_1h", { period: 50, gaps: false });
        this.addCalculation("ema", "1h", "ema128_1h", { period: 128, gaps: false });
        this.addCalculation("ema", "1h", "ema200_1h", { period: 200, gaps: false });
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
            ta.candles_5m.reverse();
            ta.candles_15m.reverse();
            ta.candles_1h.reverse();

            // If the relative volume is low (less than 100) on the 1h, return to consolidate state
            if(this.calculateRelativeVolume(ta.candles_1h, 20, 1) < 100) {

                this.notifications.postSlackMessage(`Changing state back to consolidate...`);
                this.changeState("consolidate");
            }

            // Else, the 5m and 15m must also have high relative volume
            else if(this.calculateRelativeVolume(ta.candles_5m, 20, 1) > 100 &&
                this.calculateRelativeVolume(ta.candles_15m, 20, 1) > 100) {
                
                // Finally, all the Exponential Moving Averages must align in the correct order for being long biased
                if(ta.ema50_1m.value < ta.ema128_1m.value && ta.ema128_1m.value < ta.ema200_1m.value &&
                    ta.ema50_5m.value < ta.ema128_5m.value && ta.ema128_5m.value < ta.ema200_5m.value &&
                    ta.ema50_15m.value < ta.ema128_15m.value && ta.ema128_15m.value < ta.ema200_15m.value &&
                    ta.ema50_1h.value < ta.ema128_1h.value && ta.ema128_1h.value < ta.ema200_1h.value) {

                        this.notifications.postSlackMessage(`Changing state to short await pullback...`);
                    
                    // Change state to Await Pullback
                    this.changeState("short_await_pullback");
                }
            }            

        });
    }
}

// Export the class
module.exports = State_shortBias;