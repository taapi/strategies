# Deimos

## Description

A pullback strategy, taking trades at oversold / overbought values using the "daily bullish / bearish pullback" shortlist.

This strategy scans the above shortlist, and looks at the RSI values.

### Schenario one:

Bullish pullback to the EMA200. This will look for oversold RSI values with confirmation of new bullish trend.

### Schenario two:

Bearish pullback to the EMA200. This will look for overbought RSI values with confirmation of new bearish trend.

| Property    | Value                                                 | Notes  |
|-------------|-------------------------------------------------------|--------|
| Timeframe   | 1h                                                    |        |
| Risk/Reward | 1:2                                                   |        |
| Target      | 2 times distance from daily candle close to daily EMA |        |
| Stoploss    | Daily EMA                                             |        |