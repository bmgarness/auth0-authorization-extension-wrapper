import { assert } from 'chai';
import {Auth0Wrapper, Group} from '../src';
const settings = require(__dirname + '/../config.json');
const nock = require('nock');
const sinon = require('sinon');

describe('Authentication', () => {

  let wrapper: Auth0Wrapper;

  before('Create Wrapper', () => {
    wrapper = new Auth0Wrapper();
  });

  it('should authenticate', async () => {
    const scope = nock(settings.auth0Url)
      .post('/oauth/token')
      .reply(200, {access_token: 'VALID_TOKEN', expires_in: 86400});
    await wrapper.authenticate(settings);
    assert.ok(wrapper.isAuthenticated);
  });

  it('should expire token if past expiration time', async () => {
    const stub = sinon.stub(Date, "now");
    stub.onCall(0).returns(10000000);
    stub.onCall(1).returns(96400001);
    const scope = nock(settings.auth0Url)
      .post('/oauth/token')
      .reply(200, {access_token: 'VALID_TOKEN', expires_in: 86400});
    await wrapper.authenticate(settings);
    assert.ok(!wrapper.isAuthenticated);

    stub.restore();
  });
});
