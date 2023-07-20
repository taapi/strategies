// Create a new Scanner class
class Scanner {
    
    // Create a constructor that accepts the config, database, utilities, taapiClient, order, and notifications objects
    constructor(config, database, utilities, taapiClient, order, notifications) {
        this.config = config;
        this.database = database;
        this.utilities = utilities;
        this.taapiClient = taapiClient;
        this.order = order;
        this.notifications = notifications;
    }

    // Mandatory scan() function
    async scan() {

        // Get all USDT pairs from the exchange through TAAPI
        this.taapiClient.getExchangeSymbols("crypto", this.config.exchange.id).then( async symbols => {

            // Loop through each symbol
            for(let s in symbols) {

                // Get the symbol
                let symbol = symbols[s];

                // Reset bulk queires
                this.taapiClient.resetBulkConstructs();

                // Get latest closed candle
                this.taapiClient.addCalculation("candle", symbol, "1d", "candle_1d", { backtrack: 1 });

                // Add EMA30 calculation
                this.taapiClient.addCalculation("ema", symbol, "1d", "ema30_1d", { backtrack: 1, period: this.config.shortlist.emaPeriod });

                // Fetch all calculations
                await this.taapiClient.executeBulk().then( async ta => {

                    // If debug mode is enabled, log the scan item
                    if(this.config.server.debugMode) {
                        console.log(`Examining ${s}:${symbol}...`);
                    }

                    // If the open price is less than the EMA30 and the close 
                    // price is greater than the EMA30, then we have a crossover
                    if(ta.candle_1d.open < ta.ema30_1d.value && ta.candle_1d.close > ta.ema30_1d.value) {

                        // Add asset to shortlist
                        this.database.setShortlistItem(this.config.shortlist.id, symbol);

                    } else {

                        // Remove asset from shortlist
                        this.database.deleteShortlistItem(this.config.shortlist.id, symbol);

                    }
                });

                // Wait for the configured delay between each asset (rate-limits by TAAPI)
                await this.utilities.sleep(this.config.bot.scanner.assetDelay);                
            };
        });
    }
}

module.exports = Scanner;