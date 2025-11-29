const express = require("express");
const router = express.Router();
const customerCtrl = require("../controllers/customerController");
const auth = require("../middleware/authMiddleware");

router.get("/users", auth, customerCtrl.listUsers);
router.get("/search", auth, customerCtrl.search);
router.post("/", auth, customerCtrl.create);
router.put("/:id", auth, customerCtrl.update);
router.get("/", auth, customerCtrl.list);

// Dynamic routes last
router.get("/:id", customerCtrl.getById);


module.exports = router;
