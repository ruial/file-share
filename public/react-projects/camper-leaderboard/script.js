class LeaderBoardApp extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            searchText: ''
        };
        this.changeSearchText = this.changeSearchText.bind(this);
    }

    changeSearchText(searchText) {
        this.setState({
            searchText: searchText
        });
    }

    render() {
        return (
            <div className="container">
                <h1 className="text-center">Camper LeaderBoard</h1>
                <SearchBar searchText={this.state.searchText} changeSearchText={this.changeSearchText} />
                <br />
                <CampersTable searchText={this.state.searchText} recent={this.props.recent} all={this.props.all} />
            </div>
        );
    }
}

class SearchBar extends React.Component {
    constructor(props) {
        super(props);
        this.handleInputChange = this.handleInputChange.bind(this);
    }

    handleInputChange(e) {
        this.props.changeSearchText(e.target.value);
    }

    render() {
        return <input className="form-control" type="text" placeholder="Search name..."
            value={this.props.searchText} onChange={this.handleInputChange} />
    }
}

class CampersTable extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            recent: true
        };
    }

    changeRecent(recent) {
        this.setState({
            recent: recent
        });
    }

    render() {
        let rows = [];
        let data = this.state.recent ? this.props.recent : this.props.all;
        data.forEach((value, index) => {
            if (value.username.indexOf(this.props.searchText) !== -1) {
                rows.push(<CamperRow key={index} index={index + 1} username={value.username}
                    recent={value.recent} alltime={value.alltime} />);
            }
        });

        return (
            <div className="table-responsive">
                <table className="table table-bordered">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Camper name</th>
                            <th className="sortable" onClick={() => this.changeRecent(true)}>Points in past 30 days</th>
                            <th className="sortable" onClick={() => this.changeRecent(false)}>All time points</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows}
                    </tbody>
                </table>
            </div>
        );
    }
}

function CamperRow(props) {
    return (
        <tr>
            <td>{props.index}</td>
            <td>{props.username}</td>
            <td>{props.recent}</td>
            <td>{props.alltime}</td>
        </tr>
    );
}


// If it is required to load data inside a react container, it should be done in the componentDidMount method
fetch('https://fcctop100.herokuapp.com/api/fccusers/top/recent')
    .then(response => response.json())
    .then(recent => {
        fetch('https://fcctop100.herokuapp.com/api/fccusers/top/alltime')
            .then(response => response.json())
            .then(all => {
                ReactDOM.render(<LeaderBoardApp recent={recent} all={all} />, document.getElementById("root"));
            })
    })
    .catch(err => console.error('error fetching data: ' + err));


/* Simulate loading and use mocked data (it already comes sorted from the API)
setTimeout(() => {
    const recentTop = [
        { username: 'other1', alltime: 3, recent: 3 },
        { username: 'user1', alltime: 10, recent: 2 },
        { username: 'user2', alltime: 15, recent: 1 }
    ];
    const allTop = [
        { username: 'user2', alltime: 15, recent: 1 },
        { username: 'other2', alltime: 12, recent: 1 },
        { username: 'user1', alltime: 10, recent: 2 },
    ];

    ReactDOM.render(<LeaderBoardApp recent={recentTop} all={allTop} />, document.getElementById("root"));
}, 2000);
*/
