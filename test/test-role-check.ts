import { assert } from 'chai';
import {Auth0Wrapper, Permission, Role, ShortRole} from '../src';
import nock = require("nock");
const settings = require(__dirname + '/../config.json');


function assertShortRoleWithId(role: ShortRole) {
	assert.isObject(role);
	assert.isString(role._id, '_id');
	assert.isString(role.name, 'name');
	assert.isString(role.description, 'description');
	assert.isUndefined((role as Role).applicationType, 'applicationType');
	assert.isUndefined((role as Role).applicationId, 'applicationId');
	assert.isUndefined((role as Role).permissions, 'permissions');
}

function assertRole(role: Role) {
	assert.isString(role.applicationType, 'applicationType');
	assert.isString(role.applicationId, 'applicationId');
	assert.isArray(role.permissions, 'permissions');
};

function assertRoleWithId(role: Role) {
	assertRole(role);
	assert.isString(role._id, '_id');
}


describe('Role', () => {
	let created: Role = {
		_id: '1234',
		name: 'RandomRole',
		description: 'E',
		applicationType: 'client',
		applicationId: settings.auth0ClientId,
		permissions: [],
	};
	let updated: Role = {
		_id: '1234',
		name: 'NEW NAME',
		description: 'NEW DESCRIPTION',
		applicationType: 'client',
		applicationId: settings.auth0ClientId,
		permissions: [],
	};
	let shortRole: ShortRole = {
		_id: '1234',
		name: 'NEW NAME',
		description: 'NEW DESCRIPTION',
	};
	let wrapper: Auth0Wrapper;

	before('Must be authenticated', async () => {
		wrapper = new Auth0Wrapper();
		const scope = nock(settings.auth0Url)
			.post('/oauth/token')
			.reply(200, {access_token: 'VALID_TOKEN', expires_in: 86400});
		await wrapper.authenticate(settings);
		assert.ok(wrapper.isAuthenticated);
	});

	it('should create a Role', async () => {
		let r1 = {
			name: 'RandomRole',
			description: 'E',
			applicationType: 'client',
			applicationId: settings.auth0ClientId,
			permissions: [],
		};
		const scope = nock(settings.auth0AuthExtensionUrl)
			.post('/roles')
			.reply(200, created);
		const res = await wrapper.createRole(r1);
		assertRoleWithId(res);
	});

	it('should update the Role', async () => {
		const scope = nock(settings.auth0AuthExtensionUrl)
			.put('/roles/' + created._id)
			.reply(200, updated);
		const res = await wrapper.updateRole(created);
		assertRoleWithId(res);
		assert.equal(res.description, 'NEW DESCRIPTION');
		assert.equal(res.name, 'NEW NAME');
	});

	it('should access the created Role', async () => {
		const scope = nock(settings.auth0AuthExtensionUrl)
			.get('/roles/' + created._id)
			.reply(200, shortRole);
		let existing = await wrapper.getRole(created._id);
		assertShortRoleWithId(existing);
	});

	it('should list the Roles', async () => {
		const scope = nock(settings.auth0AuthExtensionUrl)
			.get('/roles')
			.reply(200, {roles: [created]});
		let existingList = await wrapper.getRoles();
		assert.isArray(existingList);
		assert.ok(existingList.length >= 1);
		let found = false;
		for (let role of existingList) {
			assertRole(role);
			if (role._id === created._id) found = true;
		}
		assert.ok(found);
	});

	it('should delete the created Role', async () => {
		const scope = nock(settings.auth0AuthExtensionUrl)
			.delete('/roles/' + created._id)
			.reply(204);
		await wrapper.deleteRole(created._id);
	});

});
