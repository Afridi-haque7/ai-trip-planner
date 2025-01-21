'use client';
import React, {useState} from 'react'

function TripResult({data}) {
    // const resultData = JSON.stringify(data);
    const { tripDetails, hotelOptions, itinerary, authenticDishes } =
      data || {};
  return (
    <div className="flex flex-col gap-4 mx-auto">
      <div className="text-lg font-semibold">Trip Results with AI</div>
      {/* trip details */}
      <div>
        <h2 className="text-md font-semibold">Details of you Trip:</h2>
        <div>
          <p>
            <span>Location:</span> {tripDetails?.location || 'NA'}
          </p>
          <p>
            <span>Duration:</span> {tripDetails?.duration || 'N/A'}
          </p>
          <p>
            <span>Budget:</span> {tripDetails?.budget || 'N/A'}
          </p>
          <p>
            <span>Travelers:</span> {tripDetails?.travelers || 'N/A'}
          </p>
        </div>
      </div>
      {/* hotel details */}
      <div>
        {
            hotelOptions && hotelOptions.map((index, item) => {
                <div key={index}>
                    
                </div>
            }) 
        }
      </div>
    </div>
  );
}

export default TripResult