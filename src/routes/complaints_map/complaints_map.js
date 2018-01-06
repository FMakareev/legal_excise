import React, {Component} from 'react';
import {withScriptjs, withGoogleMap, GoogleMap, Marker} from "react-google-maps"
import Button from 'material-ui/Button';
import {compose, withProps, withHandlers} from "recompose";
import AppBar from 'material-ui/AppBar';
import Toolbar from 'material-ui/Toolbar';
import {getFormValues} from "redux-form";
import {connect} from "react-redux";
import {Dialog} from "material-ui";
import Typography from 'material-ui/Typography';
import IconButton from 'material-ui/IconButton';
import ArrowBack from 'material-ui-icons/ArrowBack';
import {FORM_ADD_LATLNG, FORM_REMOVE_LATLNG} from "../../store/reducers";

import LocationSearching from 'material-ui-icons/LocationSearching';


const MapWithAMarkerClusters = compose(
    withProps({
        googleMapURL: "https://maps.googleapis.com/maps/api/js?v=3.exp&libraries=geometry,drawing,places&key=AIzaSyApwO-qq_ruPB3MZ8yk1RsAFeucrb0mUX0",
        loadingElement: (<div></div>),
        containerElement: <div style={{
            height: `calc(100vh - 118px)`,
            marginTop: '64px',
            position: 'relative'
        }}/>,
        mapElement: <div style={{height: `100%`}}/>,
    }),
    withHandlers({}),
    withScriptjs,
    withGoogleMap
)(props =>
    <GoogleMap
        defaultZoom={props.zoom}
        defaultCenter={props.center}
        center={props.center}
        zoom={props.zoom}
        onClick={props.onClickMap}
    >
        <Marker
            position={props.markerPos}
        />
        <button onClick={props.searchLocation} type="button" style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            zIndex: 100,
            border: 'none',
            margin: '10px 10px 30px 10px',
            backgroundColor: 'rgb(255, 255, 255)',
            borderRadius: '2px',
            padding: '8px',
            lineHeight: 0,
            boxShadow: 'rgba(0, 0, 0, 0.3) 0px 1px 4px -1px'
        }}>
            <LocationSearching/>
        </button>
    </GoogleMap>
);

@connect(
    state => ({ // получаем данные из store
        currentLocal: state.intl,
        values: getFormValues('FormComplaints')(state),
        state: state.form.FormComplaints,
    }),
    dispatch => ({
        dispatch: (type, payload) => {
            dispatch({type, payload})
        }
    })
)
export class ComplaintsMap extends Component {

    static propTypes = {};

    static defaultProps = {};

    constructor(props) {
        super(props);
        this.state = this.initialState;
        this.onClickMap = this.onClickMap.bind(this);
        this.onSave = this.onSave.bind(this);
        this.onCancel = this.onCancel.bind(this);
        this.searchLocation = this.searchLocation.bind(this);
        this.onMapSuccess = this.onMapSuccess.bind(this);
    }

    get initialState() {
        return {
            markerPos: {
                lat: null,
                lng: null,
            }
        }
    }

    onClickMap(event) {
        this.setState({
            markerPos: {
                lat: event.latLng.lat(),
                lng: event.latLng.lng(),
            }
        });

        this.props.dispatch(FORM_ADD_LATLNG, {
            lat: event.latLng.lat(),
            lng: event.latLng.lng(),
        });
        return event
    }

    onSave() {

        this.props.toggleHandle(false)
    }

    onCancel() {
        delete this.props.values.lat;
        delete this.props.values.lng;
        this.props.dispatch(FORM_REMOVE_LATLNG, this.props.values);
        this.setState({
            markerPos: {
                lat: null,
                lng: null,
            }
        });
        this.props.toggleHandle(false)
    }

