import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Tooltip,
    Legend,
    Filler
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Tooltip,
    Legend,
    Filler
);

export default function ElectricityConsumption({ range = "24h" }) {
    const labels =
        range === "24h"
            ? ["00", "04", "08", "12", "16", "20"]
            : range === "7d"
                ? ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
                : ["Week 1", "Week 2", "Week 3", "Week 4"];

    const datasetData =
        range === "24h"
            ? [1.0, 1.2, 1.1, 1.3, 1.25, 1.4]
            : range === "7d"
                ? [6.2, 6.8, 7.1, 6.9, 7.4, 7.9, 8.1]
                : [28, 31, 29, 33];

    const data = {
        labels: labels,
        datasets: [
            {
                label: "Electricity Consumption (kWh)",
                data: datasetData,
                borderColor: "#facc15",
                backgroundColor: "rgba(250, 204, 21, 0.25)",
                tension: 0.4,
                fill: true,
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
        },
        scales: {
            x: { grid: { display: false } },
            y: { grid: { color: "rgba(255,255,255,0.05)" } },
        },
    };

    return (
        <div className="h-48">
            <Line data={data} options={options} />
        </div>
    );
}
