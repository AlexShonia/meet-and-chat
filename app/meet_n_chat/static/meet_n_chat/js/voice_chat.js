import {
	appendToHistory,
	setupChatInputHandlers,
	queueController,
	toggleAudio,
	handleMessage,
	handleStartMessage,
	handleStopMessage,
	handleJoinMessage,
	handleImageMessage,
	handleConsentMessage,
	toggleImageConsent,
	setupImageModal,
	setupImageUploadListener,
} from "./chat_utils.js";

let userHistory = [];

let remoteAudio;
let stream;
let localAudioTrack;
let msgUserID;
let chatStarted = false;
let peerConnection;
let imageConsent = false;
const historyName = "voice_history";

const user = {
	id: JSON.parse(document.getElementById("user-id").textContent),
	chatColor: "#FF6B6B",
};
const secondUser = {
	username: "",
	chatColor: "",
	channelName: "",
};

const ws_scheme = window.location.protocol === "https:" ? "wss://" : "ws://";
const chatSocket = new WebSocket(
	ws_scheme + window.location.host + "/ws/voice-chat/"
);

const matchSound = document.getElementById("match-sound");
matchSound.volume = 0.3;

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

	document.getElementById("mic-toggle")?.addEventListener("click", toggleMic);

	document.getElementById("control-btn")?.addEventListener("click", () => {
		queueController(chatSocket, chatStarted);
	});

	document.getElementById("audio-toggle")?.addEventListener("click", () => {
		toggleAudio(matchSound, remoteAudio);
	});

	document.addEventListener("click", async () => {
		if (window.audioContext && window.audioContext.state === "suspended") {
			await window.audioContext.resume();
		}
	});

	setupImageModal();

	handleImagePaste(() => imageConsent, chatSocket);
});

const openMediaDevices = async (constraints) => {
	return await navigator.mediaDevices.getUserMedia(constraints);
};

(async () => {
	try {
		try {
			window.AudioContext =
				window.AudioContext || window.webkitAudioContext;
			window.audioContext = new AudioContext();
		} catch (e) {
			alert("Web Audio API not supported.");
		}

		stream = await openMediaDevices({ video: false, audio: true });
		localAudioTrack = stream.getAudioTracks()[0];

		const soundMeter = (window.soundMeter = new SoundMeter(
			window.audioContext
		));

		soundMeter.connectToSource(stream, function (e) {
			if (e) {
				alert(e);
				return;
			}

			let meterRefresh = setInterval(() => {
				const fillRect = document.getElementById("volume-fill");
				const fillPath = document.getElementById("volume-fill-color");
				const volume = soundMeter.instant;
				const maxHeight = 16;
				const fillHeight = Math.min(maxHeight, volume * 200);
				const fillY = maxHeight - fillHeight;

				fillRect?.setAttribute("y", fillY);
				fillRect?.setAttribute("height", fillHeight);
				fillPath?.setAttribute("fill", user.chatColor);
			}, 50);
		});
	} catch (error) {
		console.error("Error accessing media devices.", error);
		openModal();
	}
})();

async function handleChatMessage(data) {
	const event = data.event;

	// const message = data.message;
	// const user = data.user;
	// const chat_color = data.chat_color;
	// const second_user = data.second_user;
	// const second_user_color = data.second_user_color;
	// const amUser = messageUserID == userID;

	switch (event) {
		case "message":
			handleMessage(data);
			break;
		case "info":
			user.chatColor = data.chat_color;
			break;
		case "start":
			handleStartMessage(data, chatStarted, user);
			break;
		case "stop":
			peerConnection?.close();
			peerConnection = null;
			chatStarted = false;
			handleStopMessage(data, matchSound, user, secondUser);
			imageConsent = false;
			break;
		case "join":
			const messageUserID = data.user_id;
			msgUserID = messageUserID;
			chatStarted = true;
			matchSound.play();
			handleJoinMessage(data, secondUser, userHistory, user, historyName);
			await makeCall();
			break;
		case "image":
			handleImageMessage(data);
			break;
		case "consent":
			imageConsent = handleConsentMessage(data, user, secondUser);
			break;
	}

	const chatLog = document.querySelector("#chat-messages");
	if (event !== "image") {
		chatLog.scrollTop = chatLog.scrollHeight;
	}
}

