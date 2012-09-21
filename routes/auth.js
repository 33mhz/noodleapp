'use strict';

module.exports = function(app, passport) {
  // Login
  app.get('/auth/appdotnet',
    passport.authenticate('appdotnet'),
    function(req, res) {
      // App.net for authentication
    }
  );

  // Callback
  app.get('/auth/appdotnet/callback',
    passport.authenticate('appdotnet', { failureRedirect: '/' }),
    function(req, res) {
      res.redirect('/');
    }
  );

  // Logout
  app.get('/logout', function(req, res) {
    req.session.destroy();
    res.status(303);
    res.redirect('/');
  });
};
