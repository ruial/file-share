const expect = require('chai').expect;
const sinon = require('sinon');
const User = require('../../../models/user');

describe('User', () => {

  describe('validations', () => {

    it('should validade password, email and username', () => {
      const user = new User({username: '', email: 'test', password: 'test'});
      const errors = user.validateSync().errors;
      expect(errors.password.message).to.eq('Password requires at least 6 characters');
      expect(errors.email.message).to.eq('Invalid email');
      expect(errors.username.message).to.eq('Username is required');
    });

    it('should not have errors if fields are valid', () => {
      const user = new User({username: 'test', email: 'test@example.com', password: '123456'});
      const errors = user.validateSync();
      expect(errors).to.be.undefined;
    });

  });

  describe('reset password', () => {

    const sandbox = sinon.createSandbox();
    let stub;
    let spy;

    beforeEach(() => {
      spy = sandbox.spy();
      stub = sandbox.stub(User.prototype, 'save');
    });

    afterEach(() => {
      sandbox.restore();
    });

    it('should show error if token has expired', () => {
      const user = new User({
        username: 'test', email: 'test@example.com',
        password: '123456', resetPasswordExpires: new Date('12/12/2012')
      });
      user.resetPassword('newPassword', spy);
      expect(spy.firstCall.args[0].message).to.eq('Token expired');
      sinon.assert.notCalled(stub);
    });

    it('should change password and delete token on success', () => {
      const future = new Date();
      future.setFullYear(future.getFullYear() + 1);
      const user = new User({
        username: 'test', email: 'test@example.com',
        password: '123456', resetPasswordToken: 'token', resetPasswordExpires: future
      });
      user.resetPassword('newPassword', spy);
      sinon.assert.calledOnce(stub);
      expect(user.resetPasswordToken).to.be.undefined;
      expect(user.resetPasswordExpires).to.be.undefined;
      expect(user.password).to.eq('newPassword');
    });

  });

});
