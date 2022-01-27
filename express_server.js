const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
// const {findUserFromEmail, authenticateUser, addNewUser, generateRandom6DigitString} = require('./functionIndex');

const bcrypt = require('bcryptjs');
const salt = bcrypt.genSaltSync(10);

const PORT = 8080;
const app = express();
app.use(cookieParser());

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));

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

//get root and redirect to URL page
app.get('/', (req, res) => {
  res.redirect('/urls');
})

//create new URL page
app.get('/urls/new', (req, res) => {
  if (!req.cookies["user_id"]) {
    res.redirect('/login');
  }
  const templateVars = {
    user_id: req.cookies["user_id"],
    user: usersDatabase[req.cookies["user_id"]],
  };
  res.render('urls_new', templateVars);
});

//My URL page with all URLs, also home page
app.get('/urls', (req, res) => {
  if (!req.cookies["user_id"]) {
    res.redirect('/login');
  }
  const templateVars = {
    urls: urlDatabase,
    user_id: req.cookies["user_id"],
    user: usersDatabase[req.cookies["user_id"]]
  };
  res.render('urls_index', templateVars);
});

//renders the indiv page per URL
app.get('/urls/:shortURL', (req, res) => {
  let keys = Object.keys(urlDatabase)
  
  //checks for valid shortURL path
  if (!keys.includes(req.params.shortURL)) {
    res.status(403).send('Invalid URL Path');

    //checks to match current user ID with creator ID
  } else if (urlDatabase[req.params.shortURL]["userID"] !== req.cookies["user_id"]) {
      res.send("You may only view URLs that you created");

    //render the page
  } else {
    const templateVars = {
      shortURL: req.params.shortURL, 
      longURL: urlDatabase[req.params.shortURL]["longURL"],
      user_id: req.cookies["user_id"],
      user: usersDatabase[req.cookies["user_id"]],
      userThatCreated: urlDatabase[req.params.shortURL]["userID"]
    };
    res.render('urls_show', templateVars)
  }
}); 

//renders registration page
app.get('/register', (req, res) => {
  const templateVars = {
    user_id: req.cookies["user_id"],
    user: usersDatabase[req.cookies["user_id"]]
  };
  res.render('urls_register', templateVars)
});

//renders login page
app.get('/login', (req, res) => {
  const templateVars = {
    user_id: req.cookies["user_id"],
    user: usersDatabase[req.cookies["user_id"]],
  };
  res.render('urls_login', templateVars)
});

//redirects to long URL website, from urls_show clicking on shortURL
app.get('/u/:shortURL', (req, res) => {
  const shortURL = req.params.shortURL;
  let keys = Object.keys(urlDatabase)
  if (!keys.includes(shortURL)) {
    res.status(403).send('Invalid URL Path');
  } else {
    const longURL = urlDatabase[shortURL]["longURL"];
    res.redirect(longURL);
  }
});


      //////// post routes //////

//generate new shortURL then send to independant page
app.post('/urls', (req, res) => {
  if (!req.cookies["user_id"]) {
    res.redirect('/login');
  } else {
    let shortURL = generateRandom6DigitString();
    urlDatabase[shortURL]={"userID":req.cookies["user_id"]};
    urlDatabase[shortURL]["longURL"] = req.body.longURL
    res.redirect(`/urls/${shortURL}`);
  }
});

//edits long URL from urls_show then goes to my URL page
app.post('/urls/:id', (req, res) => {
  if (!req.cookies["user_id"]) {
    res.redirect('/login');
  } else if(urlDatabase[req.params.id]["userID"] !== req.cookies["user_id"]) {
      res.status(403).send("You may not edit URLs that you did not create");
  } else {
    let shortURL = req.params.id;
    const newLongURL = req.body.longURL
    urlDatabase[shortURL]["longURL"] = newLongURL;
    res.redirect("/urls")
  }
});

//deletes key:pair from urldatabase object
app.post('/urls/:shortURL/delete', (req, res) => {
  const shortURL = req.params.shortURL
  if(urlDatabase[shortURL]["userID"] !== req.cookies["user_id"]) {
    res.status(403).send("You may not delete URLs that you did not create");
  }
  delete urlDatabase[shortURL];
  res.redirect('/urls');
});

//logs user out and clears cookie
app.post('/logout', (req, res) => {
  res.clearCookie('user_id')
  res.clearCookie('email')
  res.clearCookie('password')
  res.redirect('/login');
});

//creates new user, creates cookie for user_id. pushes new user to global userobj
app.post('/register', (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  if (email === "" || password === "") {
    res.status(400).send('Email and/or password must not be empty');
  }
  
  for (const user in usersDatabase) {
    if (email === usersDatabase[user]["email"]) {
      res.status(400).send('Email has already been registered');
    }
  }
  let currentId = addNewUser(email, password);
  console.log(usersDatabase); 
 
  res.cookie('user_id', currentId);
  res.redirect('/urls');
});

//confirms login info, then sets cookies
app.post('/login', (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  if (email === "" || password === "") {
    res.status(400).send('Email and/or password must not be empty');
  }
  //authenticate that user is in database
  const user = authenticateUser(email, password);
  if (user) {
    res.cookie('user_id', usersDatabase[user]["id"]);
    res.redirect('/urls');
  } else {
    res.status(400).send('Credentials did not match those on record');
  }
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

module.exports = {urlDatabase, usersDatabase}