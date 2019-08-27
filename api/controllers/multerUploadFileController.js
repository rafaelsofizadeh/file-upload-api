const multer = require('multer');
const path = require('path');

const config = require('../../config.json');
const delimiter = config['file_system']['file_name_delimiter'];

const FileSystemObject = require('../models/fileSystemObject');

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
                response
                    .status(500)
                    .json(error);

                throw error;

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

module.exports = upload;