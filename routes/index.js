const express = require('express');
const router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

/* GET home page. */
router.get('/privacy-policy', function(req, res, next) {
  res.render('privacy-policy.html',  { title: 'Privacy Policy' });
});

module.exports = router;
