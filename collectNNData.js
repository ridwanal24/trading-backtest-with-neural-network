const fs = require('fs')

function main() {

    try {
        const data = JSON.parse(fs.readFileSync('./chart/data.txt', 'utf8'))

        start(data)
    } catch (e) {
        console.log(e)
        console.log('Something wrong. Make sure you have fetched the data.')
    }

}

function start(chart) {
    let X = []
    let Y = []
    for (let i = 0; i < chart.length; i++) {
        const data = searchPL(chart, i, 14)
        X.push(data ? data.x : null)
        Y.push(data ? data.y : null)
    }

    X = X.filter(item => item !== null)
    Y = Y.filter(item => item !== null)

    fs.writeFileSync('./chart/data-ml.txt', JSON.stringify({
        X,
        Y
    }))

    let win = 0
    let lose = 0

    Y.map(item => {
        if (item === 1) win += 1
        else lose += 1
    })

    console.log('win  :', win)
    console.log('lose :', lose)
    console.log('winrate :', win / (win + lose) * 100, '%')
}

function searchPL(chart, startIndex, nCandle = 10) {
    if (startIndex < nCandle) return null

    const x = []
    // input n-candle data before current
    for (let i = 1; i <= nCandle; i++) {
        x.push((chart[startIndex].open - chart[startIndex - i].open) / chart[startIndex - i].open)
        x.push((chart[startIndex].high - chart[startIndex - i].high) / chart[startIndex - i].high)
        x.push((chart[startIndex].low - chart[startIndex - i].low) / chart[startIndex - i].low)
        x.push((chart[startIndex].close - chart[startIndex - i].close) / chart[startIndex - i].close)
    }

    // test trading
    const risk = 1
    const reward = 4
    let isWin = 0
    console.log('memproses indeks ke-', startIndex)

    for (let i = startIndex; i < chart.length - 1; i++) {

        if (chart[i + 1].high >= chart[startIndex].close * (1 + reward / 100)) {
            isWin = 1
            break
        }
        else if (chart[i + 1].low <= chart[startIndex].close * (1 - risk / 100)) {
            isWin = 0
            break;
        }

        if (i == chart.length - 2) return null
    }

    return { x, y: isWin }
}

main()