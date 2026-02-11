
import http from 'http';

const MODEL_NAME = "llava:7b-v1.6";

async function pullModel() {
    console.log(`🚀 Starting download for model: ${MODEL_NAME}...`);
    console.log("This may take several minutes (approx 4GB). Please wait...");

    const options = {
        hostname: 'localhost',
        port: 11434,
        path: '/api/pull',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
    };

    const req = http.request(options, (res) => {
        console.log(`Response Status: ${res.statusCode}`);

        if (res.statusCode !== 200) {
            console.error(`Failed to pull model. Status: ${res.statusCode}`);
            res.resume();
            return;
        }

        res.setEncoding('utf8');
        let lastStatus = "";

        res.on('data', (chunk) => {
            // Ollama sends JSON objects in the stream
            const lines = chunk.split('\n').filter((line: string) => line.trim() !== '');
            for (const line of lines) {
                try {
                    const data = JSON.parse(line);
                    if (data.status && data.status !== lastStatus) {
                        // Only log status changes or completion percentages periodically
                        if (!data.digest && !data.total) {
                            console.log(`Status: ${data.status}`);
                        }
                        lastStatus = data.status;
                    }

                    if (data.completed && data.total) {
                        const percent = Math.round((data.completed / data.total) * 100);
                        if (percent % 10 === 0 && percent > 0) {
                            process.stdout.write(`\rDownloading: ${percent}%`);
                        }
                    }
                } catch (e) {
                    // Ignore parse errors for partial chunks
                }
            }
        });

        res.on('end', () => {
            console.log(`\n\n✅ Model ${MODEL_NAME} downloaded successfully!`);
        });
    });

    req.on('error', (e) => {
        console.error(`Problem with request: ${e.message}`);
        console.error("Is Ollama running? (http://localhost:11434)");
    });

    req.write(JSON.stringify({ name: MODEL_NAME, stream: true }));
    req.end();
}

pullModel();
