// ============================================================
// ML MODEL MONITORING DASHBOARD
// ============================================================

// ============================================================
// API CONFIGURATION
// ============================================================

const API_BASE_URL = "http://127.0.0.1:8000";

const METRICS_API =
    `${API_BASE_URL}/metrics`;

const LATENCY_API =
    `${API_BASE_URL}/latency-history`;

const ANOMALY_API =
    `${API_BASE_URL}/anomaly-history`;

const PERFORMANCE_API =
    `${API_BASE_URL}/performance`;

const LATENCY_THRESHOLD = 100;

const REFRESH_INTERVAL = 3000;


// ============================================================
// PREDICTION STATE
// ============================================================

let lastPrediction = null;


// ============================================================
// SAFE ELEMENT HELPER
// ============================================================

function getElement(id) {
    return document.getElementById(id);
}


// ============================================================
// LOAD MAIN METRICS
// ============================================================

async function loadMetrics() {

    try {

        const response =
            await fetch(METRICS_API);

        if (!response.ok) {

            throw new Error(
                `Metrics API returned ${response.status}`
            );
        }

        const metrics =
            await response.json();

        // ------------------------------------------
        // DOM ELEMENTS
        // ------------------------------------------

        const totalRequests =
            getElement("totalRequests");

        const churnRate =
            getElement("churnRate");

        const avgLatency =
            getElement("avgLatency");

        const avgProbability =
            getElement("avgProbability");

        const stayPredictions =
            getElement("stayPredictions");

        const churnPredictions =
            getElement("churnPredictions");

        const apiStatus =
            getElement("apiStatus");

        const latencyStatus =
            getElement("latencyStatus");


        // ------------------------------------------
        // UPDATE METRICS
        // ------------------------------------------

        if (totalRequests) {

            totalRequests.textContent =
                metrics.total_requests ?? 0;
        }


        if (churnRate) {

            churnRate.textContent =
                `${metrics.churn_rate ?? 0}%`;
        }


        if (avgLatency) {

            avgLatency.textContent =
                `${metrics.average_latency_ms ?? 0} ms`;
        }


        if (avgProbability) {

            avgProbability.textContent =
                metrics.average_churn_probability ?? 0;
        }


        if (stayPredictions) {

            stayPredictions.textContent =
                metrics.stay_predictions ?? 0;
        }


        if (churnPredictions) {

            churnPredictions.textContent =
                metrics.churn_predictions ?? 0;
        }


        // ------------------------------------------
        // PREDICTION CHART
        // ------------------------------------------

        drawPredictionChart(

            Number(
                metrics.stay_predictions
            ) || 0,

            Number(
                metrics.churn_predictions
            ) || 0
        );


        // ------------------------------------------
        // API STATUS
        // ------------------------------------------

        if (apiStatus) {

            apiStatus.textContent =
                "🟢 Healthy";
        }


        // ------------------------------------------
        // LATENCY STATUS
        // ------------------------------------------

        if (latencyStatus) {

            const latency =
                Number(
                    metrics.average_latency_ms
                ) || 0;

            latencyStatus.textContent =
                latency < LATENCY_THRESHOLD
                    ? "🟢 Normal"
                    : "🔴 High";
        }

    }

    catch (error) {

        console.error(
            "Metrics API Error:",
            error
        );

        const apiStatus =
            getElement("apiStatus");

        if (apiStatus) {

            apiStatus.textContent =
                "🔴 Offline";
        }
    }
}


// ============================================================
// PREDICTION DISTRIBUTION CHART
// ============================================================

