export const manifest = (() => {
function __memo(fn) {
	let value;
	return () => value ??= (value = fn());
}

return {
	appDir: "_app",
	appPath: "_app",
	assets: new Set([]),
	mimeTypes: {},
	_: {
		client: {start:"_app/immutable/entry/start.DoxJ17q9.js",app:"_app/immutable/entry/app.D5jQs0oS.js",imports:["_app/immutable/entry/start.DoxJ17q9.js","_app/immutable/chunks/BO74FZUH.js","_app/immutable/chunks/BjgrqnN-.js","_app/immutable/chunks/DVY8GL-s.js","_app/immutable/entry/app.D5jQs0oS.js","_app/immutable/chunks/BjgrqnN-.js","_app/immutable/chunks/DVY8GL-s.js","_app/immutable/chunks/CvyOPP9a.js","_app/immutable/chunks/Bhf7Q89C.js","_app/immutable/chunks/DvNzR3UK.js","_app/immutable/chunks/Dwub_KeV.js","_app/immutable/chunks/BYj4H4Cz.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
		nodes: [
			__memo(() => import('./nodes/0.js')),
			__memo(() => import('./nodes/1.js')),
			__memo(() => import('./nodes/2.js'))
		],
		remotes: {
			
		},
		routes: [
			{
				id: "/",
				pattern: /^\/$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 2 },
				endpoint: null
			}
		],
		prerendered_routes: new Set([]),
		matchers: async () => {
			
			return {  };
		},
		server_assets: {}
	}
}
})();
