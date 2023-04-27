const State = require("./State.js");

class State_start extends State
{
    constructor(trade, config, database, order) {

        super(trade, config, database, order);
    }

    async tick() {

        if(this.config.server.debugMode) {
            console.log(`Tick - ${this.trade.state}:${this.trade.symbol}:${this.trade.interval}`);
        }

        this.executeBulk().then( ta => {

            if(ta.ema_9 > ta.ema_20) {

                // Enter long position
                this.enterPosition("LONG", ta.price).then( enterPositionResult => {

                    // Verify that whole position is filled and take profit and stoploss orders are placed
                    if(enterPositionResult.success) {
                        this.changeState("long");
                    }
                });

            } else if(ta.ema_9 < ta.ema_20) {

                // Enter short position
                this.enterPosition("SHORT", ta.price).then( enterPositionResult => {

                    // Verify that whole position is filled and take profit and stoploss orders are placed
                    if(enterPositionResult.success) {
                        this.changeState("short");
                    }
                });
            }

        });
    }
}

module.exports = State_start;