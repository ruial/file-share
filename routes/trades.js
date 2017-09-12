const express = require('express');
const router = express.Router();
const tradeController = require('../controllers/tradeController');
const auth = require('../middlewares/auth');

router.use(auth.isLoggedIn);
router.get('/', tradeController.showRequests);
router.post('/request', tradeController.sendRequest);
router.post('/cancel', tradeController.cancelRequest);
router.post('/decide', tradeController.decideRequest);

module.exports = router;
