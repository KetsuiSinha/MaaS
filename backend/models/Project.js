const projectSchema = new mongoose.Schema({
  name: String,
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  endpoints: [endpointSchema],
})
