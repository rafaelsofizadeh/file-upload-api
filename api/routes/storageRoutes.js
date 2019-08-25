/*
TODO:

1. Upload files
    1.1. [DONE] Able to specify folder to upload to in HTTP request
    1.2. [DONE] Save each uploaded file's entry in MongoDB
        1.2.1. [DONE] On new folder creation, generate a new schema
        1.2.2. [DONE] Create a file model
        1.2.3. Initialize a schema for each folder
    1.3. [DONE] File naming with MongoDB's _id given
        1.3.1. [DONE] Pass _id to multer.upload.single()
    1.4. Size, extension control

*/

//Main libraries imported
const express = require('express');
const mongoose = require('mongoose');
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
        const ancesterFolder = 'storage';
        const destination = request.body.destination;

        //Find ObjectID of the folder to save to, save it in request
        Folder
            .findOne({ name: destination })
            .select('_id')
            .exec()
            .then((result) => {
                request.app.locals.parentFolderId = result;
            })
            .catch((error) => {
                console.log(error);
                response
                    .status(500)
                    .json(error);
            });

        callback(null, ancesterFolder + '/' + destination + '/');
    },
    filename: (request, file, callback) => {
        const fileName = request.app.locals.fileName = request.app.locals.objectId + delimiter + file.originalname;
        callback(null, fileName);
    }
});

const fileFilter = (request, file, callback) => {
    //TODO: Add some control
    callback(null, true);
}

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 1024 * 1024 * 100 //100Mb
    }
});

//Paths

////INFO ABOUT FILES
router.get('/',
    (request, response, next) => {

    }
);

////UPLOAD FILE
const mongooseObjectId = (request, response, next) => {
    const objectId = mongoose.Types.ObjectId();
    //https://stackoverflow.com/a/38355597
    //request.locals = {};
    request.app.locals.objectId = objectId;

    next();
};

const mongooseSaveObject = (request, response, next) => {
    const file = request.file;
    const locals = request.app.locals;
    const fileName = locals.fileName;

    const uploadedEntry = new FileSystemObject({
        type: 'file',
        _id: locals.objectId,
        name: fileName,
        mimetype: file.mimetype,
        size: file.size,
        parent: locals.parentFolderId,
        path: file.path
    });

    uploadedEntry
        .save()
        .then((result) => {
            response
                .status(201)
                .json({
                    message: 'File uploaded successfully',
                    uploadedEntry: {
                        //https://bit.ly/2KMV2VQ
                        //All needed info is stored in _doc property, rest is irrelevant info
                        ...Object.assign({}, uploadedEntry._doc, { __v: undefined })
                    },
                    request: {
                        //TODO: add API response (connected with TODO2: Download files)
                    }
                });

            next();
        })
        .catch((error) => {
            console.log(error);
            response
                .status(500)
                .json(error);
        });
};

//Decided to leave '/' on the same line, sacrificing uniformity of formatting for semantics 
router.post('/',
    mongooseObjectId,
    upload.single('file'),
    mongooseSaveObject
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
}

router.delete('/', (request, response, next) => {
    const objectId = request.body['object_id'];

    FileSystemObject
        .findById(objectId)
        .exec()
        .then((result) => {
            const objectInfo = result._doc;
            //Path is relative to the starting script - app.js
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
        });
});

module.exports = router;