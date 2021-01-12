"use strict";

const { Router } = require("express");
const User = require('../models/user');
const { jwt, SECRET_KEY } = require('../config');
const { UnauthorizedError } = require('../expressError');

const router = new Router();

/* GET /login shows login page */
router.get('/login', async function (req, res, next){
  return res.render('login.html');
});

/** POST /login: {username, password} => {token} */

router.post('/login', async function (req, res, next) {
  const { username, password } = req.body;
  
  if (await User.authenticate(username, password)) {
    let token = jwt.sign({ username }, SECRET_KEY);
    await User.updateLoginTimestamp(username);
    return res.json({ token });
  }
  throw new UnauthorizedError("Invalid user/password");
});

/* GET /register */
router.get('/register', async function (req, res, next){
  return res.render('signup.html');
});

/** POST /register: registers, logs in, and returns token.
 *
 * {username, password, first_name, last_name, phone} => {token}.
 */

router.post('/register', async function (req, res, next) {
  let { username } = await User.register(req.body);

  let token = jwt.sign({ username }, SECRET_KEY);
  await User.updateLoginTimestamp(username);
  return res.json({ token });

})

module.exports = router;
