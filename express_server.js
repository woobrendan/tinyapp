const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const PORT = 8080;
const app = express();
app.use(cookieParser());

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = { 
  "chandler": {
    id: "chandler", 
    email: "mschanandler@bong.com", 
    password: "couldiBEapassword"
  },
 "davidortiz": {
    id: "davidortiz", 
    email: "david@ortiz.com", 
    password: "Th15password"
  }
};

// const findCurrentUser = (userObj) => {
//   if (!req.cookies["user_id"]) {
//     return null
//   }
//   for (const user in userObj) {
//     if (req.cookies["user_id"] === user) {
//       return user;
//     }
//   }
// };

const generateRandom6DigitString = () => {
  let charSet = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let result = '';
    for (let i = 6; i > 0; --i) {
      result += charSet[Math.floor(Math.random() * 62)];
    }
  return result;
};

//need a home page or root directory

//create new URL page
app.get('/urls/new', (req, res) => {
  const templateVars = {
    user_id: req.cookies["user_id"],
    user: users[req.cookies["user_id"]],
  };
  console.log(templateVars)
  res.render('urls_new', templateVars);
});

//My URL page with all URLs
app.get('/urls', (req, res) => {
  const templateVars = {
    urls: urlDatabase,
    user_id: req.cookies["user_id"],
    user: users[req.cookies["user_id"]]
  };
  res.render('urls_index', templateVars);
});

//renders the indiv page per URL
app.get('/urls/:shortURL', (req, res) => {
  const templateVars = {
    shortURL: req.params.shortURL, 
    longURL: urlDatabase[req.params.shortURL],
    user_id: req.cookies["user_id"],
    user: users[req.cookies["user_id"]]
  };
  res.render('urls_show', templateVars)
}); 
//renders registration page
app.get('/register', (req, res) => {
  const templateVars = {
    user_id: req.cookies["user_id"],
    user: users[req.cookies["user_id"]]
  };
  res.render('urls_register', templateVars)
});

//redirects to long URL website, from urls_show clicking on shortURL
app.get('/u/:shortURL', (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});


      //////// post routes //////

//generate new shortURL then send to independant page
app.post('/urls', (req, res) => {
  let shortURL = generateRandom6DigitString();
  urlDatabase[shortURL] = req.body.longURL;
  res.redirect(`/urls/${shortURL}`);
});

//edits long URL from urls_show then goes to my URL page
app.post('/urls/:id', (req, res) => {
  let shortURL = req.params.id;
  const newLongURL = req.body.longURL
  urlDatabase[shortURL] = newLongURL;
  res.redirect("/urls")
});

//deletes key:pair from urldatabase object
app.post('/urls/:shortURL/delete', (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect('/urls');
});

//allows for login, saves username as cookie
app.post('/login', (req, res) => {
  res.cookie('username', req.body.username);
  res.redirect('/urls');
});

//logs user out and clears username cookie
app.post('/logout', (req, res) => {
  res.clearCookie('user_id')
  res.clearCookie('email')
  res.clearCookie('password')
  res.redirect('/urls');
});

//creates user, creates cookie for email/pw. pushes new user to global userobj
app.post('/register', (req, res) => {
  //if email or password is empty, respond w/ 400 status code
  //if email already exists respond w/ 400 status code
  const id = generateRandom6DigitString();
  users[id] = {
    id,
    email: req.body.email,
    password: req.body.password
  };
  res.cookie('email', req.body.email);
  res.cookie('password', req.body.password);
  res.cookie('user_id', id);
  res.redirect('/urls');
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
