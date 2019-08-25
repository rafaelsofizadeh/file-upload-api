//Directory is a file, too
const mongoose = require('mongoose');

const fileOptional = () => { return this.type === 'file' };
const directoryOptional = () => { return this.type === 'directory' };

//https://stackoverflow.com/a/40714371
const fileSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    type: {
        type: String,
        enum: ['file', 'directory'],
        required: true
    },
    name: {
        type: String,
        required: fileOptional
    },
    mimetype: {
        type: String,
        required: fileOptional
    },
    size: {
        type: String,
        required: fileOptional
    },
    parent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'File',
        required: true
    },
    children: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'File',
        required: directoryOptional
    }],
    path: {
        type: String,
        required: true
    }
});

module.exports = mongoose.model('File', fileSchema);