function drawPredictionChart(
    stayPredictions,
    churnPredictions
) {

    const canvas =
        getElement("predictionChart");

    if (!canvas) return;

    const ctx =
        canvas.getContext("2d");

    const width =
        canvas.clientWidth || 700;

    const height =
        canvas.clientHeight || 280;

    canvas.width = width;
    canvas.height = height;

    ctx.clearRect(
        0,
        0,
        width,
        height
    );


    const padding = 50;

    const chartHeight =
        height - padding * 2;

    const maxValue =
        Math.max(
            stayPredictions,
            churnPredictions,
            1
        );


    // ------------------------------------------
    // AXES
    // ------------------------------------------

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

    ctx.strokeStyle = "#777";

    ctx.lineWidth = 1;

    ctx.stroke();


    // ------------------------------------------
    // BAR SETTINGS
    // ------------------------------------------

    const barWidth = 100;

    const stayX =
        width / 2 - 130;

    const churnX =
        width / 2 + 30;


    const stayHeight =
        (
            stayPredictions /
            maxValue
        ) * chartHeight;


    const churnHeight =
        (
            churnPredictions /
            maxValue
        ) * chartHeight;


    const stayY =
        height -
        padding -
        stayHeight;


    const churnY =
        height -
        padding -
        churnHeight;


    // ------------------------------------------
    // STAY BAR
    // ------------------------------------------

    ctx.fillStyle =
        "#4CAF50";

    ctx.fillRect(

        stayX,
        stayY,
        barWidth,
        stayHeight
    );


    // ------------------------------------------
    // CHURN BAR
    // ------------------------------------------

    if (churnHeight > 0) {

        ctx.fillStyle =
            "#F44336";

        ctx.fillRect(

            churnX,
            churnY,
            barWidth,
            churnHeight
        );
    }


    // ------------------------------------------
    // TEXT
    // ------------------------------------------

    ctx.font =
        "14px Arial";

    ctx.textAlign =
        "center";

    ctx.fillStyle =
        "#222";


    ctx.fillText(

        stayPredictions,

        stayX +
        barWidth / 2,

        Math.max(
            stayY - 10,
            15
        )
    );


    ctx.fillText(

        churnPredictions,

        churnX +
        barWidth / 2,

        Math.max(
            churnY - 10,
            15
        )
    );


    ctx.fillText(

        "Stay",

        stayX +
        barWidth / 2,

        height - 20
    );


    ctx.fillText(

        "Churn",

        churnX +
        barWidth / 2,

        height - 20
    );
}


// ============================================================
// LOAD LATENCY HISTORY
// ============================================================

async function loadLatencyChart() {

    try {

        const response =
            await fetch(LATENCY_API);

        if (!response.ok) {

            throw new Error(
                "Latency API failed"
            );
        }

        const data =
            await response.json();

        const canvas =
            getElement("latencyChart");

        if (!canvas) return;

        const ctx =
            canvas.getContext("2d");

        const width =
            canvas.clientWidth || 700;

        const height =
            canvas.clientHeight || 350;

        canvas.width = width;
        canvas.height = height;

        ctx.clearRect(
            0,
            0,
            width,
            height
        );


        // ------------------------------------------
        // NO DATA
        // ------------------------------------------

        if (
            !data.latencies ||
            data.latencies.length === 0
        ) {

            ctx.font =
                "14px Arial";

            ctx.fillStyle =
                "#666";

            ctx.textAlign =
                "center";

            ctx.fillText(

                "No latency data available",

                width / 2,

                height / 2
            );

            return;
        }


        // ------------------------------------------
        // LAST 30 REQUESTS
        // ------------------------------------------

        const latencies =
            data.latencies.slice(-30);


        const maxLatency =
            Math.max(...latencies);


        const minLatency =
            Math.min(...latencies);


        const latestLatency =
            latencies[
                latencies.length - 1
            ];


        const padding = 40;


        const chartWidth =
            width -
            padding * 2;


        const chartHeight =
            height -
            padding * 2;


        // ------------------------------------------
        // AXES
        // ------------------------------------------

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

        ctx.strokeStyle =
            "#777";

        ctx.lineWidth = 1;

        ctx.stroke();


        // ------------------------------------------
        // LATENCY LINE
        // ------------------------------------------

        ctx.beginPath();

        latencies.forEach(
            (latency, index) => {

                const x =
                    padding +
                    (
                        index /
                        Math.max(
                            latencies.length - 1,
                            1
                        )
                    ) *
                    chartWidth;


                let y;


                if (
                    maxLatency ===
                    minLatency
                ) {

                    y =
                        height / 2;

                }

                else {

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

                }

                else {

                    ctx.lineTo(
                        x,
                        y
                    );
                }
            }
        );


        ctx.strokeStyle =
            "#222";

        ctx.lineWidth = 2;

        ctx.stroke();


        // ------------------------------------------
        // DATA POINTS
        // ------------------------------------------

        latencies.forEach(
            (latency, index) => {

                const x =
                    padding +
                    (
                        index /
                        Math.max(
                            latencies.length - 1,
                            1
                        )
                    ) *
                    chartWidth;


                let y;


                if (
                    maxLatency ===
                    minLatency
                ) {

                    y =
                        height / 2;

                }

                else {

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
                    3,
                    0,
                    Math.PI * 2
                );

                ctx.fillStyle =
                    "#222";

                ctx.fill();
            }
        );


        // ------------------------------------------
        // LATEST LATENCY
        // ------------------------------------------

        ctx.font =
            "14px Arial";

        ctx.textAlign =
            "right";

        ctx.fillStyle =
            "#222";

        ctx.fillText(

            `Latest: ${Number(
                latestLatency
            ).toFixed(2)} ms`,

            width - 10,

            25
        );

    }

    catch (error) {

        console.error(
            "Latency chart error:",
            error
        );
    }
}


