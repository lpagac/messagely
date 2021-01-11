"use strict";

const bcrypt = require("bcrypt");
const { BCRYPT_WORK_FACTOR } = require("../config");
const { user } = require("../db");
const db = require("../db");
const { UnauthorizedError, NotFoundError } = require("../expressError");

`USERS SCHEMA:
username | password | first_name | last_name | phone | join_at | last_login_at`

/** User of the site. */

class User {

  /** Register new user. Returns
   *    {username, password, first_name, last_name, phone}
   */

  static async register({ username, password, first_name, last_name, phone }) {
    password = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);
    try {
      var result = await db.query(
        `INSERT INTO users (username, password, first_name, last_name, phone, join_at, last_login_at)
         VALUES ($1, $2, $3, $4, $5, current_timestamp, current_timestamp)
         RETURNING username, password, first_name, last_name`,
        [username, password, first_name, last_name, phone]
      );
    } catch (err) {
      return false;
    }
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
        return true;
      }
    }
    return false
  }

  /** Update last_login_at for user */

  static async updateLoginTimestamp(username) {
    const result = await db.query(
      `UPDATE users
       SET last_login_at = current_timestamp
       WHERE username = $1
       RETURNING last_login_at`,
      [username]
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
        `SELECT id, to_username, body, sent_at, read_at, u.username, u.first_name, u.last_name, u.phone
         FROM messages AS m
         JOIN users AS u ON u.username = m.to_username
         WHERE from_username = $1`, [username]);

      let messages = results.rows
      if (!messages) return {};
      messages = messages.map(m => {
        return {
          id: m.id,
          body: m.body,
          sent_at: m.sent_at,
          read_at: m.read_at,
          to_user: {
            username: m.username,
            first_name: m.first_name,
            last_name: m.last_name,
            phone: m.phone,
          },
        }
      });

      return messages;
    }
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
        `SELECT id, from_username, body, sent_at, read_at, u.username, u.first_name, u.last_name, u.phone
         FROM messages AS m
         JOIN users AS u ON u.username = m.from_username
         WHERE to_username = $1`, [username]);

      let messages = results.rows
      // console.log('messages object', messages);
      if (!messages) return {};
      messages = messages.map(m => {
        return {
          id: m.id,
          body: m.body,
          sent_at: m.sent_at,
          read_at: m.read_at,
          from_user: {
            username: m.username,
            first_name: m.first_name,
            last_name: m.last_name,
            phone: m.phone,
          },
        }
      });
      // console.log('after mapping', messages);
      return messages;
    }
  }
}


module.exports = User;
