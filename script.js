// Ambil elemen
const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let model = null;
let modelReady = false;
let detecting = false;

// ============================
// 1. AKSES KAMERA (AMAN MOBILE & LAPTOP)
// ============================
async function setupCamera() {
	const stream = await navigator.mediaDevices.getUserMedia({
		video: {
			facingMode: { ideal: "environment" }, // kamera belakang HP
			width: { ideal: 1280 },
			height: { ideal: 720 },
		},
		audio: false,
	});

	video.srcObject = stream;

	return new Promise((resolve) => {
		video.onloadedmetadata = () => {
			video.play();

			// Samakan ukuran canvas dengan video
			canvas.width = video.videoWidth;
			canvas.height = video.videoHeight;

			resolve();
		};
	});
}

// ============================
// 2. LOAD MODEL AI
// ============================
async function loadModel() {
	model = await cocoSsd.load();
	modelReady = true;
	console.log("✅ Model siap");
}

// ============================
// 3. GAMBAR KOTAK (STABIL)
// ============================
function drawBoxes(predictions) {
	ctx.clearRect(0, 0, canvas.width, canvas.height);

	predictions.forEach((pred) => {
		if (pred.score > (canvas.width > 500 ? 0.4 : 0.6)) {
			const [x, y, width, height] = pred.bbox;

			ctx.strokeStyle = "lime";
			ctx.lineWidth = 3;
			ctx.strokeRect(x, y, width, height);

			ctx.fillStyle = "lime";
			ctx.font = "16px Arial";
			ctx.fillText(
				`${pred.class} (${Math.round(pred.score * 100)}%)`,
				x,
				y > 20 ? y - 5 : y + 20
			);
		}
	});
}

// ============================
// 4. DETEKSI REAL-TIME (FPS DIBATASI)
// ============================
async function detectFrame() {
	if (!modelReady || detecting) {
		setTimeout(detectFrame, 200);
		return;
	}

	detecting = true;

	const predictions = await model.detect(video);
	drawBoxes(predictions);

	detecting = false;

	// Batasi FPS supaya stabil (≈5 FPS)
	setTimeout(detectFrame, 200);
}

// ============================
// 5. START SEMUA (URUT & AMAN)
// ============================
async function start() {
	try {
		await setupCamera();
		await loadModel();
		detectFrame();
	} catch (err) {
		alert("Kamera tidak bisa diakses. Pastikan HTTPS & izin kamera aktif.");
		console.error(err);
	}
}

// Jalankan
start();
