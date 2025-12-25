const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let model;
let lastBoxes = {}; // simpan posisi sebelumnya untuk smoothing

// ===============================
// SETUP KAMERA (AMAN LAPTOP & HP)
// ===============================
async function setupCamera() {
	const stream = await navigator.mediaDevices.getUserMedia({
		video: {
			width: { ideal: 1280 },
			height: { ideal: 720 },
		},
		audio: false,
	});

	video.srcObject = stream;

	return new Promise((resolve) => {
		video.onloadedmetadata = () => {
			resizeCanvas();
			resolve(video);
		};
	});
}

// ===============================
// SESUAIKAN CANVAS
// ===============================
function resizeCanvas() {
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
}
window.addEventListener("resize", resizeCanvas);

// ===============================
// LOAD MODEL AI
// ===============================
async function loadModel() {
	model = await cocoSsd.load();
	console.log("Model AI siap");
}

// ===============================
// DETEKSI OBJEK (STABIL)
// ===============================
async function detectObjects() {
	ctx.clearRect(0, 0, canvas.width, canvas.height);

	const predictions = await model.detect(video);

	predictions
		// 🔹 FILTER CONFIDENCE
		.filter((pred) => pred.score > 0.6)
		.forEach((pred) => {
			const [x, y, width, height] = pred.bbox;

			// Skala ke layar
			const scaleX = canvas.width / video.videoWidth;
			const scaleY = canvas.height / video.videoHeight;

			const newX = x * scaleX;
			const newY = y * scaleY;
			const newW = width * scaleX;
			const newH = height * scaleY;

			// ===============================
			// SMOOTHING (ANTI GOYANG)
			// ===============================
			const alpha = 0.7; // semakin besar = semakin halus

			const prev = lastBoxes[pred.class] || {
				x: newX,
				y: newY,
				w: newW,
				h: newH,
			};

			const smoothX = alpha * prev.x + (1 - alpha) * newX;
			const smoothY = alpha * prev.y + (1 - alpha) * newY;
			const smoothW = alpha * prev.w + (1 - alpha) * newW;
			const smoothH = alpha * prev.h + (1 - alpha) * newH;

			lastBoxes[pred.class] = {
				x: smoothX,
				y: smoothY,
				w: smoothW,
				h: smoothH,
			};

			// ===============================
			// GAMBAR KOTAK & LABEL
			// ===============================
			ctx.strokeStyle = "lime";
			ctx.lineWidth = 2;
			ctx.strokeRect(smoothX, smoothY, smoothW, smoothH);

			ctx.fillStyle = "lime";
			ctx.font = "14px Arial";
			ctx.fillText(
				`${pred.class} (${Math.round(pred.score * 100)}%)`,
				smoothX,
				smoothY > 20 ? smoothY - 5 : 20
			);
		});

	// 🔹 DETEKSI TIDAK TIAP FRAME (LEBIH STABIL)
	setTimeout(detectObjects, 120); // ~8 FPS
}

// ===============================
// START SYSTEM
// ===============================
async function start() {
	await setupCamera();
	await loadModel();
	detectObjects();
}

start();
