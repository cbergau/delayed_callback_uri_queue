<?php

require_once __DIR__ . '/../vendor/autoload.php';

use PhpAmqpLib\Connection\AMQPStreamConnection;
use PhpAmqpLib\Message\AMQPMessage;
use PhpAmqpLib\Wire\AMQPTable;

$connection = new AMQPStreamConnection('192.168.99.100', 5672, 'guest', 'guest');
$channel = $connection->channel();

$exchangeArgs = new AMQPTable(array(
    'x-delayed-type' => 'direct'
));

$channel->exchange_declare(
    'order_failsafe_exchange',
    'x-delayed-message',
    false,
    true,
    false,
    false,
    false,
    $exchangeArgs
);

$order = json_encode(array('host' => 'google.de', 'path' => '/'));

$msg = new AMQPMessage($order, array(
    'delivery_mode' => 2
));

$headers = new AMQPTable(array(
    'x-delay' => 5000
));

$msg->set('application_headers', $headers);
$channel->basic_publish($msg, 'order_failsafe_exchange');
$channel->close();
$connection->close();
