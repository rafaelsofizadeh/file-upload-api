const express = require('express');
const router = express.Router();

const uploadEntryController = require('../controllers/uploadEntryController');
const deleteEntryController = require('../controllers/deleteEntryController');
const multerUploadFileController = require('../controllers/multerUploadFileController');

//UPLOAD FILE
router.post('/',
    uploadEntryController.mongooseObjectId,
    multerUploadFileController.single('file'),
    uploadEntryController.mongooseSaveObject
);

//UPLOAD DIRECTORY
router.put('/',
    uploadEntryController.mongooseObjectId,
    uploadEntryController.mongooseSaveObject,
    uploadEntryController.fsCreateDirectory
);

//DELETE FILE OR DIRECTORY
router.delete('/', deleteEntryController);

module.exports = router;