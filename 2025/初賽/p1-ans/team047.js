document.addEventListener('DOMContentLoaded', () => {
    const resetBtn = document.getElementById('reset-btn');
    const diskCountSelect = document.getElementById('diskCount');
    const towers = document.querySelectorAll('.tower');
    const minMovesSpan = document.getElementById('min-moves');
    const currentMovesSpan = document.getElementById('current-moves');

    let currentMoves = 0;
    let draggedDisk = null;
    let totalDisks = 0;

    resetBtn.addEventListener('click', initializeGame);
    diskCountSelect.addEventListener('change', initializeGame);

    function initializeGame() {
        totalDisks = parseInt(diskCountSelect.value);
        if (!totalDisks) {
            alert('請輸入數字');
            return;
        }

        towers.forEach(tower => {
            tower.innerHTML = '<div class="rod"></div>'; 
        });
        currentMoves = 0;
        updateMoves();

        minMovesSpan.textContent = Math.pow(2, totalDisks) - 1;

        const towerA = document.getElementById('tower-a');
        for (let i = totalDisks; i > 0; i--) {
            const disk = document.createElement('div');
            disk.classList.add('disk');
            disk.draggable = true;
            disk.id = `disk-${i}`;
            disk.dataset.size = i;
            disk.style.width = `${15 + i * 9}%`;
            disk.style.textShadow = `1px 1px 0.5px #000000`;
            
            disk.style.backgroundColor = `hsl(${(i * 20) % 255}, 70%, 60%)`;
            disk.textContent = i;
            towerA.appendChild(disk);
        }
        addDragListeners();
    }

    function addDragListeners() {
        const disks = document.querySelectorAll('.disk');
        disks.forEach(disk => {
            disk.addEventListener('dragstart', handleDragStart);
            disk.addEventListener('dragend', handleDragEnd);
        });
    }

    towers.forEach(tower => {
        tower.addEventListener('dragover', handleDragOver);
        tower.addEventListener('drop', handleDrop);
        tower.addEventListener('dragenter', handleDragEnter);
        tower.addEventListener('dragleave', handleDragLeave);
    });

    function handleDragStart(e) {
        const topDisk = e.target.parentElement.lastChild;
        if (e.target === topDisk) {
            draggedDisk = e.target;
            setTimeout(() => e.target.classList.add('dragging'), 0);
        } else {
            e.preventDefault(); 
        }
    }

    function handleDragEnd(e) {
        e.target.classList.remove('dragging');
        draggedDisk = null;
    }

    function handleDragOver(e) {
        e.preventDefault();
    }

    function handleDragEnter(e) {
        const targetTower = e.target.closest('.tower');
        if (targetTower && isMoveValid(targetTower)) {
            targetTower.classList.add('drag-over');
        }
    }

    function handleDragLeave(e) {
        const targetTower = e.target.closest('.tower');
        if (targetTower) {
            targetTower.classList.remove('drag-over');
        }
    }

    function handleDrop(e) {
        e.preventDefault();
        const targetTower = e.target.closest('.tower');
        if (targetTower && isMoveValid(targetTower)) {
            targetTower.appendChild(draggedDisk);
            currentMoves++;
            updateMoves();
            checkWinCondition();
        }
        targetTower.classList.remove('drag-over');
    }

    function isMoveValid(targetTower) {
        if (!draggedDisk) return false;
        const topDiskElement = targetTower.querySelector('.disk:last-of-type');
        if (!topDiskElement) {
            return true;
        }
        const topDiskSize = parseInt(topDiskElement.dataset.size);
        const draggedDiskSize = parseInt(draggedDisk.dataset.size);
        return draggedDiskSize < topDiskSize;
    }

    function updateMoves() {
        currentMovesSpan.textContent = currentMoves;
    }

    function checkWinCondition() {
        const towerC = document.getElementById('tower-c');
        if (towerC.querySelectorAll('.disk').length === totalDisks) {
            alert("完成遊戲！");
            document.querySelectorAll('.disk').forEach(d => d.draggable = false);
            initializeGame();
        }
    }

    initializeGame();
});