const mongoose = require('mongoose');
const fs = require('fs');

//Mongoose models imported
const FileSystemObject = require('./models/fileSystemObject');

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
    mongooseSaveObject: async (request, response, next) => {
        //——————(1) Differentiating between directory & file, creating schemas
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

        //——————(2) Updating parent's children
        FileSystemObject.findByIdAndUpdate(
            parentId,
            { $push: { children: objectId } }
        );

        //——————(3) Saving schemas
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
                console.log('path', directoryPath);
                fs.mkdir(directoryPath, { recursive: false }, (error) => {
                    if (error) {
                        throw error;
                    }
                });
            })
            //TODO: add error handling
            .catch((error) => {
                console.log(error);
                return;
            });
    }
}