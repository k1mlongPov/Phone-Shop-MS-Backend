const router = require("express").Router();
const userController = require("../controllers/userController");
const { verifyTokenAndAuthorization } = require("../middleware/verifyToken");

router.get("/", verifyTokenAndAuthorization, userController.getUser);
router.delete("/delete", verifyTokenAndAuthorization, userController.deleteUser);
router.put("/verify/:otp", verifyTokenAndAuthorization, userController.verifyAccount);
router.put("/verify_phone/:phone", verifyTokenAndAuthorization, userController.verifyPhone);

module.exports = router;