import React, { Component } from 'react';
import Search from './Search';
import RestaurantList from './RestaurantList';
import RestaurantDetail from './RestaurantDetail';
import Cuisine from './Cuisine';
import Category from './Category';
import { getGeoCodeByLatLong, getCityID, getRestaurantsByCityID, getRestaurantsByCityIDAndCategories,
  getRestaurantsDetails, getRestaurantsByCityIDAndCuisines, getRestaurantsByCityIDAndCategoriesAndCuisines} from './api.js';

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      cityID: '',
      cityName: '',
      currentCity: '',
      restaurantList: [],
      favoriteRestaurants: [],
      categoryList: [],
      categoryResultValue: {},
      cuisineResultList: {},
      restaurantBody: null,
      restaurantID: '',
    }

  }

// manipulate the restaurant list to display the list of favorites
  viewMyFavorites = (event) => {
    event.preventDefault()
    this.handleCitySearchCriteria('viewFavorites', true);
  }
  /// either turn on the favorite toggle or turn it off depending on whether or not the restaurant is already a favorite
  handleFaveToggle = (restaurant) => {
    if (restaurant.hasOwnProperty('cuisines')) {
      let newRestaurant = { 'restaurant': restaurant }
      restaurant = newRestaurant
    }
    let faves = this.state.favoriteRestaurants;
    let myKeys = faves.filter(key => key.restaurant.id === restaurant.restaurant.id);
    if (myKeys.length > 0) {
      faves = faves.filter(key => key.restaurant.id !== restaurant.restaurant.id);
    } else {
      faves.push(restaurant);
    }
    this.setState({
      favoriteRestaurants: faves,
    })
  }

/// return a random restaurant from the restaurant list
  randRestaurant = (restrauntArr) => {
    let randRest = restrauntArr[Math.floor(Math.random() * restrauntArr.length)].restaurant
    return randRest
  }

  // use api to get back detailed information about a restaurant using the restrauntID
  handleRestaurantSearch = async (restaurantID) => {

    const results = await getRestaurantsDetails(restaurantID);

    this.setState({
      restaurantID: restaurantID,
      restaurantBody: results.data,
      restaurantName: results.data.name,
    });

  }
/// use api to search cityID using the keyed in value for the city, 
/// then search for the restraunts using the cityID
  handleCitySearchCriteria = async (searchValue, isRandom) => {
    let restaurantResults = [];
    let cityID = '';
    let cityName = '';
    if (searchValue === 'viewFavorites') {
      restaurantResults = this.state.favoriteRestaurants;
      cityID = 1;
      cityName = 'My Favorites';
      isRandom = false
    } else {
      if (searchValue !== '') {
        const results = await getCityID(searchValue);
        const restaurantResultsOutput = await getRestaurantsByCityID(results.data.location_suggestions[0].id);
        restaurantResults = restaurantResultsOutput.data.restaurants;
        cityID = results.data.location_suggestions[0].id;
        cityName = results.data.location_suggestions[0].name;
      }
    }

    this.setState({
      cityID: cityID,
      cityName: cityName,
      restaurantList: restaurantResults,
      currentCity: '',
      cuisineResultList: {},
      isRandom: isRandom,
    });
  }

  handleCategoryResultList = async (event) => {

    let tempObjectCategoryResultsValue = this.state.categoryResultValue;
    let tempObjectCuisineResultsList = this.clone(this.state.cuisineResultList);

    let restaurantResults = [];
    if (event.target.value === '0') {
      tempObjectCategoryResultsValue = '';
    }
    else {
      tempObjectCategoryResultsValue = event.target.value;
    }

    if (Object.keys(tempObjectCuisineResultsList) === {}) {
      let categoryKeyList = tempObjectCategoryResultsValue;

      const restaurantResultsOutput = await getRestaurantsByCityIDAndCategories(this.state.cityID, categoryKeyList);
      restaurantResults = restaurantResultsOutput.data.restaurants;
    }
    else if (Object.keys(tempObjectCuisineResultsList) !== {}) {
      let cuisineKeyList = Object.keys(tempObjectCuisineResultsList).join();

      let categoryKeyList = tempObjectCategoryResultsValue;

      const restaurantResultsOutput = await getRestaurantsByCityIDAndCategoriesAndCuisines(this.state.cityID, categoryKeyList, cuisineKeyList);
      restaurantResults = restaurantResultsOutput.data.restaurants;
    }
    this.setState({
      categoryResultValue: tempObjectCategoryResultsValue,
      restaurantList: restaurantResults,
    });
  }

  clone = (obj) => {
    if (null == obj || "object" != typeof obj) return obj;
    var copy = obj.constructor();
    for (var attr in obj) {
      if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
    }
    return copy;
  }

  handleCuisineResultList = async (event) => {

    let tempObjectCuisineResultsList = this.clone(this.state.cuisineResultList);
    let tempObjectCategoryResultsValue = this.state.categoryResultValue;

    let restaurantResults = [];
    if (tempObjectCuisineResultsList[event.target.value] === true) {
      delete tempObjectCuisineResultsList[event.target.value];
    }
    else {
      tempObjectCuisineResultsList[event.target.value] = true;
    }

    if ((Object.keys(tempObjectCuisineResultsList) !== {}) && (Object.keys(tempObjectCategoryResultsValue) === '')) {
      let cuisineKeyList = Object.keys(tempObjectCuisineResultsList).join();

      const restaurantResultsOutput = await getRestaurantsByCityIDAndCuisines(this.state.cityID, cuisineKeyList);
      restaurantResults = restaurantResultsOutput.data.restaurants;
    }
    else if ((Object.keys(tempObjectCuisineResultsList) !== {}) && (tempObjectCategoryResultsValue !== '')) {
      let cuisineKeyList = Object.keys(tempObjectCuisineResultsList).join();

      let categoryKeyList = tempObjectCategoryResultsValue;

      const restaurantResultsOutput = await getRestaurantsByCityIDAndCategoriesAndCuisines(this.state.cityID, categoryKeyList, cuisineKeyList);
      restaurantResults = restaurantResultsOutput.data.restaurants;
    }

    this.setState({
      cuisineResultList: tempObjectCuisineResultsList,
      restaurantList: restaurantResults,
    });
  }

