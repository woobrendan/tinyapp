const {findUserFromEmail, authenticateUser, addNewUser, generateRandom6DigitString} = require('./helpers');
const express = require('express');
const app = express();

const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended: true}));

const cookieSession = require('cookie-session');
app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2']
}));

const bcrypt = require('bcryptjs');
const salt = bcrypt.genSaltSync(10);

const PORT = 8080;

app.set('view engine', 'ejs');


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

//get root and redirect to URL page
app.get('/', (req, res) => {
  res.redirect('/urls');
})

//create new URL page
app.get('/urls/new', (req, res) => {
  if (!req.session["user_id"]) {
    res.redirect('/login');
  }
  const templateVars = {
    user_id: req.session["user_id"],
    user: usersDatabase[req.session["user_id"]],
  };
  res.render('urls_new', templateVars);
});

//My URL page with all URLs, also home page
app.get('/urls', (req, res) => {
  if (!req.session["user_id"]) {
    res.redirect('/login');
  }
  const templateVars = {
    urls: urlDatabase,
    user_id: req.session["user_id"],
    user: usersDatabase[req.session["user_id"]]
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
  } else if (urlDatabase[req.params.shortURL]["userID"] !== req.session["user_id"]) {
      res.send("You may only view URLs that you created");

    //render the page
  } else {
    const templateVars = {
      shortURL: req.params.shortURL, 
      longURL: urlDatabase[req.params.shortURL]["longURL"],
      user_id: req.session["user_id"],
      user: usersDatabase[req.session["user_id"]],
      userThatCreated: urlDatabase[req.params.shortURL]["userID"]
    };
    res.render('urls_show', templateVars)
  }
}); 

//renders registration page
app.get('/register', (req, res) => {
  if (req.session["user_id"]) {
    res.redirect('/urls');
  }
  const templateVars = {
    user_id: req.session["user_id"],
    user: usersDatabase[req.session["user_id"]]
  };
  res.render('urls_register', templateVars)
});

//renders login page
app.get('/login', (req, res) => {
  if (req.session["user_id"]) {
    res.redirect('/urls');
  }
  const templateVars = {
    user_id: req.session["user_id"],
    user: usersDatabase[req.session["user_id"]],
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
  if (!req.session["user_id"]) {
    res.redirect('/login');
  } else {
    let shortURL = generateRandom6DigitString();
    urlDatabase[shortURL]={"userID":req.session["user_id"]};
    urlDatabase[shortURL]["longURL"] = req.body.longURL
    res.redirect(`/urls/${shortURL}`);
  }
});

//edits long URL from urls_show then goes to my URL page
app.post('/urls/:id', (req, res) => {
  if (!req.session["user_id"]) {
    res.redirect('/login');
  } else if(urlDatabase[req.params.id]["userID"] !== req.session["user_id"]) {
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
  if(urlDatabase[shortURL]["userID"] !== req.session["user_id"]) {
    res.status(403).send("You may not delete URLs that you did not create");
  } else {
    delete urlDatabase[shortURL];
    res.redirect('/urls');
  }
});

//logs user out and clears cookie
app.post('/logout', (req, res) => {
  req.session['user_id'] = null
  res.redirect('/login');
});

//creates new user, creates cookie for user_id. pushes new user to global userobj
app.post('/register', (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  if (email === "" || password === "") {
    res.status(400).send('Email and/or password must not be empty');
  } else { 
    for (const user in usersDatabase) {
      if (email === usersDatabase[user]["email"]) {
        res.status(400).send('Email has already been registered');
      }
    }
    let currentId = addNewUser(email, password, usersDatabase);
    req.session['user_id'] = currentId;
    res.redirect('/urls');
  }
});

//confirms login info, then sets cookies
app.post('/login', (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  if (email === "" || password === "") {
    res.status(400).send('Email and/or password must not be empty');
  } else {
    //authenticate that user is in database
    const user = authenticateUser(email, password, usersDatabase);
    if (user) {
      req.session['user_id'] = usersDatabase[user]["id"];
      res.redirect('/urls');
    } else {
      res.status(400).send('Credentials did not match those on record');
    }
  }
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

module.exports = {urlDatabase, usersDatabase}