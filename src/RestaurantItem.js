import React from 'react';

export default function RestaurantItem (props) {
        return (
            <div>
                <li>
                    <div>{props.restaurant.name}</div>
                    <div>{props.restaurant.user_rating.aggregate_rating}</div>
                    <div>{props.restaurant.user_rating.rating_text}</div>
                </li>
                <br></br>
            </div>
        );
}