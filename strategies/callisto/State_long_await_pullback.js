// Require your strategy's base state class
const State = require("./State.js");

// Create a new class that extends the base state class
class State_longAwaitPullback extends State
{
    // Create a constructor that accepts the trade, config, database, and order objects
    constructor(trade, config, database, order) {

        // Call the base state class constructor
        super(trade, config, database, order);

        // Get 5m, 15m candles
        this.addCalculation("candles", "5m", `candles_5m`, { period: 30 });
        this.addCalculation("candles", "15m", `candles_15m`, { period: 30 });

        // Get Bollinger Bands 1m
        this.addCalculation("bbands", "1m", "bbands_1m", { period: 20, stddev: 2 });

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

            // 15m candles must have high relative volume
            if(this.calculateRelativeVolume(ta.candles_15m, 20, 1) > 100) {

                // 5m must too have high relative volume
                if(this.calculateRelativeVolume(ta.candles_5m, 20, 1) > 100) {

                    // The 15m Stoch RSI must be bullish
                    if(ta.stochrsi_15m.valueFastK > ta.stochrsi_15m.valueFastD) {                        

                        // The 5m Stoch RSI must be bullish and less than 50
                        if(ta.stochrsi_5m.valueFastK > ta.stochrsi_5m.valueFastD && ta.stochrsi_5m.valueFastK < 50) {

                            // The 1m Stoch RSI must have a bullish cross and less than 30
                            if(stochrsi_1m[0].valueFastK > stochrsi_1m[0].valueFastD && 
                                stochrsi_1m[1].valueFastK < stochrsi_1m[1].valueFastD &&
                                stochrsi_1m[0].valueFastK < 30) {

                                    let currentPrice = ta.candles_5m[0].close;
                                    let stoplossPrice = this.getStoplossPrice(ta);
                                    let targetPrice = this.getTargetPrice(currentPrice, stoplossPrice);

                                    this.notifications.postSlackMessage(`Going long!`, {
                                        "Trade Reference": this.trade._id,
                                        "Symbol": this.trade.symbol,
                                        "Price": currentPrice,
                                        "Target": targetPrice,
                                        "Stoploss": stoplossPrice
                                    });

                                    // Enter new long position
                                    this.enterPosition("LONG", currentPrice, targetPrice, stoplossPrice).then( enterPositionResult => {

                                        // Verify that whole position is filled and take profit and stoploss orders are placed
                                        if(enterPositionResult.success) {
                                            this.changeState("long");
                                        }
                                    });
                            } else {
                                console.log("1m Stoch RSI did not have a bullish cross and less than 30");
                            }
                            
                        } else {
                            console.log("5m Stoch RSI not bullish");
                        }
                        
                    } else {
                        console.log("15m Stoch RSI not bullish");
                    }

                } else {
                    console.log("5m relative volume too low");
                }
            } 
            
            // If low 15m relative volume, return to long bias state
            else {
                this.changeState("long_bias");
            }

        });
    }

    getTargetPrice(currentPrice, stoplossPrice) {

        // Risk to reward ratio of 1:1.5
        let targetPrice = currentPrice + (currentPrice - stoplossPrice) * 1.5;

        return targetPrice;        
    }

    getStoplossPrice(ta) {

        let stoplossPrice = null;

        // Get BB span
        let bbSpan = ta.bbands_1m.valueUpperBand - ta.bbands_1m.valueLowerBand;

        // Find the EMA we're closest to. We already know that all EMAs are aligned in the correct order
        
        // First check if we're above the 200 EMA
        if(ta.candles_5m.close > ta.ema200_1m.value) {
            console.log("We're above the 200 EMA");

            // Check if we're above the 128 EMA
            if(ta.candles_5m.close > ta.ema128_1m.value) {
                console.log("We're above the 128 EMA");

                // Check if we're above the 50 EMA
                if(ta.candles_5m.close > ta.ema50_1m.value) {
                    console.log("We're above the 50 EMA");

                    // Check if we're above the 20 EMA
                    if(ta.candles_5m.close > ta.ema20_1m.value) {
                        console.log("We're above the 20 EMA");

                        // Place stoploss 10% of the BB span below the 128 EMA
                        stoplossPrice = ta.ema128_1m.value - (0.1 * bbSpan);
                    }

                    else {
                        console.log("We're between the 20 and 50 EMA");

                        // Place stoploss 5% of the BB span below the 200 EMA
                        stoplossPrice = ta.ema200_1m.value - (0.05 * bbSpan);
                    }
                } 
                
                // Otherwise we're between the 50 and 128 EMA
                else {
                    console.log("We're between the 50 and 128 EMA");

                    // Place stoploss 10% of the BB span below the 200 EMA
                    stoplossPrice = ta.ema200_1m.value - (0.1 * bbSpan);
                }
            } 
            
            // Otherwise place stoploss 10% of the BB span below the 200 EMA
            else {
                console.log("We're between the 128 and 200 EMA");

                // Place stoploss bbSpanFactor * bbSpan below the 200 EMA.
                stoplossPrice = ta.ema200_1m.value - (0.3 * bbSpan);
            }
            
        } 
        
        // Otherwise we're below the 200 EMA
        else {
            console.log("We're below the 200 EMA");

            // Place stoploss 50% * bbSpan below the 200 EMA.
            stoplossPrice = ta.ema200_1m.value - (0.5 * bbSpan);
        }

        return stoplossPrice;
    }
}

// Export the class
module.exports = State_longAwaitPullback;