// ============================================================
// LOAD ANOMALIES
// ============================================================

async function loadAnomalies() {

    try {

        const response =
            await fetch(ANOMALY_API);

        if (!response.ok) {

            throw new Error(
                "Anomaly API failed"
            );
        }

        const data =
            await response.json();

        const anomalies =
            Array.isArray(data.anomalies)
                ? data.anomalies
                : [];


        const anomalyStatus =
            getElement("anomalyStatus");

        const anomalyList =
            getElement("anomalyList");


        if (
            !anomalyStatus ||
            !anomalyList
        ) {

            return;
        }


        anomalyList.innerHTML =
            "";


        // ------------------------------------------
        // NO ANOMALIES
        // ------------------------------------------

        if (anomalies.length === 0) {

            anomalyStatus.innerHTML =
                "🟢 No anomalies detected";

            return;
        }


        // ------------------------------------------
        // ANOMALIES DETECTED
        // ------------------------------------------

        anomalyStatus.innerHTML =
            `🔴 ${anomalies.length} anomaly/anomalies detected`;


        anomalies.forEach(
            anomaly => {

                const div =
                    document.createElement(
                        "div"
                    );

                div.className =
                    "anomaly-item";


                const prediction =
                    Number(
                        anomaly.prediction
                    ) === 1
                        ? "Churn"
                        : "Stay";


                div.innerHTML = `

                    <p>
                        <strong>
                            ⚠️ Anomaly Detected
                        </strong>
                    </p>

                    <p>
                        <strong>Time:</strong>
                        ${anomaly.timestamp ?? "-"}
                    </p>

                    <p>
                        <strong>Latency:</strong>
                        ${anomaly.latency_ms ?? "-"} ms
                    </p>

                    <p>
                        <strong>Prediction:</strong>
                        ${prediction}
                    </p>

                    <p>
                        <strong>Churn Probability:</strong>
                        ${anomaly.churn_probability ?? "-"}
                    </p>

                `;


                anomalyList.appendChild(
                    div
                );
            }
        );

    }

    catch (error) {

        console.error(
            "Anomaly API Error:",
            error
        );
    }
}


// ============================================================
// ANOMALY SUMMARY
// ============================================================

async function loadAnomalyChart() {

    try {

        const [
            anomalyResponse,
            metricsResponse
        ] = await Promise.all([

            fetch(ANOMALY_API),

            fetch(METRICS_API)

        ]);


        if (
            !anomalyResponse.ok ||
            !metricsResponse.ok
        ) {

            throw new Error(
                "Failed to load anomaly data"
            );
        }


        const anomalyData =
            await anomalyResponse.json();


        const metrics =
            await metricsResponse.json();


        const totalRequests =
            Number(
                metrics.total_requests
            ) || 0;


        const totalAnomalies =
            Array.isArray(
                anomalyData.anomalies
            )
                ? anomalyData.anomalies.length
                : 0;


        const normalRequests =
            Math.max(
                totalRequests -
                totalAnomalies,
                0
            );


        const anomalyRate =
            totalRequests > 0
                ? (
                    totalAnomalies /
                    totalRequests
                ) * 100
                : 0;


        const totalAnomaliesElement =
            getElement("totalAnomalies");


        const normalRequestsElement =
            getElement("normalRequests");


        const anomalyRateElement =
            getElement("anomalyRate");


        if (totalAnomaliesElement) {

            totalAnomaliesElement.textContent =
                totalAnomalies;
        }


        if (normalRequestsElement) {

            normalRequestsElement.textContent =
                normalRequests;
        }


        if (anomalyRateElement) {

            anomalyRateElement.textContent =
                anomalyRate.toFixed(2) +
                "%";
        }


        drawAnomalyChart(

            totalAnomalies,

            normalRequests
        );

    }

    catch (error) {

        console.error(
            "Anomaly chart error:",
            error
        );
    }
}


