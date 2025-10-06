document.addEventListener("DOMContentLoaded", () => {
	const form = document.getElementById("username-form");
	if (!form) {
		console.error("Form not found in DOM!");
		return;
	}

	form.addEventListener("submit", function (e) {
		const input = document.getElementById("choose-username-input");

		if (!input.value.trim()) {
			e.preventDefault();
			input.placeholder = "⚠️ Please enter a username";
			input.classList.add("error-placeholder");
		}
	});
});
