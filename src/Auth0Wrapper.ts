import * as request from 'request-promise';
// require('request-promise').debug = true;


import {
	Permission,
	ShortPermission,
	PermissionsResponse,
	Role,
	ShortRole,
	RoleResponse,
	Group,
	GroupResponse,
} from './Auth0Types';
import {Response} from "request";


export interface Auth0WrapperSettings {
	auth0ClientId: string;
	auth0ClientSecret: string;
	auth0Url: string;
	auth0AuthExtensionUrl: string;
}

export class Auth0Wrapper {
	private token: {val: string, exp: Number};
	private apiUrl: string;
	private cache: {
		[url: string]: {
			exp: Date,
			response: any
		}
	} = {};
	private defaultCacheLifeSpan: number;
	private cacheOn: boolean;

	constructor(defaultCacheLifeSpan = 10000, cacheOn = true) {
		this.defaultCacheLifeSpan = defaultCacheLifeSpan;
	}

	get isAuthenticated() {
		return !!this.token.val && this.token.exp > Date.now();
	}
	getToken() { return this.token; }

	private createOptions(body?: any): {
		body?: any;
		headers: { [name: string]: string; };
		json: boolean;
		qs: any;
	} {
		return {
			headers: { 'Authorization': 'Bearer ' + this.token.val },
			json: true,
			body,
			qs: {},
		};
	}

	async authenticate(settings: Auth0WrapperSettings): Promise<void> {
		this.apiUrl = settings.auth0AuthExtensionUrl;
		const credentials = {
			client_id: settings.auth0ClientId,
			client_secret: settings.auth0ClientSecret,
			audience: 'urn:auth0-authz-api',
			grant_type: 'client_credentials'
		};
		let result = await request.post({
			uri: settings.auth0Url + '/oauth/token',
			form: credentials,
			json: true,
		});
		let exp = 0;
		exp = Date.now() + (result.expires_in * 1000);
		this.token = {val: result.access_token, exp};
	}

	// PRIVATE HELPERS

	private async get<T>(url: string, body?: any): Promise<T> {
		let response;
		if (this.cacheOn) {
			const cached = this.getFromCache(url, Date.now());
			if (cached) {
				return Promise.resolve(cached);
			}
			response = await request.get(this.apiUrl + url, this.createOptions(body));
			this.addToCache(url, response);
		} else {
			response = await request.get(this.apiUrl + url, this.createOptions(body));
		}
		return response;
	}

	private async post<T>(url: string, body: any): Promise<T> {
		if (this.cacheOn) {
			this.invalidateCache(url);
		}
		let response = await request.post(this.apiUrl + url, this.createOptions(body));
		return response;
	}

	private async put<T>(url: string, body: any): Promise<T> {
		if (this.cacheOn) {
			this.invalidateCache(url);
		}
		let response = await request.put(this.apiUrl + url, this.createOptions(body));
		return response;
	}

	private async patch<T>(url: string, body: any): Promise<T> {
		if (this.cacheOn) {
			this.invalidateCache(url);
		}
		let response = await request.patch(this.apiUrl + url, this.createOptions(body));
		return response;
	}

	private async delete<T>(url: string, body?: any): Promise<T> {
		if (this.cacheOn) {
			this.invalidateCache(url);
		}
		let response = await request.delete(this.apiUrl + url, this.createOptions(body));
		return response;
	}

	// PERMISSIONS

	async getPermissions() {
		return (await this.get<PermissionsResponse>('/permissions')).permissions;
	}

	async getPermission(id: string) {
		return (await this.get<ShortPermission>('/permissions/' + id));
	}

	async createPermission(permission: Permission): Promise<Permission> {
		return this.post<Permission>('/permissions', {
			name: permission.name,
			description: permission.description,
			applicationType: permission.applicationType,
			applicationId: permission.applicationId,
		});
	}

	async updatePermission(permission: Permission): Promise<Permission> {
		return this.put<Permission>('/permissions/' + permission._id, {
			name: permission.name,
			description: permission.description,
			applicationType: permission.applicationType,
			applicationId: permission.applicationId,
		});
	}

	async deletePermission(permission: Permission): Promise<void>;
	async deletePermission(permissionId: string): Promise<void>;
	async deletePermission(permission: Permission | string) {
		if (typeof permission !== 'string') permission = permission._id;
		return this.delete<void>('/permissions/' + permission);
	}

	// ROLES

	async getRoles(): Promise<Role[]> {
		return (await this.get<RoleResponse>('/roles')).roles;
	}

	async getRole(id: string): Promise<ShortRole> {
		return (await this.get<Role>('/roles/' + id));
	}

	async createRole(role: Role): Promise<Role> {
		return (await this.post<Role>('/roles', {
			name: role.name,
			description: role.description,
			applicationType: role.applicationType,
			applicationId: role.applicationId,
			permissions: role.permissions,
		}));
	}

	async updateRole(role: Role): Promise<Role> {
		return (await this.put<Role>('/roles/' + role._id, {
			name: role.name,
			description: role.description,
			applicationType: role.applicationType,
			applicationId: role.applicationId,
			permissions: role.permissions,
		}));
	}

	async deleteRole(id: string) {
		return this.delete<void>('/roles/' + id);
	}

	// USERS

	async getUserRoles(id: string) {
		return this.get<ShortRole[]>(`/users/${id}/roles`);
	}

	async addRoleForUser(id: string, roles: string | string[]) {
		if (typeof roles === 'string') roles = [roles];
		return this.patch(`/users/${id}/roles`, roles);
	}

	async removeRoleFromUser(id: string, roles: string | string[]) {
		if (typeof roles === 'string') roles = [roles];
		return this.delete(`/users/${id}/roles`, roles);
	}

	async getUserGroups(id: string) {
		return this.get<Group[]>(`/users/${id}/groups`);
	}

	async addGroupForUser(id: string, groups: string | string[]) {
		if (typeof groups === 'string') groups = [groups];
		return this.patch(`/users/${id}/groups`, groups);
	}

	async removeGroupFromUser(id: string, group: string) {
		return this.delete(`/groups/${group}/members`, [id]);
	}

	// GROUPS

	async getGroups(): Promise<Group[]> {
		return (await this.get<GroupResponse>('/groups')).groups;
	}

	async getGroup(id: string): Promise<Group> {
		return (await this.get<Group>('/groups/' + id));
	}

	async getExpandedGroup(id: string): Promise<Group> {
		return (await this.get<Group>('/groups/' + id, {qs: 'expand'}))
	}

	async createGroup(group: Group): Promise<Group> {
		return (await this.post<Group>('/groups', {
			name: group.name,
			description: group.description,
		}));
	}

	async updateGroup(group: Group): Promise<Group> {
		return (await this.put<Group>('/groups/' + group._id, {
			name: group.name,
			description: group.description,
		}));
	}

	async deleteGroup(id: string) {
		return this.delete<void>('/groups/' + id);
	}

	private addToCache(url: string, response: any) {
		this.cache[url] = {
			exp: new Date(Date.now() + this.defaultCacheLifeSpan),
			response
		};

	}

	private getFromCache(url: string, date: number) {
		const cached = this.cache[url];
		if (cached && cached.exp.getTime() > date) {
			return cached.response;
		}
		return null;
	}

	private invalidateCache(url: string) {
		let pattern = url.split('/');
		pattern = pattern.slice(1, pattern.length);
		let builtString = '';
		pattern.forEach((p) => {
			builtString += '/' + p;
			this.cache[builtString] = undefined;
		});
	}
}
