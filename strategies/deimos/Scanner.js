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

        /**
         * Fetch the shortlist using the configured shortlist ID and database name.
         * 
         * The shortlist ID is used to identify the shortlist in the database. The next
         * parameter is the query, which is used to filter the results. The third parameter
         * is the sort, which is used to sort the results. The final parameter is the database
         * name, which tells us that this shortlist is stored under a different bot.
         */ 
        let shortlist = await this.database.getShortlist(this.config.bot.scanner.shortlist.id, {}, {}, this.config.bot.scanner.shortlist.dbName);
        
        // Loop through each shortlist item
        for(let s in shortlist) {

            // Get the symbol
            let symbolInfo = shortlist[s];

            // Reset bulk queires
            this.taapiClient.resetBulkConstructs();

            // Add RSI calculation
            this.taapiClient.addCalculation("rsi", symbolInfo.symbol, "1h", "rsi_1h");

            // Add MACD calculation
            this.taapiClient.addCalculation("macd", symbolInfo.symbol, "1h", "macd_1h");

            // Fetch all calculations
            await this.taapiClient.executeBulk().then( async ta => {

                // If debug mode is enabled, log the scan item
                if(this.config.server.debugMode) {
                    console.log(`Examining ${s}:${symbolInfo.symbol}...`);
                }

                // If the RSI is less than 30 and the MACD is greater than the MACD Signal
                // then create the trade
                if(ta.rsi_1h < 30 && ta.macd_1h.valueMACD > ta.macd_1h.valueMACDSignal) {
                    await this.database.createTrade(this.config.exchange.id, symbolInfo.symbol, "1h");

                    // Post a message to Slack
                    this.notifications.postSlackMessage(`Found trade: ${symbolInfo.symbol} on ${this.config.exchange.id} on 1h.`);
                }
            });

            // Wait for the configured delay between each asset (rate-limits by TAAPI)
            await this.utilities.sleep(this.config.bot.scanner.assetDelay);
        }

        this.notifications.postSlackMessage(`Scanning complete.`);        
        
    }
}

module.exports = Scanner;