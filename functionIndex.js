const {usersDatabase} = require('./express_server');
const findUserFromEmail = (email) => {
  for(const user in usersDatabase) {
    if (usersDatabase[user]["email"] === email) {
      return user;
    } else {
      return null;
    }
  }
};

const authenticateUser = (email, password) => {
  const user = findUserFromEmail(email);  
  if (user && bcrypt.compareSync(password, usersDatabase[user]["password"])) {
    return user;
  } else {
    return false;
  }
};

const generateRandom6DigitString = () => {
  let charSet = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let result = '';
    for (let i = 6; i > 0; --i) {
      result += charSet[Math.floor(Math.random() * 62)];
    }
  return result;
};

const addNewUser = (email, password) => {
  const userId = generateRandom6DigitString();
  const newUserObj = {
    id: userId,
    email,
    password: bcrypt.hashSync(password, salt)
  };
  usersDatabase[userId] = newUserObj;
  return userId;
}

module.exports = {
  findUserFromEmail,
  authenticateUser,
  generateRandom6DigitString,
  addNewUser,
}