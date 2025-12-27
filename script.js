const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let model = null;
let modelReady = false;

async function setupCamera() {
	const stream = await navigator.mediaDevices.getUserMedia({
		video: { facingMode: "environment" },
		audio: false,
	});
	video.srcObject = stream;

	return new Promise((resolve) => {
		video.onloadedmetadata = () => {
			video.play();
			// PENTING: Sinkronisasi ukuran canvas dengan video asli
			canvas.width = video.videoWidth;
			canvas.height = video.videoHeight;
			console.log("📷 Resolusi Kamera:", canvas.width, "x", canvas.height);
			resolve();
		};
	});
}

async function loadModel() {
	console.log("⏳ Memuat model...");
	model = await cocoSsd.load();
	modelReady = true;
	console.log("🤖 Model COCO-SSD SIAP");
}

function drawBoxes(predictions) {
	// 1. Bersihkan canvas setiap frame
	ctx.clearRect(0, 0, canvas.width, canvas.height);


	if (predictions.length === 0) return;

	predictions.forEach((pred) => {
		// Gunakan score lebih rendah dulu (0.3) untuk tes apakah terdeteksi
		if (pred.score < 0.3) return;

		const [x, y, width, height] = pred.bbox;

		// Pilih warna berdasarkan objek
		ctx.strokeStyle = "#00FF00";
		ctx.lineWidth = 4;
		ctx.strokeRect(x, y, width, height);

		// Gambar label
		ctx.fillStyle = "#00FF00";
		ctx.font = "bold 20px Arial";
		ctx.fillText(
			`${pred.class.toUpperCase()} ${Math.round(pred.score * 100)}%`,
			x,
			y > 20 ? y - 10 : y + 20
		);
	});
}

async function detectFrame() {
	if (modelReady && video.readyState === 4) {
		// Panggil detect hanya dengan satu argumen yaitu 'video'
		const predictions = await model.detect(video);
		drawBoxes(predictions);
	}
	requestAnimationFrame(detectFrame);
}

async function start() {
	try {
		await setupCamera();
		await loadModel();
		detectFrame();
	} catch (err) {
		console.error("Kesalahan Start:", err);
		alert("Kamera Error: Pastikan pakai HTTPS");
	}
}

start();
