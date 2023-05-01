const tf = require('@tensorflow/tfjs')
const fs = require('fs')

function createDummy(n = 100000) {
    const X = []
    const Y = []

    for (let i = 0; i < n; i++) {
        const p = 1 + parseInt(Math.random() * 1000)
        const l = 1 + parseInt(Math.random() * 1000)
        const isBig = p * l >= 250000 ? 1 : 0
        X.push([p, l])
        Y.push(isBig)
    }

    return {
        X,
        Y
    }
}

async function start() {
    let data = {}
    let inputSize = 4 * 14

    try {
        data = JSON.parse(fs.readFileSync('./chart/data-ml.txt', 'utf8'))
        tf.util.shuffle(data)
    } catch (e) {
        console.log(e)
        console.log('Something wrong. Make sure you have fetched the data.')
        return
    }


    const X_train = tf.tensor2d(data.X.slice(0, parseInt(data.X.length * 0.5)))
    const y_train = tf.tensor(data.Y.slice(0, parseInt(data.Y.length * 0.5)));

    const X_test = tf.tensor2d(data.X.slice(parseInt(data.X.length * 0.5)))
    const y_test = data.Y.slice(parseInt(data.Y.length * 0.5))

    const model = tf.sequential()

    // add layer
    model.add(
        tf.layers.dense({
            inputShape: [inputSize],
            units: 512,
            activation: 'relu',
        })
    )
    model.add(
        tf.layers.dense({
            units: 1,
            activation: 'sigmoid'
        })
    )

    model.compile({
        optimizer: tf.train.adam(0.001),
        loss: 'binaryCrossentropy',
        metrics: ['accuracy']
    })

    // train a model

    await model.fit(X_train, y_train, {
        shuffle: true,
        batchSize: 1000,
        epochs: 10,
        callbacks: {
            onEpochEnd: async (epoch, logs) => {
                console.log('==============')
                console.log('EPOCH', epoch)
                console.log('LOSS     :', logs.loss)
                console.log('ACCURACY :', logs.acc)
                console.log('==============')
            }
        }
    })
    // model.summary()


    // const dummytest = createDummy(100)

    // const eva = model.evaluate(tf.tensor2d(dummytest.X), tf.tensor(dummytest.Y), { batchSize: 2 })

    // console.log(eva.dataSync)


    // testing
    const result = model.predict(X_test).dataSync().map(item => item >= 0.5 ? 1 : 0)
    // console.log(dummytest.Y)
    // console.log(result.map(item => item >= 0.5 ? 1 : 0))

    let benar = 0
    let salah = 0

    let profit = 0
    let loss = 0
    let miss = 0

    y_test.forEach((item, index) => {
        if (item === result[index]) {
            benar += 1
        } else {
            salah += 1
        }

        if (item === 0 && result[index] === 1) {
            loss += 1
        }
        if (item === 1 && result[index] === 1) {
            profit += 1
        }
        if (item === 1 && result[index] === 0) {
            miss += 0
        }
    })


    console.log('\n\nRESULT')
    console.log('======================================')
    console.log('benar :', benar)
    console.log('salah :', salah)
    console.log('benar (%) :', benar / (benar + salah))
    console.log('======================================')

    console.log('\n\nRESULT (TRADING)')
    console.log('======================================')
    console.log('profit :', profit)
    console.log('loss :', loss)
    console.log('profit (%) :', profit / (profit + loss))

    console.log('======================================')

    // save model

    await model.save('file:///model.json')

}

start()