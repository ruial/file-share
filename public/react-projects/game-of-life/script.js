function cloneMatrix(matrix) {
    return matrix.map(arr => {
        return arr.slice();
    });
}

class Game {
    constructor(lines, columns, random = true) {
        this.board = [];
        for (let i = 0; i < lines; i++) {
            let line = [];
            for (let j = 0; j < columns; j++) {
                line[j] = random ? Math.round(Math.random()) : 0;
            }
            this.board[i] = line;
        }
    }

    // React state should not be modified directly, it should be treated as immutable,
    // cloning the object, making the changes and then using setState is an easy solution but performance could be improved
    static clone(other) {
        let game = new Game();
        game.board = cloneMatrix(other.board);
        return game;
    }

    nextIteration() {
        let newBoard = cloneMatrix(this.board);
        for (let i = 0; i < this.board.length; i++) {
            let count = 0;
            for (let j = 0; j < this.board[i].length; j++) {
                let n = this.countNeighbours(i, j);
                let c = this.board[i][j];

                // Any dead cell with exactly three live neighbours becomes a live cell, as if by reproduction.
                if (c == 0 && n == 3) {
                    newBoard[i][j] = 1;
                }

                // Any live cell with more than three live neighbours dies, as if by over-population.
                if (c == 1 && n > 3) {
                    newBoard[i][j] = 0;
                }

                // Any live cell with two or three live neighbours lives on to the next generation.
                if (c == 1 && (n == 2 || n == 3)) {
                    newBoard[i][j] = 1;
                }

                // Any live cell with fewer than two live neighbours dies, as if caused by under-population.
                if (c == 1 && n < 2) {
                    newBoard[i][j] = 0;
                }
            }
        }
        this.board = newBoard;
    }

    countNeighbours(i, j) {
        let count = 0;
        try { if (this.board[i - 1][j - 1]) count++; } catch (e) { }
        try { if (this.board[i - 1][j]) count++; } catch (e) { }
        try { if (this.board[i - 1][j + 1]) count++; } catch (e) { }
        try { if (this.board[i][j - 1]) count++; } catch (e) { }
        try { if (this.board[i][j + 1]) count++; } catch (e) { }
        try { if (this.board[i + 1][j - 1]) count++; } catch (e) { }
        try { if (this.board[i + 1][j]) count++; } catch (e) { }
        try { if (this.board[i + 1][j + 1]) count++; } catch (e) { }
        return count;
    }

    changeCell(i, j) {
        this.board[i][j] = (this.board[i][j] + 1) % 2;
    }
}

class GameApp extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            game: new Game(this.props.lines, this.props.columns),
            iterations: 0
        };
        this.newGame = this.newGame.bind(this);
        this.nextIteration = this.nextIteration.bind(this);
        this.changeCell = this.changeCell.bind(this);
        this.clear = this.clear.bind(this);
        this.start = this.start.bind(this);
        this.stop = this.stop.bind(this);
    }

    componentDidMount() {
        this.start();
    }

    componentWillUnmount() {
        this.stop();
    }

    updateGame(newGame, iterations) {
        this.setState({
            game: newGame,
            iterations: iterations
        });
    }

    newGame() {
        this.stop();
        this.updateGame(new Game(this.props.lines, this.props.columns), 0);
    }

    nextIteration() {
        let game = Game.clone(this.state.game);
        game.nextIteration()
        this.updateGame(game, this.state.iterations + 1);
    }

    changeCell(i, j) {
        let game = Game.clone(this.state.game);
        game.changeCell(i, j);
        this.updateGame(game, this.state.iterations);
    }

    clear() {
        this.stop();
        this.updateGame(new Game(this.props.lines, this.props.columns, false), 0);
    }

    start() {
        if (!this.interval) {
            this.interval = setInterval(() => this.nextIteration(), this.props.timeout);
        }
    }

    stop() {
        clearInterval(this.interval);
        this.interval = null;
    }

    render() {
        let boardStyle = {
            width: this.props.columns * this.props.cellSize + "px",
            margin: "0 auto"
        };
        return (
            <div style={boardStyle}>
                <h1>Game of Life</h1>
                <p>Iterations count: {this.state.iterations}</p>
                <GameBoard board={this.state.game.board} changeCell={this.changeCell} />
                <ul className="list-inline button-list">
                    <li><ActionButton action={this.newGame} text="New Game" /></li>
                    <li><ActionButton action={this.nextIteration} text="Next iteration" /></li>
                    <li><ActionButton action={this.clear} text="Clear" /></li>
                    <li><ActionButton action={this.start} text="Start" /></li>
                    <li><ActionButton action={this.stop} text="Stop" /></li>
                </ul>
            </div>
        );
    }
}

class GameBoard extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        let result = [];
        this.props.board.forEach((line, i) => {
            line.forEach((column, j) => {
                result.push(<GameCell key={i + "," + j} line={i} column={j} status={column} changeCell={this.props.changeCell} />);
            });
            result.push(<div key={i} className="clear" />);
        });
        return <div>{result}</div>;
    }
}

class GameCell extends React.Component {
    constructor(props) {
        super(props);
        this.handleClick = this.handleClick.bind(this);
    }

    handleClick() {
        this.props.changeCell(this.props.line, this.props.column);
    }

    render() {
        return <div className={this.props.status ? "cell black" : "cell white"} onClick={this.handleClick} />;
    }
}

class ActionButton extends React.Component {
    render() {
        return <button className="btn btn-default" onClick={this.props.action}>{this.props.text}</button>
    }
}

ReactDOM.render(<GameApp lines={30} columns={50} cellSize={15} timeout={50} />, document.getElementById("root"));
