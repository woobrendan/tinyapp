const {authenticateUser, addNewUser, generateRandom6DigitString, checkUrlStart} = require('./helpers');
const { urlDatabase, usersDatabase} = require('./databases');

const express = require('express');
const app = express();

const methodOverride = require('method-override');
app.use(methodOverride('_method'))

const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended: true}));

const cookieSession = require('cookie-session');
app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2']
}));

const PORT = 8080;

app.set('view engine', 'ejs');

///////Get Routes///////

//get root and redirect to URL page
app.get('/', (req, res) => {
  res.redirect('/urls');
});

//show create new URL page
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

//URL Index page with all URLs, also home page
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
  const keys = Object.keys(urlDatabase);
  
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
    res.render('urls_show', templateVars);
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
  res.render('urls_register', templateVars);
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
  res.render('urls_login', templateVars);
});

//redirects to long URL website, from urls_show clicking on shortURL
app.get('/u/:shortURL', (req, res) => {
  const shortURL = req.params.shortURL;
  const keys = Object.keys(urlDatabase);
  if (!keys.includes(shortURL)) {
    res.status(403).send('Invalid URL Path');
  } else {
    const longURL = urlDatabase[shortURL]["longURL"];
    res.redirect(longURL);
  }
});

//////// post routes ////////

//generate new shortURL obj then go to corresponding page
app.post('/urls', (req, res) => {
  if (!req.session["user_id"]) {
    res.redirect('/login');
  } else {
    const shortURL = generateRandom6DigitString();
    const longURL = req.body.longURL;
    const confirmedUrl = checkUrlStart(longURL);
    //create new obj in urlDatabase w/ shortURL then add the longURL value
    urlDatabase[shortURL] = {"userID":req.session["user_id"]};
    urlDatabase[shortURL]["longURL"] = confirmedUrl;
    res.redirect(`/urls/${shortURL}`);
  }
});

//logs user out and clears cookie
app.post('/logout', (req, res) => {
  req.session = null;
  res.redirect('/login');
});

//creates new user, creates cookie for user_id. pushes new user to global userobj
app.post('/register', (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  if (!email || !password) {
    return res.status(400).send('Email and/or password must not be empty');
  } else {
    for (const user in usersDatabase) {
      if (email === usersDatabase[user]["email"]) {
        return res.status(400).send('Email has already been registered');
      }
    }
    const currentId = addNewUser(email, password, usersDatabase);
    req.session['user_id'] = currentId;
    res.redirect('/urls');
  }
});

//confirms login info, then sets cookies
app.post('/login', (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  if (!email || !password) {
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

///////Put and Delete Methods//////

//edits long URL from urls_show then goes to my URL page
app.put('/urls/:id', (req, res) => {
  const newLongUrl = req.body.longURL;
  if (!req.session["user_id"]) {
    res.redirect('/login');

  } else if (!newLongUrl) {
    res.status(403).send("Updated URL cannot be empty");

    //checks that creator ID matches user ID
  } else if (urlDatabase[req.params.id]["userID"] !== req.session["user_id"]) {
    res.status(403).send("You may not edit URLs that you did not create");

    //peform edit action
  } else {
    const shortURL = req.params.id;
    urlDatabase[shortURL]["longURL"] = newLongUrl;
    res.redirect("/urls");
  }
});

//deletes key:pair from urldatabase object
app.delete('/urls/:shortURL', (req, res) => {
  const shortURL = req.params.shortURL;
  const creatorId = urlDatabase[shortURL]["userID"];
  if (creatorId !== req.session["user_id"]) {
    res.status(403).send("You may not delete URLs that you did not create");
  } else {
    delete urlDatabase[shortURL];
    res.redirect('/urls');
  }
});

app.listen(PORT, () => {
  console.log(`Tinyapp listening on port ${PORT}!`);
});

module.exports = {urlDatabase, usersDatabase};