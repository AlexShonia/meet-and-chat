export function toggleImageConsent(secondUser, chatSocket, user) {
	const consentBtn = document.querySelector("#consent-btn");
	if (!secondUser.username) {
		return;
	}

	if (consentBtn.textContent.trim() == "Allow Images") {
		consentBtn.textContent = "Disallow";
		chatSocket.send(
			JSON.stringify({
				message: "allow",
				type: "consent",
				user_id: user.id,
				channel_name: secondUser.channelName,
			})
		);
	} else {
		consentBtn.textContent = "Allow Images";
		chatSocket.send(
			JSON.stringify({
				message: "disallow",
				type: "consent",
				user_id: user.id,
				channel_name: secondUser.channelName,
			})
		);
	}
}

export function toggleAudio(matchSound, remoteAudio = null) {
	const audioToggle = document.getElementById("audio-toggle");
	const isMuted = audioToggle.getAttribute("data-muted") === "true";

	if (isMuted) {
		audioToggle.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="800px" height="800px" viewBox="0 0 16 16" fill="none">
              <path id="path-bg" d="M6 1H8V15H6L2 11H0V5H2L6 1Z" fill="#000000"/>
              <path id="path-bg" d="M14 8C14 5.79086 12.2091 4 10 4V2C13.3137 2 16 4.68629 16 8C16 11.3137 13.3137 14 10 14V12C12.2091 12 14 10.2091 14 8Z" fill="#000000"/>
              <path id="path-bg" d="M12 8C12 9.10457 11.1046 10 10 10V6C11.1046 6 12 6.89543 12 8Z" fill="#000000"/>
            </svg>
          `;
		audioToggle.setAttribute("data-muted", "false");
		matchSound.volume = 0.3;
		if (remoteAudio) {
			remoteAudio.volume = 1;
		}
	} else {
		audioToggle.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="800px" height="800px" viewBox="0 0 16 16" fill="none">
              <path id="path-bg" d="M8 1H6L2 5H0V11H2L6 15H8V1Z" fill="#000000"/>
              <path id="path-bg" d="M9.29289 6.20711L11.0858 8L9.29289 9.79289L10.7071 11.2071L12.5 9.41421L14.2929 11.2071L15.7071 9.79289L13.9142 8L15.7071 6.20711L14.2929 4.79289L12.5 6.58579L10.7071 4.79289L9.29289 6.20711Z" fill="#000000"/>
            </svg>
          `;
		audioToggle.setAttribute("data-muted", "true");
		matchSound.volume = 0;
		if (remoteAudio) {
			remoteAudio.volume = 0;
		}
	}
}

const maxHistorySize = 100;
// This is goofy rewrite, dont pass userHistory
export function appendToHistory(
	userHistory,
	username,
	chat_color,
	user_id,
	logged_in,
	historyName = null
) {
	if (userHistory.length >= maxHistorySize && historyName) {
		localStorage.setItem(
			historyName,
			JSON.stringify(userHistory.slice(-maxHistorySize))
		);
	}

	document.querySelector("#history").innerHTML =
		`<div class="history-user" logged_in="${logged_in}" id="${user_id}" style="color: ${chat_color}; ">${username} </div>` +
		document.querySelector("#history").innerHTML;
}

export function setupChatInputHandlers(chatSocket) {
	document.querySelector("#chat-message-input").focus();
	document.querySelector("#chat-message-input").onkeyup = function (e) {
		if (e.key === "Enter") {
			document.querySelector("#chat-message-submit").click();
		}
	};

	document.querySelector("#chat-message-submit").onclick = function (e) {
		const messageInputDom = document.querySelector("#chat-message-input");
		const message = messageInputDom.value;
		if (message.trim()) {
			chatSocket.send(
				JSON.stringify({
					message: message,
					type: "message",
				})
			);
			messageInputDom.value = "";
		}
	};
}

export function queueController(chatSocket, chatStarted) {
	const controlBtn = document.querySelector("#control-btn");

	if (chatStarted) {
		chatSocket.send(
			JSON.stringify({
				type: "stop",
			})
		);
	} else {
		chatSocket.send(
			JSON.stringify({
				type: "start",
			})
		);
		controlBtn.textContent = "Stop";
	}
}

export function handleImageMessage(data) {
	const chat_color = data.chat_color;
	const username = data.user;
	const message = data.message;
	const imgContainer = document.createElement("div");
	imgContainer.className = "message-container";
	imgContainer.innerHTML = `<span class="user-name" style="color: ${chat_color}">${username}:</span>
              <img src="${window.location.origin}${message}" style="max-width: 300px; max-height: 300px; object-fit: contain;"></img>`;
	document.querySelector("#chat-messages").appendChild(imgContainer);
	const img = imgContainer.querySelector("img");
	img.onload = function () {
		const chatLog = document.querySelector("#chat-messages");
		chatLog.scrollTop = chatLog.scrollHeight;
	};
}

