const router = require("express").Router();
const db = require("../core/db.js");

router.get("/", (req, res) => {
  res.render("index");
});

router.get("/about", (req, res) => {
  res.render("about");
});

router.get("/faq", (req, res) => {
  res.render("faq");
});

router.get("/support", (req, res) => {
  res.render("support");
});

module.exports = router;
