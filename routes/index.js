const express = require('express');
const router = express.Router();

const multer = require('multer');
const upload = multer({dest: 'uploads/'});

const auth = require('../middlewares/auth');
const fileController = require('../controllers/fileController');

router.get('/', fileController.allFiles);
router.post('/upload', auth.isLoggedIn, upload.single('file'), fileController.upload);
router.get('/files', auth.isLoggedIn, fileController.userFiles);
router.post('/delete', auth.isLoggedIn, fileController.remove);
router.get('/download/:storageName', fileController.download);

module.exports = router;
