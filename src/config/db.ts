import mongoose from "mongoose";

export const connectDB = async (): Promise<void> => {

    try{
        await mongoose.connect(process.env.MONGO_URI as string);
        console.log("Database connected");
    }catch(error){
        console.error(error);
        process.exit(1);
    }

}

//export default connectDB;

export const disconnectDB = async (): Promise<void> => {
    await mongoose.disconnect();
};

/** Construye los índices de todos los modelos. Córrelo en el seed, no en cada arranque. */
export const syncAllIndexes = async (): Promise<void> => {
    const names = mongoose.modelNames();
    await Promise.all(names.map((n) => mongoose.model(n).syncIndexes()));
    console.log("[db] índices sincronizados:", names.join(", "));
};