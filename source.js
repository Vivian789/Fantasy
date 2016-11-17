var key = '9711424b-5f94-499b-95b9-68d503c6dcb0';

class AddPlayerForm extends React.Component{
  constructor(props){
    super(props)
    this.state = {playerName:''};
  }

  handleTyping(e){
    this.setState({playerName: e.target.value});
  }

  handleSubmit(e){
    e.preventDefault();
    var submittedPlayer = this.state.playerName.replace(/\s/g, '').toLowerCase();
    this.setState({playerName: ''});
    if(submittedPlayer){
      this._fetchPlayerInfo(submittedPlayer);
    }else{
      return;
    }
  }

  _parseAndSendPlayerData(playerName, json){
    var playerData = {'playerName': playerName, 
    'playerStats': {
        'Kills': [], 'Deaths': [], 'Assists': [], 'CS': [], 'Pentas': [], 'Quadras':[], 'Triples':[], 'Bonus': [], 'Points': []
    },
    'games': 0, 
    'totalpoints': 0
    };

    for (var i = 0; i < 10; i++) {
      var jsonGameStats = json.games[i].stats;

      //all statistical calculations
      var kills = jsonGameStats.championsKilled || 0;
      var deaths = jsonGameStats.numDeaths || 0
      var assists = jsonGameStats.assists || 0;
      var cs = (jsonGameStats.minionsKilled || 0) + (jsonGameStats.neutralMinionsKilled || 0);
      var pentas = jsonGameStats.pentaKills || 0;
      var quadras = (jsonGameStats.quadraKills || 0) - pentas;
      var triples = (jsonGameStats.tripleKills || 0) - quadras - pentas;
      var bonus;
      if (assists > 9 || kills > 9 ){
        bonus = 2;
      }else{
        bonus = 0;
      }

      //calculate fantasy points and show two decimal places
      var points = (2 * kills) + (-0.5 * deaths) + (1.5 * assists) + (0.01 * cs) + (2 * triples) + (5 * quadras) + (10 * pentas) + (bonus);
      points = parseFloat(points).toFixed(2);

      //set stats
      playerData.playerStats.Kills.push(kills);
      playerData.playerStats.Deaths.push(deaths);
      playerData.playerStats.Assists.push(assists);
      playerData.playerStats.CS.push(cs);               
      playerData.playerStats.Pentas.push(pentas);                
      playerData.playerStats.Quadras.push(quadras);               
      playerData.playerStats.Triples.push(triples);
      playerData.playerStats.Bonus.push(bonus);
      playerData.playerStats.Points.push(points);
      playerData.games +=1;
      playerData.totalpoints += parseInt(points, 10);
    }
    this.props.addPlayer(playerData);
  }

  _fetchGameInfo(playerName, playerID){
    var _this = this;
    var gameRequest = "https://na.api.pvp.net/api/lol/na/v1.3/game/by-summoner/" + playerID + "/recent?api_key=" + key;
    //get game for that summoner id
    fetch(gameRequest).then(function(response) {
      return response.json()
    }).then(function(json) {
      _this._parseAndSendPlayerData(playerName, json);
    }).catch(function(ex) {
      console.log('parsing game JSON failed', ex)
    })
  }

  _fetchPlayerInfo(submittedPlayer){
    var _this = this;
    var summonerRequest = "https://na.api.pvp.net/api/lol/na/v1.4/summoner/by-name/" + submittedPlayer + "?api_key=" + key;
    fetch(summonerRequest).then(function(response) {
      return response.json()
    }).then(function(json) {
      var summonerID = json[submittedPlayer].id;
      _this._fetchGameInfo(submittedPlayer, summonerID);
    }).catch(function(ex) {
      console.log('parsing player JSON failed', ex)
    })
  }
  
  render(){
    return (
      <form className="Add-player-form" 
          onSubmit={this.handleSubmit.bind(this)}>
        <input 
          type="text" 
          placeholder="Player Name" 
          value={this.state.playerName} 
          onChange={this.handleTyping.bind(this)}
        />
        <input 
          type="submit" 
          value="Add Player" 
        />
      </form>
    )

  }
}

var globalPlayersList = [];

class App extends React.Component {
  constructor(props){
    super(props);
    this.state ={'playerlist': globalPlayersList, 'displayedPlayerIndex': 0};
  }

