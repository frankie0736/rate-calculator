$(document).ready(function() {
    // 监听还款方式切换
    $('#paymentType').on('change', function() {
        const isDecreasing = $(this).val() === 'decreasing';
        $('#fixedPaymentInput').toggleClass('d-none', isDecreasing);
        $('#decreasingPaymentInput').toggleClass('d-none', !isDecreasing);
        
        // 切换时清空另一个输入框的值
        if (isDecreasing) {
            $('#monthlyPayment').val('');
        } else {
            $('#monthlyPayments').val('');
        }
    });

    // 监听借款期限变化
    $('#loanTerm').on('change', function() {
        validatePayments();
    });

    // 监听递减还款输入框变化
    $('#monthlyPayments').on('input', function() {
        validatePayments();
    });

    $('#loanForm').on('submit', function(e) {
        e.preventDefault();
        
        const loanAmountInWan = parseFloat($('#loanAmount').val());
        // 转换为元
        const loanAmount = loanAmountInWan * 10000;
        const loanTerm = parseInt($('#loanTerm').val());
        const paymentType = $('#paymentType').val();
        
        // 验证输入值
        if (isNaN(loanAmountInWan) || loanAmountInWan <= 0) {
            alert('请输入有效的借款金额（万元）');
            return;
        }
        
        if (isNaN(loanTerm) || loanTerm <= 0) {
            alert('请输入有效的借款期限');
            return;
        }
        
        let payments;
        if (paymentType === 'fixed') {
            const monthlyPayment = parseFloat($('#monthlyPayment').val());
            if (isNaN(monthlyPayment) || monthlyPayment <= 0) {
                alert('请输入有效的月供金额');
                return;
            }
            payments = Array(loanTerm).fill(monthlyPayment);
        } else {
            payments = $('#monthlyPayments').val()
                .split('\n')
                .map(line => parseFloat(line.trim()))
                .filter(num => !isNaN(num));
                
            if (payments.length !== loanTerm) {
                alert('还款期数与借款期限不符！');
                return;
            }
            
            if (payments.some(payment => payment <= 0)) {
                alert('还款金额必须大于0');
                return;
            }
        }

        // 清除之前的计算步骤和结果
        $('.calculation-steps').remove();
        $('#resultCard').addClass('d-none');

        try {
            // 计算实际利率
            const rate = calculateActualRate(loanAmount, loanTerm, payments, paymentType);
            
            if (isNaN(rate) || rate < 0) {
                throw new Error('无法计算有效利率，请检查输入数据');
            }
            
            const annualRate = rate * 100;
            
            // 显示结果
            $('#actualRate').text(annualRate.toFixed(2));
            
            // 显示计算步骤
            const stepsHtml = showCalculationSteps(loanAmount, payments);
            $('#resultCard .card-body').append(stepsHtml);
            
            $('#resultCard').removeClass('d-none');
            
            // 更新图表
            updatePaymentChart(loanAmount, loanTerm, rate, paymentType, payments);
        } catch (error) {
            alert(error.message || '计算过程中出现错误，请检查输入数据是否正确。');
            console.error('计算错误:', error);
            $('#resultCard').addClass('d-none');
        }
    });
});

function validatePayments() {
    const loanTerm = parseInt($('#loanTerm').val()) || 0;
    const payments = $('#monthlyPayments').val()
        .split('\n')
        .map(line => line.trim())
        .filter(line => line !== '');
    
    const $textarea = $('#monthlyPayments');
    const $feedback = $('.invalid-feedback');
    
    if (payments.length === 0 || loanTerm === 0) {
        $textarea.removeClass('is-invalid');
        return;
    }
    
    if (payments.length !== loanTerm) {
        $textarea.addClass('is-invalid');
        $feedback.text(`当前输入了 ${payments.length} 期，需要输入 ${loanTerm} 期`);
    } else {
        $textarea.removeClass('is-invalid');
    }
}

function calculateActualRate(principal, term, payments, type) {
    // 使用二分法查找实际利率
    let left = 0;
    let right = 1; // 设置最大年化利率为100%
    const EPSILON = 0.0000001; // 精度
    const MAX_ITERATIONS = 1000; // 增加最大迭代次数
    
    for (let i = 0; i < MAX_ITERATIONS; i++) {
        const mid = (left + right) / 2;
        const monthlyRate = mid / 12;
        
        if (type === 'fixed') {
            // 使用NPV方法统一计算
            const npv = calculateNPV(principal, payments, monthlyRate);
            
            if (Math.abs(npv) < EPSILON) {
                return mid;
            }
            
            if (npv > 0) {
                left = mid;
            } else {
                right = mid;
            }
        } else {
            // 递减还款也使用相同的NPV方法
            const npv = calculateNPV(principal, payments, monthlyRate);
            
            if (Math.abs(npv) < EPSILON) {
                return mid;
            }
            
            if (npv > 0) {
                left = mid;
            } else {
                right = mid;
            }
        }
    }
    
    return (left + right) / 2;
}

function calculateNPV(principal, payments, monthlyRate) {
    let npv = -principal;
    
    for (let i = 0; i < payments.length; i++) {
        npv += payments[i] / Math.pow(1 + monthlyRate, i + 1);
    }
    
    return npv;
}

// 简化显示计算步骤的函数
function showCalculationSteps(principal, payments) {
    const totalPayment = payments.reduce((a, b) => a + b, 0);
    const totalInterest = totalPayment - principal;
    
    let html = '<div class="calculation-steps mt-3">';
    html += `<p class="mb-2">借款金额：${(principal/10000).toFixed(2)} 万元</p>`;
    html += `<p class="mb-2">总还款金额：${totalPayment.toFixed(2)} 元</p>`;
    html += `<p class="mb-2">支付利息：${totalInterest.toFixed(2)} 元</p>`;
    html += '</div>';
    return html;
} 