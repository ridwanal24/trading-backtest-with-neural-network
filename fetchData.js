const axios = require('axios').default
const fs = require('fs')
const BASE = 'https://api-testnet.bybit.com'
const pair = 'BTCUSDT'

// Fetching Kline from Source

async function fetchFromSource() {
    const timeframe = 5// minutes (1, 3, 5, 15, 30, 60, 120, 240, 360, 720)
    const timeMultiplier = 150 // 50 = 10000 candle

    let currentTime = Date.now()
    let result = []

    for (let i = 0; i < timeMultiplier; i++) {
        let retry = true

        while (retry) {
            try {
                const res = await axios.get(BASE + `/v5/market/kline?category=linear&symbol=${pair}&interval=${timeframe}&start=${currentTime - (200 * timeframe * 60 * 1000)}`)
                const data = res.data.result.list.map(item => {
                    item = {
                        pair: res.data.result.symbol,
                        timestamp: parseInt(item[0]),
                        open: parseFloat(item[1]),
                        high: parseFloat(item[2]),
                        low: parseFloat(item[3]),
                        close: parseFloat(item[4]),
                    }

                    return item
                })
                data.sort((a, b) => a.timestamp - b.timestamp)
                result = [...result, ...data]
                currentTime = data[0].timestamp

                console.log(`${i + 1}/${timeMultiplier}`)
                retry = false
            } catch (e) {
                console.log(`Retrying on Multiplier ${i + 1} `)
            }
        }
    }

    result.sort((a, b) => a.timestamp - b.timestamp)

    fs.writeFileSync('./chart/data.txt', JSON.stringify(result))
    console.log(`Fetching success`)
    // console.log(result)
}


fetchFromSource()