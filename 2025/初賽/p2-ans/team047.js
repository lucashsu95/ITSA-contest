let barChart, lineChart;
let allWeeklyData = {};

async function loadCSVData() {
  try {
    const response = await fetch("team047.php");
    const weeklyData = await response.json();

    allWeeklyData = weeklyData;
    return weeklyData;
  } catch (error) {
    console.error("載入數據失敗:", error);
    return null;
  }
}

function getChartData(selectedWeeks = null) {
  const weeksToShow = selectedWeeks || Object.keys(allWeeklyData).sort();

  const weeklyTop10Data = {};

  weeksToShow.forEach((week) => {
    if (allWeeklyData[week]) {
      // 取每週的前10名關鍵字
      weeklyTop10Data[week] = allWeeklyData[week].slice(0, 10);
    }
  });

  const allKeywordsSet = new Set();
  Object.values(weeklyTop10Data).forEach((weekData) => {
    weekData.forEach((item) => {
      allKeywordsSet.add(item.keyword);
    });
  });

  const allUniqueKeywords = Array.from(allKeywordsSet);

  return { weeksToShow, weeklyTop10Data, allUniqueKeywords };
}

function createBarChart(selectedWeeks = null, highlightWeek = null) {
  const ctx = document.getElementById("barChart").getContext("2d");

  if (barChart) {
    barChart.destroy();
  }

  const { weeksToShow, weeklyTop10Data, allUniqueKeywords } =
    getChartData(selectedWeeks);

  // 建立長條圖資料
  const datasets = allUniqueKeywords.map((keyword, index) => ({
    label: keyword,
    data: weeksToShow.map((week) => {
      const weekData = weeklyTop10Data[week];
      if (weekData) {
        const found = weekData.find((item) => item.keyword === keyword);
        return found ? found.count : 0;
      }
      return 0;
    }),
    backgroundColor: `hsl(${(index * 137) % 360}, 70%, 50%)`, // 不同顏色
    borderWidth: 1,
  }));

  let chartTitle = "每週TOP10關鍵字統計 - 長條圖";
  if (highlightWeek) {
    chartTitle = `每週TOP10關鍵字統計 - 長條圖 (重點：${highlightWeek})`;
  }

  barChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: weeksToShow,
      datasets: datasets,
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: chartTitle,
          font: {
            size: 16,
          },
        },
        legend: {
          display: true,
          position: "top",
          labels: {
            boxWidth: 12,
            padding: 8,
          },
        },
        tooltip: {
          mode: "index",
          intersect: false,
          backgroundColor: "rgba(0,0,0,0.8)",
          titleColor: "white",
          bodyColor: "white",
          borderColor: "rgba(255,255,255,0.3)",
          borderWidth: 1,
        },
      },
      scales: {
        x: {
          title: {
            display: true,
            text: "週期",
            font: {
              size: 14,
            },
          },
          ticks: {
            maxRotation: 45,
            minRotation: 0,
          },
        },
        y: {
          title: {
            display: true,
            text: "出現次數",
            font: {
              size: 14,
            },
          },
          beginAtZero: true,
          ticks: {
            precision: 0,
          },
        },
      },
      interaction: {
        mode: "nearest",
        axis: "x",
        intersect: false,
      },
    },
  });
}