// ============================================================
// DRAW ANOMALY CHART
// ============================================================

function drawAnomalyChart(
    totalAnomalies,
    normalRequests
) {

    const canvas =
        getElement("anomalyChart");

    if (!canvas) return;


    const ctx =
        canvas.getContext("2d");


    const width =
        canvas.clientWidth || 700;


    const height =
        canvas.clientHeight || 250;


    canvas.width = width;
    canvas.height = height;


    ctx.clearRect(
        0,
        0,
        width,
        height
    );


    const padding = 50;


    const chartHeight =
        height -
        padding * 2;


    const maxValue =
        Math.max(
            totalAnomalies,
            normalRequests,
            1
        );


    // ------------------------------------------
    // AXES
    // ------------------------------------------

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

    ctx.strokeStyle =
        "#777";

    ctx.lineWidth = 1;

    ctx.stroke();


    // ------------------------------------------
    // BAR SETTINGS
    // ------------------------------------------

    const barWidth = 100;


    const normalX =
        width / 2 - 130;


    const anomalyX =
        width / 2 + 30;


    const normalHeight =
        (
            normalRequests /
            maxValue
        ) *
        chartHeight;


    const anomalyHeight =
        (
            totalAnomalies /
            maxValue
        ) *
        chartHeight;


    const normalY =
        height -
        padding -
        normalHeight;


    const anomalyY =
        height -
        padding -
        anomalyHeight;


    // ------------------------------------------
    // NORMAL BAR
    // ------------------------------------------

    ctx.fillStyle =
        "#4CAF50";


    ctx.fillRect(

        normalX,
        normalY,
        barWidth,
        normalHeight
    );


    // ------------------------------------------
    // ANOMALY BAR
    // ------------------------------------------

    if (anomalyHeight > 0) {

        ctx.fillStyle =
            "#F44336";


        ctx.fillRect(

            anomalyX,
            anomalyY,
            barWidth,
            anomalyHeight
        );
    }


    // ------------------------------------------
    // TEXT
    // ------------------------------------------

    ctx.font =
        "14px Arial";


    ctx.textAlign =
        "center";


    ctx.fillStyle =
        "#222";


    ctx.fillText(

        normalRequests,

        normalX +
        barWidth / 2,

        Math.max(
            normalY - 10,
            15
        )
    );


    ctx.fillText(

        totalAnomalies,

        anomalyX +
        barWidth / 2,

        Math.max(
            anomalyY - 10,
            15
        )
    );


    ctx.fillText(

        "Normal",

        normalX +
        barWidth / 2,

        height - 20
    );


    ctx.fillText(

        "Anomalies",

        anomalyX +
        barWidth / 2,

        height - 20
    );
}


// ============================================================
// MODEL PERFORMANCE
// ============================================================

