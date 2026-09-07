const API_URL = "http://127.0.0.1:8000/metrics";


async function loadMetrics() {

    try {

        const response = await fetch(API_URL);


        if (!response.ok) {

            throw new Error(
                "API request failed"
            );

        }


        const metrics = await response.json();
        const statusElement =
    document.getElementById("status");


if (metrics.average_latency_ms < 100) {

    statusElement.textContent =
        "🟢 Model is healthy";

}

else {

    statusElement.textContent =
        "🟡 Warning: High model latency";

}

        // Update metric cards

        document.getElementById(
            "totalRequests"
        ).textContent =
            metrics.total_requests;


        document.getElementById(
            "churnRate"
        ).textContent =
            metrics.churn_rate + "%";


        document.getElementById(
            "avgLatency"
        ).textContent =
            metrics.average_latency_ms + " ms";


        document.getElementById(
            "avgProbability"
        ).textContent =
            metrics.average_churn_probability;


        // Prediction counts

        document.getElementById(
            "stayPredictions"
        ).textContent =
            metrics.stay_predictions;


        document.getElementById(
            "churnPredictions"
        ).textContent =
            metrics.churn_predictions;


        // Status

        document.getElementById(
            "status"
        ).textContent =
            "Monitoring API connected successfully.";


    }

    catch (error) {

        console.error(error);


        document.getElementById(
            "status"
        ).textContent =
            "Unable to connect to FastAPI.";

    }

}


// Load metrics when page opens

loadMetrics();

loadLatencyChart();


setInterval(() => {

    loadMetrics();

    loadLatencyChart();

}, 3000);

async function loadLatencyChart() {

    try {

        const response =
            await fetch(
                "http://127.0.0.1:8000/latency-history"
            );


        const data =
            await response.json();


        const canvas =
            document.getElementById(
                "latencyChart"
            );


        const ctx =
            canvas.getContext("2d");


        const width =
            canvas.clientWidth;


        const height =
            canvas.clientHeight;


        canvas.width = width;

        canvas.height = height;


        // Clear canvas

        ctx.clearRect(
            0,
            0,
            width,
            height
        );


        if (data.latencies.length === 0) {

            return;

        }


        // Show only the latest 30 requests
        const latencies =
             data.latencies.slice(-30);


        const maxLatency =
            Math.max(...latencies);


        const minLatency =
            Math.min(...latencies);

        const latestLatency =
             latencies[latencies.length - 1];

        const padding = 40;


        const chartWidth =
            width - padding * 2;


        const chartHeight =
            height - padding * 2;


        // Draw axes

        ctx.beginPath();

        ctx.moveTo(
            padding,
            padding
        );

        ctx.lineTo(
            padding,
            height - padding
        );

        ctx.lineTo(
            width - padding,
            height - padding
        );

        ctx.stroke();
                ctx.font = "14px Arial";
        ctx.fillText(
            "Latency (ms)",
            10,
            20
        );

        ctx.fillText(
            "Recent Requests",
            width - 120,
            height - 10
        );

        // Draw line

        ctx.beginPath();


        latencies.forEach(
            (latency, index) => {

                const x =
                    padding +
                    (
                        index /
                        (latencies.length - 1)
                    ) *
                    chartWidth;


                let y;


                if (
                    maxLatency === minLatency
                ) {

                    y =
                        height / 2;

                } else {

                    y =
                        height -
                        padding -
                        (
                            (
                                latency -
                                minLatency
                            ) /
                            (
                                maxLatency -
                                minLatency
                            )
                        ) *
                        chartHeight;

                }


                if (index === 0) {

                    ctx.moveTo(
                        x,
                        y
                    );

                } else {

                    ctx.lineTo(
                        x,
                        y
                    );

                }

            }
        );


        ctx.stroke();
        // Axis labels




        // Draw points

        latencies.forEach(
            (latency, index) => {

                const x =
                    padding +
                    (
                        index /
                        Math.max(latencies.length - 1, 1)
                    ) *
                    chartWidth;

                let y;

                if (
                    maxLatency === minLatency
                ) {

                    y =
                        height / 2;

                } else {

                    y =
                        height -
                        padding -
                        (
                            (
                                latency -
                                minLatency
                            ) /
                            (
                                maxLatency -
                                minLatency
                            )
                        ) *
                        chartHeight;

                }

                ctx.beginPath();

                ctx.arc(
                    x,
                    y,
                    4,
                    0,
                    Math.PI * 2
                );

                ctx.fill();

            }
        );


        // ==========================================
        // SHOW LATEST LATENCY
        // ==========================================

        ctx.font = "14px Arial";

        ctx.fillText(
            "Latest: " +
            latestLatency.toFixed(2) +
            " ms",
            width - 130,
            25
        );

    catch (error) {

        console.error(
            "Latency chart error:",
            error
        );

    }

}