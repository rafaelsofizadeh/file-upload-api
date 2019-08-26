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
    1.4. [DONE] Size, extension control

*/

//Main libraries imported
const middleware = require('../middleware');
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
    const allowedFileTypes = config['file_system']['allowed_file_types'];
    const fileType = path.extname(file.originalname);

    if (allowedFileTypes.includes(fileType)) {
        callback(null, true);
    } else {
        callback(null, false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 1024 * 1024 * 100 //100Mb
    }
});

////UPLOAD FILE OR DIRECTORY
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
const deleteObjectPhysical = (objectPath) => {
    //Path exists? If yes
    if (fs.existsSync(objectPath)) {
        //Directory or file?
        const isDirectory = fs.lstatSync(objectPath).isDirectory();

        //If directory
        if (isDirectory) {
            //Go through the directory
            fs.readdirSync(objectPath).forEach((entry) => {
                //Recursively add new entry to the old path
                const deletePath = path.join(objectPath, entry);
                //No matter directory or file, recursively delete the entry
                //The function will check if it's a file or directory at the beginning of its recursive call
                deleteObjectPhysical(deletePath);
            });
            //Remove directory only after going through it (even if it's empty)
            fs.rmdirSync(objectPath);
        } else {
            //If file, delete straight away, without recursion
            fs.unlinkSync(objectPath);
        }
    }
};

function deleteObject(objectId) {
    FileSystemObject
        .findById(objectId)
        .select('children')
        .exec()
        .then((result) => {
            if (result) {
                //Save object's children, delete object, then delete the children recursively
                const children = result.children;

                FileSystemObject.findByIdAndDelete(objectId);
                if (children) {
                    children.forEach((childId) => {
                        deleteObject(childId);
                    });
                }
            }
        })
        .catch((error) => {
            throw error;
        });
}

router.delete('/', (request, response, next) => {
    const objectId = request.body.objectId;

    FileSystemObject
        .findById(objectId)
        .exec()
        .then((result) => {
            deleteObject(objectId);

            return result.path();
        })
        .then((deletePath) => {
            //TODO: error handling with http error codes
            deleteObjectPhysical(deletePath);

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