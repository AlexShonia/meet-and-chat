const user = {
	id: JSON.parse(document.getElementById("user-id").textContent),
	loggedIn: JSON.parse(document.getElementById("logged-in").textContent),
};

document.addEventListener("DOMContentLoaded", () => {
	document.querySelector("#logout-btn")?.addEventListener("click", () => {
		logout();
	});
});

function logout() {
	fetch("/user/logout/", {
		method: "POST",
		headers: {
			"X-CSRFToken": document.querySelector("[name=csrfmiddlewaretoken]")
				.value,
		},
	})
		.then((response) => response.json())
		.then((data) => {
			if (data.redirect_url) {
				window.location.href = `${window.location.origin}${data.redirect_url}`;
			}
		});
}

const overlay = document.getElementById("profileModalOverlay");

async function openModal() {
	if (!user.loggedIn) {
		return;
	}
	overlay.style.display = "flex";
	const main = document.querySelector("main");
	main.setAttribute("inert", "");

	let response = await fetch(`/user/${user.id}/`, {
		method: "GET",
		headers: {
			"X-CSRFToken": document.querySelector("[name=csrfmiddlewaretoken]")
				.value,
		},
	});

	if (!response.ok) {
		throw new Error(`Error ${response.status}: ${response.statusText}`);
	}
	let userData = await response.json();

	document.querySelector("#email").textContent = userData.email;
	document.querySelector("#username").value = userData.username;

}

function closeModal() {
	overlay.style.display = "none";
	window.location.href = "/choose/";
}

document.querySelector("#profile-btn")?.addEventListener("click", () => {
	openModal();
});

document.querySelector("#closeProfileModal")?.addEventListener("click", () => {
	closeModal();
});

overlay.addEventListener("click", function (e) {
	if (e.target === overlay) {
		closeModal();
	}
});

document.getElementById("updateUser").addEventListener("submit", async (e) => {
	e.preventDefault();

	const username = document.getElementById("username").value;

	const response = await fetch(`/user/${user.id}/`, {
		method: "PUT",
		headers: {
			"Content-Type": "application/json",
			"X-CSRFToken": document.querySelector("[name=csrfmiddlewaretoken]")
				.value,
		},
		body: JSON.stringify({ username }),
	});

	if (response.ok) {
		closeModal();
	} else {
		console.error("Failed to update profile.");
	}
});
