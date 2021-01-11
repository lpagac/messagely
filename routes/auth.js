"use strict";

const Router = require("express").Router;
const router = new Router();
const User = require('../models/user');
const { jwt, SECRET_KEY } = require('../config');
const {UnauthorizedError} = require('../expressError');
/** POST /login: {username, password} => {token} */

router.post('/login', async function (req, res, next) {
  const { username, password } = req.body;
  if (await User.authenticate(username, password)) {
    let token = jwt.sign({ username }, SECRET_KEY);
    return res.json({ token });
  }
  throw new UnauthorizedError("Invalid user/password");
});


/** POST /register: registers, logs in, and returns token.
 *
 * {username, password, first_name, last_name, phone} => {token}.
 */

router.post('/register', async function(req, res, next) {
  let username = req.body.username;
  let newUser = await User.register(req.body);
  console.log("newuser", newUser);
  if(newUser) {
    let token = jwt.sign({ username }, SECRET_KEY);
    return res.json({ token });
  }
  throw new UnauthorizedError(`Username "${username}" already taken.`);
})

module.exports = router;
