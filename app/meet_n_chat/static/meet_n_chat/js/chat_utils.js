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
	historyName
) {
	if (userHistory.length >= maxHistorySize) {
		localStorage.setItem(
			historyName,
			JSON.stringify(userHistory.slice(-maxHistorySize))
		);
	}

	document.querySelector("#history").innerHTML =
		`<div style="color: ${chat_color}; padding-top: 15px">${username}</div>` +
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

	document.querySelector("#chat-messages").innerHTML = "";
	if (amUser) {
		secondUser.username = second_user;
		secondUser.chatColor = second_user_color;
		secondUser.channelName = second_channel_name;

		appendToHistory(userHistory, second_user, second_user_color);

		userHistory.push({
			username: second_user,
			chat_color: second_user_color,
		});
		localStorage.setItem(historyName, JSON.stringify(userHistory));
		document.querySelector(
			"#status"
		).innerHTML = `You were paired with <span style="color: ${second_user_color}">${second_user}</span>, say hi!`;
	} else {
		secondUser.username = message_user;
		secondUser.chatColor = chat_color;
		secondUser.channelName = channel_name;

		document.querySelector(
			"#chat-messages"
		).innerHTML += `<div class="system-message"><span style="color: ${chat_color}">${message_user}</span> joined the chat</div>`;
		userHistory.push({ username: message_user, chat_color: chat_color });
		localStorage.setItem(historyName, JSON.stringify(userHistory));

		appendToHistory(userHistory, message_user, chat_color);

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
