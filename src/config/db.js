import mongoose from "mongoose"

/**
 * Connect to MongoDB database
 */
export const connectDB = async () => {
  try {
    const conn = await mongoose.connect('mongodb+srv://shokhrukh:2wkO7GydrXAHaZYm@cluster0.8zzlwps.mongodb.net/groups')
    console.log(`✅ MongoDB Connected`)
  } catch (error) {
    console.error(`❌ Error: ${error.message}`)
    process.exit(1)
  }
}
