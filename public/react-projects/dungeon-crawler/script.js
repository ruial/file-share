/*
I have health, a level, and a weapon. I can pick up a better weapon. I can pick up health items.
All the items and enemies on the map are arranged at random.
I can move throughout a map, discovering items.
I can move anywhere within the map's boundaries, but I can't move through an enemy until I've beaten it.
Much of the map is hidden. When I take a step, all spaces that are within a certain number of spaces from me are revealed.
When I beat an enemy, the enemy goes away and I get XP, which eventually increases my level.
When I fight an enemy, we take turns damaging each other until one of us loses. I do damage based off of my level and my weapon. The enemy does damage based off of its level. Damage is somewhat random within a range.
When I find and beat the boss, I win.
*/

const map1 = `
#################################################
#                   #########                   #
#                   #########                   #
#                   #########                   #
#                                               #
#                   #########                   #
#                   #########                   #
#                   #########                   #
#####################################  ##########
#####################################  ##########
#####################################  ##########
#####################################  ##########
#####################################  ##########
#####################################  ##########
#####################################  ##########
#################################          ######
#################################          ######
#################################################
`;

const map2 = `
#################################################
#                   #########                   #
#                   #########                   #
#                   #########           #########
#                                       #########
#                   #########                   #
#                   #########                   #
#                   #########                   #
######       ################          ##########
######       ################          ##########
######       ################          ##########
######                                 ##########
#############################          ##########
#############################          ##########
#############################          ##########
#############################          ##########
#################################################
#################################################
`;

const bossMap = `
##############################
#                            #
#                            #
#                            #
#                            #
#                            #
#                            #
#                            #
#                            #
#                            #
#                            #
#                            #
#                            #
#                            #
##############################
`;

// Fisher-Yates Shuffle
function shuffle(array) {
    let counter = array.length;

    // While there are elements in the array
    while (counter > 0) {
        // Pick a random index
        let index = Math.floor(Math.random() * counter);

        // Decrease counter by 1
        counter--;

        // And swap the last element with it
        let temp = array[counter];
        array[counter] = array[index];
        array[index] = temp;
    }

    return array;
}

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// clone game map to avoid mutating react state directly
// if the array contained primitive types slicing the lines would be enough
// however with objects we must clone them because of shared references
function cloneGameMap(game) {
    return game.map(line => {
        return line.map(column => {
            return column.clone();
        })
    });
}

function between(x, min, max) {
    return x >= min && x <= max;
}

function stringMapToMatrix(map, previousPlayer = null, enemiesLevel = 1, teleport = true,
    enemiesCount = 3, weaponsCount = 1, healthCount = 2) {

    let matrix = [];
    let emptySpots = [];
    let line = 0;
    let column = 0;
    matrix[line] = [];

    // load string to matrix and get empty spot positions, ignore first and last line
    for (let i = 1; i < map.length - 1; i++) {
        let ch = map.charAt(i);
        // empty spot found, add it to the empty spots array
        if (ch === PointTypes.EMPTY) {
            emptySpots.push({ x: line, y: column });
        }
        // add the point to the matrix
        matrix[line].push(new PointType(ch));
        column++;
        // newline found, create a new line in the matrix and reset column
        if (ch === PointTypes.NEWLINE) {
            matrix[++line] = [];
            column = 0;
        }
    }

    // shuffling the array is an easy way to add stuff in sequence at random positions without overlap
    // assume there are always more empty spots than enemies + weapons + healths + player + teleport
    shuffle(emptySpots);

    let counter = 0;
    let pos;

    // add enemies
    for (let i = 0; i < enemiesCount; i++) {
        pos = emptySpots[counter++];
        matrix[pos.x][pos.y] = new Enemy(enemiesLevel);
    }
    // add weapons
    for (let i = 0; i < weaponsCount; i++) {
        pos = emptySpots[counter++];
        matrix[pos.x][pos.y] = new PointType(PointTypes.WEAPON);
    }
    // add health pickups
    for (let i = 0; i < healthCount; i++) {
        pos = emptySpots[counter++];
        matrix[pos.x][pos.y] = new PointType(PointTypes.HEALTH);
    }
    // add player
    pos = emptySpots[counter++];
    let player;
    if (previousPlayer) {
        player = new Player(pos.x, pos.y, previousPlayer.health, previousPlayer.baseDamage,
            previousPlayer.level, previousPlayer.xp);
    }
    else {
        player = new Player(pos.x, pos.y);
    }
    matrix[pos.x][pos.y] = player;
    // add teleport
    if (teleport) {
        pos = emptySpots[counter++];
        matrix[pos.x][pos.y] = new PointType(PointTypes.TELEPORT);
    }

    console.log(matrix);
    return {
        map: matrix,
        player: player
    }
}

