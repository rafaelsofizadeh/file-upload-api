const path = require('path');
const fs = require('fs');

const FileSystemObject = require('../models/fileSystemObject');

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

const deleteObject = (objectId) => {
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
};

const deleteHandler = (request, response, next) => {
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
};

module.exports = deleteHandler;