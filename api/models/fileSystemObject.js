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

//https://stackoverflow.com/a/43422983
fileSystemObjectSchema.methods.path = async function () {
    const model = this.model('FileSystemObject');

    const ancestorNames = await Promise.all(
        this.ancestors.map(async (ancestorId) => {
            return (
                await model
                    .findById(ancestorId)
                    .select('name')
                    .exec()
            ).name;
        })
    ) || [];

    ancestorNames.push(this.name);
    const fullPath = ancestorNames.join('/');

    return fullPath;
};

module.exports = mongoose.model('FileSystemObject', fileSystemObjectSchema);