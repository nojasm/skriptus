exports.importSkript = function() {
	smallWindow.empty();
	smallWindow.setTitle("Import");
	smallWindow.show();

	let optionFountain = document.createElement("div");
	let optionFountainIcon = document.createElement("img");
	let optionFountainTitle = document.createElement("p");

	optionFountain.classList.add("import-export__option");
	optionFountainIcon.classList.add("import-export__option__icon");
	optionFountainTitle.classList.add("import-export__option__title");

	optionFountainIcon.src = "../res/fountain-sign-32.png";
	optionFountainTitle.innerHTML = "Fountain";

	optionFountain.addEventListener("click", function(event) {

	});

	optionFountain.appendChild(optionFountainIcon);
	optionFountain.appendChild(optionFountainTitle);
	smallWindow.body.appendChild(optionFountain);
}

exports.exportSkript = function() {
	smallWindow.empty();
	smallWindow.setTitle("Export");
	smallWindow.show();



	let optionFountain = document.createElement("div");
	let optionFountainIcon = document.createElement("img");
	let optionFountainTitle = document.createElement("p");

	optionFountain.classList.add("import-export__option");
	optionFountainIcon.classList.add("import-export__option__icon");
	optionFountainTitle.classList.add("import-export__option__title");

	optionFountainIcon.src = "../res/fountain-sign-32.png";
	optionFountainTitle.innerHTML = "Fountain";

	optionFountain.addEventListener("click", function(event) {

	});

	optionFountain.appendChild(optionFountainIcon);
	optionFountain.appendChild(optionFountainTitle);
	smallWindow.body.appendChild(optionFountain);



	let optionPDF = document.createElement("div");
	let optionPDFIcon = document.createElement("img");
	let optionPDFTitle = document.createElement("p");

	optionPDF.classList.add("import-export__option");
	optionPDFIcon.classList.add("import-export__option__icon");
	optionPDFTitle.classList.add("import-export__option__title");

	optionPDFIcon.src = "../res/1200px-PDF_file_icon.svg.webp";
	optionPDFTitle.innerHTML = "PDF";

	optionPDF.addEventListener("click", function(event) {
		let doc = new jsPDF({
			format: "A4"
		});

		// Loading font
		doc.addFileToVFS("lora.ttf", window.getFontFileInBase64("src/css/Lora.ttf"))
		doc.setFont("lora.ttf");

		// TODO: ADD TITLE, AUTHOR, DATE, ETC. TO PDF HERE

		doc.html(skriptEl, {
			callback: (doc) => {
				doc.save(window.saveFileDialog(
					rootPath = "",
					name = "PDF",
					ext  = ["pdf"]
				));
			},
			autoPaging: "text", // Maybe try "slice" here?,
			html2canvas: require("html2canvas"),
			width: 200,
			windowWidth: 600
		});
	});

	optionPDF.appendChild(optionPDFIcon);
	optionPDF.appendChild(optionPDFTitle);
	smallWindow.body.appendChild(optionPDF);
}
