let rot13 = require("rot-thirteen");
let adapter = require("..");

module.exports = adapter.string((contents, { compact, skip }) => {
	if(skip) return contents;
	let res = rot13(contents);
	if(!compact) return res;
	// in production, we run rot13 *twice*
	return rot13(res);
});
