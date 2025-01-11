document.addEventListener('DOMContentLoaded', () => {
    const headerBar = document.querySelector('.header-bar');
    const menuBtn = document.getElementById('menu-btn');
    const sidebar = document.getElementById('sidebar');
    const loginBtn = document.getElementById('login-btn');
    const loginModal = document.getElementById('login-modal');
    const closeModal = document.getElementById('close-modal');
    let flag = 1
    // 點擊選單按鈕，切換選單狀態
    menuBtn.addEventListener('click', () => {
        sidebar.classList.toggle('show');
        headerBar.classList.toggle('active');
        flag += 1;
        if(flag%2 == 0){
            const divWidth = sidebar.offsetWidth;
            const windowWidth = window.innerWidth;
        
            const difference = windowWidth - divWidth;
            headerBar.style.width = `${difference}px`;
        }else{
            headerBar.style.width = `100%`;
        }

        
    });

    // 顯示登入模態框
    loginBtn.addEventListener('click', () => {
        loginModal.classList.remove('hidden');
    });

    // 關閉登入模態框
    closeModal.addEventListener('click', () => {
        loginModal.classList.add('hidden');
    });

    // 點擊背景關閉模態框
    window.addEventListener('click', (event) => {
        if (event.target === loginModal) {
            loginModal.classList.add('hidden');
        }
    });
});
