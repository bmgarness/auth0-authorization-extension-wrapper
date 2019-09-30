import { assert } from 'chai';
import {Auth0Wrapper, Group} from '../src';
const settings = require(__dirname + '/../config.json');
const nock = require('nock');


function assertGroup(group: Group) {
	assert.isObject(group);
	assert.isString(group.name, 'name');
	assert.isString(group.description, 'description');
}


function assertGroupWithId(group: Group) {
	assertGroup(group);
	assert.isString(group._id, '_id');
}

describe('Group', () => {
	let created: Group = {
		name: "RandomGroup",
		description: "E",
		_id: "9968bc30-c63d-4b5c-a974-d1c36ad96558"
	};
	let updated: Group = {
		name: "NEW NAME",
		description: "NEW DESCRIPTION",
		_id: "9968bc30-c63d-4b5c-a974-d1c36ad96558"
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

	it('should create a Group', async () => {
		let r1 = {
			name: 'RandomGroup',
			description: 'E',
			applicationType: 'client',
			applicationId: settings.auth0ClientId,
			permissions: [],
		};
		const scope = nock(settings.auth0AuthExtensionUrl)
			.post('/groups')
			.reply(200, created);
		const res = await wrapper.createGroup(r1);
		assertGroupWithId(res);
	});

	it('should grab expanded group', async () => {
		const scope = nock(settings.auth0AuthExtensionUrl)
			.get('/groups/' + created._id)
			.reply(200, created);
		const expanded = await wrapper.getExpandedGroup(created._id);
		assertGroup(expanded);
	});

	it('should update the Group', async () => {
		const scope = nock(settings.auth0AuthExtensionUrl)
			.put('/groups/' + created._id)
			.reply(200, updated);
		created.name = "NEW NAME";
		created.description = "NEW DESCRIPTION";
		const res = await wrapper.updateGroup(created);
		assertGroupWithId(res);
		assert.equal(res.description, 'NEW DESCRIPTION');
		assert.equal(res.name, 'NEW NAME');
	});

	it('should access the created Group', async () => {
		const scope = nock(settings.auth0AuthExtensionUrl)
			.get('/groups/' + created._id)
			.reply(200, created);
		let existing = await wrapper.getGroup(created._id);
		assertGroupWithId(existing);
	});

	it('should list the Groups', async () => {
		const scope = nock(settings.auth0AuthExtensionUrl)
			.get('/groups')
			.reply(200, {groups: [created]});
		let existingList = await wrapper.getGroups();
		assert.isArray(existingList);
		assert.ok(existingList.length >= 1);
		let found = false;
		for (let group of existingList) {
			assertGroup(group);
			if (group._id === created._id) found = true;
		}
		assert.ok(found);
	});

	it('should delete the created Group', async () => {
		const scope = nock(settings.auth0AuthExtensionUrl)
			.delete('/groups/' + created._id)
			.reply(204);
		await wrapper.deleteGroup(created._id);
	});

});
