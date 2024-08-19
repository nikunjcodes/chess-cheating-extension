let flag = false;
let lastFenString = "";
function startHack(element) {
    if (flag) return;
    flag = true;
    const hack = main();
    if (hack.status) {
        element.disabled = false;
        element.innerHTML = "Hack Running. <span id='best-move'> Calculating Best Move. </span>";
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

    const bmap = { 1:"a" , 2:"b" , 3:"c" , 4:"d" , 5:"e" , 6:"f" , 7:"g" , 8:"h" };
    const map = {"a" : 1 , "b" : 2 , "c" : 3 , "d" : 4 , "e" : 5 , "f" : 6 , "g" : 7 , "h" : 8 };
    

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
        console.log('Received best move:', bestMove); 
        if (!bestMove || bestMove.length < 4) {
            console.error('Invalid best move:', bestMove);
            return;
        }
        const [fromFile, fromRank, toFile, toRank] = bestMove;
        const initialPos = `${map[fromFile]}${fromRank}`;
        const finalPos = `${map[toFile]}${toRank}`;
        document.querySelectorAll(".cheat-highlight").forEach(element => element.remove());
        createHighlightElement(initialPos);
        createHighlightElement(finalPos);
        document.getElementById("best-move").innerHTML = `Best Move: ${fromFile}${fromRank} -> ${toFile}${toRank}`;
    }

    function createHighlightElement(pos) {
        const board = document.querySelector(".board");
        if (!board) {
            console.error("Board element not found");
            return;
        }
        if (!pos) {
            console.error("Invalid position:", pos);
            return;
        }
        const highlight = document.createElement("div");
        highlight.className = `highlight cheat-highlight square-${pos}`;
        highlight.style.backgroundColor = "red";
        highlight.style.opacity = "0.5";
        board.appendChild(highlight);
    }

    async function getBestMove(fenString, playerColor) {
        const depth = 9;
        const url = `https://stockfish.online/api/s/v2.php?fen=${encodeURIComponent(fenString)}&depth=${depth}`;
        try {
            const response = await fetch(url);
            const data = await response.json();
            console.log("API response:", data); // Debugging output
            if (data.success) {
                const bestMove = data.bestmove.split(' ')[1];
                if (bestMove) {
                    updateBestMove(bestMove);
                } else {
                    console.error("Best move is undefined.");
                }
            } else {
                console.error("Error from API:", data.error);
            }
        } catch (error) {
            console.error("Network error:", error);
        }
    }

    function startListeningForMoves() {
        lastFenString = getFenString();

        const intervalId = setInterval(() => {
            const newFenString = getFenString();
            if (newFenString !== lastFenString) {
                lastFenString = newFenString;
                getBestMove(newFenString, playerColor);
            }
        }, 1000);

        document.getElementById("hack-button").onclick = () => {
            clearInterval(intervalId);
            document.querySelectorAll(".cheat-highlight").forEach(element => element.remove());
            flag = false;
            const button = document.getElementById("hack-button");
            if (button) {
                button.innerHTML = "Hack Again.";
                button.disabled = false;
            }
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
if (mainBody) {
    mainBody.prepend(button);
} else {
    console.error("Main body not found");
}
