const expect = require('chai').expect;
const request = require('supertest');
const app = require('../../app');
const db = require('../../db');
const User = require('../../models/user');
const Session = require('../../models/session');

// stub the email to prevent sending it and assert that the methods are called correctly
const sinon = require('sinon');
const email = require('../../lib/email');

describe('Authentication', () => {

  function login(username, password, callback) {
    const agent = request.agent(app);
    agent.post('/users/login')
      .send({username: username, password: password})
      .expect('location', '/')
      .end(err => {
        if (err) console.log('login failed');
        callback(agent);
      });
  }

  const user = new User({username: 'test', password: '123456', email: 'test@example.com'});

  before(done => {
    db.connect(() => {
      user.save(done);
    });
  });

  after(done => {
    const promises = [User.remove(), Session.remove()];
    Promise.all(promises).then(() => db.disconnect(done));
  });


  describe('login', () => {

    // agent required to save session/cookies because of flash messages
    let agent;

    beforeEach(() => {
      agent = request.agent(app);
    });

    it('should show error without credentials', done => {
      agent.post('/users/login')
        .redirects(1)
        .expect(/Missing credentials/)
        .end(done);
    });

    it('should show error with invalid password', done => {
      agent.post('/users/login')
        .send({username: 'test', password: '123'})
        .redirects(1)
        .expect(/Invalid username\/password combination/)
        .end(done);
    });

    it('should be show error with invalid username', done => {
      agent.post('/users/login')
        .send({username: 'test1', password: '123456'})
        .redirects(1)
        .expect(/Invalid username\/password combination/)
        .end(done);
    });

    it('should allow login with valid credentials', done => {
      agent.post('/users/login')
        .send({username: 'test', password: '123456'})
        .redirects(1)
        .expect(/You are now logged in/)
        .end(done);
    });

    it('should redirect to login page when an action requires user to be logged in', done => {
      request(app)
        .post('/users/change-password')
        .expect(302)
        .expect('location', '/users/login?next=/users/change-password')
        .end(done);
    });

  });


  describe('register', () => {

    let agent;

    beforeEach(() => {
      agent = request.agent(app);
    });

    it('should not allow to register duplicate users', done => {
      agent.post('/users/register')
        .send({username: 'test', email: 'test@example.com', password: '123456'})
        .redirects(1)
        .expect(/Username or email already in use/)
        .end(done);
    });

    it('should save user if all data is valid', done => {
      agent.post('/users/register')
        .send({username: 'testRegisterSuccess', email: 'testRegisterSuccess@example.com', password: '123456'})
        .redirects(1)
        .expect(/You are now registered/)
        .end(done);
    });

  });


  describe('update password', () => {

    let agent;

    // don't create user here because it would always have the same id and saving it would fail silently
    // it's also a good idea to add/remove it in every test since data is changed in some tests
    let testUser;

    beforeEach(done => {
      testUser = new User({username: 'test-update', email: 'test-update@example.com', password: '123456'});
      testUser.save((err) => {
        if (err) return done(err);
        login('test-update', '123456', newAgent => {
          agent = newAgent;
          done();
        });
      });
    });

    afterEach(done => {
      testUser.remove(done);
    });

    it('should update password if it is valid', done => {
      agent.post('/users/change-password')
        .send({password: '1234567'})
        .redirects(1)
        .expect(/Password changed with success/)
        .end(done);
    });

    it('should not update password if it is invalid', done => {
      agent.post('/users/change-password')
        .redirects(1)
        .expect(/Password is required/)
        .end(done);
    });

    it('should clear other user sessions if password is updated with success', done => {
      login('test-update', '123456', agent2 => {
        agent.post('/users/change-password')
          .send({password: '1234567'})
          .redirects(1)
          .expect(/Password changed with success/)
          .end(err => {
            if (err) return done(err);
            agent2.get('/users/change-password')
              .expect(302) // agent 2 should be redirected if he tries to change password because he was logged out
              .expect('location', '/users/login?next=/users/change-password')
              .end(err => {
                if (err) return done(err);
                agent.get('/users/change-password')
                  .expect(200) // agent 1 should keep logged in
                  .end(done);
              });
          });
      });
    });

  });


  describe('reset password request', () => {

    const sandbox = sinon.createSandbox();

    let agent;
    let testUser;
    let emailStub;

    beforeEach(done => {
      emailStub = sandbox.stub(email, 'sendPasswordResetEmail');
      testUser = new User({username: 'test-token', email: 'test-token@example.com', password: '123456'});
      testUser.save((err) => {
        if (err) return done(err);
        login('test-token', '123456', newAgent => {
          agent = newAgent;
          done();
        });
      });
    });

    afterEach(done => {
      sandbox.restore();
      testUser.remove(done);
    });

    it('should alert if email does not exist', done => {
      agent.post('/users/reset-password')
        .send({email: ''})
        .redirects(1)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.text).to.contain('Email not found');
          sinon.assert.notCalled(emailStub);
          done();
        });
    });

    it('should send email', done => {
      agent.post('/users/reset-password')
        .send({email: 'test-token@example.com'})
        .redirects(1)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.text).to.contain('Sending an email with instructions to recover your account');
          sinon.assert.calledOnce(emailStub);
          done();
        });
    });

    it('should not send two emails in very close intervals', done => {
      agent.post('/users/reset-password')
        .send({email: 'test-token@example.com'})
        .redirects(1)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.text).to.contain('Sending an email with instructions to recover your account');
          agent.post('/users/reset-password')
            .send({email: 'test-token@example.com'})
            .redirects(1)
            .end((err, res) => {
              if(err) return done(err);
              expect(res.text).to.contain('Already sent a reset token to this email recently');
              sinon.assert.calledOnce(emailStub);
              done();
            });
        });
    });

  });


  describe('reset password', () => {
    let agent;
    let testUser;

    beforeEach(done => {
      testUser = new User({username: 'test-reset', email: 'test-reset@example.com', password: '123456'});
      // generate token calls save
      testUser.generateToken((err) => {
        if (err) return done(err);
        login('test-reset', '123456', newAgent => {
          agent = newAgent;
          done();
        });
      });
    });

    afterEach(done => {
      testUser.remove(done);
    });

    it('should show message if token is not valid', done => {
      agent.post('/users/reset-password/invalid-token')
        .send({password: '123456'})
        .redirects(1)
        .expect(/Token not found/)
        .end(done);
    });

    it('should show message if token expired', done => {
      testUser.resetPasswordExpires = new Date('12/12/2012');
      testUser.save(err => {
        if (err) return done(err);
        agent.post('/users/reset-password/' + testUser.resetPasswordToken)
          .send({password: '123456'})
          .redirects(1)
          .expect(/Token expired/)
          .end(done);
      });
    });

    it('should reset password if token is valid', done => {
      agent.post('/users/reset-password/' + testUser.resetPasswordToken)
        .send({password: '123456', password2: '123456'})
        .redirects(1)
        .expect(/Password changed, try to login/)
        .end(done);
    });

    it('should clear other sessions if password is reset with success', done => {
      login('test-reset', '123456', agent2 => {
        agent.post('/users/reset-password/' + testUser.resetPasswordToken)
          .send({password: '123456', password2: '123456'})
          .redirects(1)
          .expect(/Password changed, try to login/)
          .end(err => {
            if (err) return done(err);
            agent2.get('/users/change-password')
              .expect(302) // agent 2 should be redirected to login if he tries to change password because he was logged out
              .expect('location', '/users/login?next=/users/change-password')
              .end(err => {
                if (err) return done(err);
                agent.get('/users/change-password')
                  .expect(200) // agent 1 should keep logged in
                  .end(done);
              });
          });
      });
    });

  });


});
