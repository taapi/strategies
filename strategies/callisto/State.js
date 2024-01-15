
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
}

module.exports = State;