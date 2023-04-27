// Require taapi-strategies
const TaapiStrategies = require('taapi-strategies');

// Create a new instance of taapi-strategies
const app = new TaapiStrategies.default();

// Start the app
app.start({
    "start-bot": true,
    "start-api": true,
    "setup-webhook-endpoint": true,
});