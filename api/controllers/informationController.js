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
            console.log(error);
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
    FileSystemObject
        .findById(request.body.objectId)
        .populate('children')
        .exec()
        .then((result) => {
            console.log('POPULATE RESULT', result);
        })
        .catch((error) => {
            console.log(error);
        });
}

module.exports = getInformation;