var express = require('express')
    , jsdom = require('jsdom')
    , request = require('request')
    , sass = require("node-sass");

var app = express();
var hbs = require('hbs');

var serialize = function(obj) {
  var str = [];
  for(var p in obj)
    if (obj.hasOwnProperty(p)) {
      str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
    }
  return str.join("&");
}

/*********HASHMAP i18n REQUEST***********/
var geti18n = function(id, __callback){
  var rec_uri = "http://api.opentaste.eu/1.0/hash_table/get.json?_id=" + id;
  request({
    uri: rec_uri,
    headers: { 'Authorization' : 'OAuth oauth_version="1.0",oauth_signature_method="PLAINTEXT",oauth_nonce="test",oauth_timestamp="1388286570.2",oauth_consumer_key="76f4797b3a37937d9b87abe88807c96c6aceb194",oauth_token="d7fb65b5d4dd62bc63255910f5891f00ba2a7677",oauth_signature="e3672a9713c31428a2903f9621e29b271eca1b77%26e8bce1f0f1490ebec5f29d60fcdb975e8559042e"'}
  }, function(err, xhr, body){
      if(err && xhr.statusCode !== 200){
        res.render('notfound');
      }else{
        var i18n = JSON.parse(body);
        if(i18n.success){
            __callback(JSON.stringify(i18n.hash_map.value));
        }else{
          __callback("no-i18n");
        }
      }
  });
}

var getLang = function(req, res){
  var ln = '';
  if(!req.cookies.lang){
    ln = req.headers["accept-language"] ? req.headers["accept-language"].split('-')[0] : 'en';
    res.cookie('lang', ln, { maxAge: 900000, httpOnly: true });
  }else{
    ln = req.cookies.lang
  }
  return ln
}

app.set('view engine', 'html');
app.configure(function() {
    app.use(express.cookieParser());
    app.use(sass.middleware({
      src: __dirname + '/sass',
      dest: __dirname + '/public',
      debug: true,
      outputStyle: 'compressed'
    }));
});
app.engine('html', hbs.__express);
app.use(express.bodyParser());
app.use(express.static('public'));

/*Utilities for search users and iteraction*/
hbs.registerHelper('compare', function(lvalue, rvalue, options) {

    if (arguments.length < 3)
        throw new Error("Handlerbars Helper 'compare' needs 2 parameters");

    operator = options.hash.operator || "==";

    var operators = {
        '==':       function(l,r) { return l == r; },
        '===':      function(l,r) { return l === r; },
        '!=':       function(l,r) { return l != r; },
        '<':        function(l,r) { return l < r; },
        '>':        function(l,r) { return l > r; },
        '<=':       function(l,r) { return l <= r; },
        '>=':       function(l,r) { return l >= r; },
        'typeof':   function(l,r) { return typeof l == r; }
    }

    if (!operators[operator])
        throw new Error("Handlerbars Helper 'compare' doesn't know the operator "+operator);

    var result = operators[operator](lvalue,rvalue);

    if( result ) {
        return options.fn(this);
    } else {
        return options.inverse(this);
    }

});

hbs.registerHelper('getLastImg', function(images) {
    var img = '';
    if(typeof(images[images.length-1])!='undefined'){
      img = images[images.length-1].url[1]
    }
    return img;
});

hbs.registerHelper('getTerm', function(obj, item, lang) {
    return obj[item][lang];
});

hbs.registerHelper('getInnerTerm', function(obj, item, lang) {
    return options.fn(obj[item][lang]);
});

hbs.registerHelper('getN', function(obj, n) {
    return obj[n];
});

hbs.registerHelper('with', function(context, lang, options) {
  return options.fn(context[lang]);
});

hbs.registerHelper('getScrollerSize', function(obj, n) {
    return obj*n;
});


/*
*  ROUTING
*/

/*********HOME PAGE***********/
app.get('/', function(req, res) {
    var ln = getLang(req, res);
    geti18n('5330744f5267f37a4bdb06e4', function(i18n){
      res.render('index',{title:"OpenTaste", i18n:JSON.parse(i18n), lang:ln});
    });
});


