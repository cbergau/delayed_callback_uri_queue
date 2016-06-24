var amqp = require('amqplib/callback_api');
var https = require('https');

var url = 'amqp://guest:guest@192.168.99.100:5672';

amqp.connect(url, function (err, conn) {
    conn.createChannel(function (err, ch) {
        var exchange = 'order_failsafe_exchange';

        console.log(" [*] Waiting for messages in %s. To exit press CTRL+C", exchange);

        ch.assertExchange(exchange, 'x-delayed-message', {durable: true});
        ch.assertQueue('', {exclusive: true}, function (err, q) {

            console.log(' [*] Waiting for logs. To exit press CTRL+C');
            ch.bindQueue(q.queue, exchange);
            ch.consume(q.queue, function (msg) {
                try {
                    var json = JSON.parse(msg.content.toString());
                } catch (Exception) {
                    console.log('Message is no JSON string');
                    return;
                }

                console.log(" [x] Received Host: '%s', Path: '%s'", json.host, json.path);
                console.log(" [x] Will call the Checkout now to store the order");

                var options = {
                    host: json.host,
                    path: json.path,
                    method: 'GET'
                };

                console.info('Options prepared:');
                console.info(options);
                console.info('Do the GET call');

                var reqGet = https.request(options, function (res) {
                    console.log("statusCode: ", res.statusCode);

                    if (res.statusCode == 200) {
                        ch.ack(msg);
                        console.log(" [x] Message ACK");
                    }

                    res.on('data', function (d) {
                        console.info('GET result:\n');
                        process.stdout.write(d);
                        console.info('\n\nCall completed');
                    });

                });

                reqGet.end();
                reqGet.on('error', function (e) {
                    console.error(e);
                    ch.nack(msg);
                    return;
                });

                console.log(" [x] Done");
            }, {noAck: false});
        });

    });
});
