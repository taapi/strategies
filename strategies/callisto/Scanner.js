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
        
        // Post a message to Slack
        this.notifications.postSlackMessage(`Scanning...`);

        // Get all USDT pairs from the exchange through TAAPI
        this.taapiClient.getExchangeSymbols("crypto", this.config.exchange.id, "USDT").then( async symbols => {

            // Loop through each symbol
            for(let s in symbols) {

                // Get the symbol
                let symbol = symbols[s];

                // Reset bulk queires
                this.taapiClient.resetBulkConstructs();

                // Add RSI calculation
                this.taapiClient.addCalculation("rsi", symbol, "1h", "rsi_1h");

                // Add MACD calculation
                this.taapiClient.addCalculation("macd", symbol, "1h", "macd_1h");

                // Fetch all calculations
                await this.taapiClient.executeBulk().then( async ta => {

                    // If debug mode is enabled, log the scan item
                    if(this.config.server.debugMode) {
                        console.log(`Examining ${s}:${symbol}...`);
                    }

                    // If the RSI is less than 30 and the MACD is greater than the MACD Signal
                    // then create the trade
                    if(ta.rsi_1h.value < 30 && ta.macd_1h.valueMACD > ta.macd_1h.valueMACDSignal) {
                        await this.database.createTrade(this.config.exchange.id, symbol, "1h");

                        // Post a message to Slack
                        this.notifications.postSlackMessage(`Found trade: ${symbol} on ${this.config.exchange.id} on 1h.`);
                    }
                });

                // Wait for the configured delay between each asset (rate-limits by TAAPI)
                await this.utilities.sleep(this.config.bot.scanner.assetDelay);                
            };

            // Post a message to Slack
            this.notifications.postSlackMessage(`Scanning complete.`);
        });
    }
}

module.exports = Scanner;