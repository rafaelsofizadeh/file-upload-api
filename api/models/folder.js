const mongoose = require('mongoose');

const folderSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    name: {
        type: String,
        required: true
    },
    children: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'File'
    }]
});

module.exports = mongoose.model('Folder', folderSchema);