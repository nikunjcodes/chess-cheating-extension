let flag = false;

function startHack(element) {
    if (flag) return;
    flag = true;
    const hack = main();
    if (hack.status) {
        element.disabled = false;
        element.innerHTML =
            "Hack Running. <span id='best-move'> Calculating Best Move. </span>";
    } else {
        element.innerHTML = "Start Hack";
        element.disabled = false;
        alert(hack.error);
    }
}

function main() {
    const chessboard = document.querySelector(".board");
    if (!chessboard) {
        return {
            status: false,
            error: "Chessboard not found",
        };
    }

    let playerColor = prompt("Enter your color (white/black): ");
    while (!['white', 'black'].includes(playerColor.toLowerCase())) {
        playerColor = prompt("Enter your color (white/black): ");
    }
    playerColor = playerColor[0].toLowerCase();

    const map = { 1:"a" , 2:"b", 3:"c", 4:"d", 5:"e", 6:"f", 7:"g", 8:"h" };

    function getFenString() {
        let fenString = "";
        for (let row = 8; row >= 1; row--) {
            let empty = 0;
            for (let col = 1; col <= 8; col++) {
                const pos = `${col}${row}`;
                const piece = document.querySelector(`.piece.square-${pos}`);
                const pieceClass = piece ? [...piece.classList].find(c => c.length == 2) : null;
                if (pieceClass) {
                    if (empty) {
                        fenString += empty;
                        empty = 0;
                    }
                    fenString += pieceClass[0] === 'w' ? pieceClass[1].toUpperCase() : pieceClass[1].toLowerCase();
                } else {
                    empty++;
                }
            }
            if (empty) fenString += empty;
            if (row > 1) fenString += '/';
        }
        console.log('Generated FEN:', fenString);
        return `${fenString} ${playerColor} - - 0 1`;
    }

    function updateBestMove(bestMove) {
        const [fromFile, fromRank, toFile, toRank] = bestMove;
        const initialPos = `${map[fromFile]}${fromRank}`;
        const finalPos = `${map[toFile]}${toRank}`;
        document.querySelectorAll(".cheat-highlight").forEach(element => element.remove());
        createHighlightElement(initialPos);
        createHighlightElement(finalPos);
        document.getElementById("best-move").innerHTML = `Best Move: ${initialPos} -> ${finalPos}`;
    }

    function createHighlightElement(pos) {
        const highlight = document.createElement("div");
        highlight.className = `highlight cheat-highlight square-${pos}`;
        highlight.style.backgroundColor = "red";
        highlight.style.opacity = "0.5";
        document.querySelector("wc-chess-board").appendChild(highlight);
    }

    async function getBestMove(fenString, playerColor) {
        const depth = 9;
        const url = `https://stockfish.online/api/s/v2.php?fen=${encodeURIComponent(fenString)}&depth=${depth}`;
        try {
            const response = await fetch(url);
            const data = await response.json();
            if (data.success) {
                const bestMove = data.bestmove.split(' ')[1];
                updateBestMove(bestMove);
            } else {
                console.error("Error from API:", data.error);
            }
        } catch (error) {
            console.error("Network error:", error);
            return null;
        }
    }

    function startListeningForMoves() {
        let fenString = getFenString();
        const intervalId = setInterval(() => {
            const newFenString = getFenString();
            if (newFenString !== fenString) {
                fenString = newFenString;
                getBestMove(fenString, playerColor);
            }
        }, 1000);

        document.getElementById("hack-button").onclick = () => {
            clearInterval(intervalId);
            document.querySelectorAll(".cheat-highlight").forEach(element => element.remove());
            flag = false;
            document.getElementById("hack-button").innerHTML = "Hack Again.";
            return { status: false };
        };
    }

    startListeningForMoves();
    return { status: true };
}

const button = document.createElement("button");
button.className = "ui_v5-button-component ui_v5-button-primary ui_v5-button-large ui_v5-button-full";
button.id = "hack-button";
button.innerHTML = "Start Hack";
button.onclick = () => startHack(button);
const mainBody = document.querySelector(".board-layout-main");
mainBody.prepend(button);
