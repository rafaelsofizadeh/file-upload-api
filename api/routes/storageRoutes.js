/*
TODO:

1. Replace the hierarchy with mongoose-mpath plugin
2. Use .pre() hooks for deletion

*/

const express = require('express');
const router = express.Router();

const uploadEntryController = require('../controllers/uploadEntryController');
const deleteEntryController = require('../controllers/deleteEntryController');
const multerUploadFileController = require('../controllers/multerUploadFileController');
const informationController = require('../controllers/informationController');
const downloadController = require('../controllers/downloadController');

//GET INFO
router.get('/', informationController);

//DOWNLOAD FILE
router.get('/download', downloadController);

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