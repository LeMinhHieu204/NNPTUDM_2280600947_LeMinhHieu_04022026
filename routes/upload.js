var express = require("express");
var router = express.Router();
let upload = require('../utils/uploadHandler')
let path = require('path')
let uploadModel = require('../schemas/uploads')

router.post('/one_file', upload.single('file'), async function (req, res, next) {
    try {
        let savedFile = await uploadModel.create({
            filename: req.file.filename,
            path: req.file.path,
            size: req.file.size,
            mimetype: req.file.mimetype,
            originalname: req.file.originalname
        })
        res.send({
            _id: savedFile._id,
            filename: savedFile.filename,
            path: savedFile.path,
            size: savedFile.size,
            mimetype: savedFile.mimetype,
            originalname: savedFile.originalname
        })
    } catch (error) {
        next(error)
    }
})
router.post('/multiple_file', upload.array('files', 5), async function (req, res, next) {
    try {
        let savedFiles = await uploadModel.insertMany(req.files.map(f => {
            return {
                filename: f.filename,
                path: f.path,
                size: f.size,
                mimetype: f.mimetype,
                originalname: f.originalname
            }
        }))
        res.send(savedFiles.map(f => {
            return {
                _id: f._id,
                filename: f.filename,
                path: f.path,
                size: f.size,
                mimetype: f.mimetype,
                originalname: f.originalname
            }
        }))
    } catch (error) {
        next(error)
    }
})
router.get('/:filename', function (req, res, next) {
    let pathFile = path.join(__dirname, '../uploads', req.params.filename)
    res.sendFile(pathFile)
})

module.exports = router;
