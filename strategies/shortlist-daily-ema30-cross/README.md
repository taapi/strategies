# Daily bearish pullback shortlist

## Description

Scans all assets and creates a shortlist of all assets with price touching the 200 EMA, having:

- daily open price be below the 200 EMA
- daily close price be below the 200 EMA
- upper wick, ei highest price, be over the 200 EMA.

This will give us a list of assets, that should have pulled back into the 200 EMA but stayed below.

| Property               | Value                    | Notes                      |
|------------------------|--------------------------|----------------------------|
| Timing                 | Midnight (GMT)           | Scan time                  |
| Timeframe              | 1d                       |                            |
| Latest candle open     | < 200 EMA                |                            |
| Latest candle close    | < 200 EMA                |                            |
| Latest candle high     | > 200 EMA                |                            |