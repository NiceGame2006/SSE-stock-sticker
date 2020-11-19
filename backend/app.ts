import * as express from 'express';
import * as bodyparser from 'body-parser';

import * as fs from 'fs';
import * as csv from 'csv-parser';

const app = express();

app.use(bodyparser.json());
app.use(bodyparser.urlencoded({ extended: true }));
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.header('Access-Control-Allow-Methods', 'OPTIONS, GET, POST, PUT, DELETE');
    if ('OPTIONS' === req.method) {
        res.sendStatus(200);
        console.log('OK');
    } else {
        console.log(`${req.ip} ${req.method} ${req.url}`);
        next();
        console.log('next');
    }
});




const connections = [];
let data = [];
let i = 0;
let atleastoneconnected = false;
app.get('/', (req, res) => {
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
    });



    if (connections.length == 0) {
        atleastoneconnected = true;
        i = 0;
        data = [];

        fs.createReadStream('data.csv')
            .pipe(csv())
            .on('data', function (row) {
                data.push(row);
            })
            .on('end', function () {
                console.log('done');
            })
    }
    connections.push(res);



    req.on("close", () => {
        let clientnumber = 0;
        for (let i = 0; i < connections.length; i++) {
            if (connections[ i ] == res) {
                clientnumber = i;
                break;
            }
        }
        connections.splice(clientnumber, 1);
        console.log(`client ${clientnumber} disconnected`);
        if (connections.length == 0) {
            atleastoneconnected = false;
            console.log('no clients now');
        }
    });
});




let debounceWait;
fs.watch('data.csv', (eventType, filename) => {
    if (filename) {
        if (debounceWait) return;
        debounceWait = setTimeout(() => {
            debounceWait = false;
        }, 100);
        console.log(`${filename} was changed`);
        console.log("The type of change was:", eventType);

        i = 0;
        data = [];

        fs.createReadStream('data.csv')
            .pipe(csv())
            .on('data', function (row) {
                data.push(row);
            })
            .on('end', function () {
                console.log('done');
            })
    }
});



let interval = [];
setInterval(() => {
    connections.forEach((res) => {

        if (i == 0) {
            console.log('index: ' + i + ' ; ' + 'datatime: ' + data[ i ].Time + ' ; ' + 'rowID: ' + data[ i ].RowId + ' ; ' + 'this is the first!');

            if (data[ i ].Time == data[ i + 1 ].Time) {
                interval.push(data[ i ]);
            }
            else {
                interval.push(data[ i ]);
                for (let t = 0; t < interval.length; t++) {
                    res.write("data: " + JSON.stringify(interval[ t ]) + "\n\n");
                }
                interval = [];
            }
        }
        if (i >= 1 && i < data.length - 1) {
            console.log('index: ' + i + ' ; ' + 'datatime: ' + data[ i ].Time + ' ; ' + 'rowID: ' + data[ i ].RowId + ' ; ' + 'interval: ' + interval);

            if (data[ i ].Time == data[ i + 1 ].Time) {
                interval.push(data[ i ]);
            }
            else {
                interval.push(data[ i ]);
                for (let t = 0; t < interval.length; t++) {
                    res.write("data: " + JSON.stringify(interval[ t ]) + "\n\n");
                }
                interval = [];
            }
        }
        if (i == data.length - 1) {
            console.log('index: ' + i + ' ; ' + 'datatime: ' + data[ i ].Time + ' ; ' + 'rowID: ' + data[ i ].RowId + ' ; ' + 'this is the last!' + ' ; ' + 'interval: ' + interval);

            interval.push(data[ i ]);
            for (let t = 0; t < interval.length; t++) {
                res.write("data: " + JSON.stringify(interval[ t ]) + "\n\n");
            }
            interval = [];
        }




        i++;
        if (i >= data.length) {
            i = 0;
            interval = [];
        }
    });
}, 1000);




app.listen(3000, () => {
    console.log("Listening on port 3000");
});