async function makeCall() {
	const amCaller = user.id != msgUserID;
	const configuration = {
		iceServers: [
			{ urls: "stun:stun.l.google.com:19302" },
			{ urls: "stun:stun1.l.google.com:19302" },
			{ urls: "stun:stun3.l.google.com:3478" },
			{ urls: "stun:stun3.l.google.com:19302" },
		],
	};
	peerConnection = new RTCPeerConnection(configuration);

	let pendingCandidates = [];
	let remoteDescriptionSet = false;

	chatSocket.onmessage = async (e) => {
		const data = JSON.parse(e.data);

		if (data?.answer && amCaller) {
			await peerConnection.setRemoteDescription(data.answer);
			remoteDescriptionSet = true;

			for (const candidate of pendingCandidates) {
				await peerConnection.addIceCandidate(candidate);
			}
			pendingCandidates = [];
		}

		if (data?.offer && !amCaller) {
			await peerConnection.setRemoteDescription(data.offer);
			remoteDescriptionSet = true;

			const answer = await peerConnection.createAnswer();
			chatSocket.send(JSON.stringify({ type: "answer", answer: answer }));
			await peerConnection.setLocalDescription(answer);

			for (const candidate of pendingCandidates) {
				await peerConnection.addIceCandidate(candidate);
			}
			pendingCandidates = [];
		}

		if (data?.iceCandidate) {
			if (remoteDescriptionSet) {
				try {
					await peerConnection.addIceCandidate(data.iceCandidate);
				} catch (e) {
					console.error("Error adding received ICE candidate", e);
				}
			} else {
				pendingCandidates.push(data.iceCandidate);
			}
		}

		await handleChatMessage(data);
	};

	peerConnection.onconnectionstatechange = (event) => {
		if (peerConnection.connectionState === "connected") {
			// Maybe show somehow in UI
		}
	};

	remoteAudio = new Audio();
	remoteAudio.autoplay = true;

	peerConnection.addEventListener("track", (event) => {
		const [remoteStream] = event.streams;
		remoteAudio.srcObject = remoteStream;
	});

	stream.getAudioTracks().forEach((track) => {
		peerConnection.addTrack(track, stream);
	});

	peerConnection.addEventListener("icecandidate", (event) => {
		if (event.candidate) {
			chatSocket.send(
				JSON.stringify({
					type: "ice_candidate",
					"new-ice-candidate": event.candidate,
				})
			);
		}
	});

	if (amCaller) {
		await new Promise((r) => setTimeout(r, 100));
		const offer = await peerConnection.createOffer();

		chatSocket.send(JSON.stringify({ type: "offer", offer: offer }));
		await peerConnection.setLocalDescription(offer);
	}
}

chatSocket.onmessage = async (e) => {
	const data = JSON.parse(e.data);
	await handleChatMessage(data);
};

chatSocket.onclose = function (e) {
	console.error("Chat socket closed unexpectedly");
};

setupChatInputHandlers(chatSocket);

setupImageUploadListener(() => imageConsent, chatSocket);

