// Require taapi-strategies
const TaapiStrategies = require('taapi-strategies');

// Create a new instance of taapi-strategies
const app = new TaapiStrategies.default();

// Start the app
app.start({
    "start-bot": true, // Start the bot
    "start-api": true, // Start a REST API to interact with the bot
    "setup-webhook-endpoint": true, // Setup a webhook endpoint to receive signals
});