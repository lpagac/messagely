"use strict";

const Router = require("express").Router;
const router = new Router();
const { UnauthorizedError } = require("../expressError");
const Message = require("../models/message");
const middleware = require('../middleware/auth');

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
  let message = Message.get(req.params.id);
  let from_username = message.from_user.username;
  let to_username = message.to_user.username;
  let currentUsername = res.locals.user.username;

  if (currentUsername === from_username || currentUsername === to_username) {
    return res.json({ message });
  }
  else {
    throw new UnauthorizedError();
  }
});

/** POST / - post message.
 *
 * {to_username, body} =>
 *   {message: {id, from_username, to_username, body, sent_at}}
 *
 **/
router.post('/', middleware.ensureLoggedIn, async function (req, res, next) {
  let { to_username, body } = req.body;
  let message = await Message.create(res.locals.user.username, to_username, body);
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
  let m = Message.get(req.params.id);
  if (res.locals.user.username === m.to_user.username) {
    let message = await Message.markRead(req.params.id);
    return res.json({ message });
  }
  else {
    throw new UnauthorizedError();
  }
});

module.exports = router;
