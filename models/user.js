"use strict";

const { user } = require("../db");
const db = require("../db");
const { NotFoundError } = require("../expressError");

`USERS SCHEMA:
username | password | first_name | last_name | phone | join_at | last_login_at`

/** User of the site. */

class User {

  /** Register new user. Returns
   *    {username, password, first_name, last_name, phone}
   */

  static async register({ username, password, first_name, last_name, phone }) {
    const join_at = Date.now();
    const result = await db.query(
      `INSERT INTO users (username, password, first_name, last_name, phone, join_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING username, password, first_name, last_name, phone`,
      [username, password, first_name, last_name, phone, join_at]
    );
    return result.rows[0];
  }

  /** Authenticate: is username/password valid? Returns boolean. */

  static async authenticate(username, password) {
    const result = await db.query(
      "SELECT password FROM users WHERE username = $1",
      [username]);
    let user = result.rows[0];
    if (user) {
      if (await bcrypt.compare(password, user.password) === true) {
        let token = jwt.sign({ username }, SECRET_KEY);
        return res.json({ token });
      }
    }
    throw new UnauthorizedError("Invalid user/password");
  }

  /** Update last_login_at for user */

  static async updateLoginTimestamp(username) {
    const last_login_at = Date.now();
    const result = await db.query(
      `UPDATE users
       SET(last_login_at)
       VALUES ($2)
       WHERE username = $1
       RETURNING last_login_at`,
      [username, last_login_at]
    );
    const last_login = result.rows[0];
    if (!last_login) throw new NotFoundError(`No such user: ${username}`);

    return last_login;
  }

  /** All: basic info on all users:
   * [{username, first_name, last_name}, ...] */

  static async all() {
    const result = await db.query(
      `SELECT username, first_name, last_name
       FROM users`
    )
    return result.rows;
  }

  /** Get: get user by username
   *
   * returns {username,
   *          first_name,
   *          last_name,
   *          phone,
   *          join_at,
   *          last_login_at } */

  static async get(username) {
    const result = await db.query(
      `SELECT username, first_name, last_name, phone, join_at, last_login_at
       FROM users
       WHERE username = $1`, [username]
    );
    const user = result.rows[0];
    if (!user) throw new NotFoundError(`No such user: ${username}`);

    return user;
  }
  /* MESSAGES SCHEMA:
   *  id | from_username | to_username | body | sent_at | read_at
   */

  /** Return messages from this user.
   *
   * [{id, to_user, body, sent_at, read_at}]
   *
   * where to_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesFrom(username) {
    const user = User.get(username);
    if (user) {
      const results = await db.query(
        `SELECT id, to_user, body, sent_at, read_at
         WHERE from_username = $1`, [username]);
      return results.rows;
    }
    throw new NotFoundError(`No messages from ${username} were found.`);
  }

  /** Return messages to this user.
   *
   * [{id, from_user, body, sent_at, read_at}]
   *
   * where from_user is
   *   {id, first_name, last_name, phone}
   */

  static async messagesTo(username) {
    const user = User.get(username);
    if (user) {
      const results = await db.query(
        `SELECT id, from_user, body, sent_at, read_at
        WHERE to_username = $1`, [username]);
        return results.rows;
    }
    throw new NotFoundError(`No messages to ${username} were found.`);
  }
}


module.exports = User;
