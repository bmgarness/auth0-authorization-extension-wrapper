import {Auth0Wrapper, Group} from "../src";
import {assert} from "chai";
import nock = require("nock");
import sinon = require("sinon");
const settings = require(__dirname + '/../config.json');

function assertGroup(group: Group) {
  assert.isObject(group);
  assert.isString(group.name, 'name');
  assert.isString(group.description, 'description');
}

describe('cache', () => {

  let created: Group = {
    name: "RandomGroup",
    description: "E",
    _id: "1234"
  };

  let updated: Group = {
    name: "NEW NAME",
    description: "NEW DESCRIPTION",
    _id: "4321"
  };

  let wrapper: Auth0Wrapper;

  before('give auth token to wrapper', async () => {
    wrapper = new Auth0Wrapper();
    const scope = nock(settings.auth0Url)
      .post('/oauth/token')
      .reply(200, {access_token: 'VALID_TOKEN', expires_in: 86400});
    await wrapper.authenticate(settings);
    assert.ok(wrapper.isAuthenticated);
  });

  it('returns old results made within 10 seconds', async () => {
    const stub = sinon.stub(Date, "now");
    stub.onCall(0).returns(10000000);
    stub.onCall(1).returns(10000000);
    stub.onCall(2).returns(10000001);
    const scope = nock(settings.auth0AuthExtensionUrl)
      .get('/groups/1234', {"qs": "expand"})
      .reply(200, created);
    const expanded = await wrapper.getExpandedGroup(created._id);
    assertGroup(expanded);
    const expanded2 = await wrapper.getExpandedGroup(created._id);
    assert.equal(expanded, expanded2);

    stub.restore();
  });

  it('invalidates the cache', async () => {
    const scope = nock(settings.auth0AuthExtensionUrl)
      .get('/groups/' + created._id)
      .reply(200, created);
    const expanded = await wrapper.getExpandedGroup(created._id);
    assertGroup(expanded);
    const scope1 = nock(settings.auth0AuthExtensionUrl)
      .put('/groups/' + created._id)
      .reply(200, updated);
    const res = await wrapper.updateGroup(created);
    const scope2 = nock(settings.auth0AuthExtensionUrl)
      .get('/groups/' + created._id)
      .reply(200, updated);
    const res2 = await wrapper.getExpandedGroup(created._id);
    assert.equal(res.name, res2.name);
  });

  it('can change the lifespan of a cache', () => {
    assert.equal(wrapper.defaultCacheLifeSpan, 10000);
    wrapper.defaultCacheLifeSpan = 20000;
    assert.equal(wrapper.defaultCacheLifeSpan, 20000);
  });
});
