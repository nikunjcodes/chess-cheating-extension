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
        return { status: false, error: "Chessboard not found" };
    }

    // Automatically detect player color
    const boardParent = chessboard.closest(".board-layout-chessboard");
    let playerColor = 'w'; // Default to white
    if (boardParent) {
        playerColor = boardParent.classList.contains("orientation-white") ? 'w' : 'b';
    } else {
        return { status: false, error: "Could not detect player color" };
    }

    console.log(`Detected player color: ${playerColor === 'w' ? 'white' : 'black'}`);

    const bmap = { 1: "a", 2: "b", 3: "c", 4: "d", 5: "e", 6: "f", 7: "g", 8: "h" };
    const map = { "a": 1, "b": 2, "c": 3, "d": 4, "e": 5, "f": 6, "g": 7, "h": 8 };

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
        const highlight = document.createElement("div");
        highlight.className = `highlight cheat-highlight square-${pos}`;
        highlight.style.backgroundColor = "red";
        highlight.style.opacity = "0.5";
        document.querySelector(".board").appendChild(highlight);
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
            }
        } catch (error) {
            console.error("Network error:", error);
        }
    }

    function observeBoardChanges() {
        const observer = new MutationObserver(() => {
            const newFenString = getFenString();
            if (newFenString !== lastFenString) {
                lastFenString = newFenString;
                getBestMove(newFenString, playerColor);
            }
        });

        observer.observe(chessboard, { childList: true, subtree: true });
    }

    observeBoardChanges();
    return { status: true };
}

// Create the button
const button = document.createElement("button");
button.className = "ui_v5-button-component ui_v5-button-primary ui_v5-button-large ui_v5-button-full";
button.id = "hack-button";
button.innerHTML = "Start Hack";
button.onclick = () => startHack(button);

// Add the button to the main body
const mainBody = document.querySelector(".board-layout-main");
if (mainBody) mainBody.prepend(button);
else console.error("Main body not found");
