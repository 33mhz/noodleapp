module.exports = function(app, passport) {
  // Login
  app.get('/auth/pnut',
    passport.authenticate('pnut')
  );

  // Callback
  app.get('/auth/pnut/callback',
    passport.authenticate('pnut', { failureRedirect: '/' }),
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
