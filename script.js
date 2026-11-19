let currentLang = 'ar';
let chartInstance = null;
let lastCalculationData = null;

const translations = {
    ar: {
        title: "حاسبة نيوتن-رافسون الذكية",
        langBtn: "English",
        settingsTitle: "إعدادات المسألة",
        lblFx: "دالة المعادلة f(x):",
        phFx: "مثال: x^3 - 8*x + 5",
        lblDfx: "المشتقة f'(x) (اختياري):",
        phDfx: "تلقائي",
        lblX0: "التخمين الأولي (x₀):",
        phX0: "مثال: 0",
        btnCalc: "احسب وحلل النتائج",
        lblRootFound: "الجذر التقريبي المحسوب:",
        lblChartTitle: "الرسم البياني والمماسات الهندسية",
        lblTableTitle: "جدول خطوات التكرار",
        btnPdfText: "تصدير تقرير PDF احترافي",
        thIter: "i",
        thXi: "xᵢ",
        thFXi: "f(xᵢ)",
        thDFXi: "f'(xᵢ)",
        thErr: "|خطأ التقارب|"
    },
    en: {
        title: "Smart Newton-Raphson Solver",
        langBtn: "عربي",
        settingsTitle: "Problem Settings",
        lblFx: "Function f(x):",
        phFx: "e.g. x^3 - 8*x + 5",
        lblDfx: "Derivative f'(x) (optional):",
        phDfx: "Automatic",
        lblX0: "Initial Guess (x₀):",
        phX0: "e.g. 0",
        btnCalc: "Calculate & Analyze",
        lblRootFound: "Calculated Root:",
        lblChartTitle: "Graph & Tangent Lines",
        lblTableTitle: "Iterations Table",
        btnPdfText: "Export Professional PDF Report",
        thIter: "i",
        thXi: "xᵢ",
        thFXi: "f(xᵢ)",
        thDFXi: "f'(xᵢ)",
        thErr: "|Error|"
    }
};

