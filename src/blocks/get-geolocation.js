import React, {Component} from 'react';
import LocationSearching from 'material-ui-icons/LocationSearching';
import Loop from 'material-ui-icons/Loop';
import {GLOBAL_STYLE} from "../config";

export class GetGeolocationButton extends Component {

    static propTypes = {};

    static defaultProps = {};

    constructor(props) {
        super(props);
        this.state = this.initialState;
        this.onClick = this.onClick.bind(this);
        this.geolocation = this.geolocation.bind(this);
        this.searchLocation = this.searchLocation.bind(this);
        this.isLocationAuthorized = this.isLocationAuthorized.bind(this);
        this.AdvancedGeolocation = this.AdvancedGeolocation.bind(this);
    }

    get initialState() {
        return {
            loading: false
        }
    }

    searchLocation() {
        console.log('searchLocation');
        try {
            let locationAccuracy = new Promise((resolve, reject) => {
                cordova.plugins.locationAccuracy.canRequest(
                    (canRequest) => {
                        if (canRequest) {
                            cordova.plugins.locationAccuracy.request(
                                () => {
                                    console.log("Request successful  locationAccuracy");
                                    resolve(canRequest);
                                },
                                (error) => {
                                    console.log("Request failed locationAccuracy:", error);
                                    reject(error);
                                    if (error) {
                                        // Android only
                                        console.error("error code=" + error.code + "; error message=" + error.message);
                                        if (error.code !== cordova.plugins.locationAccuracy.ERROR_USER_DISAGREED) {
                                            if (window.confirm("Не удалось автоматически установить режим местоположения на «Высокая точность». Вы хотите перейти на страницу настроек местоположения и сделать это вручную?")) {
                                                cordova.plugins.diagnostic.switchToLocationSettings();
                                            }
                                        }
                                    }
                                },
                                cordova.plugins.locationAccuracy.REQUEST_PRIORITY_HIGH_ACCURACY // iOS will ignore this
                            );
                        }
                    });
            }).then((res) => {
                this.isLocationAuthorized();
                console.log('response:', res)
            }).catch((error) => {
                this.isLocationAuthorized();

                console.log('error:', error)
            })


        } catch (err) {
            this.isLocationAuthorized();

            console.log(err);
        }

    }

    isLocationAuthorized() {
        try {
            cordova.plugins.diagnostic.isLocationAuthorized((enabled) => {
                console.log("Location is " + (enabled ? "enabled" : "disabled"));

                if (!enabled) {
                    cordova.plugins.diagnostic.requestLocationAuthorization((status) => {
                        console.log("Authorization status is now: " + status);
                    }, (error) => {
                        this.setState({loading: false});

                        console.error(error);
                    });
                } else {
                    this.AdvancedGeolocation();
                }
            }, (error) => {
                this.AdvancedGeolocation();

                console.error("The following error occurred: " + error);
            });


        } catch (err) {
            console.error(err);
            this.AdvancedGeolocation();
        }
    }

    AdvancedGeolocation() {
        try {
            const onMapSuccess = this.props.onMapSuccess;
            let result = new Promise((resolve, reject) => {
                AdvancedGeolocation.start((success) => {
                        try {
                            let jsonObject = JSON.parse(success);
                            console.log(jsonObject);
                            switch (jsonObject.provider) {
                                case "gps":
                                    //TODO
                                    break;

                                case "network":
                                    if ('latitude' in jsonObject) {
                                        resolve(jsonObject);
                                    }
                                    break;

                                case "satellite":
                                    //TODO
                                    break;

                                case "cell_info":
                                    //TODO
                                    break;

                                case "cell_location":
                                    //TODO
                                    break;

                                case "signal_strength":
                                    //TODO
                                    break;
                            }
                        }
                        catch (exc) {
                            console.log("Invalid JSON: " + exc);
                        }
                    },
                    function (error) {
                        console.log("ERROR! " + JSON.stringify(error));
                    },
                    {
                        "minTime": 0,         // Min time interval between updates (ms)
                        "minDistance": 0,       // Min distance between updates (meters)
                        "noWarn": true,         // Native location provider warnings
                        "providers": "all",     // Return GPS, NETWORK and CELL locations
                        "useCache": true,       // Return GPS and NETWORK cached locations
                        "satelliteData": false, // Return of GPS satellite info
                        "buffer": false,        // Buffer location data
                        "bufferSize": 0,        // Max elements in buffer
                        "signalStrength": false // Return cell signal strength data
                    });
            }).then((resolve) => {
                this.setState({loading: false});
                this.props.onMapSuccess(resolve.latitude, resolve.longitude);
                AdvancedGeolocation.stop();
            }).catch((error) => {
                console.log(error);
                this.geolocation();
            })

        } catch (err) {
            console.error(err);
            this.geolocation();
        }
    }

    geolocation() {
        let timeout = 20 * 1000;
        let onMapSuccess = this.props.onMapSuccess;
        const searchLocation = this.searchLocation;
        let gps = new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition((position) => {
                    console.log('Latitude: ' + position.coords.latitude + '\n' +
                        'Longitude: ' + position.coords.longitude + '\n' +
                        'Altitude: ' + position.coords.altitude + '\n' +
                        'Accuracy: ' + position.coords.accuracy + '\n' +
                        'Altitude Accuracy: ' + position.coords.altitudeAccuracy + '\n' +
                        'Heading: ' + position.coords.heading + '\n' +
                        'Speed: ' + position.coords.speed + '\n' +
                        'Timestamp: ' + position.timestamp + '\n');

                    resolve(position);
                },
                (error) => {

                    console.log('code: ' + error.code + '\n' +
                        'message: ' + error.message + '\n');
                    searchLocation();
                    reject(error);
                }, {
                    timeout: timeout,
                    enableHighAccuracy: true
                });
        }).then(values => {
            console.log(values);
            onMapSuccess(values.coords.latitude, values.coords.longitude);
            this.setState({loading: false});
        }).catch((error) => {
            searchLocation();
            console.log('error:', error)
        });

    }



    onClick() {
        if (!this.state.loading) {
            this.setState({loading: true});
            this.geolocation();
            // this.searchLocation();
        }
    }

    render() {
        const {loading} = this.state;
        return (
            <button onClick={() => {
                this.onClick();
                // this.props.onMapSuccess(46.456507,30.679062)
            }} type="button" style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                zIndex: 500,
                border: 'none',
                margin: '10px 10px 30px 10px',
                backgroundColor: GLOBAL_STYLE.GetGeolocationButton.backgroundColor,
                borderRadius: '2px',
                padding: '13px',
                lineHeight: 0,
                boxShadow: 'rgba(0, 0, 0, 0.3) 0px 1px 4px -1px'
            }}>
                {
                    !loading &&
                    <LocationSearching/>
                }
                {
                    loading &&
                    <Loop className="loading"/>
                }
            </button>
        )
    }

}