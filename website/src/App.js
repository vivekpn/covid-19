import React from 'react';
import { GoogleMap, Marker, LoadScript } from '@react-google-maps/api'
import { LineChart, Line, XAxis, Tooltip, CartesianGrid } from 'recharts';

const moment = require("moment");


const firebase = require("firebase");
require("firebase/firestore");
const firebaseConfig = require('./firebaseConfig.json');
firebase.initializeApp(firebaseConfig);

const db = firebase.firestore();

var Hospitals = require('./hospitals.json');

function snapshotToArrayData(snapshot) {
  var returnArr = []
  snapshot.forEach(function (childSnapshot) {
    returnArr.push(childSnapshot.data());
  });
  return returnArr;
}

async function getCountyList() {
  let counties = await db.collection("US_COUNTIES")
    .where("hasData", "==", true)
    .get().then((querySnapshot) => {
      return snapshotToArrayData(querySnapshot);
    });
  return counties;
}

async function getCountyFromDb(state_short_name, county_name) {
  let counties = await db.collection("US_COUNTIES")
    .where("STATE_SHORT_NAME", "==", state_short_name)
    .where("NAME", "==", county_name)
    .get().then((querySnapshot) => {
      return snapshotToArrayData(querySnapshot);
    });

  if (counties.length === 1) {
    return counties[0];
  }

  if (counties && counties.length !== 0) {
    console.log("duplicate counties names in the same state");
    console.log(counties);
  }
  return null;
}

const USCountyInfo = (props) => {
  const [county, setCounty] = React.useState(null);

  React.useEffect(() => {
    getCountyFromDb(props.state, props.county).then(c => {
      setCounty(c);
    });
  }, [props.state, props.county]);

  if (!county) return <div>loading</div>;

  console.log(county);

  return <div>
    {county.NAME},
    {county.STATE_NAME},
    Total:  TBD
    <div>
      <BasicGraph
        confirmed={county.DataConfirmed}
        deaths={county.DataDeath}
        recovered={county.DataRecovered}
      />
    </div>
  </div>;
};

const USCountyList = (props) => {
  React.useEffect(() => {
    getCountyList().then(counties => {
      // console.log(counties);
    });
  }, []);
  return <div>Placeholder</div>;
};

function countyDataToGraphData(confirmed, deaths, recovered) {
  let r = {};
  r = Object.entries(confirmed).reduce((m, item) => {
    let a = m[item[0]];
    if (!a) {
      a = {};
    }
    a.confirmed = item[1];
    m[item[0]] = a;
    return m;
  }, r);

  r = Object.entries(deaths).reduce((m, item) => {
    let a = m[item[0]];
    if (!a) {
      a = {};
    }
    a.deaths = item[1];
    m[item[0]] = a;
    return m;
  }, r);

  r = Object.entries(recovered).reduce((m, item) => {
    let a = m[item[0]];
    if (!a) {
      a = {};
    }
    a.recovered = item[1];
    m[item[0]] = a;
    return m;
  }, r);


  let sorted_keys = Object.keys(r).sort(function (a, b) {
    return moment(a).toDate() - moment(b).toDate();
  });

  console.log(sorted_keys);

  return sorted_keys.map(key => {
    let v = r[key];
    return {
      name: key,
      confirmed: Number(v.confirmed),
      deaths: Number(v.deaths),
      recovered: Number(v.recovered),
    };
  });
}

const BasicGraph = (props) => {
  const data = countyDataToGraphData(
    props.confirmed,
    props.deaths,
    props.recovered,
  );
  console.log(data);

  return <div><LineChart
    width={400}
    height={400}
    data={data}
    margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
  >
    <XAxis dataKey="name" />
    <Tooltip />
    <CartesianGrid stroke="#f5f5f5" />
    <Line type="monotone" dataKey="confirmed" stroke="#ff7300" yAxisId={0} />
    {/* <Line type="monotone" dataKey="deaths" stroke="#387908" yAxisId={0} /> */}
    {/* <Line type="monotone" dataKey="recovered" stroke="#3879ff" yAxisId={0} /> */}
  </LineChart></div>;
}

const BasicMap = (props) => {
  const center = {
    lat: 44.58,
    lng: -96.451580,
  }

  let hospitals = Hospitals.features.map(a => {
    return <Marker position={{
      lat: a.geometry.coordinates[1],
      lng: a.geometry.coordinates[0],
    }}
      title={a.properties.NAME}
    />;
  })


  return <div className='map'>
    <div className='map-container'>
      <LoadScript
        id="script-loader"
        googleMapsApiKey={firebaseConfig.apiKey}
      >
        <GoogleMap
          id='traffic-example'
          mapContainerStyle={{
            height: "100vh",
            width: "100%"
          }}
          zoom={4}
          center={center}
        >
          <Marker position={center} />
          {hospitals}
        </GoogleMap>
      </LoadScript>
    </div>
  </div>;
}

function App() {

  return (
    <div className="App">
      <header className="App-header">
        <USCountyList />
        <USCountyInfo
          county="Santa Clara"
          state="CA"
        />
        <div>
          US Hospitals
      </div>
        <BasicMap />
      </header>
    </div>
  );
}

export default App;