/*********ABOUT***********/
app.get('/about/:page', function(req, res) {
    var ln = getLang(req, res);
    geti18n('5330744f5267f37a4bdb06e4', function(i18n){
      res.render(req.params.page, {title:req.params.page+" of OpenTaste", i18n:JSON.parse(i18n), lang:ln});
    });
});

app.get('/about', function(req, res) {
    var ln = getLang(req, res);
    geti18n('5330744f5267f37a4bdb06e4', function(i18n){
      res.render('about', {title:"About OpenTaste", i18n:JSON.parse(i18n), lang:ln});
    });
});


/*********LOGIN***********/
app.get('/login', function(req, res) {
    var ln = getLang(req, res);
    geti18n('5330744f5267f37a4bdb06e4', function(i18n){
      res.render('login', {title:"Login OpenTaste", i18n:JSON.parse(i18n), lang:ln});
    });
});

/*********CHANGE LANG***********/
app.get('/lang/:ln', function(req, res) {
    var ln = req.params.ln
        location = req.headers["referer"]!= '' ? req.headers["referer"] : '/';
    res.cookie('lang', ln, { maxAge: 900000, httpOnly: true });
    res.redirect(location);
});

/*********RECIPE***********/
app.get('/:user/:id', function(req, res) {
    var ln = getLang(req, res);
    var rec_uri = "http://api.opentaste.eu/1.0/recipes/show.json?ot-name=" + req.params.user + "&title=" + req.params.id;
    geti18n('5350e3f75267f350716d1571', function(i18n){
      request({uri: rec_uri}, function(err, response, body){
          if(err && response.statusCode !== 200){
              res.render('notfound');
          }else{
              var recipe_c = JSON.parse(response.body)
              ,   images = recipe_c.recipe.images
              ,   main_img = images.length ? images[recipe_c.recipe.images.length-1].url[1] : '';
              res.render('recipe',{user:req.params.user, id:req.params.id, content:recipe_c.recipe, main_img:main_img, images:images, i18n:JSON.parse(i18n), lang:ln});
          }
      });
    });
});

/*********SEARCH***********/
app.get('/search', function(req, res) {
    var ln = getLang(req, res);
    var rec_uri = "http://api.opentaste.eu/1.0/search/recipes.json?ocount=9&since-page=0&language="+ ln +"&tags=&taste=no&views=no&ingredients=&title=" + req.query.term;
    geti18n('5350e3ef5267f3507278f732', function(i18n){
      request({uri: rec_uri}, function(err, response, body){
          if(err && response.statusCode !== 200){
              res.render('notfound');
          }else{
              var recipe_c = JSON.parse(response.body)
              ,    total = recipe_c.num_results;

              res.render('search', {term:req.query.term, total:total, content:recipe_c, i18n:JSON.parse(i18n), lang:ln});
          }
      });
    });
});


/*********API PROXY WEB SERVICE***********/
app.get('/api/:version/:type/:name', function(req, res) {
    var rec_uri = "http://api.opentaste.eu/"+req.params.version+"/"+req.params.type+"/"+req.params.name+"?"+serialize(req.query);
    request({uri: rec_uri}, function(err, response, body){
        res.send(response.body)
    });
});


/*********USER PAGE***********/
app.get('/:user', function(req, res) {
    var ln = getLang(req, res);
    var rec_uri = "http://api.opentaste.eu/1.0/timeline/user.json?count=10&language="+ ln +"&ot_name=" + req.params.user + "&since-page=0";
    geti18n('5330744f5267f37a4bdb06e4', function(i18n){
      request({uri: rec_uri}, function(err, response, body){
          if(err && response.statusCode !== 200){
              res.render('notfound');
          }else{
              var user_c = JSON.parse(response.body)
              ,    total = user_c.num_results;

              res.render('profile',{id:req.params.user, user:user_c.recipes[0].user, content:user_c, i18n:JSON.parse(i18n), lang:ln});
          }
      });
    });
});

app.listen(18941)
console.log("Express server listening on port 18941 in %s mode", app.settings.env);
