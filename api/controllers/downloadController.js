const FileSystemObject = require('../models/fileSystemObject');

const downloadFile = (request, response, next) => {
    const body = request.body;
    const objectId = body.objectId;

    FileSystemObject
        .findById(objectId)
        .exec()
        .then((result) => {
            return result.path();
        })
        .then((downloadPath) => {
            const fullPath = __dirname + '/' + downloadPath;
            console.log(fullPath);
            response.download(fullPath);

            response
                .status(200)
                .json({
                    message: "File succesfully downloaded"
                });

            next();
        })
        .catch((error) => {
            console.log(error);
            response
                .status(404)
                .json(error);

            return;
        });
};

module.exports = downloadFile;