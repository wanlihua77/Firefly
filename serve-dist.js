import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.join(__dirname, "dist");
const PORT = 4321;

const MIME = {
	".html": "text/html",
	".css": "text/css",
	".js": "application/javascript",
	".mjs": "application/javascript",
	".json": "application/json",
	".png": "image/png",
	".jpg": "image/jpeg",
	".jpeg": "image/jpeg",
	".gif": "image/gif",
	".svg": "image/svg+xml",
	".ico": "image/x-icon",
	".webp": "image/webp",
	".avif": "image/avif",
	".woff": "font/woff",
	".woff2": "font/woff2",
	".ttf": "font/ttf",
	".xml": "application/xml",
	".txt": "text/plain",
	".map": "application/json",
	".mp4": "video/mp4",
	".webm": "video/webm",
};

function serveFile(res, filePath) {
	const ext = path.extname(filePath);
	const contentType = MIME[ext] || "application/octet-stream";
	const stat = fs.statSync(filePath);
	res.writeHead(200, {
		"Content-Type": contentType,
		"Content-Length": stat.size,
		"Cache-Control":
			ext === ".html" ? "no-cache" : "max-age=31536000, immutable",
	});
	fs.createReadStream(filePath).pipe(res);
}

function send404(res) {
	const fallback = path.join(DIST, "404.html");
	if (fs.existsSync(fallback)) {
		return serveFile(res, fallback);
	}
	res.writeHead(404, { "Content-Type": "text/plain" });
	res.end("404 Not Found");
}

function resolvePath(urlPath) {
	const filePath = path.join(DIST, urlPath.replace(/\\/g, "/"));

	if (!filePath.startsWith(DIST)) {
		return null;
	}

	try {
		if (fs.statSync(filePath).isFile()) {
			return filePath;
		}
	} catch {
		// not found or not a file
	}

	// /path/ -> /path/index.html
	const indexInDir = path.join(filePath, "index.html");
	try {
		if (fs.statSync(indexInDir).isFile()) {
			return indexInDir;
		}
	} catch {
		// not found
	}

	// /path -> try /path/index.html (Astro trailingSlash: always)
	if (!urlPath.endsWith("/")) {
		const indexInDirSlash = path.join(`${filePath}/`, "index.html");
		try {
			if (fs.statSync(indexInDirSlash).isFile()) {
				return indexInDirSlash;
			}
		} catch {
			// not found
		}
	}

	return null;
}

const server = http.createServer((req, res) => {
	try {
		const url = new URL(req.url, `http://${req.headers.host}`);
		const filePath = resolvePath(url.pathname);

		if (filePath) {
			serveFile(res, filePath);
		} else {
			send404(res);
		}
	} catch {
		res.writeHead(500);
		res.end("Internal Server Error");
	}
});

server.listen(PORT, "127.0.0.1", () => {
	console.log(`Firefly static server running at http://localhost:${PORT}`);
});
