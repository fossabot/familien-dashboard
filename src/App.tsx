import * as React from 'react';
import SearchResults from './Components/SearchResults';
import SearchBar from './Components/SearchBar';
import LunchMap from './Components/LunchMap';
import GeoSelector from './Components/GeoSelector';
import SearchService from './Services/SearchService';
import { DistrictService } from './Services/districtService';
import './App.css';
import { IDistrictResultSlim } from './FrontPage';

export interface ISearchParams {
  latitude: number;
  longitude: number;
  datetime: string;
  searchQuery: string;
  selectedId: number;
  category: string;
  district: string;
  centerLat?: number
  centerLon?: number
}

export interface ISearchResult {
  id: number;
  lat: number;
  lon: number;
  distance: number;
  name: string;
  description: string;
  properties: any;
  type: string;
  url: string;
  dateStart: string;
  dateEnd: string;
  address?: string;
}

interface IAppProps {
}

class App extends React.Component<IAppProps, any> {

  private lastSearchHash = '-';
  private searchService: SearchService;
  private hasGeoSelector = false;

  constructor(props: IAppProps) {
    super(props);
    this.searchService = new SearchService();
    this.state = {
      results: [],
      searchParams: {},
      districts: [],
      district: {}
    };
    new DistrictService().loadDistricts(
      (results: any) => {
        this.setState({districts: results});
      }
    );
  }

  public render() {
    return (
      <div className="container is-fluid">
        <SearchBar updateHandler={this.updateSearchParams} searchParams={this.state.searchParams} districts={this.state.districts} />

        <div className="tile is-ancestor">
          <div className="tile is-parent">

            <div className="tile">

              <LunchMap
                results={this.state.results}
                updateHandler={this.updateSearchParams}
                searchParams={this.state.searchParams}
                districtPolygon={this.state.district}
              />
            </div>
          </div>
          <div className="tile is-parent">
            <div className="tile">
              <div className="article mainContent">
                <div className="innerContent detailedItem">
                  {/* Geoselector will only be shown if you forbid GEO position access in your browser */}
                  {this.hasGeoSelector
                    && <GeoSelector updateHandler={this.updateSearchParams} searchParams={this.state.searchParams} />}
                  <SearchResults
                    updateHandler={this.updateSearchParams}
                    results={this.state.results}
                    searchParams={this.state.searchParams}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  public componentDidMount() {

    this.getBrowserLocation();
  }

  /*
   * Update search params in this.state
   * - and restart search if necessary
   * - and also update this.state.results
   */
  private updateSearchParams = (searchParams: ISearchParams, district?: IDistrictResultSlim) => {

    const newState: { searchParams: ISearchParams, district: null | IDistrictResultSlim } = { searchParams: searchParams, district: null };

    if (district) {
      newState.district = district;
    }
    this.setState(newState);

    const searchHash = '' + searchParams.searchQuery + searchParams.latitude + searchParams.longitude + searchParams.category + searchParams.district;

    if (searchHash !== this.lastSearchHash) {
      this.searchService.sendSearchToServer(
        searchParams,
        (locations: ISearchResult[]) => {
          this.setState({ results: locations });
        }
      );
    }
    this.lastSearchHash = searchHash;
  }

  private getBrowserLocation() {

    if (!navigator.geolocation) {
      console.log('<p>Geolokation wird von ihrem Browser nicht unterstützt</p>');
      return;
    }

    let success = (position: any) => {
      const latitude  = position.coords.latitude;
      const longitude = position.coords.longitude;
      let searchParams = this.state.searchParams;
      searchParams.latitude = latitude;
      searchParams.longitude = longitude;
      this.updateSearchParams(searchParams);
    };

    let error = () => {
      console.log( 'Es war nicht möglich Sie zu lokalisieren');
      let searchParams = this.state.searchParams;
      searchParams.latitude = 51.9624047;
      searchParams.longitude = 7.6255008;
      this.hasGeoSelector = true;
      this.updateSearchParams(this.state.searchParams);
    };

    navigator.geolocation.getCurrentPosition(success, error);
  }

}

export default App;
