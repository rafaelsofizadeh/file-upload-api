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
        required: true
    },
    mimetype: {
        type: String,
        required: fileOptional.bind(this)
    },
    size: {
        type: String,
        required: fileOptional.bind(this)
    },
    ancestors: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'File',
        required: true
    }],
    parent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'File'
    }
});

fileSystemObjectSchema.methods.path = function () {
    const model = this.model('FileSystemObject');

    const ancestorNames = this.ancestors.map(async (ancestorId) => {
        return await model
            .findById(ancestorId)
            .select('name')
            .exec();
    }) || [];

    ancestorNames.push(this.name);
    const fullPath = ancestorNames.join('/');
    console.log(this.name);
    console.log();
    console.log();
    console.log();
    console.log(fullPath);
    console.log();
    console.log();
    console.log();

    return fullPath;
};

module.exports = mongoose.model('FileSystemObject', fileSystemObjectSchema);