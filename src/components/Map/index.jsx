import React, { Component } from 'react';
import { withScriptjs, withGoogleMap, GoogleMap, Polyline, Marker, InfoWindow } from 'react-google-maps';
import MapHelper from './MapHelper.js';
import './Map.css'

class Map extends Component  {

  state = {
    routes: [],
    stops: [],
    vehicles: [],
    activeRoute: null,
    activeStop:  null,
    activeStopPredictions: null,
  }

  updates = []

  processUpdates = () => {
    const vehicles = this.state.vehicles
    this.updates.forEach(update => {
      switch(update.type) {
        case 'update':
          const vehicleData = JSON.parse(update.data);
          if (Object.keys(vehicles).includes(vehicleData.id)) {
            vehicles[vehicleData.id].location = {
              latitude: vehicleData.attributes.latitude,
              longitude: vehicleData.attributes.longitude
            }
          }
          break;
         default: break;
      }
    })
    this.updates = []
    this.setState({ vehicles });
  }

  componentDidMount() {
    MapHelper.getStops(null, stops => {
      this.setState({ stops });
    });

    MapHelper.listenForVehicleUpdates((type, data) => {
      this.updates.push({ type, data })
    })

    setInterval(() => this.processUpdates(), 2000);
    
    MapHelper.getRoutes(data => {
      const routes = data;
      let ids = routes.map(route => route.id);
      ids = ids.join(',');
      MapHelper.getRouteShapes(ids, polylineData => {
        polylineData.forEach(polyline => {
          for(let i = 0; i < routes.length; i++) {
            if(routes[i].id === polyline.route){
              routes[i].polylines.push(polyline.polyline);
              break;
            }
          }
        })
        this.setState({ routes })
      });
      MapHelper.getCurrentVehicleData(ids, vehicles => {
        this.setState({ vehicles });
      })
    })
  }

  render() {
    let polylines = this.state.routes.map(route => (
      route.polylines.map(polyline => ({
        polyline: polyline,
        route: route.id
      }))
    ));
    polylines = [].concat.apply([], polylines);
    return (
      <GoogleMap 
        defaultZoom={10}
        defaultCenter={{ lat: 42.361145, lng: -71.057083 }}
        ref='map'
      >
        {polylines.map(polyline => {
          const path = window.google.maps.geometry.encoding.decodePath(polyline.polyline);
          const active = this.state.activeRoute === null || this.state.activeRoute === polyline.route
          return (
            <Polyline 
              path={path}
              className= { active ? 'polyline--active' : 'polyline'}
              key={`route-${polyline.polyline}`}
              options={{
                strokeColor: active ? "#762f69" : "#e9c8e3",
                zIndex: active ? 10 : 1
              }}
              onClick={() => {
                const activeRoute = polyline.route;
                MapHelper.getStops(activeRoute, stops => {
                  this.setState({ stops, activeRoute });
                })
              }}
            />
          )
        })}
        {this.state.stops.map(stop => {
          return (
            <Marker
              position={{ lat: stop.latitude, lng: stop.longitude }}
              title={stop.name}
              key={`stop-${stop.name}`}
              icon={{
                url: 'commuter-rail-station.png',
                size: new window.google.maps.Size(20, 20),
                origin: new window.google.maps.Point(0, 0),
                anchor: new window.google.maps.Point(10, 10),
              }}
              clickable={true}
              onClick={() => {
                this.setState({ activeStop: stop.id });
                MapHelper.getPredictionsForStop(stop.id, predictions => {
                  this.setState({ activeStopPredictions: predictions })
                })
              }}
              options={{
                zIndex: 15,
                optimized: false
              }}
            >
              {this.state.activeStop === stop.id ? (
                <InfoWindow 
                  onCloseClick={() => this.setState({ selectedStop: null })}
                >
                  <div>
                    <div><b>{stop.name}</b></div>
                    {this.state.activeStopPredictions ? (
                      <div>
                        <p>Next Inbound Train: {this.state.activeStopPredictions.inbound}</p>
                        <p>Next Outbound Train: {this.state.activeStopPredictions.outbound}</p>
                      </div>
                    ) : null}
                  </div>
                </InfoWindow>
              ): null}
            </Marker>
          )
        })}
        {Object.keys(this.state.vehicles).map(vehicleId => {
          const vehicle = this.state.vehicles[vehicleId];
          return (
            <Marker
              position={{ lat: vehicle.location.latitude, lng: vehicle.location.longitude }}
              key={`vehicle-${vehicleId}`}
              icon={{
                url: 'commuter-rail-train.png',
                size: new window.google.maps.Size(40, 29),
                origin: new window.google.maps.Point(0, 0),
                anchor: new window.google.maps.Point(20, 14.5),
              }}
              options={{
                zIndex: 100
              }}
            />
          )
        })}
      </GoogleMap>
    )
  }
}

export default withScriptjs(withGoogleMap(Map));