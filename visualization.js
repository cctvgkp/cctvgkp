let globalDepartmentScores = {};
let globalClassTotalScores = {};
let departmentChartInstance;
let classChartInstance;
let classDetails = {};

// 填充 classDetails 数据结构，键是班级名称，值是包含每个部门扣分详情的数组
// 示例：classDetails['微机233'] = [{ department: '生活部', score: -15 }, ...];


document.getElementById('convertBtn').addEventListener('click', convertAndDisplayCharts);
document.getElementById('colorPicker').addEventListener('change', updateChartColors);
document.getElementById('sortAscBtnDepartment').addEventListener('click', () => sortChartData('department', true));
document.getElementById('sortDescBtnDepartment').addEventListener('click', () => sortChartData('department', false));
document.getElementById('sortAscBtnClass').addEventListener('click', () => sortChartData('class', true));
document.getElementById('sortDescBtnClass').addEventListener('click', () => sortChartData('class', false));

function convertAndDisplayCharts() {
    const input = document.getElementById('upload');
    const file = input.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            const data = e.target.result;
            const workbook = XLSX.read(data, { type: 'binary' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const json = XLSX.utils.sheet_to_json(worksheet, { raw: true });
            prepareAndDisplayCharts(json);
        };
        reader.readAsBinaryString(file);
    }
}

function prepareAndDisplayCharts(data) {
    let departmentScores = {};
    let classTotalScores = {};

    data.forEach(row => {
        const { 部门, 班级, 扣分分值 } = row;
        if (扣分分值 !== '无' && 班级) {
            if (!departmentScores[部门]) { departmentScores[部门] = 0; }
            departmentScores[部门] -= 扣分分值;

            if (!classTotalScores[班级]) { classTotalScores[班级] = 0; }
            classTotalScores[班级] -= 扣分分值;
        }
    });

    globalDepartmentScores = departmentScores;
    globalClassTotalScores = classTotalScores;

    displayDepartmentChart(departmentScores);
    displayClassChart(classTotalScores);
}

function displayDepartmentChart(departmentScores) {
    let chartDom = document.getElementById('departmentChart');
    departmentChartInstance = echarts.init(chartDom);

    let option = createChartOption(Object.keys(departmentScores), Object.values(departmentScores), '不同部门扣分汇总');
    departmentChartInstance.setOption(option);
}

function displayClassChart(classTotalScores) {
    let chartDom = document.getElementById('classChart');
    classChartInstance = echarts.init(chartDom);

    let option = {
        title: { text: '班级总扣分' },
        tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'shadow' },
            formatter: function (params) {
                let detail = classDetails[params[0].name];
                let tooltipContent = `${params[0].name}<br/>`;
                detail.forEach(item => {
                    tooltipContent += `${item.department}: ${-item.score}<br/>`;
                });
                return tooltipContent;
            }
        },
        xAxis: {
            type: 'category',
            data: Object.keys(classTotalScores),
            axisLabel: { interval: 0, rotate: 45 }
        },
        yAxis: { type: 'value' },
        series: [{
            data: Object.keys(classTotalScores).map(key => ({
                value: classTotalScores[key],
                itemStyle: { color: document.getElementById('colorPicker').value }
            })),
            type: 'bar',
            showBackground: true,
            backgroundStyle: { color: 'rgba(180, 180, 180, 0.2)' },
            label: { show: true, position: 'top' }
        }]
    };

    classChartInstance.setOption(option);
}


function createChartOption(xData, yData, titleText) {
    return {
        title: { text: titleText },
        tooltip: {},
        xAxis: { type: 'category', data: xData, axisLabel: { interval: 0, rotate: 45 } },
        yAxis: { type: 'value' },
        series: [{
            data: yData.map(value => ({ value, itemStyle: { color: document.getElementById('colorPicker').value } })),
            type: 'bar',
            showBackground: true,
            backgroundStyle: { color: 'rgba(180, 180, 180, 0.2)' },
            label: { show: true, position: 'top' }
        }]
    };
}

function updateChartColors() {
    displayDepartmentChart(globalDepartmentScores);
    displayClassChart(globalClassTotalScores);
}

function sortChartData(chartType, ascending) {
    let scores = chartType === 'department' ? { ...globalDepartmentScores } : { ...globalClassTotalScores };
    let sortedKeys = Object.keys(scores).sort((a, b) => ascending ? scores[a] - scores[b] : scores[b] - scores[a]);
    let sortedValues = sortedKeys.map(key => scores[key]);

    if (chartType === 'department') {
        displayDepartmentChart(Object.fromEntries(sortedKeys.map((key, i) => [key, sortedValues[i]])));
    } else {
        displayClassChart(Object.fromEntries(sortedKeys.map((key, i) => [key, sortedValues[i]])));
    }
}
