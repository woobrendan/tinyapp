const bcrypt = require('bcryptjs');
const salt = bcrypt.genSaltSync(10);

const urlDatabase = {
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    userID: 'lighthouseUser'
  },
  "9sm5xK": {
    longURL: "http://www.google.com",
    userID: 'chandler'
  }
};

const usersDatabase = {
  "chandler": {
    id: "chandler",
    email: "mschanandler@bong.com",
    password: bcrypt.hashSync("couldiBEapassword", salt)
  },
  "davidortiz": {
    id: "davidortiz",
    email: "david@ortiz.com",
    password: bcrypt.hashSync("Th15password", salt)
  }
};

module.exports = {
  urlDatabase, 
  usersDatabase
}