  addPlayer(playerData){
    playerData.playerIndex = this.state.playerlist.length;
    //add new player's data to the list
    if (this.state.playerlist.length < 10){
      var newPlayerList = this.state.playerlist.concat([playerData]); 
      //set state of the new list to refresh list
      this.setState({'playerlist': newPlayerList, 'displayedPlayerIndex': this.state.playerlist.length})
    }
  }

  changeDisplay(playerIndex){
    this.setState({'displayedPlayerIndex': playerIndex});
  }

  render() {
    return (
      <div className="App">

        <div className="App-header">
          <img src='http://lolstatic-a.akamaihd.net/site/bilgewater/1d0e96db6bd69523cf508365e1042f93171e3deb/img/landing-graphic.png' className="App-logo" alt="logo" />
          <h1>Play Fantasy League!</h1>
        </div>

        <div className="Main">

          <div className="Sidebar">
            <PlayerList playerlist={this.state.playerlist}
              changeDisplay={this.changeDisplay.bind(this)}
            />
            <AddPlayerForm 
              addPlayer={this.addPlayer.bind(this)}
              changeDisplay={this.changeDisplay.bind(this)}
            />
          </div>

          <SummonerDisplay playerData={this.state.playerlist[this.state.displayedPlayerIndex]}/>

        </div>

      </div>
    );
  }
}

class Player extends React.Component{

  _handleClickPlayer(){
    console.log(this.props.playerData.playerIndex);
    this.props.changeDisplay(this.props.playerData.playerIndex);
  }

  render(){
    return (
      <div className="Player" onClick={this._handleClickPlayer.bind(this)}>
        <div className="Player-name">{this.props.playerData.playerName}</div> 
        <div className="Player-points">
          {this.props.playerData.totalpoints/this.props.playerData.games} 
          <button className="Show-stats" onClick={this._handleClickPlayer.bind(this)}> > </button>
        </div>
      </div>
    )
  }
}

class PlayerList extends React.Component{
  render(){
      var _this = this;
      var allPlayers = this.props.playerlist.map(function(player, index){
        return <Player 
            key={index} 
            playerData={player} 
            changeDisplay={_this.props.changeDisplay}
         />
    })
    return (
        <div className="Player-list">
          <div className="Player-list-title">Players</div>
          {allPlayers}
        </div>
      )
  }
}

class SummonerDisplay extends React.Component{

  _createCategoryNamesRow(playerStats){
    //create the row displaying the category names for the chart of statistics
    var categories = [];
    categories.push(<div key='Game #' className="Statistic-item"> Game # </div>);
    for (var statistic in playerStats){
      if (playerStats.hasOwnProperty(statistic)) {
        categories.push(<div key={statistic} className="Statistic-item"> {statistic} </div>);
      }
    }
    return categories;
  }

  _createChartJSX(playerStats){
    //create the jsx for the chart of statistics showing each player's last 10 games
    var chart =[];
    for (var i = 0; i < 10; i ++){
      //create one row of statistics for each game
      var row = [<div key={'Game#'+i} className="Statistic-item"> {i} </div>];
      for (var statistic in playerStats){
        //for each statistic, create a div with the value inside
        if (playerStats.hasOwnProperty(statistic)) {
          row.push(<div key={statistic + i} className="Statistic-item"> {playerStats[statistic][i]} </div>);
        }
      }
      chart.push(<div key={i} className="Display-chart-row">{row}</div>);
    }
    return chart;
  }

  componentDidUpdate() {
    // Get the components DOM node
    var element = ReactDOM.findDOMNode(this);

    // Set the opacity of the element to 0\
    element.style.opacity = 0;
    
    window.requestAnimationFrame(function() {
        element.style.transition = "opacity 700ms";
        // Change opacity to 1
        element.style.opacity = 1;
    });
  }

  render(){
    if (this.props.playerData){

      var playerStats = this.props.playerData.playerStats;

      //create the row displaying the category names for the chart of statistics
      var categories = this._createCategoryNamesRow(playerStats);

      //create the jsx for the chart of statistics showing each player's last 10 games
      var chart = this._createChartJSX(playerStats);

      return (
        <div className="Summoner-display">
          <div className="Display-name"> {this.props.playerData.playerName} </div>
          <div className="Display-categories">{categories}</div>
          {chart}
        </div>
      );

    }else{

      //if there are no players in the league, show directions, not chart
      return(
        <div className="Summoner-display">
          <div className="Display-name"> Welcome to Fantasy League! </div>
          <p>{"<---"} Enter Your Name :D</p>
        </div>
      )

    }
  }
}

ReactDOM.render(
  <App />,
  document.getElementById('root')
);
