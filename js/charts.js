let paymentChart = null;

function updatePaymentChart(principal, term, rate, type, payments) {
    // 检查是否已存在旧图表
    if (paymentChart) {
        paymentChart.destroy();
    }
    
    // 创建新的 canvas 元素
    $('#paymentChart').html('<canvas></canvas>');
    const canvas = $('#paymentChart canvas')[0];
    const ctx = canvas.getContext('2d');
    
    const labels = Array.from({length: term}, (_, i) => `第${i + 1}月`);
    
    paymentChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: '月供金额',
                data: payments,
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: '金额（元）'
                    }
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: '还款计划图表'
                }
            }
        }
    });
} 