export function handleMessage(data) {
	const chat_color = data.chat_color;
	const user = data.user;
	const message = data.message;
	document.querySelector(
		"#chat-messages"
	).innerHTML += `<div class="message-container">
                <span class="user-name" style="color: ${chat_color}">${user}:</span>
                <span class="message">${message}</span>
              </div>`;
}

export function handleStartMessage(data, chatStarted, user) {
	const controlBtn = document.querySelector("#control-btn");
	controlBtn.textContent = "Stop";

	document.querySelector("#status").innerHTML = "Searching...";
	user.chatColor = data.chat_color;
}

export function handleStopMessage(data, matchSound, user, secondUser) {
	const consentBtn = document.querySelector("#consent-btn");
	consentBtn.textContent = "Allow Images";
	const imageUploadInput = document.querySelector("#myFile");
	imageUploadInput.disabled = true;
	const controlBtn = document.querySelector("#control-btn");
	const username = data.user;
	const chat_color = data.chat_color;
	controlBtn.textContent = "Start";
	const amUser = data.user_id == user.id;

	if (!amUser) {
		matchSound.play();
		document.querySelector(
			"#chat-messages"
		).innerHTML += `<div class="system-message"><span style="color: ${chat_color}">${username}</span> left the chat</div>`;
		document.querySelector(
			"#status"
		).innerHTML = `${username} left the chat`;
	}
	secondUser.username = "";
	secondUser.chatColor = "";
	secondUser.channelName = "";

	document.querySelector("#status").innerHTML = "";
}

export function handleJoinMessage(
	data,
	secondUser,
	userHistory,
	user,
	historyName
) {
	const second_user = data.second_user;
	const second_user_color = data.second_user_color;
	const second_channel_name = data.second_channel_name;
	const chat_color = data.chat_color;
	const message_user = data.user;
	const channel_name = data.channel_name;
	const amUser = data.user_id == user.id;
	const logged_in = data.logged_in;
	const second_user_logged_in = data.second_user_logged_in;
	const second_user_id = data.second_user_id;

	document.querySelector("#chat-messages").innerHTML = "";
	if (amUser) {
		secondUser.username = second_user;
		secondUser.chatColor = second_user_color;
		secondUser.channelName = second_channel_name;
		secondUser.loggedIn = second_user_logged_in;

		appendToHistory(
			userHistory,
			second_user,
			second_user_color,
			second_user_id,
			second_user_logged_in
		);

		userHistory.push({
			username: second_user,
			chat_color: second_user_color,
			user_id: second_user_id,
			logged_in: second_user_logged_in,
		});
		localStorage.setItem(historyName, JSON.stringify(userHistory));
		document.querySelector(
			"#status"
		).innerHTML = `You were paired with <span style="color: ${second_user_color}">${second_user}</span>, say hi!`;
	} else {
		secondUser.username = message_user;
		secondUser.chatColor = chat_color;
		secondUser.channelName = channel_name;
		secondUser.loggedIn = logged_in;

		document.querySelector(
			"#chat-messages"
		).innerHTML += `<div class="system-message"><span style="color: ${chat_color}">${message_user}</span> joined the chat</div>`;
		userHistory.push({
			username: message_user,
			chat_color: chat_color,
			user_id: data.user_id,
			logged_in: logged_in,
		});
		localStorage.setItem(historyName, JSON.stringify(userHistory));

		appendToHistory(
			userHistory,
			message_user,
			chat_color,
			data.user_id,
			logged_in
		);

		document.querySelector(
			"#status"
		).innerHTML = `You were paired with <span style="color: ${chat_color}">${message_user}</span>, say hi!`;
	}
}

export function handleConsentMessage(data, user, secondUser) {
	const message = data.message;
	const imageUploadInput = document.querySelector("#myFile");
	const allow = message == "allow";
	const amUser = data.user_id == user.id;

	if (amUser) {
		if (allow) {
			document.querySelector(
				"#chat-messages"
			).innerHTML += `<div class="system-message"><span style="color: ${secondUser.chatColor}">${secondUser.username}</span> Can now send images</div>`;
			return true;
		} else {
			document.querySelector(
				"#chat-messages"
			).innerHTML += `<div class="system-message"><span style="color: ${secondUser.chatColor}">${secondUser.username}</span> Can no longer send images</div>`;
			return false;
		}
	} else {
		if (allow) {
			imageUploadInput.disabled = false;
			document.querySelector(
				"#chat-messages"
			).innerHTML += `<div class="system-message">You can now send images</div>`;
			return true;
		} else {
			document.querySelector(
				"#chat-messages"
			).innerHTML += `<div class="system-message">You can no longer send images</div>`;
			imageUploadInput.disabled = true;
			return false;
		}
	}
}

