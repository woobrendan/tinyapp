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

const generateRandom6DigitString = () => {
  let charSet = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let result = '';
    for (let i = 6; i > 0; --i) {
      result += charSet[Math.floor(Math.random() * 62)];
    }
  return result;
};


//create new URL page
app.get('/urls/new', (req, res) => {
  const templateVars = {
    username: req.cookies["username"]
  };
  res.render('urls_new', templateVars);
});

//My URL page with all URLs
app.get('/urls', (req, res) => {
  const templateVars = {
    urls: urlDatabase,
    username: req.cookies["username"]
  };
  res.render('urls_index', templateVars);
});

//renders the indiv page per URL
app.get('/urls/:shortURL', (req, res) => {
  const templateVars = {
    shortURL: req.params.shortURL, 
    longURL: urlDatabase[req.params.shortURL],
    username: req.cookies["username"]
  };
  res.render('urls_show', templateVars)
}); 

//redirects to long URL website, from urls_show clicking on shortURL
app.get('/u/:shortURL', (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

//renders registration page
app.get('/register', (req, res) => {
  const templateVars = {
    username: req.cookies["username"]
  };
  res.render('urls_register', templateVars)
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
  res.clearCookie('username')
  res.redirect('/urls');
})

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
