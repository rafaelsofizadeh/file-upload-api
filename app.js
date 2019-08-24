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

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

//First non-middleware use()
//Adds the necessary HTTP headers
//'...-Allow-Origin' — IPs allowed to make connections to the REST API
//'...-Allow-Headers' — Headers allowed to be passed to API
//Before any HTTP request, the server by default sends an OPTIONS request, which asks for permission
//'...-Allow-Methods' is the header returned to OPTIONS request, showing which HTTP methods are allowed
app.use((request, response, next) => {
    response.header('Access-Control-Allow-Origin', '*');
    response.header(
        'Access-Control-Allow-Headers',
        'Origin, X-Requested-With, Content-Type, Accept, Authorization'
    );

    if (request.method === 'OPTIONS') {
        response.header('Access-Control-Allow-Methods', 'GET, PUT, DELETE');
        return response
            .status(200)
            .json();
    }

    next();
});

//use() Routes
//This is for top-level routes, and each route is handled differently by its own route handler
//'.../storage and '.../storage/...' get produced by handler defined in storageRoutes->'./api/routes/storage.js'
//etc.
app.use('/storage', storageRoutes);

//Ordinary error handling path
//Routes are processed by their order in code
//If neither route on the top works as intended and throws an error, workflow would be passed to this handler...
app.use((request, response, next) => {
    const error = new Error('Path not found');
    error.status = 404;

    next(error);
});

//...which is further processed in this secondary error handler
app.use((error, request, response, next) => {
    response
        .status(error.status || 500)
        .json({
            error: {
                message: error.message
            }
        });
});

module.exports = app;