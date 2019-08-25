//Directory is a file, too
const mongoose = require('mongoose');

const fileSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    name: String,
    mimetype: String,
    size: Number,
    parent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'File'
    },
    children: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'File'
    }],
    path: {
        type: String,
        required: true
    }
});

module.exports = mongoose.model('File', fileSchema);