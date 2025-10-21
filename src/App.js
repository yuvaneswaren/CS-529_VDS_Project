import React, { useState, useEffect } from 'react';
import './App.css';
import Whitehat from './Whitehat';
import WhiteHatStats from './WhiteHatStats';
import Blackhat from './Blackhat';
import BlackHatStats from './BlackHatStats';
import * as d3 from 'd3';

function App() {
  const [viewToggle, setViewToggle] = useState('blackhat');
  const [map, setMap] = useState();
  const [gunData, setGunData] = useState();
  const [zoomedState, setZoomedState] = useState();
  const [selectedStuff, setSelectedStuff] = useState();
  const [brushedState, setBrushedState] = useState();
  const [sortKey, setSortKey] = useState('age');

  // load map
  async function fetchMap() {
    fetch('us-states.geojson')
      .then(paths => paths.json())
      .then(data => setMap(data));
  }

  // load gun data
  async function fetchGunData() {
    fetch('processed_gundeaths_data.json')
      .then(d => d.json())
      .then(gd => {
        console.log('gundata', gd);
        setGunData(gd);
      });
  }

  useEffect(() => {
    fetchMap();
    fetchGunData();
  }, []);

  // -------------------------------
  // 1️⃣ Whitehat View
  // -------------------------------
  function makeWhiteHat() {
    return (
      <>
        <div style={{ width: '100%', height: '50%', display: 'inline-block' }}>
          <div
            style={{
              height: '100%',
              width: 'calc(100% - 15em)',
              display: 'inline-block',
            }}
          >
            <Whitehat
              map={map}
              data={gunData}
              ToolTip={ToolTip}
              zoomedState={zoomedState}
              setSelectedStuff={setSelectedStuff}
              setZoomedState={setZoomedState}
              brushedState={brushedState}
              setBrushedState={setBrushedState}
            />
          </div>
          <div
            className="shadow"
            style={{
              height: '100%',
              width: '14em',
              display: 'inline-block',
              verticalAlign: 'text-bottom',
            }}
          >
            <h1>Instructions</h1>
            <p>Click on each state to zoom and unzoom</p>
          </div>
        </div>
        <div style={{ height: '49%', width: '99%' }}>
          <div
            className="title"
            style={{
              height: '2em',
              width: '100%',
              fontWeight: 'bold',
              fontFamily: 'Georgia',
            }}
          >
            Gun Deaths
          </div>
          <div
            style={{
              height: 'calc(100% - 2em)',
              width: '50%',
              maxWidth: '60em',
              marginLeft: '25%',
            }}
          >
            <WhiteHatStats
              data={gunData}
              ToolTip={ToolTip}
              brushedState={brushedState}
              setBrushedState={setBrushedState}
              zoomedState={zoomedState}
            />
          </div>
        </div>
      </>
    );
  }

  // -------------------------------
  // 2️⃣ Blackhat View
  // -------------------------------
  function makeBlackHat() {
    return (
      <>
        <div style={{ width: '100%', height: '50%', display: 'inline-block' }}>
          <div
            style={{
              height: '100%',
              width: 'calc(100% - 15em)',
              display: 'inline-block',
            }}
          >
            <Blackhat
              map={map}
              data={gunData}
              ToolTip={ToolTip}
              zoomedState={zoomedState}
              setSelectedStuff={setSelectedStuff}
              setZoomedState={setZoomedState}
              brushedState={brushedState}
              setBrushedState={setBrushedState}
            />
          </div>
          <div
            className="shadow"
            style={{
              height: '100%',
              width: '14em',
              display: 'inline-block',
              verticalAlign: 'text-bottom',
            }}
          >
            <h1>Instructions</h1>
            <p>Click on each state to zoom and unzoom</p>
          </div>
        </div>
        <div style={{ height: '49%', width: '99%' }}>
          <div
            className="title"
            style={{
              height: '2em',
              width: '100%',
              fontWeight: 'bold',
              fontFamily: 'Georgia',
            }}
          >
            Gun Deaths
          </div>
          <div
            style={{
              height: 'calc(100% - 2em)',
              width: '50%',
              maxWidth: '60em',
              marginLeft: '25%',
            }}
          >
            <BlackHatStats data={gunData} ToolTip={ToolTip} />
          </div>
        </div>
      </>
    );
  }

  // -------------------------------
  // 3️⃣ Third View (Hello)
  // -------------------------------
  function makeThirdView() {
    return (
      <div style={{ textAlign: 'center', marginTop: '100px' }}>
        <h1>Leadership Levers in Nonprofit Governance: Peer Benchmarks for Board Structure & Executive Compensation in Chicago</h1>
        <h3>Jegadit Sakthi Saravanan, Yuvaneswaren Ramakrishnan Sureshbabu, Shrinisha Nirmalkumar</h3>
      </div>
    );
  }

  // -------------------------------
  // View switcher
  // -------------------------------
  const hat = () => {
    if (viewToggle === 'whitehat') {
      return makeWhiteHat();
    } else if (viewToggle === 'blackhat') {
      return makeBlackHat();
    } else if (viewToggle === 'thirdview') {
      return makeThirdView();
    } else {
      return <h2>Unknown View</h2>;
    }
  };

  // -------------------------------
  // Render buttons + selected view
  // -------------------------------
  return (
    <div className="App">
      <div className="header" style={{ height: '2em', width: '100vw' }}>
        <button
          onClick={() => setViewToggle('whitehat')}
          className={viewToggle === 'whitehat' ? 'inactiveButton' : 'activeButton'}
        >
          White Hat
        </button>
        <button
          onClick={() => setViewToggle('blackhat')}
          className={viewToggle === 'blackhat' ? 'inactiveButton' : 'activeButton'}
        >
          Black Hat
        </button>
        <button
          onClick={() => setViewToggle('thirdview')}
          className={viewToggle === 'thirdview' ? 'inactiveButton' : 'activeButton'}
        >
          Third View
        </button>
      </div>

      <div
        className="body"
        style={{ height: 'calc(100vh - 2.5em)', width: '100vw' }}
      >
        {hat()}
      </div>
    </div>
  );
}

// -------------------------------
// Tooltip Utility
// -------------------------------
class ToolTip {
  static moveTTip(tTip, tipX, tipY) {
    var tipBBox = tTip.node().getBoundingClientRect();
    while (tipBBox.width + tipX > window.innerWidth) {
      tipX = tipX - 10;
    }
    while (tipBBox.height + tipY > window.innerHeight) {
      tipY = tipY - 10;
    }
    tTip
      .style('left', tipX + 'px')
      .style('top', tipY + 'px')
      .style('visibility', 'visible')
      .style('z-index', 1000);
  }

  static moveTTipEvent(tTip, event) {
    var tipX = event.pageX + 30;
    var tipY = event.pageY - 20;
    this.moveTTip(tTip, tipX, tipY);
  }

  static hideTTip(tTip) {
    tTip.style('visibility', 'hidden');
  }

  static addTTipCanvas(tTip, className, width, height) {
    tTip.selectAll('svg').selectAll('.' + className).remove();
    let canvas = tTip
      .append('svg')
      .attr('class', className)
      .attr('height', height)
      .attr('width', width)
      .style('background', 'white');
    return canvas;
  }
}

export default App;
