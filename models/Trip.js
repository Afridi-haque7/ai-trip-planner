import mongoose from "mongoose";

const HotelSchema = new mongoose.Schema({
  name: { type: String},
  address: { type: String },
  price: { type: String },
  imageUrl: { type: String },
  geoCoordinates: {
    latitude: { type: Number },
    longitude: { type: Number },
  },
  rating: { type: Number },
  description: { type: String },
});

const ActivitySchema = new mongoose.Schema({
  name: { type: String },
  imageUrl: { type: String },
  location: { type: String },
  details: { type: String },
  timings: { type: String },
  entryFee: { type: String },
});

const ItineraryDaySchema = new mongoose.Schema({
  theme: { type: String },
  activities: [ActivitySchema],
});

const DishSchema = new mongoose.Schema({
  name: { type: String },
  imageUrl: { type: String },
  description: { type: String },
});

const TripDetailsSchema = new mongoose.Schema({
  location: { type: String},
  duration: { type: String },
  budget: { type: String },
  travelers: { type: Number },
});



const ChatSchema = new mongoose.Schema({
  location: {
    type: String,
    required: true,
    default: "",
  },
  days: {
    type: Number,
    required: true,
    default: 0,
  },
  members: {
    type: Number,
    required: true,
    default: 0,
  },
  budget: {
    type: String,
    required: true,
    default: "",
  },
  tripDetails: TripDetailsSchema,
  hotelOptions: [HotelSchema],
  itinerary: [ItineraryDaySchema],
  authenticDishes: [DishSchema],
  createdAt: {
    type: Date,
    default: Date.now(),
  },
});


const Chats = (mongoose.models.Chats)|| mongoose.model("Chats", ChatSchema);
export default Chats;