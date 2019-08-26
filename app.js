/*
TODO:

1. Rewrite all error handling with this: https://medium.com/front-end-weekly/error-handling-in-node-javascript-suck-unless-you-know-this-2018-aa0a14cfdd9d
*/

const express = require('express');
const app = express();
const mongoose = require('mongoose');

const config = require('./config.json');
const mongodbConnectionString = config['mongodb']['connection_string'];

const storageRoutes = require('./api/routes/storageRoutes');

mongoose.connect(
    mongodbConnectionString,
    { useNewUrlParser: true }
);

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use((request, response, next) => {
    response.header('Access-Control-Allow-Origin', '*');
    response.header(
        'Access-Control-Allow-Headers',
        'Origin, X-Requested-With, Content-Type, Accept, Authorization'
    );

    if (request.method === 'OPTIONS') {
        response.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
        return response
            .status(200)
            .json();
    }

    next();
});

app.use('/storage', storageRoutes);

app.use((request, response, next) => {
    const error = new Error('Path not found');
    error.status = 404;

    next(error);
});

app.use((error, request, response, next) => {
    response
        .status(error.status || 500)
        .json({
            error: {
                message: error.message
            }
        });

    return;
});

module.exports = app;