    searchLocation() {
        try {
            const onMapSuccess = this.onMapSuccess;
            const onMapError = this.onMapError;

            cordova.plugins.locationAccuracy.canRequest(function (canRequest) {
                if (canRequest) {
                    cordova.plugins.locationAccuracy.request(function () {
                            console.log("Request successful");
                            cordova.plugins.diagnostic.isLocationAuthorized(function (enabled) {
                                console.log("Location is " + (enabled ? "enabled" : "disabled"));
                                navigator.geolocation.getCurrentPosition(onMapSuccess, onMapError, {enableHighAccuracy: true});
                                if (!enabled) {
                                    cordova.plugins.diagnostic.requestLocationAuthorization(function (status) {
                                        console.log("Authorization status is now: " + status);
                                    }, function (error) {
                                        console.error(error);
                                    });
                                }
                            }, function (error) {
                                console.error("The following error occurred: " + error);
                            });


                        }, function (error) {
                            console.error("Request failed");
                            if (error) {
                                // Android only
                                console.error("error code=" + error.code + "; error message=" + error.message);
                                if (error.code !== cordova.plugins.locationAccuracy.ERROR_USER_DISAGREED) {
                                    if (window.confirm("Failed to automatically set Location Mode to 'High Accuracy'. Would you like to switch to the Location Settings page and do this manually?")) {
                                        cordova.plugins.diagnostic.switchToLocationSettings();
                                    }
                                }
                            }
                        }, cordova.plugins.locationAccuracy.REQUEST_PRIORITY_HIGH_ACCURACY // iOS will ignore this
                    );
                }
            });


        } catch (err) {
            console.log(err)
        }
    }

    onMapSuccess(position) {
        console.log(position);
        const Latitude = position.coords.latitude;
        const Longitude = position.coords.longitude;
        this.setState({
            markerPos: {
                lat: Latitude,
                lng: Longitude,
            }
        });
    }

    onMapError(error) {
        console.log('code: ' + error.code + '\n' +
            'message: ' + error.message + '\n');
    }

    render() {
        console.log(this.props);
        return (
            <Dialog
                fullScreen
                open={this.props.open}
                onClose={() => {
                    this.props.toggleHandle(false)
                }}
                style={{
                    width: '100%',
                    margin: '0'
                }}
            >
                <div style={{
                    width: '100%',
                    margin: '0'
                }} className={'layout-children_header-wrapper'}>
                    <AppBar position="static" className={'layout-children_app-bar'}>
                        <Toolbar className={'layout-children_tool-bar'}>
                            <IconButton
                                onClick={() => {
                                    this.props.toggleHandle(false)
                                }}
                                className={'layout-children_arrow-button'}
                            >
                                <ArrowBack/>
                            </IconButton>
                            <Typography type="title" color="inherit" className={'layout-children_flex'}>
                                Укажите координаты
                            </Typography>
                        </Toolbar>
                    </AppBar>
                </div>
                <MapWithAMarkerClusters
                    center={{
                        lat: this.state.markerPos.lat ? this.state.markerPos.lat : 46.484583,
                        lng: this.state.markerPos.lng ? this.state.markerPos.lng : 30.7326,
                    }}
                    onClickMap={this.onClickMap}
                    zoom={10}
                    markerPos={{
                        lat: this.state.markerPos.lat ? this.state.markerPos.lat : 46.484583,
                        lng: this.state.markerPos.lng ? this.state.markerPos.lng : 30.7326,
                    }}
                    searchLocation={this.searchLocation}
                />
                <div style={{padding: '8px', display: 'flex', flexDirection: 'row', justifyContent: 'space-between'}}
                     className="complaints_section">
                    <Button type="button" raised onClick={this.onCancel}
                            style={{backgroundColor: '#b3e5fc', color: '#334148'}} color="primary">
                        Отмена
                    </Button>
                    <Button type="button" raised onClick={this.onSave}
                            style={{backgroundColor: '#b3e5fc', color: '#334148'}} color="primary">
                        Ок
                    </Button>
                </div>
            </Dialog>
        )
    }
}