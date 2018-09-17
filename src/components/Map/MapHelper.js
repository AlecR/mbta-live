const getRoutes = (callback) => {
  fetch("https://api-v3.mbta.com/routes?filter%5Btype%5D=2", {
    header: {
      "accept": "application/vnd.api+json",
      "x-api-key": "330814ce93be4fbda93a71fe1961c55a"
    }
   }).then(res => {
     return res.json()
   }).then(json => {

     const routeData = json.data.map(route => ({
       name: route.attributes.long_name,
       id: route.id,
       polylines: []
     }))
     callback(routeData)
   })
}

const getRouteShapes = (routeIds, callback) => {
  fetch(`https://api-v3.mbta.com/shapes?filter%5Broute%5D=${routeIds}`, {
    header: {
      "accept": "application/vnd.api+json",
      "x-api-key": "330814ce93be4fbda93a71fe1961c55a"
    }
   }).then(res => {
     return res.json()
   }).then(json => {
     const shapeData = json.data.map(shape => ({
       polyline: shape.attributes.polyline,
       route: shape.relationships.route.data.id
     }))
     callback(shapeData);
   })
}

const getStops = (routeIds, callback) => {
  let requestUrl = 'https://api-v3.mbta.com/stops?';
  if(routeIds) {
    requestUrl += `filter%5Broute%5D=${routeIds}`;
  } else {
    requestUrl += 'filter%5Broute_type%5D=2';
  }
  fetch(requestUrl, {
    header: {
      "accept": "application/vnd.api+json",
      "x-api-key": "330814ce93be4fbda93a71fe1961c55a"
    }
   }).then(res => {
     return res.json()
   }).then(json => {
    const stopData = json.data.map(stop => ({
      name: stop.attributes.name,
      id: stop.id,
      latitude: stop.attributes.latitude,
      longitude: stop.attributes.longitude
    }))
     callback(stopData);
   })
}

const getPredictionsForStop = (stopId, callback) => {
  const formattedStopId = encodeURIComponent(stopId.trim())
  const direction_ids = [0, 1]
  const requestData = direction_ids.map(direction_id => ({
    url: `https://api-v3.mbta.com/predictions?sort=arrival_time&filter%5Bdirection_id%5D=${direction_id}&filter%5Bstop%5D=${formattedStopId}`,
    direction_id
  }))
  const promises = requestData.map(request => (
    fetch(request.url, {
      header: {
        "accept": "application/vnd.api+json",
        "x-api-key": "330814ce93be4fbda93a71fe1961c55a"
      }
    }).then(res => {
     return res.json(); 
    }).then(json => ({
      predictions: json.data,
      direction_id: request.direction_id
    }))
  ))
  Promise.all(promises).then(responses => {
    const predictions = {}
    console.log(responses);
    responses.forEach(res => {
      const key = res.direction_id === 0 ? 'outbound' : 'inbound';
      let prediction = null
      if (res.predictions.length > 0) {
        const mostRecentPrediction = res.predictions[0]
        const arrivalTime = new Date(mostRecentPrediction.attributes.arrival_time)
        const formattedArrivalTime = arrivalTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        prediction = formattedArrivalTime;
      }
      predictions[key] = prediction
    })
    callback(predictions)
  })
}

const getNextScheduledForStop = (stopId, callback) => {
  
}

const getCurrentVehicleData = (routeIds, callback) => {
  fetch(`https://api-v3.mbta.com/vehicles?filter%5Broute%5D=${routeIds}`, {
    header: {
      "accept": "application/vnd.api+json",
      "x-api-key": "330814ce93be4fbda93a71fe1961c55a"
    }
   }).then(res => {
     return res.json()
   }).then(json => {
     let vehicles = {};
     json.data.forEach(vehicle => {
       vehicles[vehicle.id] = {
          inbound: vehicle.attributes.direction_id === 1,
          location: {
            latitude: vehicle.attributes.latitude,
            longitude: vehicle.attributes.longitude
          }
        }
     });
    callback(vehicles);
   })
}

const listenForVehicleUpdates = callback => {
  const eventSource = new EventSource("https://api-v3.mbta.com/vehicles?api_key=330814ce93be4fbda93a71fe1961c55a");
  const events = ['add', 'update', 'remove', 'reset'];

  events.forEach(event => {
    eventSource.addEventListener(event, function(e) {
      callback(event, e.data)
    }, false);
  })
}



export default { 
  getRoutes, 
  getRouteShapes, 
  getStops, 
  getCurrentVehicleData, 
  getPredictionsForStop,
  listenForVehicleUpdates,
}
