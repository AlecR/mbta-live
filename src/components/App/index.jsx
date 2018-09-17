import React, { Component } from 'react';
import './App.css';
import Map from '../Map';

class App extends Component {
  render() {
    return (
      <div className='app__wrapper'>
        <Map
          googleMapURL={`https://maps.googleapis.com/maps/api/js?key=AIzaSyDqf1COGwTw6HV09xo4LnmjL3Y7SP1MpK4&v=3.exp&libraries=geometry,drawing,places`}
          loadingElement={<div style={{ height: `100%` }} />}
          containerElement={<div style={{ height: `100%`, width: `100%` }} />}
          mapElement={<div style={{ height: `100%`, width: `100%` }} />}
        />
        {/* <div className='app__attribution-wrapper'>
          <div>Data Provided By:</div>
          <img 
            className='app__attribution-image'
            src='mbta-logo.png' 
          />
        </div> */}
      </div>
    );
  }
}

export default App;
1