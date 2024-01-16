
// Require the base framework state class
const BotState = require("taapi-strategies/dist/fsm/BotState.js").default;

// Create a new state class
class State extends BotState
{
    // Constructor
    constructor(trade, config, database, order) {

        // Call parent constructor
        super(trade, config, database, order);

    }

    async tick() {
        throw new Error("Method 'tick()' must be implemented!");
    }

    calculateRelativeVolume(candles, period, backtrack = 0) {
        let averageVolume = 0;
        for(let i = backtrack; i < period+backtrack; i++) {
            averageVolume += candles[i].volume;
        }

        averageVolume = averageVolume / period;

        // Return the backtracked candles volume relative to the average volume
        return candles[1].volume / averageVolume * 100;
    }

    isHighRelativeVolume(candles, period) {

        let relativeVolume_current = this.calculateRelativeVolume(candles, period, 0);
        let relativeVolume_previous = this.calculateRelativeVolume(candles, period, 1);

        return relativeVolume_current > 100 || relativeVolume_previous > 100;
    }

    async targetHit(direction) {
        this.setExitDetails(this.trade.targetPrice);

        // Notify Slack that we hit the target
        this.notifications.postSlackMessage(`:white_check_mark: Target Hit (${direction})!`, {
            "Trade Reference": this.trade._id,
            "Symbol": this.trade.symbol,
            "Price": this.trade.targetPrice,
            "P/L": `${this.calculateProfit(direction)}%`,
        });

        // Exit position
        return await this.exitPosition();
    }

    async stoplossHit(direction, price, reason) {

        this.setExitDetails(price, reason);

        // Notify Slack that we hit the stoploss
        this.notifications.postSlackMessage(`:x: Stoploss Hit (${direction})!`, {
            "Trade Reference": this.trade._id,
            "Symbol": this.trade.symbol,
            "Price": price,
            "P/L": `${this.calculateProfit(direction)}%`,
            "Reason": reason
        });

        // Exit position
        return await this.exitPosition();
    }
}

module.exports = State;