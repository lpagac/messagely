"use strict";

const { Router } = require("express");
const { UnauthorizedError } = require("../expressError");
const Message = require("../models/message");
const User = require('../models/user');
const middleware = require('../middleware/auth');

const router = new Router();

/** GET /:id - get detail of message.
 *
 * => {message: {id,
 *               body,
 *               sent_at,
 *               read_at,
 *               from_user: {username, first_name, last_name, phone},
 *               to_user: {username, first_name, last_name, phone}}
 *
 * Makes sure that the currently-logged-in users is either the to or from user.
 *
 **/
router.get('/:id', async function (req, res, next) {
  let message = await Message.get(req.params.id);
  let from_username = message.from_user.username;
  let to_username = message.to_user.username;
  let currentUsername = res.locals.user.username;
  // maybe refactor to handle error first
  if (currentUsername === from_username || currentUsername === to_username) {
    return res.json({ message });
  }
  else {
    throw new UnauthorizedError();
  }
});

/* GET /messages/ form to send a new message */

router.get('/', async function (req, res, next) {
  let usernames = await User.all();
  usernames = usernames.map(user => user.username);
  return res.render('new-message.html', { usernames });
});

/** POST / - post message.
 *
 * {to_username, body} =>
 *   {message: {id, from_username, to_username, body, sent_at}}
 *
 **/
router.post('/', middleware.ensureLoggedIn, async function (req, res, next) {
  let { to_username, body } = req.body;
  // console.log(res.locals.user.username, req.body);
  let from_username = res.locals.user.username;
  let message = await Message.create({ from_username, to_username, body });

  let toUser = await User.get(to_username);
  console.log(toUser.phone);
  await Message.sendSMS(from_username, toUser.phone);

  return res.json({ message });
});

/** POST/:id/read - mark message as read:
 *
 *  => {message: {id, read_at}}
 *
 * Makes sure that the only the intended recipient can mark as read.
 *
 **/
router.post('/:id/read', middleware.ensureLoggedIn, async function (req, res, next) {
  let m = await Message.get(req.params.id);
  if (res.locals.user.username === m.to_user.username) {
    let message = await Message.markRead(req.params.id);
    return res.json({ message });
  }
  else {
    throw new UnauthorizedError();
  }
});

module.exports = router;
