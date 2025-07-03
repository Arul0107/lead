import React from 'react';
import { Card, Typography } from 'antd';
// Removed: import { Line } from '@ant-design/plots'; // No longer using Ant Design Plots

// Import Chart.js and react-chartjs-2 components
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title as ChartJsTitle, // Renamed to avoid conflict with Ant Design Typography.Title
  Tooltip,
  Legend,
  TimeScale, // Import TimeScale for time-series data
  Filler // Import the Filler plugin
} from 'chart.js';
import { Line } from 'react-chartjs-2'; // Import the Line component from react-chartjs-2
import 'chartjs-adapter-dayjs-3'; // Import the Day.js adapter for Chart.js time scale

import './DashboardMetricCard.css'; // Import the refined CSS

const { Title, Text } = Typography;

// Register Chart.js components including the Filler plugin
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ChartJsTitle,
  Tooltip,
  Legend,
  TimeScale,
  Filler // Register the Filler plugin
);

const DashboardMetricCard = ({
  title,
  value,
  trendData, // Data for the small trend graph (percentageChange will be derived from this)
  valuePrefix = '₹', // Default to Rupee symbol
  trendLabel = 'Receivable', // Default label for the trend (e.g., "Receivable", "Collected", "Outstanding")
  cardColor = 'linear-gradient(135deg,rgb(56, 48, 65),rgb(0, 0, 0))', // Default purple gradient
  chartFill = true, // New prop to control the fill behavior (default to true, which is 'origin' for single dataset)
}) => {
  // Static trend data for demonstration if no 'trendData' prop is provided.
  // For time series in Chart.js, 'x' should be parsable dates/timestamps.
  const defaultTrendData = [
    { x: '2024-01-01', y: 10 },
    { x: '2024-01-02', y: 15 },
    { x: '2024-01-03', y: 12 },
    { x: '2024-01-04', y: 18 },
    { x: '2024-01-05', y: 14 },
    { x: '2024-01-06', y: 20 },
    { x: '2024-01-07', y: 17 },
  ];

  // Ensure dataForTrend is always an array of objects
  const dataForTrend = trendData && Array.isArray(trendData) && trendData.length > 0
    ? trendData
    : defaultTrendData;

  // Calculate percentage change based on the trendData
  let calculatedPercentageChange = 0;
  if (dataForTrend.length > 1) {
    const firstValue = dataForTrend[0].y;
    const lastValue = dataForTrend[dataForTrend.length - 1].y;

    if (firstValue !== 0) { // Avoid division by zero
      calculatedPercentageChange = ((lastValue - firstValue) / firstValue) * 100;
    }
  }

  // Round the percentage change to a whole number (e.g., "+12%")
  const formattedPercentageChange = calculatedPercentageChange.toFixed(0);

  // Determine if the change is positive, negative, or zero for clearer text
  let trendDescription = '';
  if (calculatedPercentageChange > 0) {
    trendDescription = 'Increasing Trend';
  } else if (calculatedPercentageChange < 0) {
    trendDescription = 'Decreasing Trend';
  } else {
    trendDescription = 'No Change';
  }
  
  const isPositiveChange = calculatedPercentageChange >= 0; // Used for color styling

  // --- Dynamic Chart Boundaries ---
  let minY = 0; // Default min value for y-axis
  let maxY = 100; // Default max value for y-axis to prevent empty chart issues

  if (dataForTrend.length > 0) {
    const yValues = dataForTrend.map(d => d.y);
    const dataMin = Math.min(...yValues);
    const dataMax = Math.max(...yValues);

    minY = Math.max(0, dataMin - (dataMax - dataMin) * 0.1); // Keep min at least 0, add 10% padding below if data > 0
    maxY = dataMax + (dataMax - dataMin) * 0.2; // Add 20% padding above for visual clarity

    // Handle cases where data is flat or single point to avoid NaN or zero range
    if (dataMax === dataMin) {
        if (dataMax === 0) { // All zeros
            minY = 0;
            maxY = 10; // A small positive range
        } else {
            minY = Math.max(0, dataMax * 0.8); // 20% below the value
            maxY = dataMax * 1.2; // 20% above the value
        }
    }
  }


  // Chart.js Data configuration
  const chartData = {
    datasets: [
      {
        data: dataForTrend, // Chart.js can directly take { x: date, y: value } objects with 'time' scale
        borderColor: 'rgba(255, 255, 255, 0.8)', // White-ish line
        borderWidth: 2,
        fill: chartFill, // Use the new prop to control fill behavior
        backgroundColor: 'rgba(255, 255, 255, 0.1)', // Subtle transparent fill
        tension: 0.4, // Makes the line smooth (similar to 'smooth' in G2Plot)
        pointRadius: 0, // No points on the line
        pointHoverRadius: 0, // No points on hover
      },
    ],
  };

  // Chart.js Options configuration for a sparkline
  const chartOptions = {
    responsive: true, // Chart resizes with container
    maintainAspectRatio: false, // Allows setting custom height
    plugins: {
      legend: {
        display: false, // Hide legend
      },
      tooltip: {
        enabled: false, // Disable tooltips on hover
      },
      title: {
        display: false, // Hide chart title
      },
      filler: { // Add the filler plugin configuration
        propagate: false, // Prevents filler from propagating across multiple datasets (good for single sparklines)
      }
    },
    scales: {
      x: {
        type: 'time', // Use time scale for chronological data
        time: {
          unit: 'day', // Default unit for the time scale
          tooltipFormat: 'MMM DD,YYYY', // Format for tooltip if enabled
        },
        display: false, // Hide x-axis
        grid: {
          display: false, // Hide grid lines
        },
        ticks: {
          display: false, // Hide ticks
        },
      },
      y: {
        display: false, // Hide y-axis
        beginAtZero: true, // Ensure y-axis starts from 0 if data allows
        min: minY, // Dynamically set min based on data
        max: maxY, // Dynamically set max based on data
        grid: {
          display: false, // Hide grid lines
        },
        ticks: {
          display: false, // Hide ticks
        },
      },
    },
    elements: {
      line: {
        tension: 0.4, // Smoothness of the line
      },
      point: {
        radius: 0, // Hide points
      },
    },
  };

  return (
    <Card
      className="dashboard-metric-card"
      style={{ background: cardColor }} // Apply the dynamic gradient color
      bordered={false} // Remove Ant Design's default border for a cleaner look
    >
      <div className="card-header">
        {/* Main title of the metric card (e.g., "Total Invoice Amount") */}
        <Title level={4} className="card-title">
          {title}
        </Title>
        {/* The percentage change and label are now always derived from trendData */}
        <div className="card-percentage">
          
          <Text className="trend-description">
            {trendDescription}
          </Text>
        </div>
      </div>

      <div className="card-body">
        <div className="current-value">
          {/* Label for the current value */}
          <Text className="value-label">Current Value</Text>
          {/* The main large numerical value */}
          <Title level={2} className="value-text">
            {valuePrefix}{value}
          </Title>
        </div>
        {/* Container for the trend graph */}
        <div className="trend-graph-container">
          {/* Render the Chart.js Line chart */}
          <Line options={chartOptions} data={chartData} />
        </div>
      </div>
    </Card>
  );
};

export default DashboardMetricCard;