async function loadPerformance() {

    try {

        const response =
            await fetch(PERFORMANCE_API);


        if (!response.ok) {

            throw new Error(
                "Performance API failed"
            );
        }


        const data =
            await response.json();


        const accuracy =
            Number(data.accuracy) || 0;


        const precision =
            Number(data.precision) || 0;


        const recall =
            Number(data.recall) || 0;


        const f1Score =
            Number(data.f1_score) || 0;


        const accuracyElement =
            getElement("accuracy");


        const precisionElement =
            getElement("precision");


        const recallElement =
            getElement("recall");


        const f1Element =
            getElement("f1Score");


        const feedbackCount =
            getElement("feedbackCount");


        const performanceStatus =
            getElement("performanceStatus");


        // ------------------------------------------
        // UPDATE PERFORMANCE
        // ------------------------------------------

        if (accuracyElement) {

            accuracyElement.textContent =
                `${(
                    accuracy * 100
                ).toFixed(2)}%`;
        }


        if (precisionElement) {

            precisionElement.textContent =
                `${(
                    precision * 100
                ).toFixed(2)}%`;
        }


        if (recallElement) {

            recallElement.textContent =
                `${(
                    recall * 100
                ).toFixed(2)}%`;
        }


        if (f1Element) {

            f1Element.textContent =
                `${(
                    f1Score * 100
                ).toFixed(2)}%`;
        }


        if (feedbackCount) {

            feedbackCount.textContent =
                `Feedback records: ${
                    data.total_feedback ?? 0
                }`;
        }


        // ------------------------------------------
        // PERFORMANCE STATUS
        // ------------------------------------------

        if (performanceStatus) {

            if (
                accuracy >= 0.80 &&
                f1Score >= 0.80
            ) {

                performanceStatus.innerHTML =
                    "🟢 Model Performance Healthy";

            }

            else {

                performanceStatus.innerHTML =
                    "🔴 Warning: Model Performance is Low";
            }
        }

    }

    catch (error) {

        console.error(
            "Performance API Error:",
            error
        );
    }
}


// ============================================================
// OVERALL SYSTEM STATUS
// ============================================================

async function updateOverallStatus() {

    try {

        const [
            metricsResponse,
            performanceResponse,
            anomalyResponse
        ] = await Promise.all([

            fetch(METRICS_API),

            fetch(PERFORMANCE_API),

            fetch(ANOMALY_API)

        ]);


        if (
            !metricsResponse.ok ||
            !performanceResponse.ok ||
            !anomalyResponse.ok
        ) {

            throw new Error(
                "Unable to retrieve system status"
            );
        }


        const metrics =
            await metricsResponse.json();


        const performance =
            await performanceResponse.json();


        const anomalyData =
            await anomalyResponse.json();


        const accuracy =
            Number(
                performance.accuracy
            ) || 0;


        const f1Score =
            Number(
                performance.f1_score
            ) || 0;


        const averageLatency =
            Number(
                metrics.average_latency_ms
            ) || 0;


        const anomalyCount =
            Array.isArray(
                anomalyData.anomalies
            )
                ? anomalyData.anomalies.length
                : 0;


        const modelStatus =
            getElement("modelStatus");


        const systemAnomalyStatus =
            getElement(
                "systemAnomalyStatus"
            );


        const latencyStatus =
            getElement(
                "latencyStatus"
            );


        const overallStatus =
            getElement(
                "overallStatus"
            );


        // ------------------------------------------
        // MODEL STATUS
        // ------------------------------------------

        if (modelStatus) {

            modelStatus.textContent =
                (
                    accuracy >= 0.80 &&
                    f1Score >= 0.80
                )
                    ? "🟢 Healthy"
                    : "🔴 Low";
        }


        // ------------------------------------------
        // ANOMALY STATUS
        // ------------------------------------------

        if (systemAnomalyStatus) {

            systemAnomalyStatus.textContent =
                anomalyCount === 0
                    ? "🟢 None"
                    : `🔴 ${anomalyCount} Detected`;
        }


        // ------------------------------------------
        // LATENCY STATUS
        // ------------------------------------------

        if (latencyStatus) {

            latencyStatus.textContent =
                averageLatency <
                LATENCY_THRESHOLD

                    ? "🟢 Normal"

                    : "🔴 High";
        }


        // ------------------------------------------
        // OVERALL STATUS
        // ------------------------------------------

        if (overallStatus) {

            if (
                accuracy >= 0.80 &&
                f1Score >= 0.80 &&
                averageLatency <
                    LATENCY_THRESHOLD &&
                anomalyCount === 0
            ) {

                overallStatus.innerHTML =
                    "🟢 Overall System Status: HEALTHY";

            }

            else {

                overallStatus.innerHTML =
                    "🟡 Overall System Status: NEEDS ATTENTION";
            }
        }

    }

    catch (error) {

        console.error(
            "Overall status error:",
            error
        );


        const overallStatus =
            getElement(
                "overallStatus"
            );


        if (overallStatus) {

            overallStatus.innerHTML =
                "🔴 Overall System Status: ERROR";
        }
    }
}