function toggleLanguage() {
    currentLang = currentLang === 'ar' ? 'en' : 'ar';
    document.documentElement.setAttribute('dir', currentLang === 'ar' ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('lang', currentLang);
    
    const t = translations[currentLang];
    document.getElementById('app-title').innerText = t.title;
    document.getElementById('lang-btn-text').innerText = t.langBtn;
    document.getElementById('settings-title').innerHTML = `<i class="fa-solid fa-sliders"></i> ${t.settingsTitle}`;
    document.getElementById('lbl-fx').innerText = t.lblFx;
    document.getElementById('fx-input').placeholder = t.phFx;
    document.getElementById('lbl-dfx').innerText = t.lblDfx;
    document.getElementById('dfx-input').placeholder = t.phDfx;
    document.getElementById('lbl-x0').innerText = t.lblX0;
    document.getElementById('x0-input').placeholder = t.phX0;
    document.getElementById('btn-calc').innerHTML = `<i class="fa-solid fa-play"></i> ${t.btnCalc}`;
    document.getElementById('lbl-root-found').innerText = t.lblRootFound;
    document.getElementById('lbl-chart-title').innerHTML = `<i class="fa-solid fa-chart-line"></i> ${t.lblChartTitle}`;
    document.getElementById('lbl-table-title').innerHTML = `<i class="fa-solid fa-table-list"></i> ${t.lblTableTitle}`;
    document.getElementById('btn-pdf-text').innerText = t.btnPdfText;
    
    if (document.getElementById('fx-input').value.trim() !== '') {
        calculateRoot();
    }
}

function toggleTheme() {
    const html = document.documentElement;
    const icon = document.getElementById('theme-icon');
    if (html.classList.contains('dark')) {
        html.classList.remove('dark');
        icon.className = "fa-solid fa-moon text-pink-500";
    } else {
        html.classList.add('dark');
        icon.className = "fa-solid fa-sun text-pink-400";
    }
    if (chartInstance && document.getElementById('fx-input').value.trim() !== '') {
        calculateRoot();
    }
}

function calculateRoot() {
    const fxStr = document.getElementById('fx-input').value.trim();
    const dfxStrInput = document.getElementById('dfx-input').value.trim();
    const x0Str = document.getElementById('x0-input').value.trim();

    if (fxStr === '' || x0Str === '') return;

    let x0 = parseFloat(x0Str);
    const maxSafetyIter = 100;

    try {
        const f = math.compile(fxStr);
        let df;
        if (dfxStrInput !== '') {
            df = math.compile(dfxStrInput);
        } else {
            const node = math.parse(fxStr);
            const derivNode = math.derivative(node, 'x');
            df = derivNode.compile();
        }

        const node = math.parse(fxStr);
        const d1 = math.derivative(node, 'x');
        const d2 = math.derivative(d1, 'x');
        const fVal = f.evaluate({ x: x0 });
        const dfVal = df.evaluate({ x: x0 });
        const ddfVal = d2.evaluate({ x: x0 });
        const convergenceVal = Math.abs((fVal * ddfVal) / (dfVal * dfVal));

        const convBox = document.getElementById('convergence-box');
        let convergenceMsg = "";
        if (convergenceVal < 1) {
            convergenceMsg = `شرط التقارب محقق (${convergenceVal.toFixed(4)} < 1)`;
            convBox.innerHTML = `<span class="text-pink-500 dark:text-pink-400 font-semibold"><i class="fa-solid fa-circle-check"></i> ${convergenceMsg}</span>`;
        } else {
            convergenceMsg = `تحذير: شرط التقارب غير مضمون (${convergenceVal.toFixed(4)} >= 1)`;
            convBox.innerHTML = `<span class="text-purple-500 dark:text-purple-400 font-semibold"><i class="fa-solid fa-triangle-exclamation"></i> ${convergenceMsg}</span>`;
        }

        let iterations = [];
        let xi = x0;
        let tangentLinesData = [];

        for (let i = 0; i < maxSafetyIter; i++) {
            const fxi = f.evaluate({ x: xi });
            const dfxi = df.evaluate({ x: xi });

            if (dfxi === 0) {
                alert("المشتقة تساوي صِفراً، لا يمكن إكمال الحل.");
                break;
            }

            const xNext = xi - (fxi / dfxi);
            const error = Math.abs(xNext - xi);

            iterations.push({
                i: i,
                xi: xi,
                fxi: fxi,
                dfxi: dfxi,
                error: error
            });

            tangentLinesData.push([
                { x: xi, y: fxi },
                { x: xNext, y: 0 }
            ]);

            // لو آخر ناتجين متساويين عند 5 أرقام عشرية، نضيف الصف التأكيدي الأخير ثم نوقف
            if (xi.toFixed(5) === xNext.toFixed(5)) {
                const fNext = f.evaluate({ x: xNext });
                const dfNext = df.evaluate({ x: xNext });
                iterations.push({
                    i: i + 1,
                    xi: xNext,
                    fxi: fNext,
                    dfxi: dfNext,
                    error: Math.abs(xNext - xi)
                });
                xi = xNext;
                break;
            }

            xi = xNext;
        }

        const t = translations[currentLang];
        document.getElementById('table-header').innerHTML = `
            <th class="py-3 px-4">${t.thIter}</th>
            <th class="py-3 px-4">${t.thXi}</th>
            <th class="py-3 px-4">${t.thFXi}</th>
            <th class="py-3 px-4">${t.thDFXi}</th>
            <th class="py-3 px-4">${t.thErr}</th>
        `;

        const tbody = document.getElementById('table-body');
        tbody.innerHTML = '';
        iterations.forEach(row => {
            tbody.innerHTML += `
                <tr class="hover:bg-pink-50/50 dark:hover:bg-purple-950/20 transition">
                    <td class="py-3 px-4 font-semibold text-purple-600 dark:text-purple-400">${row.i}</td>
                    <td class="py-3 px-4">${row.xi.toFixed(6)}</td>
                    <td class="py-3 px-4">${row.fxi.toFixed(6)}</td>
                    <td class="py-3 px-4">${row.dfxi.toFixed(6)}</td>
                    <td class="py-3 px-4">${row.error.toFixed(6)}</td>
                </tr>
            `;
        });

        document.getElementById('result-summary').classList.remove('hidden');
        document.getElementById('root-output').innerText = xi.toFixed(5);

        plotGraph(f, x0, xi, tangentLinesData);

        lastCalculationData = {
            method: 'Newton-Raphson Method',
            fx: fxStr,
            x0: x0,
            root: xi.toFixed(5),
            convergence: convergenceMsg,
            iterations: iterations
        };

    } catch (err) {
        console.error(err);
        alert("تأكدي من كتابة المعادلة بصيغة رياضية صحيحة (مثل: x^3 - 8*x + 5)");
    }
}

function plotGraph(f, xStart, xFinal, tangentLines = []) {
    const ctx = document.getElementById('functionChart').getContext('2d');
    
    let minX = Math.min(xStart, xFinal) - 2;
    let maxX = Math.max(xStart, xFinal) + 2;
    let step = (maxX - minX) / 100;
    
    let funcPoints = [];
    for (let x = minX; x <= maxX; x += step) {
        try {
            let y = f.evaluate({ x: x });
            funcPoints.push({ x: x, y: y });
        } catch(e){}
    }

    if (chartInstance) {
        chartInstance.destroy();
    }

    const isDark = document.documentElement.classList.contains('dark');
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)';
    const textColor = isDark ? '#9ca3af' : '#6b7280';

    let datasets = [
        {
            label: 'f(x)',
            data: funcPoints,
            showLine: true,
            borderColor: '#d946ef',
            backgroundColor: 'transparent',
            borderWidth: 3,
            pointRadius: 0
        },
        {
            label: 'Root / الجذر',
            data: [{ x: xFinal, y: 0 }],
            backgroundColor: '#ec4899',
            borderColor: '#ffffff',
            pointRadius: 6,
            pointHoverRadius: 8
        }
    ];

    tangentLines.forEach((line, index) => {
        datasets.push({
            label: index === 0 ? 'Tangent Lines / المماسات' : '',
            data: line,
            showLine: true,
            borderColor: 'rgba(244, 114, 182, 0.7)',
            borderDash: [4, 4],
            borderWidth: 2,
            pointRadius: 3,
            pointBackgroundColor: '#f472b6'
        });
    });

    chartInstance = new Chart(ctx, {
        type: 'scatter',
        data: { datasets: datasets },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    type: 'linear',
                    position: 'bottom',
                    grid: { color: gridColor },
                    ticks: { color: textColor }
                },
                y: {
                    grid: { color: gridColor },
                    ticks: { color: textColor }
                }
            },
            plugins: {
                legend: {
                    labels: { color: textColor }
                }
            }
        }
    });
}

