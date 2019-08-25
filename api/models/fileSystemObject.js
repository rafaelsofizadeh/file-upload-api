//Directory is a file, too
const mongoose = require('mongoose');

const fileOptional = function () { return this.type === 'file'; };
const directoryOptional = function () { return this.type === 'directory'; };

//https://stackoverflow.com/a/40714371
const fileSystemObjectSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    type: {
        type: String,
        enum: ['file', 'directory'],
        required: true
    },
    name: {
        type: String,
        required: fileOptional.bind(this)
    },
    mimetype: {
        type: String,
        required: fileOptional.bind(this)
    },
    size: {
        type: String,
        required: fileOptional.bind(this)
    },
    parent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'File',
        required: true
    },
    children: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'File',
        required: directoryOptional.bind(this)
    }],
    path: {
        type: String,
        required: true
    }
});

module.exports = mongoose.model('FileSystemObject', fileSystemObjectSchema);