document.addEventListener('DOMContentLoaded', function() {
    const signInButton = document.getElementById('signInButton');
    const signOutButton = document.getElementById('signOutButton');
    const usernameInput = document.getElementById('username');
    const signInTimeElement = document.getElementById('signInTime');
    const signOutTimeElement = document.getElementById('signOutTime');
    const durationElement = document.getElementById('duration');
    const overtimeMessage = document.getElementById('overtimeMessage');

    const storageKey = 'attendanceRecords';
    let attendanceRecords = [];

    // 加载并解析存储的记录
    try {
        const storedRecords = JSON.parse(localStorage.getItem(storageKey)) || [];
        attendanceRecords = storedRecords.map(record => ({
            ...record,
            signInTime: record.signInTime ? new Date(record.signInTime) : null,
            signOutTime: record.signOutTime ? new Date(record.signOutTime) : null
        }));
    } catch (error) {
        console.error('Error parsing stored records:', error);
    }

    function formatTime(date) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    }

    function calculateTimeDifference(signInTime, signOutTime) {
        const diff = signOutTime - signInTime;
        const minutes = Math.floor(diff / (1000 * 60));

        let message = '';
        if (minutes > 80 && minutes <= 100) {
            message = '您已超时，请在系统补票5元！';
        } else if (minutes > 100 && minutes <= 120) {
            message = '您已超时，请在系统补票10元！';
        } else if (minutes > 120) {
            message = '您已超时，请在系统补票15元！';
        }

        return { minutes, message };
    }

    function saveRecords() {
        localStorage.setItem(storageKey, JSON.stringify(attendanceRecords));
    }

    function isSameDay(date1, date2) {
        return date1.getFullYear() === date2.getFullYear() &&
               date1.getMonth() === date2.getMonth() &&
               date1.getDate() === date2.getDate();
    }

    signInButton.addEventListener('click', function() {
        const username = usernameInput.value;
        if (!username) {
            alert('请输入手牌号');
            return;
        }

        // 检查今天是否已经签到
        const foundToday = attendanceRecords.find(record => 
            record.username === username && 
            record.signInTime && 
            isSameDay(record.signInTime, new Date()) &&
            !record.signOutTime
        );

        if (foundToday) {
            alert('您今天已经签到，请勿重复签到。');
            return;
        }

        const newRecord = {
            username: username,
            signInTime: new Date(),
            signOutTime: null
        };
        attendanceRecords.push(newRecord);
        saveRecords();
        signInTimeElement.textContent = formatTime(newRecord.signInTime);
        signOutTimeElement.textContent = '-';
        durationElement.textContent = '-';
        overtimeMessage.style.display = 'none';
        alert('签到成功！');
    });

    signOutButton.addEventListener('click', function() {
        const username = usernameInput.value;
        if (!username) {
            alert('请输入手牌号');
            return;
        }

        // 确保今天签到且未签退
        const foundIndex = attendanceRecords.findIndex(record => 
            record.username === username && 
            record.signInTime && 
            isSameDay(record.signInTime, new Date()) &&
            !record.signOutTime
        );

        if (foundIndex === -1) {
            alert('您还未签到或今天已签退，请先签到。');
            return;
        }

        const record = attendanceRecords[foundIndex];
        record.signOutTime = new Date();
        saveRecords();
        signOutTimeElement.textContent = formatTime(record.signOutTime);

        const result = calculateTimeDifference(record.signInTime, record.signOutTime);

        durationElement.textContent = `${result.minutes}分钟`;
        if (result.message) {
            overtimeMessage.textContent = result.message;
            overtimeMessage.style.display = 'block';
        } else {
            overtimeMessage.style.display = 'none';
        }
        alert('签退成功！');
    });

    // 加载最后一条未完成的记录
    const today = new Date();
    const lastIncompleteRecord = attendanceRecords.find(record => 
        record.signInTime && 
        isSameDay(record.signInTime, today) &&
        !record.signOutTime
    );
    if (lastIncompleteRecord) {
        usernameInput.value = lastIncompleteRecord.username;
        signInTimeElement.textContent = formatTime(lastIncompleteRecord.signInTime);
        signOutTimeElement.textContent = '-';
        durationElement.textContent = '-';
        overtimeMessage.style.display = 'none';
    }
});