exports.contextMenuClose = function () {
	contextMenuIsOpen = false;
	contextMenu.style.display = "none";
}

exports.contextMenuOpen = function (posX, posY, options) {
	// options = [{label: ..., callback: ...}]

	contextMenu.style.display = "initial";
	contextMenu.style.left = posX + window.scrollX + "px";
	contextMenu.style.top = posY + window.scrollY + "px";
	contextMenuIsOpen = true;

	contextMenu.innerHTML = "";

	options.forEach((item, i) => {
		let cmItem = document.createElement("p");

		if (item.type == "category") {
			let categoryWrapperElement = document.createElement("div");
			cmItem.innerHTML = item.label;
			cmItem.classList.add("context-menu__category");
			categoryWrapperElement.classList.add("context-menu__category-wrapper");
			item.children.forEach((childItem, childItemIndex) => {
				let childItemElement = document.createElement("p");

				if (childItem.color != undefined)
					childItemElement.style.color = childItem.color;

				childItemElement.classList.add("context-menu__child-item");
				childItemElement.innerHTML = childItem.label;
				childItemElement.addEventListener("click", () => {
					contextMenuClose();
					childItem.callback();
				});

				categoryWrapperElement.appendChild(childItemElement);
			});

			contextMenu.appendChild(cmItem);
			contextMenu.appendChild(categoryWrapperElement);

		} else if (item.type == undefined || item.type == "button") {
			cmItem.classList.add("context-menu__item");

			if (item.color != undefined)
				cmItem.style.color = item.color;

			cmItem.addEventListener("click", () => {
				contextMenuClose();
				item.callback();
			});

			cmItem.innerHTML = item.label;
			contextMenu.appendChild(cmItem);

		} else if (item.type == "info") {
			cmItem.classList.add("context-menu__info-item");
			cmItem.innerHTML = item.label;
			contextMenu.appendChild(cmItem);

		} else if (item.type == "seperator") {
			cmItem.classList.add("context-menu__seperator");
			contextMenu.appendChild(cmItem);
		}
	});
}