const PointTypes = {
    PLAYER: 'p',
    WALL: '#',
    EMPTY: ' ',
    NEWLINE: '\n',
    WEAPON: 'w',
    HEALTH: 'h',
    ENEMY: 'e',
    TELEPORT: 't'
}

function getPointTypeLowercaseKey(value) {
    return Object.keys(PointTypes).find(key => PointTypes[key] === value).toLowerCase();
}

class PointType {
    constructor(type) {
        this.type = type;
    }

    clone() {
        return new PointType(this.type);
    }
}

class Being extends PointType {
    constructor(type, health, baseDamage, level) {
        super(type);
        this.health = health;
        this.baseDamage = baseDamage;
        this.level = level;
    }

    clone() {
        return new Being(this.type, this.health, this.baseDamage, this.level);
    }

    // damage = 125% level * (baseDamage +- 10)
    inflictDamage(being) {
        being.health -= Math.floor((this.level + this.level * 0.25) * randomInt(this.baseDamage - 10, this.baseDamage + 10));
    }

    isDead() {
        return this.health <= 0;
    }
}

class Player extends Being {
    constructor(x, y, health = 100, baseDamage = 30, level = 1, xp = 0) {
        super(PointTypes.PLAYER, health, baseDamage, level);
        this.x = x;
        this.y = y;
        this.xp = xp;
    }

    clone() {
        return new Player(this.x, this.y, this.health, this.baseDamage, this.level, this.xp);
    }

    changePos(x, y) {
        this.x = x;
        this.y = y;
    }

    pickHealth() {
        this.health += randomInt(20, 60);
    }

    pickWeapon() {
        this.baseDamage += randomInt(5, 10);
    }

    increaseXp() {
        this.xp += 100;
        if (this.xp % 300 == 0) {
            this.level++;
        }
    }

}

class Enemy extends Being {
    constructor(level) {
        super(PointTypes.ENEMY, 100, 25, level);
    }
}

class GameApp extends React.Component {

    constructor(props) {
        super(props);

        // since this variable should not trigger any UI changes, it can be saved like this
        this.isOver = false;

        this.state = this.loadMap(0);
        this.state.currentMapIndex = 0;
        this.state.darkMode = true;
    }

    finishGame(message) {
        this.isOver = true;
        alert(message);
    }

    loadMap(index) {
        // on first load it should create the player
        if (index === 0)
            return stringMapToMatrix(this.props.maps[index]);
        // last map is boss level
        if (index === this.props.maps.length - 1)
            return stringMapToMatrix(this.props.maps[index], this.state.player, index + 2, false, 1, 0, 1);
        // load current map and keep player state
        return stringMapToMatrix(this.props.maps[index], this.state.player, index + 1);
    }

    handleKeyDown(event) {
        if (this.isOver) return; // if game is over ignore input
        switch (event.keyCode) {
            case 37:
                this.movePlayer(this.state.player.x, this.state.player.y - 1);
                break;
            case 38:
                this.movePlayer(this.state.player.x - 1, this.state.player.y);
                break;
            case 39:
                this.movePlayer(this.state.player.x, this.state.player.y + 1);
                break;
            case 40:
                this.movePlayer(this.state.player.x + 1, this.state.player.y);
                break;
            default:
                break;
        }
    }

