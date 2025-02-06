import mongoose from "mongoose";

const HotelSchema = new mongoose.Schema({
  name: { type: String},
  address: { type: String},
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
  description: { type: String },
  timings: { type: String },
  entryFee: { type: String },
});

const ItineraryDaySchema = new mongoose.Schema({
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

const CostSchema = new mongoose.Schema({
  hotel: { type: String },
  food: { type: String },
  transport: { type: String },
  attractions: { type: String },
  totalCost: { type: String },
})



const ChatSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  locationImg: { url: { type: String } },
  tripDetails: TripDetailsSchema,
  hotelOptions: [HotelSchema],
  itinerary: [ItineraryDaySchema],
  authenticDishes: [DishSchema],
  totalCost: CostSchema,
  createdAt: {
    type: Date,
    default: Date.now(),
  },
});


const Chats = (mongoose.models.Chats)|| mongoose.model("Chats", ChatSchema);
export default Chats;