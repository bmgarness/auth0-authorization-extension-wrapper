# Auth0 Authorization Extension Wrapper

Covers some of the features of Authorization Extension for Auth0.

- Roles
- Permissions
- Users
- Groups

## Usage

Follow this guide to expose Auth0Endpoints and create necessary credentials here ->
[Auth0](https://auth0.com/docs/extensions/authorization-extension/v2/api-access)

First, create the wrapper

```javascript
var wrapper = new Auth0Wrapper();
```

Then, pass an object with
- auth0ExtensionUrl
- auth0ClientId
- auth0ClientSecret
- auth0Url

You can find all these attributes in the API section of Auth0 Dashboard

to
```javascript
wrapper.authenticate({...(above attributes)...})
```

Now can make all necessary calls.

# Options

Caching is turned on by default, to turn off
```javascript
var wrapper = new Auth0Wrapper(0)
```

The default length for a Cache to be valid is 10 sec, to change (to say 5 sec)
```javascript
var wrapper = new Auth0Wrapper(5000)
```
the number is in miliseconds
Can also edit by
```javascript
wrapper.defaultCacheLifeSpan = 5000;
```
