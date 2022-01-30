const bcrypt = require('bcryptjs');
const salt = bcrypt.genSaltSync(10);

const findUserFromEmail = (email, userDB) => {
  for (const user in userDB) {
    if (userDB[user]["email"] === email) {
      return user;
    } else {
      return undefined;
    }
  }
};

const authenticateUser = (email, password, userDB) => {
  const user = findUserFromEmail(email, userDB);
  if (user && bcrypt.compareSync(password, userDB[user]["password"])) {
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

const addNewUser = (email, password, userDB) => {
  const userId = generateRandom6DigitString();
  const newUserObj = {
    id: userId,
    email,
    password: bcrypt.hashSync(password, salt)
  };
  userDB[userId] = newUserObj;
  return userId;
};

const checkUrlStart = (longURL) => {
  const urlHead = "http://www.";
  const headCheck = longURL.split('').splice(0, 11).join('');
  if (urlHead === headCheck){
    return longURL;
  } else {
    const fixedUrl = urlHead + longURL;
    return fixedUrl;
  }
}

module.exports = {
  findUserFromEmail,
  authenticateUser,
  generateRandom6DigitString,
  addNewUser,
  checkUrlStart
};