// ============================================================
// STEP 19 — ALERT SYSTEM
// ============================================================

function updateAlerts(
    metrics,
    anomalies,
    performance
) {

    const alertContainer =
        getElement(
            "alertContainer"
        );


    const alertBadge =
        getElement(
            "alertBadge"
        );


    if (
        !alertContainer ||
        !alertBadge
    ) {

        return;
    }


    let alerts = [];


    // ------------------------------------------
    // 1. ANOMALY ALERT
    // ------------------------------------------

    const anomalyCount =
        Array.isArray(anomalies)
            ? anomalies.length
            : 0;


    if (anomalyCount > 0) {

        alerts.push({

            type: "critical",

            message:
                `🔴 ${anomalyCount} anomaly/anomalies detected`
        });
    }


    // ------------------------------------------
    // 2. LATENCY ALERT
    // ------------------------------------------

    const averageLatency =
        Number(
            metrics.average_latency_ms
        ) || 0;


    if (
        averageLatency >=
        LATENCY_THRESHOLD
    ) {

        alerts.push({

            type: "warning",

            message:
                `⚠️ High latency detected: ${
                    averageLatency.toFixed(2)
                } ms`
        });
    }


    // ------------------------------------------
    // 3. ACCURACY ALERT
    // ------------------------------------------

    const accuracy =
        Number(
            performance.accuracy
        ) || 0;


    if (accuracy < 0.80) {

        alerts.push({

            type: "warning",

            message:
                `⚠️ Model accuracy is below 80%: ${
                    (accuracy * 100).toFixed(2)
                }%`
        });
    }


    // ------------------------------------------
    // 4. F1 ALERT
    // ------------------------------------------

    const f1 =
        Number(
            performance.f1_score
        ) || 0;


    if (f1 < 0.80) {

        alerts.push({

            type: "warning",

            message:
                `⚠️ F1 Score is below 80%: ${
                    (f1 * 100).toFixed(2)
                }%`
        });
    }


    // ------------------------------------------
    // 5. ZERO CHURN ALERT
    // ------------------------------------------

    const totalRequests =
        Number(
            metrics.total_requests
        ) || 0;


    const churnPredictions =
        Number(
            metrics.churn_predictions
        ) || 0;


    if (
        totalRequests >= 20 &&
        churnPredictions === 0
    ) {

        alerts.push({

            type: "warning",

            message:
                "⚠️ No churn predictions detected in recent requests"
        });
    }


    // ------------------------------------------
    // NO ACTIVE ALERTS
    // ------------------------------------------

    if (alerts.length === 0) {

        alertBadge.textContent =
            "🟢 Healthy";


        alertBadge.className =
            "alert-badge healthy";


        alertContainer.innerHTML = `

            <div class="no-alert">

                🟢 No active alerts

            </div>

        `;

        return;
    }


    // ------------------------------------------
    // DETERMINE ALERT LEVEL
    // ------------------------------------------

    const criticalAlerts =
        alerts.filter(
            alert =>
                alert.type === "critical"
        ).length;


    if (criticalAlerts > 0) {

        alertBadge.textContent =
            `${alerts.length} Alert${
                alerts.length > 1
                    ? "s"
                    : ""
            }`;


        alertBadge.className =
            "alert-badge critical";
    }

    else {

        alertBadge.textContent =
            `${alerts.length} Warning${
                alerts.length > 1
                    ? "s"
                    : ""
            }`;


        alertBadge.className =
            "alert-badge warning";
    }


    // ------------------------------------------
    // DISPLAY ALERTS
    // ------------------------------------------

    alertContainer.innerHTML =
        alerts.map(
            alert => `

                <div class="
                    alert-item
                    ${alert.type}
                ">

                    ${alert.message}

                </div>

            `
        ).join("");
}


// ============================================================
// LOAD ALERT SYSTEM
// ============================================================

