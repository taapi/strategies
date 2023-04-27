
const BotState = require("taapi-strategies/dist/fsm/BotState.js").default;

class State extends BotState
{
    constructor(trade, config, database, order) {

        super(trade, config, database, order);

        // Get current price
        this.addCalculation("price", trade.interval, `price`);

        // Get latest closed EMA 9 value
        this.addCalculation("ema", trade.interval, "ema_9", { period: 9, backtrack: 1 });

        // Get latest closed EMA 20 value
        this.addCalculation("ema", trade.interval, "ema_20", { period: 20, backtrack: 1 });
    }

    async tick() {
        throw new Error("Method 'tick()' must be implemented!");
    }
}

module.exports = State;