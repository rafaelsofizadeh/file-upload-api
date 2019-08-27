const FileSystemObject = require('../models/fileSystemObject');

/*const getInformation = (request, response, next) => {
    FileSystemObject
        .findOne({ topLevel: true })
        .exec()
        .then((result) => {
            console.log('TOP LEVEL OBJECT', result);
            //https://stackoverflow.com/a/27137010
            return populateChildren(result._id);
        })
        .then((result) => {
            console.log('POPULATE RESULT', result);
        })
        .catch((error) => {
            throw error;
        });
}

//https://stackoverflow.com/a/27137010
const populateChildren = (object) => {
    return FileSystemObject
        .findById(objectId)
        .populate('children')
        .exec()
        .then((populatedObject) => {
            console.log('populatedObject', populatedObject);
            if (populatedObject.children) {
                populatedObject.children.forEach((childObject) => {
                    populateChildren(childObject._id);
                })
            } else {
                return populatedObject;
            }
        });
}*/

const getInformation = (request, response, next) => {
    const body = request.body;
    const objectId = body.objectId;

    FileSystemObject
        .findById(objectId)
        .populate('children')
        .exec()
        .then((result) => {
            response
                .status(200)
                .json(result);

            next();
        })
        .catch((error) => {
            response
                .status(404)
                .json(error);

            throw error;

            return;
        });
};

module.exports = getInformation;