async function loadAlertSystem() {

    try {

        const [
            metricsResponse,
            anomalyResponse,
            performanceResponse
        ] = await Promise.all([

            fetch(METRICS_API),

            fetch(ANOMALY_API),

            fetch(PERFORMANCE_API)

        ]);


        if (
            !metricsResponse.ok ||
            !anomalyResponse.ok ||
            !performanceResponse.ok
        ) {

            throw new Error(
                "Unable to load alert information"
            );
        }


        const metrics =
            await metricsResponse.json();


        const anomalyData =
            await anomalyResponse.json();


        const performance =
            await performanceResponse.json();


        const anomalies =
            Array.isArray(
                anomalyData.anomalies
            )
                ? anomalyData.anomalies
                : [];


        updateAlerts(

            metrics,

            anomalies,

            performance
        );

    }

    catch (error) {

        console.error(
            "Alert System Error:",
            error
        );
    }
}


// ============================================================
// MAKE PREDICTION
// ============================================================

async function makePrediction() {

    const predictionResult =
        getElement(
            "predictionResult"
        );


    const feedbackSection =
        getElement(
            "feedbackSection"
        );


    const feedbackResult =
        getElement(
            "feedbackResult"
        );


    if (!predictionResult) {
        return;
    }


    // ------------------------------------------
    // SHOW LOADING
    // ------------------------------------------

    predictionResult.style.display =
        "block";


    predictionResult.innerHTML = `

        <div class="result-box">

            ⏳ Making prediction...

        </div>

    `;


    // ------------------------------------------
    // RESET FEEDBACK DISPLAY
    // ------------------------------------------

    if (feedbackSection) {

        feedbackSection.style.display =
            "none";
    }


    if (feedbackResult) {

        feedbackResult.innerHTML =
            "";
    }


    // ------------------------------------------
    // CUSTOMER DATA
    // ------------------------------------------

    const customerData = {

        Age:
            Number(
                getElement(
                    "inputAge"
                ).value
            ),


        Gender:
            getElement(
                "inputGender"
            ).value,


        Tenure:
            Number(
                getElement(
                    "inputTenure"
                ).value
            ),


        Usage_Frequency:
            Number(
                getElement(
                    "inputUsageFrequency"
                ).value
            ),


        Support_Calls:
            Number(
                getElement(
                    "inputSupportCalls"
                ).value
            ),


        Payment_Delay:
            Number(
                getElement(
                    "inputPaymentDelay"
                ).value
            ),


        Subscription_Type:
            getElement(
                "inputSubscriptionType"
            ).value,


        Contract_Length:
            getElement(
                "inputContractLength"
            ).value,


        Total_Spend:
            Number(
                getElement(
                    "inputTotalSpend"
                ).value
            ),


        Last_Interaction:
            Number(
                getElement(
                    "inputLastInteraction"
                ).value
            )
    };


    try {

        const startTime =
            performance.now();


        const response =
            await fetch(

                `${API_BASE_URL}/predict`,

                {

                    method:
                        "POST",


                    headers: {

                        "Content-Type":
                            "application/json"
                    },


                    body:
                        JSON.stringify(
                            customerData
                        )
                }
            );


        if (!response.ok) {

            throw new Error(

                `Prediction API returned ${
                    response.status
                }`
            );
        }


        const data =
            await response.json();


        const requestTime =
            performance.now() -
            startTime;


        // ------------------------------------------
        // SAVE PREDICTION
        // ------------------------------------------

        lastPrediction =
            Number(
                data.prediction
            );


        // ------------------------------------------
        // RESULT TEXT
        // ------------------------------------------

        const predictionText =
            lastPrediction === 1

                ? "🔴 Customer likely to CHURN"

                : "🟢 Customer likely to STAY";


        const anomalyText =
            data.latency_anomaly

                ? `🔴 ${
                    data.anomaly_type ||
                    "Anomaly detected"
                }`

                : "🟢 Normal";


        const churnProbability =
            Number(
                data.churn_probability
            ) || 0;


        const stayProbability =
            Number(
                data.no_churn_probability
            ) || 0;


        const latency =
            Number(
                data.latency_ms
            );


        // ------------------------------------------
        // DISPLAY RESULT
        // ------------------------------------------

        predictionResult.innerHTML = `

            <div class="result-box">

                <h3>
                    ${predictionText}
                </h3>


                <div class="prediction-details">

                    <p>

                        <strong>
                            Churn Probability:
                        </strong>

                        ${
                            (
                                churnProbability *
                                100
                            ).toFixed(2)
                        }%

                    </p>


                    <p>

                        <strong>
                            Stay Probability:
                        </strong>

                        ${
                            (
                                stayProbability *
                                100
                            ).toFixed(2)
                        }%

                    </p>


                    <p>

                        <strong>
                            Prediction Latency:
                        </strong>

                        ${
                            Number.isFinite(
                                latency
                            )

                                ? latency.toFixed(2)

                                : requestTime.toFixed(2)
                        } ms

                    </p>


                    <p>

                        <strong>
                            Anomaly:
                        </strong>

                        ${anomalyText}

                    </p>

                </div>

            </div>

        `;


        predictionResult.style.display =
            "block";


        // ------------------------------------------
        // SHOW FEEDBACK
        // ------------------------------------------

        if (feedbackSection) {

            feedbackSection.style.display =
                "block";
        }


        if (feedbackResult) {

            feedbackResult.innerHTML =
                "Please select the actual customer outcome.";
        }


        // ------------------------------------------
        // REFRESH MONITORING
        // ------------------------------------------

        loadMetrics();

        loadLatencyChart();

        loadAnomalies();

        loadAnomalyChart();

        loadPerformance();

        updateOverallStatus();

        loadAlertSystem();

    }

    catch (error) {

        console.error(
            "Prediction Error:",
            error
        );


        predictionResult.style.display =
            "block";


        predictionResult.innerHTML = `

            <div class="
                result-box
                error-box
            ">

                <h3>
                    🔴 Prediction failed
                </h3>


                <p>
                    Please check that FastAPI is running.
                </p>


                <p>
                    Error:
                    ${error.message}
                </p>

            </div>

        `;
    }
}


