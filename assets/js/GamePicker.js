loadGames("ryangoodwin")
    .then(toXml)
    .then(extractGames)
    .then(setupUI)
    .catch(err => { console.log(err) })


function loadGames(user) {

    return new Promise((resolve, reject) => {
        fetch(`https://boardgamegeek.com/xmlapi/collection/${user}?own=1`)
            .then(response => {
                if(response.status === 200) {
                    console.log(response);
                    resolve(response.text());
                } else if(response.status === 202) {
                    console.log("Waiting...");
                    sleep(5000)
                        .then(() => loadGames(user))
                        .then(response => resolve(response))
                        .catch(reject);
                } else {
                    reject();
                }
            });
    });
}

function sleep(ms) {
    return new Promise(res => setTimeout(res, ms));
}

function toXml(text) {
    const parser = new DOMParser();
    return parser.parseFromString(text, "text/xml");
}

function extractGames(xml) {
    
    console.log(xml);

    const games = [];
    const items = xml.getElementsByTagName("item");
    
    for(item of items) {
        if(item.getAttribute("subtype") === "boardgame") {
            games.push({
                id : item.getAttribute("objectid"),
                name : item.getElementsByTagName("name").item(0).textContent,
                minPlayers : item.getElementsByTagName("stats").item(0).getAttribute("minplayers"),
                maxPlayers : item.getElementsByTagName("stats").item(0).getAttribute("maxplayers"),
                thumbnail : item.getElementsByTagName("image").item(0).textContent,
            });
        }
    }

    return games;
}

function setupUI(games) {

    const players = ["Ryan", "Jo", "Craig", "Pete", "George", "Adam", "Mark", "Jack", "Jamie"];

    players.forEach(player => {
        const tickbox = createTickBox(player);
        tickbox.addEventListener("click", updateNumPlayers);

        document.getElementById("people").appendChild(tickbox);
    });

    let numPlayers = 0;

    const gameButton = document.getElementById("go");
    const playersButton = document.getElementById("changePlayers");

    gameButton.addEventListener("click", event => {
        event.preventDefault();

        const game = pickGame(games, numPlayers);

        const container = document.getElementById("game");
        container.innerHTML = "";

        if(game !== undefined) {
            const pre = document.createElement("pre");
            pre.innerHTML = game.name;

            const link = document.createElement("a");
            link.setAttribute("href", `https://boardgamegeek.com/boardgame/${game.id}`);
            link.innerHTML = "View on BGG";

            container.appendChild(pre);
            container.appendChild(link);
            container.appendChild(createImage(game.thumbnail));
            gameButton.innerHTML = "Different game";
            document.getElementById("people").style.display = "none";
            document.getElementById("game").style.display = "block";
        }
    });

    function updateNumPlayers() {
        numPlayers = document.querySelectorAll('input[type="checkbox"]:checked').length;
    }
}

function createImage(thumbnail) {
    const image = document.createElement("img");
    image.src = thumbnail;
    return image;
}

function createTickBox(name) {
    const container = document.createElement("div");
    container.classList.add("checkbox");

    const tickbox = document.createElement("input");
    tickbox.type = "checkbox";
    tickbox.name = name;
    tickbox.value = name;
    tickbox.id = name;

    const label = document.createElement("label");
    label.setAttribute("for", name);
    label.appendChild(document.createTextNode(name));

    
    container.appendChild(tickbox);
    container.appendChild(label);

    return container;
}

function createLabel(name) {

}

function pickGame(games, numPlayers) {
    console.log(numPlayers);
    const sublist = games.filter(x => x.minPlayers <= numPlayers && x.maxPlayers >= numPlayers);
    const randomIndex = Math.floor((Math.random() * sublist.length));
    return sublist[randomIndex];
}
