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
let initializeflag = false;
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
                console.log(JSON.stringify(row));
                data.push(row);
            })
            .on('end', function () {
                console.log('done, data array length: ' + data.length);
            })
    }
    connections.push(res);
    if (initializeflag == false) {
        initializeflag = true;
        senddata();
    }



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
            initializeflag = false;
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
                console.log('done, data array length: ' + data.length);
            })
    }
});




app.listen(3000, () => {
    console.log("Listening on port 3000");
});




/////////////////////////////////////////////////functions///////////////////////////////////////////////
function getInterval() {
    if (i >= 0 && i < data.length - 1) {

        interval.push(data[ i ]);
        if (data[ i + 1 ].Time != data[ i ].Time) {
            i = i + 1;
            sendflag = true;
            diffposition = data[ i ];
        }
        else {
            i = i + 1;
        }
    }
    else if (i == data.length - 1) {

        console.log('last');
        interval.push(data[ i ]);
        i = i + 1;
        sendflag = true;
        diffposition = 0;
    }
}
let interval = [];
let sendflag = false;
let betweensendtime = 1;
let diffposition;
async function senddata() {
    while (atleastoneconnected == true) {
        await new Promise(resolve => setTimeout(resolve, betweensendtime * 1000));


        while (sendflag == false) {
            // console.log('start loop ' + i);
            console.log('i: ' + i + ';                  ' + JSON.stringify(data[ i ]));
            getInterval();
            // console.log('exit loop ' + i);
        };


        console.log('interval have count:' + interval.length);
        betweensendtime = diffposition.Time - interval[ interval.length - 1 ].Time;
        if (i == data.length - 1) {
            betweensendtime = 1;
        }
        // console.log(betweensendtime);
        if (i == data.length) {         //output last also, reset to i = 0 to startover
            console.log('**************************************');
            i = 0;
        }
        console.log();


        connections.forEach((res) => {
            for (let t = 0; t < interval.length; t++) {
                res.write("data: " + JSON.stringify(interval[ t ]) + "\n\n");
            }
        });
        interval = [];
        sendflag = false;
    }
};


