/*
TODO:

1. Upload files
    1.1. [DONE] Able to specify folder to upload to in HTTP request
    1.2. [DONE] Save each uploaded file's entry in MongoDB
        1.2.1. [DONE] On new folder creation, generate a new schema
        1.2.2. [DONE] Create a file model
        1.2.3. [DONE] Initialize a schema for each folder
    1.3. [DONE] File naming with MongoDB's _id given
        1.3.1. [DONE] Pass _id to multer.upload.single()
    1.4. Size, extension control

*/

//Main libraries imported
const middleware = require('../middleware');
const mongoose = require('mongoose');
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

//Config constants
const config = require('../../config.json');
const delimiter = config['file_system']['file_name_delimiter'];

//Mongoose models imported
const FileSystemObject = require('../models/fileSystemObject');

//Main services
const router = express.Router();
////Multer services
const storage = multer.diskStorage({
    destination: (request, file, callback) => {
        //Order of fields in post request is important
        //Put files after text fields
        //https://stackoverflow.com/a/43197040
        const parentId = request.body.parentId;

        FileSystemObject
            .findById(parentId)
            .exec()
            .then((result) => {
                //https://stackoverflow.com/a/43422983
                return result.path();
            })
            .then((filePath) => {
                callback(null, filePath);
            })
            .catch((error) => {
                console.log(error);
                response
                    .status(500)
                    .json(error);

                callback(error, null);
            });
    },
    filename: (request, file, callback) => {
        const fileName = request.app.locals.objectId + delimiter + file.originalname;
        callback(null, fileName);
    }
});

const fileFilter = (request, file, callback) => {
    //TODO: Add some control
    callback(null, true);
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 1024 * 1024 * 100 //100Mb
    }
});

////UPLOAD FILE

//Decided to leave '/' on the same line, sacrificing uniformity of formatting for semantics 
router.post('/',
    middleware.mongooseObjectId,
    upload.single('file'),
    middleware.mongooseSaveObject
);

router.put('/',
    middleware.mongooseObjectId,
    middleware.mongooseSaveObject,
    middleware.fsCreateDirectory
);

////DELETE FILE OR DIRECTORY
const deleteObject = (objectPath) => {
    if (fs.existsSync(objectPath)) {
        const isDirectory = fs.lstatSync(objectPath).isDirectory();

        if (isDirectory) {
            fs.readdirSync(objectPath).forEach((entry) => {
                const deletePath = path.join(objectPath, entry);
                fs.unlinkSync(deletePath);
            });
            fs.rmdirSync(objectPath);
        } else {
            fs.unlinkSync(objectPath);
        }
    }
};

router.delete('/', (request, response, next) => {
    const objectId = request.body['object_id'];

    FileSystemObject
        .findById(objectId)
        .exec()
        .then((result) => {
            const objectInfo = result._doc;
            //Path is relative to the starting script - app.js
            //FIX THIS PART, .path -> .path()
            const deletePath = objectInfo.path;

            //TODO: error handling with http error codes
            deleteObject(deletePath);

            response
                .status(200)
                .json({
                    message: "File system object deleted successfully"
                });

            next();
        })
        .catch((error) => {
            response
                .status(404)
                .json(error);

            return;
        });
});

module.exports = router;