export function setupImageModal() {
	const modal = document.getElementById("image-modal");
	const modalImg = document.getElementById("image-modal-content");
	const closeBtn = document.getElementById("image-modal-close");

	document
		.querySelector("#chat-messages")
		.addEventListener("click", function (e) {
			if (e.target.tagName === "IMG") {
				modal.style.display = "flex";
				modalImg.src = e.target.src;
			}
		});

	closeBtn.onclick = () => {
		modal.style.display = "none";
		modalImg.src = "";
	};

	modal.addEventListener("click", (e) => {
		if (e.target === modal) {
			modal.style.display = "none";
			modalImg.src = "";
		}
	});
}

export function handleImagePaste(getImageConsent, chatSocket, user) {
	document
		.getElementById("chat-message-input")
		.addEventListener("paste", function (event) {
			const items = event.clipboardData?.items || [];

			for (const item of items) {
				if (item.kind === "file" && item.type.startsWith("image/")) {
					const file = item.getAsFile();
					const imageConsent = getImageConsent();

					if (file && imageConsent) {
						const ext = file.type.split("/")[1] || "png";
						const customFileName = `${
							user.id
						}_${Date.now()}.${ext}`;
						const renamedFile = new File([file], customFileName, {
							type: file.type,
						});

						const formData = new FormData();
						formData.append("filename", renamedFile);
						formData.append(
							"csrfmiddlewaretoken",
							document.querySelector("[name=csrfmiddlewaretoken]")
								.value
						);

						fetch("/chat/upload-image/", {
							method: "POST",
							body: formData,
							headers: {
								"X-CSRFToken": document.querySelector(
									"[name=csrfmiddlewaretoken]"
								).value,
							},
						})
							.then((response) => response.json())
							.then((data) => {
								if (data.file) {
									chatSocket.send(
										JSON.stringify({
											message: data.file,
											type: "image",
										})
									);
								}
							})
							.catch((error) => {
								console.error("Error:", error);
							});
					}
					break; // Only handle one image per paste
				}
			}
		});
}

export function setupImageUploadListener(getImageConsent, chatSocket, user) {
	document.getElementById("myFile").addEventListener("change", function (e) {
		const imageConsent = getImageConsent();

		if (this.files && this.files[0] && imageConsent) {
			const originalFile = this.files[0];
			const ext = originalFile.name.split(".").pop();
			const customFileName = `${user.id}_${Date.now()}.${ext}`;

			const customFile = new File([originalFile], customFileName, {
				type: originalFile.type,
			});

			const formData = new FormData();
			formData.append("filename", customFile);
			formData.append(
				"csrfmiddlewaretoken",
				document.querySelector("[name=csrfmiddlewaretoken]").value
			);

			fetch("/chat/upload-image/", {
				method: "POST",
				body: formData,
				headers: {
					"X-CSRFToken": document.querySelector(
						"[name=csrfmiddlewaretoken]"
					).value,
				},
			})
				.then((response) => response.json())
				.then((data) => {
					if (data.file) {
						chatSocket.send(
							JSON.stringify({
								message: data.file,
								type: "image",
							})
						);
					}
				})
				.catch((error) => {
					console.error("Error:", error);
				});
		}
	});
}

export function setupPublicProfileModal() {
	const overlay = document.getElementById("publicProfileModalOverlay");
	const main = document.querySelector("main");
	async function openModal() {
		// if (!user.loggedIn) {
		// 	return;
		// }

		overlay.style.display = "flex";
		main.setAttribute("inert", "");
	}

	function closeModal() {
		overlay.style.display = "none";
		main.removeAttribute("inert", "");
	}

	document.querySelector("#history").addEventListener("click", async (e) => {

		if (
			e.target.className != "history-user" ||
			e.target.id == "undefined"
		) {
			return;
		}
		const userName = e.target.textContent;
		const id = e.target.id;
		const loggedIn = e.target.getAttribute("logged_in");
		openModal();

		document.querySelector("#publicUsername").textContent =
			loggedIn == "true" ? userName : userName + " (guest)";

		document.querySelector("#publicUsername").style.color =
			e.target.style.color;

		document.querySelector("#publicID").textContent = "#" + id;
		// let response = await fetch(`/user/${e.target.id}/public-profile/`, {
		// 	method: "GET",
		// 	headers: {
		// 		"X-CSRFToken": document.querySelector(
		// 			"[name=csrfmiddlewaretoken]"
		// 		).value,
		// 	},
		// });

		// if (!response.ok) {
		// 	throw new Error(`Error ${response.status}: ${response.statusText}`);
		// }
		// let userData = await response.json();
	});

	document
		.querySelector("#publicProfileCloseModal")
		?.addEventListener("click", () => {
			closeModal();
		});

	overlay.addEventListener("click", function (e) {
		if (e.target === overlay) {
			closeModal();
		}
	});
}
