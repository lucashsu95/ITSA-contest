$(document).ready(() => {
    let remain = null;
    let timer = null;

    function startTimer() {
        const input = $('.date-input').val();
        if (!input) return alert('請選擇日期及時間');

        const target = new Date(input).getTime();
        const now = new Date().getTime();
        if (target < now) return alert('目標時間已過');

        remain = target - now;
        setBtn('stop');
        setTimer();
    }

    function setTimer() {
        renderTimeDiv();
        timer = setInterval(renderTimeDiv, 1000);
    }

    function renderTimeDiv() {
        remain -= 1000;
        if (remain <= 0) {
            clearInterval(timer);
            alert('時間到');
            resetTimer();
            return;
        }
        const hours = Math.floor(remain / 3600000);
        const minutes = Math.floor((remain % 3600000) / 60000);
        const seconds = Math.floor((remain % 60000) / 1000);
        $('.time').text(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    }

    function stopTimer() {
        clearInterval(timer);
        setBtn('continue');
    }

    function continueTimer() {
        setBtn('stop');
        setTimer();
    }

    function resetTimer() {
        clearInterval(timer);
        $('.time').text('00:00:00');
        $('.date-input').val('');
        remain = null;
        setBtn('start');
    }

    function setBtn(type) {
        const types = {
            'start': { name: '開始', func: startTimer },
            'stop': { name: '暫停', func: stopTimer },
            'continue': { name: '繼續', func: continueTimer }
        };
        const { name, func } = types[type];
        $('.primary').off('click').text(name).click(func);
    }

    setBtn('start');
    $('.reset').click(resetTimer);
});