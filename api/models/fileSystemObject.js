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
    parent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'File'
    }
});

//https://stackoverflow.com/a/43422983
async function getAncestors(ancestors, objectId, model) {
    const object = await model
        .findById(objectId)
        .select('_id parent name')
        .exec();

    ancestors.unshift(object);

    if (object.parent) {
        return getAncestors(ancestors, object.parent, model);
    } else {
        return ancestors;
    }
};

fileSystemObjectSchema.methods.path = async function () {
    const model = this.model('FileSystemObject');
    const ancestors = await getAncestors([], this._id, model);
    const ancestorNames = ancestors.map(ancestor => ancestor.name);

    return ancestorNames.join('/');
};

module.exports = mongoose.model('FileSystemObject', fileSystemObjectSchema);