function exportToPDF() {
    if (!lastCalculationData) {
        alert("الرجاء إدخال المعادلة وحسابها أولاً قبل تصدير التقرير.");
        return;
    }

    let reportWindow = window.open('', '_blank');
    let chartImage = document.getElementById('functionChart').toDataURL('image/png');

    let htmlContent = `
        <!DOCTYPE html>
        <html lang="ar" dir="rtl">
        <head>
            <meta charset="UTF-8">
            <title>تقرير التحليل العددي - Numerical Analysis Report</title>
            <style>
                body { font-family: 'Cairo', sans-serif; padding: 30px; color: #333; background: #fff; }
                .header { text-align: center; border-bottom: 3px solid #d946ef; padding-bottom: 15px; margin-bottom: 25px; }
                .header h1 { color: #86198f; margin: 0; font-size: 24px; }
                .header p { color: #666; font-size: 14px; margin: 5px 0 0; }
                .section-box { background: #fdf4f8; border: 1px solid #fbcfe8; border-radius: 10px; padding: 15px; margin-bottom: 20px; }
                .section-box h3 { margin-top: 0; color: #9333ea; font-size: 16px; border-bottom: 1px solid #f3e8ff; padding-bottom: 5px; }
                .grid { display: flex; justify-content: space-between; gap: 15px; }
                .grid div { flex: 1; }
                table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 13px; }
                th, td { border: 1px solid #e5e7eb; padding: 10px; text-align: center; }
                th { background-color: #fae8ff; color: #701a75; }
                .chart-container { text-align: center; margin: 20px 0; }
                .chart-container img { max-width: 80%; height: 220px; border-radius: 8px; border: 1px solid #e5e7eb; }
                .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #9ca3af; border-top: 1px solid #eee; padding-top: 10px; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>تقرير التحليل العددي (طريقة نيوتن-رافسون)</h1>
                <p>حل المعادلات غير الخطية والتمثيل البياني</p>
            </div>

            <div class="grid">
                <div class="section-box">
                    <h3>معلومات المسألة</h3>
                    <p><b>الدالة f(x):</b> ${lastCalculationData.fx}</p>
                    <p><b>التخمين الأولي (x₀):</b> ${lastCalculationData.x0}</p>
                </div>
                <div class="section-box">
                    <h3>النتائج النهائية</h3>
                    <p><b>الجذر التقريبي المحسوب:</b> <span style="color: #db2777; font-size: 18px; font-weight: bold;">${lastCalculationData.root}</span></p>
                    <p><b>حالة التقارب:</b> ${lastCalculationData.convergence}</p>
                </div>
            </div>

            <div class="chart-container">
                <h3>الرسم البياني للدالة والمماسات الهندسية</h3>
                <img src="${chartImage}" alt="Function Chart">
            </div>

            <div class="section-box">
                <h3>جدول الخطوات والتكرارات التفصيلي</h3>
                <table>
                    <thead>
                        <tr>
                            <th>i</th>
                            <th>xᵢ</th>
                            <th>f(xᵢ)</th>
                            <th>f'(xᵢ)</th>
                            <th>|خطأ التقارب|</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${lastCalculationData.iterations.map(row => `
                            <tr>
                                <td><b>${row.i}</b></td>
                                <td>${row.xi.toFixed(6)}</td>
                                <td>${row.fxi.toFixed(6)}</td>
                                <td>${row.dfxi.toFixed(6)}</td>
                                <td>${row.error.toFixed(6)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>

            <div class="footer">
                تم استخراج هذا التقرير آلياً عبر حاسبة نيوتن-رافسون الذكية ✨
            </div>

            <script>
                window.onload = function() {
                    window.print();
                }
            </script>
        </body>
        </html>
    `;

    reportWindow.document.write(htmlContent);
    reportWindow.document.close();
}