// Require your strategy's base state class
const State = require("./State.js");

// Create a new class that extends the base state class
class State_long extends State
{
    // Create a constructor that accepts the trade, config, database, and order objects
    constructor(trade, config, database, order) {

        // Call the base state class constructor
        super(trade, config, database, order);

        // Get 5m, 15m candles
        this.addCalculation("candles", "5m", `candles_5m`, { period: 30 });
        this.addCalculation("candles", "15m", `candles_15m`, { period: 30 });

        // Get Stoch RSI 1m, 5m, 15m
        this.addCalculation("stochrsi", "1m", "stochrsi_1m", { k: 3, d: 3, results: 2 });
        this.addCalculation("stochrsi", "5m", "stochrsi_5m", { k: 3, d: 3 });
        this.addCalculation("stochrsi", "15m", "stochrsi_15m", { k: 3, d: 3 });

        // Get EMA 20, 50, 128, 200 on 1m candles
        this.addCalculation("ema", "1m", "ema20_1m", { period: 20, gaps: false });
        this.addCalculation("ema", "1m", "ema50_1m", { period: 50, gaps: false });
        this.addCalculation("ema", "1m", "ema128_1m", { period: 128, gaps: false });
        this.addCalculation("ema", "1m", "ema200_1m", { period: 200, gaps: false });
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

            // Reverse candles arrays
            ta.candles_5m.reverse();
            ta.candles_15m.reverse();

            // Reverse Stoch RSI 1m array
            let stochrsi_1m = ta.stochrsi_1m.reverse();

            // The 15m Stoch RSI must be bullish
            if(ta.stochrsi_15m.valueFastK > ta.stochrsi_15m.valueFastD) {                        

                // The 5m Stoch RSI must be bullish and less than 50
                if(ta.stochrsi_5m.valueFastK > ta.stochrsi_5m.valueFastD && ta.stochrsi_5m.valueFastK < 50) {

                    this.changeState("long_await_entry");
                    
                } else {
                    console.log("5m Stoch RSI not bullish");
                }
                
            } else {
                console.log("15m Stoch RSI not bullish");
            }

            // The 1m Stoch RSI must have a bullish cross and less than 30
            if(stochrsi_1m[0].valueFastK > stochrsi_1m[0].valueFastD && 
                stochrsi_1m[1].valueFastK < stochrsi_1m[1].valueFastD &&
                stochrsi_1m[0].valueFastK < 30) {

                    let currentPrice = ta.candles_5m[0].close;
                    let targetPrice = ta.ema20_1m[0].value;
                    let stopLossPrice = ta.ema50_1m[0].value;

                    // Enter new long position
                    this.enterPosition("LONG", ta.candles_5m[0].close).then( enterPositionResult => {

                        // Verify that whole position is filled and take profit and stoploss orders are placed
                        if(enterPositionResult.success) {
                            this.changeState("long");
                        }
                    });
            } else {
                console.log("1m Stoch RSI did not have a bullish cross and less than 30");
            }

        });
    }
}

// Export the class
module.exports = State_long;