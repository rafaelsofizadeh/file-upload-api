const mongoose = require('mongoose');
const fs = require('fs');

const FileSystemObject = require('../models/fileSystemObject');

module.exports = {
    //[PUT, POST] ObjectId generation for both directory & file upload
    //Separated because ObjectId is needed in some intermediate steps (e.g. file naming before saving)
    mongooseObjectId: (request, response, next) => {
        const objectId = mongoose.Types.ObjectId();
        //https://stackoverflow.com/a/38355597
        request.app.locals.objectId = objectId;

        next();
    },
    //[PUT, POST] Saving file & directory schema in MongoDB
    mongooseSaveObject: (request, response, next) => {
        //Differentiating between directory & file, creating schemas
        const locals = request.app.locals;
        const body = request.body;

        const parentId = body.parentId;
        const objectId = locals.objectId;

        let uploadedEntry;
        //Directories are submitted using PUT, files using POST
        let type = request.method === 'POST' ? 'file' : 'directory';

        if (type === 'directory') {
            uploadedEntry = new FileSystemObject({
                _id: objectId,
                parent: parentId,
                name: body.name,
                type
            });
        } else if (type === 'file') {
            //request.file is defined only after multer.one(), which fires only for 'files'
            const file = request.file;

            uploadedEntry = new FileSystemObject({
                _id: objectId,
                parent: parentId,
                name: file.filename,
                mimetype: file.mimetype,
                size: file.size,
                type
            });
        }

        //Saving schemas
        uploadedEntry
            .save()
            .then((result) => {
                return FileSystemObject
                    .findByIdAndUpdate(parentId, { $push: { children: objectId } })
                    .exec();
            })
            .then((result) => {
                const entry = uploadedEntry._doc;

                response
                    .status(201)
                    .json({
                        message: 'File system object uploaded/created successfully',
                        uploadedEntry: {
                            //https://bit.ly/2KMV2VQ
                            //All needed info is stored in _doc property, rest is irrelevant info
                            ...Object.assign({}, entry, { __v: undefined })
                        },
                        request: {
                            method: 'GET',
                            url: 'localhost:3000/storage',
                            parameters: {
                                objectId: entry._id
                            }
                        }
                    });

                next();
            })
            .catch((error) => {
                console.log(error);
                response
                    .status(500)
                    .json(error);

                return;
            });
    },
    //[PUT] Physical directory creation
    fsCreateDirectory: (request, response, next) => {
        const locals = request.app.locals;

        FileSystemObject
            .findById(locals.objectId)
            .exec()
            .then((result) => {
                //https://stackoverflow.com/a/43422983
                return result.path();
            })
            .then((directoryPath) => {
                fs.mkdir(directoryPath, { recursive: false }, (error) => {
                    if (error) {
                        throw error;
                    }
                });

                next();
            })
            //TODO: add error handling
            .catch((error) => {
                console.log(error);
                return;
            });
    }
}