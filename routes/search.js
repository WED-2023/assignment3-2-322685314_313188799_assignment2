var express = require("express");
var router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const query = req.query.query;
    // logic 
    res.status(200).send({ message: "תוצאות חיפוש" });
  } catch (err) {
    next(err);
  }
});

module.exports = router;