// close out of the restaurant detail page and return back to the restaurant list
  closeRestaurantDetail = (event) => {
    this.setState({
      restaurantBody: null,
    });
  }

  componentDidMount() {

    //this is where we grab the users locations if permission is given 
    let currentComponent = this;

    navigator.geolocation.getCurrentPosition(function (position) {
      //users longitute and latitude coordinates 
      let userLat = position.coords.latitude
      let userLong = position.coords.longitude
      //api uses these cooridnates to retrieve city name
      getGeoCodeByLatLong(userLat, userLong)
        .then((response) => {
          const userLocation = response.data.location.city_id;
          const userCity = response.data.location.city_name
          currentComponent.setState({
            cityID: userLocation,
            currentCity: userCity,
          });
        })
        .catch((error) => {
          console.log('API ERROR:', error);
        });
    });
  }

  // determine if the restaurant is in the array of current Favorites so the favorites button can be toggled "on" if it is
  searchForFave(restaurantBody) {
    var isFave = false;
    if (!restaurantBody.hasOwnProperty('cuisines')) {
      let newRestaurant = restaurantBody.restaurant
      restaurantBody = newRestaurant
    }
    for (var i = 0; i < this.state.favoriteRestaurants.length; i++) {
      if (this.state.favoriteRestaurants[i].restaurant.id === restaurantBody.id) {
        isFave = true;
        break;
      }
    }

    return isFave
  }

  render() {
    let restaurantComponent = '';
    if (this.state.cityID !== '') {
      if (this.state.isRandom) {
        const randRest = this.randRestaurant(this.state.restaurantList)
        restaurantComponent = <RestaurantDetail restaurant={randRest}
          cityID={this.state.cityID}
          cityName={this.state.cityName}
          favoriteRestaurants={this.state.favoriteRestaurants}
          onFaveToggle={() => this.handleFaveToggle(randRest)}
        />
      } else {
        restaurantComponent = <RestaurantList restaurantList={this.state.restaurantList}
          cityID={this.state.cityID}
          cityName={this.state.cityName}
          favoriteRestaurants={this.state.favoriteRestaurants}
          handleRestaurantSearch={this.handleRestaurantSearch}
          onFaveToggle={this.handleFaveToggle}
        />
      }

      if (this.state.restaurantBody != null) {
        restaurantComponent = <h3></h3>
      }

    }
    else {
      restaurantComponent = <h3 className="city-header">Search a City to View Restaurants!</h3>
    }

    let cuisine = '';
    let category = '';

    if (this.state.cityID !== '') {
      cuisine = <Cuisine cityID={this.state.cityID} handleCuisineResultList={this.handleCuisineResultList} />
    }
    else {
      cuisine = <h3></h3>;
    }

    if (this.state.cityID !== '') {
      category = <Category cityID={this.state.cityID}
        handleCategoryResultList={this.handleCategoryResultList}
        handleCategorySearch={this.handleCategorySearch} />
    }
    else {
      category = <h3></h3>;
    }

    return (
      <>
        <div class="header">
          <h1 className='site-header'>Easy Pickin's</h1>
          <h3 className="subheader">Picking a restaurant, just got easy</h3>
          <Search handleCitySearchCriteria={this.handleCitySearchCriteria}
            handleCategorySearch={this.handleCategorySearch}
            categoryList={this.state.categoryList}
            handleCategoryResultList={this.handleCategoryResultList}
            currentCity={this.state.currentCity} />
          {category}
          {cuisine}
          {(this.state.cityName !== '') ? <h2 className="city-header">Viewing restaurants around {this.state.cityName}</h2> : <h2></h2>}
        </div>
        <a class="waves-effect waves-light btn-large" id="viewFavorites" onClick={this.viewMyFavorites}>View My Favorites</a>

        {(this.state.cityName !== '') ? <h2 className="city-header">Viewing restaurants in {this.state.cityName}</h2> : <h2></h2>}

        {(this.state.restaurantBody != null) ? <RestaurantDetail key={this.state.restaurantID}
          name={this.state.restaurantName}
          restaurant={this.state.restaurantBody}
          closeRestaurantDetail={this.closeRestaurantDetail}
          favoriteRestaurants={this.state.favoriteRestaurants}
          onFaveToggle={() => this.handleFaveToggle(this.state.restaurantBody)}
          isFave={this.searchForFave(this.state.restaurantBody)}
          handleRestaurantSearch={this.handleRestaurantSearch}
        />
          : <h3></h3>}
        {restaurantComponent}
      </>
    );
  }
}


export default App;