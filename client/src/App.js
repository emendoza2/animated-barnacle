import React from 'react';
import logo from './logo.svg';
import './App.css';

// function getParameterByName(name, url) {
//   if (!url) url = window.location.href;
//   name = name.replace(/[[\]]/g, '\\$&');
//   var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
//     results = regex.exec(url);
//   if (!results) return null;
//   if (!results[2]) return '';
//   return decodeURIComponent(results[2].replace(/\+/g, ' '));
// }

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = { apiResponse: "", input: "" };

    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  callAPI() {
    fetch("http://localhost:9000/ppp/person?n=" + encodeURI(this.state.input))
      .then(res => res.json())
      .then(res => { console.log(res); this.setState({ apiResponse: res.teamNumber }) });
  }

  componentDidMount() {

  }

  handleChange(e) {
    let state = {
      input: e.target.value
    }
    this.setState(state);
  }

  handleSubmit(e) {
    this.callAPI();
  }

  render() {
    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          {this.state.apiResponse !== "" && this.input !== "" &&
            <>
              <p>
                Your team number is:&nbsp; 
                <a
                  className="App-link"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {this.state.apiResponse}
                </a>
              </p>
            </>
          }
          <input 
            type="text" 
            onChange={this.handleChange} 
            placeholder="Your name" 
          />
          <input 
            type="button"
            value="Submit"
            onClick={this.handleSubmit} 
          />
        </header>
      </div>
    );
  }
}

export default App;
