const { assert } = require('chai');
const bcrypt = require('bcryptjs');
const salt = bcrypt.genSaltSync(10);

const { findUserFromEmail, authenticateUser } = require('../helpers.js');

const testUsers = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: bcrypt.hashSync("purple-monkey-dinosaur", salt)
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: bcrypt.hashSync("dishwasher-funk", salt)
  }
};


describe('findUserFromEmail', function() {
  it('should return a user with valid email', function() {
    const user = findUserFromEmail("user@example.com", testUsers);
    const expectedUserID = "userRandomID";
    assert.equal(user, expectedUserID);
  });

  it('should return undefined when email is not in database', () => {
    const user = findUserFromEmail('NotAnEmail@gmail.com', testUsers);
    assert.equal(user, undefined);
  });
});

describe('Authenticate User', function() {
  it('should return a user with valid email and password', function() {
    const user = authenticateUser("user@example.com", "purple-monkey-dinosaur", testUsers);
    const expectedUserID = "userRandomID";
    assert.equal(user, expectedUserID);
  });

  it('should return false with valid email but invalid password', function() {
    const user = authenticateUser("user@example.com", "notThePassword", testUsers);
    assert.equal(user, false);
  });

  it('should return false with password, but invalid email', function() {
    const user = authenticateUser("nottheemail@email.com", "purple-monkey-dinosaur", testUsers);
    assert.equal(user, false);
  });

  it('should return false when email and password do NOT match', () => {
    const user = authenticateUser('NotAnEmail@gmail.com', 'somepassword', testUsers);
    assert.equal(user, false);
  });
  it('should return false when email and password are empty', () => {
    const user = authenticateUser('', '', testUsers);
    assert.equal(user, false);
  });
});
