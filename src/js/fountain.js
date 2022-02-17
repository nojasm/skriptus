/*
JSON-like methods for converting fountain files.
See https://fountain.io/syntax#section-overview for the syntax.
*/

exports.parse = function(text) {

}

exports.stringify = function(content) {
	let lines = [];

	content.forEach((line, index) => {
		switch (line.type) {
			case "scene":
				if (["INT", "EXT", "INT/EXT", "I/E", "EXT/INT", "E/I"].includes(line.split(" ")[0].toUpperCase().replaceAll(".", "")))
					lines.push(line.text.toUpperCase());
				else
					lines.push("INT. " + line.text.toUpperCase());

				lines.push("");
				break;

			case "character":
				lines.push(line.text.toUpperCase());
				break;

			case "dialogue":
				lines.push(line.text);
				break;

			case "parentheses":
				lines.push("(" + line.text + ")");
				break;

			case: "transitions":
				// Not yet implemented
				break;
		}
	});
}
