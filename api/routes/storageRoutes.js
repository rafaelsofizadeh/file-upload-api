const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const multer = require('multer');

const storage = multer.diskStorage({
    destination: (request, file, callback) => {

    },
    filename: (request, file, callback) => {

    }
});

const fileFilter = (request, file, callback) => {

}

const upload = multer({
    storage,
    fileFilter,
    limits: {

    }
});

router.get('/', (request, response, next) => {

});

router.put('/', (request, response, next) => {

});

router.delete('/', (request, response, next) => {

});