function toggleMic() {
	const micToggle = document.getElementById("mic-toggle");
	const isMuted = micToggle.getAttribute("data-muted") === "true";
	if (localAudioTrack) {
		localAudioTrack.enabled = isMuted;
	}

	if (isMuted) {
		micToggle.innerHTML = `
          <svg
            xmlns="http://www.w3.org/2000/svg"
            id="mic-svg"
            width="64"
            height="64"
            viewBox="0 0 16 16"
            fill="none"
          >
            <defs>
              <clipPath id="mic-clip">
                <!-- Fill bottom half: from y = 8 to y = 16 -->
                <rect id="volume-fill" x="0" y="8" width="16" height="8" />
              </clipPath>
            </defs>

            <!-- Background mic shape -->
            <path
              id="path-bg"
              d="M5 3C5 1.34315 6.34315 0 8 0C9.65685 0 11 1.34315 11 3V7C11 8.65685 9.65685 10 8 10C6.34315 10 5 8.65685 5 7V3Z"
            />
            <path
              id="path-bg"
              d="M9 13.9291V16H7V13.9291C3.60771 13.4439 1 10.5265 1 7V6H3V7C3 9.76142 5.23858 12 8 12C10.7614 12 13 9.76142 13 7V6H15V7C15 10.5265 12.3923 13.4439 9 13.9291Z"
            />

            <!-- Colored mic overlay, clipped to bottom half -->
            <g id="volume-fill-color" clip-path="url(#mic-clip)">
              <path
                d="M5 3C5 1.34315 6.34315 0 8 0C9.65685 0 11 1.34315 11 3V7C11 8.65685 9.65685 10 8 10C6.34315 10 5 8.65685 5 7V3Z"
              />
              <path
                d="M9 13.9291V16H7V13.9291C3.60771 13.4439 1 10.5265 1 7V6H3V7C3 9.76142 5.23858 12 8 12C10.7614 12 13 9.76142 13 7V6H15V7C15 10.5265 12.3923 13.4439 9 13.9291Z"
              />
            </g>
          </svg>
          `;
		micToggle.setAttribute("data-muted", "false");
	} else {
		micToggle.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="800px" height="800px" viewBox="0 0 16 16" fill="none">
            <path id="path-bg" d="M16 16H13L10.8748 13.3843C10.2884 13.6488 9.65899 13.8349 9 13.9291V16H7V13.9291C3.60771 13.4439 1 10.5265 1 7V6H3V7C3 9.76142 5.23858 12 8 12C8.54134 12 9.06258 11.914 9.55081 11.7548L8.12299 9.99753C8.0822 9.99917 8.0412 10 8 10C6.34315 10 5 8.65685 5 7V6.15385L0 0H3L16 16Z" fill="#000000"/>
            <path id="path-bg" d="M11 6.15385L6.38367 0.472212C6.85016 0.173309 7.40484 0 8 0C9.65685 0 11 1.34315 11 3V6.15385Z" fill="#000000"/>
            <path id="path-bg" d="M12.8076 8.37853L14.2506 10.1546C14.7299 9.20663 15 8.13485 15 7V6H13V7C13 7.47815 12.9329 7.94063 12.8076 8.37853Z" fill="#000000"/>
            </svg>
          `;
		micToggle.setAttribute("data-muted", "true");
	}
}

const overlay = document.getElementById("modalOverlay");

function openModal() {
	document.getElementById("modalOverlay").style.display = "flex";
	const main = document.querySelector("main");
	main.setAttribute("inert", "");
}

function closeModal() {
	document.getElementById("modalOverlay").style.display = "none";
	window.location.href = "{% url 'choose' %}";
}

overlay.addEventListener("click", function (e) {
	if (e.target === overlay) {
		closeModal();
	}
});

class SoundMeter {
	constructor(context) {
		this.context = context;
		this.instant = 0.0;
		this.script = context.createScriptProcessor(2048, 1, 1);

		this.script.onaudioprocess = (event) => {
			const input = event.inputBuffer.getChannelData(0);
			let sum = 0.0;

			for (let i = 0; i < input.length; ++i) {
				sum += input[i] * input[i];
			}

			this.instant = Math.sqrt(sum / input.length);
		};
	}

	connectToSource(stream, callback) {
		try {
			this.mic = this.context.createMediaStreamSource(stream);
			this.mic.connect(this.script);
			this.script.connect(this.context.destination); // required for processing to run
			if (typeof callback !== "undefined") {
				callback(null);
			}
		} catch (e) {
			console.error(e);
			if (typeof callback !== "undefined") {
				callback(e);
			}
		}
	}

	stop() {
		if (this.mic) {
			this.mic.disconnect();
		}
		this.script.disconnect();
	}
}
