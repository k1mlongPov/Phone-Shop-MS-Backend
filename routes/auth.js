const express = require('express');
const router = express.Router();
const authCtrl = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware'); // your JWT middleware

router.post('/register', authCtrl.register);
router.post('/resend-otp', authCtrl.resendOtp);
router.post('/verify', authCtrl.verify);
router.post('/login', authCtrl.login);
router.get('/me', authMiddleware, authCtrl.me);

module.exports = router;