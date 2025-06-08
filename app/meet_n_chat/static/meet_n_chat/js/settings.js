const user = {
	id: JSON.parse(document.getElementById("user-id").textContent),
	loggedIn: JSON.parse(document.getElementById("logged-in").textContent),
};
const main = document.querySelector("main");

document.addEventListener("DOMContentLoaded", () => {
	document.querySelector("#logout-btn")?.addEventListener("click", () => {
		logout();
	});
	const profileTabBtn = document.querySelector("#profile-tab-btn");
	const accountTabBtn = document.querySelector("#account-tab-btn");
	const friendsTabBtn = document.querySelector("#friends-tab-btn");
	const profileTab = document.querySelector("#updateUser");
	const accountTab = document.querySelector("#account");
	const friendsTab = document.querySelector("#friends");

	profileTabBtn?.addEventListener("click", () => {
		profileTab.style.display = "flex";
		accountTab.style.display = "none";
		friendsTab.style.display = "none";
		deleteAccBtn.textContent = "DELETE ACCOUNT";
	});
	accountTabBtn?.addEventListener("click", () => {
		profileTab.style.display = "none";
		accountTab.style.display = "flex";
		friendsTab.style.display = "none";
		deleteAccBtn.textContent = "DELETE ACCOUNT";
	});
	friendsTabBtn?.addEventListener("click", () => {
		profileTab.style.display = "none";
		accountTab.style.display = "none";
		friendsTab.style.display = "flex";
		deleteAccBtn.textContent = "DELETE ACCOUNT";
	});

	const deleteAccBtn = document.querySelector("#delete-acc-btn");
	deleteAccBtn.addEventListener("click", async () => {
		if (deleteAccBtn.textContent.trim() == "DELETE ACCOUNT") {
			deleteAccBtn.textContent = "Are you Sure?";
		} else if (deleteAccBtn.textContent.trim() == "Are you Sure?") {
			await deleteAccount();
		}
	});

	document.querySelector("#profile-btn")?.addEventListener("click", () => {
		openModal();
	});

	document
		.querySelector("#closeProfileModal")
		?.addEventListener("click", () => {
			closeModal();
		});

	overlay.addEventListener("click", function (e) {
		if (e.target === overlay) {
			closeModal();
		}
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
	main.removeAttribute("inert", "");
}

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

async function deleteAccount() {
	const response = await fetch(`/user/${user.id}/`, {
		method: "DELETE",
		headers: {
			"X-CSRFToken": document.querySelector("[name=csrfmiddlewaretoken]")
				.value,
		},
	});

	if (response.ok) {
		window.location.href = `${window.location.origin}`;
	} else {
		console.error("Failed to delete profile.");
	}
}
