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

        if(this.config.server.debugMode) {
            console.log("Scanning...");
        }

        for(let quoteAsset of this.config.shortlist.quoteAssets) {

            this.taapiClient.getExchangeSymbols("crypto", this.config.exchange.id, quoteAsset).then( async symbols => {
                
                for(let symbol of symbols) {

                    // Reset bulk queires
                    this.taapiClient.resetBulkConstructs();

                    // Add yesterdays candle to bulk query
                    this.taapiClient.addCalculation("candle", symbol, "1d", "candle_yesterday", { backtrack: 1 });

                    // Add yesterdays 200 EMA calculation to bulk query
                    this.taapiClient.addCalculation("ema", symbol, "1d", "ema_200_yesterday", { period: 200, backtrack: 1 });

                    // Execute bulk query
                    this.taapiClient.executeBulk().then( async ta => {

                        /**
                         * Check our scanner criterias
                         */ 

                        // Check if open is above 200 EMA
                        let isOpenBelow200EMA = ta.candle_yesterday.close < ta.ema_200_yesterday.value;

                        // Check if close is above 200 EMA
                        let isCloseBelow200EMA = ta.candle_yesterday.close < ta.ema_200_yesterday.value;

                        // Check if high is above 200 EMA
                        let isHighAbove200EMA = ta.candle_yesterday.high > ta.ema_200_yesterday.value;

                        if(this.config.server.debugMode) {
                            console.log(`Examining ${s}:${symbol}... ${isOpenBelow200EMA} ${isCloseBelow200EMA} ${isHighAbove200EMA}`);
                        }

                        // Check if asset is qualified
                        if(isOpenBelow200EMA && isCloseBelow200EMA && isHighAbove200EMA) {

                            // Add asset to qualified assets
                            this.database.setShortlistItem(this.config.shortlist.id, symbol, {
                                "ema200Value": ta.ema_200_yesterday.value,
                                "openPrice": ta.candle_yesterday.open,
                                "closePrice": ta.candle_yesterday.close,
                                "highPrice": ta.candle_yesterday.high,
                            });

                        } else {

                            // Remove asset from qualified assets
                            this.database.deleteShortlistItem(this.config.shortlist.id, symbol);

                        }
                    }).catch( err => {
                        console.log(err);
                    });

                    await this.utilities.sleep(this.config.bot.scanner.assetDelay);                    
                };

                await this.utilities.sleep(this.config.bot.scanner.assetDelay);

                console.log("Scanning complete.");
            });
        }
    }
}

module.exports = Scanner;