const fs = require('fs')
const SMA = require('technicalindicators').SMA
const ATR = require('technicalindicators').ATR
const RSI = require('technicalindicators').RSI

let wallet = {
    usdt: 100,
    qty: 0
}
let atrMultipler = 1
let stoploss = null
let takeProfit = null
let win = 0
let lose = 0

const orderHistory = []
let avgBuyPrice = 0

let fee = 0.05 // in %

function main() {
    const priceNormalize = 1 / 10000

    try {
        const data = JSON.parse(fs.readFileSync('./chart/data.txt', 'utf8'))

        startBacktest(data.map(item => {
            item.high = item.high * priceNormalize
            item.open = item.open * priceNormalize
            item.close = item.close * priceNormalize
            item.low = item.low * priceNormalize

            return item
        }))
    } catch (e) {
        console.log(e)
        console.log('Something wrong. Make sure you have fetched the data.')
    }
}

function startBacktest(kline = []) {
    // short direction (S)

    // kline = kline.map(item => {
    //     const high = item.high
    //     const open = item.open
    //     const close = item.close
    //     const low = item.low


    //     item.high = 1 / low / 1000
    //     item.open = 1 / open / 1000
    //     item.close = 1 / close / 1000
    //     item.low = 1 / high / 1000

    //     return item
    // })

    // end of short direction

    const compressedKline = []

    for (let i = 0; i < kline.length; i++) {
        const candle = kline[i]
        const currentPrice = kline[i].close
        compressedKline.push(candle)
        if (compressedKline.length > 210) compressedKline.shift()

        // stop loss
        if (stoploss && wallet.qty) {
            if (kline[i].low < stoploss) {
                makeOrder(stoploss, 'sell', wallet.qty)
                console.log('------------')
                console.log(i + ' balance :', wallet.usdt)
                console.log('------------')
                console.log(' ')
                stoploss = null
                lose += 1
            }
        }
        // take profit
        if (takeProfit && wallet.qty) {
            if (kline[i].high >= takeProfit) {
                makeOrder(takeProfit, 'sell', wallet.qty)
                console.log('------------')
                console.log(i + ' balance :', wallet.usdt)
                console.log('------------')
                console.log(' ')
                takeProfit = null
                win += 1
            }
        }

        // add your trading system here

        // buy

        // pyramiding
        // if (getSignal(compressedKline) === 'BUY') {
        //     if (wallet.qty) {
        //         if (currentPrice >= orderHistory[orderHistory.length - 1].price * 1.01) {
        //             let qty = parseInt(orderHistory[orderHistory.length - 1].qty / 2) || 1
        //             makeOrder(currentPrice, 'buy', qty)
        //             stoploss = currentPrice * 0.99
        //         }
        //     } else {
        //         // if no trade active
        //         let qty = parseInt(50 / 100 * wallet.usdt / currentPrice)
        //         makeOrder(currentPrice, 'buy', qty)
        //         stoploss = currentPrice * 0.99
        //     }
        // }

        if (!wallet.qty && getSignal(compressedKline) === 'BUY') {
            let qty = parseInt(wallet.usdt * 0.99 / currentPrice)
            // let qty = parseInt(90 / currentPrice)

            makeOrder(currentPrice, 'buy', qty, currentPrice * 1.06, currentPrice * 0.99)
        }

    }
}

function getSignal(kline) {

    // create your signal here
    const close = kline.map(item => item.close)
    const rsi6 = RSI.calculate({ period: 14, values: close })
    const sma200 = SMA.calculate({ period: 200, values: close })
    rsi6.reverse()
    sma200.reverse()
    close.reverse()

    // if (close[0] > sma200[0]) return 'BUY'
    if (rsi6[1] > 70 && rsi6[0] < 70) return 'BUY'
    // if (rsi6[0] > 30 && rsi6[2] < 30 && close[0] < sma200[0]) return 'BUY'
    return 'NONE'
}

function makeOrder(currentPrice, type = 'buy', qty = 1, tp = null, sl = null) {
    if (type === 'buy') {
        if (qty * currentPrice * ((100 + fee) / 100) > wallet.usdt) {
            console.log('balance kurang')
            return
        }
        avgBuyPrice = ((avgBuyPrice * wallet.qty) + (currentPrice * qty)) / (wallet.qty + qty)
        wallet.qty += qty
        wallet.usdt -= qty * currentPrice * ((100 + fee) / 100)
        orderHistory.push({ type: type, qty: qty, price: currentPrice })
        // console.log(`BUY ${qty} on ${currentPrice}`)
    }

    if (type === 'sell') {
        if (qty > wallet.qty) return
        if (qty === wallet.qty) avgBuyPrice = 0
        wallet.qty -= qty
        wallet.usdt += qty * currentPrice * ((100 - fee) / 100)
        orderHistory.push({ type: type, qty: qty, price: currentPrice })
        // console.log(`SELL ${qty} on ${currentPrice}`)
    }

    takeProfit = tp
    stoploss = sl


}


main()


console.log('win  :', win)
console.log('lose :', lose)
console.log('winrate', (win / (win + lose) * 100).toFixed(2), '%')