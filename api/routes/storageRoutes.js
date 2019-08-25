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
const mongooseObjectId = (request, response, next) => {
    const objectId = mongoose.Types.ObjectId();
    //https://stackoverflow.com/a/38355597
    //request.locals = {};
    request.app.locals.objectId = objectId;

    next();
};

const fsCreateDirectory = (request, response, next) => {
    const locals = request.app.locals;

    FileSystemObject
        .findById(locals.objectId)
        .exec()
        .then((result) => {
            //https://stackoverflow.com/a/43422983
            return result.path();
        })
        .then((directoryPath) => {
            console.log('path', directoryPath);
            fs.mkdir(directoryPath, { recursive: false }, (err) => {
                if (err) {
                    throw err;
                }
            });
        })
        //TODO: add error handling
        .catch((error) => {

        });
}

const mongooseSaveObject = async (request, response, next) => {
    const locals = request.app.locals;
    const body = request.body;
    const parentId = body.parentId;

    let parentProperties = [];
    if (parentId) {
        parentProperties = await FileSystemObject
            .findById(parentId)
            .select('ancestors')
            .exec();

        parentProperties.ancestors.push(parentId);
    }
    const ancestors = parentProperties.ancestors;

    let uploadedEntry;
    //Directories are submitted using PUT, files using POST
    let type = request.method === 'POST' ? 'file' : 'directory';

    if (type === 'directory') {
        uploadedEntry = new FileSystemObject({
            _id: locals.objectId,
            parent: parentId,
            name: body.name,
            ancestors,
            type
        });
    } else if (type === 'file') {
        //request.file is defined only after multer.one(), which fires only for 'files'
        const file = request.file;

        uploadedEntry = new FileSystemObject({
            _id: locals.objectId,
            parent: parentId,
            name: file.filename,
            mimetype: file.mimetype,
            size: file.size,
            ancestors,
            type
        });
    }

    uploadedEntry
        .save()
        .then((result) => {
            response
                .status(201)
                .json({
                    message: 'File system object uploaded/created successfully',
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

router.put('/',
    mongooseObjectId,
    mongooseSaveObject,
    fsCreateDirectory
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
        });
});

module.exports = router;