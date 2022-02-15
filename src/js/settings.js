exports.reloadSettingsFromOptions = function(options) {
	options.forEach((option, index) => {
		Object.keys(option.vars).forEach((varKey) => {
			let value = option.vars[varKey];
			if (value instanceof Array)
				value = option.value ? value[0] : value[1];

			document.documentElement.style.setProperty(varKey, value.replaceAll("{value}", option.value))
		});
	});
}

/*
exports.skriptSettingsOpen = function() {
	let win = document.getElementById("small-window");
	win.style.display = "initial";

	document.getElementById("small-window__close").onclick = () => {
		// Apply options
		// exports.reloadSettingsFromOptions(options);

		// Close window
		win.style.display = "none";
	}
}
*/

exports.skriptSettingsOpen = function(newSkript=false) {
	let win = document.getElementById("small-window");
	win.style.display = "initial";

	document.getElementById("small-window__title").innerHTML = newSkript ? "New skript" : "Skript settings";

	let optionsListEl = document.getElementById("small-window__body");

	document.getElementById("small-window__close").onclick = () => {
		// If the value is empty, set it to the default value
		skript.css = skript.css.map((option) => {
			if (option.value === "")
				option.value = option.default;

			return option;
		})

		// Apply options
		exports.reloadSettingsFromOptions(skript.css);

		// Update window title
		document.getElementsByTagName("title")[0].innerHTML = "Skriptus (" + skript.name + ")";

		// Close window
		win.style.display = "none";
	}

	optionsListEl.innerHTML = "";


	// Display options that are not in the [css] object of the skript file

	// Skript name
	optionsListEl.innerHTML += `
	<div class="small-window__input-row">
		<label for="name" class="small-window__label">Skript name</label>
		<input name="name" type="text" oninput="skript.name = this.value" class="small-window__input-text" placeholder="Skript name" value="` + skript.name + `">
	</div>
	`

	// GUID (read-only)
	optionsListEl.innerHTML += `
	<div class="small-window__input-row">
		<label for="guid" class="small-window__label">GUID</label>
		<p name="guid" class="small-window__readonly">` + skript.GUID + `</p>
	</div>
	`

	// Display every option label and input by its type in the [css] object of the skript file
	skript.css.forEach((option, index) => {
		let optionLabelEl = document.createElement("label");
		let optionInputEl = document.createElement("input");
		let optionRowEl   = document.createElement("div");

		optionInputEl.name = index;
		optionLabelEl.htmlFor = index;

		optionLabelEl.innerHTML = option.label;

		optionLabelEl.classList.add("small-window__label");
		optionRowEl.classList.add("small-window__input-row");

		// Change element style and html depending on its type
		if (option.type == "num") {
			optionInputEl.classList.add("small-window__input-number");
			optionInputEl.type = "number";
		} else if (option.type == "color") {
			optionInputEl.classList.add("small-window__input-color");
			optionInputEl.type = "color";
		} else if (option.type == "procent") {
			optionInputEl.classList.add("small-window__input-range");
			optionInputEl.type = "range";
			optionInputEl.min = 0;
			optionInputEl.max = 100;
		} else if (option.type == "bool") {
			optionInputEl.classList.add("small-window__input-checkbox");
			optionInputEl.type = "checkbox";
		}

		// Set the value and placeholder of the input field
		if (option.type == "bool") {
			optionInputEl.checked = option.value;
		} else {
			optionInputEl.value = option.value;
			optionInputEl.placeholder = option.default;
		}


		// Add to the row
		optionRowEl.appendChild(optionLabelEl);
		optionRowEl.appendChild(optionInputEl);


		// If something is changed, change the corresponding value in [options]
		optionInputEl.onchange = (event) => {
			// Special case: inputs with type "range" can't use oninput
			if (event.target.type == "range") {
				skript.css[event.target.name].value = parseInt(event.target.value);
			}
		}

		optionInputEl.oninput = (event) => {
			let val;
			if (event.target.type == "checkbox") {
				val = event.target.checked ? true : false;
			} else if (event.target.type == "number") {
				val = parseFloat(event.target.value);
			} else {
				val = event.target.value;
			}

			options.css[event.target.name].value = val;
		};

		// If the user is changing a procent-input, then also change the info text next to it to match the current value
		if (option.type == "procent") {
			let procentInfoEl = document.createElement("p");
			procentInfoEl.classList.add("small-window__input-info");
			procentInfoEl.innerHTML = option.value + "%";
			optionInputEl.oninput = () => {procentInfoEl.innerHTML = optionInputEl.value + "%"};
			optionRowEl.appendChild(procentInfoEl)
		}

		// Add this row to the options list (small-window__body)
		optionsListEl.appendChild(optionRowEl);
	});
}



