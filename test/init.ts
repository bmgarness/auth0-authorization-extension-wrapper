import * as mocha from 'mocha';
import { assert } from 'chai';
import { Auth0Wrapper } from '../src';



let settings = require(__dirname + '/../config.json');


describe('Initialization', () => {

	let wrapper: Auth0Wrapper;

	it('should create the wrapper', () => {
		wrapper = new Auth0Wrapper();
	});

	it('should authenticate', async () => {
		await wrapper.authenticate(settings);
		assert(wrapper.isAuthenticated);
	});
});
