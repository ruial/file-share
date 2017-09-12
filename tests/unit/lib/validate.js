const expect = require('chai').expect;
const validate = require('../../../lib/validate');

describe('Validate', () => {

  it('should validate invalid emails', () => {
    expect(validate.isEmail(null)).to.be.false;
    expect(validate.isEmail('')).to.be.false;
    expect(validate.isEmail('test')).to.be.false;
    expect(validate.isEmail('test@example')).to.be.false;
    expect(validate.isEmail('test@example.')).to.be.false;
  });

  it('should validate valid email', () => {
    expect(validate.isEmail('test@example.com')).to.be.true;
  });

  it('should validate string length', () => {
    const f = validate.checkStringLength(2);
    expect(f(null)).to.be.false;
    expect(f('    a     ')).to.be.false;
    expect(f('ab')).to.be.true;
  });

});
