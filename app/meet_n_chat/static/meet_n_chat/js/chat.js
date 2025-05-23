import {
	toggleImageConsent,
	toggleAudio,
	appendToHistory,
	setupChatInputHandlers,
	queueController,
	handleImageMessage,
	handleMessage,
	handleStartMessage,
	handleStopMessage,
	handleJoinMessage,
	handleConsentMessage,
	setupImageModal,
} from "./chat_utils.js";

const matchSound = document.getElementById("match-sound");
matchSound.volume = 0.3;
let chatStarted = false;

const user = {
	id: JSON.parse(document.getElementById("user-id").textContent),
	chatColor: "#FF6B6B",
};
const secondUser = {
	username: "",
	chatColor: "",
	channelName: "",
};

let userHistory = [];
let imageConsent = false;
const historyName = "chat_history";

const ws_scheme = window.location.protocol === "https:" ? "wss://" : "ws://";
const chatSocket = new WebSocket(
	ws_scheme + window.location.host + "/ws/chat/"
);

document.addEventListener("DOMContentLoaded", () => {
	const savedTheme = localStorage.getItem("theme") || "dark";
	document.documentElement.setAttribute("data-theme", savedTheme);
	userHistory = localStorage.getItem(historyName)
		? JSON.parse(localStorage.getItem(historyName))
		: [];

	for (let user of userHistory) {
		appendToHistory(
			userHistory,
			user.username,
			user.chat_color,
			historyName
		);
	}

	const consentBtn = document.querySelector("#consent-btn");
	consentBtn?.addEventListener("click", () => {
		toggleImageConsent(secondUser, chatSocket, user);
	});

	document.getElementById("control-btn")?.addEventListener("click", () => {
		queueController(chatSocket, chatStarted);
	});

	document.getElementById("audio-toggle")?.addEventListener("click", () => {
		toggleAudio(matchSound);
	});

	setupImageModal();
});

chatSocket.onmessage = function (e) {
	const data = JSON.parse(e.data);
	const event = data.event;

	switch (event) {
		case "message":
			handleMessage(data);
			break;
		case "info":
			user.chatColor = data.chat_color;
			break;
		case "start":
			handleStartMessage(data, chatStarted, user);
			chatStarted = true;
			break;
		case "stop":
			handleStopMessage(data, matchSound, user, secondUser);
			chatStarted = false;
			imageConsent = false;
			break;
		case "join":
			chatStarted = true;
			matchSound.play();
			handleJoinMessage(data, secondUser, userHistory, user, historyName);
			break;
		case "image":
			handleImageMessage(data);
			break;
		case "consent":
			imageConsent = handleConsentMessage(data, user, secondUser);
			break;
	}
	// Auto scroll to bottom
	const chatLog = document.querySelector("#chat-messages");
	if (event !== "image") {
		chatLog.scrollTop = chatLog.scrollHeight;
	}
};

chatSocket.onclose = function (e) {
	console.error("Chat socket closed unexpectedly");
};

setupChatInputHandlers(chatSocket);

document.getElementById("myFile").addEventListener("change", function (e) {
	if (this.files && this.files[0] && imageConsent) {
		const formData = new FormData();
		formData.append("filename", this.files[0]);
		formData.append(
			"csrfmiddlewaretoken",
			document.querySelector("[name=csrfmiddlewaretoken]").value
		);

		fetch("/chat/upload-image", {
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
