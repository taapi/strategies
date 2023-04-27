const ta = require("./tools/ta.js");

class Scanner {
    
    constructor(config, database, utilities, taapiClient, order, notifications) {
        this.config = config;
        this.database = database;
        this.utilities = utilities;
        this.taapiClient = taapiClient;
        this.order = order;
        this.notifications = notifications;
    }

    async scan() {
        console.log(`Scanning shortlist...`);

        for(let symbol of this.config.bot.scanner.shortlist.assets) {

            let allocationStats = await this.database.getAllocationStats();

            if(!allocationStats.isMaxedOut) {

                try {

                    this.taapiClient.resetBulkConstructs();

                    console.log("Scanning", symbol);

                    // Get latest 2 EMA 9 values
                    this.taapiClient.addCalculation("ema", symbol, this.config.bot.scanner.interval, "ema_9", { period: 9, backtracks: 2 });

                    // Get latest 2 EMA 20 values
                    this.taapiClient.addCalculation("ema", symbol, this.config.bot.scanner.interval, "ema_20", { period: 20, backtracks: 2 });

                    let ta = await this.taapiClient.executeBulk();

                    // Get EMA 9 values reversed
                    let ema9 = ta.ema_9.reverse(); // This makes the the latest value the first value in the array

                    // Get EMA 20 values reversed
                    let ema20 = ta.ema_20.reverse(); // This makes the the latest value the first value in the array

                    // Check for crossover
                    let isCrossover = ema9[0] > ema20[0] && ema9[1] < ema20[1];

                    // Check for crossunder
                    let isCrossunder = ema9[0] < ema20[0] && ema9[1] > ema20[1];

                    if(isCrossover) {

                    } else if(isCrossunder) {

                    }

                    let candles = scanTa.candles.reverse();

                    //let pricePrecision = this.utilities.countDecimals(candles[0].close);
                    let atrPercent = ta.getAtrPercent(candles[0].close, scanTa.atr.value);

                    let position = "cash";
                    //let targetPrice = null;

                    if(
                        atrPercent >= 1 &&
                        preScanTa.btcusdt_roc_1h.value > 0 &&
                        scanTa.roc.value > 0 &&
                        scanTa.macd[0].valueMACD > scanTa.macd[0].valueMACDSignal &&
                        scanTa.macd[1].valueMACD < scanTa.macd[1].valueMACDSignal) {

                        position = "long";
                        //targetPrice = this.utilities.roundDecimalValue(candles[0].close + scanTa.atr.value, pricePrecision);

                    } else if(
                        atrPercent >= 1 &&
                        preScanTa.btcusdt_roc_1h.value < 0 &&
                        scanTa.roc.value < 0 &&
                        scanTa.macd[0].valueMACD < scanTa.macd[0].valueMACDSignal &&
                        scanTa.macd[1].valueMACD > scanTa.macd[1].valueMACDSignal) {                            

                        position = "short";
                        //targetPrice = this.utilities.roundDecimalValue(candles[0].close - scanTa.atr.value, pricePrecision);
                    }

                    if(position != "cash") {

                        try {

                            await this.database.createTrade(this.config.exchange.id, symbol, this.config.bot.scanner.interval, `await_${position}`, position);

                            this.notifications.postSlackMessage(`Creating trade for ${symbol} (${position})`);

                        } catch( createTradeError ) {
                            console.log(createTradeError.message);
                        }
                    }
                } catch( scannerEngineError ) {
                    console.log(scannerEngineError.message, `Scanning ${symbol} but threw an error (above)`);
                }

                await this.utilities.sleep(this.config.bot.scanner.assetDelay);
            }
        }

        this.notifications.postSlackMessage(`Scanning complete.`);        
        
    }
}

module.exports = Scanner;