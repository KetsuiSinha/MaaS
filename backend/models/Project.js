import mongoose from "mongoose"

const endpointSchema = new mongoose.Schema({
  method: { type: String, required: true },
  path: { type: String, required: true },
  response: { type: Object, required: true },
  statusCode: { type: Number, default: 200 },
  delay: { type: Number, default: 0 }
})

const projectSchema = new mongoose.Schema({
  name: String,
  endpoints: [endpointSchema]
})

export default mongoose.model("Project", projectSchema)