// ============================================================
// SUBMIT FEEDBACK
// ============================================================

async function submitFeedback(
    actualOutcome
) {

    const feedbackResult =
        getElement(
            "feedbackResult"
        );


    if (!feedbackResult) {
        return;
    }


    if (lastPrediction === null) {

        feedbackResult.innerHTML =
            "⚠️ Please make a prediction first.";

        return;
    }


    feedbackResult.innerHTML =
        "⏳ Submitting feedback...";


    try {

        const response =
            await fetch(

                `${API_BASE_URL}/feedback`,

                {

                    method:
                        "POST",


                    headers: {

                        "Content-Type":
                            "application/json"
                    },


                    body:
                        JSON.stringify({

                            prediction:
                                lastPrediction,

                            actual_outcome:
                                actualOutcome
                        })
                }
            );


        if (!response.ok) {

            throw new Error(

                `Feedback API returned ${
                    response.status
                }`
            );
        }


        const data =
            await response.json();


        if (data.correct) {

            feedbackResult.innerHTML =
                "🟢 Correct prediction! Feedback recorded.";

        }

        else {

            feedbackResult.innerHTML =
                "🔴 Incorrect prediction. Feedback recorded.";
        }


        // ------------------------------------------
        // REFRESH MONITORING
        // ------------------------------------------

        loadPerformance();

        updateOverallStatus();

        loadAlertSystem();


        // ------------------------------------------
        // CLEAR PREDICTION STATE
        // ------------------------------------------

        lastPrediction =
            null;

    }

    catch (error) {

        console.error(
            "Feedback Error:",
            error
        );


        feedbackResult.innerHTML =
            `🔴 Unable to submit feedback: ${
                error.message
            }`;
    }
}


// ============================================================
// INITIAL LOAD
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        loadMetrics();

        loadLatencyChart();

        loadAnomalies();

        loadAnomalyChart();

        loadPerformance();

        updateOverallStatus();

        // STEP 19
        loadAlertSystem();

    }
);


// ============================================================
// AUTO REFRESH
// ============================================================

setInterval(

    function () {

        // ------------------------------------------
        // MONITORING ONLY
        // Prediction result is NOT touched.
        // ------------------------------------------

        loadMetrics();

        loadLatencyChart();

        loadAnomalies();

        loadAnomalyChart();

        loadPerformance();

        updateOverallStatus();

        // STEP 19 ALERT SYSTEM
        loadAlertSystem();

    },

    REFRESH_INTERVAL
);