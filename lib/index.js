let fs = require("./promisified-fs");

let convert = {
	buffer: buf => buf,
	string: buf => buf.toString()
};

module.exports = func => buildPlugin("buffer", func);
Object.keys(convert).forEach(type => {
	module.exports[type] = func => buildPlugin(type, func);
});

function buildPlugin(type, func) {
	return (configs, assetManager, options) => {
		let { watcher } = options;
		buildComposite(type, func, configs, assetManager, options).
			then(run(watcher));
	};
}

function buildComposite(type, func, configs, assetManager, options) {
	let transforms = configs.map(config =>
		build(type, func, config, assetManager, options));
	return Promise.all(transforms).
		then(transforms => files => transforms.map(transform => transform(files)));
}

function build(type, func, config, assetManager, options) {
	let source = assetManager.resolvePath(config.source);
	let target = assetManager.resolvePath(config.target, {
		enforceRelative: true
	});

	return files => {
		if(files && !files.includes(source)) return;
		return fs.readFile(source).
			then(apply(func, type, Object.assign({}, options, config))).
			then(writeContent(target, assetManager), writeError(target, assetManager));
	};
}

function apply(func, type, options) {
	return data => func(convert[type](data), options);
}

function writeContent(path, assetManager) {
	return data => assetManager.writeFile(path, data);
}

function writeError(path, assetManager) {
	return error => assetManager.writeFile(path, null, { error });
}

function run(watcher) {
	return func => {
		func();
		if(watcher) {
			watcher.on("edit", func());
		}
	};
}
