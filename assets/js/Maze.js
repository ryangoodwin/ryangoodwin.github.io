class Graph {
    constructor(vertices = new Set()) {
        this.adjList = new Map();
        this.vertices = new Set(vertices);
        this.vertices.forEach(v => this.adjList.set(v, new Set()));
    }
    addVertex(v) {
        if (!this.vertices.has(v)) {
            this.vertices.add(v);
            this.adjList.set(v, new Set());
        }
    }
    deleteVertex(v) {
        this.getEdges(v).forEach(e => this.removeEdge(v, e));
        this.vertices.delete(v);
    }
    getVertices() {
        return this.vertices;
    }
    addEdge(a, b) {
        if (this.vertices.has(a) && this.vertices.has(b)) {
            this.adjList.get(a).add(b);
            this.adjList.get(b).add(a);
        }
    }
    removeEdge(a, b) {
        this.adjList.get(a).delete(b);
        this.adjList.get(b).delete(a);
    }
    getEdges(v) {
        return this.adjList.get(v);
    }
}
class Maze extends Graph {
    constructor(vertices) {
        super(vertices);
    }
}
class SquareMaze extends Maze {
    constructor(mazeWidth, mazeHeight, cellWidth) {
        super(new Set());
        this.mazeWidth = mazeWidth;
        this.mazeHeight = mazeHeight;
        this.cellWidth = cellWidth;
        this.baseGraph = new Graph();
        // Create and connect our base graph
        for (var y = 0; y < mazeHeight; y++) {
            for (var x = 0; x < mazeWidth; x++) {
                let cellIndex = y * mazeWidth + x;
                this.baseGraph.addVertex(cellIndex);
                if (x > 0) {
                    this.baseGraph.addEdge(cellIndex, cellIndex - 1);
                }
                if (y > 0) {
                    this.baseGraph.addEdge(cellIndex, cellIndex - mazeWidth);
                }
            }
        }
    }
    getBaseGraph() {
        return this.baseGraph;
    }
    draw(ctx, highlightedCells = new Set(), highlightColor = "pink") {
        // clear our canvas
        ctx.beginPath();
        ctx.fillStyle = "black";
        ctx.rect(0, 0, 1 + this.mazeWidth * this.cellWidth, 1 + this.mazeHeight * this.cellWidth);
        ctx.fill();
        const coords = [
            { x: this.cellWidth + 0.5, y: 0.5 },
            { x: this.cellWidth + 0.5, y: this.cellWidth + 0.5 },
            { x: 0.5, y: this.cellWidth + 0.5 },
            { x: 0.5, y: 0.5 }
        ];
        for (let vertex of this.getVertices()) {
            const position = vertex;
            const edges = [
                position - this.mazeWidth,
                position + 1,
                position + this.mazeWidth,
                position - 1
            ];
            const x = (position % this.mazeWidth) * this.cellWidth;
            const y = (Math.floor(position / this.mazeWidth)) * this.cellWidth;
            const paths = this.getEdges(vertex);
            ctx.beginPath();
            ctx.fillStyle = highlightedCells.has(vertex) ? highlightColor : "white";
            ctx.rect(x, y, this.cellWidth, this.cellWidth);
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(x + 0.5, y + 0.5);
            for (let i = 0; i < edges.length; i++) {
                if (paths.has(edges[i])) {
                    ctx.moveTo(x + coords[i].x, y + coords[i].y);
                }
                else {
                    ctx.lineTo(x + coords[i].x, y + coords[i].y);
                }
            }
            ctx.fill();
            ctx.stroke();
        }
    }
}
// TODO research iterable
class MazeGenerator {
    constructor(maze) {
        this.maze = maze;
    }
    ;
}
class Prims extends MazeGenerator {
    constructor(maze) {
        super(maze);
        this.visited = new Set();
        this.toVisit = new Set();
        this.finished = false;
        const startPoint = maze.getBaseGraph().getVertices().values().next().value;
        this.visited.add(startPoint);
        this.maze.addVertex(startPoint);
        this.toVisit = maze.getBaseGraph().getEdges(startPoint);
        debugger;
        this.toVisit.forEach(x => this.maze.addVertex(x));
    }
    step() {
        if (this.toVisit.size === 0) {
            this.finished = true;
        }
        else {
            let cell = [...this.toVisit][Math.floor(Math.random() * this.toVisit.size)];
            let neighbours = this.maze.getBaseGraph().getEdges(cell);
            let neighboursInMaze = new Set([...neighbours].filter(x => this.visited.has(x)));
            let neighboursNotInMaze = new Set([...neighbours].filter(x => !this.visited.has(x)));
            neighboursNotInMaze.forEach(v => {
                this.toVisit.add(v);
                this.maze.addVertex(v);
            });
            let chosenNeighbour = [...neighboursInMaze][Math.floor(Math.random() * neighboursInMaze.size)];
            this.maze.addEdge(cell, chosenNeighbour);
            this.visited.add(cell);
            this.toVisit.delete(cell);
        }
        return { finished: this.finished, maze: this.maze, processing: this.toVisit };
    }
}
class RecursiveBacktracker extends MazeGenerator {
    constructor(maze) {
        super(maze);
        this.path = [];
        this.finished = false;
        const startPoint = maze.getBaseGraph().getVertices().values().next().value;
        this.path = [startPoint];
        this.maze.addVertex(startPoint);
    }
    step() {
        if (this.path.length === 0) {
            this.finished = true;
        }
        else {
            let currentCell = this.path[this.path.length - 1];
            let neighbours = this.maze.getBaseGraph().getEdges(currentCell);
            let neighboursNotInMaze = new Set([...neighbours].filter(x => !this.maze.getVertices().has(x)));
            if (neighboursNotInMaze.size === 0) {
                this.path.pop();
            }
            else {
                let neighboursInMaze = neighboursNotInMaze.size;
                let nextCell = [...neighboursNotInMaze][Math.floor(Math.random() * neighboursInMaze)];
                this.maze.addVertex(nextCell);
                this.maze.addEdge(currentCell, nextCell);
                this.path.push(nextCell);
            }
        }
        return { finished: this.finished, maze: this.maze, processing: new Set(this.path) };
    }
}
class Wilsons extends MazeGenerator {
    constructor(maze) {
        super(maze);
        this.notInMaze = new Set();
        this.finished = false;
        this.currentWalk = [];
        maze.getBaseGraph().getVertices().forEach(v => this.notInMaze.add(v));
        let startPoint = maze.getBaseGraph().getVertices().values().next().value;
        this.notInMaze.delete(startPoint);
        this.maze.addVertex(startPoint);
    }
    step() {
        if (this.notInMaze.size === 0) {
            this.finished = true;
        }
        else if (this.currentWalk.length === 0) {
            let startPoint = this.notInMaze.values().next().value;
            this.currentWalk = [startPoint];
            this.maze.addVertex(startPoint);
        }
        else {
            let currentCell = this.currentWalk[this.currentWalk.length - 1];
            let neighbours = this.maze.getBaseGraph().getEdges(currentCell);
            let availableNeighbours = new Set(neighbours);
            availableNeighbours.delete(this.currentWalk[this.currentWalk.length - 1]);
            let nextCell = [...availableNeighbours][Math.floor(Math.random() * availableNeighbours.size)];
            if (this.currentWalk.includes(nextCell)) {
                let pos = this.currentWalk.indexOf(nextCell) + 1;
                let loop = this.currentWalk.slice(pos);
                this.currentWalk = this.currentWalk.slice(0, pos);
                loop.forEach(x => {
                    this.maze.deleteVertex(x);
                });
            }
            else if (this.maze.getVertices().has(nextCell)) {
                this.currentWalk.push(nextCell);
                this.currentWalk.forEach((x, i) => {
                    this.maze.addVertex(x);
                    if (i > 0) {
                        this.maze.addEdge(x, this.currentWalk[i - 1]);
                    }
                    this.notInMaze.delete(x);
                });
                this.currentWalk = [];
            }
            else {
                this.currentWalk.push(nextCell);
                this.maze.addVertex(nextCell);
                this.maze.addEdge(currentCell, nextCell);
            }
        }
        return { finished: this.finished, maze: this.maze, processing: new Set(this.currentWalk) };
    }
}
function createMazeViewer(canvas, options) {
    const opts = Object.assign({
        generator: "RecursiveBacktracker",
        mazeWidth: 10,
        mazeHeight: 10,
        color: "pink",
        cellWidth: 10
    }, options);
    let maze = undefined;
    let generator = undefined;
    let lastTime = (new Date()).getTime();
    function init() {
        maze = new SquareMaze(opts.mazeWidth, opts.mazeHeight, opts.cellWidth);
        switch (opts.generator) {
            case "Prims":
                generator = new Prims(maze);
                break;
            case "Wilsons":
                generator = new Wilsons(maze);
                break;
            case "RecursiveBacktracker":
                generator = new RecursiveBacktracker(maze);
                break;
        }
        lastTime = (new Date()).getTime();
    }
    ;
    let animationTimeout = undefined;
    const timeForStep = 10;
    function animate() {
        const time = (new Date()).getTime();
        let timeSinceLast = time - lastTime;
        let finished = false;
        if (timeSinceLast > timeForStep) {
            let maze = null;
            let processing = null;
            while (timeSinceLast > timeForStep) {
                const results = generator.step();
                finished = results.finished;
                maze = results.maze;
                processing = results.processing;
                timeSinceLast -= timeForStep;
            }
            lastTime = time - timeSinceLast;
            maze.draw(canvas.getContext("2d"), processing, opts.color);
        }
        if (!finished) {
            requestAnimationFrame(animate);
        }
    }
    ;
    canvas.onclick = function canvasClick(event) {
        clearTimeout(animationTimeout);
        init();
        animate();
    };
    init();
    animate();
}
