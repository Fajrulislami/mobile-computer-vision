// ============================
// AMBIL ELEMEN
// ============================
const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const stableObjects = {};
let model = null;
let modelReady = false;
let detecting = false;

// ============================
// 1. AKSES KAMERA (MOBILE + LAPTOP)
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
			resolve();
		};
	});
}

// ============================
// 2. LOAD MODEL COCO-SSD
// ============================
async function loadModel() {
	model = await cocoSsd.load({
		base: "lite_mobilenet_v2"
	});
	modelReady = true;
	console.log("✅ Model COCO-SSD siap");
}

// ============================
// 3. KATEGORI OBJEK
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
// 4. GAMBAR KOTAK (STABIL)
// ============================
function drawBoxes(predictions) {
	ctx.clearRect(0, 0, canvas.width, canvas.height);

	predictions.forEach((pred) => {
		if (pred.score < 0.4) return;

		const category = getCategory(pred.class);
		if (!category) return;

		const [x, y, width, height] = pred.bbox;

		// filter objek terlalu kecil
		if (width < 40 || height < 40) return;

		// 🔑 KEY LEBIH STABIL (gabung class + area)
		const areaKey = Math.round((width * height) / 10000);
		const key = `${pred.class}-${areaKey}`;

		stableObjects[key] = (stableObjects[key] || 0) + 1;

		// cukup 1 frame saja (jangan terlalu ketat)
		if (stableObjects[key] < 1) return;

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

	// reset ringan agar tidak numpuk
	for (const key in stableObjects) {
		stableObjects[key] *= 0.8;
		if (stableObjects[key] < 0.5) {
			delete stableObjects[key];
		}
	}
}


// ============================
// 5. DETEKSI REAL-TIME (FPS STABIL)
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

	setTimeout(detectFrame, 100); // ±5 FPS
}

// ============================
// 6. START SEMUA
// ============================
async function start() {
	try {
		await setupCamera();
		await loadModel();
		detectFrame();
	} catch (err) {
		alert("❌ Kamera tidak bisa diakses. Pastikan HTTPS & izin kamera aktif.");
		console.error(err);
	}
}

start();
