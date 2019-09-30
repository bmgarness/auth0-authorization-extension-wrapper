import { assert } from 'chai';
import {Auth0Wrapper, Group, Role, ShortRole} from '../src';
import nock = require("nock");
const settings = require(__dirname + '/../config.json');


describe('User', () => {
	const roleName = 'Test-role-for-users';
	const groupName = 'Test-group-for-users';
	let role: Role = {
		_id: '1234',
		name: 'Test-role-for-users',
		description: 'E',
		applicationType: 'client',
		applicationId: settings.auth0ClientId,
		permissions: [],
	};
	let shortRole: ShortRole = {
	  _id: '1234',
    name: 'Short-role-for-users',
    description: 'E'
  };
	let group: Group = {
		name: "Test-group-for-users",
		description: "E",
		_id: "9968bc30-c63d-4b5c-a974-d1c36ad96558"
	};
	let userId = '1234';
	let userRoleLength = 1;
	let userGroupLength = 0;
	let wrapper: Auth0Wrapper;

	beforeEach('Must be authenticated', async () => {
		wrapper = new Auth0Wrapper();
    const scope = nock(settings.auth0Url)
			.post('/oauth/token')
			.reply(200, {access_token: 'VALID_TOKEN', expires_in: 86400});
		await wrapper.authenticate(settings);
		assert.ok(wrapper.isAuthenticated);
		userId = settings.auth0TestUserId;
	});

	// User roles
	it('creates a role', async () => {
		const scope = nock(settings.auth0AuthExtensionUrl)
			.post('/roles')
			.reply(200, role);
		role = await wrapper.createRole(role);
		assert.isObject(role);
	});

	it('should query the roles of the user', async () => {
	  const scope = nock(settings.auth0AuthExtensionUrl)
      .get(`/users/${settings.auth0TestUserId}/roles`)
      .reply(200, [shortRole]);
		let roles = await wrapper.getUserRoles(userId);
		assert.isArray(roles);
		userRoleLength = roles.length;
	});

	it('can add role', async () => {
	  const scope1 = nock(settings.auth0AuthExtensionUrl)
      .patch(`/users/${settings.auth0TestUserId}/roles`)
      .reply(204);
		await wrapper.addRoleForUser(userId, role._id);
    const scope2 = nock(settings.auth0AuthExtensionUrl)
      .get(`/users/${settings.auth0TestUserId}/roles`)
      .reply(200, [shortRole, role]);
		let roles = await wrapper.getUserRoles(userId);
		assert.equal(roles.length, userRoleLength + 1);
		let found = false;
		for (let r of roles) {
			if (r.name === roleName) {
				found = true;
				break;
			}
		}
		assert.ok(found);
	});

	it('can remove added role', async () => {
    const scope1 = nock(settings.auth0AuthExtensionUrl)
      .delete(`/users/${settings.auth0TestUserId}/roles`)
      .reply(204);
		await wrapper.removeRoleFromUser(userId, role._id);
    const scope2 = nock(settings.auth0AuthExtensionUrl)
      .get(`/users/${settings.auth0TestUserId}/roles`)
      .reply(200, [shortRole]);
		let roles = await wrapper.getUserRoles(userId);
		assert.equal(roles.length, userRoleLength);
	});

	it('destroys the created role', async () => {
    const scope1 = nock(settings.auth0AuthExtensionUrl)
      .delete(`/roles/1234`)
      .reply(204);
		await wrapper.deleteRole(role._id);
	});

	// User groups
	it('creates a group', async () => {
    const scope1 = nock(settings.auth0AuthExtensionUrl)
      .post('/groups')
      .reply(204);
		const tempGroup = await wrapper.createGroup({
			name: groupName,
			description: groupName,
		});
	});

	it('should query the groups of the user', async () => {
	  const scope = nock(settings.auth0AuthExtensionUrl)
      .get(`/users/${settings.auth0TestUserId}/groups`)
      .reply(200, []);
		let groups = await wrapper.getUserGroups(userId);
		assert.isArray(groups);
		userGroupLength = groups.length;
	});

	it('can add group', async () => {
    const scope1 = nock(settings.auth0AuthExtensionUrl)
      .patch(`/users/${settings.auth0TestUserId}/groups`)
      .reply(204);
		await wrapper.addGroupForUser(userId, group._id);
    const scope2 = nock(settings.auth0AuthExtensionUrl)
      .get(`/users/${settings.auth0TestUserId}/groups`)
      .reply(200, [group]);
		let groups = await wrapper.getUserGroups(userId);
		assert.equal(groups.length, userGroupLength + 1);
		let found = false;
		for (let r of groups) {
			if (r.name === groupName) {
				found = true;
				break;
			}
		}
		assert.ok(found);
	});

	it('can remove added group', async () => {
    const scope1 = nock(settings.auth0AuthExtensionUrl)
      .delete(`/groups/${group._id}/members`)
      .reply(204);
	  await wrapper.removeGroupFromUser(userId, group._id);
    const scope2 = nock(settings.auth0AuthExtensionUrl)
      .get(`/users/${settings.auth0TestUserId}/groups`)
      .reply(200, []);
		let groups = await wrapper.getUserGroups(userId);
		assert.equal(groups.length, userGroupLength);
	});

	it('destroys the created group', async () => {
	  const scope = nock(settings.auth0AuthExtensionUrl)
      .delete(`/groups/${group._id}`)
      .reply(204);
		await wrapper.deleteGroup(group._id);
	});
});
