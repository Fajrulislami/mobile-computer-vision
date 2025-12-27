// ============================
// AMBIL ELEMEN
// ============================
const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let model = null;
let modelReady = false;
let detecting = false;

// ============================
// 1. AKSES KAMERA
// ============================
async function setupCamera() {
	const stream = await navigator.mediaDevices.getUserMedia({
		video: {
			facingMode: { ideal: "environment" },
			width: { ideal: 640 },
			height: { ideal: 480 },
		},
		audio: false,
	});

	video.srcObject = stream;

	return new Promise((resolve) => {
		video.onloadedmetadata = () => {
			video.play();
			canvas.width = video.videoWidth;
			canvas.height = video.videoHeight;
			console.log("📷 Kamera siap:", canvas.width, canvas.height);
			resolve();
		};
	});
}

// ============================
// 2. LOAD MODEL COCO-SSD
// ============================
async function loadModel() {
	model = await cocoSsd.load({
		base: "lite_mobilenet_v2",
	});
	modelReady = true;
	console.log("🤖 Model COCO-SSD siap");
}

// ============================
// 3. KATEGORI & WARNA
// ============================
function getCategory(className) {
	if (className === "person") return "ORANG";
	if (className === "bottle") return "BOTOL";
	if (className === "motorcycle") return "MOTOR";
	return null;
}

function getColor(category) {
	if (category === "ORANG") return "lime";
	if (category === "BOTOL") return "cyan";
	if (category === "MOTOR") return "orange";
	return "white";
}

// ============================
// 4. GAMBAR BOUNDING BOX
// ============================
function drawBoxes(predictions) {
	ctx.clearRect(0, 0, canvas.width, canvas.height);

	predictions.forEach((pred) => {
		if (pred.score < 0.5) return;

		const category = getCategory(pred.class);
		if (!category) return;

		const [x, y, width, height] = pred.bbox;
		if (width < 20 || height < 20) return;

		const color = getColor(category);

		ctx.strokeStyle = color;
		ctx.lineWidth = 3;
		ctx.strokeRect(x, y, width, height);

		ctx.fillStyle = color;
		ctx.font = "16px Arial";
		ctx.fillText(
			`${category} (${Math.round(pred.score * 100)}%)`,
			x,
			y > 20 ? y - 5 : y + 20
		);
	});
}

// ============================
// 5. DETEKSI REAL-TIME
// ============================
async function detectFrame() {
	if (!modelReady || detecting) {
		setTimeout(detectFrame, 100);
		return;
	}

	detecting = true;

	const predictions = await model.detect(video);
	drawBoxes(predictions);

	detecting = false;
	setTimeout(detectFrame, 150); // ±6 FPS (stabil & ringan)
}

// ============================
// 6. START
// ============================
async function start() {
	try {
		await setupCamera();
		await loadModel();

		// Tunggu video benar-benar tampil
		video.onplaying = () => {
			console.log("▶️ Deteksi dimulai");
			detectFrame();
		};
	} catch (err) {
		alert("❌ Kamera tidak bisa diakses. Gunakan HTTPS / localhost.");
		console.error(err);
	}
}

start();
