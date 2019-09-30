import { assert } from 'chai';
import {Auth0Wrapper, Permission, ShortPermission} from '../src';
const settings = require(__dirname + '/../config.json');

const nock = require('nock');



function assertShortPermissionWithId(perm: ShortPermission) {
	assert.isString(perm._id);
	assert.isObject(perm);
	assert.isString(perm.name, 'name');
	assert.isString(perm.description, 'description');
	assert.isUndefined((perm as Permission).applicationType, 'applicationType');
	assert.isUndefined((perm as Permission).applicationId, 'applicationId');
}

function assertPermission(perm: Permission) {
	assert.isObject(perm);
	assert.isString(perm.name, 'name');
	assert.isString(perm.description, 'description');
	assert.isString(perm.applicationType, 'applicationType');
	assert.isString(perm.applicationId, 'applicationId');
};

function assertPermissionWithId(perm: Permission) {
	assertPermission(perm);
	assert.isString(perm._id);
}


describe('Permission', () => {
	let created: Permission = {
		_id: '8d58891a-bd3e-4364-8c18-0f119d72ee5d',
		name: 'RandomPermission',
		description: 'E',
		applicationType: 'client',
		applicationId: settings.auth0ClientId
	};
	let shortPermission: ShortPermission = {
		_id: '8d58891a-bd3e-4364-8c18-0f119d72ee5d',
		name: 'RandomPermission',
		description: 'description'
	};
	let updated: Permission = {
		_id: '8d58891a-bd3e-4364-8c18-0f119d72ee5d',
		name: 'NEW NAME',
		description: 'NEW DESCRIPTION',
		applicationType: 'client',
		applicationId: settings.auth0ClientId
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

	it('should create a Permission', async () => {
		let p1 = {
			name: 'RandomPermission',
			description: 'E',
			applicationType: 'client',
			applicationId: settings.auth0ClientId,
		};
		const scope = nock(settings.auth0AuthExtensionUrl)
			.post('/permissions')
			.reply(200, created);
		const res = await wrapper.createPermission(p1);
		assertPermissionWithId(res);
	});

	it('should update the permission', async () => {
		const scope = nock(settings.auth0AuthExtensionUrl)
			.put('/permissions/' + created._id)
			.reply(200, updated);
		const res = await wrapper.updatePermission(created);
		assertPermissionWithId(res);
		assert.equal(res.description, 'NEW DESCRIPTION');
		assert.equal(res.name, 'NEW NAME');
	});

	it('should access the created permission', async () => {
		const scope = nock(settings.auth0AuthExtensionUrl)
			.get('/permissions/' + created._id)
			.reply(200, shortPermission);
		const existing = await wrapper.getPermission(created._id);
		assertShortPermissionWithId(existing);
	});

	it('should list the permissions', async () => {
		const scope = nock(settings.auth0AuthExtensionUrl)
			.get('/permissions')
			.reply(200, {permissions: [created]});
		let existingList = await wrapper.getPermissions();
		assert.isArray(existingList);
		assert.ok(existingList.length >= 1);
		let found = false;
		for (let perm of existingList) {
			assertPermissionWithId(perm);
			if (perm._id === created._id) found = true;
		}
		assert.ok(found);
	});

	it('should delete the created permission', async () => {
		const scope = nock(settings.auth0AuthExtensionUrl)
			.delete('/permissions/' + created._id)
			.reply(204);
		await wrapper.deletePermission(created._id);
	});

});