    movePlayer(x, y) {
        if (this.state.map[x][y].type === PointTypes.TELEPORT) {
            const mapInfo = this.loadMap(this.state.currentMapIndex + 1);
            this.setState({
                map: mapInfo.map,
                player: mapInfo.player,
                currentMapIndex: this.state.currentMapIndex + 1
            });
            return;
        }

        // clone objects to avoid changing state directly, there are more efficient ways
        let player = this.state.player.clone();
        let map = cloneGameMap(this.state.map);

        if (map[x][y].type === PointTypes.HEALTH) {
            player.pickHealth();
            map[x][y] = new PointType(PointTypes.EMPTY);
        }

        if (map[x][y].type === PointTypes.WEAPON) {
            player.pickWeapon();
            map[x][y] = new PointType(PointTypes.EMPTY);
        }

        if (map[x][y].type === PointTypes.ENEMY) {
            let enemy = map[x][y];
            player.inflictDamage(enemy);
            if (enemy.isDead()) {
                map[x][y] = new PointType(PointTypes.EMPTY);
                player.increaseXp();

                // check win (assumes last level has only 1 enemy)
                if (this.state.currentMapIndex === mapList.length - 1) this.finishGame('You won!');
            }
            else {
                enemy.inflictDamage(player);
                if (player.isDead()) this.finishGame('You lost!');
            }
        }

        if (map[x][y].type === PointTypes.EMPTY) {
            map[player.x][player.y] = new PointType(PointTypes.EMPTY);
            player.changePos(x, y);
            map[x][y] = player;
        }

        this.setState({ player: player, map: map });
    }

    componentWillMount() {
        document.addEventListener("keydown", this.handleKeyDown.bind(this));
    }

    componentWillUnmount() {
        document.removeEventListener("keydown", this.handleKeyDown.bind(this));
    }

    render() {
        let result = [];
        let map = this.state.map;

        for (let i = 0; i < map.length; i++) {
            for (let j = 0; j < map[i].length; j++) {
                let point = map[i][j];
                let pointId = i + ',' + j;

                if (this.state.darkMode) {
                    // if dark mode is enabled and points are not newline or in range, draw it black
                    if ((between(i, this.state.player.x - this.props.visibleRadius, this.state.player.x + this.props.visibleRadius)
                        && between(j, this.state.player.y - this.props.visibleRadius, this.state.player.y + this.props.visibleRadius))
                        || point.type === PointTypes.NEWLINE) {
                        result.push(<div key={pointId} className={getPointTypeLowercaseKey(point.type)} />);
                    }
                    else {
                        result.push(<div key={pointId} className='dark' />);
                    }
                }
                else {
                    result.push(<div key={pointId} className={getPointTypeLowercaseKey(point.type)} />);
                }
            }
        }

        let mapStyle = {
            width: this.state.map[0].length * this.props.cellSize + "px",
            margin: "20px auto"
        };

        return (
            <div className="text-center" style={mapStyle}>
                <h1>Some game</h1>
                {result}
                <br />
                <p><b>Position:</b> ({this.state.player.x}, {this.state.player.y})</p>
                <p><b>Health:</b> {this.state.player.health}</p>
                <p><b>Damage:</b> {this.state.player.baseDamage}</p>
                <p><b>XP:</b> {this.state.player.xp}</p>
                <p><b>Level:</b> {this.state.player.level}</p>
                <p><b>Current map:</b> {this.state.currentMapIndex + 1}/{this.props.maps.length}</p>
                <button className="btn btn-default" onClick={() => this.setState({ darkMode: !this.state.darkMode })}>Toggle dark</button>
            </div>
        );
    }

}

const mapList = [map1, map2, bossMap];
ReactDOM.render(<GameApp maps={mapList} cellSize={10} visibleRadius={5} />, document.getElementById("root"));
