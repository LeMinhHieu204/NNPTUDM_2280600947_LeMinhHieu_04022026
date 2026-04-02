let mongoose = require('mongoose');

let uploadSchema = mongoose.Schema({
    filename: {
        type: String,
        required: true
    },
    path: {
        type: String,
        required: true
    },
    size: {
        type: Number,
        required: true,
        min: 0
    },
    mimetype: {
        type: String,
        required: true
    },
    originalname: {
        type: String,
        required: true
    }
}, {
    timestamps: true
})

module.exports = mongoose.model('upload', uploadSchema)