function createLineChart(selectedWeeks = null, highlightWeek = null) {
  const ctx = document.getElementById("lineChart").getContext("2d");

  if (lineChart) {
    lineChart.destroy();
  }

  const { weeksToShow, weeklyTop10Data, allUniqueKeywords } =
    getChartData(selectedWeeks);

  // 建立折線圖資料
  const datasets = allUniqueKeywords.map((keyword, index) => {
    const data = weeksToShow.map((week) => {
      const weekData = weeklyTop10Data[week];
      if (weekData) {
        const found = weekData.find((item) => item.keyword === keyword);
        return found ? found.count : 0;
      }
      return 0;
    });

    // 特別週期的點會較大
    const pointRadii = weeksToShow.map((week) =>
      week === highlightWeek ? 8 : 4
    );
    const pointHoverRadii = weeksToShow.map((week) =>
      week === highlightWeek ? 10 : 6
    );

    return {
      label: keyword,
      data: data,
      borderColor: `hsl(${(index * 137) % 360}, 70%, 50%)`, // 與長條圖同色
      backgroundColor: `hsla(${(index * 137) % 360}, 70%, 50%, 0.1)`,
      fill: false,
      tension: 0.1,
      pointRadius: pointRadii,
      pointHoverRadius: pointHoverRadii,
      pointBorderWidth: weeksToShow.map((week) =>
        week === highlightWeek ? 3 : 1
      ),
    };
  });

  let chartTitle = "每週TOP10關鍵字統計 - 折線圖";
  if (highlightWeek) {
    chartTitle = `每週TOP10關鍵字統計 - 折線圖 (重點：${highlightWeek})`;
  }

  lineChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: weeksToShow,
      datasets: datasets,
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: chartTitle,
          font: {
            size: 16,
          },
        },
        legend: {
          display: true,
          position: "top",
          labels: {
            boxWidth: 12,
            padding: 8,
          },
        },
        tooltip: {
          mode: "index",
          intersect: false,
          backgroundColor: "rgba(0,0,0,0.8)",
          titleColor: "white",
          bodyColor: "white",
          borderColor: "rgba(255,255,255,0.3)",
          borderWidth: 1,
        },
      },
      scales: {
        x: {
          title: {
            display: true,
            text: "週期",
            font: {
              size: 14,
            },
          },
          ticks: {
            maxRotation: 45,
            minRotation: 0,
          },
        },
        y: {
          title: {
            display: true,
            text: "出現次數",
            font: {
              size: 14,
            },
          },
          beginAtZero: true,
          ticks: {
            precision: 0,
          },
        },
      },
      interaction: {
        mode: "nearest",
        axis: "x",
        intersect: false,
      },
    },
  });
}

async function init() {
  const phpData = await loadCSVData();

  if (phpData) {
    const weekSelect = document.getElementById("weekSelect");
    weekSelect.innerHTML = '<option value="">選擇週期範圍</option>';

    const weeks = Object.keys(allWeeklyData).sort();
    weeks.forEach((week) => {
      const option = document.createElement("option");
      option.value = week;
      option.textContent = week;
      weekSelect.appendChild(option);
    });

    const allOption = document.createElement("option");
    allOption.value = "all";
    allOption.textContent = "顯示全部週期";
    weekSelect.appendChild(allOption);

    createBarChart();
    createLineChart();

    weekSelect.addEventListener("change", function () {
      const selectedValue = this.value;
      if (selectedValue === "all" || selectedValue === "") {
        createBarChart();
        createLineChart();
      } else {
        const weeks = Object.keys(allWeeklyData).sort();
        const selectedIndex = weeks.indexOf(selectedValue);

        const startIndex = Math.max(0, selectedIndex - 2);
        const endIndex = Math.min(weeks.length - 1, selectedIndex + 2);
        const trendWeeks = weeks.slice(startIndex, endIndex + 1);

        if (trendWeeks.length === 1) {
          createBarChart(null, selectedValue);
          createLineChart(null, selectedValue);
        } else {
          createBarChart(trendWeeks, selectedValue);
          createLineChart(trendWeeks, selectedValue);
        }
      }
    });
  } else {
    console.error("無法載入數據");
  }
}

document.getElementById("downloadBtn").addEventListener("click", function () {
  if (!barChart || !lineChart) {
    alert("圖表尚未載入完成，請稍後再試");
    return;
  }

  // 取得當前圖表的資料
  const barChartData = barChart.data;
  const currentWeeks = barChartData.labels;
  const currentDatasets = barChartData.datasets;
  let csvContent = "Week,Keyword,Count,Chart_Display_Order\n";

  currentWeeks.forEach((week, weekIndex) => {
    const weekKeywords = [];

    currentDatasets.forEach((dataset, datasetIndex) => {
      const keywordName = dataset.label;
      const keywordCount = dataset.data[weekIndex];

      if (keywordCount > 0) {
        weekKeywords.push({
          keyword: keywordName,
          count: keywordCount,
          chartOrder: datasetIndex + 1,
        });
      }
    });

    weekKeywords.sort((a, b) => b.count - a.count);

    weekKeywords.forEach((keywordData, rank) => {
      csvContent += `${week},${keywordData.keyword},${keywordData.count},${keywordData.chartOrder}\n`;
    });
  });

  const blob = new Blob(["\uFEFF" + csvContent], {
    type: "text/csv;charset=utf-8;",
  });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;

  a.download = "weekly_report.csv";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
});

init();