exports.globalSettingsOpen = function() {
	let win = document.getElementById("small-window");
	win.style.display = "initial";

	document.getElementById("small-window__title").innerHTML = "Global settings";

	let options = getGlobalOptions();
	let optionsListEl = document.getElementById("small-window__body");

	document.getElementById("small-window__close").onclick = () => {
		// If the value is empty, set it to the default value
		options.css = options.css.map((option) => {
			if (option.value === "")
				option.value = option.default;

			return option;
		})

		// Save options
		setGlobalOptions(options);

		// Apply options
		exports.reloadSettingsFromOptions(options.css);

		// Close window
		win.style.display = "none";
	}

	optionsListEl.innerHTML = "";

	// Display every option label and input by its type
	options.css.forEach((option, index) => {
		let optionLabelEl = document.createElement("label");
		let optionInputEl = document.createElement("input");
		let optionRowEl   = document.createElement("div");

		optionInputEl.name = index;
		optionLabelEl.htmlFor = index;

		optionLabelEl.innerHTML = option.label;

		optionLabelEl.classList.add("small-window__label");
		optionRowEl.classList.add("small-window__input-row");

		// Change element style and html depending on its type
		if (option.type == "num") {
			optionInputEl.classList.add("small-window__input-number");
			optionInputEl.type = "number";
		} else if (option.type == "color") {
			optionInputEl.classList.add("small-window__input-color");
			optionInputEl.type = "color";
		} else if (option.type == "procent") {
			optionInputEl.classList.add("small-window__input-range");
			optionInputEl.type = "range";
			optionInputEl.min = 0;
			optionInputEl.max = 100;
		} else if (option.type == "bool") {
			optionInputEl.classList.add("small-window__input-checkbox");
			optionInputEl.type = "checkbox";
		}

		// Set the value and placeholder of the input field
		if (option.type == "bool") {
			optionInputEl.checked = option.value;
		} else {
			optionInputEl.value = option.value;
			optionInputEl.placeholder = option.default;
		}


		// Add to the row
		optionRowEl.appendChild(optionLabelEl);
		optionRowEl.appendChild(optionInputEl);


		// If something is changed, change the corresponding value in [options]
		optionInputEl.onchange = (event) => {
			// Special case: inputs with type "range" can't use oninput
			if (event.target.type == "range") {
				options.css[event.target.name].value = parseInt(event.target.value);
			}
		}

		optionInputEl.oninput = (event) => {
			let val;
			if (event.target.type == "checkbox") {
				val = event.target.checked ? true : false;
			} else if (event.target.type == "number") {
				val = parseFloat(event.target.value);
			} else {
				val = event.target.value;
			}

			options.css[event.target.name].value = val;
		};

		// If the user is changing a procent-input, then also change the info text next to it to match the current value
		if (option.type == "procent") {
			let procentInfoEl = document.createElement("p");
			procentInfoEl.classList.add("small-window__input-info");
			procentInfoEl.innerHTML = option.value + "%";
			optionInputEl.oninput = () => {procentInfoEl.innerHTML = optionInputEl.value + "%"};
			optionRowEl.appendChild(procentInfoEl)
		}

		// Add this row to the options list (small-window__body)
		optionsListEl.appendChild(optionRowEl);
	});
}
